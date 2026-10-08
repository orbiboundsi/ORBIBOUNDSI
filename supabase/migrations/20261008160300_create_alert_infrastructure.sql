CREATE TABLE public.asset_alert_configs (
  asset_id uuid PRIMARY KEY REFERENCES public.monitored_assets(id) ON DELETE CASCADE,
  webhook_enabled boolean NOT NULL DEFAULT false,
  webhook_url_ciphertext bytea,
  email_enabled boolean NOT NULL DEFAULT false,
  email_recipients text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT asset_alert_configs_webhook_url_required CHECK (webhook_enabled = false OR webhook_url_ciphertext IS NOT NULL),
  CONSTRAINT asset_alert_configs_email_recipient_required CHECK (email_enabled = false OR cardinality(email_recipients) > 0)
);

CREATE TRIGGER asset_alert_configs_set_updated_at
  BEFORE UPDATE ON public.asset_alert_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.monitored_assets(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  scene_id text NOT NULL,
  risk_score numeric(5, 2) NOT NULL,
  threshold numeric(5, 2) NOT NULL,
  explanation text NOT NULL,
  dedupe_key text NOT NULL,
  webhook_delivered boolean NOT NULL DEFAULT false,
  email_sent boolean NOT NULL DEFAULT false,
  webhook_error text,
  email_error text,
  CONSTRAINT alert_history_risk_score_range CHECK (risk_score BETWEEN 0 AND 100),
  CONSTRAINT alert_history_threshold_range CHECK (threshold BETWEEN 0 AND 100),
  CONSTRAINT alert_history_explanation_not_blank CHECK (length(btrim(explanation)) > 0),
  CONSTRAINT alert_history_dedupe_key_not_blank CHECK (length(btrim(dedupe_key)) > 0)
);

CREATE UNIQUE INDEX alert_history_dedupe_key_uidx ON public.alert_history (dedupe_key);
CREATE INDEX alert_history_asset_triggered_idx ON public.alert_history (asset_id, triggered_at DESC);

ALTER TABLE public.asset_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_alert_configs_select_own_asset ON public.asset_alert_configs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = asset_alert_configs.asset_id AND a.user_id = auth.uid())
  );
CREATE POLICY asset_alert_configs_insert_own_asset ON public.asset_alert_configs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = asset_alert_configs.asset_id AND a.user_id = auth.uid())
  );
CREATE POLICY asset_alert_configs_update_own_asset ON public.asset_alert_configs
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = asset_alert_configs.asset_id AND a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = asset_alert_configs.asset_id AND a.user_id = auth.uid())
  );
CREATE POLICY asset_alert_configs_delete_own_asset ON public.asset_alert_configs
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = asset_alert_configs.asset_id AND a.user_id = auth.uid())
  );
CREATE POLICY alert_history_select_own_asset ON public.alert_history
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.monitored_assets a WHERE a.id = alert_history.asset_id AND a.user_id = auth.uid())
  );
