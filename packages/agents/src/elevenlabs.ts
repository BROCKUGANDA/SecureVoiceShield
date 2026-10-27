// ElevenLabs integration: agents, guardrails, tools, webhooks, KB sync.
// Conversation plane only — no decision power (invariant O-4).

export interface AgentManifest {
  name: string;           // guardian-ug-lg, helper-ke-sw, ...
  mission: "guardian.challenge" | "helper.check" | "helper.learn" | "copilot.case";
  market: "AE" | "KE" | "UG" | "TZ";
  languages: { default: string; allowed: string[] };
  llm: { model: string; temperature: number; maxOutputTokens: number };
  speech: { stt: string; tts: string; voiceId: string };
  promptHash: string;     // SHA-256 of the prompt file
  kbManifestHash: string; // SHA-256 of the KB manifest
  tools: { server: string[]; system: string[]; client: string[]; denied: string[] };
  budgets: { targetSeconds: number; maxSeconds: number; maxAgentTurns: number; maxServerToolCalls: number; idleTimeoutSeconds: number; concurrencyPerCell: number };
  privacy: { zeroRetentionMode: boolean; dataResidency: string; dynamicVariables: string[] };
  guardrails: string[];   // focus, manipulation, content, no_credentials, no_unregistered_number, no_certainty
  evaluation: string[];   // disclosed_ai_first_turn, no_credential_request, ...
  release: { canaryPercent: number; canaryHours: number; autoRollback: string };
}

// Tool allow-lists per mission (O-2). A tool outside the list is rejected.
export const MISSION_TOOLS: Record<string, { server: string[]; denied: string[] }> = {
  "guardian.challenge": {
    server: ["get_session_context", "start_challenge", "close_challenge", "send_private_result", "send_safety_guide", "lookup_official_contact"],
    denied: ["transfer_to_number", "transfer_to_agent", "set_verdict", "place_hold", "release_hold"],
  },
  "helper.check": {
    server: ["check_number", "check_voice_note", "report_scam", "get_safety_tip", "lookup_official_contact", "family_link", "family_unlink", "delete_my_data", "export_my_data"],
    denied: ["transfer_to_number", "set_verdict", "place_hold", "release_hold", "approve_policy"],
  },
  "helper.learn": {
    server: ["get_safety_tip", "get_lesson", "lookup_official_contact"],
    denied: ["transfer_to_number", "set_verdict", "place_hold", "release_hold", "check_number", "check_voice_note"],
  },
  "copilot.case": {
    server: ["search_cases", "get_case", "get_audit_entry", "draft_policy", "run_backtest", "lookup_official_contact"],
    denied: ["transfer_to_number", "set_verdict", "place_hold", "release_hold", "approve_policy", "activate_policy"],
  },
};

// Guardrail layers (03, section 6).
export const GUARDRAIL_LAYERS = {
  L0: "platform",           // ElevenLabs built-in safety
  L1: "focus",               // stay on mission
  L2: "manipulation",        // prompt injection resistance
  L3: "content",             // no harmful content
  L4: "no_credentials",      // never ask for PIN/OTP/password
  L5: "no_unregistered_number", // only registry numbers
  L6: "no_certainty",        // never say "safe"/"real"/"verified" from detection
};

// Webhook endpoints for ElevenLabs (02, section 7.3).
export const ELEVENLABS_WEBHOOKS = {
  tools: "/hooks/elevenlabs/tools/{tool}",
  postCall: "/hooks/elevenlabs/post-call",
  verification: "x-agent-tool-secret (dual-valid during rotation)",
};

// Tool gateway steps (11, section 5).
export const TOOL_GATEWAY_STEPS = [
  "verify x-agent-tool-secret (dual-valid during rotation)",
  "bind conversation_id to Shield session; reject mismatch",
  "check tool on mission allow-list (O-2)",
  "validate input with strict Zod schema",
  "check budgets and rate limits",
  "deduplicate on conversation_id + tool call ID",
  "execute through Shield Core, never directly against DB/vendor",
  "write audit entry (tool, hashed args, result code, latency)",
  "return minimum output within 800 ms",
];