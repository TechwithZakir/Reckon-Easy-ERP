import uuid

import frappe
from frappe.tests.utils import FrappeTestCase

from reckon_easy_erp.services.items import create_item
from reckon_easy_erp.services.parties import create_party
from reckon_easy_erp.services.sales import create_collection, create_sale, create_sales_return


class TestEasyERPSales(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.suffix = uuid.uuid4().hex[:8]
		self._prepare_masters()

	def test_cash_sale_ledgers_and_duplicate_payment_prevention(self):
		request_id = f"cash-sale-{self.suffix}"
		values = self._sale_values(request_id, paid_amount=100)
		result = create_sale(values)
		self.assertEqual(frappe.db.get_value("Sales Invoice", result["sales_invoice"], "docstatus"), 1)
		self.assertEqual(frappe.db.get_value("Payment Entry", result["payment_entry"], "docstatus"), 1)
		self.assertGreater(frappe.db.count("GL Entry", {"voucher_no": result["sales_invoice"]}), 0)
		self.assertGreater(frappe.db.count("Stock Ledger Entry", {"voucher_no": result["sales_invoice"]}), 0)
		self.assertEqual(frappe.db.get_value("Sales Invoice", result["sales_invoice"], "outstanding_amount"), 0)

		retry = create_sale(values)
		self.assertEqual(retry["sales_invoice"], result["sales_invoice"])
		self.assertEqual(
			frappe.db.count("Payment Entry", {"easy_erp_request_id": f"{request_id}:payment"}),
			1,
		)

	def test_credit_sale_partial_collection_and_return(self):
		credit = create_sale(self._sale_values(f"credit-sale-{self.suffix}", paid_amount=0))
		self.assertEqual(credit["outstanding_amount"], 100)
		collection_values = {
			"request_id": f"collection-{self.suffix}",
			"customer": self.customer,
			"invoices": [credit["sales_invoice"]],
			"received_amount": 40,
			"payment_mode": self.payment_mapping,
		}
		collection = create_collection(collection_values)
		self.assertEqual(frappe.db.get_value("Payment Entry", collection["payment_entry"], "docstatus"), 1)
		self.assertEqual(frappe.db.get_value("Sales Invoice", credit["sales_invoice"], "outstanding_amount"), 60)
		self.assertEqual(create_collection(collection_values)["payment_entry"], collection["payment_entry"])

		returned = create_sales_return(
			{"request_id": f"return-{self.suffix}", "sales_invoice": credit["sales_invoice"]}
		)
		self.assertTrue(returned["is_return"])
		self.assertEqual(frappe.db.get_value("Sales Invoice", returned["sales_invoice"], "docstatus"), 1)
		self.assertGreater(frappe.db.count("Stock Ledger Entry", {"voucher_no": returned["sales_invoice"]}), 0)

	def _prepare_masters(self):
		warehouse_values = frappe.db.get_value("Warehouse", {"is_group": 0}, ["name", "company"])
		customer_group = frappe.db.get_value("Customer Group", {"is_group": 0}, "name")
		territory = frappe.db.get_value("Territory", {"is_group": 0}, "name")
		item_group = frappe.db.get_value("Item Group", {"is_group": 0}, "name")
		uom = frappe.db.get_value("UOM", {}, "name")
		cash_account = None
		cash_mode = frappe.db.exists("Mode of Payment", "Cash")
		if warehouse_values:
			cash_account = frappe.db.get_value(
				"Account",
				{"company": warehouse_values[1], "account_type": "Cash", "is_group": 0},
				"name",
			)
		if not all((warehouse_values, customer_group, territory, item_group, uom, cash_account, cash_mode)):
			self.skipTest("Company accounting, warehouse, and selling masters are required")
		self.warehouse, self.company = warehouse_values
		settings = frappe.get_doc("Easy ERP Settings")
		settings.default_company = self.company
		settings.save()
		self.customer = create_party(
			"Customer",
			{
				"party_name": f"Easy Sale Customer {self.suffix}",
				"party_type": "Individual",
				"group": customer_group,
				"territory": territory,
			},
		)["name"]
		self.item = f"EASY-SALE-{self.suffix}"
		create_item(
			{
				"item_code": self.item,
				"item_name": f"Easy Sale Item {self.suffix}",
				"item_group": item_group,
				"stock_uom": uom,
				"default_warehouse": self.warehouse,
				"opening_quantity": 10,
				"valuation_rate": 50,
			}
		)
		mapping = frappe.get_doc(
			{
				"doctype": "Easy ERP Payment Mode Mapping",
				"display_name": f"Test Cash {self.suffix}",
				"payment_kind": "Cash",
				"mode_of_payment": "Cash",
				"company": self.company,
				"account": cash_account,
				"enabled": 1,
			}
		).insert()
		self.payment_mapping = mapping.name

	def _sale_values(self, request_id: str, paid_amount: float):
		return {
			"request_id": request_id,
			"customer": self.customer,
			"warehouse": self.warehouse,
			"items": [{"item_code": self.item, "qty": 1, "rate": 100, "discount_percentage": 0}],
			"paid_amount": paid_amount,
			"payment_mode": self.payment_mapping if paid_amount else None,
			"submit": True,
		}
