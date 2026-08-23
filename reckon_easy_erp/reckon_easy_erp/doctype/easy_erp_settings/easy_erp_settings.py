import re

import frappe
from frappe import _
from frappe.model.document import Document


BD_MOBILE_PATTERN = re.compile(r"^01[3-9]\d{8}$")


class EasyERPSettings(Document):
	def validate(self):
		if self.default_country and self.default_country != "Bangladesh":
			frappe.throw(_("The Phase 1 setup currently supports Bangladesh as the default country."))

		if self.support_mobile:
			mobile = normalize_bd_mobile(self.support_mobile)
			if not BD_MOBILE_PATTERN.fullmatch(mobile):
				frappe.throw(_("Enter a valid Bangladeshi mobile number."))
			self.support_mobile = mobile


def normalize_bd_mobile(value: str | None) -> str:
	value = re.sub(r"[\s()-]", "", value or "")
	if value.startswith("+880"):
		return "0" + value[4:]
	if value.startswith("880"):
		return "0" + value[3:]
	return value
