/**
 * The English dictionary — the source of truth for every line on the page.
 *
 * It reproduces the current English copy exactly. Every other locale is a
 * partial overlay on this one (see src/lib/i18n.ts), so a missing line is
 * marked as untranslated rather than silently shown as English.
 *
 * `r` marks a line that has been reviewed; `t` marks a line that is
 * translated but still waiting for a native speaker; `u` marks a line that
 * is still the English source.
 */
import type { Dictionary } from "@/lib/i18n";
import { reviewed as r } from "./copy";

export const en: Dictionary = {
  locale: "en-AE",
  market: "AE",
  dir: "ltr",

  meta: {
    title: r("SecureVoice Shield — is this call real?"),
    description: r(
      "Is this call real? Check it with Shield — cloned voices, spoofed IDs and SIM swaps, answered in plain language. Shield never calls you first.",
    ),
  },

  review: {
    badge: r("Pending native review"),
    badgeDetail: r(
      "This page was translated by the team and has not been checked by a native speaker yet. Dotted lines are unreviewed copy — some of it is still in English.",
    ),
    pendingTitle: r("This line has not been reviewed by a native speaker."),
    untranslatedTitle: r("This line is still the English source text."),
  },

  nav: {
    homeLabel: r("SecureVoice Shield home"),
    brand: r("Is this voice real?"),
    demo: r("Live demo"),
    verdicts: r("Verdicts"),
    how: r("How it works"),
    markets: r("Markets"),
    agents: r("Agents"),
    audit: r("Audit chain"),
    runCheck: r("Run a check"),
    skipToContent: r("Skip to content"),
    openMenu: r("Open menu"),
    closeMenu: r("Close menu"),
    main: r("Main"),
    mobile: r("Mobile"),
  },

  goldenRule: {
    items: [
      r("Shield never calls you first"),
      r("Never share your PIN or any code"),
      r("Hang up and call back on a number you already know"),
      r("A missing check never counts as good news"),
    ],
    screenReader: r(
      "Golden rule: Shield never calls you first. Never share your PIN or any code.",
    ),
  },

  hero: {
    badge: r("A sister product to SecureVoice AI"),
    headlineA: r("When a voice lies,"),
    headlineB: r("Shield answers."),
    lede: r(
      "Scammers clone voices, spoof numbers and swap SIMs to pretend to be your relative, your boss or your bank. Shield protects the customer and the bank — scoring every suspicious call, voice note and one-time-passcode request, and answering in plain language.",
    ),
    ctaPrimary: r("Try the live sandbox"),
    ctaSecondary: r("How detection works"),
    stats: [
      { v: r("4"), l: r("markets · AE KE UG TZ") },
      { v: r("11"), l: r("locales, incl. Luganda") },
      { v: r("1.5 s"), l: r("in-call verdict deadline") },
      { v: r("60 s"), l: r("audio, then deleted") },
    ],
    channels: [
      r("WhatsApp check bot"),
      r("Live Call Guardian merge"),
      r("USSD & SMS — no data needed"),
      r("Haptic verdict patterns"),
      r("Never asks for a PIN or code"),
    ],
    visual: {
      plane: r("signal plane · cell ug"),
      streaming: r("streaming"),
      guard: r("guard · engine · verdict"),
      fusedVerdict: r("fused verdict"),
      caution: r("Caution — be careful"),
      danger: r("Danger"),
      dangerMeta: r("3 pulses · octagon"),
      verified: r("Verified call"),
      verifiedMeta: r("bank registered"),
      detectors: [
        { id: "D1", label: r("ElevenLabs classifier"), state: r("ok") },
        { id: "D2", label: r("independent detector"), state: r("ok") },
        { id: "D3", label: r("in-house deepfake"), state: r("signal") },
        { id: "TEL", label: r("SIM swap · forwarding"), state: r("ok") },
        { id: "CUE", label: r("scam-script pressure"), state: r("signal") },
      ],
    },
  },

  stats: {
    ariaLabel: r("Why Shield exists"),
    items: [
      {
        v: r("17,152"),
        l: r("frauds & attempts reported to TCRA in one quarter (TZ, Q1 2025)"),
      },
      { v: r("80%+"), l: r("TTS operators caught by the live challenge (v1 target)") },
      { v: r("< 2%"), l: r("false-red rate on genuine human voices (v1 target)") },
      {
        v: r("< 10 s"),
        l: r("from a forwarded voice note to a plain-language reply"),
      },
    ],
  },

  sandbox: {
    eyebrow: r("Live sandbox"),
    title: r("Run the checks yourself"),
    lede: r(
      "A working slice of Shield: the deterministic engine, the verdict cards, the private Guardian flow and the hash-chained evidence log — wired to scripted sandbox answers.",
    ),
    caption: r(
      "sandbox · synthetic data · scripted telco answers · nothing here makes a real call",
    ),
    consoleNote: r("The live console runs in English."),
    tabs: {
      number: r("Check a number"),
      voice: r("Check a voice note"),
      guardian: r("Live Call Guardian"),
      verified: r("Was that call real?"),
    },
  },

  verdicts: {
    eyebrow: r("Five verdicts"),
    title: r("Shape, colour, word and haptic — never colour alone"),
    lede: r(
      "Every result pairs four channels so it works on a cracked phone, for a low-vision user, in any of eleven languages.",
    ),
    goldenRuleLabel: r("the golden rule"),
    goldenRuleLine: r("Shield never calls you first."),
    goldenRuleBody: r(
      "Any call claiming to be Shield is a scam. The best result Shield can give is “No warning signs found” — never “definitely real”.",
    ),
    items: [
      {
        key: "clear",
        name: r("Clear"),
        wording: r("No warning signs found."),
        advice: r(
          "Still never share your PIN or any code. Confirm big requests through a second channel.",
        ),
        shape: r("Hollow circle"),
        color: r("Emerald"),
        pulses: 1,
      },
      {
        key: "caution",
        name: r("Caution"),
        wording: r("Be careful."),
        advice: r("Hang up and call back on a number you already know."),
        shape: r("Triangle"),
        color: r("Amber"),
        pulses: 2,
      },
      {
        key: "danger",
        name: r("Danger"),
        wording: r("Stop. This looks like a scam."),
        advice: r("Do not send money or share any code. Report it."),
        shape: r("Octagon"),
        color: r("Red"),
        pulses: 3,
      },
      {
        key: "inconclusive",
        name: r("Inconclusive"),
        wording: r("We can’t tell."),
        advice: r(
          "Treat the call with care. A missing check never counts as good news.",
        ),
        shape: r("Dashed circle"),
        color: r("Slate"),
        pulses: 0,
      },
      {
        key: "verified",
        name: r("Verified call"),
        wording: r("This is a real call from the registered bank."),
        advice: r(
          "The bank registered this call in advance. You can talk safely — Shield never asks for codes.",
        ),
        shape: r("Shield with tick"),
        color: r("Deep green"),
        pulses: 2,
      },
    ],
    pulseOne: r("pulse"),
    pulseMany: r("pulses"),
  },

  signals: {
    eyebrow: r("How detection works"),
    title: r("Four kinds of evidence. One cautious verdict."),
    lede: r(
      "Shield never relies on one test. Signals go into a deterministic, versioned rule pack — no model ever sits in a decision path.",
    ),
    items: [
      {
        id: r("01 · audio forensics"),
        title: r("Does the audio look machine-made?"),
        body: r(
          "At least two independent detectors scan every clip. One is the ElevenLabs AI Speech Classifier — 99% precision on its own audio — but it only knows ElevenLabs voices, so it is one signal, never the verdict.",
        ),
      },
      {
        id: r("02 · liveness"),
        title: r("Can it answer live?"),
        body: r(
          "“Please repeat these words: basket, river, seven.” Words are random per call, never dates or times. Real-time clones lag, glitch or drift; text-to-speech operators have to type — and typing shows.",
        ),
      },
      {
        id: r("03 · the line"),
        title: r("Is the line trustworthy?"),
        body: r(
          "Telco signals: a recent SIM swap, call forwarding switched on, number verification, VoIP posing as a mobile number. A swap is a risk signal — never proof on its own.",
        ),
      },
      {
        id: r("04 · the story"),
        title: r("Does the story fit a scam?"),
        body: r(
          "Urgency, secrecy, a new number (“my phone broke”), requests for one-time passcodes or PINs, payment by mobile money, gift cards or crypto. Story pressure adds risk — it can never clear anyone.",
        ),
      },
    ],
    floor: {
      label: r("The floor rule:"),
      body: r(
        "no single component can produce Clear. It needs every detector to answer, at least two general detectors agreeing, and no unknown signal. Missing or late evidence makes the answer more cautious — never more reassuring.",
      ),
    },
  },

  products: {
    eyebrow: r("Two products, one engine"),
    title: r("Free for everyone. An API for banks and telcos."),
    lede: r(
      "The same verdicts, the same evidence chain — one public tier funded for safety, one business tier with holds, OTP guards and webhooks.",
    ),
    publicName: r("Shield for Everyone"),
    publicBadge: r("free · public"),
    businessName: r("Shield for Banks & Telcos"),
    businessBadge: r("paid · api"),
    publicFeatures: [
      {
        t: r("WhatsApp check bot"),
        d: r(
          "Forward a suspicious voice note, get a traffic-light reply in your language — text plus an optional voice reply.",
        ),
      },
      {
        t: r("Live Call Guardian"),
        d: r(
          "Merge Shield into the call. It asks a liveness question, then leaves. The verdict reaches you privately.",
        ),
      },
      {
        t: r("Ask-it-yourself"),
        d: r(
          "No merge? Shield sends four random words by SMS, WhatsApp or USSD for you to ask the caller to repeat.",
        ),
      },
      {
        t: r("USSD & SMS"),
        d: r(
          "Check a number, confirm your bank is really calling, report a scam — no smartphone or data needed.",
        ),
      },
      {
        t: r("Family safe word kit"),
        d: r(
          "Guided setup of a secret family phrase. Shield never stores or asks for the safe word.",
        ),
      },
      {
        t: r("Scam report"),
        d: r(
          "One tap adds the number and an audio fingerprint — not a voiceprint — to the shared blocklist.",
        ),
      },
    ],
    businessFeatures: [
      {
        t: r("POST /v1/assess"),
        d: r(
          "Phone number, optional audio, transaction context → risk score, reasons, recommended action.",
        ),
      },
      {
        t: r("OTP guard"),
        d: r(
          "Check for a recent SIM swap before sending an SMS code — else in-app confirmation or a branch visit.",
        ),
      },
      {
        t: r("Cooling-off hold"),
        d: r(
          "After a SIM swap or a new payee, large transfers hold for 30–60 minutes. Releases need two approvers.",
        ),
      },
      {
        t: r("Verified bank call"),
        d: r(
          "Register outbound calls; customers see “Your bank is calling you now.” No banner means hang up.",
        ),
      },
      {
        t: r("Evidence log"),
        d: r(
          "A hash-chained record of every decision — verifiable with open-source shield-verify.",
        ),
      },
    ],
    apiNote: r(
      "This is the business API. The sandbox above exposes the same engine on the public routes — POST /api/assess with { number } — so you can try the decision path without credentials.",
    ),
    failSafe: r("every failure mode returns step_up — never allow"),
  },

  markets: {
    eyebrow: r("Markets"),
    title: r("Uganda is first-class, Tanzania is Kiswahili-first"),
    lede: r(
      "Four launch markets, eleven locales, different phones and money rails — one cautious verdict everywhere. Data is stored and processed in-country.",
    ),
    yourMarket: r("Your market"),
    zeroRated: r("USSD zero-rated where possible — checks cost the user nothing"),
    patternLabel: r("Pattern to watch"),
    awareness: r(
      "Awareness campaigns repeat two lines in every language on local radio: “Shield never calls you first” and the USSD code. Tanzania pilots also teach TCRA’s 15040 and *106# self-check for SIMs registered to your ID.",
    ),
    items: [
      {
        code: "AE",
        name: r("United Arab Emirates"),
        languages: [r("Arabic"), r("English"), r("Hindi"), r("Urdu")],
        channels: [r("App"), r("WhatsApp"), r("SMS")],
        rails: r("Cards, bank transfers, wallets"),
        pattern: r(
          "Fake police or visa officers threatening expats; “safe account” fraud-team calls.",
        ),
      },
      {
        code: "KE",
        name: r("Kenya"),
        languages: [r("Kiswahili"), r("English"), r("Sheng-aware")],
        channels: [r("WhatsApp"), r("USSD"), r("SMS"), r("App")],
        rails: r("M-PESA, Airtel Money, PesaLink"),
        pattern: r(
          "“Money sent by mistake” reversal calls; fake customer care asking for your PIN.",
        ),
      },
      {
        code: "UG",
        name: r("Uganda"),
        languages: [r("Luganda"), r("English"), r("Kiswahili")],
        channels: [r("USSD"), r("SMS"), r("WhatsApp"), r("App")],
        rails: r("MTN MoMo, Airtel Money, banks"),
        pattern: r(
          "Cloned-relative emergencies on voice notes; MTN MoMo “upgrade” PIN harvesting.",
        ),
      },
      {
        code: "TZ",
        name: r("Tanzania"),
        languages: [r("Kiswahili"), r("English")],
        channels: [r("USSD"), r("SMS"), r("WhatsApp"), r("App")],
        rails: r("M-Pesa, Mixx by Yas, HaloPesa"),
        pattern: r(
          "“Ile pesa tuma kwa namba hii” continuation scams. Report to TCRA on 15040.",
        ),
      },
    ],
  },

  agents: {
    eyebrow: r("Agents talk. They never decide."),
    title: r("Three bounded workers on ElevenLabs Agents"),
    lede: r(
      "Every session gets one mission, an allow-list of tools and fixed budgets. Detection, verdicts, holds and releases come from the deterministic engine.",
    ),
    items: [
      {
        name: r("Guardian"),
        channel: r("Phone leg merged into a live call"),
        purpose: r(
          "Disclose, run the repeat-after-me challenge, leave. The result goes privately to the user — the agent never learns it.",
        ),
        budget: r("6 min cap · 12 turns · 8 tool calls"),
      },
      {
        name: r("Helper"),
        channel: r("WhatsApp & in-app chat"),
        purpose: r(
          "Check numbers and voice notes, explain results, file reports, teach safety in eleven locales.",
        ),
        budget: r("30 turns · idle timeout 60 s"),
      },
      {
        name: r("Console Copilot"),
        channel: r("Business console (text)"),
        purpose: r(
          "Explain cases, summarise scam waves, draft policy changes — drafts only; humans approve with four eyes.",
        ),
        budget: r("20 turns per thread"),
      },
    ],
    invariants: [
      { id: "G-1", label: r("Never sets or words a verdict") },
      { id: "G-2", label: r("Never asks for a PIN, OTP or password") },
      { id: "G-3", label: r("Numbers come from the registry only") },
      { id: "G-4", label: r("Never learns the result it delivers") },
      { id: "G-5", label: r("Says it is an AI, first sentence") },
      { id: "G-6", label: r("Never claims certainty") },
      { id: "G-8", label: r("Never calls first, never clones") },
      { id: "G-10", label: r("Bounded sessions, scripted exits") },
    ],
  },

  architecture: {
    eyebrow: r("Architecture"),
    title: r("No model sits in a decision path"),
    lede: r(
      "Models produce signals; a versioned, tested rule pack turns signals into verdicts and actions.",
    ),
    planes: [
      {
        name: r("Channels"),
        items: [
          r("WhatsApp"),
          r("Live Call Guardian (PSTN)"),
          r("USSD"),
          r("SMS"),
          r("Mobile app"),
          r("Business API"),
        ],
      },
      {
        name: r("Conversation plane — ElevenLabs Agents"),
        items: [
          r("Guardian (voice)"),
          r("Helper (chat)"),
          r("Console Copilot"),
          r("KB + RAG"),
          r("Guardrails 2.0"),
        ],
        note: r("speech, turn-taking, phrasing, language"),
      },
      {
        name: r("Control plane — Shield Core (deterministic)"),
        items: [
          r("sessions & challenges"),
          r("signal fusion"),
          r("policy packs"),
          r("holds"),
          r("verified calls"),
          r("audit chain"),
        ],
        note: r("pure engine · replayable · property-tested"),
      },
      {
        name: r("Signal plane"),
        items: [
          r("D1 ElevenLabs classifier"),
          r("D2 vendor detector"),
          r("D3 in-house"),
          r("CAMARA SIM swap"),
          r("number reputation"),
          r("scam-script cues"),
        ],
      },
    ],
    connectors: [
      r("inbound events · server tools (scoped, signed, no verdict power)"),
      r("tool calls · validated, idempotent, session-bound"),
      r("signal fetch · adapters map every error to unknown"),
    ],
    cards: [
      {
        t: r("Fail toward verification"),
        d: r(
          "Missing, late or contradictory evidence gives Inconclusive (public) or step_up (business). Never Clear.",
        ),
      },
      {
        t: r("Everything is audited"),
        d: r(
          "Each decision commits with a hash-chained evidence entry in the same transaction.",
        ),
      },
      {
        t: r("Degrades loudly"),
        d: r(
          "Operating modes show in the console, the API header and the public banner.",
        ),
      },
    ],
  },

  audit: {
    eyebrow: r("Compliance"),
    title: r("Anyone can verify every decision"),
    lede: r(
      "A live view of the evidence chain this page is writing to. Every check you ran above is in here — recomputed and re-verified on demand.",
    ),
    consoleNote: r("The evidence panel runs in English."),
  },

  faq: {
    eyebrow: r("Learn — five ways to spot a cloned voice"),
    title: r("Questions people actually ask"),
    lede: r(
      "Plain-language answers, written answer-first in every launch language, reviewed by native speakers.",
    ),
    items: [
      {
        q: r("Is this call from my bank real?"),
        a: r(
          "Ask Shield. If the bank registered the call, your app shows “Your bank is calling you now”. If nothing shows, hang up and call the number on your card. Spoofed caller ID cannot fake a registry entry.",
        ),
      },
      {
        q: r("Can a cloned voice pass the check?"),
        a: r(
          "It gets harder every step. The voice is scored by at least two independent detectors; a live caller must repeat random words in real time; the number is checked for SIM swaps; and the story is scored for scam pressure. No single test decides, and “no warning signs found” is never a guarantee.",
        ),
      },
      {
        q: r("Does Shield keep my audio?"),
        a: r(
          "No. Public audio is scored in memory and deleted within 60 seconds. Shield stores an acoustic fingerprint — never a voiceprint of a person — and transcripts are redacted before storage.",
        ),
      },
      {
        q: r("What does “No warning signs found” mean?"),
        a: r(
          "It means every check Shield could run came back clean. It is deliberately not “definitely real”. The advice stays the same: never share your PIN or any code, and confirm big requests through a second channel.",
        ),
      },
      {
        q: r("What if my relative really is in trouble?"),
        a: r(
          "Shield never accuses. A Caution or Danger tells you how to verify — call them back on a number you saved before — and real banks don’t mind you checking. If a check is wrong, the number’s owner can appeal and gets a decision within 72 hours.",
        ),
      },
    ],
  },

  footer: {
    about: r(
      "A sister product to SecureVoice AI — the bank calls the customer to stop fraud; Shield protects everyone when someone else pretends to be either of them.",
    ),
    demoNote: r(
      "Demo build. Sandbox data only, scripted telco answers, no real calls. Shield never says a voice is definitely real.",
    ),
    exploreLabel: r("Explore"),
    explore: [
      { href: "#demo", label: r("Live sandbox") },
      { href: "#signals", label: r("How detection works") },
      { href: "#verdicts", label: r("The five verdicts") },
      { href: "#products", label: r("Products & API") },
      { href: "#audit", label: r("Audit chain") },
      { href: "#faq", label: r("Learn") },
    ],
    marketsLabel: r("Launch markets"),
    markets: [
      r("UAE · Arabic, English, Hindi, Urdu"),
      r("Kenya · Kiswahili, English"),
      r("Uganda · Luganda, English, Kiswahili"),
      r("Tanzania · Kiswahili, English"),
    ],
    dataInCountry: r("data stays in-country"),
    docsLabel: r("Companion docs"),
    docs: r(
      "This page implements the Shield spec: 01 Design System (KANGA) · 02 Platform & API Behaviour · 03 Agents & Guardrails · 05 Edge Cases & Operating Modes · 13 Compliance & Audit · 14 Discoverability.",
    ),
    goldenRule: r("Golden rule: Shield never calls you first."),
    copyright: r("© 2026 SecureVoice · demo environment"),
    disclaimer: r("verdicts are advice, not certainty"),
  },

  local: {
    marketName: r("United Arab Emirates"),
    marketNote: r(
      "Fake police or visa officers threatening expats; “safe account” fraud-team calls.",
    ),
  },
};
