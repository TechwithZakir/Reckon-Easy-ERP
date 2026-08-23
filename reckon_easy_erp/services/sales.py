from typing import Any

import frappe
from frappe import _
from frappe.utils import flt, nowdate

from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry
from erpnext.accounts.doctype.sales_invoice.sales_invoice import make_sales_return

from reckon_easy_erp.services.common import clean_text, require_permission, user_context
from reckon_easy_erp.services.items import search_items


def get_sales_context() -> dict[str, Any]:
	require_permission("Sales Invoice", "create")
	context = user_context()
	settings = frappe.get_cached_doc("Easy ERP Settings")
	payment_modes = frappe.get_list(
		"Easy ERP Payment Mode Mapping",
		filters={"company": context["company"], "enabled": 1},
		fields=["name", "display_name", "payment_kind", "mode_of_payment"],
		order_by="display_name asc",
		limit_page_length=50,
	)
	return {
		"company": context["company"],
		"warehouse": context["warehouse"],
		"walk_in_customer": settings.walk_in_customer,
		"selling_price_list": settings.default_selling_price_list,
		"posting_date": nowdate(),
		"payment_modes": [dict(row) for row in payment_modes],
		"maximum_discount_percentage": flt(context["maximum_discount_percentage"]),
		"can_submit": context["can_submit"],
	}


def search_sale_items(query: str = "") -> list[dict[str, Any]]:
	require_permission("Sales Invoice", "create")
	settings = frappe.get_cached_doc("Easy ERP Settings")
	rows = search_items(query, 20)
	for row in rows:
		rate = 0
		if settings.default_selling_price_list:
			rate = frappe.db.get_value(
				"Item Price",
				{"item_code": row["item_code"], "price_list": settings.default_selling_price_list, "selling": 1},
				"price_list_rate",
			) or 0
		row["rate"] = flt(rate)
	return rows


def create_sale(values: dict[str, Any]) -> dict[str, Any]:
	require_permission("Sales Invoice", "create")
	request_id = _request_id(values.get("request_id"))
	existing = _existing_result("Sales Invoice", request_id)
	if existing:
		payment = frappe.get_list(
			"Payment Entry",
			filters={"easy_erp_request_id": f"{request_id}:payment"},
			pluck="name",
			limit_page_length=1,
		)
		return _sale_result(existing, payment[0] if payment else None)
	context = user_context()
	should_submit = bool(values.get("submit", True))
	if should_submit:
		require_permission("Sales Invoice", "submit")
		if not context["can_submit"]:
			frappe.throw(_("Your Easy ERP access does not allow submission."), frappe.PermissionError)
	customer = clean_text(values.get("customer"), 140)
	if not customer or not frappe.db.exists("Customer", customer):
		frappe.throw(_("Select a valid customer."))
	if not frappe.has_permission("Customer", ptype="read", doc=customer):
		frappe.throw(_("You do not have permission to use this customer."), frappe.PermissionError)
	items = values.get("items") or []
	if not isinstance(items, list) or not items:
		frappe.throw(_("Add at least one item."))
	warehouse = clean_text(values.get("warehouse"), 140) or context["warehouse"]
	if not warehouse:
		frappe.throw(_("Configure a default warehouse before making a sale."))
	_validate_sales_warehouse(warehouse, context["company"])
	doc = frappe.new_doc("Sales Invoice")
	doc.company = context["company"]
	doc.customer = customer
	doc.posting_date = values.get("posting_date") or nowdate()
	doc.update_stock = 1
	doc.set_warehouse = warehouse
	doc.selling_price_list = values.get("selling_price_list") or frappe.get_cached_doc(
		"Easy ERP Settings"
	).default_selling_price_list
	doc.easy_erp_request_id = request_id
	for row in items:
		_append_sale_item(doc, row, warehouse, context)
	doc.check_permission("create")
	doc.insert()
	if should_submit:
		doc.check_permission("submit")
		doc.submit()
	paid_amount = flt(values.get("paid_amount"))
	if paid_amount < 0 or paid_amount > flt(doc.grand_total):
		frappe.throw(_("Paid amount must be between zero and the invoice total."))
	if paid_amount and doc.docstatus != 1:
		frappe.throw(_("Submit the sale before recording payment."))
	payment_name = None
	if paid_amount:
		payment = _payment_for_invoice(doc, paid_amount, values, f"{request_id}:payment")
		payment_name = payment.name
		doc.reload()
	return _sale_result(doc, payment_name)


def get_customer_outstanding(customer: str) -> dict[str, Any]:
	require_permission("Sales Invoice", "read")
	if not frappe.has_permission("Customer", ptype="read", doc=customer):
		frappe.throw(_("You do not have permission to view this customer."), frappe.PermissionError)
	context = user_context()
	rows = frappe.get_list(
		"Sales Invoice",
		filters={
			"company": context["company"],
			"customer": customer,
			"docstatus": 1,
			"outstanding_amount": [">", 0],
		},
		fields=["name", "posting_date", "due_date", "grand_total", "outstanding_amount", "currency"],
		order_by="due_date asc, posting_date asc",
		limit_page_length=100,
	)
	return {
		"customer": customer,
		"total_outstanding": sum(flt(row.outstanding_amount) for row in rows),
		"invoices": [dict(row) for row in rows],
	}


def create_collection(values: dict[str, Any]) -> dict[str, Any]:
	require_permission("Payment Entry", "create")
	require_permission("Payment Entry", "submit")
	context = user_context()
	if not context["can_submit"]:
		frappe.throw(_("Your Easy ERP access does not allow submission."), frappe.PermissionError)
	request_id = _request_id(values.get("request_id"))
	existing = _existing_result("Payment Entry", request_id)
	if existing:
		return {"payment_entry": existing.name, "amount": existing.paid_amount, "status": existing.docstatus}
	customer = clean_text(values.get("customer"), 140)
	amount = flt(values.get("received_amount"))
	if amount <= 0:
		frappe.throw(_("Received amount must be greater than zero."))
	outstanding = get_customer_outstanding(customer)
	requested = values.get("invoices") or [row["name"] for row in outstanding["invoices"]]
	rows_by_name = {row["name"]: row for row in outstanding["invoices"]}
	selected = [rows_by_name[name] for name in requested if name in rows_by_name]
	if not selected:
		frappe.throw(_("Select at least one unpaid invoice."))
	if amount > sum(flt(row["outstanding_amount"]) for row in selected):
		frappe.throw(_("Received amount cannot exceed the selected outstanding amount."))
	pe = get_payment_entry("Sales Invoice", selected[0]["name"], party_amount=amount)
	pe.references = []
	remaining = amount
	for row in selected:
		allocated = min(remaining, flt(row["outstanding_amount"]))
		if allocated <= 0:
			break
		pe.append(
			"references",
			{
				"reference_doctype": "Sales Invoice",
				"reference_name": row["name"],
				"total_amount": row["grand_total"],
				"outstanding_amount": row["outstanding_amount"],
				"allocated_amount": allocated,
			},
		)
		remaining -= allocated
	pe.paid_amount = amount
	pe.received_amount = amount
	pe.easy_erp_request_id = request_id
	_apply_payment_mode(pe, values, context["company"], request_id)
	pe.check_permission("create")
	pe.insert()
	pe.check_permission("submit")
	pe.submit()
	return {"payment_entry": pe.name, "amount": pe.paid_amount, "status": pe.docstatus}


def create_sales_return(values: dict[str, Any]) -> dict[str, Any]:
	require_permission("Sales Invoice", "create")
	require_permission("Sales Invoice", "submit")
	context = user_context()
	if not context["can_submit"]:
		frappe.throw(_("Your Easy ERP access does not allow submission."), frappe.PermissionError)
	request_id = _request_id(values.get("request_id"))
	existing = _existing_result("Sales Invoice", request_id)
	if existing:
		return _sale_result(existing)
	invoice_name = clean_text(values.get("sales_invoice"), 140)
	original = frappe.get_doc("Sales Invoice", invoice_name)
	original.check_permission("read")
	if original.docstatus != 1 or original.is_return:
		frappe.throw(_("Select a submitted sales invoice that is not already a return."))
	return_doc = make_sales_return(original.name)
	return_doc.easy_erp_request_id = request_id
	return_doc.posting_date = values.get("posting_date") or nowdate()
	requested_items = values.get("items") or []
	if requested_items:
		requested = {row["item_code"]: flt(row["qty"]) for row in requested_items}
		kept = []
		for row in return_doc.items:
			qty = requested.get(row.item_code)
			if qty:
				if qty > abs(flt(row.qty)):
					frappe.throw(_("Return quantity for {0} exceeds the invoiced quantity.").format(row.item_code))
				row.qty = -abs(qty)
				kept.append(row)
		return_doc.items = kept
		if not kept:
			frappe.throw(_("Add at least one item to return."))
	return_doc.check_permission("create")
	return_doc.insert()
	return_doc.check_permission("submit")
	return_doc.submit()
	return _sale_result(return_doc)


def _append_sale_item(doc, row: dict[str, Any], warehouse: str, context: dict[str, Any]) -> None:
	item_code = clean_text(row.get("item_code"), 140)
	if not item_code or not frappe.has_permission("Item", ptype="read", doc=item_code):
		frappe.throw(_("You do not have permission to use item {0}.").format(item_code), frappe.PermissionError)
	qty = flt(row.get("qty"))
	rate = flt(row.get("rate"))
	discount = flt(row.get("discount_percentage"))
	if qty <= 0 or rate < 0:
		frappe.throw(_("Item quantity must be positive and rate cannot be negative."))
	if discount < 0 or discount > flt(context["maximum_discount_percentage"]):
		frappe.throw(_("Discount exceeds your maximum allowed percentage."), frappe.PermissionError)
	doc.append(
		"items",
		{
			"item_code": item_code,
			"qty": qty,
			"uom": row.get("uom"),
			"rate": rate,
			"discount_percentage": discount,
			"warehouse": warehouse,
		},
	)


def _payment_for_invoice(invoice, amount: float, values: dict[str, Any], request_id: str):
	require_permission("Payment Entry", "create")
	require_permission("Payment Entry", "submit")
	existing = _existing_result("Payment Entry", request_id)
	if existing:
		return existing
	pe = get_payment_entry("Sales Invoice", invoice.name, party_amount=amount)
	pe.easy_erp_request_id = request_id
	_apply_payment_mode(pe, values, invoice.company, request_id)
	pe.check_permission("create")
	pe.insert()
	pe.check_permission("submit")
	pe.submit()
	return pe


def _apply_payment_mode(pe, values: dict[str, Any], company: str, request_id: str) -> None:
	mapping_name = clean_text(values.get("payment_mode"), 140)
	if not mapping_name:
		frappe.throw(_("Select a payment method."))
	if not frappe.db.exists("Easy ERP Payment Mode Mapping", mapping_name):
		matching = frappe.get_list(
			"Easy ERP Payment Mode Mapping",
			filters={"company": company, "display_name": mapping_name, "enabled": 1},
			pluck="name",
			limit_page_length=1,
		)
		if not matching:
			frappe.throw(_("The selected payment method is not configured."))
		mapping_name = matching[0]
	mapping = frappe.get_doc("Easy ERP Payment Mode Mapping", mapping_name)
	mapping.check_permission("read")
	if not mapping.enabled or mapping.company != company:
		frappe.throw(_("The selected payment method is not available for this company."))
	pe.mode_of_payment = mapping.mode_of_payment
	pe.paid_to = mapping.account
	pe.paid_to_account_currency = frappe.get_cached_value("Account", mapping.account, "account_currency")
	if pe.paid_from_account_currency and pe.paid_to_account_currency != pe.paid_from_account_currency:
		frappe.throw(_("The payment account currency must match the customer account currency."))
	pe.reference_no = clean_text(values.get("payment_reference"), 140) or request_id[:140]
	pe.reference_date = values.get("posting_date") or nowdate()


def _request_id(value: Any) -> str:
	request_id = clean_text(value, 100)
	if len(request_id) < 8:
		frappe.throw(_("A valid request ID is required. Refresh the page and try again."))
	return request_id


def _validate_sales_warehouse(warehouse: str, company: str) -> None:
	if not frappe.has_permission("Warehouse", ptype="read", doc=warehouse):
		frappe.throw(_("You do not have permission to use this warehouse."), frappe.PermissionError)
	values = frappe.db.get_value("Warehouse", warehouse, ["company", "is_group"])
	if not values or values[0] != company or values[1]:
		frappe.throw(_("Select a non-group warehouse belonging to your company."))


def _existing_result(doctype: str, request_id: str):
	require_permission(doctype, "read")
	name = frappe.get_list(
		doctype,
		filters={"easy_erp_request_id": request_id},
		pluck="name",
		limit_page_length=1,
	)
	if not name:
		return None
	doc = frappe.get_doc(doctype, name[0])
	doc.check_permission("read")
	return doc


def _sale_result(doc, payment_entry: str | None = None) -> dict[str, Any]:
	return {
		"sales_invoice": doc.name,
		"payment_entry": payment_entry,
		"grand_total": doc.grand_total,
		"outstanding_amount": doc.outstanding_amount,
		"status": doc.docstatus,
		"is_return": bool(doc.is_return),
	}
