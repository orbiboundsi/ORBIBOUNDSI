import { isIP } from 'node:net';
import nodemailer from 'nodemailer';
import { AlertError, type AlertConfig, type AlertEvent, type AlertSender } from './types.js';

function payload(event: AlertEvent): Record<string, unknown> {
  return { event: 'satellite_anomaly_detected', assetId: event.asset.id, assetName: event.asset.assetName, riskScore: event.result.riskScore, threshold: event.asset.threshold, sceneId: event.sceneId, explanation: event.result.explanation, triggeredAt: event.triggeredAt };
}

async function retry(operation: () => Promise<void>, attempts: number): Promise<void> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { await operation(); return; } catch (error: unknown) { last = error; if (attempt + 1 < attempts) await new Promise<void>((resolve) => setTimeout(resolve, 250 * 2 ** attempt)); }
  }
  throw last;
}

function isBlockedIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map((value) => Number(value));
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const first = octets[0] ?? -1;
  const second = octets[1] ?? -1;
  return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local') || normalized.endsWith('.internal') || normalized === 'metadata.google.internal') return true;
  const ipVersion = isIP(normalized);
  if (ipVersion === 4) return isBlockedIpv4(normalized);
  if (ipVersion === 6) return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
  return false;
}

export function validateWebhookUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new AlertError('ALERT_CONFIG_INVALID', 'Webhook URL is invalid'); }
  if (url.protocol !== 'https:') throw new AlertError('ALERT_CONFIG_INVALID', 'Webhook URL must use HTTPS');
  if (url.username.length > 0 || url.password.length > 0) throw new AlertError('ALERT_CONFIG_INVALID', 'Webhook URL cannot include credentials');
  if (isBlockedHostname(url.hostname)) throw new AlertError('ALERT_CONFIG_INVALID', 'Webhook destination is not allowed');
  return url;
}

export class WebhookSender implements AlertSender {
  public async send(event: AlertEvent, config: AlertConfig): Promise<{ webhookDelivered: boolean; emailSent: boolean; webhookError: string | null; emailError: string | null }> {
    let webhookDelivered = false;
    let webhookError: string | null = null;
    if (config.webhookEnabled) {
      if (config.webhookUrl === undefined) throw new AlertError('ALERT_CONFIG_INVALID', 'Webhook URL is required');
      const webhookUrl = validateWebhookUrl(config.webhookUrl);
      try {
        await retry(async () => {
          const response = await fetch(webhookUrl, { method: 'POST', redirect: 'error', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload(event)), signal: AbortSignal.timeout(10_000) });
          if (!response.ok) throw new AlertError('ALERT_WEBHOOK_FAILED', `Webhook returned HTTP ${response.status}`);
        }, 3);
        webhookDelivered = true;
      } catch (error: unknown) { webhookError = error instanceof Error ? error.message : 'Webhook delivery failed'; }
    }
    return { webhookDelivered, emailSent: false, webhookError, emailError: null };
  }
}

export interface SmtpSettings { host: string; port: number; secure: boolean; user: string; password: string; from: string }

export class SmtpSender implements AlertSender {
  public constructor(private readonly settings: SmtpSettings) {}
  public async send(event: AlertEvent, config: AlertConfig): Promise<{ webhookDelivered: boolean; emailSent: boolean; webhookError: string | null; emailError: string | null }> {
    if (!config.emailEnabled) return { webhookDelivered: false, emailSent: false, webhookError: null, emailError: null };
    if (config.emailRecipients.length === 0) throw new AlertError('ALERT_CONFIG_INVALID', 'Email recipients are required');
    try {
      const transport = nodemailer.createTransport({ host: this.settings.host, port: this.settings.port, secure: this.settings.secure, auth: { user: this.settings.user, pass: this.settings.password }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 10_000 });
      await retry(async () => { await transport.sendMail({ from: this.settings.from, to: config.emailRecipients, subject: `OrbiBound anomaly alert: ${event.asset.assetName}`, text: event.result.explanation, html: `<p>${event.result.explanation}</p><p>Risk score: <strong>${event.result.riskScore}</strong></p>` }); }, 3);
      return { webhookDelivered: false, emailSent: true, webhookError: null, emailError: null };
    } catch (error: unknown) { return { webhookDelivered: false, emailSent: false, webhookError: null, emailError: error instanceof Error ? error.message : 'Email delivery failed' }; }
  }
}
