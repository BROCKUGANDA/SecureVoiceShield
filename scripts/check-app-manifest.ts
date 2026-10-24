/// <reference types="bun-types" />

import { join } from "path";

/**
 * check:app-manifest — the mobile-app manifest contract and its CI check.
 *
 * The mobile app is not in this repository. What lives here is the CONTRACT
 * and the CHECK (14, section 10.2 and 10.3; 12, section 6):
 *
 *   app-allowlist/AndroidManifest.xml    the Android allow-list the merged
 *                                        manifest is compared against
 *   app-allowlist/Info.plist             the iOS reference
 *   app-allowlist/entitlements.plist     the associated-domains entitlement
 *   app-allowlist/PrivacyInfo.xcprivacy  the privacy manifest
 *
 * Usage:
 *
 *   bun scripts/check-app-manifest.ts                             allow-list only
 *   bun scripts/check-app-manifest.ts path/to/AndroidManifest.xml  full check
 *
 * Without a merged manifest the script validates the allow-list and says
 * plainly that the app-level comparison was SKIPPED and has not run. It never
 * reports a pass it did not earn.
 *
 * PARSE METHOD: the documents are parsed by the small, dependency-free XML
 * reader below (a real tokenizer and tree builder, not a regular expression).
 * A malformed document is a failure with the line and column of the error.
 */

/* ------------------------------------------------------------------ */
/* The contract                                                        */
/* ------------------------------------------------------------------ */

const ROOT = join(import.meta.dir, "..");
const ALLOWLIST_DIR = join(ROOT, "app-allowlist");
const ANDROID_ALLOWLIST = join(ALLOWLIST_DIR, "AndroidManifest.xml");
const IOS_INFO_PLIST = join(ALLOWLIST_DIR, "Info.plist");
const IOS_ENTITLEMENTS = join(ALLOWLIST_DIR, "entitlements.plist");
const IOS_PRIVACY = join(ALLOWLIST_DIR, "PrivacyInfo.xcprivacy");

/** The real application id. Both app stores and the well-known files use it. */
const EXPECTED_PACKAGE = "me.securevoiceai.shield";

/** The one public host of the site, the docs and the app links. */
const EXPECTED_HOST = "shield.securevoiceai.me";

/** Per-app languages: en, ar, hi, ur, sw, lg (14, section 10.2). */
const EXPECTED_LOCALES = ["en", "ar", "hi", "ur", "sw", "lg"];

/** Permissions the app is allowed to request (14, section 10.2). */
const REQUIRED_ALLOWED_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.VIBRATE",
];

/** Permissions that must never be requested, whatever a library adds. */
const REQUIRED_FORBIDDEN_PERMISSIONS = [
  "android.permission.READ_SMS",
  "android.permission.RECEIVE_SMS",
  "android.permission.READ_CALL_LOG",
  "android.permission.READ_CONTACTS",
  "android.permission.RECORD_AUDIO",
  "android.permission.ACCESS_FINE_LOCATION",
  "com.google.android.gms.permission.AD_ID",
];

/** Usage descriptions Shield deliberately does not ask for (14, section 10.3). */
const FORBIDDEN_USAGE_DESCRIPTIONS = [
  "NSMicrophoneUsageDescription",
  "NSContactsUsageDescription",
  "NSLocationWhenInUseUsageDescription",
  "NSLocationAlwaysUsageDescription",
  "NSLocationAlwaysAndWhenInUseUsageDescription",
  "NSUserTrackingUsageDescription",
];

/** Keys the privacy manifest must carry. */
const REQUIRED_PRIVACY_KEYS = [
  "NSPrivacyTracking",
  "NSPrivacyTrackingDomains",
  "NSPrivacyCollectedDataTypes",
  "NSPrivacyAccessedAPITypes",
];

/** The only data types Shield collects (14, section 10.3). */
const EXPECTED_COLLECTED_DATA_TYPES = [
  "NSPrivacyCollectedDataTypePhoneNumber",
  "NSPrivacyCollectedDataTypeAudioData",
  "NSPrivacyCollectedDataTypeCrashData",
];

/** The required-reason APIs, with the reason code each one needs. */
const EXPECTED_ACCESSED_APIS: { category: string; reason: string }[] = [
  { category: "NSPrivacyAccessedAPICategoryUserDefaults", reason: "CA92.1" },
  { category: "NSPrivacyAccessedAPICategorySystemBootTime", reason: "35F9.1" },
];

/* ------------------------------------------------------------------ */
/* A small, dependency-free XML reader                                  */
/* ------------------------------------------------------------------ */

type XmlElement = {
  kind: "element";
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
};

type XmlText = { kind: "text"; value: string };

type XmlNode = XmlElement | XmlText;

const NAME_START = /[A-Za-z_:]/;
const NAME_CHAR = /[A-Za-z0-9_:.\-]/;

class XmlReader {
  private index = 0;

  constructor(private readonly source: string) {}

  /** Parse the document and return its root element. */
  parseDocument(): XmlElement {
    this.skipMisc();
    if (this.peek() !== "<") throw this.fail("expected a root element");
    const root = this.readElement();
    this.skipMisc();
    if (this.index < this.source.length) throw this.fail("unexpected content after the root element");
    return root;
  }

  private fail(message: string): Error {
    const upTo = this.source.slice(0, this.index);
    const line = upTo.split("\n").length;
    const column = this.index - upTo.lastIndexOf("\n");
    return new Error(`${message} (line ${line}, column ${column})`);
  }

  private peek(): string {
    return this.source[this.index] ?? "";
  }

  private startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  private skipWhitespace(): void {
    while (this.index < this.source.length && /\s/.test(this.source[this.index] as string)) this.index += 1;
  }

  /** Whitespace, comments, processing instructions and the doctype. */
  private skipMisc(): void {
    for (;;) {
      this.skipWhitespace();
      if (this.startsWith("<!--")) {
        const end = this.source.indexOf("-->", this.index + 4);
        if (end === -1) throw this.fail("unterminated comment");
        this.index = end + 3;
        continue;
      }
      if (this.startsWith("<?")) {
        const end = this.source.indexOf("?>", this.index + 2);
        if (end === -1) throw this.fail("unterminated processing instruction");
        this.index = end + 2;
        continue;
      }
      if (this.startsWith("<!DOCTYPE")) {
        this.skipDoctype();
        continue;
      }
      return;
    }
  }

  private skipDoctype(): void {
    this.index += "<!DOCTYPE".length;
    let depth = 0;
    while (this.index < this.source.length) {
      const character = this.source[this.index] as string;
      if (character === "[") depth += 1;
      else if (character === "]") depth -= 1;
      else if (character === ">" && depth <= 0) {
        this.index += 1;
        return;
      }
      this.index += 1;
    }
    throw this.fail("unterminated doctype");
  }

  private readName(): string {
    const start = this.index;
    if (!NAME_START.test(this.peek())) throw this.fail("expected a name");
    this.index += 1;
    while (this.index < this.source.length && NAME_CHAR.test(this.source[this.index] as string)) {
      this.index += 1;
    }
    return this.source.slice(start, this.index);
  }

  private readElement(): XmlElement {
    if (this.peek() !== "<") throw this.fail("expected '<'");
    this.index += 1;
    const name = this.readName();
    const attributes: Record<string, string> = {};

    for (;;) {
      const before = this.index;
      this.skipWhitespace();
      if (this.startsWith("/>")) {
        this.index += 2;
        return { kind: "element", name, attributes, children: [] };
      }
      if (this.peek() === ">") {
        this.index += 1;
        const children = this.readChildren(name);
        return { kind: "element", name, attributes, children };
      }
      if (this.index === before) throw this.fail("expected whitespace before an attribute");

      const attributeName = this.readName();
      this.skipWhitespace();
      if (this.peek() !== "=") throw this.fail(`attribute "${attributeName}" has no value`);
      this.index += 1;
      this.skipWhitespace();

      const quote = this.peek();
      if (quote !== '"' && quote !== "'") throw this.fail(`attribute "${attributeName}" is not quoted`);
      this.index += 1;
      const end = this.source.indexOf(quote, this.index);
      if (end === -1) throw this.fail(`attribute "${attributeName}" is not closed`);
      const raw = this.source.slice(this.index, end);
      this.index = end + 1;

      if (Object.prototype.hasOwnProperty.call(attributes, attributeName)) {
        throw this.fail(`attribute "${attributeName}" is declared twice`);
      }
      attributes[attributeName] = this.decodeEntities(raw);
    }
  }

  private readChildren(parentName: string): XmlNode[] {
    const children: XmlNode[] = [];

    for (;;) {
      if (this.index >= this.source.length) throw this.fail(`<${parentName}> is never closed`);

      if (this.startsWith("</")) {
        this.index += 2;
        const name = this.readName();
        this.skipWhitespace();
        if (this.peek() !== ">") throw this.fail(`</${name}> is not closed`);
        this.index += 1;
        if (name !== parentName) throw this.fail(`</${name}> closes <${parentName}>`);
        return children;
      }

      if (this.startsWith("<!--")) {
        const end = this.source.indexOf("-->", this.index + 4);
        if (end === -1) throw this.fail("unterminated comment");
        this.index = end + 3;
        continue;
      }

      if (this.startsWith("<?")) {
        const end = this.source.indexOf("?>", this.index + 2);
        if (end === -1) throw this.fail("unterminated processing instruction");
        this.index = end + 2;
        continue;
      }

      if (this.startsWith("<![CDATA[")) {
        const end = this.source.indexOf("]]>", this.index + 9);
        if (end === -1) throw this.fail("unterminated CDATA section");
        children.push({ kind: "text", value: this.source.slice(this.index + 9, end) });
        this.index = end + 3;
        continue;
      }

      if (this.peek() === "<") {
        children.push(this.readElement());
        continue;
      }

      const start = this.index;
      while (this.index < this.source.length && this.source[this.index] !== "<") this.index += 1;
      children.push({ kind: "text", value: this.decodeEntities(this.source.slice(start, this.index)) });
    }
  }

  private decodeEntities(text: string): string {
    return text.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (match, entity: string) => {
      let code: number;
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        code = Number.parseInt(entity.slice(2), 16);
      } else if (entity.startsWith("#")) {
        code = Number.parseInt(entity.slice(1), 10);
      } else {
        switch (entity) {
          case "amp":
            return "&";
          case "lt":
            return "<";
          case "gt":
            return ">";
          case "quot":
            return "\"";
          case "apos":
            return "'";
          default:
            throw this.fail(`unknown entity "&${entity};"`);
        }
      }
      if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return match;
      return String.fromCodePoint(code);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Tree helpers                                                        */
/* ------------------------------------------------------------------ */

/** The child elements of a node, in document order. */
function children(node: XmlElement): XmlElement[] {
  return node.children.filter((child): child is XmlElement => child.kind === "element");
}

/** Every descendant element of a node, in document order. */
function descendants(node: XmlElement): XmlElement[] {
  const out: XmlElement[] = [];
  for (const child of children(node)) {
    out.push(child, ...descendants(child));
  }
  return out;
}

/** Every descendant element with the given name. */
function findAll(node: XmlElement, name: string): XmlElement[] {
  return descendants(node).filter((child) => child.name === name);
}

/** The first descendant element with the given name, or null. */
function findFirst(node: XmlElement, name: string): XmlElement | null {
  return findAll(node, name)[0] ?? null;
}

/** The concatenated text of a node. */
function textOf(node: XmlElement): string {
  return node.children
    .filter((child): child is XmlText => child.kind === "text")
    .map((child) => child.value)
    .join("");
}

/** True when a descendant element carries the given attribute with the given value. */
function hasDescendantAttribute(node: XmlElement, name: string, value: string): boolean {
  return descendants(node).some((child) => child.attributes[name] === value);
}

/* ------------------------------------------------------------------ */
/* Property lists                                                      */
/* ------------------------------------------------------------------ */

type PlistValue = string | boolean | number | PlistValue[] | { [key: string]: PlistValue };

/** Read a property list into plain JavaScript values. */
function parsePlist(source: string): PlistValue {
  const root = new XmlReader(source).parseDocument();
  if (root.name !== "plist") throw new Error(`expected a <plist> document, found <${root.name}>`);
  const values = children(root);
  if (values.length !== 1) throw new Error("<plist> must hold exactly one value");
  return plistValue(values[0] as XmlElement);
}

function plistValue(node: XmlElement): PlistValue {
  switch (node.name) {
    case "dict": {
      const out: Record<string, PlistValue> = {};
      const items = children(node);
      for (let index = 0; index < items.length; index += 1) {
        const keyNode = items[index] as XmlElement;
        if (keyNode.name !== "key") throw new Error(`<dict> expects <key>, found <${keyNode.name}>`);
        const valueNode = items[index + 1];
        if (!valueNode) throw new Error(`<key>${textOf(keyNode)}</key> has no value`);
        out[textOf(keyNode).trim()] = plistValue(valueNode);
        index += 1;
      }
      return out;
    }
    case "array":
      return children(node).map(plistValue);
    case "string":
      return textOf(node);
    case "true":
      return true;
    case "false":
      return false;
    case "integer":
      return Number.parseInt(textOf(node).trim(), 10);
    case "real":
      return Number.parseFloat(textOf(node).trim());
    case "data":
    case "date":
      return textOf(node).trim();
    default:
      throw new Error(`unsupported property-list element <${node.name}>`);
  }
}

/** The dictionary of a property list, or a failure. */
function plistDictionary(value: PlistValue, label: string): Record<string, PlistValue> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} is not a dictionary`);
  }
  return value as Record<string, PlistValue>;
}

/** The string array of a property list, or a failure. */
function plistStringArray(value: PlistValue, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} is not an array`);
  return value.map((entry) => (typeof entry === "string" ? entry : JSON.stringify(entry)));
}

/* ------------------------------------------------------------------ */
/* Checks                                                              */
/* ------------------------------------------------------------------ */

type Result = { problems: string[]; lines: string[] };

async function readText(path: string): Promise<string | null> {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return await file.text();
}

/** The Android allow-list: what may be requested, what must never appear. */
async function checkAndroidAllowList(): Promise<Result & { allowed: Set<string>; forbidden: Set<string> }> {
  const problems: string[] = [];
  const lines: string[] = [];
  const allowed = new Set<string>();
  const forbidden = new Set<string>();

  const source = await readText(ANDROID_ALLOWLIST);
  if (source === null) {
    problems.push(`app-allowlist/AndroidManifest.xml is missing`);
    return { problems, lines, allowed, forbidden };
  }

  let root: XmlElement;
  try {
    root = new XmlReader(source).parseDocument();
  } catch (error) {
    problems.push(`app-allowlist/AndroidManifest.xml is not well-formed XML: ${(error as Error).message}`);
    return { problems, lines, allowed, forbidden };
  }

  if (root.name !== "manifest") {
    problems.push(`app-allowlist/AndroidManifest.xml: root element is <${root.name}>, expected <manifest>`);
    return { problems, lines, allowed, forbidden };
  }

  const packageName = root.attributes["package"] ?? "";
  if (packageName !== EXPECTED_PACKAGE) {
    problems.push(`app-allowlist/AndroidManifest.xml: package is "${packageName}", expected "${EXPECTED_PACKAGE}"`);
  }

  for (const node of children(root)) {
    if (node.name !== "uses-permission" && node.name !== "uses-permission-sdk-23") continue;
    const name = node.attributes["android:name"];
    if (!name) {
      problems.push("app-allowlist/AndroidManifest.xml: a <uses-permission> has no android:name");
      continue;
    }
    if (node.attributes["tools:node"] === "remove") forbidden.add(name);
    else allowed.add(name);
  }

  for (const name of REQUIRED_ALLOWED_PERMISSIONS) {
    if (!allowed.has(name)) problems.push(`app-allowlist/AndroidManifest.xml: does not allow ${name}`);
  }
  for (const name of REQUIRED_FORBIDDEN_PERMISSIONS) {
    if (!forbidden.has(name)) problems.push(`app-allowlist/AndroidManifest.xml: does not forbid ${name}`);
  }
  for (const name of allowed) {
    if (forbidden.has(name)) {
      problems.push(`app-allowlist/AndroidManifest.xml: ${name} is both allowed and forbidden`);
    }
  }

  const application = findFirst(root, "application");
  if (!application) {
    problems.push("app-allowlist/AndroidManifest.xml: no <application> element");
    return { problems, lines, allowed, forbidden };
  }

  const applicationAttributes: Record<string, string> = {
    "android:allowBackup": application.attributes["android:allowBackup"] ?? "",
    "android:usesCleartextTraffic": application.attributes["android:usesCleartextTraffic"] ?? "",
    "android:supportsRtl": application.attributes["android:supportsRtl"] ?? "",
  };
  if (applicationAttributes["android:allowBackup"] !== "false") {
    problems.push('app-allowlist/AndroidManifest.xml: android:allowBackup must be "false"');
  }
  if (applicationAttributes["android:usesCleartextTraffic"] !== "false") {
    problems.push('app-allowlist/AndroidManifest.xml: android:usesCleartextTraffic must be "false"');
  }
  if (applicationAttributes["android:supportsRtl"] !== "true") {
    problems.push('app-allowlist/AndroidManifest.xml: android:supportsRtl must be "true"');
  }

  const activities = children(application).filter((node) => node.name === "activity");
  const mainActivity = activities.find((node) => node.attributes["android:name"] === ".MainActivity");
  if (!mainActivity) {
    problems.push("app-allowlist/AndroidManifest.xml: no .MainActivity element");
  } else {
    if (mainActivity.attributes["android:exported"] !== "true") {
      problems.push("app-allowlist/AndroidManifest.xml: .MainActivity must be exported");
    }
    const filters = children(mainActivity).filter((node) => node.name === "intent-filter");
    const launcher = filters.some(
      (filter) =>
        hasDescendantAttribute(filter, "android:name", "android.intent.action.MAIN") &&
        hasDescendantAttribute(filter, "android:name", "android.intent.category.LAUNCHER"),
    );
    if (!launcher) {
      problems.push("app-allowlist/AndroidManifest.xml: .MainActivity has no MAIN/LAUNCHER intent filter");
    }
    const appLinks = filters.some(
      (filter) =>
        filter.attributes["android:autoVerify"] === "true" &&
        hasDescendantAttribute(filter, "android:name", "android.intent.action.VIEW") &&
        findAll(filter, "data").some(
          (data) =>
            data.attributes["android:host"] === EXPECTED_HOST && data.attributes["android:scheme"] === "https",
        ),
    );
    if (!appLinks) {
      problems.push(
        `app-allowlist/AndroidManifest.xml: .MainActivity has no verified App Links intent filter for ${EXPECTED_HOST}`,
      );
    }
    const share = filters.some(
      (filter) =>
        hasDescendantAttribute(filter, "android:name", "android.intent.action.SEND") &&
        findAll(filter, "data").some((data) => (data.attributes["android:mimeType"] ?? "").startsWith("audio/")),
    );
    if (!share) {
      problems.push("app-allowlist/AndroidManifest.xml: .MainActivity has no share-a-voice-note intent filter");
    }
  }

  const services = children(application).filter((node) => node.name === "service");
  const screening = services.find((node) => node.attributes["android:name"] === ".screening.ShieldCallScreeningService");
  if (screening) {
    if (screening.attributes["android:permission"] !== "android.permission.BIND_SCREENING_SERVICE") {
      problems.push("app-allowlist/AndroidManifest.xml: ShieldCallScreeningService must require BIND_SCREENING_SERVICE");
    }
    if (screening.attributes["android:exported"] !== "true") {
      problems.push("app-allowlist/AndroidManifest.xml: ShieldCallScreeningService must be exported");
    }
    if (!hasDescendantAttribute(screening, "android:name", "android.telecom.CallScreeningService")) {
      problems.push(
        "app-allowlist/AndroidManifest.xml: ShieldCallScreeningService must handle android.telecom.CallScreeningService",
      );
    }
  }

  lines.push(`✔ ${relative(ANDROID_ALLOWLIST)}`);
  lines.push(`    allowed permissions (${allowed.size}): ${[...allowed].join(", ")}`);
  lines.push(`    forbidden permissions (${forbidden.size}): ${[...forbidden].join(", ")}`);
  lines.push(
    `    application: allowBackup=${applicationAttributes["android:allowBackup"]}, usesCleartextTraffic=${applicationAttributes["android:usesCleartextTraffic"]}, supportsRtl=${applicationAttributes["android:supportsRtl"]}`,
  );
  lines.push(`    MainActivity: launcher, verified App Links (${EXPECTED_HOST}) and share-audio intent filters`);
  lines.push(
    screening
      ? "    ShieldCallScreeningService: present (optional), bound with BIND_SCREENING_SERVICE"
      : "    ShieldCallScreeningService: absent (optional)",
  );

  return { problems, lines, allowed, forbidden };
}

/** The iOS reference: Info.plist, entitlements and the privacy manifest. */
async function checkIosFiles(): Promise<Result> {
  const problems: string[] = [];
  const lines: string[] = [];

  const infoSource = await readText(IOS_INFO_PLIST);
  if (infoSource === null) {
    problems.push("app-allowlist/Info.plist is missing");
  } else {
    try {
      const info = plistDictionary(parsePlist(infoSource), "Info.plist");

      if (info["CFBundleIdentifier"] !== EXPECTED_PACKAGE) {
        problems.push(`Info.plist: CFBundleIdentifier is "${String(info["CFBundleIdentifier"])}", expected "${EXPECTED_PACKAGE}"`);
      }

      const localizations = plistStringArray(info["CFBundleLocalizations"] ?? [], "Info.plist: CFBundleLocalizations");
      const missing = EXPECTED_LOCALES.filter((locale) => !localizations.includes(locale));
      const extra = localizations.filter((locale) => !EXPECTED_LOCALES.includes(locale));
      if (missing.length > 0) problems.push(`Info.plist: CFBundleLocalizations is missing ${missing.join(", ")}`);
      if (extra.length > 0) problems.push(`Info.plist: CFBundleLocalizations has unexpected ${extra.join(", ")}`);

      const backgroundModes = plistStringArray(info["UIBackgroundModes"] ?? [], "Info.plist: UIBackgroundModes");
      if (!backgroundModes.includes("remote-notification")) {
        problems.push("Info.plist: UIBackgroundModes must include remote-notification");
      }

      if (info["ITSAppUsesNonExemptEncryption"] !== false) {
        problems.push("Info.plist: ITSAppUsesNonExemptEncryption must be false");
      }

      const transport = plistDictionary(info["NSAppTransportSecurity"] ?? {}, "Info.plist: NSAppTransportSecurity");
      if (transport["NSAllowsArbitraryLoads"] !== false) {
        problems.push("Info.plist: NSAppTransportSecurity.NSAllowsArbitraryLoads must be false");
      }

      for (const key of FORBIDDEN_USAGE_DESCRIPTIONS) {
        if (key in info) problems.push(`Info.plist: ${key} is present, but Shield deliberately does not ask for it`);
      }

      lines.push(`✔ ${relative(IOS_INFO_PLIST)}`);
      lines.push(`    localizations: ${localizations.join(", ")}`);
      lines.push(`    background modes: ${backgroundModes.join(", ")}`);
      lines.push("    ITSAppUsesNonExemptEncryption=false, NSAllowsArbitraryLoads=false");
      lines.push(`    absent usage descriptions: ${FORBIDDEN_USAGE_DESCRIPTIONS.length} checked, none present`);
    } catch (error) {
      problems.push(`app-allowlist/Info.plist is not a valid property list: ${(error as Error).message}`);
    }
  }

  const entitlementSource = await readText(IOS_ENTITLEMENTS);
  if (entitlementSource === null) {
    problems.push("app-allowlist/entitlements.plist is missing");
  } else {
    try {
      const entitlements = plistDictionary(parsePlist(entitlementSource), "entitlements.plist");
      const domains = plistStringArray(
        entitlements["com.apple.developer.associated-domains"] ?? [],
        "entitlements.plist: com.apple.developer.associated-domains",
      );
      for (const expected of [`applinks:${EXPECTED_HOST}`, `webcredentials:${EXPECTED_HOST}`]) {
        if (!domains.includes(expected)) {
          problems.push(`entitlements.plist: com.apple.developer.associated-domains is missing ${expected}`);
        }
      }
      lines.push(`✔ ${relative(IOS_ENTITLEMENTS)}`);
      lines.push(`    associated-domains: ${domains.join(", ")}`);
    } catch (error) {
      problems.push(`app-allowlist/entitlements.plist is not a valid property list: ${(error as Error).message}`);
    }
  }

  const privacySource = await readText(IOS_PRIVACY);
  if (privacySource === null) {
    problems.push("app-allowlist/PrivacyInfo.xcprivacy is missing");
  } else {
    try {
      const privacy = plistDictionary(parsePlist(privacySource), "PrivacyInfo.xcprivacy");

      for (const key of REQUIRED_PRIVACY_KEYS) {
        if (!(key in privacy)) problems.push(`PrivacyInfo.xcprivacy: ${key} is missing`);
      }
      if (privacy["NSPrivacyTracking"] !== false) {
        problems.push("PrivacyInfo.xcprivacy: NSPrivacyTracking must be false");
      }
      const trackingDomains = privacy["NSPrivacyTrackingDomains"];
      if (!Array.isArray(trackingDomains) || trackingDomains.length !== 0) {
        problems.push("PrivacyInfo.xcprivacy: NSPrivacyTrackingDomains must be an empty array");
      }

      const collected = privacy["NSPrivacyCollectedDataTypes"];
      const collectedTypes = Array.isArray(collected)
        ? collected.map((entry) => {
            if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return "";
            return String((entry as Record<string, PlistValue>)["NSPrivacyCollectedDataType"] ?? "");
          })
        : [];
      for (const expected of EXPECTED_COLLECTED_DATA_TYPES) {
        if (!collectedTypes.includes(expected)) {
          problems.push(`PrivacyInfo.xcprivacy: NSPrivacyCollectedDataTypes is missing ${expected}`);
        }
      }

      const accessed = privacy["NSPrivacyAccessedAPITypes"];
      const accessedCategories = Array.isArray(accessed)
        ? accessed.map((entry) => {
            if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return null;
            const dict = entry as Record<string, PlistValue>;
            const reasons = dict["NSPrivacyAccessedAPITypeReasons"];
            return {
              category: String(dict["NSPrivacyAccessedAPIType"] ?? ""),
              reasons: Array.isArray(reasons) ? reasons.map((reason) => String(reason)) : [],
            };
          })
        : [];
      for (const expected of EXPECTED_ACCESSED_APIS) {
        const found = accessedCategories.find((entry) => entry?.category === expected.category);
        if (!found) {
          problems.push(`PrivacyInfo.xcprivacy: NSPrivacyAccessedAPITypes is missing ${expected.category}`);
        } else if (!found.reasons.includes(expected.reason)) {
          problems.push(
            `PrivacyInfo.xcprivacy: ${expected.category} must declare reason ${expected.reason}`,
          );
        }
      }

      lines.push(`✔ ${relative(IOS_PRIVACY)}`);
      lines.push(`    collected data types: ${collectedTypes.join(", ")}`);
      lines.push(
        `    accessed APIs: ${EXPECTED_ACCESSED_APIS.map((api) => `${api.category} (${api.reason})`).join(", ")}`,
      );
    } catch (error) {
      problems.push(`app-allowlist/PrivacyInfo.xcprivacy is not a valid property list: ${(error as Error).message}`);
    }
  }

  return { problems, lines };
}

/** Compare a merged manifest with the allow-list. */
function compareMergedManifest(
  root: XmlElement,
  allowed: Set<string>,
  forbidden: Set<string>,
  mergedPath: string,
): { problems: string[]; lines: string[] } {
  const problems: string[] = [];
  const lines: string[] = [];

  const packageName = root.attributes["package"];
  if (packageName !== undefined && packageName !== EXPECTED_PACKAGE) {
    problems.push(`merged manifest: package is "${packageName}", expected "${EXPECTED_PACKAGE}"`);
  }

  const requested = new Map<string, XmlElement>();
  for (const node of findAll(root, "uses-permission")) {
    const name = node.attributes["android:name"];
    if (!name) continue;
    requested.set(name, node);
  }

  for (const [name, node] of requested) {
    if (forbidden.has(name)) {
      problems.push(`merged manifest requests the forbidden permission ${name}`);
    } else if (!allowed.has(name)) {
      problems.push(`merged manifest requests ${name}, which is not in the allow-list`);
    }
    if (node.attributes["tools:node"] === "remove") {
      problems.push(`merged manifest still carries ${name} with tools:node="remove" — the removal was not applied`);
    }
  }

  const application = findFirst(root, "application");
  if (application) {
    if (application.attributes["android:allowBackup"] === "true") {
      problems.push('merged manifest sets android:allowBackup="true" — backups are not allowed');
    }
    if (application.attributes["android:usesCleartextTraffic"] === "true") {
      problems.push('merged manifest sets android:usesCleartextTraffic="true" — cleartext traffic is not allowed');
    }
  }

  lines.push(`✔ merged manifest: ${relative(mergedPath)}`);
  lines.push(`    permissions requested: ${requested.size} (${[...requested.keys()].join(", ") || "none"})`);
  lines.push(`    forbidden permissions found: ${[...requested.keys()].filter((name) => forbidden.has(name)).length}`);

  return { problems, lines };
}

/** A path relative to the repository root, for readable output. */
function relative(path: string): string {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path;
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const problems: string[] = [];
  const lines: string[] = [];
  const mergedPath = process.argv[2];

  lines.push("Shield app manifest contract — check:app-manifest");
  lines.push("");
  lines.push("Parse method: bundled dependency-free XML reader in this script — the documents are");
  lines.push("parsed into a tree and read structurally, not matched with regular expressions.");

  const android = await checkAndroidAllowList();
  problems.push(...android.problems);
  lines.push(...android.lines);

  const ios = await checkIosFiles();
  problems.push(...ios.problems);
  lines.push(...ios.lines);

  lines.push("");

  if (mergedPath) {
    const source = await readText(mergedPath);
    if (source === null) {
      problems.push(`merged manifest ${mergedPath} does not exist`);
    } else {
      try {
        const root = new XmlReader(source).parseDocument();
        const comparison = compareMergedManifest(root, android.allowed, android.forbidden, mergedPath);
        problems.push(...comparison.problems);
        lines.push(...comparison.lines);
      } catch (error) {
        problems.push(`merged manifest ${mergedPath} is not well-formed XML: ${(error as Error).message}`);
      }
    }
  } else {
    lines.push("⚠ Merged-manifest comparison SKIPPED: no merged manifest was supplied.");
    lines.push("  The allow-list itself is valid, but the app-level check (merged manifest against");
    lines.push("  the allow-list) has NOT run. Nothing about the shipped app has been verified.");
    lines.push("  Run: bun scripts/check-app-manifest.ts path/to/AndroidManifest.xml");
  }

  lines.push("");

  if (problems.length > 0) {
    console.error("✖ app manifest contract failed:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(lines.join("\n"));
}

await main();
