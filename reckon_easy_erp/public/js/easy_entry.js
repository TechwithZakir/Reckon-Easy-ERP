frappe.provide("reckon_easy_erp");

reckon_easy_erp.make_entry_page = function ({ wrapper, title, subtitle, list_route, method, sections }) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __(title), single_column: true });
	page.main.addClass("easy-erp-page easy-entry-page");
	page.main.html(`<div class="easy-entry-shell">
		<header class="easy-entry-header"><button class="btn btn-default easy-back-to-list easy-entry-list"><span aria-hidden="true">←</span>${__("তালিকায় ফিরুন")}</button>
		<div><span>${__("সহজ এন্ট্রি")}</span><h2>${__(title)}</h2><p>${__(subtitle)}</p></div></header>
		<div class="easy-entry-form"></div>
		<footer class="easy-entry-footer"><button class="btn btn-default easy-entry-cancel">${__("বাতিল")}</button>
		<button class="btn btn-primary btn-lg easy-entry-save">${__("সংরক্ষণ করুন")}</button></footer>
	</div>`);
	const controls = {};
	const form = page.main.find(".easy-entry-form");
	sections.forEach((section) => {
		const block = $(`<section class="easy-entry-section"><div class="easy-entry-section-title"><h3>${__(section.title)}</h3>
			${section.description ? `<p>${__(section.description)}</p>` : ""}</div><div class="easy-entry-grid"></div></section>`).appendTo(form);
		section.fields.forEach((df) => {
			const cell = $('<div class="easy-entry-field"></div>').appendTo(block.find(".easy-entry-grid"));
			if (df.wide) cell.addClass("is-wide");
			controls[df.fieldname] = frappe.ui.form.make_control({ parent: cell, df: { ...df, label: __(df.label) }, render_input: true });
		});
	});
	frappe.call("reckon_easy_erp.master_api.get_entry_defaults").then(({ message }) => {
		Object.entries(message || {}).forEach(([key, value]) => value && controls[key]?.set_value(value));
	});
	const go_list = () => frappe.set_route(list_route);
	page.main.find(".easy-entry-list, .easy-entry-cancel").on("click", go_list);
	page.main.find(".easy-entry-save").on("click", function () {
		const values = Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.get_value()]));
		const missing = Object.entries(controls).find(([, control]) => control.df.reqd && !control.get_value());
		if (missing) {
			missing[1].set_focus();
			return frappe.msgprint(__("প্রয়োজনীয় তথ্য পূরণ করুন"));
		}
		const button = $(this).prop("disabled", true);
		frappe.call({ method, type: "POST", args: { values }, freeze: true, freeze_message: __("সংরক্ষণ হচ্ছে...") })
			.then(({ message }) => show_success(page.main, message, title, go_list, () => {
				Object.values(controls).forEach((control) => control.set_value(control.df.default || ""));
				page.main.find(".easy-entry-shell").removeClass("is-complete");
			}))
			.finally(() => button.prop("disabled", false));
	});
};

function show_success(container, result, title, go_list, add_another) {
	const name = result.display_name || result.item_name || result.name;
	container.find(".easy-entry-success").remove();
	const success = $(`<div class="easy-entry-success"><div class="easy-entry-success-icon">✓</div>
		<h2>${__("সফলভাবে তৈরি হয়েছে")}</h2><p>${frappe.utils.escape_html(name)}</p>
		<div><button class="btn btn-default add-another">${__("আরও একটি যোগ করুন")}</button>
		<button class="btn btn-primary view-list">${__("তালিকা দেখুন")}</button></div></div>`).appendTo(container.find(".easy-entry-shell"));
	container.find(".easy-entry-shell").addClass("is-complete");
	success.find(".view-list").on("click", go_list);
	success.find(".add-another").on("click", () => { success.remove(); add_another(); });
}
