(() => {
	frappe.listview_settings.Item = frappe.listview_settings.Item || {};
	const previous = frappe.listview_settings.Item.onload;
	frappe.listview_settings.Item.onload = function (listview) {
		previous?.(listview);
		if (frappe.user_roles.some((role) => role.startsWith("Easy ERP")) && frappe.model.can_create("Item")) {
			listview.page.add_inner_button(__("সহজ এন্ট্রি"), () => frappe.set_route("easy-item-entry"));
		}
	};
})();
