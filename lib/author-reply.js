import { createHmac } from 'node:crypto';

function seal(token, owner, id, lang, body) {
  return createHmac('sha256',token).update(JSON.stringify(['author-reply-v1',String(owner),id,lang,body])).digest('hex').slice(0,32);
}
export function authorLetter({token,owner,from,lang,text}) {
  const clean = value => String(value || '').replace(/[\p{Cc}\p{Cf}]/gu,' ').slice(0,100);
  const name = clean([from.first_name,from.last_name].filter(Boolean).join(' ')) || 'Имя не указано';
  const username = /^[a-zA-Z0-9_]{1,32}$/.test(from.username || '') ? `@${from.username}` : 'Username не установлен';
  const body = `Письмо из Telegram · ${lang.toUpperCase()}\nОт: ${name}\n${username}\nЧтобы ответить, нажми «Ответить» на это сообщение и напиши текст.\n\n${text}`;
  return `${body}\n\n[reply:${from.id}:${lang}:${seal(token,owner,from.id,lang,body)}]`;
}
export function replyRoute(text,token,owner) {
  if(typeof text !== 'string')return null;
  const m=text.match(/\n\n\[reply:(\d+):(ru|en|az):([a-f0-9]{32})\]$/);
  if(!m)return null;
  const id=Number(m[1]),lang=m[2],body=text.slice(0,m.index);
  if(!Number.isSafeInteger(id)||id<=0||seal(token,owner,id,lang,body)!==m[3])return null;
  return {id,lang};
}
export async function handleAuthorReply({message,owner,token,call}) {
  if(String(message.from?.id)!==String(owner)||String(message.chat.id)!==String(owner)||!message.reply_to_message)return false;
  const notice=text=>call('sendMessage',{chat_id:owner,text}).catch(()=>{});
  const original=message.reply_to_message;
  const botId=token.split(':')[0];
  const route=original.from?.is_bot && String(original.from.id)===botId ? replyRoute(original.text,token,owner) : null;
  if(!route){await notice('Не найден получатель. Ответь на новое письмо из Telegram с подписью [reply:…]. Письма с сайта и старые письма без этой подписи не поддерживают ответ.');return true;}
  if(typeof message.text!=='string'||!message.text.trim()||message.text.length>3000){await notice('Ответь одним текстовым сообщением до 3000 символов. Фото, файлы и голосовые сообщения пока не поддерживаются.');return true;}
  const heading={ru:'Ответ автора',en:'A reply from the author',az:'Müəllifin cavabı'}[route.lang];
  try {
    await call('sendMessage',{chat_id:route.id,text:`${heading}\n\n${message.text}`,link_preview_options:{is_disabled:true},reply_markup:{inline_keyboard:[[{text:{ru:'Написать ещё',en:'Write again',az:'Yenə yaz'}[route.lang],callback_data:`${route.lang}:write`}]]}});
  } catch {await notice('Доставку ответа подтвердить не удалось. Человек мог заблокировать бота, либо возникла ошибка связи. Автоматического повтора нет; при повторной отправке возможна копия.');return true;}
  await notice('Ответ доставлен в чат человека с ботом. Это не означает, что он уже прочитан.');
  return true;
}
