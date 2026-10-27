// ChannelPort — Shield Core's only dependency on user-facing channels.
// Adapters: WhatsApp Cloud API, SMS/USSD aggregators, APNs, FCM.

export interface VerdictPayload {
  verdict: "clear" | "caution" | "danger" | "inconclusive" | "verified";
  jina: string;            // one sentence
  steps: string[];         // at most 3
  reasons: string[];
  checkId: string;         // last 6 chars shown to user
  trustMark?: string;      // in-app only
}

export interface ChannelPort {
  sendWhatsApp(msisdn: string, payload: VerdictPayload): Promise<void>;
  sendSms(msisdn: string, text: string): Promise<void>;
  sendPush(deviceToken: string, payload: VerdictPayload): Promise<void>;
  sendUssd(sessionId: string, screen: string): Promise<void>;
}