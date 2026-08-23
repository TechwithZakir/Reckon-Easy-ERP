import uuid

import frappe
from frappe.tests.utils import FrappeTestCase

from reckon_easy_erp.services.items import create_item, search_items
from reckon_easy_erp.services.parties import create_party, search_parties


class TestEasyERPMasters(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.suffix = uuid.uuid4().hex[:8]
		self.mobile_suffix = f"{uuid.uuid4().int % 100_000_000:08d}"

	def test_customer_create_search_and_duplicate_prevention(self):
		group = frappe.db.get_value("Customer Group", {"is_group": 0}, "name")
		territory = frappe.db.get_value("Territory", {"is_group": 0}, "name")
		if not group or not territory:
			self.skipTest("Customer Group and Territory test masters are required")
		values = {
			"party_name": f"Easy Customer {self.suffix}",
			"mobile_no": f"+88017{self.mobile_suffix}",
			"party_type": "Individual",
			"group": group,
			"territory": territory,
		}
		created = create_party("Customer", values)
		self.assertTrue(frappe.db.exists("Customer", created["name"]))
		self.assertEqual(created["mobile_no"], f"017{self.mobile_suffix}")
		self.assertTrue(frappe.db.exists("Contact", created["contact"]))
		self.assertTrue(
			frappe.db.exists(
				"Dynamic Link",
				{"parent": created["contact"], "link_doctype": "Customer", "link_name": created["name"]},
			)
		)
		self.assertTrue(any(row["name"] == created["name"] for row in search_parties("Customer", self.suffix)))
		with self.assertRaises(frappe.ValidationError):
			create_party("Customer", values)

	def test_supplier_create_and_mobile_search(self):
		group = frappe.db.get_value("Supplier Group", {"is_group": 0}, "name")
		if not group:
			self.skipTest("A Supplier Group test master is required")
		created = create_party(
			"Supplier",
			{
				"party_name": f"Easy Supplier {self.suffix}",
				"mobile_no": f"018{self.mobile_suffix}",
				"party_type": "Company",
				"group": group,
			},
		)
		self.assertTrue(frappe.db.exists("Supplier", created["name"]))
		self.assertTrue(frappe.db.exists("Contact", created["contact"]))
		self.assertTrue(
			frappe.db.exists(
				"Dynamic Link",
				{"parent": created["contact"], "link_doctype": "Supplier", "link_name": created["name"]},
			)
		)
		self.assertTrue(any(row["name"] == created["name"] for row in search_parties("Supplier", f"018{self.mobile_suffix}")))

	def test_item_bangla_name_and_barcode_search(self):
		company = frappe.db.get_value("Company", {}, "name")
		item_group = frappe.db.get_value("Item Group", {"is_group": 0}, "name")
		uom = frappe.db.get_value("UOM", {}, "name")
		if not company or not item_group or not uom:
			self.skipTest("Company, Item Group, and UOM test masters are required")
		settings = frappe.get_doc("Easy ERP Settings")
		settings.default_company = company
		settings.save()
		code = f"EASY-{self.suffix}"
		barcode = f"890{self.suffix}"
		created = create_item(
			{
				"item_code": code,
				"item_name": f"Easy Item {self.suffix}",
				"bangla_name": f"সহজ পণ্য {self.suffix}",
				"item_group": item_group,
				"stock_uom": uom,
				"barcode": barcode,
			}
		)
		self.assertEqual(created["name"], code)
		self.assertTrue(any(row["name"] == code for row in search_items(barcode)))
		self.assertTrue(any(row["name"] == code for row in search_items("সহজ পণ্য")))

	def test_item_prices_and_opening_stock_use_standard_documents(self):
		warehouse_values = frappe.db.get_value("Warehouse", {"is_group": 0}, ["name", "company"])
		item_group = frappe.db.get_value("Item Group", {"is_group": 0}, "name")
		uom = frappe.db.get_value("UOM", {}, "name")
		selling_price_list = frappe.db.get_value("Price List", {"selling": 1, "enabled": 1}, "name")
		buying_price_list = frappe.db.get_value("Price List", {"buying": 1, "enabled": 1}, "name")
		if not all((warehouse_values, item_group, uom, selling_price_list, buying_price_list)):
			self.skipTest("Warehouse, Item Group, UOM, and buying/selling Price Lists are required")
		warehouse, company = warehouse_values
		settings = frappe.get_doc("Easy ERP Settings")
		settings.default_company = company
		settings.save()
		code = f"EASY-STOCK-{self.suffix}"
		create_item(
			{
				"item_code": code,
				"item_name": f"Easy Stock Item {self.suffix}",
				"item_group": item_group,
				"stock_uom": uom,
				"default_warehouse": warehouse,
				"selling_price_list": selling_price_list,
				"selling_rate": 75,
				"buying_price_list": buying_price_list,
				"buying_rate": 45,
				"opening_quantity": 2,
				"valuation_rate": 50,
			}
		)
		self.assertEqual(frappe.db.count("Item Price", {"item_code": code}), 2)
		reconciliation = frappe.db.get_value(
			"Stock Reconciliation Item", {"item_code": code, "warehouse": warehouse}, "parent"
		)
		self.assertTrue(reconciliation)
		self.assertEqual(frappe.db.get_value("Stock Reconciliation", reconciliation, "docstatus"), 1)
		self.assertEqual(frappe.db.get_value("Bin", {"item_code": code, "warehouse": warehouse}, "actual_qty"), 2)
