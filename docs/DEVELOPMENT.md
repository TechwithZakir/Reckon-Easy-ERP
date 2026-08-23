# Development and compatibility

## Supported releases

The minimum supported major release is Frappe/ERPNext 15. The current ERPNext
major release and later compatible releases are supported after the same test
suite passes against that release. HRMS must match the selected Frappe branch.

Public document APIs and document controller lifecycles are preferred. Any
release-specific behavior must be isolated in `reckon_easy_erp.compat` and
covered by tests. Version-number conditionals in Pages and business services
are not permitted.

## Required test matrix

Each release must be tested in a separate Bench/site:

1. Fresh installation and migration.
2. Upgrade from the previous supported app version.
3. Python tests and transaction ledger assertions.
4. Desk asset build.
5. Restricted-user permission and direct-route tests.
6. Mobile viewport and Bangla print rendering checks.

Declaring a dependency range does not by itself certify compatibility.
