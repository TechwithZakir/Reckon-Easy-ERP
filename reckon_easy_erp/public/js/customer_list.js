(() => {
	frappe.listview_settings.Customer = frappe.listview_settings.Customer || {};
	const previous = frappe.listview_settings.Customer.onload;
	frappe.listview_settings.Customer.onload = function (listview) {
		previous?.(listview);
		if (frappe.user_roles.some((role) => role.startsWith("Easy ERP")) && frappe.model.can_create("Customer")) {
			listview.page.add_inner_button(__("সহজ এন্ট্রি"), () => frappe.set_route("easy-customer-entry"));
		}
	};
})();
