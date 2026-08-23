from typing import Any

import frappe
from frappe import _

from reckon_easy_erp.permissions import is_easy_erp_administrator, require_easy_erp_user


def require_permission(doctype: str, ptype: str) -> None:
	require_easy_erp_user()
	if not frappe.has_permission(doctype, ptype=ptype):
		frappe.throw(_("You do not have permission to {0} {1}.").format(_(ptype), _(doctype)), frappe.PermissionError)


def clean_text(value: Any, maximum: int = 140) -> str:
	return " ".join(str(value or "").strip().split())[:maximum]


def user_context() -> dict[str, Any]:
	name = frappe.session.user
	if not frappe.db.exists("Easy ERP User Access", name):
		if is_easy_erp_administrator(name):
			settings = frappe.get_cached_doc("Easy ERP Settings")
			if not settings.default_company:
				frappe.throw(_("Complete Easy ERP setup before creating transactions."))
			branch_defaults = frappe.get_list(
				"Easy ERP Branch Settings",
				filters={"company": settings.default_company},
				fields=["branch", "default_warehouse", "default_cash_account"],
				limit_page_length=1,
			)
			defaults = branch_defaults[0] if branch_defaults else {}
			return {
				"company": settings.default_company,
				"branch": defaults.get("branch"),
				"warehouse": defaults.get("default_warehouse"),
				"account": defaults.get("default_cash_account"),
				"can_submit": True,
			}
		frappe.throw(_("Ask an administrator to configure your Easy ERP access."), frappe.PermissionError)
	doc = frappe.get_doc("Easy ERP User Access", name)
	doc.check_permission("read")
	if not doc.enabled:
		frappe.throw(_("Your Easy ERP access is disabled."), frappe.PermissionError)
	return {
		"company": doc.company,
		"branch": doc.branch,
		"warehouse": doc.default_warehouse,
		"account": doc.default_account,
		"can_submit": bool(doc.can_submit),
	}
