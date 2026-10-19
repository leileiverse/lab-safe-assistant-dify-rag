# 2026-06-15 Evidence Screenshot Examples

These PNG files are evidence-card examples generated from live local API responses on 2026-06-15.

## Files

- `health_8088_20260615.png`: live `/health` status, including `kb_loaded=3009` and `dify_reachable=true`.
- `meta_3009_20260615.png`: live `/api/meta` status, including `knowledge_base_rows=3009` and `knowledge_base_imported=3009`.
- `eval_50_performance_20260615.png`: 50-question regression summary from `artifacts/eval_50_current_20260615_rerun/eval_set_v2_50_summary.md`.

## Notes

- These are not Dify console screenshots. They are generated evidence cards based on current project outputs.
- For final defense or acceptance, also capture manual browser screenshots of:
  - Dify Dataset document count and indexing status.
  - Dify App dataset binding page.
  - `http://127.0.0.1:8088/health`.
  - `http://127.0.0.1:8088/api/meta`.
  - Latest runtime summary and 50-question regression summary.
