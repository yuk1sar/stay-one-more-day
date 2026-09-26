import { transferWebLetter } from '../lib/web-letter.js';
import { legacy } from '../lib/letter-legacy.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { copy } from '../lib/bot-copy.js';
import { native, handleLetter } from '../lib/native-letter.js';
import { handleAuthorReply } from '../lib/author-reply.js';

const site = 'https://stay-one-more-day.vercel.app';
const handled = new Map();
const inFlight = new Set();
export function webhookSecret(token) {
  return createHmac('sha256', token).update('stay-one-more-day:webhook:v1').digest('hex');
}
const languageOf = code => code?.startsWith('az') ? 'az' : code?.startsWith('ru') ? 'ru' : 'en';
export function buildReply(action, lang) {
  const c = copy[lang];
  const button = (key, label = c[key]) => ({ text: label, callback_data: `${lang}:${key}` });
  const link = (text, url) => ({ text, url });
  const home = [button('start', c.menu)];
  const menu = [[button('write')], [button('help')], [link(c.site, site)], [button('about'), button('language')]];
  if (action === 'write') return { text: native[lang].prompt, reply_markup: {force_reply:true,selective:true} };
  if (action === 'help') return { text: c.helpText, reply_markup: { inline_keyboard: [[button('ruCountry'), button('azCountry')], [button('other')], home] } };
  if (['ruCountry', 'azCountry', 'other'].includes(action)) return { text: action === 'other' ? c.otherText : `${c[action]}\n\n${c.emergency}`, reply_markup: { inline_keyboard: [[link(c.directory, 'https://findahelpline.com/')], [link(c.contacts, `${site}/?lang=${lang}#help`)], home] } };
  if (action === 'language') return { text: c.choose, reply_markup: { inline_keyboard: [[{text:'Русский',callback_data:'ru:start'}, {text:'English',callback_data:'en:start'}, {text:'Azərbaycanca',callback_data:'az:start'}]] } };
  if (action === 'site') return { text: c.site, reply_markup: { inline_keyboard: [[link(c.site, `${site}/?lang=${lang}`)], home] } };
  return { text: action === 'start' ? c.welcome : action === 'about' ? c.aboutText : c.unknown, reply_markup: { inline_keyboard: menu } };
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ok:false});
  const provided = String(req.headers['x-telegram-bot-api-secret-token'] || '');
  const expected = webhookSecret(token);
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return res.status(403).json({ok:false});
  if (req.method === 'GET') return res.status(200).json({ok:true,ready:true});
  if (req.method !== 'POST') return res.status(405).json({ok:false});
  let update = req.body;
  try { if (typeof update === 'string') update = JSON.parse(update); } catch { return res.status(400).json({ok:false}); }
  if (!Number.isSafeInteger(update?.update_id)) return res.status(400).json({ok:false});
  const now = Date.now();
  for (const [id, expires] of handled) if (expires < now) handled.delete(id);
  if (handled.has(update.update_id) || inFlight.has(update.update_id)) return res.status(200).json({ok:true});
  const callback = update.callback_query;
  const message = callback?.message || update.message;
  const from = callback?.from || message?.from;
  // Private chats only; old messages are not replayed when a webhook is first enabled.
  if (!message || message.chat?.type !== 'private' || from?.is_bot || from?.id !== message.chat.id || (!callback && message.date < now / 1000 - 300)) return res.status(200).json({ok:true});
  let lang = languageOf(from.language_code);
  if (message.reply_to_message?.from?.is_bot) {
    const replied = message.reply_to_message.text;
    const matched = Object.keys(native).find(code => replied === native[code].prompt || replied === legacy[code].prompt);
    if (matched) lang = matched;
  }
  let action = (message.text?.match(/^\/(start|write|help|site|about|language)(?:@StayOneMoreDayBot)?(?:\s|$)/i)?.[1] || 'unknown').toLowerCase();
  if (callback) {
    const letter = callback.data?.match(/^letter:(ru|en|az):(send|cancel|edit):[a-f0-9]{24}$/);
    const parts = callback.data?.match(/^(ru|en|az):(start|write|help|site|about|language|ruCountry|azCountry|other)$/);
    if (letter) { lang = letter[1]; action = 'letter'; }
    else if (parts) [, lang, action] = parts;
    else return res.status(200).json({ok:true});
  }
  const call = async (method, data) => {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(8000) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error('Telegram request failed');
  };
  inFlight.add(update.update_id);
  try {
    if (callback) await call('answerCallbackQuery', {callback_query_id:callback.id}).catch(() => {});
    const webDraft = !callback && message.text?.match(/^\/start(?:@StayOneMoreDayBot)? w_([A-Za-z0-9_-]{32})$/i);
    const ownerReply = !callback && await handleAuthorReply({message,owner:process.env.TELEGRAM_CHAT_ID,token,call});
    if (webDraft) await transferWebLetter({id:webDraft[1],message,language:lang,token,call});
    else if (ownerReply) { /* Routed only for authenticated owner replies. */ }
    else if (action === 'letter' || (!callback && action === 'unknown' && !message.text?.startsWith('/'))) {
      await handleLetter({callback,message,lang,token,call,owner:process.env.TELEGRAM_CHAT_ID});
    } else await call('sendMessage', { chat_id:message.chat.id, ...buildReply(action, lang), link_preview_options:{is_disabled:true} });
    if (handled.size >= 2000) handled.delete(handled.keys().next().value);
    handled.set(update.update_id, now + 300_000);
    return res.status(200).json({ok:true});
  } catch {
    return res.status(502).json({ok:false});
  } finally { inFlight.delete(update.update_id); }
}
