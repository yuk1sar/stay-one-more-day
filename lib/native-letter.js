import { legacy } from './letter-legacy.js';
import { createHmac } from 'node:crypto';
import { authorLetter } from './author-reply.js';

export const native = {
  "ru": {
    "prompt": "Расскажи, что у тебя на душе. Можно начать с того, как прошёл день, или сразу написать о том, что болит сильнее всего. Я прочту твоё письмо, хотя иногда мне нужно время, чтобы добраться до сообщений.\n\nНапиши одним сообщением — здесь помещается до 3000 символов. Перед отправкой ты сможешь перечитать его.\n\nЕсли помощь нужна прямо сейчас, нажми /help — пожалуйста, не жди моего ответа.",
    "preview": "Отправим? Я получу твоё письмо вместе с именем и @username, если он у тебя есть, и смогу ответить сюда.\n\nНиже — то, что ты написал.\n\n",
    "send": "Отправить автору",
    "cancel": "Отменить",
    "edit": "Написать заново",
    "sent": "Твоё письмо пришло. Спасибо, что доверился мне и рассказал о себе. Мне может понадобиться время, чтобы прочитать и ответить. Если захочется написать ещё, можешь вернуться сюда. А пока, пожалуйста, побереги себя.",
    "cancelled": "Письмо не отправлено автору. Текст остался в твоём чате с ботом. /write — написать другое письмо.",
    "invalid": "Пришли письмо одним текстовым сообщением, от 1 до 3000 символов. Фото, голосовые сообщения и файлы пока не поддерживаются. Автор ничего не получил. /help — срочная помощь.",
    "failed": "Не удалось подтвердить доставку. Письмо могло дойти; автоматического повтора не будет. Текст остался в этом чате. Если отправишь его заново через /write, автор может получить копию.",
    "unavailable": "Отправка временно недоступна. Письмо не отправлено. Попробуй позже. /help — контакты помощи.",
    "locked": "Не удалось начать отправку или это письмо уже обработано. Автоматического повтора не будет. Проверь сообщения ниже письма. /start — главное меню."
  },
  "en": {
    "prompt": "Tell me what’s on your mind. You can start with how your day went, or go straight to what hurts the most. I’ll read your letter, though sometimes it takes me a while to get to my messages.\n\nWrite it as one message — there’s room for up to 3000 characters. You’ll be able to read it over before sending.\n\nIf you need help right now, tap /help — please don’t wait for my reply.",
    "preview": "Shall we send it? I’ll receive your letter along with your name and @username, if you have one, and I’ll be able to reply here.\n\nHere’s what you wrote.\n\n",
    "send": "Send to the author",
    "cancel": "Cancel",
    "edit": "Write a new draft",
    "sent": "Your letter has arrived. Thank you for trusting me and sharing what you’re going through. I may need some time to read it and reply. If you feel like writing more, you can come back here. In the meantime, please take care of yourself.",
    "cancelled": "Your letter wasn’t sent to the author. The text remains in your chat with the bot. /write — write another letter.",
    "invalid": "Please send one text message with 1–3000 characters. Photos, voice messages and files aren’t supported yet. Nothing was sent to the author. /help — urgent support.",
    "failed": "Delivery could not be confirmed. Your letter may have arrived; it won’t be retried automatically. The text remains in this chat. Sending it again through /write could create a duplicate.",
    "unavailable": "Sending is temporarily unavailable. Your letter wasn’t sent. Please try later. /help — support contacts.",
    "locked": "Sending could not be started, or this letter has already been handled. It won’t be retried automatically. Check the messages below your letter. /start — main menu."
  },
  "az": {
    "prompt": "Ürəyindən keçənləri danış. Gününün necə keçdiyindən başlaya bilərsən, ya da birbaşa səni ən çox incidən şeydən yaza bilərsən. Məktubunu oxuyacağam, amma bəzən mesajlara baxmaq üçün mənə bir az vaxt lazım olur.\n\nBir mesajla yaz — burada 3000 simvola qədər yer var. Göndərməzdən əvvəl yazdıqlarını yenidən oxuya biləcəksən.\n\nElə indi köməyə ehtiyacın varsa, /help düyməsinə bas — lütfən, mənim cavabımı gözləmə.",
    "preview": "Göndərək? Məktubun mənə adın və varsa @username-ninlə birlikdə çatacaq, mən də sənə buradan cavab verə biləcəyəm.\n\nYazdıqların aşağıdadır.\n\n",
    "send": "Müəllifə göndər",
    "cancel": "Ləğv et",
    "edit": "Yenidən yaz",
    "sent": "Məktubun çatdı. Mənə güvənib yaşadıqlarını bölüşdüyün üçün təşəkkür edirəm. Oxuyub cavab vermək üçün mənə bir az vaxt lazım ola bilər. Yenə yazmaq istəsən, buraya qayıda bilərsən. O vaxta qədər, lütfən, özünə yaxşı bax.",
    "cancelled": "Məktub müəllifə göndərilmədi. Mətn botla söhbətində qaldı. /write — başqa məktub yaz.",
    "invalid": "Məktubu 1–3000 simvoldan ibarət bir mətn mesajı kimi göndər. Foto, səsli mesaj və fayllar hələ dəstəklənmir. Müəllif heç nə almayıb. /help — təcili dəstək.",
    "failed": "Çatdırılmanı təsdiqləmək mümkün olmadı. Məktub çatmış ola bilər; avtomatik təkrar göndərilməyəcək. Mətn bu söhbətdə qalıb. /write vasitəsilə yenidən göndərsən, ikinci nüsxə yarana bilər.",
    "unavailable": "Göndərmə müvəqqəti olaraq əlçatan deyil. Məktub göndərilmədi. Sonra yenidən cəhd et. /help — yardım əlaqələri.",
    "locked": "Göndərməni başlatmaq alınmadı və ya bu məktub artıq işlənib. Avtomatik təkrar olmayacaq. Məktubun altındakı mesajları yoxla. /start — əsas menyu."
  }
};

export function signature(token, chatId, text) {
  return createHmac('sha256', token).update(JSON.stringify([chatId, text])).digest('hex').slice(0, 24);
}
export function previewLetter(text, lang, chatId, token) {
  const c = native[lang];
  const preview = c.preview + text;
  const sig = signature(token, chatId, preview);
  return { text: preview, reply_markup: { inline_keyboard: [
    [{text:c.send,callback_data:`letter:${lang}:send:${sig}`}],
    [{text:c.cancel,callback_data:`letter:${lang}:cancel:${sig}`},{text:c.edit,callback_data:`letter:${lang}:edit:${sig}`}]
  ] } };
}

export async function handleLetter({ callback, message, lang, token, call, owner }) {
  const c = native[lang];
  const tell = text => call('sendMessage', {chat_id:message.chat.id,text,link_preview_options:{is_disabled:true}});
  if (!callback) {
    if (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 3000) return tell(c.invalid);
    return call('sendMessage', {chat_id:message.chat.id,...previewLetter(message.text,lang,message.chat.id,token),link_preview_options:{is_disabled:true}});
  }
  const [, , action, sig] = callback.data.split(':');
  const preview = message.text;
  if (typeof preview !== 'string' || signature(token,message.chat.id,preview) !== sig) return;
  const prefix = [c.preview, legacy[lang].preview].find(value => preview.startsWith(value));
  if (!prefix) return;
  const text = preview.slice(prefix.length);
  if (!text.trim() || text.length > 3000) return;
  if (action === 'send' && !owner) return tell(c.unavailable);
  // Remove the confirmation keyboard once, on Telegram's side, before delivery.
  // A stale callback cannot send again if Telegram rejects an unchanged markup edit.
  // On an ambiguous claim result we do not send: avoiding duplicate letters takes priority.
  try {
    await call('editMessageReplyMarkup', {chat_id:message.chat.id,message_id:message.message_id,reply_markup:{inline_keyboard:[]}});
  } catch { await tell(c.locked).catch(() => {}); return; }
  if (action === 'cancel') return tell(c.cancelled);
  if (action === 'edit') return call('sendMessage',{chat_id:message.chat.id,text:c.prompt,reply_markup:{force_reply:true,selective:true}});
  try {
    await call('sendMessage',{chat_id:owner,text:authorLetter({token,owner,from:callback.from,lang,text}),link_preview_options:{is_disabled:true}});
  } catch { await tell(c.failed).catch(() => {}); return; }
  // Never retry a delivered letter if only the visitor's receipt fails.
  await tell(c.sent).catch(() => {});
}
