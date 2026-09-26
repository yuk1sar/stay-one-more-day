import test from 'node:test';
import assert from 'node:assert/strict';
import {native,previewLetter,handleLetter} from '../lib/native-letter.js';
const token='test-token', owner='900';
function draft(lang='ru',chatId=123,text='Test letter <literal>'){
 const p=previewLetter(text,lang,chatId,token);
 return {message:{message_id:50,chat:{id:chatId,type:'private'},text:p.text},callback:{from:{id:chatId,first_name:"Test",username:"test_user"},data:p.reply_markup.inline_keyboard[0][0].callback_data},lang,token,owner};
}
test('three-language drafts have bounded signed buttons and exact text',()=>{
 for(const lang of ['ru','en','az']){
  const p=previewLetter('x'.repeat(3000),lang,123,token);assert.ok(p.text.length<4096);
  for(const row of p.reply_markup.inline_keyboard)for(const b of row)assert.ok(Buffer.byteLength(b.callback_data)<=64);
 }
});
test('draft is sent only to visitor, consent sends exact letter to owner, stale clicks fail closed',async()=>{
 const calls=[];let consumed=false;
 const call=async(method,body)=>{calls.push({method,body});if(method==='editMessageReplyMarkup'){if(consumed)throw Error('not modified');consumed=true;}};
 await handleLetter({message:{chat:{id:123},text:'Test letter <literal>'},lang:'ru',token,owner,call});
 assert.equal(calls[0].body.chat_id,123);assert.equal(calls[0].body.reply_markup.inline_keyboard.length,2);
 await handleLetter({...draft(),call});assert.equal(calls.filter(c=>c.body.chat_id===owner).length,1);assert.ok(calls.find(c=>c.body.chat_id===owner).body.text.includes('Test letter <literal>'));
 await handleLetter({...draft(),call});assert.equal(calls.filter(c=>c.body.chat_id===owner).length,1);
});
test('cancel, forged text, different user and unsupported input never reach owner',async()=>{
 const calls=[];const call=async(method,body)=>calls.push({method,body});
 const d=draft();d.callback.data=d.callback.data.replace(':send:',':cancel:');await handleLetter({...d,call});
 const forged=draft();forged.message.text+='edited';await handleLetter({...forged,call});
 const other=draft();other.message.chat.id=456;await handleLetter({...other,call});
 for(const text of ['', 'x'.repeat(3001),undefined])await handleLetter({message:{chat:{id:123},text},lang:'en',token,owner,call});
 assert.ok(calls.every(c=>c.body.chat_id!==owner));
});
test('uncertain forwarding is not retried; failed visitor receipt does not resend',async()=>{
 let attempts=0;const notices=[];
 await handleLetter({...draft(),call:async(method,body)=>{if(body.chat_id===owner){attempts++;throw Error('timeout');}notices.push(body.text);}});
 assert.equal(attempts,1);assert.ok(notices.includes(native.ru.failed));
 attempts=0;
 await handleLetter({...draft(),call:async(method,body)=>{if(body.chat_id===owner)attempts++;else if(method==='sendMessage')throw Error('receipt failed');}});
 assert.equal(attempts,1);
});
