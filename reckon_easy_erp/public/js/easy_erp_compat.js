frappe.provide("reckon_easy_erp");

reckon_easy_erp.request_id = () => globalThis.crypto?.randomUUID?.()
	|| `easy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
reckon_easy_erp.format_money = (value) => Number(value || 0).toLocaleString(
	undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }
);

reckon_easy_erp.guard_autocomplete = (container) => {
	const root = container?.get?.(0) || container;
	if (!root || root.dataset.easyAutocompleteGuard) return;
	root.dataset.easyAutocompleteGuard = "1";
	let frame;
	let observer;
	const observation = { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style", "aria-expanded"] };
	const refresh = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			observer.disconnect();
			root.querySelectorAll(".easy-transaction-section, .easy-entry-section").forEach((section) => {
				section.classList.remove("has-open-autocomplete");
				section.style.removeProperty("--easy-autocomplete-space");
			});
			root.querySelectorAll(".awesomplete > ul, .autocomplete-items, .frappe-control .dropdown-menu").forEach((menu) => {
				if (!menu.getClientRects().length || getComputedStyle(menu).visibility === "hidden" || !menu.children.length) return;
				const section = menu.closest(".easy-transaction-section, .easy-entry-section");
				if (!section) return;
				const overflow = Math.ceil(menu.getBoundingClientRect().bottom - section.getBoundingClientRect().bottom + 12);
				if (overflow > 0) {
					section.classList.add("has-open-autocomplete");
					section.style.setProperty("--easy-autocomplete-space", `${overflow}px`);
				}
			});
			observer.observe(root, observation);
		});
	};
	observer = new MutationObserver(refresh);
	observer.observe(root, observation);
	root.addEventListener("input", refresh, true);
	root.addEventListener("focusin", refresh, true);
	root.addEventListener("focusout", () => setTimeout(refresh, 0), true);
};

// Compatibility for cached Phase 2 Page scripts. The current Page scripts
// redirect directly; these helpers can be removed after all sites upgrade.
reckon_easy_erp.party_fields = () => [];
reckon_easy_erp.item_fields = () => [];
reckon_easy_erp.make_master_page = ({ doctype, title }) => {
	const routes = {
		Customer: "Customer",
		Supplier: "Supplier",
		Item: "Item",
		Customers: "Customer",
		Suppliers: "Supplier",
		Products: "Item",
	};
	frappe.set_route("List", routes[doctype] || routes[title] || doctype);
};
