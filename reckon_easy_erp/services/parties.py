from typing import Any

import frappe
from frappe import _

from reckon_easy_erp.reckon_easy_erp.doctype.easy_erp_settings.easy_erp_settings import (
	BD_MOBILE_PATTERN,
	normalize_bd_mobile,
)
from reckon_easy_erp.services.common import clean_text, require_permission


PARTY_CONFIG = {
	"Customer": {"name_field": "customer_name", "group_field": "customer_group", "type_field": "customer_type"},
	"Supplier": {"name_field": "supplier_name", "group_field": "supplier_group", "type_field": "supplier_type"},
}


def _config(doctype: str) -> dict[str, str]:
	if doctype not in PARTY_CONFIG:
		frappe.throw(_("Unsupported party type."))
	return PARTY_CONFIG[doctype]


def search_parties(doctype: str, query: str = "", limit: int = 20) -> list[dict[str, Any]]:
	require_permission(doctype, "read")
	config = _config(doctype)
	query = clean_text(query, 80)
	limit = min(max(int(limit or 20), 1), 50)
	fields = ["name", config["name_field"], config["group_field"], "disabled"]
	meta = frappe.get_meta(doctype)
	if meta.has_field("mobile_no"):
		fields.append("mobile_no")
	filters = {"disabled": 0}
	or_filters = None
	if query:
		mobile_query = normalize_bd_mobile(query)
		or_filters = [
			[doctype, "name", "like", f"%{query}%"],
			[doctype, config["name_field"], "like", f"%{query}%"],
		]
		if meta.has_field("mobile_no"):
			or_filters.append([doctype, "mobile_no", "like", f"%{mobile_query}%"])
	rows = frappe.get_list(
		doctype,
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		order_by=f"{config['name_field']} asc",
		limit_page_length=limit,
	)
	return [
		{
			"name": row.name,
			"display_name": row.get(config["name_field"]),
			"group": row.get(config["group_field"]),
			"mobile_no": row.get("mobile_no"),
		}
		for row in rows
	]


def create_party(doctype: str, values: dict[str, Any]) -> dict[str, Any]:
	require_permission(doctype, "create")
	config = _config(doctype)
	party_name = clean_text(values.get("party_name"), 140)
	group = clean_text(values.get("group"), 140)
	party_type = clean_text(values.get("party_type"), 40) or "Company"
	if not party_name or not group:
		frappe.throw(_("Name and group are required."))
	mobile = normalize_bd_mobile(values.get("mobile_no"))
	if mobile and not BD_MOBILE_PATTERN.fullmatch(mobile):
		frappe.throw(_("Enter a valid Bangladeshi mobile number."))

	duplicate_filters = {config["name_field"]: party_name, "disabled": 0}
	duplicate = frappe.get_list(doctype, filters=duplicate_filters, pluck="name", limit_page_length=1)
	if duplicate:
		frappe.throw(_("A {0} named {1} already exists.").format(_(doctype.lower()), party_name))
	if mobile and frappe.get_meta(doctype).has_field("mobile_no"):
		duplicate = frappe.get_list(doctype, filters={"mobile_no": mobile}, pluck="name", limit_page_length=1)
		if duplicate:
			frappe.throw(_("This mobile number is already used by {0}.").format(duplicate[0]))

	doc = frappe.new_doc(doctype)
	doc.set(config["name_field"], party_name)
	doc.set(config["group_field"], group)
	doc.set(config["type_field"], party_type)
	if doctype == "Customer":
		doc.territory = clean_text(values.get("territory"), 140)
		if not doc.territory:
			frappe.throw(_("Territory is required."))
	if mobile and doc.meta.has_field("mobile_no"):
		doc.mobile_no = mobile
	doc.check_permission("create")
	doc.insert()
	return {"name": doc.name, "display_name": party_name, "mobile_no": mobile}
