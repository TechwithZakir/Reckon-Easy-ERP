frappe.pages["easy-sale"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("সহজ বিক্রয়"), single_column: true });
	page.main.addClass("easy-erp-page easy-sale-page");
	const state = { items: [], context: null, currency: null, request_id: request_id() };
	page.main.html(`<div class="easy-transaction-shell">
		<header class="easy-transaction-header"><button class="btn btn-default easy-back-to-list invoice-list"><span aria-hidden="true">←</span>${__("বিক্রয় তালিকায় ফিরুন")}</button>
		<div><span>${__("বিক্রয়")}</span><h2>${__("নতুন বিক্রয়")}</h2><p>${__("ক্রেতা ও পণ্য নির্বাচন করে পেমেন্ট নিশ্চিত করুন")}</p></div></header>
		<section class="easy-transaction-section"><h3><b>১</b>${__("ক্রেতা")}</h3><div class="easy-transaction-grid">
			<div class="customer-control"></div><div class="date-control"></div><div class="warehouse-control"></div></div>
			<button class="btn btn-xs btn-default walk-in">${__("ওয়াক-ইন ক্রেতা")}</button></section>
		<section class="easy-transaction-section"><h3><b>২</b>${__("পণ্য যোগ করুন")}</h3>
			<div class="easy-item-search-wrap"><input class="form-control easy-item-search" placeholder="${__("নাম, বাংলা নাম বা বারকোড")}"><div class="easy-item-suggestions" hidden></div></div>
			<div class="easy-cart"></div></section>
		<section class="easy-transaction-section"><h3><b>৩</b>${__("পেমেন্ট")}</h3><div class="easy-transaction-grid">
			<div class="paid-control"></div><div class="payment-mode-control"></div><div class="reference-control"></div></div>
			<div class="easy-totals"><div><span>${__("মোট")}</span><strong class="grand-total">0.00</strong></div><div><span>${__("পরিশোধ")}</span><strong class="paid-total">0.00</strong></div><div class="is-due"><span>${__("বাকি")}</span><strong class="due-total">0.00</strong></div></div></section>
		<footer class="easy-transaction-footer"><button class="btn btn-default save-draft">${__("খসড়া রাখুন")}</button><button class="btn btn-primary btn-lg submit-sale">${__("বিক্রয় সম্পন্ন করুন")}</button></footer>
	</div>`);
	const controls = make_sale_controls(page.main);
	reckon_easy_erp.guard_autocomplete(page.main);
	bind_sale_events(page.main, controls, state);
	frappe.call("reckon_easy_erp.sales_api.get_sales_context").then(({ message }) => {
		state.context = message;
		state.currency = message.currency;
		controls.posting_date.set_value(message.posting_date);
		controls.warehouse.set_value(message.warehouse);
		controls.payment_mode.df.options = ["", ...message.payment_modes.map((row) => row.display_name)].join("\n");
		controls.payment_mode.refresh();
		if (message.payment_modes.length === 1) controls.payment_mode.set_value(message.payment_modes[0].display_name);
		page.main.find(".walk-in").toggle(Boolean(message.walk_in_customer));
		render_totals(page.main, controls, state);
	});
};

function make_sale_controls(container) {
	const definitions = {
		customer: [".customer-control", { fieldtype: "Link", options: "Customer", label: __("ক্রেতা"), reqd: 1 }],
		posting_date: [".date-control", { fieldtype: "Date", label: __("তারিখ"), reqd: 1 }],
		warehouse: [".warehouse-control", { fieldtype: "Link", options: "Warehouse", label: __("গুদাম"), reqd: 1 }],
		paid_amount: [".paid-control", { fieldtype: "Currency", label: __("পরিশোধিত টাকা"), non_negative: 1 }],
		payment_mode: [".payment-mode-control", { fieldtype: "Select", label: __("পেমেন্ট পদ্ধতি") }],
		payment_reference: [".reference-control", { fieldtype: "Data", label: __("লেনদেন রেফারেন্স") }],
	};
	return Object.fromEntries(Object.entries(definitions).map(([key, [selector, df]]) => [key, frappe.ui.form.make_control({ parent: container.find(selector), df, render_input: true })]));
}

function bind_sale_events(container, controls, state) {
	container.find(".invoice-list").on("click", () => frappe.set_route("sales-invoice"));
	container.find(".walk-in").on("click", () => controls.customer.set_value(state.context.walk_in_customer));
	let timer;
	container.find(".easy-item-search").on("input", function () {
		clearTimeout(timer);
		const query = this.value.trim();
		if (!query) return container.find(".easy-item-suggestions").prop("hidden", true);
		timer = setTimeout(() => frappe.call("reckon_easy_erp.sales_api.search_sale_items", { query }).then(({ message }) => render_item_suggestions(container, state, message || [])), 220);
	});
	controls.paid_amount.$input.on("input", () => render_totals(container, controls, state));
	container.find(".save-draft").on("click", () => save_sale(container, controls, state, false));
	container.find(".submit-sale").on("click", () => save_sale(container, controls, state, true));
}

function render_item_suggestions(container, state, rows) {
	const target = container.find(".easy-item-suggestions");
	if (!rows.length) return target.html(`<div>${__("কোনো পণ্য পাওয়া যায়নি")}</div>`).prop("hidden", false);
	target.html(rows.map((row, index) => `<button data-index="${index}"><strong>${frappe.utils.escape_html(row.item_name)}</strong><span>${frappe.utils.escape_html(row.easy_erp_bangla_name || row.item_code)}</span><small>${frappe.utils.escape_html(row.stock_uom)} · ${reckon_easy_erp.format_currency(row.rate, state.currency)}</small></button>`).join("")).prop("hidden", false);
	target.find("button").on("click", function () {
		const row = rows[Number(this.dataset.index)];
		const existing = state.items.find((item) => item.item_code === row.item_code);
		if (existing) existing.qty += 1;
		else state.items.push({ item_code: row.item_code, item_name: row.item_name, uom: row.stock_uom, qty: 1, rate: row.rate, discount_percentage: 0 });
		target.prop("hidden", true);
		container.find(".easy-item-search").val("").focus();
		render_cart(container, state);
	});
}

function render_cart(container, state) {
	const target = container.find(".easy-cart");
	if (!state.items.length) return target.html(`<div class="easy-empty-cart">${__("এখনও কোনো পণ্য যোগ করা হয়নি")}</div>`);
	target.html(`<div class="easy-cart-table"><div class="easy-cart-head"><span>${__("পণ্য")}</span><span>${__("পরিমাণ")}</span><span>${__("দর")}</span><span>${__("ছাড় %")}</span><span>${__("মোট")}</span><span></span></div>
		${state.items.map((item, index) => `<div class="easy-cart-row" data-index="${index}"><span><a class="easy-item-link" href="#" data-index="${index}">${frappe.utils.escape_html(item.item_name)}</a><small>${frappe.utils.escape_html(item.item_code)}</small></span><input class="form-control qty" type="number" min="0.001" step="any" value="${item.qty}"><input class="form-control rate" type="number" min="0" step="any" value="${item.rate}"><input class="form-control discount" type="number" min="0" max="100" step="any" value="${item.discount_percentage}"><strong>${reckon_easy_erp.format_currency(line_total(item), state.currency)}</strong><button class="remove" aria-label="${__("মুছুন")}">×</button></div>`).join("")}</div>`);
	target.find(".easy-item-link").on("click", function (event) {
		event.preventDefault();
		frappe.set_route("Form", "Item", state.items[Number(this.dataset.index)].item_code);
	});
	target.find("input").on("change input", function () {
		const row = $(this).closest(".easy-cart-row"); const item = state.items[Number(row.data("index"))];
		if ($(this).hasClass("qty")) item.qty = Number(this.value || 0);
		if ($(this).hasClass("rate")) item.rate = Number(this.value || 0);
		if ($(this).hasClass("discount")) item.discount_percentage = Number(this.value || 0);
		render_totals(container, null, state); row.find("> strong").text(reckon_easy_erp.format_currency(line_total(item), state.currency));
	});
	target.find(".remove").on("click", function () { state.items.splice(Number($(this).closest(".easy-cart-row").data("index")), 1); render_cart(container, state); render_totals(container, null, state); });
	render_totals(container, null, state);
}

function render_totals(container, controls, state) {
	const grand = state.items.reduce((sum, item) => sum + line_total(item), 0);
	const paid = Number(controls?.paid_amount?.get_value() || container.find(".paid-control input").val() || 0);
	container.find(".grand-total").text(reckon_easy_erp.format_currency(grand, state.currency)); container.find(".paid-total").text(reckon_easy_erp.format_currency(paid, state.currency)); container.find(".due-total").text(reckon_easy_erp.format_currency(Math.max(grand - paid, 0), state.currency));
}

function save_sale(container, controls, state, submit) {
	if (!controls.customer.get_value() || !controls.warehouse.get_value() || !state.items.length) return frappe.msgprint(__("ক্রেতা, গুদাম ও অন্তত একটি পণ্য দিন"));
	const paid = Number(controls.paid_amount.get_value() || 0);
	if (paid > 0 && !controls.payment_mode.get_value()) return frappe.msgprint(__("পেমেন্ট পদ্ধতি নির্বাচন করুন"));
	const values = { request_id: state.request_id, customer: controls.customer.get_value(), posting_date: controls.posting_date.get_value(), warehouse: controls.warehouse.get_value(), items: state.items, paid_amount: paid, payment_mode: controls.payment_mode.get_value(), payment_reference: controls.payment_reference.get_value(), submit };
	container.find(".submit-sale, .save-draft").prop("disabled", true);
	frappe.call({ method: "reckon_easy_erp.sales_api.create_sale", type: "POST", args: { values }, freeze: true, freeze_message: __("বিক্রয় সংরক্ষণ হচ্ছে...") })
		.then(({ message }) => frappe.set_route("Form", "Sales Invoice", message.sales_invoice))
		.finally(() => container.find(".submit-sale, .save-draft").prop("disabled", false));
}

function line_total(item) { return Number(item.qty || 0) * Number(item.rate || 0) * (1 - Number(item.discount_percentage || 0) / 100); }
function request_id() { return globalThis.crypto?.randomUUID?.() || `easy-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
