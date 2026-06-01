SELECT
    snapshot_date,
    total_sample_rows,
    salary_coverage_pct,
    avg_confidence_score,
    missing_or_unknown_city_count,
    no_detected_skills_count,
    unknown_freshness_count,
    sample_scope
FROM public_demo.vw_sample_readiness
ORDER BY snapshot_date DESC;
