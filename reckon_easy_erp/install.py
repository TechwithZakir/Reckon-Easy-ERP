import frappe

from reckon_easy_erp.constants import EASY_ERP_ROLES


def after_install() -> None:
	ensure_roles()
	ensure_role_profiles()
	ensure_settings()


def after_migrate() -> None:
	ensure_roles()
	ensure_role_profiles()


def ensure_roles() -> None:
	for role_name in EASY_ERP_ROLES:
		if not frappe.db.exists("Role", role_name):
			frappe.get_doc({"doctype": "Role", "role_name": role_name, "desk_access": 1}).insert()


def ensure_role_profiles() -> None:
	profiles = {
		"Easy ERP Operator": ["Easy ERP Operator"],
		"Easy ERP Sales": ["Easy ERP Operator", "Easy ERP Sales User"],
		"Easy ERP Purchase": ["Easy ERP Operator", "Easy ERP Purchase User"],
		"Easy ERP Stock": ["Easy ERP Operator", "Easy ERP Stock User"],
		"Easy ERP HR": ["Easy ERP Operator", "Easy ERP HR User"],
		"Easy ERP Payroll": ["Easy ERP Operator", "Easy ERP Payroll User"],
		"Easy ERP Manager": ["Easy ERP Operator", "Easy ERP Manager"],
		"Easy ERP Owner": ["Easy ERP Operator", "Easy ERP Owner"],
		"Easy ERP Administrator": ["Easy ERP Operator", "Easy ERP Administrator"],
	}
	for profile_name, roles in profiles.items():
		if frappe.db.exists("Role Profile", profile_name):
			continue
		doc = frappe.new_doc("Role Profile")
		doc.role_profile = profile_name
		for role in roles:
			doc.append("roles", {"role": role})
		doc.insert()


def ensure_settings() -> None:
	settings = frappe.get_doc("Easy ERP Settings")
	if not settings.default_country:
		settings.default_country = "Bangladesh"
		settings.default_currency = "BDT"
		settings.default_timezone = "Asia/Dhaka"
		settings.default_language = "bn"
		settings.save()
