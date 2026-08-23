from typing import Any

import frappe

from reckon_easy_erp.services.sales import (
	create_collection as _create_collection,
	create_sale as _create_sale,
	create_sales_return as _create_sales_return,
	get_customer_outstanding as _get_customer_outstanding,
	get_sales_context as _get_sales_context,
	search_sale_items as _search_sale_items,
)


def _values(value: dict[str, Any] | str | None) -> dict[str, Any]:
	return frappe.parse_json(value) if isinstance(value, str) else (value or {})


@frappe.whitelist()
def get_sales_context():
	return _get_sales_context()


@frappe.whitelist()
def search_sale_items(query: str = ""):
	return _search_sale_items(query)


@frappe.whitelist(methods=["POST"])
def create_sale(values=None):
	return _create_sale(_values(values))


@frappe.whitelist()
def get_customer_outstanding(customer: str):
	return _get_customer_outstanding(customer)


@frappe.whitelist(methods=["POST"])
def create_collection(values=None):
	return _create_collection(_values(values))


@frappe.whitelist(methods=["POST"])
def create_sales_return(values=None):
	return _create_sales_return(_values(values))
