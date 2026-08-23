frappe.pages["easy-erp-setup"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("Easy ERP Setup"), single_column: true });
	page.main.addClass("easy-erp-page").html(`<div class="easy-erp-loading">${__("Checking setup...")}</div>`);
	frappe.call("reckon_easy_erp.api.get_setup_status").then(({ message }) => render_setup(page.main, message));
};

function render_setup(container, status) {
	const checks = Object.entries(status.checks).map(([key, count]) =>
		`<div class="easy-erp-check"><strong>${frappe.utils.escape_html(__(key))}</strong><span>${count}</span></div>`).join("");
	container.html(`
		<div class="easy-erp-setup-card">
			<h2>${__("Business setup")}</h2>
			<p>${__("Confirm the company that Easy ERP should use by default.")}</p>
			<div class="easy-erp-checks">${checks}</div>
			<div class="form-group"><label>${__("Default Company")}</label><div class="company-control"></div></div>
			<button class="btn btn-primary btn-lg complete-setup">${__("Complete Setup")}</button>
		</div>`);
	const company = frappe.ui.form.make_control({
		parent: container.find(".company-control"), df: { fieldtype: "Link", options: "Company", reqd: 1 }, render_input: true,
	});
	company.set_value(status.default_company);
	container.find(".complete-setup").on("click", () => {
		if (!company.get_value()) return frappe.msgprint(__("Select a company."));
		frappe.call({ method: "reckon_easy_erp.api.complete_setup", type: "POST", args: { default_company: company.get_value() }, freeze: true })
			.then(() => { frappe.show_alert({ message: __("Setup completed"), indicator: "green" }); frappe.set_route("easy-erp"); });
	});
}
