frappe.pages["easy-item-entry"].on_page_load = (wrapper) => reckon_easy_erp.make_entry_page({
	wrapper, title: "নতুন পণ্য", subtitle: "পণ্য, দাম, বারকোড ও প্রারম্ভিক স্টক যোগ করুন", list_route: "item",
	method: "reckon_easy_erp.master_api.create_item",
	sections: [
		{ title: "পণ্যের পরিচয়", fields: [
			{ fieldname: "item_code", fieldtype: "Data", label: "পণ্য কোড", reqd: 1 },
			{ fieldname: "barcode", fieldtype: "Data", label: "বারকোড" },
			{ fieldname: "item_name", fieldtype: "Data", label: "পণ্যের নাম", reqd: 1 },
			{ fieldname: "bangla_name", fieldtype: "Data", label: "বাংলা নাম" },
			{ fieldname: "item_group", fieldtype: "Link", label: "Item Group", options: "Item Group", reqd: 1 },
			{ fieldname: "stock_uom", fieldtype: "Link", label: "একক", options: "UOM", reqd: 1 },
		] },
		{ title: "দাম", description: "দাম পরে পরিবর্তন করা যাবে", fields: [
			{ fieldname: "selling_price_list", fieldtype: "Link", label: "Selling Price List", options: "Price List" },
			{ fieldname: "selling_rate", fieldtype: "Currency", label: "বিক্রয় মূল্য", non_negative: 1 },
			{ fieldname: "buying_price_list", fieldtype: "Link", label: "Buying Price List", options: "Price List" },
			{ fieldname: "buying_rate", fieldtype: "Currency", label: "ক্রয় মূল্য", non_negative: 1 },
		] },
		{ title: "প্রারম্ভিক স্টক", description: "স্টক থাকলে পরিমাণ ও মূল্য দিন", fields: [
			{ fieldname: "default_warehouse", fieldtype: "Link", label: "গুদাম", options: "Warehouse" },
			{ fieldname: "opening_quantity", fieldtype: "Float", label: "প্রারম্ভিক পরিমাণ", non_negative: 1 },
			{ fieldname: "valuation_rate", fieldtype: "Currency", label: "মূল্যায়ন দর", non_negative: 1 },
		] },
		{ title: "ব্যাচ ও মেয়াদ", fields: [
			{ fieldname: "has_batch_no", fieldtype: "Check", label: "ব্যাচ অনুসরণ করুন" },
			{ fieldname: "has_expiry_date", fieldtype: "Check", label: "মেয়াদ অনুসরণ করুন", depends_on: "eval:doc.has_batch_no" },
		] },
	],
});
