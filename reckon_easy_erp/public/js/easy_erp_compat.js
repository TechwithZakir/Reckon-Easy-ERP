frappe.provide("reckon_easy_erp");

reckon_easy_erp.request_id = () => globalThis.crypto?.randomUUID?.()
	|| `easy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
reckon_easy_erp.format_money = (value) => Number(value || 0).toLocaleString(
	undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }
);

// Compatibility for cached Phase 2 Page scripts. The current Page scripts
// redirect directly; these helpers can be removed after all sites upgrade.
reckon_easy_erp.party_fields = () => [];
reckon_easy_erp.item_fields = () => [];
reckon_easy_erp.make_master_page = ({ doctype, title }) => {
	const routes = {
		Customer: "Customer",
		Supplier: "Supplier",
		Item: "Item",
		Customers: "Customer",
		Suppliers: "Supplier",
		Products: "Item",
	};
	frappe.set_route("List", routes[doctype] || routes[title] || doctype);
};
