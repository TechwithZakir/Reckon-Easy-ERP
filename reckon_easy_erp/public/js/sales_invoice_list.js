(() => {
	frappe.listview_settings["Sales Invoice"] = frappe.listview_settings["Sales Invoice"] || {};
	const previous = frappe.listview_settings["Sales Invoice"].onload;
	frappe.listview_settings["Sales Invoice"].onload = function (listview) {
		previous?.(listview);
		if (frappe.user_roles.some((role) => role.startsWith("Easy ERP")) && frappe.model.can_create("Sales Invoice")) {
			listview.page.add_inner_button(__("সহজ বিক্রয়"), () => frappe.set_route("easy-sale"));
			listview.page.add_inner_button(__("সহজ বিক্রয় ফেরত"), () => frappe.set_route("easy-sales-return"));
		}
	};
})();
