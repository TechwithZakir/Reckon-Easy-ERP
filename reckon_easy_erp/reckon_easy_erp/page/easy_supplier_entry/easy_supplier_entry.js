frappe.pages["easy-supplier-entry"].on_page_load = (wrapper) => reckon_easy_erp.make_entry_page({
	wrapper, title: "নতুন সরবরাহকারী", subtitle: "সহজভাবে সরবরাহকারীর তথ্য যোগ করুন", list_route: "supplier",
	method: "reckon_easy_erp.master_api.create_supplier",
	sections: [
		{ title: "সরবরাহকারীর তথ্য", fields: [
			{ fieldname: "party_name", fieldtype: "Data", label: "সরবরাহকারীর নাম", reqd: 1, wide: 1 },
			{ fieldname: "mobile_no", fieldtype: "Data", label: "মোবাইল নম্বর", description: "যেমন: 01712345678" },
			{ fieldname: "party_type", fieldtype: "Select", label: "সরবরাহকারীর ধরন", options: "Company\nIndividual", default: "Company", reqd: 1 },
		] },
		{ title: "শ্রেণিবিভাগ", description: "ক্রয় ও পাওনা রিপোর্টের জন্য", fields: [
			{ fieldname: "group", fieldtype: "Link", label: "Supplier Group", options: "Supplier Group", reqd: 1 },
		] },
	],
});
