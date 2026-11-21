// Crisis fast lane: deterministic, multilingual, deliberately over-sensitive.
// It runs in the browser before anything is sent, and again on the server.
// A match never gets an AI reply: it skips the queue and goes straight to a human.

import type { LangCode, TraditionId } from './languages.ts';

export type CrisisKind = 'self-harm' | 'abuse-or-violence' | 'immediate-danger';

const PATTERNS: Record<CrisisKind, string[]> = {
  'self-harm': [
    // English
    'suicid', 'kill myself', 'end my life', 'want to die', 'wanna die', 'hurt myself', 'harm myself',
    'self-harm', 'self harm', 'cutting myself', 'no reason to live', 'better off dead', 'overdose',
    // Italian
    'uccidermi', 'togliermi la vita', 'farla finita', 'voglio morire', 'farmi del male', 'autolesion',
    // Spanish
    'matarme', 'quitarme la vida', 'quiero morir', 'hacerme daño',
    // French
    'me tuer', 'mettre fin à mes jours', 'envie de mourir', 'me faire du mal',
    // Portuguese
    'me matar', 'tirar minha vida', 'quero morrer', 'me machucar',
    // Polish
    'samobój', 'zabić się', 'chcę umrzeć', 'skrzywdzić się',
    // Ukrainian
    'самогуб', 'вбити себе', 'хочу померти', 'завдати собі шкоди',
    // Swahili
    'kujiua', 'nataka kufa', 'kujidhuru',
    // Vietnamese
    'tự tử', 'tự sát', 'muốn chết', 'tự làm hại',
    // Korean
    '자살', '죽고 싶', '자해',
    // Chinese
    '自杀', '想死', '自残', '伤害自己',
    // Arabic
    'انتحار', 'أقتل نفسي', 'أريد أن أموت', 'أؤذي نفسي',
  ],
  'abuse-or-violence': [
    'abuse', 'abusing me', 'abusive', 'hits me', 'beats me', 'beat me', 'rape', 'sexual assault', 'assaulted',
    'domestic violence', 'violent at home',
    'abus', 'violenz', 'mi picchia', 'stupr', 'maltratt',
    'violencia', 'me pega', 'violación', 'maltrat',
    'violence', 'me frappe', 'viol ',
    'violência', 'me bate', 'estupro',
    'przemoc', 'bije mnie', 'gwałt',
    'насильств', 'б\'є мене', 'зґвалт',
    'unyanyasaji', 'ananipiga', 'ubakaji',
    'bạo hành', 'lạm dụng', 'đánh tôi', 'hiếp',
    '학대', '폭력', '때려', '성폭행',
    '虐待', '家暴', '打我', '强奸',
    'إساءة', 'عنف', 'يضربني', 'اغتصاب',
  ],
  'immediate-danger': [
    'in danger', 'not safe', 'unsafe', "don't feel safe", 'don’t feel safe', 'do not feel safe', 'afraid to go home', 'scared to go home',
    'threatening me', 'threatened to', 'going to hurt me',
    'in pericolo', 'non sono al sicuro', 'non mi sento al sicuro', 'paura di tornare a casa', 'minacci',
    'en peligro', 'no estoy a salvo', 'no me siento segur', 'miedo de volver a casa', 'amenaz',
    'en danger', 'menace',
    'em perigo', 'ameaç',
    'w niebezpieczeństwie',
    'в небезпеці',
    'hatarini',
    'nguy hiểm',
    '위험해',
    '危险',
    'في خطر',
  ],
};

export interface CrisisScreen {
  isCrisis: boolean;
  kinds: CrisisKind[];
  matched: string[];
}

export function screenForCrisis(text: string): CrisisScreen {
  const haystack = ` ${text.toLowerCase()} `;
  const kinds: CrisisKind[] = [];
  const matched: string[] = [];
  (Object.keys(PATTERNS) as CrisisKind[]).forEach((kind) => {
    const hits = PATTERNS[kind].filter((p) => haystack.includes(p.toLowerCase()));
    if (hits.length > 0) {
      kinds.push(kind);
      matched.push(...hits.map((h) => h.trim()));
    }
  });
  return { isCrisis: kinds.length > 0, kinds, matched };
}

export interface CrisisLine {
  label: string;
  number: string;
  note: string;
}

export function crisisLinesFor(tradition: TraditionId): CrisisLine[] {
  if (tradition === 'san-venanzio-unicam') {
    return [
      { label: 'Emergency (Italy)', number: '112', note: 'Police, ambulance, fire - free, 24/7' },
      { label: 'Anti-violence & stalking line', number: '1522', note: 'Free, 24/7, multilingual' },
    ];
  }
  return [
    { label: 'Emergency (USA)', number: '911', note: 'Police, ambulance, fire' },
    { label: '988 Suicide & Crisis Lifeline', number: '988', note: 'Call or text, 24/7' },
    { label: 'National Domestic Violence Hotline', number: '1-800-799-7233', note: '24/7, many languages' },
  ];
}

// Shown on the attendee's phone the moment a crisis is detected, in their own language.
export const CRISIS_MESSAGE: Record<LangCode, { title: string; body: string; usher: string }> = {
  en: {
    title: 'You matter. Please reach out now.',
    body: 'If you are in immediate danger, call the emergency number below. A real person on our care team has been alerted - this will not be answered by AI.',
    usher: 'Show this screen to an usher or the priest/pastor and they will stay with you.',
  },
  it: {
    title: 'Tu sei importante. Chiedi aiuto adesso.',
    body: 'Se sei in pericolo immediato, chiama il numero di emergenza qui sotto. Una persona reale del nostro team pastorale è stata avvisata: non ti risponderà un’intelligenza artificiale.',
    usher: 'Mostra questo schermo a un volontario o al sacerdote: resteranno con te.',
  },
  es: {
    title: 'Tú importas. Pide ayuda ahora.',
    body: 'Si estás en peligro inmediato, llama al número de emergencia de abajo. Una persona real de nuestro equipo pastoral ha sido avisada; no te responderá una IA.',
    usher: 'Muestra esta pantalla a un servidor o al sacerdote/pastor y se quedarán contigo.',
  },
  fr: {
    title: 'Tu comptes. Demande de l’aide maintenant.',
    body: 'Si tu es en danger immédiat, appelle le numéro d’urgence ci-dessous. Une vraie personne de notre équipe pastorale a été prévenue - ce n’est pas une IA qui te répondra.',
    usher: 'Montre cet écran à un accueillant ou au prêtre/pasteur : ils resteront avec toi.',
  },
  zh: {
    title: '你很重要。请现在就寻求帮助。',
    body: '如果你正处于紧急危险中，请立即拨打下面的紧急电话。我们关怀团队中的一位真人已经收到提醒--回复你的不会是人工智能。',
    usher: '请把这个屏幕给引座员或神父/牧师看，他们会陪着你。',
  },
  ar: {
    title: 'أنت مهم. اطلب المساعدة الآن.',
    body: 'إذا كنت في خطر مباشر، اتصل برقم الطوارئ أدناه. تم تنبيه شخص حقيقي من فريق الرعاية لدينا - لن يرد عليك الذكاء الاصطناعي.',
    usher: 'أرِ هذه الشاشة لأحد المرشدين أو للكاهن/القس، وسيبقون معك.',
  },
  sw: {
    title: 'Wewe ni wa thamani. Tafuta msaada sasa.',
    body: 'Ikiwa uko hatarini sasa hivi, piga namba ya dharura hapa chini. Mtu halisi wa timu yetu ya huduma amearifiwa - hautajibiwa na AI.',
    usher: 'Mwonyeshe mhudumu au padri/mchungaji skrini hii, naye atakaa nawe.',
  },
  pt: {
    title: 'Você importa. Peça ajuda agora.',
    body: 'Se você está em perigo imediato, ligue para o número de emergência abaixo. Uma pessoa real da nossa equipe pastoral foi avisada - você não será respondido por uma IA.',
    usher: 'Mostre esta tela a um voluntário ou ao padre/pastor e eles ficarão com você.',
  },
  pl: {
    title: 'Jesteś ważny. Poproś o pomoc teraz.',
    body: 'Jeśli grozi Ci bezpośrednie niebezpieczeństwo, zadzwoń pod numer alarmowy poniżej. Prawdziwa osoba z naszego zespołu duszpasterskiego została powiadomiona - nie odpowie Ci sztuczna inteligencja.',
    usher: 'Pokaż ten ekran posłudze porządkowej lub księdzu/pastorowi - zostaną z Tobą.',
  },
  ko: {
    title: '당신은 소중합니다. 지금 도움을 요청하세요.',
    body: '지금 위험한 상황이라면 아래 긴급 번호로 전화하세요. 돌봄팀의 실제 사람에게 알림이 갔습니다 - AI가 답하지 않습니다.',
    usher: '이 화면을 안내 봉사자나 신부님/목사님께 보여 주세요. 곁에 있어 드릴 것입니다.',
  },
  vi: {
    title: 'Bạn rất quan trọng. Hãy tìm sự giúp đỡ ngay.',
    body: 'Nếu bạn đang gặp nguy hiểm ngay lúc này, hãy gọi số khẩn cấp bên dưới. Một người thật trong nhóm mục vụ đã được báo - bạn sẽ không được trả lời bởi AI.',
    usher: 'Hãy đưa màn hình này cho người phục vụ hoặc linh mục/mục sư, họ sẽ ở bên bạn.',
  },
  uk: {
    title: 'Ви важливі. Зверніться по допомогу зараз.',
    body: 'Якщо вам загрожує безпосередня небезпека, зателефонуйте за номером екстреної допомоги нижче. Справжню людину з нашої душпастирської команди сповіщено - вам не відповідатиме ШІ.',
    usher: 'Покажіть цей екран волонтеру або священнику/пастору - вони будуть поруч із вами.',
  },
};
