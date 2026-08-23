from frappe import _
import frappe
from frappe.model.document import Document
from frappe.utils import flt


class EasyERPApprovalRule(Document):
	def validate(self):
		if flt(self.threshold) < 0:
			frappe.throw(_("Approval threshold cannot be negative."))
		if self.action == "Sales Discount" and flt(self.threshold) > 100:
			frappe.throw(_("Sales discount threshold cannot exceed 100 percent."))
