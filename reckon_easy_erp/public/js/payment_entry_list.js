(() => {
	frappe.listview_settings["Payment Entry"] = frappe.listview_settings["Payment Entry"] || {};
	const previous = frappe.listview_settings["Payment Entry"].onload;
	frappe.listview_settings["Payment Entry"].onload = function (listview) {
		previous?.(listview);
		if (frappe.user_roles.some((role) => role.startsWith("Easy ERP")) && frappe.model.can_create("Payment Entry")) {
			listview.page.add_inner_button(__("সহজ টাকা গ্রহণ"), () => frappe.set_route("easy-collection"));
		}
	};
})();
