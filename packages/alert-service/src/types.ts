import type { AnomalyResult } from '@orbibound-ai/anomaly-engine';
export interface AlertAsset { id: string; assetName: string; threshold: number }
export interface AlertConfig { webhookUrl?: string; emailRecipients: string[]; webhookEnabled: boolean; emailEnabled: boolean }
export interface AlertEvent { asset: AlertAsset; result: AnomalyResult; sceneId: string; triggeredAt: string }
export interface AlertDeliveryResult { duplicate: boolean; webhookDelivered: boolean; emailSent: boolean; webhookError: string | null; emailError: string | null; dedupeKey: string }
export interface AlertSender { send(event: AlertEvent, config: AlertConfig): Promise<Omit<AlertDeliveryResult, 'duplicate' | 'dedupeKey'>> }
export type AlertErrorCode = 'ALERT_WEBHOOK_TIMEOUT' | 'ALERT_WEBHOOK_FAILED' | 'ALERT_EMAIL_TIMEOUT' | 'ALERT_EMAIL_FAILED' | 'ALERT_CONFIG_INVALID' | 'ALERT_DUPLICATE'
export class AlertError extends Error { public constructor(public readonly code: AlertErrorCode, message: string, public readonly cause?: unknown) { super(message); this.name = 'AlertError'; } }
