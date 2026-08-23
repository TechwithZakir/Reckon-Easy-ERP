# Phase 3: sales and customer collection

## Standard documents

- Sales Invoice with `update_stock` for sales and credit notes
- Payment Entry for sale receipts and later customer collections
- GL Entry, Stock Ledger Entry and Payment Ledger Entry generated only by ERPNext controllers

## Easy routes

- `/app/easy-sale`
- `/app/easy-collection`
- `/app/easy-sales-return`

Native Sales Invoice and Payment Entry lists retain their standard capabilities
and receive Easy ERP shortcut buttons for authorized users.

## Reliability

Every composite request carries an immutable request ID. Unique custom fields on
Sales Invoice and Payment Entry prevent duplicate invoices or payments when a
user double-clicks, refreshes, or retries a request. The invoice and its payment
are created in one Frappe request transaction, so an exception rolls back both.

## Deployment gate

Run migrations and builds on `erp.reckon.tech`, but execute the integration test
suite only on a separate test site. Verify cash sale, credit sale, partial
collection, retry behavior, return stock movement, restricted-user permissions,
GL entries, stock ledger entries and outstanding amounts before Phase 3 is
declared complete.
