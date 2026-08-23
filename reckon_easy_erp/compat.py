"""Compatibility boundary for supported Frappe/ERPNext releases.

Business services must use helpers from this module when a public API differs
between supported major releases. Keep version checks out of controllers and UI.
"""

from importlib.metadata import PackageNotFoundError, version


def installed_version(package: str) -> str | None:
	try:
		return version(package)
	except PackageNotFoundError:
		return None


def runtime_versions() -> dict[str, str | None]:
	return {name: installed_version(name) for name in ("frappe", "erpnext", "hrms")}
