frappe.pages["easy-erp"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Reckon Easy ERP"), single_column: true });
	page.main.addClass("easy-erp-page");
	render_loading(page.main);
	frappe.call("reckon_easy_erp.api.get_context").then(({ message }) => render_dashboard(page.main, message));
};

function render_loading(container) {
	container.html(`<div class="easy-erp-loading">${__("Loading...")}</div>`);
}

function render_dashboard(container, context) {
	const actions = [
		["users", __("ক্রেতা"), "easy-customers", "sales"],
		["organization", __("সরবরাহকারী"), "easy-suppliers", "purchase"],
		["package", __("পণ্য"), "easy-items", "stock"],
		["cart", __("বিক্রয় করুন"), "easy-sale", "sales"],
		["credit-card", __("টাকা গ্রহণ করুন"), "easy-collection", "sales"],
		["shopping-bag", __("পণ্য কিনুন"), "easy-purchase", "purchase"],
		["package", __("পণ্য গ্রহণ করুন"), "easy-goods-received", "purchase"],
		["send", __("সরবরাহকারীকে পেমেন্ট"), "easy-supplier-payment", "purchase"],
		["file-text", __("খরচ লিখুন"), "easy-expense", "sales"],
		["layers", __("বর্তমান স্টক"), "easy-stock", "stock"],
		["users", __("কর্মচারী"), "easy-employees", "hr"],
		["check-circle", __("হাজিরা"), "easy-attendance", "hr"],
		["calendar", __("ছুটি"), "easy-leave", "hr"],
		["dollar-sign", __("বেতন তৈরি করুন"), "easy-payroll", "payroll"],
		["bar-chart-2", __("রিপোর্ট"), "easy-reports", null],
	].filter((action) => !action[3] || context.features[action[3]]);

	const cards = actions.map(([icon, label, route]) => `
		<button class="easy-erp-action" data-route="${frappe.utils.escape_html(route)}">
			${frappe.utils.icon(icon, "lg")}<span>${frappe.utils.escape_html(label)}</span>
		</button>`).join("");
	const company = context.access?.company || __("Company not configured");
	container.html(`
		<section class="easy-erp-welcome">
			<div><h2>${__("স্বাগতম")}, ${frappe.utils.escape_html(context.full_name)}</h2>
			<p>${frappe.utils.escape_html(company)}</p></div>
			<button class="btn btn-default easy-erp-language">বাংলা / English</button>
		</section>
		${context.setup_complete ? "" : `<div class="alert alert-warning">${__("Easy ERP setup is not complete.")}</div>`}
		<section class="easy-erp-actions">${cards}</section>`);
	container.find(".easy-erp-action").on("click", (event) => frappe.set_route(event.currentTarget.dataset.route));
	container.find(".easy-erp-language").on("click", () => {
		const language = context.language === "bn" ? "en" : "bn";
		frappe.call("frappe.client.set_value", { doctype: "User", name: frappe.session.user, fieldname: "language", value: language })
			.then(() => window.location.reload());
	});
}
