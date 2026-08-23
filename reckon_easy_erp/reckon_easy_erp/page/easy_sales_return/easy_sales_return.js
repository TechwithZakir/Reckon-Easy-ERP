frappe.pages["easy-sales-return"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __("সহজ বিক্রয় ফেরত"), single_column: true });
	page.main.addClass("easy-erp-page").html(`<div class="easy-transaction-shell easy-return-shell"><header class="easy-transaction-header"><div><span>${__("ফেরত")}</span><h2>${__("বিক্রয় ফেরত")}</h2><p>${__("একটি জমা দেওয়া বিক্রয়ের সব পণ্য ফেরত নিন")}</p></div></header><section class="easy-transaction-section"><div class="easy-transaction-grid"><div class="invoice-control"></div><div class="date-control"></div></div><div class="easy-return-warning">⚠️ ${__("এটি মূল বিক্রয়ের সম্পূর্ণ ক্রেডিট নোট তৈরি করবে।")}</div></section><footer class="easy-transaction-footer"><button class="btn btn-primary btn-lg submit-return">${__("ফেরত নিশ্চিত করুন")}</button></footer></div>`);
	const invoice = frappe.ui.form.make_control({ parent: page.main.find(".invoice-control"), df: { fieldtype: "Link", options: "Sales Invoice", label: __("মূল বিক্রয়"), reqd: 1, get_query: () => ({ filters: { docstatus: 1, is_return: 0 } }) }, render_input: true });
	const date = frappe.ui.form.make_control({ parent: page.main.find(".date-control"), df: { fieldtype: "Date", label: __("ফেরতের তারিখ"), default: frappe.datetime.get_today(), reqd: 1 }, render_input: true });
	date.set_value(frappe.datetime.get_today());
	page.main.find(".submit-return").on("click", function () {
		if (!invoice.get_value()) return frappe.msgprint(__("মূল বিক্রয় নির্বাচন করুন"));
		const values = { request_id: reckon_easy_erp.request_id(), sales_invoice: invoice.get_value(), posting_date: date.get_value() }; const button = $(this).prop("disabled", true);
		frappe.call({ method: "reckon_easy_erp.sales_api.create_sales_return", type: "POST", args: { values }, freeze: true }).then(({ message }) => frappe.set_route("Form", "Sales Invoice", message.sales_invoice)).finally(() => button.prop("disabled", false));
	});
};
