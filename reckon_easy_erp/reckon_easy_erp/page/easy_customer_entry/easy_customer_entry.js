frappe.pages["easy-customer-entry"].on_page_load = (wrapper) => reckon_easy_erp.make_entry_page({
	wrapper, title: "নতুন ক্রেতা", subtitle: "শুধু প্রয়োজনীয় তথ্য দিয়ে ক্রেতা তৈরি করুন", list_route: "customer",
	method: "reckon_easy_erp.master_api.create_customer",
	sections: [
		{ title: "ক্রেতার তথ্য", fields: [
			{ fieldname: "party_name", fieldtype: "Data", label: "ক্রেতার নাম", reqd: 1, wide: 1 },
			{ fieldname: "mobile_no", fieldtype: "Data", label: "মোবাইল নম্বর", description: "যেমন: 01712345678" },
			{ fieldname: "email_id", fieldtype: "Data", label: "ইমেইল", options: "Email" },
			{ fieldname: "party_type", fieldtype: "Select", label: "ক্রেতার ধরন", options: "Individual\nCompany", default: "Individual", reqd: 1 },
		] },
		{ title: "শ্রেণিবিভাগ", description: "রিপোর্ট ও হিসাবের জন্য", fields: [
			{ fieldname: "group", fieldtype: "Link", label: "Customer Group", options: "Customer Group", reqd: 1 },
			{ fieldname: "territory", fieldtype: "Link", label: "Territory", options: "Territory", reqd: 1 },
		] },
	],
});
