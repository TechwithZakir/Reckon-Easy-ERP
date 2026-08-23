# Reckon Easy ERP

Bangladesh-first, mobile-friendly workflows over ERPNext and HRMS.

## Compatibility

- Frappe Framework and ERPNext 15 or later
- HRMS release compatible with the installed Frappe/ERPNext release
- Python versions supported by the selected Frappe release

The app uses standard ERPNext and HRMS documents as the accounting, stock, HR,
and payroll source of truth. It does not modify framework or ERPNext core files.

## Development installation

```bash
bench get-app https://github.com/TechwithZakir/Reckon-Easy-ERP.git
bench --site your-site.local install-app reckon_easy_erp
bench --site your-site.local migrate
bench build --app reckon_easy_erp
```

Open `/app/easy-erp` after installation. A System Manager can finish initial
configuration at `/app/easy-erp-setup`.

## Verification

Run the app's tests in a Bench containing ERPNext and HRMS:

```bash
bench --site test.local run-tests --app reckon_easy_erp
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the supported-version policy
and development gates.

## Implementation status

- Phase 1: foundation, configuration, roles, Workspace, setup and Bangla dashboard
- Phase 2: simplified Customer, Supplier and Item masters implemented; live Bench verification required

Phase 2 deployment and acceptance checks are documented in
[docs/PHASE_2.md](docs/PHASE_2.md).
