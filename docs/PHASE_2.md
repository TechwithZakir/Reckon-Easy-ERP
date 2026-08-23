# Phase 2: simplified masters

## Standard records used

- Customer and Supplier for parties
- Item and Item Barcode for products and barcode lookup
- Item Price for buying and selling prices
- Stock Reconciliation for opening stock

The only added business-master field is `Item.easy_erp_bangla_name`. No party,
item, price, or stock transaction is duplicated in a custom DocType.

## Routes

Native Frappe lists:

- `/app/customer`
- `/app/supplier`
- `/app/item`

Simplified creation Pages:

- `/app/easy-customer-entry`
- `/app/easy-supplier-entry`
- `/app/easy-item-entry`

The native lists retain Frappe filtering, sorting, pagination, saved views and
bulk actions. Easy ERP users with create permission see an **Easy Add** action
that opens the corresponding simplified Page. Dashboard master cards expose
both list and entry actions.

## Deployment

Run against a test site before production:

```bash
bench --site test.local migrate
bench build --app reckon_easy_erp
bench --site test.local clear-cache
bench --site test.local run-tests --app reckon_easy_erp
```

Verify with restricted Sales, Purchase and Stock users. Confirm that users can
only create the master types assigned to their Easy ERP roles and that opening
stock requires both Stock Reconciliation submit permission and `can_submit` in
Easy ERP User Access.

## Acceptance evidence required

1. Customer creation, normalized mobile search, and duplicate rejection.
2. Supplier creation and mobile search.
3. Item lookup by code, English name, Bangla name, and exact barcode.
4. Buying and selling Item Price records created through controllers.
5. Submitted Stock Reconciliation for opening quantity.
6. Resulting Bin quantity matches the opening quantity.
7. Restricted users cannot call unauthorized master APIs directly.
8. Pages render on mobile in Bangla and English.
