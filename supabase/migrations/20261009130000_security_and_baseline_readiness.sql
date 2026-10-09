-- H1 + H2: security grants, baseline observations, and warm-up lifecycle.

ALTER TABLE public.monitored_assets
  DROP CONSTRAINT monitored_assets_processing_status_allowed;

ALTER TABLE public.monitored_assets
  ADD CONSTRAINT monitored_assets_processing_status_allowed
  CHECK (processing_status IN ('pending', 'warming_up', 'ready', 'processing', 'complete', 'failed'));

CREATE TABLE public.asset_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.monitored_assets(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  scene_datetime timestamptz NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  mean_reflectance numeric NOT NULL,
  cloud_cover numeric(5, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT asset_observations_scene_id_not_blank CHECK (length(btrim(scene_id)) > 0),
  CONSTRAINT asset_observations_reflectance_finite CHECK (mean_reflectance IS NOT NULL),
  CONSTRAINT asset_observations_cloud_cover_range CHECK (cloud_cover BETWEEN 0 AND 100),
  CONSTRAINT asset_observations_asset_scene_unique UNIQUE (asset_id, scene_id)
);

CREATE INDEX asset_observations_asset_date_idx
  ON public.asset_observations (asset_id, scene_datetime DESC);

ALTER TABLE public.asset_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_observations_select_own_asset ON public.asset_observations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.monitored_assets a
      WHERE a.id = asset_observations.asset_id
        AND a.user_id = auth.uid()
    )
  );

-- The worker uses service_role for inserts. No authenticated insert/update policy is
-- intentionally granted, preventing users from fabricating baseline observations.

REVOKE ALL ON FUNCTION public.claim_due_asset_schedules(text, integer, interval) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_due_asset_schedules(text, integer, interval) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_due_asset_schedules(text, integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_asset_schedules(text, integer, interval) TO service_role;
