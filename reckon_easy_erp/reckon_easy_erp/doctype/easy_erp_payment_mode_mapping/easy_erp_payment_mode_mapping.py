import frappe
from frappe import _
from frappe.model.document import Document


class EasyERPPaymentModeMapping(Document):
	def validate(self):
		if frappe.db.get_value("Account", self.account, "company") != self.company:
			frappe.throw(_("The payment account must belong to the selected company."))
		account_type = frappe.db.get_value("Account", self.account, "account_type")
		if account_type not in {"Bank", "Cash"}:
			frappe.throw(_("Select a Cash or Bank account for this payment mode."))
