import frappe


def execute() -> None:
	"""Free `/app/easy-erp` for the mobile dashboard Page."""
	old_name = "Easy ERP"
	new_name = "Reckon Easy ERP"
	if not frappe.db.exists("Workspace", old_name):
		return
	if frappe.db.exists("Workspace", new_name):
		frappe.delete_doc("Workspace", old_name, force=True)
	else:
		frappe.rename_doc("Workspace", old_name, new_name, force=True)
