SELECT
    snapshot_date,
    total_sample_rows,
    missing_country_count,
    missing_or_unknown_city_count,
    missing_role_category_count,
    no_detected_skills_count,
    unknown_freshness_count,
    salary_coverage_pct,
    avg_confidence_score,
    scope_note
FROM public_demo.vw_sample_readiness
ORDER BY snapshot_date DESC;
