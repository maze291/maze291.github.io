SELECT
    snapshot_date,
    freshness_bucket AS quality_dimension,
    sample_signal_count,
    sample_share,
    avg_confidence_score
FROM public_demo.vw_freshness_quality
ORDER BY snapshot_date DESC, sample_signal_count DESC, freshness_bucket;
