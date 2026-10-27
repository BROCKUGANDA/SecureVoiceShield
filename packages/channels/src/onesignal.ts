// OneSignal integration for push notifications.
// Used as a push delivery layer alongside the channel adapters (WhatsApp, SMS, USSD).
// OneSignal does NOT replace channel-specific delivery; it augments push.

export interface OneSignalConfig {
  appId: string;
  restApiKey: string;
  safariWebId?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;   // deep-link data, never personal data
  hapticPattern?: "pulse-1" | "pulse-2" | "pulse-3";
  priority?: "normal" | "high";     // high for Danger verdicts
  ttl?: number;                     // seconds; 0 = immediate
}

export const ONESIGNAL_EVENTS = {
  verdictReady: "shield.verdict.ready",
  guardianResult: "shield.guardian.result",
  holdPlaced: "shield.hold.placed",
  scamAlert: "shield.scam.alert",
  familyAlert: "shield.family.alert",
} as const;

// OneSignal handles push delivery; the verdict travels as data, never as text
// that could be read on a lock screen (privacy rule: no numbers/verdicts on lock screen).