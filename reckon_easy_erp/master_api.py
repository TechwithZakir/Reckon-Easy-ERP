from typing import Any

import frappe

from reckon_easy_erp.services.items import create_item as _create_item
from reckon_easy_erp.services.items import search_items as _search_items
from reckon_easy_erp.services.parties import create_party, search_parties
from reckon_easy_erp.permissions import require_easy_erp_user
from reckon_easy_erp.services.common import user_context


def _values(value: dict[str, Any] | str | None) -> dict[str, Any]:
	return frappe.parse_json(value) if isinstance(value, str) else (value or {})


@frappe.whitelist()
def get_entry_defaults():
	require_easy_erp_user()
	context = user_context()
	settings = frappe.get_cached_doc("Easy ERP Settings")
	return {
		"company": context["company"],
		"warehouse": context["warehouse"],
		"default_warehouse": context["warehouse"],
		"selling_price_list": settings.default_selling_price_list,
		"buying_price_list": settings.default_buying_price_list,
		"can_submit": context["can_submit"],
	}


@frappe.whitelist()
def search_customers(query: str = "", limit: int = 20):
	return search_parties("Customer", query, limit)


@frappe.whitelist(methods=["POST"])
def create_customer(values=None):
	return create_party("Customer", _values(values))


@frappe.whitelist()
def search_suppliers(query: str = "", limit: int = 20):
	return search_parties("Supplier", query, limit)


@frappe.whitelist(methods=["POST"])
def create_supplier(values=None):
	return create_party("Supplier", _values(values))


@frappe.whitelist()
def search_items(query: str = "", limit: int = 20):
	return _search_items(query, limit)


@frappe.whitelist(methods=["POST"])
def create_item(values=None):
	return _create_item(_values(values))
