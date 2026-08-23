frappe.pages["easy-items"].on_page_load = (wrapper) => reckon_easy_erp.make_master_page({
	wrapper, title: "Products", doctype: "Item", search_method: "reckon_easy_erp.master_api.search_items",
	create_method: "reckon_easy_erp.master_api.create_item", fields: reckon_easy_erp.item_fields(),
});
