import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class EasyERPUserAccess(Document):
	def validate(self):
		if self.user == "Administrator":
			frappe.throw(_("Administrator does not need an Easy ERP access record."))
		if flt(self.maximum_discount_percentage) < 0 or flt(self.maximum_discount_percentage) > 100:
			frappe.throw(_("Maximum discount must be between 0 and 100 percent."))
		if self.default_warehouse and self.company:
			warehouse_company = frappe.db.get_value("Warehouse", self.default_warehouse, "company")
			if warehouse_company != self.company:
				frappe.throw(_("The default warehouse must belong to the selected company."))
		if self.default_account and self.company:
			account_company = frappe.db.get_value("Account", self.default_account, "company")
			if account_company != self.company:
				frappe.throw(_("The default account must belong to the selected company."))
