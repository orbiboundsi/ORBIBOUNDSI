import type { Database } from './generated.js';

export type Tables = Database['public']['Tables'];
export type MonitoredAsset = Tables['monitored_assets']['Row'];
export type MonitoredAssetInsert = Tables['monitored_assets']['Insert'];
export type ProcessingLog = Tables['processing_logs']['Row'];
export type AssetObservation = Tables['asset_observations']['Row'];
export type AssetSchedule = Tables['asset_schedules']['Row'];
export type AssetAlertConfig = Tables['asset_alert_configs']['Row'];
export type AlertHistory = Tables['alert_history']['Row'];

export type ProcessingStatus = 'pending' | 'warming_up' | 'ready' | 'processing' | 'complete' | 'failed';
export type ProcessingLogStatus = 'started' | 'succeeded' | 'failed' | 'skipped';
