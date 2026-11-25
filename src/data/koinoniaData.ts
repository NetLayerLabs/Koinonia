import {
  ChurchTraditionProfile,
  LanguageOption,
  SupportedLanguageCode,
  VerifiedScripture,
} from '../types/koinonia';
import CONTENT_I18N from './content-i18n.json';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    regionNote: 'UNICAM International Master/PhD & Global Churches',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    regionNote: 'Basilica di San Venanzio Parish & Camerino Community',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    regionNote: 'Erasmus, Latin American Students & Hispanic Ministry',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    regionNote: 'Francophone Africa & European Exchange Students',
  },
  {
    code: 'zh',
    name: 'Mandarin',
    nativeName: '中文 (简体)',
    regionNote: 'UNICAM Architecture/Science Scholars & Diaspora',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    regionNote: 'Mediterranean & Middle Eastern Student Fellows',
  },
  {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    regionNote: 'East African Student Community & Global Fellowship',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    regionNote: 'Brazilian & Lusophone Researchers & Families',
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    regionNote: 'Central/Eastern European Erasmus & Parish Community',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    regionNote: 'International Campus Ministry & Visiting Scholars',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    regionNote: 'Southeast Asian Catholic & University Students',
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    regionNote: 'Displaced Families & Visiting University Students',
  },
];

const CONTENT_LANGS: SupportedLanguageCode[] = ['es', 'fr', 'zh', 'ar', 'sw', 'pt', 'pl', 'ko', 'vi', 'uk'];

/** Languages each record was not written in (filled with English until a translation is found). */
const FELL_BACK = new WeakMap<object, SupportedLanguageCode[]>();

// Every record has all 12 languages; a language that was not written falls back to English here,
// then to the church's saved translation (fillContentTranslations, below), never Bible text.
function makeMultilingual(
  base: Partial<Record<SupportedLanguageCode, string>> & { en: string; it: string }
): Record<SupportedLanguageCode, string> {
  const out = { en: base.en, it: base.it } as Record<SupportedLanguageCode, string>;
  const missing: SupportedLanguageCode[] = [];
  for (const l of CONTENT_LANGS) {
    out[l] = base[l] || base.en;
    if (!base[l]) missing.push(l);
  }
  if (missing.length) FELL_BACK.set(out, missing);
  return out;
}

export const VERIFIED_SCRIPTURE_CORPUS: Record<string, VerifiedScripture> = {
  'luke-21-19': {
    id: 'luke-21-19',
    reference: 'Luke 21:18–19 (cf. Romans 5:3–5)',
    translation: 'CEI / RSV-CE & ESV Licensed Corpus',
    licenseNote: 'Direct Immutable Scripture Feed - AI Generation Disabled on Biblical Text',
    verifiedHash: 'SCR-SHA256-9F4A2C81',
    texts: makeMultilingual({
      en: '“By your endurance you will gain your lives... And hope does not put us to shame, because God’s love has been poured into our hearts through the Holy Spirit who has been given to us.”',
      it: '«Con la vostra perseveranza salverete la vostra vita... E la speranza non delude, perché l’amore di Dio è stato riversato nei nostri cuori per mezzo dello Spirito Santo che ci è stato dato.»',
      es: '«Con vuestra perseverancia salvaréis vuestras almas... Y la esperanza no defrauda, porque el amor de Dios ha sido derramado en nuestros corazones por el Espíritu Santo que nos fue dado.»',
      fr: '« Par votre persévérance vous sauverez vos âmes... Or, l’espérance ne trompe point, parce que l’amour de Dieu est répandu dans nos cœurs par le Saint-Esprit qui nous a été donné. »',
      zh: '“你们常存忍耐，就必保全灵魂……盼望不至于羞耻，因为所赐给我们的圣灵将神的爱浇灌在我们心里。”',
      ar: '«بِصَبْرِكُم تَقتَنُونَ أَنفُسَكُم... وَالرَّجَاءُ لاَ يُخْزِي، لأَنَّ مَحَبَّةَ اللهِ قَدِ انْسَكَبَتْ فِي قُلُوبِنَا بِالرُّوحِ الْقُدُسِ الْمُعْطَى لَنَا.»',
      sw: '“Kwa saburi yenu mtaziponya nafsi zenu... Na tumaini halitahayarishi; kwa maana pendo la Mungu limekwisha kumiminwa katika mioyo yetu na Roho Mtakatifu tuliyepewa.”',
      pt: '“Na vossa perseverança ganhareis as vossas almas... E a esperança não traz confusão, porquanto o amor de Deus está derramado em nossos corações pelo Espírito Santo que nos foi dado.”',
      pl: '„Przez swoją wytrwałość ocalicie wasze życie... A nadzieja zawieść nie może, ponieważ miłość Boża rozlana jest w sercach naszych przez Ducha Świętego, który został nam dany.”',
      ko: '“너희의 인내로 너희 영혼을 얻으리라... 소망이 우리를 부끄럽게 하지 아니함은 우리에게 주신 성령으로 말미암아 하나님의 사랑이 우리 마음에 부은 바 됨이니.”',
      vi: '“Có kiên trì, anh em mới giữ được mạng sống mình... Trông cậy như thế, chúng ta sẽ không phải thất vọng, vì Thiên Chúa đã đổ tình yêu của Người vào lòng chúng ta, nhờ Thánh Thần mà Người đã ban cho chúng ta.”',
      uk: '«Терпінням своїм ви спасете душі ваші... А надія не засоромить, бо любов Божа вилилася в наші серця Святим Духом, даним нам.»',
    }),
  },
  'psalm-34-18': {
    id: 'psalm-34-18',
    reference: 'Psalm 34:18 (Salmo 34,19)',
    translation: 'Verified Bilingual Liturgical Psalter',
    licenseNote: 'Immutable Verse Lock • Verified by Parish & Pastoral Review',
    verifiedHash: 'SCR-SHA256-3B8E71D4',
    texts: makeMultilingual({
      en: '“The Lord is close to the brokenhearted and saves those who are crushed in spirit.”',
      it: '«Il Signore è vicino a chi ha il cuore spezzato, egli salva gli spiriti affranti.»',
      es: '«Cercano está el Señor a los quebrantados de corazón, y salva a los contritos de espíritu.»',
      fr: '« L’Éternel est près de ceux qui ont le cœur brisé, et il sauve ceux qui ont l’esprit dans l’abattement. »',
      zh: '“耶和华靠近伤心的人，拯救灵性痛悔的人。”',
      ar: '«قَرِيبٌ هُوَ الرَّبُّ مِنَ الْمُنْكَسِرِي الْقُلُوبِ، وَيُخَلِّصُ الْمُنْسَحِقِي الرُّوحِ.»',
      sw: '“Bwana yu karibu nao waliovunjika moyo, na waliopondeka roho huwaokoa.”',
    }),
  },
  'philippians-4-19': {
    id: 'philippians-4-19',
    reference: 'Philippians 4:19 (Filippesi 4,19)',
    translation: 'Verified Scripture Corpus',
    licenseNote: 'Immutable Verse Lock • Benevolence & Care Anchor',
    verifiedHash: 'SCR-SHA256-7C12E90A',
    texts: makeMultilingual({
      en: '“And my God will supply every need of yours according to his riches in glory in Christ Jesus.”',
      it: '«Il mio Dio, a sua volta, colmerà ogni vostro bisogno secondo la sua ricchezza con magnificenza, in Cristo Gesù.»',
      es: '«Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús.»',
      fr: '« Et mon Dieu pourvoira à tous vos besoins selon sa richesse, avec gloire, en Jésus-Christ. »',
      zh: '“我的神必照他荣耀的丰富，在基督耶稣里，使你们一切所需用的都充足。”',
    }),
  },
  'matthew-11-28': {
    id: 'matthew-11-28',
    reference: 'Matthew 11:28 (Matteo 11,28)',
    translation: 'Verified Gospel Text',
    licenseNote: 'Immutable Verse Lock • Seeker & Welcome Anchor',
    verifiedHash: 'SCR-SHA256-5D49A11B',
    texts: makeMultilingual({
      en: '“Come to me, all who labor and are heavy laden, and I will give you rest.”',
      it: '«Venite a me, voi tutti che siete stanchi e oppressi, e io vi darò ristoro.»',
      es: '«Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.»',
      fr: '« Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos. »',
      zh: '“凡劳苦担重担的人可以到我这里来，我就使你们得安息。”',
    }),
  },
  'isaiah-41-10': {
    id: 'isaiah-41-10',
    reference: 'Isaiah 41:10 (Isaia 41,10)',
    translation: 'Verified Prophetic Corpus',
    licenseNote: 'Immutable Verse Lock • Student Anxiety & Peace Anchor',
    verifiedHash: 'SCR-SHA256-8E20F44C',
    texts: makeMultilingual({
      en: '“Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you.”',
      it: '«Non temere, perché io sono con te; non smarrirti, perché io sono il tuo Dio. Ti rendo forte e anche ti vengo in aiuto.»',
      es: '«No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré.»',
      fr: '« Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets, car je suis ton Dieu; je te fortifie, je viens à ton secours. »',
      zh: '“你不要害怕，因为我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你。”',
    }),
  },
};

/**
 * Catholic and Protestant Bibles word the same verse differently in Korean, Chinese and Vietnamese
 * (하느님 / 하나님, 天主 / 上帝, Thiên Chúa / Đức Chúa Trời...). Each church reads its own wording,
 * matching its tradition glossary. Demo texts: a church connects its licensed translation before real use.
 */
const TRADITION_TEXTS: Record<string, Record<string, Partial<Record<SupportedLanguageCode, string>>>> = {
  'san-venanzio-unicam': {
    'luke-21-19': {
      ko: '“너희는 인내로써 생명을 얻어라... 희망은 우리를 부끄럽게 하지 않습니다. 우리가 받은 성령을 통하여 하느님의 사랑이 우리 마음에 부어졌기 때문입니다.”',
      zh: '“你们赖你们的坚忍，必将保全你们的灵魂……望德不叫人蒙羞，因为天主的爱，藉着所赐与我们的圣神，已倾注在我们心中了。”',
    },
    'psalm-34-18': {
      ko: '“주님께서는 마음이 부서진 이들에게 가까이 계시고 넋이 짓밟힌 이들을 구원해 주신다.”',
      zh: '“上主接近心灵破碎的人，他必拯救精神颓丧的人。”',
      vi: '“Chúa gần gũi những tấm lòng tan vỡ, cứu những tâm thần bị nghiền nát.”',
    },
    'philippians-4-19': {
      ko: '“나의 하느님께서도 당신의 영광에 따라 그리스도 예수님 안에서 여러분에게 필요한 모든 것을 풍성히 채워 주실 것입니다.”',
      zh: '“我的天主必要按照他的丰富，在光荣中，在基督耶稣内，满足你们的一切需要。”',
      vi: '“Thiên Chúa của tôi sẽ thoả mãn mọi nhu cầu của anh em, theo sự phong phú huy hoàng của Người, trong Đức Ki-tô Giê-su.”',
    },
    'matthew-11-28': {
      ko: '“고생하며 무거운 짐을 진 너희는 모두 나에게 오너라. 내가 너희에게 안식을 주겠다.”',
      zh: '“凡劳苦和负重担的，你们都到我跟前来，我要使你们安息。”',
      vi: '“Tất cả những ai đang vất vả mang gánh nặng nề, hãy đến cùng tôi, tôi sẽ cho nghỉ ngơi bồi dưỡng.”',
    },
    'isaiah-41-10': {
      ko: '“두려워하지 마라, 내가 너와 함께 있다. 겁내지 마라, 내가 너의 하느님이다. 내가 너의 힘을 북돋우고 너를 도와주리라.”',
      zh: '“你不要害怕，因为我与你同在；不要惊惶，因为我是你的天主：我坚固你，协助你，用我胜利的右手扶持你。”',
      vi: '“Đừng sợ, vì có Ta ở với ngươi. Đừng nhìn ngược nhìn xuôi, vì Ta là Thiên Chúa của ngươi. Ta cho ngươi vững mạnh, Ta phù trợ ngươi.”',
    },
  },
  'grace-fellowship-us': {
    'luke-21-19': {
      vi: '“Nhờ sự nhịn nhục của các ngươi mà giữ được linh hồn mình... Vả, sự trông cậy không làm cho hổ thẹn, vì sự yêu thương của Đức Chúa Trời rải khắp trong lòng chúng ta bởi Đức Thánh Linh đã được ban cho chúng ta.”',
    },
    'psalm-34-18': {
      ko: '“여호와는 마음이 상한 자를 가까이 하시고 충심으로 통회하는 자를 구원하시는도다.”',
      vi: '“Đức Giê-hô-va ở gần những người có lòng đau thương, và cứu kẻ nào có tâm hồn thống hối.”',
    },
    'philippians-4-19': {
      ko: '“나의 하나님이 그리스도 예수 안에서 영광 가운데 그 풍성한 대로 너희 모든 쓸 것을 채우시리라.”',
      vi: '“Đức Chúa Trời tôi sẽ làm cho đầy đủ mọi sự cần dùng của anh em y theo sự giàu có của Ngài ở nơi vinh hiển trong Đức Chúa Jêsus Christ.”',
    },
    'matthew-11-28': {
      ko: '“수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라.”',
      vi: '“Hỡi những kẻ mệt mỏi và gánh nặng, hãy đến cùng ta, ta sẽ cho các ngươi được yên nghỉ.”',
    },
    'isaiah-41-10': {
      ko: '“두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라.”',
      vi: '“Đừng sợ, vì ta ở với ngươi; chớ kinh khiếp, vì ta là Đức Chúa Trời ngươi! Ta sẽ bổ sức cho ngươi; phải, ta sẽ giúp đỡ ngươi.”',
    },
  },
};

/** A passage's texts in the wording of one church's tradition. */
export function passageTexts(id: string, tradition: string): Record<SupportedLanguageCode, string> {
  return { ...VERIFIED_SCRIPTURE_CORPUS[id].texts, ...(TRADITION_TEXTS[tradition]?.[id] ?? {}) } as Record<SupportedLanguageCode, string>;
}

/** A passage as one church reads it, or null for an unknown id. */
export function scriptureFor(id: string | null | undefined, tradition: string): VerifiedScripture | null {
  const base = id ? VERIFIED_SCRIPTURE_CORPUS[id] : undefined;
  return base ? { ...base, texts: passageTexts(base.id, tradition) } : null;
}

export const CHURCH_PROFILES: Record<string, ChurchTraditionProfile> = {
  'san-venanzio-unicam': {
    id: 'san-venanzio-unicam',
    shortLabel: '🇮🇹 Basilica di San Venanzio × UNICAM (Italy)',
    badgeText: 'SAMPLE PROFILE • CAMERINO, ITALY (CATHOLIC BASILICA & UNIVERSITY MINISTRY)',
    churchName: 'Basilica di San Venanzio',
    cityCountry: 'Camerino (MC), Italy',
    campusOrNeighborhood: 'Università degli Studi di Camerino (UNICAM) - Historic Hilltop Campus',
    leaderTitle: 'Parish Rector & Campus Chaplaincy',
    leaderName: 'Don Tommaso Ferrante',
    coLeaderName: 'Sr. Chiara Benedetti (UNICAM International Chaplaincy)',
    sermonTerm: 'Homily',
    serviceTerm: 'Sunday Solemn & University Mass',
    heritageBannerTitle:
      'From 250 AD Martyrdom & the 2016 Earthquake Rebirth to Welcoming 40+ Nations at UNICAM',
    heritageBannerStory:
      'Dedicated to the 15-year-old martyr St. Venantius (250 AD) and rebuilt after the devastating 1799 and 2016 earthquakes (reopened December 2019), Basilica di San Venanzio is the spiritual heart of Camerino and UNICAM. Every Sunday, Italian families worship alongside international students from Nigeria, China, Spain, Poland, Vietnam, Brazil, and Kenya-bridged together in real time by Koinonia.',
    currentSeriesTitle: 'Living Stones Rebuilt in Hope (Pietre Vive Ricostruite nella Speranza)',
    currentMessageTitle: makeMultilingual({
      en: 'When the Ground Shakes: Unshakable Hope Far From Home',
      it: 'Quando la Terra Trema: Una Speranza Incrollabile Lontano da Casa',
      es: 'Cuando la Tierra Tiembla: Esperanza Inquebrantable Lejos de Casa',
      fr: 'Quand la Terre Tremble : Une Espérance Inébranlable Loin de Chez Soi',
      zh: '当大地摇动时：异乡求学中不可动摇的盼望',
      ar: 'عندما تهتز الأرض: رجاء لا يتزعزع بعيدًا عن الوطن',
      sw: 'Ardhi Inapotikisika: Tumaini Lisilotikisika Mbali na Nyumbani',
      pt: 'Quando a Terra Treme: Esperança Inabalável Longe de Casa',
      pl: 'Gdy Ziemia Drży: Niezłomna Nadzieja z Daleka od Domu',
      ko: '땅이 흔들릴 때: 타향에서 붙드는 흔들리지 않는 소망',
      vi: 'Khi Mặt Đất Rung Chuyển: Niềm Hy Vọng Không Lay Chuyển Nơi Xa Xứ',
      uk: 'Коли Земля Тремтить: Непохитна Надія Далеко від Дому',
    }),
    currentMessageSummary: makeMultilingual({
      en: 'Looking at the restored arches of Basilica di San Venanzio after the 2016 earthquake, Don Tommaso reminds both lifelong Camerino residents and newly arrived UNICAM international students that Christ meets us in our fractures. Like young St. Venantius who stood firm at age 15, you do not have to carry academic pressure, loneliness, or uncertainty alone-this Basilica is your family table.',
      it: 'Guardando le volte restaurate della Basilica di San Venanzio dopo il sisma del 2016, Don Tommaso ricorda ai cittadini di Camerino e agli studenti internazionali UNICAM appena arrivati che Cristo ci incontra nelle nostre fragilità. Come il giovane San Venanzio che rimase saldo a 15 anni, nessuno deve portare da solo il peso degli esami, della nostalgia di casa o dell’incertezza: questa Basilica è la vostra casa.',
      es: 'Mirando los arcos restaurados de la Basílica de San Venanzio tras el terremoto de 2016, Don Tommaso recuerda a los vecinos de Camerino y a los estudiantes internacionales de UNICAM que Cristo nos encuentra en nuestras fracturas. Como el joven San Venancio a sus 15 años, no tienes que cargar solo con la presión académica ni la nostalgia: esta Basílica es tu hogar.',
      fr: 'En contemplant les voûtes restaurées de la Basilique San Venanzio après le séisme de 2016, Don Tommaso rappelle aux habitants de Camerino et aux étudiants internationaux d’UNICAM que le Christ nous rejoint dans nos fragilités. Comme le jeune saint Venant à 15 ans, vous n’avez pas à porter seuls la pression des études ou l’éloignement : cette Basilique est votre maison.',
      zh: '仰望圣维南齐奥大殿在2016年地震后修复的拱顶，Don Tommaso神父提醒卡梅里诺居民和初到UNICAM的国际学生：基督在我们的裂痕与软弱中与我们相遇。就像15岁坚立信仰的年轻圣人维南齐奥一样，你不必独自承担学业压力或思乡之苦--这座大殿就是你的家。',
      ar: 'بالنظر إلى الأقواس المرممة في بازيليك سان فينانزيو بعد زلزال عام ٢٠١٦، يذكّر الأب توماسو سكان كاميرينو وطلاب جامعة UNICAM الدوليين بأن المسيح يلتقي بنا في وسط ضعفاتنا. مثل القديس الشاب فينانسيوس، لست مضطرًا لحمل ضغوط الدراسة أو الغربة وحدك - هذه الكنيسة هي بيتك وعائلتك.',
      sw: 'Akitazama matao yaliyokarabatiwa ya Basilica di San Venanzio baada ya tetemeko la ardhi la 2016, Padre Tommaso anawakumbusha wakazi wa Camerino na wanafunzi wa kimataifa wa UNICAM kwamba Kristo anakutana nasi katika udhaifu wetu. Kama Mtakatifu Venantius, hupaswi kubeba shinikizo la masomo au upweke peke yako-Basilica hii ni nyumbani kwako.',
      pt: 'Olhando para os arcos restaurados da Basílica de San Venanzio após o terremoto de 2016, Don Tommaso lembra aos moradores de Camerino e aos estudantes internacionais da UNICAM que Cristo nos encontra em nossas fragilidades. Você não precisa carregar a pressão dos estudos ou a saudade de casa sozinho.',
      pl: 'Patrząc na odnowione sklepienia Bazyliki San Venanzio po trzęsieniu ziemi z 2016 roku, ks. Tommaso przypomina mieszkańcom Camerino i studentom zagranicznym UNICAM, że Chrystus spotyka nas w naszych pęknięciach. Nie musisz dźwigać presji egzaminów ani tęsknoty samemu - ta Bazylika jest Twoim domem.',
      ko: '2016년 지진 이후 복원된 산 베난치오 대성당의 아치를 바라보며, 톰마소 신부님은 카메리노 주민들과 UNICAM 유학생들에게 그리스도께서 우리의 연약함 속에서 만나주신다고 전합니다. 학업의 무게와 타향의 외로움을 혼자 짊어지지 마십시오. 이 성당은 여러분의 가족입니다.',
      vi: 'Nhìn lên những mái vòm được phục hồi của Vương cung thánh đường San Venanzio sau trận động đất năm 2016, Cha Tommaso nhắc nhở người dân Camerino và các sinh viên quốc tế UNICAM rằng Đức Kitô luôn gặp gỡ chúng ta trong những tổn thương. Bạn không phải gánh vác áp lực học tập hay nỗi nhớ nhà một mình-ngôi thánh đường này là mái nhà của bạn.',
      uk: 'Дивлячись на відновлені склепіння Базиліки Сан-Венанціо після землетрусу 2016 року, отець Томмазо нагадує мешканцям Камеріно та іноземним студентам UNICAM, що Христос зустрічає нас у наших ранах. Вам не потрібно нести тягар навчання чи самотності наодинці - ця Базиліка є вашим домом.',
    }),
    keyTakeaways: {
      en: [
        'Resilience is not pretending the earthquake never happened; it is letting Christ rebuild us stone by stone in community.',
        'At age 15 in Camerino, St. Venantius proved that youth and students are not the "future" church-you are the courageous heart of the Church today.',
        'No UNICAM student should eat every meal alone this week: connect with a bilingual parish table before leaving the Piazza.',
      ],
      it: [
        'La resilienza non è fingere che il terremoto non ci sia stato, ma lasciare che Cristo ci ricostruisca pietra su pietra nella comunità.',
        'A 15 anni a Camerino, San Venanzio ha dimostrato che i giovani e gli studenti non sono solo il "futuro", ma il cuore coraggioso della Chiesa oggi.',
        'Nessuno studente UNICAM deve sentirsi solo questa settimana: unisciti a una tavola fraterna bilingue prima di lasciare la Piazza.',
      ],
      es: [
        'La resiliencia no es fingir que el terremoto nunca ocurrió, sino dejar que Cristo nos reconstruya piedra a piedra en comunidad.',
        'A los 15 años en Camerino, San Venancio demostró que los jóvenes y estudiantes son el corazón valiente de la Iglesia hoy.',
        'Ningún estudiante de UNICAM debe caminar solo esta semana: únete a una mesa fraterna bilingüe al salir.',
      ],
      fr: [
        'La résilience consiste à laisser le Christ nous reconstruire pierre par pierre en communauté.',
        'À 15 ans à Camerino, saint Venant a montré que les jeunes et les étudiants sont le cœur vivant de l’Église aujourd’hui.',
        'Aucun étudiant d’UNICAM ne doit rester isolé cette semaine : rejoignez une table fraternelle bilingue.',
      ],
      zh: [
        '真正的坚韧不是假装地震从未发生，而是让基督在群体中一砖一瓦地重建我们。',
        '15岁的圣维南齐奥证明了青年与学生不是教会的“未来”，而是教会今日勇敢的心脏。',
        '本周不应有任何一位UNICAM学生独自孤单度日：离开广场前请加入我们的双语团契餐桌。',
      ],
      ar: [
        'الصمود الحقيقي هو السماح للمسيح بإعادة بنائنا حجرًا بحجر داخل الجماعة.',
        'في سن الخامسة عشرة في كاميرينو، أثبت القديس فينانسيوس أن الشباب والطلاب هم قلب الكنيسة النابض اليوم.',
        'لا ينبغي لأي طالب في UNICAM أن يبقى وحيدًا هذا الأسبوع: انضم إلى مائدة الأخوة ثنائية اللغة.',
      ],
      sw: [
        'Uvumilivu wa kweli ni kumruhusu Kristo atujenge upya jiwe kwa jiwe ndani ya jumuiya.',
        'Akiwa na umri wa miaka 15 huko Camerino, Mtakatifu Venantius alithibitisha kuwa vijana na wanafunzi ni moyo wa Kanisa leo.',
        'Hakuna mwanafunzi wa UNICAM anayepaswa kuwa mpweke wiki hii: jiunge na kikundi cha ushirika.',
      ],
      pt: [
        'A resiliência é deixar Cristo nos reconstruir pedra por pedra em comunidade.',
        'Aos 15 anos em Camerino, São Venâncio mostrou que os estudantes são o coração vivo da Igreja hoje.',
        'Nenhum estudante da UNICAM deve caminhar sozinho nesta semana.',
      ],
      pl: [
        'Wytrwałość to pozwolenie Chrystusowi, by odbudowywał nas kamień po kamieniu we wspólnocie.',
        'Mając 15 lat w Camerino, św. Wenancjusz pokazał, że młodzi i studenci są odważnym sercem Kościoła.',
        'Żaden student UNICAM nie powinien być sam w tym tygodniu - dołącz do spotkania wspólnoty.',
      ],
      ko: [
        '진정한 회복은 공동체 안에서 그리스도께서 우리를 돌 하나하나 다시 세우시도록 맡기는 것입니다.',
        '15세의 성 베난치오는 청년과 학생들이 오늘날 교회의 용기 있는 심장임을 보여주었습니다.',
        '이번 주 어느 UNICAM 유학생도 홀로 지내지 않도록 이중언어 식탁 모임에 함께합시다.',
      ],
      vi: [
        'Sự kiên cường thật sự là để Đức Kitô tái thiết chúng ta từng viên đá một trong cộng đoàn.',
        'Ở tuổi 15 tại Camerino, Thánh Venantius đã chứng minh giới trẻ và sinh viên là trái tim sống động của Giáo hội hôm nay.',
        'Không sinh viên UNICAM nào phải cô đơn tuần này: hãy tham gia bàn ăn huynh đệ song ngữ.',
      ],
      uk: [
        'Справжня стійкість - це дозволити Христові відбудувати нас камінь за каменем у спільноті.',
        'У 15 років святий Венанцій показав, що молодь і студенти є живим серцем Церкви сьогодні.',
        'Жоден студент UNICAM не повинен залишатися самотнім цього тижня.',
      ],
    },
    primaryScripture: scriptureFor('luke-21-19', 'san-venanzio-unicam')!,
    liturgicalSteps: [
      {
        id: 'step-1',
        order: 1,
        timestampLabel: '11:00 AM • Introductory Rites',
        title: makeMultilingual({
          en: 'Gathering & Penitential Act (Riti di Introduzione)',
          it: 'Riti di Introduzione e Atto Penitenziale',
          es: 'Ritos Iniciales y Acto Penitencial',
          fr: 'Rites Initiaux et Acte Pénitentiel',
          zh: '进堂礼与忏悔词 (Riti di Introduzione)',
        }),
        whatHappens: makeMultilingual({
          en: 'We stand as the priest processes down the Neoclassical nave built by Luigi Poletti, pause in silence to lay down our burdens, and sing the Gloria.',
          it: 'Ci alziamo in piedi mentre il sacerdote attraversa la navata neoclassica del Poletti, affidiamo in silenzio le nostre fatiche al Signore e cantiamo il Gloria.',
          es: 'Nos ponemos de pie mientras el sacerdote avanza por la nave neoclásica, entregamos en silencio nuestras cargas y cantamos el Gloria.',
          fr: 'Nous nous levons pendant la procession dans la nef néoclassique, déposons nos fardeaux en silence et chantons le Gloria.',
          zh: '全体起立迎接神父走过新古典主义中殿，在静默中卸下重担，并共同颂唱《光荣颂》。',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'No matter what language you speak or how heavy your week at UNICAM was, you enter God’s house as a beloved child, not a stranger.',
          it: 'Qualunque lingua tu parli o quanto pesante sia stata la settimana a UNICAM, entri nella casa di Dio come figlio amato, mai come straniero.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Stand • Response: “And with your spirit” / «E con il tuo spirito»',
          it: 'In piedi • Risposta: «E con il tuo spirito» (And with your spirit)',
        }),
      },
      {
        id: 'step-2',
        order: 2,
        timestampLabel: '11:15 AM • Liturgy of the Word',
        title: makeMultilingual({
          en: 'Scripture Readings & Bilingual Homily (Liturgia della Parola)',
          it: 'Liturgia della Parola e Omelia',
          es: 'Liturgia de la Palabra y Homilía',
          fr: 'Liturgie de la Parole et Homélie',
          zh: '圣道礼仪与讲道 (Liturgia della Parola)',
        }),
        whatHappens: makeMultilingual({
          en: 'UNICAM students and parishioners proclaim the Old Testament, Psalm, Epistle, and Gospel (Luke 21). Follow the live native-language summary right here on your phone.',
          it: 'Studenti UNICAM e parrocchiani proclamano le Letture, il Salmo e il Vangelo (Luca 21). Segui la sintesi nella tua lingua madre direttamente qui sul telefono.',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'God speaks into our real history-just as this Basilica rose from the 2016 earthquake, His Word rebuilds our courage.',
          it: 'Dio parla nella nostra storia concreta: come questa Basilica è risorta dal sisma del 2016, la Sua Parola ricostruisce il nostro coraggio.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Sit for Readings & Homily • Stand for the Gospel Alleluia',
          it: 'Seduti per le Letture e l’Omelia • In piedi al canto dell’Alleluia',
        }),
      },
      {
        id: 'step-3',
        order: 3,
        timestampLabel: '11:35 AM • Liturgy of the Eucharist & Sign of Peace',
        title: makeMultilingual({
          en: 'The Eucharistic Table & Sign of Peace (Liturgia Eucaristica)',
          it: 'Liturgia Eucaristica e Scambio della Pace',
          es: 'Liturgia Eucarística y Signo de la Paz',
          fr: 'Liturgie Eucharistique et Geste de Paix',
          zh: '圣祭礼仪与互祝平安 (Liturgia Eucaristica)',
        }),
        whatHappens: makeMultilingual({
          en: 'Bread and wine are offered above the 16th-century Crypt of St. Venantius. Before Communion, we turn to neighbors in the pew and offer the Sign of Peace («La pace sia con te»).',
          it: 'Il pane e il vino vengono offerti sopra la Cripta cinquecentesca di San Venanzio. Prima della Comunione, ci scambiamo il Segno della Pace («La pace sia con te»).',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'When you shake hands or bow to the person beside you in the pew, the language barrier disappears-we become one family in Christ.',
          it: 'Quando stringi la mano a chi ti siede accanto nel banco, ogni barriera linguistica cade: diventiamo una sola famiglia in Cristo.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Kneel or Stand reverently • Visitors not receiving Communion are warmly invited forward with arms crossed for a personal blessing!',
          it: 'In ginocchio o in piedi • Chi non riceve la Comunione può avvicinarsi con le braccia incrociate sul petto per ricevere una benedizione!',
        }),
      },
      {
        id: 'step-4',
        order: 4,
        timestampLabel: '11:55 AM • Piazza Fellowship & Crypt Visit',
        title: makeMultilingual({
          en: 'Blessing, Crypt Prayer & UNICAM Student Espresso Welcome',
          it: 'Benedizione Finale, Discesa in Cripta e Caffè Universitario in Piazza',
          es: 'Bendición Final, Cripta y Café Universitario en la Plaza',
          fr: 'Bénédiction Finale, Crypte et Café Étudiant sur la Place',
          zh: '礼成降福、圣维南齐奥地宫祈祷与广场学生咖啡团契',
        }),
        whatHappens: makeMultilingual({
          en: 'After the final blessing («Andate in pace»), newly arrived students and visitors are invited down to the Crypt of St. Venantius and outside to Piazza San Venanzio for espresso and fellowship.',
          it: 'Dopo la benedizione («Andate in pace»), i nuovi studenti e visitatori sono invitati nella Cripta di San Venanzio e poi in Piazza per un caffè fraterno.',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'Sunday worship continues in friendship. Tap "Find My Small Group" below to meet our bilingual student hosts right after Mass.',
          it: 'La Messa continua nell’amicizia fraterna. Tocca "Trova il Mio Gruppo" qui sotto per incontrare i nostri tutor universitari dopo la celebrazione.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Response: “Thanks be to God” / «Rendiamo grazie a Dio»',
          it: 'Risposta: «Rendiamo grazie a Dio» (Thanks be to God)',
        }),
      },
    ],
    sevenDayJourney: [
      {
        day: 1,
        dayLabel: 'Monday • Exam & Study Peace',
        title: makeMultilingual({
          en: 'Planting Your Feet When Everything Feels New',
          it: 'Piantare i Piedi Quando Tutto Sembra Nuovo',
          es: 'Afirmar los Pies Cuando Todo Parece Nuevo',
          fr: 'Prendre Pied Quand Tout Semble Nouveau',
          zh: '在万事陌生的环境中站稳脚跟',
        }),
        scriptureRef: 'Luke 21:19',
        scriptureText: passageTexts('luke-21-19', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'What is one area of your studies, research, or family life in Camerino that feels shaky today? How can you invite Christ into that exact fracture instead of hiding it?',
          it: 'Qual è un ambito dei tuoi studi a UNICAM o della tua vita familiare che oggi senti fragile? Come puoi invitare Cristo proprio in quella fessura invece di nasconderla?',
        }),
        actionStep: makeMultilingual({
          en: 'Before opening your laptop or lecture notes today, take 60 seconds of quiet breathing and pray: “Lord, be my foundation today.”',
          it: 'Prima di aprire il computer o gli appunti di lezione oggi, prenditi 60 secondi di silenzio e prega: «Signore, sii Tu la mia roccia oggi».',
        }),
        prayerFocus: makeMultilingual({
          en: 'For international students starting their first semester far from family.',
          it: 'Per gli studenti internazionali che vivono il loro primo semestre lontano dalla famiglia.',
        }),
        leaderApproved: true,
        approvedBy: 'Don Tommaso Ferrante (Verified Theological Sign-Off)',
      },
      {
        day: 2,
        dayLabel: 'Tuesday • Courage Like St. Venantius',
        title: makeMultilingual({
          en: 'Youthful Courage in a Noisy World',
          it: 'Il Coraggio dei Giovani in un Mondo Rumoroso',
          es: 'Valentía Juvenil en un Mundo Ruidoso',
          fr: 'Le Courage de la Jeunesse dans un Monde Bruyant',
          zh: '在喧嚣世界中持守年轻人的勇气',
        }),
        scriptureRef: 'Isaiah 41:10',
        scriptureText: passageTexts('isaiah-41-10', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'St. Venantius was only 15 in Camerino when he witnessed to Christ with unshakable joy. Where is God calling you to quiet courage in your faculty or laboratory this week?',
          it: 'San Venanzio aveva solo 15 anni qui a Camerino quando testimoniò Cristo con gioia. Dove Dio ti chiama a un coraggio mite nella tua facoltà o nel tuo laboratorio questa settimana?',
        }),
        actionStep: makeMultilingual({
          en: 'Check in on one classmate or colleague who seemed quiet or overwhelmed during lectures.',
          it: 'Scrivi o saluta un compagno di corso che ti è sembrato silenzioso o affaticato a lezione.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For UNICAM professors, researchers, and students preparing for lab defenses.',
          it: 'Per i docenti, ricercatori e studenti UNICAM in preparazione agli esami.',
        }),
        leaderApproved: true,
        approvedBy: 'Don Tommaso Ferrante (Verified Theological Sign-Off)',
      },
      {
        day: 3,
        dayLabel: 'Wednesday • Rebuilt Stone by Stone',
        title: makeMultilingual({
          en: 'Beauty After the Earthquake',
          it: 'La Bellezza Dopo il Terremoto',
          es: 'Belleza Después del Terremoto',
          fr: 'La Beauté Après le Séisme',
          zh: '震后重建的生命之美',
        }),
        scriptureRef: 'Psalm 34:18',
        scriptureText: passageTexts('psalm-34-18', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'When Basilica di San Venanzio reopened in 2019 after the 2016 earthquake, every restored arch told a story of grace. Looking back at a past disappointment, where can you see God’s rebuilding hand?',
          it: 'Quando la Basilica di San Venanzio ha riaperto nel 2019 dopo il sisma del 2016, ogni arco restaurato raccontava una grazia. Guardando a una ferita passata, dove scorgi la mano di Dio che ricostruisce?',
        }),
        actionStep: makeMultilingual({
          en: 'Walk past Piazza San Venanzio today and pause for 2 minutes inside the Crypt or by the medieval portal to thank God for His faithfulness.',
          it: 'Passa da Piazza San Venanzio oggi e fermati due minuti nella Cripta o davanti al portale medievale per ringraziare Dio della Sua fedeltà.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For families in Camerino and the Marche region continuing to rebuild.',
          it: 'Per le famiglie di Camerino e dell’entroterra marchigiano che continuano a ricostruire.',
        }),
        leaderApproved: true,
        approvedBy: 'Don Tommaso Ferrante & Sr. Chiara Benedetti',
      },
      {
        day: 4,
        dayLabel: 'Thursday • The Shared Table',
        title: makeMultilingual({
          en: 'Breaking the Language Barrier With Hospitality',
          it: 'Superare le Barriere Linguistiche con l’Ospitalità',
          es: 'Romper la Barrera del Idioma con Hospitalidad',
          fr: 'Briser la Barrière de la Langue par l’Hospitalité',
          zh: '用盛情款待打破语言的隔阂',
        }),
        scriptureRef: 'Matthew 11:28',
        scriptureText: passageTexts('matthew-11-28', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'In Christ, no one is a foreigner. Have you allowed shyness or language differences to keep you isolated from believers around you?',
          it: 'In Cristo nessuno è straniero. Hai permesso alla timidezza o alla differenza di lingua di tenerti isolato dai fratelli accanto a te?',
        }),
        actionStep: makeMultilingual({
          en: 'Join tonight’s Thursday 19:30 UNICAM International Fellowship Dinner & Gospel Table near the Basilica!',
          it: 'Partecipa stasera alle 19:30 alla Cena Fraterna Internazionale UNICAM & Tavola del Vangelo vicino alla Basilica!',
        }),
        prayerFocus: makeMultilingual({
          en: 'For unity between local Italian parishioners and international students.',
          it: 'Per una comunione sempre più viva tra i parrocchiani di Camerino e gli studenti internazionali.',
        }),
        leaderApproved: true,
        approvedBy: 'Sr. Chiara Benedetti (UNICAM Chaplaincy)',
      },
      {
        day: 5,
        dayLabel: 'Friday • Providence in Practical Needs',
        title: makeMultilingual({
          en: 'Trusting God With Daily Bread',
          it: 'Affidare a Dio il Pane Quotidiano',
          es: 'Confiar a Dios el Pan Cotidiano',
          fr: 'Confier à Dieu le Pain Quotidien',
          zh: '将日用的饮食交托于神',
        }),
        scriptureRef: 'Philippians 4:19',
        scriptureText: passageTexts('philippians-4-19', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'Are you carrying financial stress, scholarship delays, or family worries in secret? Why is asking the Body of Christ for help an act of humility and faith?',
          it: 'Stai portando in segreto preoccupazioni economiche, ritardi nelle borse di studio o pensieri per la famiglia? Chiedere aiuto alla comunità cristiana è un atto di fede.',
        }),
        actionStep: makeMultilingual({
          en: 'Either offer a small act of generosity today or reach out confidentially via the Zero-PII Care tab if you need support.',
          it: 'Compi oggi un piccolo gesto di carità, oppure contattaci in totale riservatezza tramite lo sportello Zero-PII se hai bisogno di sostegno.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For students awaiting scholarship disbursements and parish Caritas volunteers.',
          it: 'Per gli studenti in attesa di borsa di studio e per i volontari della Caritas parrocchiale.',
        }),
        leaderApproved: true,
        approvedBy: 'Don Tommaso Ferrante',
      },
      {
        day: 6,
        dayLabel: 'Saturday • Rest in the Sibillini Hills',
        title: makeMultilingual({
          en: 'Sabbath Stillness Before Sunday',
          it: 'Il Silenzio che Prepara la Domenica',
          es: 'El Silencio que Prepara el Domingo',
          fr: 'Le Silence qui Prépare le Dimanche',
          zh: '主日前的安息与宁静',
        }),
        scriptureRef: 'Matthew 11:28',
        scriptureText: passageTexts('matthew-11-28', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'Your worth is not measured by your GPA or research output. How can you practice true rest in God’s presence this weekend?',
          it: 'Il tuo valore non dipende dalla media dei voti o dalle pubblicazioni. Come puoi vivere un vero riposo alla presenza di Dio questo fine settimana?',
        }),
        actionStep: makeMultilingual({
          en: 'Take a 20-minute walk looking out toward the Sibillini mountains without headphones, thanking God for 3 gifts from this week.',
          it: 'Fai una passeggiata di 20 minuti guardando i Monti Sibillini senza cuffie, ringraziando Dio per 3 doni ricevuti questa settimana.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For peace of heart across every student residence in Camerino.',
          it: 'Per la pace del cuore in ogni studentato e casa di Camerino.',
        }),
        leaderApproved: true,
        approvedBy: 'Don Tommaso Ferrante',
      },
      {
        day: 7,
        dayLabel: 'Sunday • Returning With a Friend',
        title: makeMultilingual({
          en: 'No One Walks Into the Basilica Alone',
          it: 'Nessuno Entri in Basilica da Solo',
          es: 'Que Nadie Entre Solo a la Basílica',
          fr: 'Que Personne n’Entre Seul dans la Basilique',
          zh: '不让任何一个人孤单走进圣殿',
        }),
        scriptureRef: 'Luke 21:19',
        scriptureText: passageTexts('luke-21-19', 'san-venanzio-unicam'),
        reflectionPrompt: makeMultilingual({
          en: 'Who is one friend at UNICAM or neighbor in Camerino you can invite to sit beside you at Mass today and share this multilingual pew guide with?',
          it: 'Quale amico di UNICAM o vicino di casa a Camerino puoi invitare a sedersi accanto a te a Messa oggi, condividendo questa guida multilingue?',
        }),
        actionStep: makeMultilingual({
          en: 'Invite one friend to the 11:00 AM Mass or 18:30 Student Mass and introduce them to a greeter at the medieval portal.',
          it: 'Invita un amico alla Messa delle 11:00 o delle 18:30 e presentalo al gruppo di accoglienza sul sagrato.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For every newcomer stepping through the doors of Basilica di San Venanzio today.',
          it: 'Per ogni nuovo arrivato che varca oggi la soglia della Basilica di San Venanzio.',
        }),
        leaderApproved: true,
        approvedBy: 'Don Tommaso Ferrante & Parish Pastoral Council',
      },
    ],
    careQueue: [
      {
        id: 'care-sv-1',
        submittedAt: '14 mins ago (Sunday 11:00 AM Mass Pew QR)',
        sourceChannel: 'Pew QR Scan',
        originalLanguage: 'en',
        languageLabel: 'English (Nigerian UNICAM Master’s Student)',
        rawInputWithPII:
          'My name is Chinedu Okafor (matricola 118492, phone +39 347 882 1904, living at Via Madonna delle Carceri 14). I arrived at UNICAM Computer Science 3 weeks ago from Nigeria. I love attending Mass at Basilica di San Venanzio, but I don’t speak much Italian yet and I feel very lonely and anxious about my first winter and exams.',
        redactedInputZeroPII:
          'My name is [PERSON_REDACTED_1] ([STUDENT_ID_REDACTED_1], phone [PHONE_REDACTED_1], living at [ADDRESS_REDACTED_1]). I arrived at UNICAM Computer Science 3 weeks ago from Nigeria. I love attending Mass at Basilica di San Venanzio, but I don’t speak much Italian yet and I feel very lonely and anxious about my first winter and exams.',
        detectedPIITokens: [
          { type: 'NAME', token: '[PERSON_REDACTED]', redactedCount: 1 },
          { type: 'STUDENT_ID', token: '[STUDENT_ID_REDACTED]', redactedCount: 1 },
          { type: 'PHONE', token: '[PHONE_REDACTED]', redactedCount: 1 },
          { type: 'ADDRESS', token: '[ADDRESS_REDACTED]', redactedCount: 1 },
        ],
        category: 'Homesickness & Student Transition',
        urgency: 'High (Within 24h)',
        translatedSummaryForLeader:
          'IT Sintesi per Don Tommaso / Sr. Chiara: Studente magistrale di Informatica arrivato dalla Nigeria 3 settimane fa. Partecipa con gioia alla Messa in Basilica ma parla ancora poco italiano, soffre la solitudine e l’ansia per il primo inverno e gli esami. Richiede inserimento nel gruppo internazionale UNICAM.',
        pastoralContextNote:
          'Zero-PII Shield stripped 4 sensitive identifiers locally before LLM translation • Audit ZKP-94F18A02',
        verifiedScriptureId: 'isaiah-41-10',
        draftReplyNativeLanguage:
          'Dear brother, welcome home to Basilica di San Venanzio and Camerino! You are a blessing to our parish. Sr. Chiara and our UNICAM English-speaking Catholic Fellowship would love to welcome you for warm dinner this Thursday at 19:30-and pair you with a senior Computer Science student mentor. Remember God’s word: “Fear not, for I am with you” (Isaiah 41:10).',
        draftReplyBackTranslation:
          'Caro fratello, benvenuto a casa nella Basilica di San Venanzio e a Camerino! Sei una benedizione per la nostra parrocchia. Suor Chiara e il gruppo universitario anglofono UNICAM ti aspettano giovedì alle 19:30 per una cena calda e per affiancarti a uno studente senior di Informatica. Ricorda la Parola di Dio: «Non temere, perché io sono con te» (Isaia 41,10).',
        assignedLeaderName: 'Sr. Chiara Benedetti & Samuel (UNICAM CS Student Mentor)',
        matchedGroupId: 'grp-sv-1',
        approvalStatus: 'Pending Human Approval',
        theologicalGuardrailPassed: true,
      },
      {
        id: 'care-sv-2',
        submittedAt: '38 mins ago (Basilica Crypt QR Kiosk)',
        sourceChannel: 'Pew QR Scan',
        originalLanguage: 'zh',
        languageLabel: 'Mandarin / 中文 (UNICAM Biosciences Visiting Scholar)',
        rawInputWithPII:
          '我叫林晓雯 (邮箱 xiaowen.lin@studenti.unicam.it，电话 +39 320 554 9182)。我今天第一次走进圣维南齐奥大殿，看到地震后重建的教堂非常感动。我还不是基督徒，但最近科研压力很大，想了解基督徒是如何祷告和面对苦难的。',
        redactedInputZeroPII:
          '我叫[PERSON_REDACTED_1] (邮箱 [EMAIL_REDACTED_1]，电话 [PHONE_REDACTED_1])。我今天第一次走进圣维南齐奥大殿，看到地震后重建的教堂非常感动。我还不是基督徒，但最近科研压力很大，想了解基督徒是如何祷告和面对苦难的。',
        detectedPIITokens: [
          { type: 'NAME', token: '[PERSON_REDACTED]', redactedCount: 1 },
          { type: 'EMAIL', token: '[EMAIL_REDACTED]', redactedCount: 1 },
          { type: 'PHONE', token: '[PHONE_REDACTED]', redactedCount: 1 },
        ],
        category: 'Seeker Theological Q&A',
        urgency: 'Standard (Within 48h)',
        translatedSummaryForLeader:
          'EN/IT Summary for Clergy: Visiting Biosciences scholar walked into Basilica di San Venanzio for the first time today and was deeply moved by the post-2016 earthquake restoration. Not yet a Christian, experiencing heavy research stress, and asking how Christians pray and find hope in suffering.',
        pastoralContextNote:
          'Zero-PII Shield stripped 3 identifiers locally • Doctrinal Seeker Guardrail active • Audit ZKP-41C8B310',
        verifiedScriptureId: 'matthew-11-28',
        draftReplyNativeLanguage:
          '欢迎来到圣维南齐奥大殿！很感恩这座震后重建的圣殿能触动你的心。基督信仰告诉我们，神并非高高在上远离苦难，而是在耶稣基督里亲自与我们一同背负重担：“凡劳苦担重担的人可以到我这里来，我就使你们得安息”（马太福音 11:28）。本周三下午17:30我们在大殿旁有轻松的双语咖啡茶叙（探索信仰小组），非常欢迎你来喝杯热茶、自由交流！',
        draftReplyBackTranslation:
          'Welcome to Basilica di San Venanzio! We are grateful that this Basilica rebuilt after the earthquake touched your heart. Christian faith teaches that God is not distant from suffering, but carries our burdens with us in Jesus Christ: “Come to me, all who labor and are heavy laden, and I will give you rest” (Matthew 11:28). We would love to welcome you for tea at our Wednesday 17:30 Seeker & Science Dialogue Table!',
        assignedLeaderName: 'Don Tommaso Ferrante & Dr. Matteo (UNICAM Biosciences Lay Host)',
        matchedGroupId: 'grp-sv-2',
        approvalStatus: 'Pending Human Approval',
        theologicalGuardrailPassed: true,
      },
      {
        id: 'care-sv-3',
        submittedAt: '1 hour ago (Campus Welcome Desk)',
        sourceChannel: 'Campus Welcome Desk',
        originalLanguage: 'es',
        languageLabel: 'Spanish / Español (Erasmus Student from Madrid)',
        rawInputWithPII:
          'Me llamo Lucía Fernández (Via Venanzio Varano 8, tel +34 612 998 310). Mi beca Erasmus se ha retrasado este mes y tengo dificultades para cubrir la compra de alimentos y calefacción estas dos semanas en Camerino. Me da vergüenza pedir ayuda.',
        redactedInputZeroPII:
          'Me llamo [PERSON_REDACTED_1] ([ADDRESS_REDACTED_1], tel [PHONE_REDACTED_1]). Mi beca Erasmus se ha retrasado este mes y tengo dificultades para cubrir la compra de alimentos y calefacción estas dos semanas en Camerino. Me da vergüenza pedir ayuda.',
        detectedPIITokens: [
          { type: 'NAME', token: '[PERSON_REDACTED]', redactedCount: 1 },
          { type: 'ADDRESS', token: '[ADDRESS_REDACTED]', redactedCount: 1 },
          { type: 'PHONE', token: '[PHONE_REDACTED]', redactedCount: 1 },
        ],
        category: 'Benevolence & Material Need',
        urgency: 'High (Within 24h)',
        translatedSummaryForLeader:
          'EN/IT Summary for Parish Caritas: Erasmus student experiencing a 2-week scholarship disbursement delay; needs discreet grocery & winter utility assistance and feels shy asking for help.',
        pastoralContextNote:
          'Zero-PII Benevolence Protocol • Discreet St. Venantius Student Pantry Voucher pre-staged • Audit ZKP-77D209EF',
        verifiedScriptureId: 'philippians-4-19',
        draftReplyNativeLanguage:
          'Querida hermana, en la familia de San Venanzio nadie tiene por qué sentir vergüenza al necesitar apoyo. Nuestra Caritas Parroquial Universitaria tiene preparada una cesta de alimentos y un bono confidencial para ti hoy mismo. Sor Chiara te recibirá en privado a las 16:00 junto a la sacristía. «Mi Dios suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús» (Filipenses 4:19).',
        draftReplyBackTranslation:
          'Dear sister, in the family of San Venanzio no one should ever feel ashamed to ask for support. Our University Parish Caritas has prepared a grocery basket and confidential voucher for you today. Sr. Chiara will welcome you privately at 16:00 by the sacristy. “My God will supply every need of yours according to his riches in glory in Christ Jesus” (Philippians 4:19).',
        assignedLeaderName: 'Sr. Chiara Benedetti & Parish Caritas Student Fund',
        matchedGroupId: 'grp-sv-3',
        approvalStatus: 'Approved & Sent',
        theologicalGuardrailPassed: true,
      },
      {
        id: 'care-sv-4',
        submittedAt: '2 hours ago (Parish WhatsApp Bridge)',
        sourceChannel: 'WhatsApp Bridge',
        originalLanguage: 'it',
        languageLabel: 'Italian / Italiano (Local Camerino Parishioner)',
        rawInputWithPII:
          'Sono Giuseppina Santini (Via Le Mosse 22, tel +39 338 412 0091). Mio marito è stato dimesso ieri dall’ospedale di Camerino dopo un intervento; non riusciamo a venire alla Messa in Basilica questa domenica e vorremmo tanto ricevere la Comunione e una benedizione a casa.',
        redactedInputZeroPII:
          'Sono [PERSON_REDACTED_1] ([ADDRESS_REDACTED_1], tel [PHONE_REDACTED_1]). Mio marito è stato dimesso ieri dall’ospedale di Camerino dopo un intervento; non riusciamo a venire alla Messa in Basilica questa domenica e vorremmo tanto ricevere la Comunione e una benedizione a casa.',
        detectedPIITokens: [
          { type: 'NAME', token: '[PERSON_REDACTED]', redactedCount: 1 },
          { type: 'ADDRESS', token: '[ADDRESS_REDACTED]', redactedCount: 1 },
          { type: 'PHONE', token: '[PHONE_REDACTED]', redactedCount: 1 },
        ],
        category: 'Grief & Pastoral Visit',
        urgency: 'Immediate (Within 4h)',
        translatedSummaryForLeader:
          'Elderly local parishioner’s husband was discharged from Camerino Hospital yesterday after surgery; unable to attend Sunday Mass at the Basilica and requesting a home Eucharistic visit and blessing today.',
        pastoralContextNote:
          'Zero-PII Home Visit Routing • Paired with Extraordinary Minister + UNICAM Medical Student Companion • Audit ZKP-19A044B8',
        verifiedScriptureId: 'psalm-34-18',
        draftReplyNativeLanguage:
          'Cara sorella, tutta la comunità della Basilica di San Venanzio vi abbraccia nella preghiera per la convalescenza di tuo marito! Oggi pomeriggio alle 15:30 Don Tommaso (insieme a un giovane volontario universitario della pastorale della salute) passerà a portarvi l’Eucaristia e la benedizione del Signore. «Il Signore è vicino a chi ha il cuore spezzato» (Salmo 34,19).',
        draftReplyBackTranslation:
          'Dear sister, the entire Basilica di San Venanzio community embraces you in prayer for your husband’s recovery! This afternoon at 15:30 Don Tommaso (along with a young university health-ministry volunteer) will visit to bring the Eucharist and the Lord’s blessing. “The Lord is close to the brokenhearted” (Psalm 34:18).',
        assignedLeaderName: 'Don Tommaso Ferrante & Pastoral Health Ministry',
        matchedGroupId: 'grp-sv-4',
        approvalStatus: 'Pending Human Approval',
        theologicalGuardrailPassed: true,
      },
    ],
    smallGroups: [
      {
        id: 'grp-sv-1',
        name: 'UNICAM International Catholic Fellowship & Thursday Dinner',
        leaderName: 'Sr. Chiara Benedetti & Chidi (PhD Computer Science)',
        leaderRole: 'UNICAM International Chaplaincy',
        languages: ['en', 'it', 'fr', 'sw'],
        languageLabels: ['English', 'Italiano', 'Français', 'Kiswahili'],
        schedule: 'Thursdays • 19:30 CET (Warm Dinner + Gospel Sharing)',
        location: 'Oratorio San Venanzio (2 min walk from Piazza San Venanzio)',
        audienceTag: 'International Students & Researchers (40+ Nations)',
        currentMembers: 28,
        maxCapacity: 40,
        description:
          'A home away from home for UNICAM Master’s, PhD, and Bachelor’s students. We share a free home-cooked Italian & international dinner, unpack Sunday’s homily in English & Italian, and pray for one another during exams.',
        tags: ['International Students', 'English/Italian', 'Free Dinner', 'Exam Support', 'UNICAM'],
        matchScore: 98,
        matchReasons: [
          'Exact Language Match (English + Italian Bridge)',
          'Tailored for Newly Arrived UNICAM STEM & International Students',
          'Includes Peer Academic Mentor Pairing & Thursday Dinner',
        ],
      },
      {
        id: 'grp-sv-2',
        name: 'Faith, Science & Sacred Art Seeker Table ("Porta Fidei")',
        leaderName: 'Don Tommaso Ferrante & Prof. Matteo Valli (Biosciences)',
        leaderRole: 'Rector & UNICAM Faculty Lay Host',
        languages: ['en', 'it', 'zh', 'ko', 'vi'],
        languageLabels: ['English', 'Italiano', '中文', '한국어', 'Tiếng Việt'],
        schedule: 'Wednesdays • 17:30 CET (Espresso, Tea & Open Q&A)',
        location: 'Sala Poletti (Beside Basilica di San Venanzio Cloister)',
        audienceTag: 'Visiting Scholars, Seekers & Science/Architecture Students',
        currentMembers: 14,
        maxCapacity: 22,
        description:
          'An open, zero-pressure conversation table exploring big questions of faith, suffering, science, and the 1,700-year history and post-earthquake rebirth of Basilica di San Venanzio. All backgrounds warmly welcomed.',
        tags: ['Seekers Welcome', 'Faith & Science', 'Multilingual Summaries', 'No Pressure'],
        matchScore: 95,
        matchReasons: [
          'Designed for Non-Christian Seekers & Visiting Researchers',
          'Multilingual Mandarin/English/Italian Discussion Handouts',
          'Co-hosted by UNICAM Biosciences Professor',
        ],
      },
      {
        id: 'grp-sv-3',
        name: 'Comunidad Erasmus & Latinoamericana San Venanzio',
        leaderName: 'Valentina Morales (Pharmacy) & Fra Lorenzo',
        leaderRole: 'Hispanic & Erasmus Student Ministry',
        languages: ['es', 'pt', 'it'],
        languageLabels: ['Español', 'Português', 'Italiano'],
        schedule: 'Tuesdays • 20:30 CET',
        location: 'Centro Pastorale Universitario (Via del Bastione, Camerino)',
        audienceTag: 'Erasmus, Spanish & Portuguese-Speaking Students',
        currentMembers: 19,
        maxCapacity: 25,
        description:
          'Praise, Lectio Divina on the Sunday Gospel in Spanish/Portuguese/Italian, and practical mutual support for Erasmus and Latin American students living in Camerino.',
        tags: ['Erasmus', 'Español/Português', 'Lectio Divina', 'Practical Support'],
        matchScore: 93,
        matchReasons: [
          'Native Spanish & Portuguese Fellowship',
          'Direct Connection to Student Pantry & Housing Support',
          'Welcoming Erasmus Community',
        ],
      },
      {
        id: 'grp-sv-4',
        name: 'Ponti tra Generazioni (Camerino Families & Student Adopt-a-Grandparent)',
        leaderName: 'Famiglia Mariani & Polish/Ukrainian Student Volunteers',
        leaderRole: 'Parish Family & Caritas Ministry',
        languages: ['it', 'pl', 'uk', 'en'],
        languageLabels: ['Italiano', 'Polski', 'Українська', 'English'],
        schedule: 'Sundays • 12:30 CET (Sunday Lunch & Afternoon Visits)',
        location: 'Camerino Parish Homes & Basilica Hall',
        audienceTag: 'Local Families, Seniors & Students Missing Family',
        currentMembers: 24,
        maxCapacity: 35,
        description:
          'Pairs local Camerino families and elderly parishioners with international UNICAM students for traditional Sunday Marche lunches, language practice, and home visits.',
        tags: ['Sunday Family Lunch', 'Learn Italian', 'Intergenerational Care', 'Pastoral Visits'],
        matchScore: 91,
        matchReasons: [
          'Connects Students with Local Italian Families for Sunday Lunch',
          'Gentle Environment to Practice Spoken Italian',
          'Supports Elderly Parishioners Rebuilding After 2016 Earthquake',
        ],
      },
    ],
    volunteerGaps: [
      {
        id: 'gap-sv-1',
        serviceName: 'Sunday 11:00 AM Solemn & University Mass',
        roleTitle: 'Bilingual Pew Welcome & QR Onboarding Host (English / Italian / French)',
        timeSlot: 'This Sunday • 10:35 AM – 12:15 PM',
        reasonForGap: '2 regular student greeters away for UNICAM Chemistry field symposium',
        requiredLanguages: ['English', 'Italiano', 'Français'],
        status: 'Open Gap',
        suggestedCandidates: [
          {
            id: 'cand-1',
            name: 'Amara Diallo (UNICAM Pharmacy • 2nd Year)',
            roleHistory: 'Served 6x on Welcome Team • 4.9/5 hospitality rating',
            languages: ['Français', 'English', 'Italiano'],
            lastServed: '3 weeks ago (Well-rested)',
            burnoutRisk: 'Low',
            matchScore: 98,
            availabilityNote: 'Marked available on Sunday mornings; exams finished Friday',
          },
          {
            id: 'cand-2',
            name: 'Lorenzo Vitali (Camerino Young Adults)',
            roleHistory: 'Liturgical Usher & Crypt Guide',
            languages: ['Italiano', 'English'],
            lastServed: '2 weeks ago',
            burnoutRisk: 'Low',
            matchScore: 92,
            availabilityNote: 'Available; lives 4 minutes from Piazza San Venanzio',
          },
          {
            id: 'cand-3',
            name: 'Grace Mwangi (UNICAM Biosciences)',
            roleHistory: 'International Choir & Greeter',
            languages: ['English', 'Kiswahili', 'Italiano'],
            lastServed: '1 week ago (Choir)',
            burnoutRisk: 'Moderate',
            matchScore: 85,
            availabilityNote: 'Available, though served in Choir last Sunday',
          },
        ],
      },
      {
        id: 'gap-sv-2',
        serviceName: 'Sunday 18:30 Evening University Student Mass',
        roleTitle: 'Second Reading Lector & Prayer of the Faithful (English / Spanish / Italian)',
        timeSlot: 'This Sunday • 18:10 – 19:30',
        reasonForGap: 'Scheduled lector recovering from seasonal flu',
        requiredLanguages: ['Italiano', 'Español', 'English'],
        status: 'Open Gap',
        suggestedCandidates: [
          {
            id: 'cand-4',
            name: 'Mateo Rojas (UNICAM Architecture)',
            roleHistory: 'Trained Lector • Proclaimed Readings at Academic Year Opening Mass',
            languages: ['Español', 'Italiano', 'English'],
            lastServed: '4 weeks ago (Well-rested)',
            burnoutRisk: 'Low',
            matchScore: 97,
            availabilityNote: 'Confirmed in Camerino this weekend; zero exam conflicts',
          },
          {
            id: 'cand-5',
            name: 'Chiara Benedetti (UNICAM Law)',
            roleHistory: 'Sunday Lector & Youth Catechist',
            languages: ['Italiano', 'English'],
            lastServed: '2 weeks ago',
            burnoutRisk: 'Low',
            matchScore: 91,
            availabilityNote: 'Available for 18:30 Mass',
          },
        ],
      },
    ],
    impactStory: {
      monthLabel: 'Sample month · Basilica di San Venanzio',
      headline: 'Sample draft: students welcomed in their own languages this month',
      narrativeDraft:
        'Sample text for the parish newsletter. Replace the figures with your own before approving. This month, students and families who are new to Camerino followed Sunday Mass on their phones in their own languages, asked for prayer, and were invited to the Thursday international dinner. Every reply was approved by a priest, and personal details stayed on the phones they were written on.',
      privacyGuaranteeNote: 'Sample figures. Koinonia does not count these yet; a leader enters and checks them.',
      metrics: [
        { id: 'm-1', label: 'Pew page visits (sample figure)', value: '-', changeLabel: 'Enter from your own records', leaderVerified: false },
        { id: 'm-2', label: 'Newcomers who joined a group (sample figure)', value: '-', changeLabel: 'Enter from your own records', leaderVerified: false },
        { id: 'm-3', label: 'Care requests answered (sample figure)', value: '-', changeLabel: 'Enter from your own records', leaderVerified: false },
      ],
    },
  },

  'grace-fellowship-us': {
    id: 'grace-fellowship-us',
    shortLabel: '🇺🇸 Grace Fellowship Community Church (North America Profile)',
    badgeText: 'GLOBAL CHURCH PROFILE • AUSTIN, TX (MULTI-ETHNIC COMMUNITY CHURCH)',
    churchName: 'Grace Fellowship Community Church',
    cityCountry: 'Austin, Texas, USA',
    campusOrNeighborhood: 'University Corridor & Multi-Ethnic Neighborhood Parish',
    leaderTitle: 'Lead Teaching & Care Pastors',
    leaderName: 'Pastor David Miller',
    coLeaderName: 'Sarah Jenkins (Connections & Care Director)',
    sermonTerm: 'Sermon',
    serviceTerm: 'Sunday Worship Gathering',
    heritageBannerTitle:
      'One Church, Many Nations: Bridging the Sunday-to-Weekday Gap',
    heritageBannerStory:
      'Designed to show how Koinonia scales immediately from our historic pilot at Basilica di San Venanzio & UNICAM in Italy to any North American or global church. Whether welcoming Spanish, Mandarin, Korean, Ukrainian, or Swahili-speaking neighbors-or caring for overwhelmed college students and young families-Koinonia turns passive Sunday rows into active weekday circles.',
    currentSeriesTitle: 'Unshakable Hope in Anxious Times',
    currentMessageTitle: makeMultilingual({
      en: 'Anchors in the Storm: Why You Were Never Meant to Walk Alone',
      it: 'Ancore nella Tempesta: Perché Non Sei Nato per Camminare da Solo',
      es: 'Anclas en la Tormenta: Por Qué Nunca Fuiste Creado para Caminar Solo',
      fr: 'Des Ancres dans la Tempête : Pourquoi Vous n’Êtes Pas Fait pour Marcher Seul',
      zh: '暴风雨中的锚：为何你从未被造独自前行',
      ko: '폭풍 속의 닻: 우리가 결코 홀로 걷도록 지음받지 않은 이유',
    }),
    currentMessageSummary: makeMultilingual({
      en: 'Pastor David unpacks Luke 21 and Romans 5 to show that modern anxiety thrives in isolation. When life shakes-through job loss, family transitions, or starting over in a new city-God anchors us through His Word and through honest, everyday Christian community.',
      it: 'Il pastore David esplora Luca 21 e Romani 5 mostrando che l’ansia moderna cresce nell’isolamento. Quando la vita trema, Dio ci ancora attraverso la Sua Parola e una comunità autentica.',
      es: 'El Pastor David explica Lucas 21 y Romanos 5 para mostrar que la ansiedad moderna crece en el aislamiento. Cuando la vida tiembla, Dios nos ancla a través de Su Palabra y de una comunidad cristiana real.',
      zh: 'David牧师透过路加福音21章与罗马书5章指出，现代人的焦虑往往在孤立中滋生。当生活遭遇动荡时，神借着祂的话语和真实的团契群体成为我们生命的锚。',
    }),
    keyTakeaways: {
      en: [
        'Biblical hope is not wishful thinking; it is confident endurance anchored in the finished work of Jesus.',
        'You can sit in a crowded sanctuary of 500 people and still starve for fellowship-healing starts when you step into a small circle.',
        'Take the 7-Day Scripture Habit challenge this week and scan the Pew QR card to join a neighborhood LifeGroup.',
      ],
      it: [
        'La speranza biblica non è ottimismo vago, ma perseveranza fondata in Cristo.',
        'La guarigione inizia quando passi dalla fila della domenica a un piccolo gruppo durante la settimana.',
        'Inizia il percorso biblico di 7 giorni e unisciti a un gruppo.',
      ],
      es: [
        'La esperanza bíblica no es simple optimismo; es perseverancia anclada en Jesús.',
        'Puedes estar en un auditorio lleno y sentirte solo: la sanidad comienza en un grupo pequeño.',
        'Comienza el hábito bíblico de 7 días esta semana.',
      ],
      fr: [
        'L’espérance biblique est une persévérance ancrée en Jésus-Christ.',
        'La guérison commence lorsque vous rejoignez un petit groupe.',
        'Relevez le défi biblique de 7 jours cette semaine.',
      ],
      zh: [
        '圣经中的盼望不是空想，而是扎根于耶稣基督的坚忍。',
        '医治与成长始于从主日的座位走进周间的小组。',
        '本周开启7天读经习惯并加入一个适合你的团契小组。',
      ],
      ar: [
        'الرجاء الكتابي هو ثبات راسخ في المسيح.',
        'الشفاء يبدأ عندما تنتقل من مقاعد الأحد إلى مجموعة صغيرة.',
        'ابدأ رحلة الكتاب المقدس لمدة ٧ أيام.',
      ],
      sw: [
        'Tumaini la Biblia ni uvumilivu uliokita mizizi ndani ya Yesu.',
        'Uponyaji huanza unapojiunga na kikundi kidogo.',
        'Anza safari ya siku 7 ya Maandiko wiki hii.',
      ],
      pt: [
        'A esperança bíblica é perseverança ancorada em Jesus.',
        'A cura começa quando você entra em um pequeno grupo.',
        'Comece a jornada bíblica de 7 dias.',
      ],
      pl: [
        'Biblijna nadzieja to wytrwałość zakorzeniona w Chrystusie.',
        'Wzrost zaczyna się w małej grupie.',
        'Rozpocznij 7-dniowy plan biblijny.',
      ],
      ko: [
        '성경적 소망은 예수 그리스도 안에 뿌리내린 인내입니다.',
        '진정한 회복은 주일 예배석을 넘어 소그룹 공동체로 들어갈 때 시작됩니다.',
        '이번 주 7일 말씀 습관 여정에 동참하세요.',
      ],
      vi: [
        'Niềm hy vọng Kinh Thánh được neo chặt nơi Chúa Giêsu.',
        'Sự chữa lành bắt đầu khi bạn bước vào một nhóm nhỏ.',
        'Hãy bắt đầu hành trình 7 ngày đọc Kinh Thánh.',
      ],
      uk: [
        'Біблійна надія - це витривалість, закорінена в Ісусі.',
        'Зцілення починається в малій групі.',
        'Розпочніть 7-денну подорож Писанням.',
      ],
    },
    primaryScripture: scriptureFor('luke-21-19', 'grace-fellowship-us')!,
    liturgicalSteps: [
      {
        id: 'gf-1',
        order: 1,
        timestampLabel: '10:00 AM • Welcome & Worship in Song',
        title: makeMultilingual({
          en: 'Call to Worship & Congregational Singing',
          it: 'Chiamata all’Adorazione e Canto Comunitario',
          es: 'Llamado a la Adoración y Alabanza',
        }),
        whatHappens: makeMultilingual({
          en: 'Our worship team leads 3 songs of praise based on Psalm 34. Lyrics are projected above and translated live here in your native language.',
          it: 'Il team di lode guida 3 canti basati sul Salmo 34, con testi tradotti qui nella tua lingua.',
          es: 'Nuestro equipo dirige 3 cantos de alabanza basados en el Salmo 34, traducidos aquí en tu idioma.',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'Singing together shifts our eyes from the size of our storm to the faithfulness of God.',
          it: 'Cantare insieme sposta lo sguardo dalla tempesta alla fedeltà di Dio.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Stand or sit as comfortable • Family room & kids check-in open in the lobby',
          it: 'In piedi o seduti liberamente',
        }),
      },
      {
        id: 'gf-2',
        order: 2,
        timestampLabel: '10:25 AM • Community Prayer & Scripture Reading',
        title: makeMultilingual({
          en: 'Pastoral Prayer & Verified Scripture Proclamation',
          it: 'Preghiera Pastorale e Lettura Biblica',
          es: 'Oración Pastoral y Lectura Bíblica',
        }),
        whatHappens: makeMultilingual({
          en: 'Elders pray over anonymous Zero-PII prayer requests submitted from the pews and read Luke 21:18–19.',
          it: 'Gli anziani pregano per le richieste inviate dai banchi e leggono Luca 21.',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'We bear one another’s burdens in prayer before opening God’s Word.',
          it: 'Portiamo i pesi gli uni degli altri nella preghiera.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Use the Care Tab below to add your prayer request in any language',
          it: 'Usa la scheda Cura Pastorale qui sotto per inviare una richiesta di preghiera',
        }),
      },
      {
        id: 'gf-3',
        order: 3,
        timestampLabel: '10:35 AM • Expository Sermon & Communion',
        title: makeMultilingual({
          en: 'Biblical Message & The Lord’s Supper',
          it: 'Messaggio Biblico e Cena del Signore',
          es: 'Mensaje Bíblico y Santa Cena',
        }),
        whatHappens: makeMultilingual({
          en: 'Pastor David teaches for 30 minutes with live multilingual notes in your Koinonia Companion, followed by Communion.',
          it: 'Il pastore David predica per 30 minuti con appunti multilingue in tempo reale.',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'God’s Word renews our minds and the Lord’s Table reminds us of Christ’s sacrifice.',
          it: 'La Parola di Dio rinnova la mente e la Mensa ricorda il sacrificio di Cristo.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Take notes & bookmark Day 1 of your 7-Day Scripture Habit Journey',
          it: 'Prendi appunti e salva il Giorno 1 del percorso biblico di 7 giorni',
        }),
      },
      {
        id: 'gf-4',
        order: 4,
        timestampLabel: '11:15 AM • Next Steps Patio & LifeGroup Matching',
        title: makeMultilingual({
          en: 'Benediction & 5-Minute Patio Meet-Up',
          it: 'Benedizione e Incontro dei Piccoli Gruppi',
          es: 'Bendición y Conexión con Grupos Pequeños',
        }),
        whatHappens: makeMultilingual({
          en: 'Meet your matched LifeGroup host at the Next Steps tent on the patio for fresh coffee.',
          it: 'Incontra il responsabile del tuo piccolo gruppo nel patio per un caffè.',
        }),
        spiritualMeaning: makeMultilingual({
          en: 'Don’t leave unknown-find your weekday circle today.',
          it: 'Non uscire da sconosciuto: trova il tuo gruppo oggi.',
        }),
        postureOrResponse: makeMultilingual({
          en: 'Open Groups to see the ones that meet in your language first',
          it: 'Apri Gruppi per vedere per primi quelli nella tua lingua',
        }),
      },
    ],
    sevenDayJourney: [
      {
        day: 1,
        dayLabel: 'Monday • Endurance Over Hustle',
        title: makeMultilingual({
          en: 'Trading Panic for God’s Presence',
          it: 'Scambiare il Panico con la Presenza di Dio',
          es: 'Cambiar el Pánico por la Presencia de Dios',
        }),
        scriptureRef: 'Luke 21:19',
        scriptureText: passageTexts('luke-21-19', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'Where are you trying to white-knuckle your week alone instead of leaning on Christ’s endurance?',
          it: 'Dove stai cercando di affrontare la settimana da solo invece di appoggiarti alla costanza di Cristo?',
        }),
        actionStep: makeMultilingual({
          en: 'Start Monday with 2 minutes of Scripture reading before checking email or slack.',
          it: 'Inizia il lunedì con 2 minuti di Scrittura prima di controllare le email.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For newcomers and international families settling into our neighborhood.',
          it: 'Per i nuovi arrivati e le famiglie internazionali del quartiere.',
        }),
        leaderApproved: true,
        approvedBy: 'Pastor David Miller (Elder Verified)',
      },
      {
        day: 2,
        dayLabel: 'Tuesday • Fear Not',
        title: makeMultilingual({
          en: 'Held by the Right Hand of God',
          it: 'Sostenuti dalla Mano di Dio',
          es: 'Sostenidos por la Mano de Dios',
        }),
        scriptureRef: 'Isaiah 41:10',
        scriptureText: passageTexts('isaiah-41-10', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'Notice the four personal promises in Isaiah 41:10: “I am with you, I am your God, I will strengthen you, I will help you.” Which one do you need most today?',
          it: 'Quale delle quattro promesse di Isaia 41,10 parla di più al tuo cuore oggi?',
        }),
        actionStep: makeMultilingual({
          en: 'Text one verse of encouragement to someone in your LifeGroup or campus circle.',
          it: 'Invia un versetto di incoraggiamento a un amico.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For college students and young professionals facing career uncertainty.',
          it: 'Per gli studenti universitari e i giovani lavoratori.',
        }),
        leaderApproved: true,
        approvedBy: 'Pastor David Miller',
      },
      {
        day: 3,
        dayLabel: 'Wednesday • Close to the Brokenhearted',
        title: makeMultilingual({
          en: 'Honest Lament in a Safe Community',
          it: 'Preghiera Sincera in una Comunità Sicura',
        }),
        scriptureRef: 'Psalm 34:18',
        scriptureText: passageTexts('psalm-34-18', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'God never asks us to fake a smile at church. What heavy burden can you bring honestly to Him today?',
          it: 'Dio non ci chiede di fingere un sorriso in chiesa. Quale peso puoi affidarGli oggi?',
        }),
        actionStep: makeMultilingual({
          en: 'Write an honest 3-sentence prayer in your private journal below.',
          it: 'Scrivi una preghiera sincera di 3 frasi nel tuo diario privato.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For those walking through grief, hospitalization, or depression.',
          it: 'Per chi attraversa il lutto o la malattia.',
        }),
        leaderApproved: true,
        approvedBy: 'Sarah Jenkins (Care Director)',
      },
      {
        day: 4,
        dayLabel: 'Thursday • From Rows to Circles',
        title: makeMultilingual({
          en: 'Stepping Into Your LifeGroup',
          it: 'Entrare nel Tuo Piccolo Gruppo',
        }),
        scriptureRef: 'Matthew 11:28',
        scriptureText: passageTexts('matthew-11-28', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'How does sharing a meal and opening Scripture with others lighten the load you carry?',
          it: 'Come condividere un pasto e la Scrittura alleggerisce il tuo carico?',
        }),
        actionStep: makeMultilingual({
          en: 'Attend your matched weekday small group tonight!',
          it: 'Partecipa al tuo piccolo gruppo stasera!',
        }),
        prayerFocus: makeMultilingual({
          en: 'For our volunteer small-group hosts opening their homes.',
          it: 'Per i responsabili dei piccoli gruppi che aprono le loro case.',
        }),
        leaderApproved: true,
        approvedBy: 'Pastor David Miller',
      },
      {
        day: 5,
        dayLabel: 'Friday • Generosity & Provision',
        title: makeMultilingual({
          en: 'Channels of God’s Provision',
          it: 'Canali della Provvidenza di Dio',
        }),
        scriptureRef: 'Philippians 4:19',
        scriptureText: passageTexts('philippians-4-19', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'How has God used the church family to meet a need in your life in the past?',
          it: 'Come Dio ha usato la comunità per rispondere a un tuo bisogno?',
        }),
        actionStep: makeMultilingual({
          en: 'Review this month’s Giving & Ministry Impact Story in Koinonia.',
          it: 'Leggi il report di impatto mensile della comunità.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For single parents and families supported by our Benevolence Team.',
          it: 'Per le famiglie sostenute dal fondo di solidarietà.',
        }),
        leaderApproved: true,
        approvedBy: 'Pastor David Miller',
      },
      {
        day: 6,
        dayLabel: 'Saturday • Unhurried Soul',
        title: makeMultilingual({
          en: 'Practicing the Easy Yoke of Jesus',
          it: 'Il Giogo Dolce di Gesù',
        }),
        scriptureRef: 'Matthew 11:28',
        scriptureText: passageTexts('matthew-11-28', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'What noise can you turn off for one hour today to simply rest with God?',
          it: 'Quale rumore puoi spegnere per un’ora oggi per riposare in Dio?',
        }),
        actionStep: makeMultilingual({
          en: 'Spend 30 minutes outdoors in gratitude and prayer.',
          it: 'Trascorri 30 minuti all’aperto nella gratitudine.',
        }),
        prayerFocus: makeMultilingual({
          en: 'For Sunday volunteers, worship leaders, and children’s workers.',
          it: 'Per i volontari del servizio domenicale.',
        }),
        leaderApproved: true,
        approvedBy: 'Pastor David Miller',
      },
      {
        day: 7,
        dayLabel: 'Sunday • Gathered Again',
        title: makeMultilingual({
          en: 'Looking for the Person Sitting Alone',
          it: 'Accogliere Chi Siede da Solo',
        }),
        scriptureRef: 'Luke 21:19',
        scriptureText: passageTexts('luke-21-19', 'grace-fellowship-us'),
        reflectionPrompt: makeMultilingual({
          en: 'As you gather today, ask God to show you one newcomer in your row whom you can welcome warmly.',
          it: 'Chiedi a Dio di mostrarti un nuovo arrivato nella tua fila da salutare con calore.',
        }),
        actionStep: makeMultilingual({
          en: 'Introduce yourself to someone new before the service starts.',
          it: 'Presentati a una persona nuova prima dell’inizio del culto.',
        }),
        prayerFocus: makeMultilingual({
          en: 'That every visitor today encounters the love of Jesus.',
          it: 'Che ogni visitatore incontri l’amore di Gesù.',
        }),
        leaderApproved: true,
        approvedBy: 'Pastor David Miller',
      },
    ],
    careQueue: [
      {
        id: 'care-gf-1',
        submittedAt: '22 mins ago (Sunday 10:00 AM Worship Pew QR)',
        sourceChannel: 'Pew QR Scan',
        originalLanguage: 'es',
        languageLabel: 'Spanish / Español (New Family in Austin)',
        rawInputWithPII:
          'Me llamo Carlos Mendoza (tel 512-555-0194, email cmendoza84@gmail.com). Nuestra familia acaba de mudarse a Austin desde Colombia hace dos semanas. Hoy es nuestro primer domingo aquí; mi esposa está pasando por ansiedad y buscamos una comunidad bilingüe donde nuestros hijos también puedan crecer en la fe.',
        redactedInputZeroPII:
          'Me llamo [PERSON_REDACTED_1] (tel [PHONE_REDACTED_1], email [EMAIL_REDACTED_1]). Nuestra familia acaba de mudarse a Austin desde Colombia hace dos semanas. Hoy es nuestro primer domingo aquí; mi esposa está pasando por ansiedad y buscamos una comunidad bilingüe donde nuestros hijos también puedan crecer en la fe.',
        detectedPIITokens: [
          { type: 'NAME', token: '[PERSON_REDACTED]', redactedCount: 1 },
          { type: 'PHONE', token: '[PHONE_REDACTED]', redactedCount: 1 },
          { type: 'EMAIL', token: '[EMAIL_REDACTED]', redactedCount: 1 },
        ],
        category: 'Homesickness & Student Transition',
        urgency: 'High (Within 24h)',
        translatedSummaryForLeader:
          'EN Summary for Pastor David / Sarah: Family recently relocated from Colombia two weeks ago attending for the first time today. Wife experiencing transition anxiety; looking for a bilingual Spanish/English LifeGroup with families and kids.',
        pastoralContextNote:
          'Zero-PII Shield stripped 3 personal identifiers locally • Matched to Bilingual Family LifeGroup • Audit ZKP-55A82C11',
        verifiedScriptureId: 'isaiah-41-10',
        draftReplyNativeLanguage:
          '¡Bienvenidos a casa en Grace Fellowship! Estamos orando hoy mismo por la paz de tu esposa y por toda tu familia en esta nueva etapa en Austin. Nos encantaría presentarles a Mateo y Elena, líderes de nuestro grupo familiar bilingüe (Español/Inglés) que se reúne los miércoles con cena para niños. «No temas, porque yo estoy contigo» (Isaías 41:10).',
        draftReplyBackTranslation:
          'Welcome home to Grace Fellowship! We are praying right now for your wife’s peace and for your whole family in this new season in Austin. We would love to introduce you to Mateo and Elena, leaders of our bilingual (Spanish/English) Family LifeGroup that meets Wednesdays with kids’ dinner. “Fear not, for I am with you” (Isaiah 41:10).',
        assignedLeaderName: 'Sarah Jenkins & Mateo/Elena (Bilingual Family LifeGroup)',
        matchedGroupId: 'grp-gf-1',
        approvalStatus: 'Pending Human Approval',
        theologicalGuardrailPassed: true,
      },
      {
        id: 'care-gf-2',
        submittedAt: '49 mins ago (Pew QR Care Card)',
        sourceChannel: 'Pew QR Scan',
        originalLanguage: 'ko',
        languageLabel: 'Korean / 한국어 (International Graduate Student)',
        rawInputWithPII:
          '안녕하세요, 저는 박지훈입니다 (phone 512-555-0832, email jpark@utexas.edu). 유학 생활 중 지도교수님과의 연구 문제와 장학금 연장 문제로 밤마다 잠을 이루지 못하고 두려움에 시달리고 있습니다. 중보기도와 영어/한국어 청년 모임을 찾고 있습니다.',
        redactedInputZeroPII:
          '안녕하세요, 저는 [PERSON_REDACTED_1]입니다 (phone [PHONE_REDACTED_1], email [EMAIL_REDACTED_1]). 유학 생활 중 지도교수님과의 연구 문제와 장학금 연장 문제로 밤마다 잠을 이루지 못하고 두려움에 시달리고 있습니다. 중보기도와 영어/한국어 청년 모임을 찾고 있습니다.',
        detectedPIITokens: [
          { type: 'NAME', token: '[PERSON_REDACTED]', redactedCount: 1 },
          { type: 'PHONE', token: '[PHONE_REDACTED]', redactedCount: 1 },
          { type: 'EMAIL', token: '[EMAIL_REDACTED]', redactedCount: 1 },
        ],
        category: 'Prayer & Exam Anxiety',
        urgency: 'High (Within 24h)',
        translatedSummaryForLeader:
          'EN Summary: International graduate student struggling with insomnia and anxiety over research advisor pressure and funding renewal. Requesting intercessory prayer and connection to the International Grad & Young Adults LifeGroup.',
        pastoralContextNote:
          'Zero-PII Shield stripped contact PII locally • Audit ZKP-82E10F93',
        verifiedScriptureId: 'matthew-11-28',
        draftReplyNativeLanguage:
          '형제님, 오늘 용기 내어 기도 제목을 나누어 주셔서 진심으로 감사합니다. 타향에서 학업과 재정 문제로 겪는 밤의 무거운 짐을 주님께서 아십니다. 우리 목양팀이 함께 기도하고 있으며, 목요일 저녁 국제 대학원생 소그룹(영어/한국어 멘토 함께함)으로 따뜻하게 초대합니다. "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라" (마태복음 11:28).',
        draftReplyBackTranslation:
          'Brother, thank you for courageously sharing your prayer request today. The Lord sees the heavy nighttime burdens of academic and funding stress far from home. Our pastoral team is praying for you, and we warmly invite you to Thursday night’s International Graduate LifeGroup (with English/Korean mentors). “Come to me, all who labor and are heavy laden, and I will give you rest” (Matthew 11:28).',
        assignedLeaderName: 'Pastor David & Daniel Kim (Grad Ministry Host)',
        matchedGroupId: 'grp-gf-2',
        approvalStatus: 'Pending Human Approval',
        theologicalGuardrailPassed: true,
      },
    ],
    smallGroups: [
      {
        id: 'grp-gf-1',
        name: 'Casa Abierta - Bilingual Spanish/English Family LifeGroup',
        leaderName: 'Mateo & Elena Alvarez',
        leaderRole: 'Bilingual Family Ministry Hosts',
        languages: ['es', 'en', 'pt'],
        languageLabels: ['Español', 'English', 'Português'],
        schedule: 'Wednesdays • 6:30 PM CT (Childcare & Family Dinner Included)',
        location: 'North Campus Fellowship Home (Austin, TX)',
        audienceTag: 'Families, Newcomers & Spanish/English Households',
        currentMembers: 18,
        maxCapacity: 26,
        description:
          'Warm family dinner, bilingual sermon discussion, and prayer support for families new to the city.',
        tags: ['Bilingual ES/EN', 'Childcare Provided', 'Newcomer Families'],
        matchScore: 97,
        matchReasons: [
          'Native Spanish + English Bilingual Format',
          'Dedicated Kids Ministry & Family Dinner',
          'Strong Track Record Welcoming Relocated Families',
        ],
      },
      {
        id: 'grp-gf-2',
        name: 'Global Grad & International Scholars Table',
        leaderName: 'Daniel & Hannah Kim',
        leaderRole: 'University & International Ministry',
        languages: ['en', 'ko', 'zh', 'vi'],
        languageLabels: ['English', '한국어', '中文', 'Tiếng Việt'],
        schedule: 'Thursdays • 7:00 PM CT',
        location: 'University Corridor Coffee House',
        audienceTag: 'International Grad Students & Visiting Scholars',
        currentMembers: 16,
        maxCapacity: 24,
        description:
          'Dinner, Scripture habit check-in, and academic/life mentorship for international graduate students.',
        tags: ['Grad Students', 'Multilingual Support', 'Free Dinner'],
        matchScore: 95,
        matchReasons: [
          'Bilingual Korean/Mandarin/English Hosts',
          'Focused on Academic Stress & International Transition',
        ],
      },
    ],
    volunteerGaps: [
      {
        id: 'gap-gf-1',
        serviceName: 'Sunday 10:00 AM Worship Gathering',
        roleTitle: 'Bilingual Next-Steps Patio Host (Spanish / English)',
        timeSlot: 'This Sunday • 9:30 AM – 11:30 AM',
        reasonForGap: '1 scheduled host traveling for Thanksgiving week',
        requiredLanguages: ['Español', 'English'],
        status: 'Open Gap',
        suggestedCandidates: [
          {
            id: 'cand-gf-1',
            name: 'Sofia Ramirez',
            roleHistory: 'Connections Team • Served 8x this year',
            languages: ['Español', 'English'],
            lastServed: '3 weeks ago (Well-rested)',
            burnoutRisk: 'Low',
            matchScore: 97,
            availabilityNote: 'Planning Center status: Available',
          },
          {
            id: 'cand-gf-2',
            name: 'Marcus Vance',
            roleHistory: 'First Impressions Lead',
            languages: ['English', 'Español (Conversational)'],
            lastServed: '2 weeks ago',
            burnoutRisk: 'Low',
            matchScore: 89,
            availabilityNote: 'Available for 10:00 AM service',
          },
        ],
      },
    ],
    impactStory: {
      monthLabel: 'Sample month · Grace Fellowship',
      headline: 'Sample draft: newcomers connected to LifeGroups this month',
      narrativeDraft:
        'Sample text for the church newsletter. Replace the figures with your own before approving. This month, newcomers and international students followed Sunday teaching on their phones in their own languages and were invited into weekday LifeGroups. Every reply was approved by a pastor, and personal details stayed on the phones they were written on.',
      privacyGuaranteeNote: 'Sample figures. Koinonia does not count these yet; a leader enters and checks them.',
      metrics: [
        { id: 'gf-m1', label: 'Newcomers who joined a LifeGroup (sample figure)', value: '-', changeLabel: 'Enter from your own records', leaderVerified: false },
        { id: 'gf-m2', label: 'Care requests answered (sample figure)', value: '-', changeLabel: 'Enter from your own records', leaderVerified: false },
      ],
    },
  },
};

// ---------- Translations of each church's own text ----------
// The service guide, 7-day plan and a few labels were written in English and Italian. The other
// languages come from content-i18n.json: translated once with Claude, using the church's own
// glossary (server/scripts/translate-content.ts), and saved in the app. Bible text is never
// translated by AI: a verse missing in a language is shown in English, and the page says so.

type ContentMap = Record<string, Partial<Record<SupportedLanguageCode, Record<string, string>>>>;
const CONTENT = CONTENT_I18N as ContentMap;
const SCRIPTURE_KEYS = new Set(['primaryScripture', 'scriptureText', 'texts']);

/** Plain English labels shown on the pew page as well as the multilingual records. */
const LABEL_KEYS = new Set(['dayLabel', 'serviceTerm', 'currentSeriesTitle']);

function eachRecord(node: unknown, visit: (record: Record<SupportedLanguageCode, string>, missing: SupportedLanguageCode[]) => void, key = ''): void {
  if (!node || typeof node !== 'object' || SCRIPTURE_KEYS.has(key)) return;
  const missing = FELL_BACK.get(node as object);
  if (missing) return visit(node as Record<SupportedLanguageCode, string>, missing);
  for (const [k, v] of Object.entries(node)) eachRecord(v, visit, k);
}

function eachLabel(node: unknown, visit: (text: string) => void, key = ''): void {
  if (!node || typeof node !== 'object' || SCRIPTURE_KEYS.has(key)) return;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string' && LABEL_KEYS.has(k)) visit(v);
    else eachLabel(v, visit, k);
  }
}

/**
 * In Arabic (right to left), a Latin-script run in brackets such as "(Liturgia della Parola)" would be
 * split and its brackets flipped. Unicode isolates keep it as one left-to-right unit.
 */
function forDirection(lang: SupportedLanguageCode, text: string): string {
  if (lang !== 'ar') return text;
  return text.replace(/[(«]\s*[A-Za-zÀ-ÿ][^()«»]*[)»]/g, (run) => `\u2068${run}\u2069`);
}

/** A church's own label in the reader's language, or the English when it has no translation yet. */
export function contentText(tradition: string, lang: SupportedLanguageCode, english: string): string {
  if (lang === 'en') return english;
  const translated = CONTENT[tradition]?.[lang]?.[english];
  return translated ? forDirection(lang, translated) : english;
}

/** Every English text of one church still waiting for a translation, by language (for the script). */
export function untranslatedContent(tradition: string): Partial<Record<SupportedLanguageCode, string[]>> {
  const out: Partial<Record<SupportedLanguageCode, Set<string>>> = {};
  const add = (l: SupportedLanguageCode, en: string) => (out[l] ??= new Set()).add(en);
  eachRecord(CHURCH_PROFILES[tradition], (record, missing) => missing.forEach((l) => record[l] === record.en && add(l, record.en)));
  // Labels are plain English strings, so Italian needs them too.
  eachLabel(CHURCH_PROFILES[tradition], (en) => (['it', ...CONTENT_LANGS] as SupportedLanguageCode[]).forEach((l) => !CONTENT[tradition]?.[l]?.[en] && add(l, en)));
  return Object.fromEntries(Object.entries(out).map(([l, set]) => [l, [...set]]));
}

for (const [tradition, profile] of Object.entries(CHURCH_PROFILES)) {
  eachRecord(profile, (record, missing) => {
    for (const l of missing) {
      const translated = CONTENT[tradition]?.[l]?.[record.en];
      if (translated) record[l] = forDirection(l, translated);
    }
  });
}
