app_name = "reckon_easy_erp"
app_title = "Reckon Easy ERP"
app_publisher = "Reckon Technologies Ltd."
app_description = "Bangladesh-first simplified business workflows for ERPNext and HRMS"
app_email = "support@reckon.com.bd"
app_license = "Reckon Technologies Ltd."

required_apps = ["erpnext", "hrms"]

after_install = "reckon_easy_erp.install.after_install"
after_migrate = "reckon_easy_erp.install.after_migrate"

fixtures = [
	{
		"dt": "Role",
		"filters": [["name", "in", [
			"Easy ERP Operator",
			"Easy ERP Sales User",
			"Easy ERP Purchase User",
			"Easy ERP Stock User",
			"Easy ERP HR User",
			"Easy ERP Payroll User",
			"Easy ERP Manager",
			"Easy ERP Owner",
			"Easy ERP Administrator",
		]]],
	},
	{"dt": "Custom Field", "filters": [["fieldname", "like", "easy_erp_%"]]},
	{"dt": "Custom DocPerm", "filters": [["role", "like", "Easy ERP%"]]},
]

add_to_apps_screen = [
	{
		"name": "reckon_easy_erp",
		"logo": "/assets/reckon_easy_erp/images/reckon-easy-erp.svg",
		"title": "Reckon Easy ERP",
		"route": "/app/easy-erp",
		"has_permission": "reckon_easy_erp.permissions.can_open_easy_erp",
	}
]

app_include_css = ["/assets/reckon_easy_erp/css/easy_erp.css?v=0.5.7"]
app_include_js = [
	"/assets/reckon_easy_erp/js/easy_erp_compat.js?v=0.5.7",
	"/assets/reckon_easy_erp/js/easy_entry.js?v=0.5.7",
]

doctype_list_js = {
	"Customer": "public/js/customer_list.js",
	"Supplier": "public/js/supplier_list.js",
	"Item": "public/js/item_list.js",
	"Sales Invoice": "public/js/sales_invoice_list.js",
	"Payment Entry": "public/js/payment_entry_list.js",
}

permission_query_conditions = {
	"Easy ERP User Access": "reckon_easy_erp.permissions.user_access_query",
}

has_permission = {
	"Easy ERP User Access": "reckon_easy_erp.permissions.user_access_permission",
}
