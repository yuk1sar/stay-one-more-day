import test from 'node:test';
import assert from 'node:assert/strict';
import {authorLetter,replyRoute,handleAuthorReply} from '../lib/author-reply.js';
const token='42:test',owner='900';
const letter=authorLetter({token,owner,from:{id:123,first_name:'Visitor',username:'visitor'},lang:'az',text:'Sensitive letter'});
const make=()=>({chat:{id:900},from:{id:900},text:'A reply',reply_to_message:{from:{id:42,is_bot:true},text:letter}});
test('author sees identity and signed route resists recipient or content tampering',()=>{
 assert.match(letter,/@visitor/);assert.match(letter,/Visitor/);assert.deepEqual(replyRoute(letter,token,owner),{id:123,lang:'az'});
 for(const text of [letter.replace('123:az','456:az'),letter.replace('Sensitive','Changed')])assert.equal(replyRoute(text,token,owner),null);
 assert.equal(replyRoute(letter,token,'901'),null);
 const noUsername=authorLetter({token,owner,from:{id:123,first_name:'A'},lang:'en',text:'x'});assert.match(noUsername,/Username не установлен/);assert.equal(replyRoute(noUsername,token,owner).id,123);
});
test('only owner replying to this bot letter can reach signed recipient',async()=>{
 const calls=[];const call=async(method,body)=>calls.push(body);
 assert.equal(await handleAuthorReply({message:make(),owner,token,call}),true);assert.equal(calls[0].chat_id,123);assert.match(calls[0].text,/Müəllifin cavabı/);assert.equal(calls[1].chat_id,owner);
 calls.length=0;const visitor=make();visitor.from.id=123;visitor.chat.id=123;assert.equal(await handleAuthorReply({message:visitor,owner,token,call}),false);assert.equal(calls.length,0);
 const forged=make();forged.reply_to_message.from.id=43;await handleAuthorReply({message:forged,owner,token,call});assert.ok(calls.every(c=>c.chat_id===owner));
});
test('failure and media replies never claim delivery or retry',async()=>{
 const notices=[];let attempts=0;
 await handleAuthorReply({message:make(),owner,token,call:async(method,body)=>{if(body.chat_id===123){attempts++;throw Error('blocked');}notices.push(body.text);}});
 assert.equal(attempts,1);assert.match(notices[0],/подтвердить не удалось/);
 const media=make();delete media.text;const calls=[];await handleAuthorReply({message:media,owner,token,call:async(method,body)=>calls.push(body)});assert.ok(calls.every(c=>c.chat_id===owner));
});
