frappe.pages["easy-collection"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("সহজ টাকা গ্রহণ"), single_column: true });
	page.main.addClass("easy-erp-page").html(`<div class="easy-transaction-shell easy-collection-shell">
		<header class="easy-transaction-header"><button class="btn btn-default easy-back-to-list payment-list"><span aria-hidden="true">←</span>${__("পেমেন্ট তালিকায় ফিরুন")}</button><div><span>${__("আদায়")}</span><h2>${__("ক্রেতার টাকা গ্রহণ")}</h2><p>${__("বকেয়া বিক্রয় নির্বাচন করে টাকা গ্রহণ করুন")}</p></div></header>
		<section class="easy-transaction-section"><h3><b>১</b>${__("ক্রেতা নির্বাচন")}</h3><div class="easy-collection-customer"><div class="customer-control"></div><button class="btn btn-primary load-outstanding">${__("বকেয়া দেখুন")}</button></div><div class="outstanding-summary"></div></section>
		<section class="easy-transaction-section"><h3><b>২</b>${__("বকেয়া বিক্রয়")}</h3><div class="invoice-selection"><div class="easy-empty-cart">${__("প্রথমে ক্রেতা নির্বাচন করুন")}</div></div></section>
		<section class="easy-transaction-section"><h3><b>৩</b>${__("প্রাপ্ত টাকা")}</h3><div class="easy-transaction-grid"><div class="amount-control"></div><div class="mode-control"></div><div class="reference-control"></div></div></section>
		<footer class="easy-transaction-footer"><button class="btn btn-primary btn-lg submit-collection">${__("টাকা গ্রহণ নিশ্চিত করুন")}</button></footer></div>`);
	const controls = {
		customer: frappe.ui.form.make_control({ parent: page.main.find(".customer-control"), df: { fieldtype: "Link", options: "Customer", label: __("ক্রেতা"), reqd: 1 }, render_input: true }),
		amount: frappe.ui.form.make_control({ parent: page.main.find(".amount-control"), df: { fieldtype: "Currency", label: __("প্রাপ্ত টাকার পরিমাণ"), reqd: 1, non_negative: 1 }, render_input: true }),
		mode: frappe.ui.form.make_control({ parent: page.main.find(".mode-control"), df: { fieldtype: "Select", label: __("পেমেন্ট পদ্ধতি"), reqd: 1 }, render_input: true }),
		reference: frappe.ui.form.make_control({ parent: page.main.find(".reference-control"), df: { fieldtype: "Data", label: __("লেনদেন রেফারেন্স") }, render_input: true }),
	};
	reckon_easy_erp.guard_autocomplete(page.main);
	const state = { invoices: [], request_id: reckon_easy_erp.request_id() };
	page.main.find(".payment-list").on("click", () => frappe.set_route("payment-entry"));
	frappe.call("reckon_easy_erp.sales_api.get_sales_context").then(({ message }) => { controls.mode.df.options = ["", ...message.payment_modes.map((row) => row.display_name)].join("\n"); controls.mode.refresh(); });
	page.main.find(".load-outstanding").on("click", () => load_outstanding(page.main, controls, state));
	page.main.find(".submit-collection").on("click", () => submit_collection(page.main, controls, state));
};

function load_outstanding(container, controls, state) {
	const customer = controls.customer.get_value(); if (!customer) return frappe.msgprint(__("ক্রেতা নির্বাচন করুন"));
	frappe.call("reckon_easy_erp.sales_api.get_customer_outstanding", { customer }).then(({ message }) => {
		state.invoices = message.invoices || [];
		container.find(".outstanding-summary").html(`<span>${__("মোট বকেয়া")}</span><strong>৳ ${reckon_easy_erp.format_money(message.total_outstanding)}</strong>`);
		container.find(".invoice-selection").html(state.invoices.length ? `<div class="easy-invoice-table"><div class="easy-invoice-head"><span></span><span>${__("বিক্রয়")}</span><span>${__("তারিখ")}</span><span>${__("মোট")}</span><span>${__("বাকি")}</span></div>${state.invoices.map((row, index) => `<label class="easy-invoice-row"><input type="checkbox" data-index="${index}" checked><span>${frappe.utils.escape_html(row.name)}</span><span>${frappe.datetime.str_to_user(row.posting_date)}</span><span>৳ ${reckon_easy_erp.format_money(row.grand_total)}</span><strong>৳ ${reckon_easy_erp.format_money(row.outstanding_amount)}</strong></label>`).join("")}</div>` : `<div class="easy-empty-cart">${__("এই ক্রেতার কোনো বকেয়া নেই")}</div>`);
		controls.amount.set_value(message.total_outstanding);
	});
}

function submit_collection(container, controls, state) {
	const invoices = container.find(".invoice-selection input:checked").map((_, input) => state.invoices[Number(input.dataset.index)].name).get();
	if (!controls.customer.get_value() || !invoices.length || !controls.amount.get_value() || !controls.mode.get_value()) return frappe.msgprint(__("ক্রেতা, বিক্রয়, টাকা ও পেমেন্ট পদ্ধতি দিন"));
	const values = { request_id: state.request_id, customer: controls.customer.get_value(), invoices, received_amount: controls.amount.get_value(), payment_mode: controls.mode.get_value(), payment_reference: controls.reference.get_value() };
	container.find(".submit-collection").prop("disabled", true);
	frappe.call({ method: "reckon_easy_erp.sales_api.create_collection", type: "POST", args: { values }, freeze: true, freeze_message: __("পেমেন্ট সংরক্ষণ হচ্ছে...") })
		.then(({ message }) => frappe.set_route("Form", "Payment Entry", message.payment_entry))
		.finally(() => container.find(".submit-collection").prop("disabled", false));
}
