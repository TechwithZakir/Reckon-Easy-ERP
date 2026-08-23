import frappe

from reckon_easy_erp.constants import EASY_ERP_ADMIN_ROLES, EASY_ERP_ROLES


def can_open_easy_erp() -> bool:
	if frappe.session.user == "Guest":
		return False
	roles = set(frappe.get_roles())
	return bool(roles.intersection(EASY_ERP_ROLES) or "System Manager" in roles)


def is_easy_erp_administrator(user: str | None = None) -> bool:
	return bool(set(frappe.get_roles(user)).intersection(EASY_ERP_ADMIN_ROLES))


def user_access_query(user: str | None = None) -> str:
	user = user or frappe.session.user
	if is_easy_erp_administrator(user):
		return ""
	return f"`tabEasy ERP User Access`.`user` = {frappe.db.escape(user)}"


def user_access_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool:
	user = user or frappe.session.user
	if is_easy_erp_administrator(user):
		return True
	return permission_type == "read" and doc.user == user


def require_easy_erp_user() -> None:
	if not can_open_easy_erp():
		frappe.throw(frappe._("You do not have permission to use Reckon Easy ERP."), frappe.PermissionError)


def require_easy_erp_administrator() -> None:
	if not is_easy_erp_administrator():
		frappe.throw(frappe._("Only an Easy ERP Administrator can do this."), frappe.PermissionError)
