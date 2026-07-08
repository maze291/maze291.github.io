SELECT
    snapshot_date,
    'role' AS metric_type,
    role_category AS metric_name,
    sample_signal_count AS signal_count,
    sample_share AS signal_share,
    avg_confidence_score
FROM public_demo.vw_role_demand

UNION ALL

SELECT
    snapshot_date,
    'skill' AS metric_type,
    skill AS metric_name,
    skill_mention_count AS signal_count,
    skill_demand_share AS signal_share,
    avg_confidence_score
FROM public_demo.vw_skill_demand

ORDER BY snapshot_date DESC, metric_type, signal_count DESC, metric_name;
