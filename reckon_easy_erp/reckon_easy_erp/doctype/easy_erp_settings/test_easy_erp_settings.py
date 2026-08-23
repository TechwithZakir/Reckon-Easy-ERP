from frappe.tests.utils import FrappeTestCase

from reckon_easy_erp.reckon_easy_erp.doctype.easy_erp_settings.easy_erp_settings import normalize_bd_mobile


class TestEasyERPSettings(FrappeTestCase):
	def test_normalizes_supported_bd_mobile_formats(self):
		self.assertEqual(normalize_bd_mobile("+880 1712-345678"), "01712345678")
		self.assertEqual(normalize_bd_mobile("8801712345678"), "01712345678")
		self.assertEqual(normalize_bd_mobile("01712345678"), "01712345678")
