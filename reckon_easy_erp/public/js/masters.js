frappe.provide("reckon_easy_erp");

reckon_easy_erp.make_master_page = function ({ wrapper, title, doctype, search_method, create_method, fields }) {
	const page = frappe.ui.make_app_page({ parent: wrapper, title: __(title), single_column: true });
	page.main.addClass("easy-erp-page");
	page.main.html(`
		<section class="easy-erp-master-panel">
			<div class="easy-erp-master-toolbar">
				<div class="easy-erp-search-wrap">
					<div class="easy-erp-master-search"></div>
					<div class="easy-erp-search-dropdown" hidden></div>
				</div>
				<button class="btn btn-primary btn-lg easy-erp-new">${__("নতুন যোগ করুন")}</button>
			</div>
			<div class="easy-erp-list-heading"><h3>${__("তালিকা")}</h3><span class="easy-erp-result-count"></span></div>
			<section class="easy-erp-results"></section>
		</section>`);
	const search = frappe.ui.form.make_control({
		parent: page.main.find(".easy-erp-master-search"),
		df: { fieldtype: "Data", placeholder: __("নাম, মোবাইল বা বারকোড দিয়ে খুঁজুন") },
		render_input: true,
	});
	if (!frappe.model.can_create(doctype)) page.main.find(".easy-erp-new").remove();
	let timer;
	search.$input.on("input", () => {
		clearTimeout(timer);
		timer = setTimeout(() => load_results(page.main, search_method, search.get_value(), search), 250);
	});
	search.$input.on("focus", () => {
		if (search.get_value()) page.main.find(".easy-erp-search-dropdown").prop("hidden", false);
	});
	$(document).off("click.easy-erp-master").on("click.easy-erp-master", (event) => {
		if (!page.main.find(".easy-erp-search-wrap")[0]?.contains(event.target)) {
			page.main.find(".easy-erp-search-dropdown").prop("hidden", true);
		}
	});
	page.main.find(".easy-erp-new").on("click", () => show_create_dialog({ title, create_method, fields, refresh: () => load_results(page.main, search_method, search.get_value()) }));
	load_results(page.main, search_method, "");
};

function load_results(container, method, query) {
	const target = container.find(".easy-erp-results").html(`<div class="easy-erp-loading">${__("Loading...")}</div>`);
	frappe.call(method, { query }).then(({ message }) => {
		const rows = message || [];
		container.find(".easy-erp-result-count").text(__("{0}টি রেকর্ড", [rows.length]));
		if (!message?.length) {
			target.html(`<div class="easy-erp-empty">${__("কোনো তথ্য পাওয়া যায়নি")}</div>`);
			render_dropdown(container, [], query);
			return;
		}
		target.html(rows.map(result_card).join(""));
		render_dropdown(container, rows, query);
	});
}

function result_card(row) {
	const title = row.display_name || row.item_name || row.name;
	const initial = Array.from(title.trim())[0] || "•";
	const details = [
		["phone", row.mobile_no],
		["folder-normal", row.group || row.item_group],
		["user", row.type],
		["tag", row.stock_uom],
	].filter((entry) => entry[1]);
	return `<article class="easy-erp-result">
		<div class="easy-erp-result-avatar">${frappe.utils.escape_html(initial.toUpperCase())}</div>
		<div class="easy-erp-result-body">
			<div class="easy-erp-result-title"><strong>${frappe.utils.escape_html(title)}</strong>
				${row.easy_erp_bangla_name ? `<span>${frappe.utils.escape_html(row.easy_erp_bangla_name)}</span>` : ""}</div>
			<div class="easy-erp-result-details">${details.map(([icon, value]) =>
				`<span>${frappe.utils.icon(icon, "sm")}${frappe.utils.escape_html(value)}</span>`).join("")}</div>
			<small>${__("রেকর্ড আইডি")}: ${frappe.utils.escape_html(row.item_code || row.name)}</small>
		</div>
	</article>`;
}

function render_dropdown(container, rows, query) {
	const dropdown = container.find(".easy-erp-search-dropdown");
	if (!query) return dropdown.prop("hidden", true).empty();
	if (!rows.length) {
		dropdown.html(`<div class="easy-erp-dropdown-empty">${__("কোনো মিল পাওয়া যায়নি")}</div>`).prop("hidden", false);
		return;
	}
	dropdown.html(rows.slice(0, 8).map((row, index) => {
		const title = row.display_name || row.item_name || row.name;
		const meta = [row.mobile_no, row.group || row.item_group, row.type, row.stock_uom].filter(Boolean).join(" · ");
		return `<button type="button" class="easy-erp-dropdown-item" data-index="${index}">
			<strong>${frappe.utils.escape_html(title)}</strong>
			${row.easy_erp_bangla_name ? `<span>${frappe.utils.escape_html(row.easy_erp_bangla_name)}</span>` : ""}
			<small>${frappe.utils.escape_html(meta || row.name)}</small>
		</button>`;
	}).join("")).prop("hidden", false);
	dropdown.find(".easy-erp-dropdown-item").on("click", function () {
		const row = rows[Number(this.dataset.index)];
		const title = row.display_name || row.item_name || row.name;
		container.find(".easy-erp-master-search input").val(title).trigger("input");
		dropdown.prop("hidden", true);
	});
}

function show_create_dialog({ title, create_method, fields, refresh }) {
	const dialog = new frappe.ui.Dialog({
		title: __("নতুন {0}", [__(title)]),
		fields,
		primary_action_label: __("সংরক্ষণ করুন"),
		primary_action(values) {
			dialog.disable_primary_action();
			frappe.call({ method: create_method, type: "POST", args: { values }, freeze: true })
				.then(({ message }) => {
					dialog.hide();
					frappe.show_alert({ message: __("{0} তৈরি হয়েছে", [message.display_name || message.item_name]), indicator: "green" });
					refresh();
				})
				.finally(() => dialog.enable_primary_action());
		},
	});
	dialog.show();
}

reckon_easy_erp.party_fields = function (type) {
	const customer = type === "Customer";
	return [
		{ fieldname: "party_name", fieldtype: "Data", label: __("নাম"), reqd: 1 },
		{ fieldname: "mobile_no", fieldtype: "Data", label: __("মোবাইল নম্বর") },
		{ fieldname: "party_type", fieldtype: "Select", label: __("ধরন"), options: "Company\nIndividual", default: "Company", reqd: 1 },
		{ fieldname: "group", fieldtype: "Link", label: customer ? __("Customer Group") : __("Supplier Group"), options: customer ? "Customer Group" : "Supplier Group", reqd: 1 },
		...(customer ? [{ fieldname: "territory", fieldtype: "Link", label: __("Territory"), options: "Territory", reqd: 1 }] : []),
	];
};

reckon_easy_erp.item_fields = function () {
	return [
		{ fieldname: "item_code", fieldtype: "Data", label: __("Item Code"), reqd: 1 },
		{ fieldname: "item_name", fieldtype: "Data", label: __("Item Name"), reqd: 1 },
		{ fieldname: "bangla_name", fieldtype: "Data", label: __("Bangla Item Name") },
		{ fieldname: "item_group", fieldtype: "Link", label: __("Item Group"), options: "Item Group", reqd: 1 },
		{ fieldname: "stock_uom", fieldtype: "Link", label: __("Unit"), options: "UOM", reqd: 1 },
		{ fieldname: "barcode", fieldtype: "Data", label: __("Barcode") },
		{ fieldtype: "Section Break", label: __("Prices and Opening Stock") },
		{ fieldname: "selling_price_list", fieldtype: "Link", label: __("Selling Price List"), options: "Price List" },
		{ fieldname: "selling_rate", fieldtype: "Currency", label: __("Sales Price"), non_negative: 1 },
		{ fieldname: "buying_price_list", fieldtype: "Link", label: __("Buying Price List"), options: "Price List" },
		{ fieldname: "buying_rate", fieldtype: "Currency", label: __("Purchase Price"), non_negative: 1 },
		{ fieldname: "default_warehouse", fieldtype: "Link", label: __("Default Warehouse"), options: "Warehouse" },
		{ fieldname: "opening_quantity", fieldtype: "Float", label: __("Opening Quantity"), non_negative: 1 },
		{ fieldname: "valuation_rate", fieldtype: "Currency", label: __("Valuation Rate"), non_negative: 1 },
		{ fieldtype: "Section Break", label: __("Batch and Expiry") },
		{ fieldname: "has_batch_no", fieldtype: "Check", label: __("Track Batch") },
		{ fieldname: "has_expiry_date", fieldtype: "Check", label: __("Track Expiry Date"), depends_on: "eval:doc.has_batch_no" },
	];
};
