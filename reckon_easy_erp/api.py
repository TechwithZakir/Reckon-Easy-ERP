from typing import Any

import frappe
from frappe import _

from reckon_easy_erp.compat import runtime_versions
from reckon_easy_erp.permissions import require_easy_erp_administrator, require_easy_erp_user


@frappe.whitelist()
def get_context() -> dict[str, Any]:
	require_easy_erp_user()
	user = frappe.session.user
	roles = frappe.get_roles(user)
	access = None
	if frappe.db.exists("Easy ERP User Access", user):
		doc = frappe.get_doc("Easy ERP User Access", user)
		doc.check_permission("read")
		access = {
			"company": doc.company,
			"branch": doc.branch,
			"default_warehouse": doc.default_warehouse,
			"default_account": doc.default_account,
			"employee": doc.employee,
			"maximum_discount_percentage": doc.maximum_discount_percentage,
			"can_view_purchase_price": bool(doc.can_view_purchase_price),
			"can_view_cost_and_profit": bool(doc.can_view_cost_and_profit),
			"can_submit": bool(doc.can_submit),
			"can_cancel": bool(doc.can_cancel),
			"can_export": bool(doc.can_export),
			"can_view_reports": bool(doc.can_view_reports),
		}
	settings = frappe.get_cached_doc("Easy ERP Settings")
	return {
		"user": user,
		"full_name": frappe.db.get_value("User", user, "full_name") or user,
		"language": frappe.local.lang,
		"roles": [role for role in roles if role.startswith("Easy ERP")],
		"access": access,
		"features": {
			"sales": bool(settings.enable_sales),
			"purchase": bool(settings.enable_purchase),
			"stock": bool(settings.enable_stock),
			"hr": bool(settings.enable_hr),
			"payroll": bool(settings.enable_payroll),
		},
		"setup_complete": bool(settings.setup_complete),
	}


@frappe.whitelist()
def get_setup_status() -> dict[str, Any]:
	require_easy_erp_administrator()
	settings = frappe.get_doc("Easy ERP Settings")
	settings.check_permission("read")
	return {
		"setup_complete": bool(settings.setup_complete),
		"default_company": settings.default_company,
		"versions": runtime_versions(),
		"checks": {
			"companies": frappe.db.count("Company"),
			"branches": frappe.db.count("Branch"),
			"warehouses": frappe.db.count("Warehouse", {"is_group": 0}),
			"payment_modes": frappe.db.count("Easy ERP Payment Mode Mapping", {"enabled": 1}),
		},
	}


@frappe.whitelist(methods=["POST"])
def complete_setup(default_company: str) -> dict[str, Any]:
	require_easy_erp_administrator()
	if not frappe.db.exists("Company", default_company):
		frappe.throw(_("Select a valid company."))
	settings = frappe.get_doc("Easy ERP Settings")
	settings.check_permission("write")
	settings.default_company = default_company
	settings.setup_complete = 1
	settings.save()
	return {"setup_complete": True, "default_company": default_company}
