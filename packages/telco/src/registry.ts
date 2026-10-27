// Telco adapter registry — one entry per (market, operator) pair.
// Shield launches in AE, KE, UG, TZ. Each operator exposes a different
// combination of CAMARA APIs and/or direct operator APIs.

export interface TelcoOperator {
  id: string;            // e.g. "ug-mtn"
  market: "AE" | "KE" | "UG" | "TZ";
  name: string;
  kind: "mno" | "aggregator" | "mvno";
  apiRoute: "camara" | "direct" | "hybrid";
  apis: {
    simSwap: boolean;
    deviceSwap: boolean;
    callForwarding: boolean;
    numberVerification: boolean;
    kycMatch: boolean;
    subscriptions: boolean;   // push vs poll
  };
  baseUrl?: string;
  slaP95Ms: number;
  killSwitch: string;        // flag name in the control plane
}

export const TELCO_OPERATORS: TelcoOperator[] = [
  // ---- UAE ----
  { id: "ae-eand", market: "AE", name: "e& (Etisalat)", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: true, subscriptions: true },
    slaP95Ms: 600, killSwitch: "telco.ae-eand.enabled" },
  { id: "ae-du", market: "AE", name: "du", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: true, subscriptions: true },
    slaP95Ms: 600, killSwitch: "telco.ae-du.enabled" },

  // ---- Kenya ----
  { id: "ke-safaricom", market: "KE", name: "Safaricom", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: true },
    slaP95Ms: 700, killSwitch: "telco.ke-safaricom.enabled" },
  { id: "ke-airtel", market: "KE", name: "Airtel Kenya", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 800, killSwitch: "telco.ke-airtel.enabled" },
  { id: "ke-telkom", market: "KE", name: "Telkom Kenya", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: false, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 900, killSwitch: "telco.ke-telkom.enabled" },

  // ---- Uganda ----
  { id: "ug-mtn", market: "UG", name: "MTN Uganda", kind: "mno", apiRoute: "direct",
    apis: { simSwap: true, deviceSwap: true, callForwarding: false, numberVerification: true, kycMatch: true, subscriptions: true },
    baseUrl: "https://api.mtn.com/v1",
    slaP95Ms: 800, killSwitch: "telco.ug-mtn.enabled" },
  { id: "ug-airtel", market: "UG", name: "Airtel Uganda", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 900, killSwitch: "telco.ug-airtel.enabled" },

  // ---- Tanzania ----
  { id: "tz-vodacom", market: "TZ", name: "Vodacom Tanzania", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 900, killSwitch: "telco.tz-vodacom.enabled" },
  { id: "tz-airtel", market: "TZ", name: "Airtel Tanzania", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: true, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 900, killSwitch: "telco.tz-airtel.enabled" },
  { id: "tz-yas", market: "TZ", name: "Yas (Tigo)", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: false, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 1000, killSwitch: "telco.tz-yas.enabled" },
  { id: "tz-halotel", market: "TZ", name: "Halotel", kind: "mno", apiRoute: "camara",
    apis: { simSwap: true, deviceSwap: false, callForwarding: true, numberVerification: true, kycMatch: false, subscriptions: false },
    slaP95Ms: 1000, killSwitch: "telco.tz-halotel.enabled" },
];

export function operatorsForMarket(market: string): TelcoOperator[] {
  return TELCO_OPERATORS.filter((o) => o.market === market);
}

export function operatorById(id: string): TelcoOperator | undefined {
  return TELCO_OPERATORS.find((o) => o.id === id);
}