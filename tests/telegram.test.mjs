import test from 'node:test';
import assert from 'node:assert/strict';
import handler, {buildReply,webhookSecret} from '../api/telegram.js';
const res=()=>({code:200,setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;return this;}});
test('all bot routes and languages have text and valid buttons',()=>{
 for(const lang of ['ru','en','az'])for(const action of ['start','write','help','site','about','language','ruCountry','azCountry','other','unknown']){
  const r=buildReply(action,lang);assert.ok(r.text.length>0&&r.text.length<4096);
  for(const row of r.reply_markup.inline_keyboard || [])for(const b of row){assert.ok(b.text);assert.ok(b.url?.startsWith('https://') || Buffer.byteLength(b.callback_data||'')>0&&Buffer.byteLength(b.callback_data)<65);}
 }
 assert.equal(buildReply('write','ru').reply_markup.force_reply,true);
 assert.equal(buildReply('help','en').reply_markup.inline_keyboard[0].length,2);
});
test('webhook authentication, commands, callbacks and duplicate suppression',async()=>{
 const oldToken=process.env.TELEGRAM_BOT_TOKEN, oldFetch=globalThis.fetch;process.env.TELEGRAM_BOT_TOKEN='test-token';
 const calls=[];globalThis.fetch=async(url,opts)=>{calls.push({method:url.split('/').pop(),body:JSON.parse(opts.body)});return {ok:true,json:async()=>({ok:true})};};
 const headers={'x-telegram-bot-api-secret-token':webhookSecret('test-token')};
 const message={message_id:1,date:Math.floor(Date.now()/1000),chat:{id:1,type:'private'},from:{id:1,language_code:'ru'},text:'/start'};
 try{
  let r=res();await handler({method:'POST',headers:{},body:{}},r);assert.equal(r.code,403);assert.equal(calls.length,0);
  r=res();await handler({method:'GET',headers},r);assert.equal(r.body.ready,true);
  const req={method:'POST',headers,body:{update_id:10,message}};r=res();await handler(req,r);assert.equal(r.code,200);assert.match(calls[0].body.text,/Привет/);
  r=res();await handler(req,r);assert.equal(calls.length,1);
  r=res();await handler({method:'POST',headers,body:{update_id:11,callback_query:{id:'c',from:message.from,message,data:'az:start'}}},r);assert.equal(calls[1].method,'answerCallbackQuery');assert.match(calls[2].body.text,/Salam/);
  r=res();await handler({method:'POST',headers,body:{update_id:12,message:{...message,text:'private distress text'}}},r);assert.ok(calls.at(-1).body.text.includes('private distress text'));assert.ok(calls.every(c=>c.body.chat_id===undefined||c.body.chat_id===1));assert.equal(calls.at(-1).body.chat_id,1);
  const count=calls.length;r=res();await handler({method:'POST',headers,body:{update_id:13,message:{...message,chat:{id:-1,type:'group'}}}},r);assert.equal(calls.length,count);
  r=res();await handler({method:'POST',headers,body:{update_id:14,message:{...message,date:1}}},r);assert.equal(calls.length,count);
  globalThis.fetch=async()=>{throw Error('private URL');};r=res();await handler({method:'POST',headers,body:{update_id:15,message}},r);assert.equal(r.code,502);assert.deepEqual(r.body,{ok:false});
 }finally{globalThis.fetch=oldFetch;if(oldToken===undefined)delete process.env.TELEGRAM_BOT_TOKEN;else process.env.TELEGRAM_BOT_TOKEN=oldToken;}
});
