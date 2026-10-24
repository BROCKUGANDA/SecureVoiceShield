/**
 * Kiswahili. One base dictionary serves the three Kiswahili markets —
 * Kenya, Uganda and Tanzania — because they are the same language, but
 * each market page carries its own market line, so the three pages are
 * separate pages with market-specific content, not duplicates
 * (14, section 2).
 *
 * `t` marks a line that is translated but still waiting for a native
 * speaker; `u` marks a line that is still the English source.
 */
import type { PartialDictionary } from "@/lib/i18n";
import { pending as t, untranslated as u } from "./copy";

const base: PartialDictionary = {
  meta: {
    title: t("Je, simu hii inatoka benki yangu? · SecureVoice Shield"),
    description: t(
      "Je, simu hii inatoka benki yangu kweli? Shikilia kwa Shield — sauti zilizokaguliwa, namba za uongo na SIM zilizobadilishwa. Shield haituani kwanza.",
    ),
  },

  review: {
    badge: t("Inasubiri ukaguzi wa mtafsi mzawa"),
    badgeDetail: t(
      "Ukurasa huu umetafsiriwa na timu yetu, lakini bado haujakaguliwa na mtafsi mzawa. Mistari ya dots ni maandishi ambayo hayajakaguliwa — baadhi yake bado ni Kiingereza.",
    ),
    pendingTitle: t("Mstari huu bado haujakaguliwa na mtafsi mzawa."),
    untranslatedTitle: t("Mstari huu bado ni maandishi ya awali ya Kiingereza."),
  },

  nav: {
    homeLabel: t("Mwanzo wa SecureVoice Shield"),
    brand: t("Je, sauti hii ni ya kweli?"),
    demo: t("Onyesho haiishi"),
    verdicts: t("Hukumu"),
    how: t("Jinsi inavyofanya kazi"),
    markets: t("Soko"),
    agents: t("Wawakala"),
    audit: t("Mfuatano wa ukaguzi"),
    runCheck: t("Fanya ukaguzi"),
    skipToContent: t("Rukia hadi maudhui"),
    openMenu: t("Fungua menyu"),
    closeMenu: t("Funga menyu"),
    main: t("Mkuu"),
    mobile: t("Simu ya mkononi"),
  },

  goldenRule: {
    items: [
      t("Shield haituani kwanza"),
      t("Usishare PIN yako au msimbo wowote"),
      t("Kata simu na uombe tena kwa namba uliyokwisha kujua"),
      t("Ukaguzi usiokamilika si habari njema"),
    ],
    screenReader: t(
      "Kanuni ya msingi: Shield haituani kwanza. Usishare PIN yako au msimbo wowote.",
    ),
  },

  hero: {
    badge: t("Bidhaa ya udugu wa SecureVoice AI"),
    headlineA: t("Sauti inapokuwa uongo,"),
    headlineB: t("Shield inajibu."),
    lede: t(
      "Wagangarafu wanakili sauti, wanachukua namba za watu wengine na wanabadilisha SIM ili waonekane kama ndugu yako, mboss yako au benki yako. Shield inalinda mteja na benki pia — ikihesabiya kila simu ya shaka, ujumbe wa sauti na ombi la msimbo wa siri, na kujibu kwa lugha rahisi.",
    ),
    ctaPrimary: t("Jaribu sandbxia moja kwa moja"),
    ctaSecondary: t("Jinsi inavyofanya kazi"),
    stats: [
      { v: t("4"), l: t("soko · AE KE UG TZ") },
      { v: t("11"), l: t("luganda 11, ikiwamo Luganda") },
      { v: t("1.5 s"), l: t("kipimo cha hukumu wakati wa simu") },
      { v: t("60 s"), l: t("sauti, kisha futwa") },
    ],
    channels: [
      t("Kiboti cha kuangalia kwa WhatsApp"),
      t("Live Call Guardian kwa kuingia kwenye simu"),
      t("USSD na SMS — hakuna data inayohitajika"),
      t("Mielezo ya hukumu kwa vibrationi"),
      t("Haiombi PIN wala msimbo wowote"),
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
    ariaLabel: t("Kwa nini Shield ipo"),
    items: [
      {
        v: t("17,152"),
        l: t("utapeli na majaribio yaliyorekepwa kwa TCRA katika robo moja (TZ, Q1 2025)"),
      },
      { v: t("80%+"), l: t("waendeshaji wa TTS walio caught na changamoto ya moja kwa moja (lengo la v1)") },
      { v: t("< 2%"), l: t("kiwango cha rangi nyekundu isizo kweli kwa sauti za binu za kweli (lengo la v1)") },
      {
        v: t("< 10 s"),
        l: t("kutoka ujumbe wa sauti ulio forwarded hadi jibu la lugha rahisi"),
      },
    ],
  },

  sandbox: {
    eyebrow: t("Sandbxia haiishi"),
    title: t("Fanya ukaguzi wenyewe"),
    lede: t(
      "Kipande cha kazi cha Shield: injini ya kudhibiti, kadi za hukumu, mtiririko wa faragha wa Guardian na kumbukumbu ya ushahidi iliyofunganishwa — yote ikiwa na majibu ya sandbxia iliyowekwa.",
    ),
    caption: t(
      "sandbxia · data ya kuchagua · majibu ya telco yaliyowekwa · hakuna chochote hapa kinachopiga simu halisi",
    ),
    consoleNote: t("Konsoli haiishi inafanya kazi kwa Kiingereza."),
    tabs: {
      number: t("Angalia namba"),
      voice: t("Angalia ujumbe wa sauti"),
      guardian: t("Live Call Guardian"),
      verified: t("Je, simu hiyo ilikuwa ya kweli?"),
    },
  },

  verdicts: {
    eyebrow: t("Hukumu tano"),
    title: t("Umbo, rangi, neno na vibrationi — si rangi peke yake"),
    lede: t(
      "Kila jibu lina njia nne ili lizibie kwenye simu iliyovunjika, kwa mtu mwenye macho dhaifu, katika lugha yoyote kati ya kumi na moja.",
    ),
    goldenRuleLabel: t("kanuni ya msingi"),
    goldenRuleLine: t("Shield haituani kwanza."),
    goldenRuleBody: t(
      "Kila simu inayodai kuwa Shield ni utapeli. Jibu bora Shield linaweza kutoa ni “Hakuna alama za hatari” — si “hakika ni ya kweli”.",
    ),
    items: [
      {
        key: "clear",
        name: t("Hakuna tahadhari"),
        wording: t("Hakuna alama za hatari zilizopatikana."),
        advice: t(
          "Bado usishare PIN yako au msimbo wowote. Thibitisha maombi makubwa kwa njia nyingine.",
        ),
        shape: t("duara tupu"),
        color: t("Kijani cha kidadi"),
        pulses: 1,
      },
      {
        key: "caution",
        name: t("Angalia"),
        wording: t("Angalia kwa makini."),
        advice: t("Kata simu na uombe tena kwa namba uliyokwisha kujua."),
        shape: t("mstatili"),
        color: t("Manjano"),
        pulses: 2,
      },
      {
        key: "danger",
        name: t("Hatari"),
        wording: t("Sima. Hii inaonekana kuwa utapeli."),
        advice: t("Usitumie pesa wala usishare msimbo wowote. Ripoti."),
        shape: t("nane"),
        color: t("Nyekundu"),
        pulses: 3,
      },
      {
        key: "inconclusive",
        name: t("Haijulikani"),
        wording: t("Tunaweza kusema."),
        advice: t(
          "Chukua simu hii kwa uangalifu. Ukaguzi usiokamilika si habari njema.",
        ),
        shape: t("duara ya mistari"),
        color: t("Kijivu"),
        pulses: 0,
      },
      {
        key: "verified",
        name: t("Imethibitishwa"),
        wording: t("Hii ni simu halisi kutoka benki iliyosajiliwa."),
        advice: t(
          "Benki ilisajili simu hii kabla. Unaweza kuzungumza kwa usalama — Shield haiombi misimbo.",
        ),
        shape: t("ngozo yenye alama ya kukubali"),
        color: t("Kijani cha kina"),
        pulses: 2,
      },
    ],
    pulseOne: t("vibrationi moja"),
    pulseMany: t("vibrationi"),
  },

  signals: {
    eyebrow: t("Jinsi inavyofanya kazi"),
    title: t("Aina nne za ushahidi. Hukumu moja ya uangalifu."),
    lede: t(
      "Shield haitegemei kitufe kimoja. Ishara huingia kwenye kifurushi cha sheria kilichotengenezwa na kuthibitishwa — hakuna kwaelezo kinachokuwa katika njia ya uamuzi.",
    ),
    items: [
      {
        id: t("01 · uchambuzi wa sauti"),
        title: t("Je, sauti inaonekana kama ya mashine?"),
        body: t(
          "Angalia angalau vikaguzi viwili vinavyotuma kila rekodi. Mmoja ni ElevenLabs AI Speech Classifier — 99% sahihi kwenye sauti zake mwenyewe — lakini anajua sauti za ElevenLabs peke yake, kwa hivyo ni ishara moja, si hukumu.",
        ),
      },
      {
        id: t("02 · uhai wa awali"),
        title: t("Je, anaweza kujibu moja kwa moja?"),
        body: t(
          "“Tafadhali rudia maneno haya: kikapu, mto, saba.” Maneno hubadilika kila simu, si tarehe wala nyakati. Nakala za moja kwa moja huzongana, hufanyiwa kasoro au hubadilika; waendeshaji wa sauti za mashine lazima waandike — na kuandika ndani kwake unaonekana.",
        ),
      },
      {
        id: t("03 · mstari wa simu"),
        title: t("Je, mstari wa simu unategemea?"),
        body: t(
          "Ishara za telco: kubadilishwa kwa SIM karibuni, kuelekeza simu kuwa wazi, uthibitisho wa namba, VoIP inajifanya namba ya simu. Kubadilishwa kwa SIM ni ishara ya hatari — si ushahidi kwa yenyewe.",
        ),
      },
      {
        id: t("04 · hadithi"),
        title: t("Je, hadithi inalingana na utapeli?"),
        body: t(
          "Msimamo wa haraka, siri, namba mpya (“simu yangu imeharibika”), maombi ya misimbo ya siri au PIN, malipo kwa pesa ya simu, zawadi za kadi ya duka au crypto. Shinikizo la hadithi linaongeza hatari — haliwezi kamwe kuondoa mtu.",
        ),
      },
    ],
    floor: {
      label: t("Kanuni ya kizingiti:"),
      body: t(
        "hakuna kipande kimoja kinachoweza kutoa “Hakuna tahadhari”. Kinahitaji kila kikaguzi kijibu, angalau vikaguzi viwili vya kawaida vikubaliana, na hakuna ishara isiyojulikana. Ushahidi usiokuwepo au uliopelekwa polepole hufanya jibu liwe uangalifu zaidi — si la kutisha zaidi.",
      ),
    },
  },

  products: {
    eyebrow: t("Bidhaa mbili, injini moja"),
    title: t("Bure kwa kila mtu. API kwa benki na kampuni za simu."),
    lede: t(
      "Hukumu zilezile, mfuatano wa ushahidi ule ule — kimoja cha umma kinachofungwa kwa usalama, kimoja cha biashara chenye vizuizi, kinga za OTP na webhooks.",
    ),
    publicName: t("Shield kwa kila mtu"),
    publicBadge: t("bure · hadia umma"),
    businessName: t("Shield kwa benki na kampuni za simu"),
    businessBadge: t("kulipwa · api"),
    publicFeatures: [
      {
        t: t("Kiboti cha kuangalia kwa WhatsApp"),
        d: t(
          "Tuma ujumbe wa sauti wa shaka, upate jibu la njia ya taa za trafiki katika lugha yako — maandishi na kwa hiyo jibu la sauti la hiari.",
        ),
      },
      {
        t: t("Live Call Guardian"),
        d: t(
          "Ruhusu Shield kuingia kwenye simu. Huuliza swali la uhai wa awali, kisha huondoka. Hukumu hukufikia kwa siri.",
        ),
      },
      {
        t: t("Ulizawe mwenyewe"),
        d: t(
          "Huingi? Shield hutuma maneno manne ya nasibu kwa SMS, WhatsApp au USSD ili uombe mpigia simu arudie.",
        ),
      },
      {
        t: t("USSD na SMS"),
        d: t(
          "Angalia namba, hakikisha benki yako inaingia kweli, ripoti utapeli — bila simu ya kisasa wala data.",
        ),
      },
      {
        t: t("Zana ya neno salama la familia"),
        d: t(
          "Msimu wa faragha wa familia ulioratibiwa. Shield hihifadhi neno salama wala kukuliza nacho.",
        ),
      },
      {
        t: t("Ripoti ya utapeli"),
        d: t(
          "Mofuko mmoja unaongeza namba na alama ya sauti — si alama ya sauti ya mtu — kwenye orodha ya kuzuia inayotumika.",
        ),
      },
    ],
    businessFeatures: [
      {
        t: t("POST /v1/assess"),
        d: t(
          "Namba ya simu, sauti ya hiari, muktadha wa muamana → alama ya hatari, sababu, hatua inayopendekezwa.",
        ),
      },
      {
        t: t("Kinga ya OTP"),
        d: t(
          "Angalia kubadilishwa kwa SIM kabla ya kutuma msimbo wa SMS — vinginevyo uthibitisho ndani ya programu au kuzuri kwenye tawi.",
        ),
      },
      {
        t: t("Msimamo wa muda"),
        d: t(
          "Baada ya kubadilishwa kwa SIM au mpokeaji mpya, fedha nyingi zinashikiliwa kwa dakika 30–60. Kuzinduliwa kunahitaji idhini ya watu wawili.",
        ),
      },
      {
        t: t("Simu ya benki iliyoidhinishwa"),
        d: t(
          "Sajili simu zinazotoka; wateja huona “Benki yako inakupigia simu sasa”. Hakuna bango maana kukatika simu.",
        ),
      },
      {
        t: t("Kumbukumbu ya ushahidi"),
        d: t(
          "Kumbukumbu ya kila uamuzi iliyofunganishwa kwa hashi — inaweza kuthibitishwa kwa zana huria ya shield-verify.",
        ),
      },
    ],
    apiNote: t(
      "Hii ni API ya biashara. Sandbxia hapo juu inaonyesha injini ile ile kwenye njia za umma — POST /api/assess kwa { number } — ili ujiwe njia ya uamuzi bila kitambulisho.",
    ),
    failSafe: t("kila njia ya kushindwa inarudi step_up — si kamwe allow"),
  },

  markets: {
    eyebrow: t("Soko"),
    title: t("Uganda ni soko kamili, Tanzania ni ya Kiswahili kwanza"),
    lede: t(
      "Soko nne za kuanza, luganda kumi na moja, simu na njia za malipo tofauti — hukumu moja ya uangalifu kila mahali. Data huhifadhiwa na kuchakatwa ndani ya nchi.",
    ),
    yourMarket: t("Soko lako"),
    zeroRated: t("USSD ni ya bure iwezekanavyo — ukaguzi haumalimu mtumiaji"),
    patternLabel: t("Kielelezo cha kuangalia"),
    awareness: t(
      "Kampeni za uelewa za afiki hutanguliza maneno mawili kwa kila lugha katika redio za eneo: “Shield haituani kwanza” na msimbo wa USSD. Pilot za Tanzania pia zinafundisha 15040 ya TCRA na kukagua mwenyewe kwa *106# SIM zilizosajiliwa kwa kitambulisho chako.",
    ),
    items: [
      {
        code: "AE",
        name: t("Falme ya Kiarabu"),
        languages: [t("Kiarabu"), t("Kiingereza"), t("Kihindi"), t("Kiurdu")],
        channels: [t("Programu"), t("WhatsApp"), t("SMS")],
        rails: t("Kadi, uhamisho wa benki, pochi za pesa"),
        pattern: t(
          "Askari wa fake au wafanyakazi wa visa wanaotishia wageni; simu za kundi la utapeli wa “akaunti salama”.",
        ),
      },
      {
        code: "KE",
        name: t("Kenya"),
        languages: [t("Kiswahili"), t("Kiingereza"), t("Sheng-aware")],
        channels: [t("WhatsApp"), t("USSD"), t("SMS"), t("Programu")],
        rails: t("M-PESA, Airtel Money, PesaLink"),
        pattern: t(
          "Simu za kurudisha “pesa ilipelekwa bila kosa”; huduma za wateja za fake zinaomba PIN yako.",
        ),
      },
      {
        code: "UG",
        name: t("Uganda"),
        languages: [t("Luganda"), t("Kiingereza"), t("Kiswahili")],
        channels: [t("USSD"), t("SMS"), t("WhatsApp"), t("Programu")],
        rails: t("MTN MoMo, Airtel Money, benki"),
        pattern: t(
          "Msimamo wa dharura kwa nduugu zilizokaguliwa kwenye ujumbe wa sauti; MTN MoMo “upgrade” inakwiba PIN.",
        ),
      },
      {
        code: "TZ",
        name: t("Tanzania"),
        languages: [t("Kiswahili"), t("Kiingereza")],
        channels: [t("USSD"), t("SMS"), t("WhatsApp"), t("Programu")],
        rails: t("M-Pesa, Mixx by Yas, HaloPesa"),
        pattern: t(
          "Uongo wa “Ile pesa tuma kwa namba hii”. Ripoti kwa TCRA kwenye 15040.",
        ),
      },
    ],
  },

  agents: {
    eyebrow: t("Wawakala wanaongea. Hawajiamua."),
    title: t("Wafanyakazi watatu wenye mipaka kwenye ElevenLabs Agents"),
    lede: t(
      "Kila kikao kina kazi moja, orodha ya zana zinazoruhusiwa na bajeti ya kudhibitiwa. Uchambuzi, hukumu, vizuizi na ufunguzi hutoka kwenye injini ya kudhibitiwa.",
    ),
    items: [
      {
        name: t("Guardian"),
        channel: t("Sehemu ya simu inayounganishwa na simu hai"),
        purpose: t(
          "Jitambulisha, endesha changamoto ya kurudia baada yangu, kisha ondoka. Matokeo yanawafikia mtumiaji kwa siri — mwakala hatajui matokeo hayo.",
        ),
        budget: t("kikomo cha dakika 6 · mzunguko 12 · miito 8 ya zana"),
      },
      {
        name: t("Helper"),
        channel: t("WhatsApp na mazungumzo ndani ya programu"),
        purpose: t(
          "Angalia namba na ujumbe wa sauti, eleza matokeo, wasilisha ripoti, fundisha usalama katika luganda kumi na moja.",
        ),
        budget: t("mzunguko 30 · muda wa kusubiri 60 s"),
      },
      {
        name: t("Console Copilot"),
        channel: t("Konsoli ya biashara (maandishi)"),
        purpose: t(
          "Eleza kesi, muhtasari wa mawimbi ya utapeli, andika mabadiliko ya sera — mapendekezo tu; watu wanakidhibiti kwa macho mbili.",
        ),
        budget: t("mzunguko 20 kwa kila mazungumzo"),
      },
    ],
    invariants: [
      { id: "G-1", label: t("Kamwe haweki wala kuweka maneno ya hukumu") },
      { id: "G-2", label: t("Kamwe haulizi PIN, OTP au nenosiri") },
      { id: "G-3", label: t("Namba hutoka kwenye kumbukumbu rasmi peke yake") },
      { id: "G-4", label: t("Kamwe hajui matokeo aliyoyatoa") },
      { id: "G-5", label: t("Anasema ni AI, sentensi ya kwanza") },
      { id: "G-6", label: t("Kamwe haadai uhakikisho") },
      { id: "G-8", label: t("Kamwe hapigii simu kwanza, kamwe hakili") },
      { id: "G-10", label: t("Vipindi vya mipaka, njia za kutoka zilizowekwa") },
    ],
  },

  architecture: {
    eyebrow: t("Muundo"),
    title: t("Hakuna kwaelezo kinachokuwa katika njia ya uamuzi"),
    lede: t(
      "Kwaelezo kinatengeneza ishara; kifurushi cha sheria kilichotengenezwa na kuthibitishwa kikibadilisha ishara kuwa hukumu na hatua.",
    ),
    planes: [
      {
        name: t("Njia za mawasiliano"),
        items: [
          u("WhatsApp"),
          u("Live Call Guardian (PSTN)"),
          u("USSD"),
          u("SMS"),
          t("Programu ya simu ya mkononi"),
          u("Business API"),
        ],
      },
      {
        name: t("Tabaka la mazungumzo — ElevenLabs Agents"),
        items: [
          t("Guardian (sauti)"),
          t("Helper (mazungumzo)"),
          u("Console Copilot"),
          u("KB + RAG"),
          u("Guardrails 2.0"),
        ],
        note: t("matamshi, mabadiliko ya zamu, maneno, lugha"),
      },
      {
        name: t("Tabaka la udhibiti — Shield Core (inaotafuta majibu)"),
        items: [
          t("vipindi na changamoto"),
          t("kuunganisha ishara"),
          t("kifurushi cha sera"),
          t("vizuziizi"),
          t("simu zilizoidhinishwa"),
          t("mfuatano wa ukaguzi"),
        ],
        note: t("injini safi · inaweza kucheza upya · imethibitishwa kwa majaribio"),
      },
      {
        name: t("Tabaka la ishara"),
        items: [
          u("D1 ElevenLabs classifier"),
          u("D2 vendor detector"),
          u("D3 in-house"),
          u("CAMARA SIM swap"),
          t("sifa ya namba"),
          t("ishara za maelezo ya utapeli"),
        ],
      },
    ],
    connectors: [
      t("matukio ya kuingia · zana za seva (zilizofungwa, zilizosainishwa, hazina nguvu ya hukumu)"),
      t("miito ya zana · zilizothibitishwa, zisizo na athari mara mbili, zilizofungwa kwa kikao"),
      t("kupata ishara · kila kosa la kihusu linaloweka kuwa unknown"),
    ],
    cards: [
      {
        t: t("Kushindwa kuelekeza kwenye uthibitisho"),
        d: t(
          "Ushahidi usiokuwepo, uliopelekwa polepole au unaotofautisha hutoa “Haijulikani” (kwa umma) au step_up (kwa biashara). Kamwe “Hakuna tahadhari”.",
        ),
      },
      {
        t: t("Kila kitu kina ukaguzi"),
        d: t(
          "Kila uamuzi huandika kumbukumbu ya ushahidi iliyofunganishwa kwa hashi katika muzamo moja.",
        ),
      },
      {
        t: t("Hupo kwa makini"),
        d: t(
          "Hali za uendeshaji huonekana kwenye konsoli, kichwa cha API na bango la umma.",
        ),
      },
    ],
  },

  audit: {
    eyebrow: t("Uzingatiaji"),
    title: t("Mtu yeyote anaweza kuthibitisha kila uamuzi"),
    lede: t(
      "Mwonekano wa moja kwa moja wa mfuatano wa ushahidi ambao ukurasa huu unaandikia. Kila ukaguzi uliokuwa umefanywa hapo juu upo hapa — ukihesabiwa upya na kuthibitishwa pale inapotakiwa.",
    ),
    consoleNote: t("Paneli ya ushahidi inafanya kazi kwa Kiingereza."),
  },

  faq: {
    eyebrow: t("Jifunze — njia tano za kutambua sauti iliyokaguliwa"),
    title: t("Maswali watu wanaiuliza kwa kweli"),
    lede: t(
      "Majibu rahisi, yaliyoandikwa kwa kuanza na jibu la moja kwa moja katika kila lugha ya kuanza, na yaliyokaguliwa na wazawa wazawa.",
    ),
    items: [
      {
        q: t("Je, simu hii kweli inatoka benki yangu?"),
        a: t(
          "Muulize Shield. Ikiwa benki ilisajili simu hiyo, programu yako inaonyesha “Benki yako inakupigia simu sasa”. Ikiwa hakuna kitu kinaonekana, kata simu na upigie simu namba iliyo kwenye kadi yako. Namba ya msimu iliyokaguliwa haiwezi kuonekana kama ingiyi rasmi.",
        ),
      },
      {
        q: t("Je, sauti iliyokaguliwa inaweza kupita ukaguzi?"),
        a: t(
          "Inazidi kuwa ngumu kila hatua. Sauti ina hesabiwa na vikaguzi viwili vinavyotuma kila wakati; mpigia simu hai lazima arudie maneno ya nasibu kwa wakati halisi; namba hukaguliwa kwa kubadilishwa kwa SIM; na hadithi ina hesabiwa kwa shinikizo la utapeli. Hakuna kitufe kimoja kinachotuma uamuzi, na “Hakuna alama za hatari” si uhakikisho.",
        ),
      },
      {
        q: t("Je, Shield inahifadhi sauti yangu?"),
        a: t(
          "Hapana. Sauti za umma zinapeshiwa kumbukumbu tu na futwa ndani ya sekunde 60. Shield inahifadhi alama ya sauti — si alama ya sauti ya mtu — na maandishi ya mazungumzo yanabatilishwa kabla ya kuhifadhiwa.",
        ),
      },
      {
        q: t("Maana yake nini “Hakuna alama za hatari”?"),
        a: t(
          "Inamaanisha kila ukaguzi Shield uliweza kuufanya ulirudi safi. Si “hakika ni ya kweli” kwa makusudi. Ushauri hubadiliki: usishare PIN yako au msimbo wowote, na ithibitisha maombi makubwa kwa njia nyingine.",
        ),
      },
      {
        q: t("Je, ikiwa ndugu yangu kwa kweli yuko matatani?"),
        a: t(
          "Shield haishuhumu mtu. Hukumu ya “Angalia” au “Hatari” inakuuliza jinsi ya kuthibitisha — mpigie tena kwa namba uliyohifadhi awali — na benki halisi hazitaki ukaguzi. Ikiwa ukaguzi umekosewa, mmiliki wa namba anaweza kuomba upya na kupata majibu ndani ya saa 72.",
        ),
      },
    ],
  },

  footer: {
    about: t(
      "Bidhaa ya udugu wa SecureVoice AI — benki inampigia simu mteja kuzuia utapeli; Shield inalinda kila mtu pale mtu mwingine anajifanya kuwa yeye au benki.",
    ),
    demoNote: t(
      "Toleo la onyesho. Data ya sandbxia pekee, majibu ya telco yaliyowekwa, hakuna simu halisi. Shield haisemi kamwe kuwa sauti ni ya kweli bila shaka.",
    ),
    exploreLabel: t("Chunguza"),
    explore: [
      { href: "#demo", label: t("Sandbxia haiishi") },
      { href: "#signals", label: t("Jinsi inavyofanya kazi") },
      { href: "#verdicts", label: t("Hukumu tano") },
      { href: "#products", label: t("Bidhaa na API") },
      { href: "#audit", label: t("Mfuatano wa ukaguzi") },
      { href: "#faq", label: t("Jifunze") },
    ],
    marketsLabel: t("Soko za kuanza"),
    markets: [
      t("UAE · Kiarabu, Kiingereza, Kihindi, Kiurdu"),
      t("Kenya · Kiswahili, Kiingereza"),
      t("Uganda · Luganda, Kiingereza, Kiswahili"),
      t("Tanzania · Kiswahili, Kiingereza"),
    ],
    dataInCountry: t("data inakaa ndani ya nchi"),
    docsLabel: t("Hati za ushirika"),
    docs: t(
      "Ukurasa huu unatekeleza mwongozo wa Shield: 01 Muundo wa Uonekanu (KANGA) · 02 Jukwaa na Tabia ya API · 03 Mawakala na Kingozi · 05 Mipaka na Hali za Uendeshaji · 13 Uzingatiaji na Ukaguzi · 14 Ugunzaji.",
    ),
    goldenRule: t("Kanuni ya msingi: Shield haituani kwanza."),
    copyright: t("© 2026 SecureVoice · mazingira ya onyesho"),
    disclaimer: t("hukumu ni ushauri, si uhakikisho"),
  },
};

/** The Kiswahili dictionary for each Kiswahili market. */
export const sw = {
  ke: {
    ...base,
    local: {
      marketName: t("Kenya"),
      marketNote: t(
        "Simu za kurudisha “pesa ilipelekwa bila kosa”; huduma za wateja za fake zinaomba PIN yako.",
      ),
    },
  },
  ug: {
    ...base,
    local: {
      marketName: t("Uganda"),
      marketNote: t(
        "Msimamo wa dharura kwa nduugu zilizokaguliwa kwenye ujumbe wa sauti; MTN MoMo “upgrade” inakwiba PIN.",
      ),
    },
  },
  tz: {
    ...base,
    local: {
      marketName: t("Tanzania"),
      marketNote: t(
        "Uongo wa “Ile pesa tuma kwa namba hii”. Ripoti kwa TCRA kwenye 15040.",
      ),
    },
  },
};
