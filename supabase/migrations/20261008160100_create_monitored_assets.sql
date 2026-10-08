CREATE TABLE public.monitored_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name varchar(255) NOT NULL,
  geo_boundary geometry(Polygon, 4326) NOT NULL,
  risk_score numeric(5, 2) NOT NULL DEFAULT 0,
  processing_status varchar(20) NOT NULL DEFAULT 'pending',
  refresh_frequency_days integer NOT NULL DEFAULT 5,
  alert_threshold numeric(5, 2) NOT NULL DEFAULT 75,
  last_processed_at timestamptz,
  last_scene_id text,
  last_error_at timestamptz,
  last_error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT monitored_assets_name_not_blank CHECK (length(btrim(asset_name)) > 0),
  CONSTRAINT monitored_assets_geo_boundary_valid CHECK (ST_IsValid(geo_boundary)),
  CONSTRAINT monitored_assets_risk_score_range CHECK (risk_score BETWEEN 0 AND 100),
  CONSTRAINT monitored_assets_processing_status_allowed CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed')),
  CONSTRAINT monitored_assets_refresh_frequency_allowed CHECK (refresh_frequency_days IN (1, 3, 5, 7)),
  CONSTRAINT monitored_assets_alert_threshold_range CHECK (alert_threshold BETWEEN 0 AND 100)
);

CREATE INDEX monitored_assets_user_id_idx ON public.monitored_assets (user_id);
CREATE INDEX monitored_assets_user_status_idx ON public.monitored_assets (user_id, processing_status);
CREATE INDEX monitored_assets_geo_boundary_gist_idx ON public.monitored_assets USING gist (geo_boundary);

CREATE TRIGGER monitored_assets_set_updated_at
  BEFORE UPDATE ON public.monitored_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.monitored_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY monitored_assets_select_own ON public.monitored_assets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY monitored_assets_insert_own ON public.monitored_assets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY monitored_assets_update_own ON public.monitored_assets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY monitored_assets_delete_own ON public.monitored_assets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
