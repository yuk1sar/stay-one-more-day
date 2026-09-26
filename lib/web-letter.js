import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import { previewLetter } from './native-letter.js';

export const transferText = {
  ru: { expired:'Эта ссылка уже использована или срок её действия закончился. Твоё письмо осталось на сайте: вернись туда и создай новую ссылку. Или напиши здесь через /write.', failed:'Сейчас не получилось перенести письмо. Текст остался на сайте — попробуй создать новую ссылку или напиши здесь через /write.' },
  en: { expired:'This link has already been used or has expired. Your letter is still on the website: return there to create a new link, or write here with /write.', failed:'Your letter could not be transferred right now. The text is still on the website — try creating a new link, or write here with /write.' },
  az: { expired:'Bu keçid artıq istifadə olunub və ya vaxtı bitib. Məktubun saytda qalıb: yeni keçid yaratmaq üçün geri qayıt və ya burada /write ilə yaz.', failed:'Məktubu indi köçürmək alınmadı. Mətn saytda qalıb — yeni keçid yarat və ya burada /write ilə yaz.' }
};
export async function redis(command) {
  const url=process.env.UPSTASH_REDIS_REST_URL, token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url || !token || new URL(url).protocol!=='https:') throw Error('Storage unavailable');
  const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(5000)});
  const data=await response.json();
  if(!response.ok || data.error)throw Error('Storage unavailable');
  return data.result;
}
const key=token=>createHash('sha256').update(`web-letter-v1:${token}`).digest();
export function encryptDraft(draft,token) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(token),iv);
  const data=Buffer.concat([cipher.update(JSON.stringify(draft),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');
}
export function decryptDraft(encoded,token) {
  const data=Buffer.from(encoded,'base64url'),cipher=createDecipheriv('aes-256-gcm',key(token),data.subarray(0,12));
  cipher.setAuthTag(data.subarray(12,28));
  return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString('utf8'));
}
export async function createWebLetter({text,language,token,ip,store=redis}) {
  const rateKey=createHash('sha256').update(ip).digest('hex');
  if(await store(['SET',`web-letter:rate:${rateKey}`,'1','EX',60,'NX'])!=='OK')return {code:'rate'};
  const id=randomBytes(24).toString('base64url');
  const record=encryptDraft({text,language},token);
  if(await store(['SET',`web-letter:draft:${id}`,record,'EX',900,'NX'])!=='OK')throw Error('Storage unavailable');
  return {ok:true,telegramUrl:`https://t.me/StayOneMoreDayBot?start=w_${id}`};
}
export async function transferWebLetter({id,message,language,token,call,store=redis}) {
  const tell=text=>call('sendMessage',{chat_id:message.chat.id,text});
  if(!/^[A-Za-z0-9_-]{32}$/.test(id))return tell(transferText[language].expired);
  let record;
  try {
    record=await store(['GETDEL',`web-letter:draft:${id}`]);
    if(!record)return tell(transferText[language].expired);
    const draft=decryptDraft(record,token);
    if(!['ru','en','az'].includes(draft.language)||typeof draft.text!=='string'||!draft.text.trim()||draft.text.length>3000)throw Error('Invalid draft');
    await call('sendMessage',{chat_id:message.chat.id,...previewLetter(draft.text,draft.language,message.chat.id,token),link_preview_options:{is_disabled:true}});
  } catch { await tell(transferText[language].failed).catch(()=>{}); }
}
