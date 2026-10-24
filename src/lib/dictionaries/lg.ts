/**
 * Luganda (Uganda).
 *
 * The verdict words and the Guardian script come from the engine
 * (src/lib/shield-engine.ts) so the words here match the words the
 * engine already speaks. Every line is marked as pending native review:
 * a native Luganda speaker has not signed this off yet, and language QA
 * is a market go-live gate (14, section 12).
 */
import type { PartialDictionary } from "@/lib/i18n";
import { pending as t, untranslated as u } from "./copy";

export const lg: PartialDictionary = {
  meta: {
    title: t("Ensimu eno egenda ku banki wange? · SecureVoice Shield"),
    description: t(
      "Ensimu eno egenda ku banki wange ekweli? Kebera ne Shield — enzima ez'ekakiro, ennamba ez'obuwali, ne SIM ezaliwo kuweekyako. Shield tetiggwa nyuma.",
    ),
  },

  review: {
    badge: t("Teyekubiriza okukebera kwa mutundu ow'ekigendererwa"),
    badgeDetail: t(
      "Olupapula luno luviiridwa n'ekizibu kyetu, naye tekakubirizibwa n'omutundu ow'ekigendererwa yeto. Emiggwa eg'eb dotted yetekakubirizibwa — ebimu bisobola okusobola mu Luganda.",
    ),
    pendingTitle: t("Oluggede luno terakubirizibwa n'omutundu ow'ekigendererwa."),
    untranslatedTitle: t("Oluggede luno lw'obw'olulimi lw'Angereza."),
  },

  nav: {
    homeLabel: t("Ewikyero ewa SecureVoice Shield"),
    brand: t("Enzima eno ekweli?"),
    demo: t("Olulaku lwa mubala"),
    verdicts: t("Ebiseeko"),
    how: t("Nga gye enkola"),
    markets: t("Amaduuka"),
    agents: t("Abayizi"),
    audit: t("Oluurombo lw'okukebera"),
    runCheck: t("Kola okukebera"),
    skipToContent: t("Kiddooka ku bintu"),
    openMenu: t("Bikkula menu"),
    closeMenu: t("Gginga menu"),
    main: t("Omukuru"),
    mobile: t("Telefoni"),
  },

  goldenRule: {
    items: [
      t("Shield tetiggwa nyuma"),
      t("Omulekeza kuwaayo omulimu PIN obanga nnansi awali"),
      t("Ggyi olukomo era oggolodola ku lunumbero ow'olemala"),
      t("Okukebera okutali kukoma kumi nga bulungi"),
    ],
    screenReader: t(
      "Amateeka g'omukwata: Shield tetiggwa nyuma. Omulekeza kuwaayo omulimu PIN obanga nnansi awali.",
    ),
  },

  hero: {
    badge: t("Ekizibu kya ku-Zeragana nga SecureVoice AI"),
    headlineA: t("Enzima bw'ekakiro,"),
    headlineB: t("Shield n'gwa."),
    lede: t(
      "Abatanyi b'ensimu bakiiwa mu zzimi, babaakubisa ennamba ez'abaali, era baggyeyo SIM okuwagguzayo nga abe muganda wange, mufumba wange oba banki wange. Shield eriina ku muk wa kabiri n'omuk wa banki — ekkanula buli ensimu es'obuzibu, olunaku lw'enkooko, n'okubika olunyonnyole bw'oluwondero, n'okwanga mu nnimi ekyali.",
    ),
    ctaPrimary: t("Gbaluka ozokudde okukola nnyo"),
    ctaSecondary: t("Nga gye enkola"),
    stats: [
      { v: t("4"), l: t("amaduka · AE KE UG TZ") },
      { v: t("11"), l: t("ennimi 11, ng'okulimu Luganda mu kkati") },
      { v: t("1.5 s"), l: t("kiseeko ky'obusise kwa mu kiseeko") },
      { v: t("60 s"), l: t("enzima, nga oluvayo") },
    ],
    channels: [
      t("Botu ya okukebera ku WhatsApp"),
      t("Live Call Guardian mu kulaba mu kiseeko"),
      t("USSD ne SMS — tetaali data"),
      t("Amazigo g'ebiseeko nga okusisimukira"),
      t("Tewali kweyolesa PIN obanga nnansi awali"),
    ],
    visual: {
      plane: u("signal plane · cell ug"),
      streaming: u("streaming"),
      guard: u("guard · engine · verdict"),
      fusedVerdict: u("fused verdict"),
      caution: u("Caution — be careful"),
      danger: u("Danger"),
      dangerMeta: u("3 pulses · octagon"),
      verified: u("Verified call"),
      verifiedMeta: u("bank registered"),
      detectors: [
        { id: "D1", label: u("ElevenLabs classifier"), state: u("ok") },
        { id: "D2", label: u("independent detector"), state: u("ok") },
        { id: "D3", label: u("in-house deepfake"), state: u("signal") },
        { id: "TEL", label: u("SIM swap · forwarding"), state: u("ok") },
        { id: "CUE", label: u("scam-script pressure"), state: u("signal") },
      ],
    },
  },

  stats: {
    ariaLabel: t("Lwaki Shield waliwo"),
    items: [
      {
        v: t("17,152"),
        l: t("ebuzibu n'obunakolemukiriza ez'okutebwa kwa TCRA mu kiro eky'okunsimukiza (TZ, Q1 2025)"),
      },
      { v: t("80%+"), l: t("abakola TTS abaakwatowoola ku kizibu ky'okulamu (ekigendererwa kya v1)") },
      { v: t("< 2%"), l: t("kkali kya kitundu kya mbeeyi ku mpeera za muntu ng'akw'akava (ekigendererwa kya v1)") },
      {
        v: t("< 10 s"),
        l: t("kutonna ku nnaku ey'okuyanja okutuuka ku lunaku lwa nnimi ekyali"),
      },
    ],
  },

  sandbox: {
    eyebrow: t("Olusanduku lwa mubala"),
    title: t("Kola ekebera nga bw'omuliro"),
    lede: t(
      "Olufuko lwa Shield: enggwa ey'ekateekero, emitendera y'ebiseeko, ensozi ew'ekikwata kwa Guardian, n'olw'ekyanko ekisoboka ku hash — byonna bikwata ku bisinga b'obw'alema.",
    ),
    caption: t(
      "sandbxia · data ey'ekikola · bisinga by'ateleko bitandise buli kiro · noga tebeza olukomo bw'ekikwata",
    ),
    consoleNote: t("Olusanduku lwa mubala lulaba mu Luganda."),
    tabs: {
      number: t("Kebera ennamba"),
      voice: t("Kebera olunaku lw'enzima"),
      guardian: t("Live Call Guardian"),
      verified: t("Ensimu eyo nali ya kikwata?"),
    },
  },

  verdicts: {
    eyebrow: t("Ebiseeko bitano"),
    title: t("Obubali, kitundu, liwandi era nnyimiriza — si kitundu kennyongoose"),
    lede: t(
      "Buliko buli kiseeko kikwata eka kkanzu n'kumi n'olunaku n'obuzibu, nga bw'ekikola ku nnimila nnungi, eri mu nsi y'obuzibu obutono, mu nnimi yonna ewa kkumi n'emu.",
    ),
    goldenRuleLabel: t("amateeka g'omukwata"),
    goldenRuleLine: t("Shield tetiggwa nyuma."),
    goldenRuleBody: t(
      "Bbuli ensimu ez'ekyeyamba okuba Shield n'utapeli. Ekisomo ekisanyusa Shield ekikola kikumi nga “Tewali bulabe” — si “kikwata mwe”.",
    ),
    items: [
      {
        key: "clear",
        name: t("Tewali bulabe"),
        wording: t("Tewali bulabe bwa kukebera."),
        advice: t(
          "Buli kikomo, omulekeza kuwaayo omulimu PIN obanga nnansi awali. Kakano oluzuuto lwa kibazo ebikulu nga njia eseyi.",
        ),
        shape: t("ekizimbe nga nn"),
        color: t("Kitundu kya malembe"),
        pulses: 1,
      },
      {
        key: "caution",
        name: t("Komekeza"),
        wording: t("Komekeza bulungi."),
        advice: t("Ggyi olukomo era oggolodola ku lunumbero ow'olemala."),
        shape: t("ekisanyuko"),
        color: t("Kitundu kya ffene"),
        pulses: 2,
      },
      {
        key: "danger",
        name: t("Obulabe"),
        wording: t("Yima. Kino kikwata nga tapeli."),
        advice: t("Tewali kuyina ssente obanga kugaba nnansi. Sabika."),
        shape: t("ebiri nsatu"),
        color: t("Kitundu kya malembe"),
        pulses: 3,
      },
      {
        key: "inconclusive",
        name: t("Tetumanyidwa"),
        wording: t("Tetusobola."),
        advice: t(
          "Yiteekateeka bulungi. Okukebera okutali kukoma kumi nga bulungi.",
        ),
        shape: t("ekizimbe kisinga"),
        color: t("Kitundu kya mvu"),
        pulses: 0,
      },
      {
        key: "verified",
        name: t("Kikakasiddwa"),
        wording: t("Kino kikwata nga ensimu ya banki ey'akwadde."),
        advice: t(
          "Banki y'akwadde ensimu nga bwe mu mbeera. Obola okuyogera n'obulungi — Shield tebuliiko okusaba ennansi.",
        ),
        shape: t("ekikomo n'okuyimiriza okukakiza"),
        color: t("Kitundu kya malembe a'okuyimiriza"),
        pulses: 2,
      },
    ],
    pulseOne: t("nnyimiriza emu"),
    pulseMany: t("nnyimiriza"),
  },

  signals: {
    eyebrow: t("Nga gye enkola"),
    title: t("Ennimu n'ene eby'obuzibu. Ekiseeko ekimwe ekikwata bulungi."),
    lede: t(
      "Shield teggala ku kizibu kimwe. Ebisinga bya mu kizibu mukkalaba mu nfuko y'amateeka g'ekikwata n'okukebera — kiteekereza kompyuta tekaba mu kizibu kya kuteekezesa.",
    ),
    items: [
      {
        id: t("01 · okukebera enkokoo"),
        title: t("Enzima ew'ookw'ekikwata nga ya kompyuta?"),
        body: t(
          "Abakola okukebera abiri n'okusinga balaba buli kiro. Omu ye ElevenLabs AI Speech Classifier — 99% mu kikwata ku minyogovu ye — naye awamanyi enzima za ElevenLabs byawe, n'olw'olwo kikwata kimu, si kiseeko.",
        ),
      },
      {
        id: t("02 · okulamu"),
        title: t("Amanyi okugenda mu budde?"),
        body: t(
          "“Oddiza ebigendererwa bidi: kikapu, muzzi, sabi.” Amagambo gano g'akakyukira mu kiseeko kisinga, si lunaku oba kise. Enzima ez'ekakiro ziikola okukubuka, ziikola n'obuzibu oba zikyuka; abakola enzima za kompyuta tebajja okuwandika — era okuwandika kwo bunyobuka.",
        ),
      },
      {
        id: t("03 · olukomo"),
        title: t("Olukomo lwoo temanyukidde?"),
        body: t(
          "Ebisinga bya telco: SIM ewakiikyulukidwa, okulekeza enximi ku bwezza, okukyaba ennamba, VoIP erinnya nga ennamba y'omuliro. Kuweekyako kwa SIM kwo kuteekateeka obuzibu — si kikomo ku lw'enkola.",
        ),
      },
      {
        id: t("04 · olunaku"),
        title: t("Olunaku luno lw'aluma nga tapeli?"),
        body: t(
          "Kwesiga, obuzibu, ennamba empya (“telefoni yangi eyeze”), okubika ennansi ey'ekizibu oba PIN, okusula ssente n'ensente za mkononi, kadi za maduuka oba crypto. Bunyobuka bw'olunaku bwongera obuzibu — naye bwe bumala okujombogoza muntu.",
        ),
      },
    ],
    floor: {
      label: t("Amateeka g'okuzziba:"),
      body: t(
        "kitundu kisinga kimwe tekikola okulaba “Tewali bulabe”. Kimulaba buli mukola okukebera kuganja, abakola okukebera abiri ab'omuliro okukkiriza, era nga tetewali kisinga kisinga. Ebizibu ebirogera oba ebikkulebirizigga okujja okuba ekisomo ekikwata bulungi — naye si ekisomo ekisanyusa.",
      ),
    },
  },

  products: {
    eyebrow: t("Ebizibu bibiri, eggwanga limwe"),
    title: t("Bwa kila muntu. API kwa bbanka ne kampuni za simu."),
    lede: t(
      "Ebiseeko biffi, olw'ekyanko okwo okw'ekatako — eky'obulamu ky'obujjanjabi bwa mpolo, ekisanyusa ky'obujjanjabi n'obuzibu bwa OTP ne webhooks.",
    ),
    publicName: t("Shield kwa buli muntu"),
    publicBadge: t("bwungi · buli muntu"),
    businessName: t("Shield kwa bbanka ne kampuni za simu"),
    businessBadge: t("kulindirwa · api"),
    publicFeatures: [
      {
        t: t("Botu ya okukebera ku WhatsApp"),
        d: t(
          "Sindika olunaku lw'enzima es'obuzibu, olaba lujja mu nnimi w'omukyala ewo'okulaba kwa baribori — ebikwata n'okujja mu kizibu kya minnya okukyaba.",
        ),
      },
      {
        t: t("Live Call Guardian"),
        d: t(
          "Kekka Shield mu kiseeko. Nuuliza ekizibu ky'okulamu, n'awaayo gaddi. Ekiseeko kikwata mu kifo ky'ekikwata eky'ekisoboka.",
        ),
      },
      {
        t: t("Lw'ekibaleko"),
        d: t(
          "Tewali kukoma? Shield atindika amagambo ga butunfu agasala okw'okugaba ku SMS, WhatsApp oba USSD okuyimiriza omuzannyisa okuddayo.",
        ),
      },
      {
        t: t("USSD ne SMS"),
        d: t(
          "Kebera ennamba, kankaba nga banki yange teekereza buli, sabika tapeli — bila telefoni ya mpeya oba data.",
        ),
      },
      {
        t: t("Ekizibu ky'ekigero ekisoboka ku family"),
        d: t(
          "Enkola y'okuteekateeka kigero ekisoboka ku family. Shield talemaali kuutereka kugaba kigero, era tadola kumubaz'a.",
        ),
      },
      {
        t: t("Okusaba okutubuka tapeli"),
        d: t(
          "Kikoso kimo kuwonga ennamba n'ekikomo ky'enzima — si ekisanyusa ky'enzima y'omuntu — mu lusa lwa tapeli lw'ekikwata buli.",
        ),
      },
    ],
    businessFeatures: [
      {
        t: t("POST /v1/assess"),
        d: t(
          "Lonumbero lwa simu, enzima ya kuketo, ebintu eby'akasa — ebisoboka ku nsi: ekizibu, ebizibu, ekiteekateeka.",
        ),
      },
      {
        t: t("Okulwanga OTP"),
        d: t(
          "Kebera ku SIM ewakiikyulukidwa nga bwe totandika okutuma nnansi wa SMS — wabi nga okukakiza mu app oba okutunula mu branch.",
        ),
      },
      {
        t: t("Okuyimiriza kwa munaku"),
        d: t(
          "Nga SIM ewakiikyulukidwa oba mpokisi mupya, ssente nnyingi ziryimirizibwa mu minangka 30–60. Okugyokolako kikwata abantu babiri.",
        ),
      },
      {
        t: t("Ensimu ya banki ekakazidwa"),
        d: t(
          "Wandika ensimu ezitandika; abatunira balaba “Banki yange ekuggolodola leero”. Nga tetewali banner, ggyi olukomo.",
        ),
      },
      {
        t: t("Olw'ekyanko"),
        d: t(
          "Olw'ekyanko olw'ekiseeko kila kiseeko — ekikwata bulungi n'akasa k'olulimi olw'ekibulukya shield-verify.",
        ),
      },
    ],
    apiNote: t(
      "Kino API ya bizinesi. Olusanduku olwo ku luvunuko lw'olugwanga lunnannyini ku njia ez'obulamu — POST /api/assess nga { number } — okutunda okukebera njira y'obutaberwa.",
    ),
    failSafe: t("buli kizibu kikisoboka kikweruza step_up — si kikumi allow"),
  },

  markets: {
    eyebrow: t("Amaduuka"),
    title: t("Uganda guli ku level ya nkulu, Tanzania ye Kiswahili eggya w'ekisooka"),
    lede: t(
      "Amaduuka gana agalaba, ennimi kkumi n'emu, telefoni ez'obutikitara ne nzila za ssente ez'obutikitara — ekiseeko ekimwe ekikwata bulungi buli kifo. Amatoolo g'amateeka g'ebiikolwa mu nsi.",
    ),
    yourMarket: t("Amaduuka g'akifo"),
    zeroRated: t("USSD n'otandika butunfu nga bwe kisoboka — okukebera tekigulira mu mteekateeka"),
    patternLabel: t("Ekizibu ekisoboka okulaba"),
    awareness: t(
      "Embutano g'okutegeezagana okuyimiriza ebigendererwa ebiri buli kiseeko mu nnimi buli mu redio y'ekizibu: “Shield tetiggwa nyuma” n'omuwundo wa USSD. Emboozi za Tanzania n'azo zaakola n'15040 ya TCRA n'okukebera kwa *106# SIM ezirandikidwa ku kitundu kyo.",
    ),
    items: [
      {
        code: "AE",
        name: t("Emiralati eri Arabic"),
        languages: [t("Olu-Arabiki"), t("Olulimi lw'Angereza"), t("Olu-Hindi"), t("Olu-Urdu")],
        channels: [t("App"), t("WhatsApp"), t("SMS")],
        rails: t("Ekkadi, okusindika kwa banki, eby'obuyambi bw'emitwaro"),
        pattern: t(
          "Abapolisi oba abasawozi b'ebivisa okutandika abagenyi; ensimu z'ekizibu kwa kizibu ky'akaunti eggwanga.",
        ),
      },
      {
        code: "KE",
        name: t("Kenya"),
        languages: [t("Kiswahili"), t("Olulimi lw'Angereza"), t("Sheng-aware")],
        channels: [t("WhatsApp"), t("USSD"), t("SMS"), t("App")],
        rails: t("M-PESA, Airtel Money, PesaLink"),
        pattern: t(
          "Ensimu ez'okuddayo ssente ez'yalondwa nga tapeli; huduma za ab'omutunira ez'ekikwata zibaika PIN yo.",
        ),
      },
      {
        code: "UG",
        name: t("Uganda"),
        languages: [t("Luganda"), t("Olulimi lw'Angereza"), t("Kiswahili")],
        channels: [t("USSD"), t("SMS"), t("WhatsApp"), t("App")],
        rails: t("MTN MoMo, Airtel Money, bbanka"),
        pattern: t(
          "Obuzibu bwa muganda ow'ekakiro mu nnaku za enzima; MTN MoMo “upgrade” ekwaba PIN.",
        ),
      },
      {
        code: "TZ",
        name: t("Tanzania"),
        languages: [t("Kiswahili"), t("Olulimi lw'Angereza")],
        channels: [t("USSD"), t("SMS"), t("WhatsApp"), t("App")],
        rails: t("M-Pesa, Mixx by Yas, HaloPesa"),
        pattern: t(
          "Tapeli ya “Ile pesa tuma kwa namba hii”. Sabika ku TCRA ku 15040.",
        ),
      },
    ],
  },

  agents: {
    eyebrow: t("Abayizi bayogera. Naye tebaggye."),
    title: t("Abakola abiri g'omuwanvu ku ElevenLabs Agents"),
    lede: t(
      "Buliro buli kiseeko kirina kizibu kimwe, olulimi lw'ebikakayo eby'ekikwata, n'ebudde ebikwata. Okukebera, ebiseeko, okuzimba n'okugyokolako bibva mu ggwanga ly'ekateekero.",
    ),
    items: [
      {
        name: t("Guardian"),
        channel: t("Olu-part lw'omutunira oluyimirizidwa ku kiseeko"),
        purpose: t(
          "Yewola, ankola ekizibu ky'okuddayo, ng'awaayo. Ebisooka byatuuka mu muntu ng'ekisoboka — omu y'okuyimiriza n'atakukola.",
        ),
        budget: t("kikomo ky'aminaku 6 · emizunguko 12 · calls 8"),
      },
      {
        name: t("Helper"),
        channel: t("WhatsApp n'okugera mu app"),
        purpose: t(
          "Kebera ennamba n'amannaku ga enzima, nola obusobozi, waba sabika, abbinga bulamu mu nnimi kkumi n'emu.",
        ),
        budget: t("emizunguko 30 · kaseera y'okumiriza 60 s"),
      },
      {
        name: t("Console Copilot"),
        channel: t("Konsoli y'obizinesi (ebigandikwa)"),
        purpose: t(
          "Nola enkaba, muhtasiri amawanga g'ebizibu, andika enkyukakyuko mu biseeko — by'akaziso n'okuba bayogera buli, abantu bagakola ne minnansi ebiri.",
        ),
        budget: t("emizunguko 20 mu buli kiseeko"),
      },
    ],
    invariants: [
      { id: "G-1", label: t("Tewali kuteekateeka wala kuwandika ekiseeko") },
      { id: "G-2", label: t("Tewali kulaba PIN, OTP oba password") },
      { id: "G-3", label: t("Ennamba ziva mu lusa lw'ebikwato nga by'omukene") },
      { id: "G-4", label: t("Tewali kumanya ekisooka ekisobola") },
      { id: "G-5", label: t("Alaba nga AI, olunaku lwa kkumi") },
      { id: "G-6", label: t("Tewali kwekakasa nga bwe bw'ekikwata") },
      { id: "G-8", label: t("Tewali kuggwa ku mubala, tewali kukiiwa") },
      { id: "G-10", label: t("Ebiseeko bwebigyibwa, amaso ga kifo") },
    ],
  },

  architecture: {
    eyebrow: t("Emboozi"),
    title: t("Tekikwata kompyuta mu kizibu kya kuteekezesa"),
    lede: t(
      "Kompyuta zitandika ebisinga; nfuko y'amateeka g'ekikwata n'okukebera ekituuka ebisobola ku biseeko ne matuuka.",
    ),
    planes: [
      {
        name: t("Amateeka g'okutambula"),
        items: [
          u("WhatsApp"),
          u("Live Call Guardian (PSTN)"),
          u("USSD"),
          u("SMS"),
          t("App y'omuliro"),
          u("Business API"),
        ],
      },
      {
        name: t("Olupali lwa kugera — ElevenLabs Agents"),
        items: [
          t("Guardian (enzima)"),
          t("Helper (okugera)"),
          u("Console Copilot"),
          u("KB + RAG"),
          u("Guardrails 2.0"),
        ],
        note: t("ennya, kuyimiriza, amawazo, olulimi"),
      },
      {
        name: t("Olupali lw'okufuna — Shield Core (ekikwata bulungi)"),
        items: [
          t("ebiseeko ne zibu"),
          t("okugessa ebisinga"),
          t("nfuko y'amateeka"),
          t("okuzimba"),
          t("ensimu ez'ekakazidwa"),
          t("olw'ekyanko"),
        ],
        note: t("ggwanga omutegyukiriza · linga okuddayo · kikozedwa n'ebizibu"),
      },
      {
        name: t("Olupali lw'ebisinga"),
        items: [
          u("D1 ElevenLabs classifier"),
          u("D2 vendor detector"),
          u("D3 in-house"),
          u("CAMARA SIM swap"),
          t("obuwali bw'enumbero"),
          t("ebisinga by'ebizibu"),
        ],
      },
    ],
    connectors: [
      t("ebizibu ebinga · ebikozesa by'ekizibu (ebifungidwe, ebikazidwa, bye bitali mu kiseeko)"),
      t("calls z'ebikozesa · ezikakazidwa, ezikola buli kaseera, ezifungidwa mu kiseeko"),
      t("okugaba ebisinga · buli kizibu kikwata ku kikwata kyo"),
    ],
    cards: [
      {
        t: t("Kushindwa kukyusa ku kukakasa"),
        d: t(
          "Ebizibu ebirogera, ebikudde nnungi oba ebizibu bibikkulaniragana biriisa “Tetumanyidwa” (bwa buli muntu) oba step_up (kwa bizinesi). Tewali “Tewali bulabe”.",
        ),
      },
      {
        t: t("Kintu ky'onna kikwata bulungi"),
        d: t(
          "Buliko ekiseeko buli kirandika olw'ekyanko olw'ekisoboka ku hash mu nnansi eka.",
        ),
      },
      {
        t: t("Kikwata ekizibu n'olw'ogolobera"),
        d: t(
          "Amaleeka g'okukola gaboneka mu konsoli, mu kitundu kya API, era mu banner y'obulamu.",
        ),
      },
    ],
  },

  audit: {
    eyebrow: t("Butondeekateeka"),
    title: t("Muntu y'onna asobola okukebera ekiseeko kila kisinga"),
    lede: t(
      "Olunaku lw'olw'ekyanko olw'okugenda okulw'okuyikola ku kiseeko kino. Buli kebera oluzibu ku luvunuko lu'kikola kwo — lu kiriizulwa era lu kukeberedwa buli kise.",
    ),
    consoleNote: t("Olupali lw'ekyanko lulaba mu Luganda."),
  },

  faq: {
    eyebrow: t("Laba — enjawulo ennansi okutegula enzima ey'ekakiro"),
    title: t("Ebibuzibu abantu bawulamu buli"),
    lede: t(
      "Ebisingu by'omuliro, ebikwata ku kweyeyo okusinga okw'ekisomo mu nnimi buli ez'okuzaalira, era baakubirizidwa n'abantu abaŋulirwa.",
    ),
    items: [
      {
        q: t("Ensimu eno egenda ku banki wange ekweli?"),
        a: t(
          "Buuliza Shield. Nga banki y'akwadde ensimu, app yo eri nga ekola “Banki yange ekuggolodola leero”. Nga tetewali kikono, ggyi olukomo era oggolodola ku lunumbero erali ku kadi yo. Ennamba ey'okunyebuka n'omuliro eri ng'ekikwata ko, era teri na kumusa ku lusa lw'ebikwato.",
        ),
      },
      {
        q: t("Enzima ey'ekakiro ekaba emitoola okukebera?"),
        a: t(
          "Ezikoba harder buli kiseeko. Enzima ekkanulwa n'abakola okukebera abiri nga bwe bakesa; omuzannyisa omu kiseeko kisinga alina okuddayo amagambo ga nasibu kwa kiseeko kisinga; ennamba ekebezekwa ku SIM ewakiikyulukidwa; era olunaku olunaku lukkanulwa ku buzibu bwa tapeli. Tewali kizibu kimwe ekisobola, era “Tewali bulabe” si kikakasikiro.",
        ),
      },
      {
        q: t("Shield atekeza enzima zange?"),
        a: t(
          "Noga. Enzima ez'obulamu zikanulwa mu kitundu era ziguluka mu ssiku 60. Shield atekeza ekikomo ky'enzima — si ekisanyusa ky'enzima y'omuntu — era ebikwata by'amazibu babuuka nga bwe bali ku lusuku.",
        ),
      },
      {
        q: t("“Tewali bulabe” kikola ntyo?"),
        a: t(
          "Kikola nga buli mukola okukebera Shield nga ayogerako n'obulungi. Si “kikwata mwe” mu kifo kyang'akakya. Amateeka g'olw'okujja gabweru: omulekeza kuwaayo omulimu PIN obanga nnansi awali, era kankaba emitunira engole nga njia eseyi.",
        ),
      },
      {
        q: t("Nga muganda wange wa kikwata ali mu kizibu?"),
        a: t(
          "Shield talaba muntu. Ekiseeko kya “Komekeza” oba “Obulabe” kiragera nga gye okukebera — oggolodolera ku lunumbero oluyolekeza omu nsi — era bbanka liw'erali n'obulungi bubuuka n'okukebera. Nga kebera kikali, ow'omulimu wa nnamba asobola okusaba na kufuna ekisooka mu ssaawa 72.",
        ),
      },
    ],
  },

  footer: {
    about: t(
      "Ekizibu kya ku-Zeragana nga SecureVoice AI — banki eggolodola omutunira kuzuiza ebizibu; Shield eriina ku buli muntu aw'omuntu eyekakasa okuba yeye oba banki.",
    ),
    demoNote: t(
      "Okulamu kwa kulabika. Data y'obusanduku nga by'omukene, bisinga by'ateleko bitandise buli kiro, tebweru kiseeko. Shield tebulaba nga enzima ekweta bulungi n'obulungi.",
    ),
    exploreLabel: t("Soma"),
    explore: [
      { href: "#demo", label: t("Olusanduku lwa mubala") },
      { href: "#signals", label: t("Nga gye enkola") },
      { href: "#verdicts", label: t("Ebiseeko bitano") },
      { href: "#products", label: t("Ebizibu ne API") },
      { href: "#audit", label: t("Olw'ekyanko") },
      { href: "#faq", label: t("Laba") },
    ],
    marketsLabel: t("Amaduuka ag'okuzaalira"),
    markets: [
      t("UAE · Olu-Arabiki, Olulimi lw'Angereza, Olu-Hindi, Olu-Urdu"),
      t("Kenya · Kiswahili, Olulimi lw'Angereza"),
      t("Uganda · Luganda, Olulimi lw'Angereza, Kiswahili"),
      t("Tanzania · Kiswahili, Olulimi lw'Angereza"),
    ],
    dataInCountry: t("amateeka g'ebiikola mu nsi"),
    docsLabel: t("Ebisandikwa ebikwata n'okuzungukana"),
    docs: t(
      "Olupapula luno lukola ekisooko kya Shield: 01 Emboozi y'Okutwala (KANGA) · 02 Enkola n'Obudde bwa API · 03 Abayizi ne Guardrails · 05 Empewo n'Amalobooze g'Okukola · 13 Butondeekateeka n'Okukebera · 14 Okuzuluka.",
    ),
    goldenRule: t("Amateeka g'omukwata: Shield tetiggwa nyuma."),
    copyright: t("© 2026 SecureVoice · ebizibu by'okulabika"),
    disclaimer: t("ebiseeko by'obujjanjabi, si kikakasikiro"),
  },

  local: {
    marketName: t("Uganda"),
    marketNote: t(
      "Obuzibu bwa muganda ow'ekakiro mu nnaku za enzima; MTN MoMo “upgrade” ekwaba PIN.",
    ),
  },
};
