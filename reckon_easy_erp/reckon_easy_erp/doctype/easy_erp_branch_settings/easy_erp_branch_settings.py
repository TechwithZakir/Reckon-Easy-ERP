import frappe
from frappe import _
from frappe.model.document import Document


class EasyERPBranchSettings(Document):
	def validate(self):
		for fieldname, doctype in (
			("default_warehouse", "Warehouse"),
			("default_cost_center", "Cost Center"),
			("default_cash_account", "Account"),
			("default_bank_account", "Account"),
		):
			value = self.get(fieldname)
			if value and frappe.db.get_value(doctype, value, "company") != self.company:
				frappe.throw(_("{0} must belong to company {1}.").format(self.meta.get_label(fieldname), self.company))
