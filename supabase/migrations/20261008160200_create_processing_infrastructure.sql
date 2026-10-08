CREATE TABLE public.processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.monitored_assets(id) ON DELETE CASCADE,
  run_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  scene_id text,
  bytes_read bigint,
  processing_time_ms integer,
  status varchar(20) NOT NULL,
  error_code varchar(64),
  error_message text,
  cloud_cover numeric(5, 2),
  risk_score numeric(5, 2),
  baseline_value numeric,
  current_value numeric,
  z_score numeric,
  CONSTRAINT processing_logs_bytes_read_non_negative CHECK (bytes_read IS NULL OR bytes_read >= 0),
  CONSTRAINT processing_logs_processing_time_non_negative CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),
  CONSTRAINT processing_logs_status_allowed CHECK (status IN ('started', 'succeeded', 'failed', 'skipped')),
  CONSTRAINT processing_logs_cloud_cover_range CHECK (cloud_cover IS NULL OR cloud_cover BETWEEN 0 AND 100),
  CONSTRAINT processing_logs_risk_score_range CHECK (risk_score IS NULL OR risk_score BETWEEN 0 AND 100),
  CONSTRAINT processing_logs_terminal_error_consistency CHECK (status NOT IN ('failed', 'skipped') OR error_code IS NOT NULL)
);

CREATE INDEX processing_logs_asset_run_idx ON public.processing_logs (asset_id, run_at DESC);

CREATE TABLE public.asset_schedules (
  asset_id uuid PRIMARY KEY REFERENCES public.monitored_assets(id) ON DELETE CASCADE,
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT asset_schedules_run_count_non_negative CHECK (run_count >= 0),
  CONSTRAINT asset_schedules_failure_count_non_negative CHECK (failure_count >= 0)
);

CREATE INDEX asset_schedules_due_idx ON public.asset_schedules (next_run_at);

CREATE TRIGGER asset_schedules_set_updated_at
  BEFORE UPDATE ON public.asset_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY processing_logs_select_own_asset ON public.processing_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = processing_logs.asset_id AND a.user_id = auth.uid())
  );

CREATE POLICY asset_schedules_select_own_asset ON public.asset_schedules
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = asset_schedules.asset_id AND a.user_id = auth.uid())
  );
