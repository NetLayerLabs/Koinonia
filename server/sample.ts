// Sample mode: used only when no Claude API key is configured. Everything produced here is
// labelled "sample" in the interface so nobody mistakes it for live AI output.

import type { LangCode } from '../src/shared/languages.ts';
import type { CareCategory, CareUrgency } from '../src/shared/types.ts';

export function sampleTriage(text: string): { category: CareCategory; urgency: CareUrgency; verseId: string } {
  const t = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  if (has('rent', 'food', 'grocer', 'scholarship', 'affitto', 'spesa', 'money', 'tuition', 'comida', 'soldi')) {
    return { category: 'Benevolence & Material Need', urgency: 'High (Within 24h)', verseId: 'philippians-4-19' };
  }
  if (has('hospital', 'surgery', 'grief', 'died', 'passed away', 'sick', 'ospedale', 'malat', 'lutto', 'salud')) {
    return { category: 'Grief & Pastoral Visit', urgency: 'Immediate (Within 4h)', verseId: 'psalm-34-18' };
  }
  if (has('question', 'why does god', 'baptism', 'doubt', 'domanda', 'fede', 'confirm')) {
    return { category: 'Seeker Theological Q&A', urgency: 'Standard (Within 48h)', verseId: 'matthew-11-28' };
  }
  if (has('exam', 'anxiety', 'esam', 'ansia', 'fear', 'examen', 'stress')) {
    return { category: 'Prayer & Exam Anxiety', urgency: 'High (Within 24h)', verseId: 'isaiah-41-10' };
  }
  return { category: 'Homesickness & Student Transition', urgency: 'Standard (Within 48h)', verseId: 'psalm-34-18' };
}

export function sampleDraft(pastorLang: LangCode, groupName: string): string {
  if (pastorLang === 'it') {
    return `La pace sia con te! Grazie per aver condiviso il tuo cuore con noi oggi. Non sei invisibile né solo qui: il nostro team pastorale sta pregando per te e saremmo felici di accoglierti di persona al gruppo "${groupName}" questa settimana. La pace di Dio resti con te.`;
  }
  return `Peace be with you! Thank you for sharing your heart with us today. You are not invisible or alone here - our care team is praying for you, and we would love to welcome you in person at "${groupName}" this week. May God's peace stay with you.`;
}

/** Fixed sample translations of the English draft above, with tradition-correct vocabulary. */
export function sampleNative(lang: LangCode, groupName: string, catholic: boolean): string {
  const g = groupName;
  const replies: Record<LangCode, string> = {
    en: sampleDraft('en', g),
    it: sampleDraft('it', g),
    es: `¡La paz sea contigo! Gracias por abrir tu corazón hoy. No eres invisible ni estás solo aquí: nuestro equipo pastoral está orando por ti y nos encantaría recibirte en persona esta semana en "${g}". Que la paz de Dios permanezca contigo.`,
    fr: `La paix soit avec toi ! Merci d’avoir partagé ce que tu vis aujourd’hui. Tu n’es ni invisible ni seul ici : notre équipe pastorale prie pour toi et serait heureuse de t’accueillir cette semaine au groupe « ${g} ». Que la paix de Dieu demeure avec toi.`,
    zh: catholic
      ? `愿平安与你同在！感谢你今天向我们敞开心扉。在这里你并不孤单--我们的牧灵团队正在为你祈祷，并诚挚邀请你本周亲自参加“${g}”。愿天主的平安常与你同在。`
      : `愿平安与你同在！感谢你今天向我们敞开心扉。在这里你并不孤单--我们的关怀团队正在为你祷告，并诚挚邀请你本周亲自参加“${g}”。愿上帝的平安常与你同在。`,
    ar: `السلام معك! شكرًا لأنك شاركتنا ما في قلبك اليوم. أنت لست وحيدًا ولا منسيًا هنا - فريق الرعاية لدينا يصلي من أجلك، ويسعدنا أن نرحب بك شخصيًا هذا الأسبوع في مجموعة "${g}". ليبقَ سلام الله معك.`,
    sw: `Amani iwe nawe! Asante kwa kushiriki moyo wako nasi leo. Hauko peke yako hapa - timu yetu ya huduma inakuombea, na tungependa kukukaribisha ana kwa ana wiki hii katika kikundi cha "${g}". Amani ya Mungu ikae nawe.`,
    pt: `A paz esteja com você! Obrigado por compartilhar seu coração conosco hoje. Você não está invisível nem sozinho aqui - nossa equipe pastoral está orando por você e adoraríamos recebê-lo pessoalmente esta semana no grupo "${g}". Que a paz de Deus permaneça com você.`,
    pl: `Pokój z Tobą! Dziękujemy, że podzieliłeś się z nami tym, co nosisz w sercu. Nie jesteś tu niewidzialny ani sam - nasz zespół duszpasterski modli się za Ciebie i chętnie powita Cię osobiście w tym tygodniu w grupie „${g}”. Niech pokój Boży pozostanie z Tobą.`,
    ko: catholic
      ? `평화를 빕니다! 오늘 마음을 나누어 주셔서 감사합니다. 이곳에서 당신은 결코 혼자가 아닙니다. 사목팀이 당신을 위해 기도하고 있으며, 이번 주 "${g}" 모임에서 직접 따뜻하게 맞이하고 싶습니다. 하느님의 평화가 늘 함께하시기를 빕니다.`
      : `평안을 빕니다! 오늘 마음을 나누어 주셔서 감사합니다. 이곳에서 당신은 결코 혼자가 아닙니다. 돌봄팀이 당신을 위해 기도하고 있으며, 이번 주 "${g}" 모임에서 직접 따뜻하게 맞이하고 싶습니다. 하나님의 평안이 늘 함께하시기를 기도합니다.`,
    vi: catholic
      ? `Bình an ở cùng bạn! Cảm ơn bạn đã chia sẻ tâm tình với chúng tôi hôm nay. Bạn không vô hình hay cô đơn tại đây - đội ngũ mục vụ đang cầu nguyện cho bạn và rất mong được đón tiếp bạn tại nhóm "${g}" trong tuần này. Xin bình an của Thiên Chúa luôn ở cùng bạn.`
      : `Bình an ở cùng bạn! Cảm ơn bạn đã chia sẻ tâm tình với chúng tôi hôm nay. Bạn không vô hình hay cô đơn tại đây - đội ngũ chăm sóc đang cầu nguyện cho bạn và rất mong được đón tiếp bạn tại nhóm "${g}" trong tuần này. Xin bình an của Đức Chúa Trời luôn ở cùng bạn.`,
    uk: `Мир вам! Дякуємо, що поділилися з нами тим, що у вас на серці. Ви тут не невидимі й не самотні - наша душпастирська команда молиться за вас і буде рада особисто зустріти вас цього тижня в групі «${g}». Нехай мир Божий перебуває з вами.`,
  };
  return replies[lang];
}
