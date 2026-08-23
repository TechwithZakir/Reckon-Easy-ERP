(() => {
	frappe.listview_settings.Supplier = frappe.listview_settings.Supplier || {};
	const previous = frappe.listview_settings.Supplier.onload;
	frappe.listview_settings.Supplier.onload = function (listview) {
		previous?.(listview);
		if (frappe.user_roles.some((role) => role.startsWith("Easy ERP")) && frappe.model.can_create("Supplier")) {
			listview.page.add_inner_button(__("সহজ এন্ট্রি"), () => frappe.set_route("easy-supplier-entry"));
		}
	};
})();
