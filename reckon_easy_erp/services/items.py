from typing import Any

import frappe
from frappe import _
from frappe.utils import flt, nowdate

from reckon_easy_erp.services.common import clean_text, require_permission, user_context


def search_items(query: str = "", limit: int = 20) -> list[dict[str, Any]]:
	require_permission("Item", "read")
	query = clean_text(query, 100)
	limit = min(max(int(limit or 20), 1), 50)
	barcode_items: list[str] = []
	if query:
		barcode_items = frappe.get_list(
			"Item Barcode", filters={"barcode": query}, pluck="parent", limit_page_length=limit
		)
	or_filters = None
	if query:
		or_filters = [
			["Item", "item_code", "like", f"%{query}%"],
			["Item", "item_name", "like", f"%{query}%"],
			["Item", "easy_erp_bangla_name", "like", f"%{query}%"],
		]
		if barcode_items:
			or_filters.append(["Item", "name", "in", barcode_items])
	rows = frappe.get_list(
		"Item",
		filters={"disabled": 0},
		or_filters=or_filters,
		fields=["name", "item_code", "item_name", "easy_erp_bangla_name", "stock_uom", "item_group"],
		order_by="item_name asc",
		limit_page_length=limit,
	)
	return [dict(row) for row in rows]


def create_item(values: dict[str, Any]) -> dict[str, Any]:
	require_permission("Item", "create")
	item_code = clean_text(values.get("item_code"), 140)
	item_name = clean_text(values.get("item_name"), 140)
	item_group = clean_text(values.get("item_group"), 140)
	stock_uom = clean_text(values.get("stock_uom"), 140)
	if not all((item_code, item_name, item_group, stock_uom)):
		frappe.throw(_("Item code, name, group, and unit are required."))
	if frappe.db.exists("Item", item_code):
		frappe.throw(_("Item {0} already exists.").format(item_code))
	barcode = clean_text(values.get("barcode"), 140)
	if barcode:
		duplicate_barcode = frappe.get_list(
			"Item Barcode", filters={"barcode": barcode}, pluck="parent", limit_page_length=1
		)
		if duplicate_barcode:
			frappe.throw(_("Barcode {0} is already used by {1}.").format(barcode, duplicate_barcode[0]))

	doc = frappe.new_doc("Item")
	doc.update(
		{
			"item_code": item_code,
			"item_name": item_name,
			"easy_erp_bangla_name": clean_text(values.get("bangla_name"), 140),
			"item_group": item_group,
			"stock_uom": stock_uom,
			"is_stock_item": 1,
			"has_batch_no": int(bool(values.get("has_batch_no"))),
			"has_expiry_date": int(bool(values.get("has_expiry_date"))),
		}
	)
	if doc.has_expiry_date and not doc.has_batch_no:
		frappe.throw(_("Enable batch tracking before enabling expiry dates."))
	if barcode:
		doc.append("barcodes", {"barcode": barcode, "uom": stock_uom})
	context = user_context()
	warehouse = clean_text(values.get("default_warehouse"), 140) or context["warehouse"]
	if warehouse:
		_validate_warehouse(warehouse, context["company"])
		doc.append("item_defaults", {"company": context["company"], "default_warehouse": warehouse})
	doc.check_permission("create")
	doc.insert()

	_create_price(doc.name, values.get("selling_price_list"), values.get("selling_rate"), stock_uom)
	_create_price(doc.name, values.get("buying_price_list"), values.get("buying_rate"), stock_uom)
	opening_qty = flt(values.get("opening_quantity"))
	if opening_qty:
		create_opening_stock(doc.name, warehouse, opening_qty, flt(values.get("valuation_rate")))
	return {"name": doc.name, "item_code": doc.item_code, "item_name": doc.item_name}


def create_opening_stock(item_code: str, warehouse: str, quantity: float, valuation_rate: float) -> str:
	require_permission("Stock Reconciliation", "create")
	require_permission("Stock Reconciliation", "submit")
	context = user_context()
	if not context["can_submit"]:
		frappe.throw(_("Your Easy ERP access does not allow submission."), frappe.PermissionError)
	if quantity <= 0 or valuation_rate < 0:
		frappe.throw(_("Opening quantity must be positive and valuation rate cannot be negative."))
	_validate_warehouse(warehouse, context["company"])
	doc = frappe.new_doc("Stock Reconciliation")
	doc.company = context["company"]
	doc.purpose = "Opening Stock"
	doc.posting_date = nowdate()
	doc.append(
		"items",
		{"item_code": item_code, "warehouse": warehouse, "qty": quantity, "valuation_rate": valuation_rate},
	)
	doc.check_permission("create")
	doc.insert()
	doc.check_permission("submit")
	doc.submit()
	return doc.name


def _create_price(item_code: str, price_list: str | None, rate: Any, uom: str) -> None:
	if not price_list or flt(rate) <= 0:
		return
	require_permission("Item Price", "create")
	doc = frappe.new_doc("Item Price")
	doc.item_code = item_code
	doc.price_list = price_list
	doc.price_list_rate = flt(rate)
	doc.uom = uom
	doc.check_permission("create")
	doc.insert()


def _validate_warehouse(warehouse: str, company: str) -> None:
	if not warehouse:
		frappe.throw(_("A warehouse is required for opening stock."))
	if not frappe.has_permission("Warehouse", ptype="read", doc=warehouse):
		frappe.throw(_("You do not have permission to use warehouse {0}.").format(warehouse), frappe.PermissionError)
	warehouse_values = frappe.db.get_value("Warehouse", warehouse, ["company", "is_group"])
	if not warehouse_values:
		frappe.throw(_("Warehouse {0} does not exist.").format(warehouse))
	warehouse_company, is_group = warehouse_values
	if warehouse_company != company or is_group:
		frappe.throw(_("Select a non-group warehouse belonging to your company."))
