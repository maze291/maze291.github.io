# Public Sample SQL Outputs

These CSVs are generated from the anonymized 25-row May 29 public sample using `sql/public_sample_dashboard_views.sql`.

They demonstrate the same dashboard metric logic used by the private DuckDB reporting layer, but they are not intended to estimate the full GCC analyst market.

To regenerate:

```powershell
python scripts\export_public_sample_duckdb_views.py
```
