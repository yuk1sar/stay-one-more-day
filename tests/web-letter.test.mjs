import test from 'node:test';
import assert from 'node:assert/strict';
import {createWebLetter,transferWebLetter,encryptDraft,decryptDraft} from '../lib/web-letter.js';
import {native} from '../lib/native-letter.js';
test('encrypted one-use link transfers exact draft to chosen Telegram user, not owner',async()=>{
 const values=new Map(),commands=[];
 const store=async cmd=>{commands.push(cmd);const [op,k,v]=cmd;if(op==='SET'){if(values.has(k))return null;values.set(k,v);return 'OK';}if(op==='GETDEL'){const value=values.get(k)||null;values.delete(k);return value;}};
 const result=await createWebLetter({text:'Личное письмо',language:'az',token:'secret',ip:'test',store});
 assert.equal(result.ok,true);assert.ok(!result.telegramUrl.includes('Личное'));const id=result.telegramUrl.split('w_')[1];assert.equal(id.length,32);
 assert.ok(commands.some(c=>c[0]==='SET'&&c.includes(900)));assert.ok(!JSON.stringify([...values.values()]).includes('Личное'));
 assert.equal((await createWebLetter({text:'x',language:'ru',token:'secret',ip:'test',store})).code,'rate');
 const calls=[];const call=async(method,body)=>calls.push(body);
 await transferWebLetter({id,message:{chat:{id:123}},language:'en',token:'secret',call,store});
 assert.equal(calls[0].chat_id,123);assert.equal(calls[0].text,native.az.preview+'Личное письмо');assert.ok(calls[0].reply_markup);
 await transferWebLetter({id,message:{chat:{id:456}},language:'en',token:'secret',call,store});assert.ok(!calls[1].text.includes('Личное письмо'));assert.match(calls[1].text,/expired/);
});
test('tampering, wrong encryption key and missing drafts fail safely',async()=>{
 const record=encryptDraft({text:'secret',language:'ru'},'a');assert.throws(()=>decryptDraft(record,'b'));
 let calls=[];const call=async(method,body)=>calls.push(body);
 await transferWebLetter({id:'a'.repeat(32),message:{chat:{id:1}},language:'ru',token:'b',call,store:async()=>record});assert.ok(!JSON.stringify(calls).includes('secret'));
 calls=[];await transferWebLetter({id:'bad',message:{chat:{id:1}},language:'ru',token:'b',call,store:async()=>{throw Error('must not read');}});assert.equal(calls.length,1);
});
