frappe.pages["easy-suppliers"].on_page_load = (wrapper) => reckon_easy_erp.make_master_page({
	wrapper, title: "Suppliers", doctype: "Supplier", search_method: "reckon_easy_erp.master_api.search_suppliers",
	create_method: "reckon_easy_erp.master_api.create_supplier", fields: reckon_easy_erp.party_fields("Supplier"),
});
