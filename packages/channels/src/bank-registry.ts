// Bank / telco / mobile-money partner registry per market.
// Shield integrates with these as tenants (business API) and as verified-call
// registrants. Each tenant has its own policy pack, scopes and region.

export interface BankPartner {
  id: string;
  market: "AE" | "KE" | "UG" | "TZ";
  name: string;
  kind: "bank" | "sacco" | "mfi" | "mobile_money" | "telco";
  rails: string[];          // M-Pesa, MTN MoMo, bank transfers, cards, ...
  integrationPattern: "otp_guard" | "assess" | "watches" | "verified_calls" | "streaming" | "full";
  scopes: string[];         // assess:write, holds:release, ...
  policyVersion: string;
}

export const BANK_PARTNERS: BankPartner[] = [
  // ---- UAE ----
  { id: "ae-emirates-nbd", market: "AE", name: "Emirates NBD", kind: "bank",
    rails: ["bank transfers", "cards", "wallets"], integrationPattern: "full",
    scopes: ["assess:write", "otp-guard:write", "holds:release", "verified-calls:write"],
    policyVersion: "ae-banking-2026.10.1" },
  { id: "ae-fab", market: "AE", name: "First Abu Dhabi Bank", kind: "bank",
    rails: ["bank transfers", "cards"], integrationPattern: "full",
    scopes: ["assess:write", "otp-guard:write", "holds:release", "verified-calls:write"],
    policyVersion: "ae-banking-2026.10.1" },
  { id: "ae-adcb", market: "AE", name: "ADCB", kind: "bank",
    rails: ["bank transfers", "cards"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "ae-banking-2026.10.1" },
  { id: "ae-mashreq", market: "AE", name: "Mashreq", kind: "bank",
    rails: ["bank transfers", "cards", "wallets"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "ae-banking-2026.10.1" },

  // ---- Kenya ----
  { id: "ke-equity", market: "KE", name: "Equity Bank", kind: "bank",
    rails: ["bank transfers", "M-Pesa", "PesaLink"], integrationPattern: "full",
    scopes: ["assess:write", "otp-guard:write", "holds:release", "verified-calls:write", "watches:write"],
    policyVersion: "ke-banking-2026.10.1" },
  { id: "ke-kcb", market: "KE", name: "KCB", kind: "bank",
    rails: ["bank transfers", "M-Pesa", "PesaLink"], integrationPattern: "full",
    scopes: ["assess:write", "otp-guard:write", "holds:release", "verified-calls:write"],
    policyVersion: "ke-banking-2026.10.1" },
  { id: "ke-coop", market: "KE", name: "Co-operative Bank", kind: "bank",
    rails: ["bank transfers", "M-Pesa"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "ke-banking-2026.10.1" },
  { id: "ke-safaricom-mpesa", market: "KE", name: "Safaricom M-Pesa", kind: "mobile_money",
    rails: ["M-Pesa"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "ke-mm-2026.10.1" },
  { id: "ke-airtel-money", market: "KE", name: "Airtel Money Kenya", kind: "mobile_money",
    rails: ["Airtel Money"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "ke-mm-2026.10.1" },

  // ---- Uganda ----
  { id: "ug-stanbic", market: "UG", name: "Stanbic Bank Uganda", kind: "bank",
    rails: ["bank transfers", "MTN MoMo", "Airtel Money"], integrationPattern: "full",
    scopes: ["assess:write", "otp-guard:write", "holds:release", "verified-calls:write", "watches:write"],
    policyVersion: "ug-banking-2026.10.1" },
  { id: "ug-centenary", market: "UG", name: "Centenary Bank", kind: "bank",
    rails: ["bank transfers", "MTN MoMo", "Airtel Money"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "ug-banking-2026.10.1" },
  { id: "ug-dfcu", market: "UG", name: "dfcu Bank", kind: "bank",
    rails: ["bank transfers"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "ug-banking-2026.10.1" },
  { id: "ug-mtn-momo", market: "UG", name: "MTN Mobile Money", kind: "mobile_money",
    rails: ["MTN MoMo"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "ug-mm-2026.10.1" },
  { id: "ug-airtel-money", market: "UG", name: "Airtel Money Uganda", kind: "mobile_money",
    rails: ["Airtel Money"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "ug-mm-2026.10.1" },

  // ---- Tanzania ----
  { id: "tz-crdb", market: "TZ", name: "CRDB Bank", kind: "bank",
    rails: ["bank transfers", "M-Pesa", "Mixx", "Airtel Money", "HaloPesa"], integrationPattern: "full",
    scopes: ["assess:write", "otp-guard:write", "holds:release", "verified-calls:write", "watches:write"],
    policyVersion: "tz-banking-2026.10.1" },
  { id: "tz-nmb", market: "TZ", name: "NMB Bank", kind: "bank",
    rails: ["bank transfers", "M-Pesa"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "tz-banking-2026.10.1" },
  { id: "tz-equity", market: "TZ", name: "Equity Bank Tanzania", kind: "bank",
    rails: ["bank transfers"], integrationPattern: "assess",
    scopes: ["assess:write", "otp-guard:write"], policyVersion: "tz-banking-2026.10.1" },
  { id: "tz-mpesa", market: "TZ", name: "M-Pesa Tanzania", kind: "mobile_money",
    rails: ["M-Pesa"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "tz-mm-2026.10.1" },
  { id: "tz-mixx", market: "TZ", name: "Mixx by Yas", kind: "mobile_money",
    rails: ["Mixx by Yas"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "tz-mm-2026.10.1" },
  { id: "tz-halopesa", market: "TZ", name: "HaloPesa", kind: "mobile_money",
    rails: ["HaloPesa"], integrationPattern: "otp_guard",
    scopes: ["otp-guard:write"], policyVersion: "tz-mm-2026.10.1" },
];

export function partnersForMarket(market: string): BankPartner[] {
  return BANK_PARTNERS.filter((p) => p.market === market);
}

export function partnerById(id: string): BankPartner | undefined {
  return BANK_PARTNERS.find((p) => p.id === id);
}