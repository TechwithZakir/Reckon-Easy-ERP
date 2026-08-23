frappe.pages["easy-customers"].on_page_load = (wrapper) => reckon_easy_erp.make_master_page({
	wrapper, title: "Customers", doctype: "Customer", search_method: "reckon_easy_erp.master_api.search_customers",
	create_method: "reckon_easy_erp.master_api.create_customer", fields: reckon_easy_erp.party_fields("Customer"),
});
