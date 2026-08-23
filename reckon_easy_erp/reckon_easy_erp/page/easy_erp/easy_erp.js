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
		{ symbol: "👥", label: __("ক্রেতা"), hint: __("ক্রেতা খুঁজুন বা যোগ করুন"), route: "customer", feature: "sales", group: "masters", ready: true },
		{ symbol: "🏢", label: __("সরবরাহকারী"), hint: __("সরবরাহকারী পরিচালনা করুন"), route: "supplier", feature: "purchase", group: "masters", ready: true },
		{ symbol: "📦", label: __("পণ্য"), hint: __("পণ্য, দাম ও বারকোড"), route: "item", feature: "stock", group: "masters", ready: true },
		{ symbol: "🛒", label: __("বিক্রয় করুন"), hint: __("নতুন বিক্রয় তৈরি করুন"), route: "easy-sale", feature: "sales", group: "sales" },
		{ symbol: "💵", label: __("টাকা গ্রহণ করুন"), hint: __("বকেয়া টাকা গ্রহণ করুন"), route: "easy-collection", feature: "sales", group: "sales" },
		{ symbol: "🧾", label: __("খরচ লিখুন"), hint: __("ব্যবসার খরচ যোগ করুন"), route: "easy-expense", feature: "sales", group: "sales" },
		{ symbol: "🛍️", label: __("পণ্য কিনুন"), hint: __("নতুন ক্রয় তৈরি করুন"), route: "easy-purchase", feature: "purchase", group: "stock" },
		{ symbol: "📥", label: __("পণ্য গ্রহণ করুন"), hint: __("গুদামে পণ্য গ্রহণ করুন"), route: "easy-goods-received", feature: "purchase", group: "stock" },
		{ symbol: "💳", label: __("সরবরাহকারীকে পেমেন্ট"), hint: __("সরবরাহকারীর পাওনা দিন"), route: "easy-supplier-payment", feature: "purchase", group: "stock" },
		{ symbol: "📊", label: __("বর্তমান স্টক"), hint: __("গুদামের মজুত দেখুন"), route: "easy-stock", feature: "stock", group: "stock" },
		{ symbol: "🧑‍💼", label: __("কর্মচারী"), hint: __("কর্মচারীর তথ্য"), route: "easy-employees", feature: "hr", group: "people" },
		{ symbol: "✅", label: __("হাজিরা"), hint: __("আজকের হাজিরা দিন"), route: "easy-attendance", feature: "hr", group: "people" },
		{ symbol: "📅", label: __("ছুটি"), hint: __("ছুটির আবেদন ও অনুমোদন"), route: "easy-leave", feature: "hr", group: "people" },
		{ symbol: "💰", label: __("বেতন তৈরি করুন"), hint: __("মাসিক বেতন প্রক্রিয়া"), route: "easy-payroll", feature: "payroll", group: "people" },
		{ symbol: "📈", label: __("রিপোর্ট"), hint: __("ব্যবসার রিপোর্ট দেখুন"), route: "easy-reports", group: "reports" },
	].filter((action) => !action.feature || context.features[action.feature]);
	const groups = [
		["masters", __("দ্রুত শুরু"), __("ব্যবসার প্রাথমিক তথ্য")],
		["sales", __("বিক্রয় ও টাকা"), __("দৈনন্দিন বিক্রয় ও আদায়")],
		["stock", __("ক্রয় ও স্টক"), __("ক্রয়, পেমেন্ট ও গুদাম")],
		["people", __("কর্মী ও বেতন"), __("হাজিরা, ছুটি ও বেতন")],
		["reports", __("রিপোর্ট"), __("ব্যবসার সারসংক্ষেপ")],
	];
	const sections = groups.map(([key, title, subtitle]) => {
		const cards = actions.filter((action) => action.group === key).map(action_card).join("");
		return cards ? `<section class="easy-erp-section"><div class="easy-erp-section-heading">
			<div><h3>${frappe.utils.escape_html(title)}</h3><p>${frappe.utils.escape_html(subtitle)}</p></div>
		</div><div class="easy-erp-actions">${cards}</div></section>` : "";
	}).join("");
	const company = context.access?.company || __("Company not configured");
	container.html(`
		<div class="easy-erp-shell">
			<section class="easy-erp-hero">
				<div class="easy-erp-hero-copy"><span class="easy-erp-eyebrow">${__("RECKON EASY ERP")}</span>
				<h2>${__("স্বাগতম")}, ${frappe.utils.escape_html(context.full_name)}</h2>
				<p><span class="easy-erp-status-dot"></span>${frappe.utils.escape_html(company)}</p></div>
				<button class="easy-erp-language">বাংলা <span>/</span> English</button>
			</section>
			${context.setup_complete ? "" : `<div class="easy-erp-notice"><span>⚙️</span><div><strong>${__("সেটআপ সম্পন্ন করুন")}</strong><p>${__("Easy ERP setup is not complete.")}</p></div></div>`}
			${sections}
		</div>`);
	container.find(".easy-erp-action:not([disabled])").on("click", (event) => frappe.set_route(event.currentTarget.dataset.route));
	container.find(".easy-erp-language").on("click", () => {
		const language = context.language === "bn" ? "en" : "bn";
		frappe.call("frappe.client.set_value", { doctype: "User", name: frappe.session.user, fieldname: "language", value: language })
			.then(() => window.location.reload());
	});
}

function action_card(action) {
	return `<button class="easy-erp-action${action.ready ? "" : " is-upcoming"}" data-route="${frappe.utils.escape_html(action.route)}" ${action.ready ? "" : "disabled"}>
		<span class="easy-erp-action-symbol" aria-hidden="true">${action.symbol}</span>
		<span class="easy-erp-action-copy"><strong>${frappe.utils.escape_html(action.label)}</strong><small>${frappe.utils.escape_html(action.hint)}</small></span>
		${action.ready ? '<span class="easy-erp-action-arrow">→</span>' : `<span class="easy-erp-soon">${__("শীঘ্রই")}</span>`}
	</button>`;
}
