CREATE OR REPLACE FUNCTION public.claim_due_asset_schedules(p_worker_id text, p_limit integer DEFAULT 50, p_stale_after interval DEFAULT interval '30 minutes')
RETURNS TABLE (asset_id uuid, user_id uuid, asset_name text, geo_boundary geometry, refresh_frequency_days integer, alert_threshold numeric, locked_by text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT s.asset_id
    FROM public.asset_schedules s
    JOIN public.monitored_assets a ON a.id = s.asset_id
    WHERE s.next_run_at <= timezone('utc', now())
      AND (s.locked_at IS NULL OR s.locked_at < timezone('utc', now()) - p_stale_after)
      AND a.processing_status IN ('pending', 'complete', 'failed')
    ORDER BY s.next_run_at
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
    FOR UPDATE OF s SKIP LOCKED
  ), claimed AS (
    UPDATE public.asset_schedules s
    SET locked_at = timezone('utc', now()), locked_by = p_worker_id, updated_at = timezone('utc', now())
    FROM candidates c
    WHERE s.asset_id = c.asset_id
    RETURNING s.asset_id, s.locked_by
  )
  SELECT a.id, a.user_id, a.asset_name::text, a.geo_boundary, a.refresh_frequency_days, a.alert_threshold, c.locked_by
  FROM claimed c JOIN public.monitored_assets a ON a.id = c.asset_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_due_asset_schedules(text, integer, interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_due_asset_schedules(text, integer, interval) TO service_role;
