import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/letter.js';

function request(body, options={}) { return {method:'POST',headers:{host:'example.test',origin:'https://example.test','content-type':'application/json','x-forwarded-for':'192.0.2.1'},body,...options}; }
function response() { return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}}; }
test('letter delivery validates input, protects credentials, and preserves upstream failures', async()=>{
 const originalFetch=globalThis.fetch;
 const oldToken=process.env.TELEGRAM_BOT_TOKEN, oldChat=process.env.TELEGRAM_CHAT_ID;
 const body={text:'A test letter',language:'ru',consent:true,website:''};
 try {
  delete process.env.TELEGRAM_BOT_TOKEN;delete process.env.TELEGRAM_CHAT_ID;
  let res=response();await handler(request(body),res);assert.equal(res.statusCode,503);
  process.env.TELEGRAM_BOT_TOKEN='test-token';process.env.TELEGRAM_CHAT_ID='123';
  globalThis.fetch=async()=>{throw Error('Should not send');};
  for(const invalid of [{...body,consent:false},{...body,text:' '},{...body,text:'a'.repeat(3001)},{...body,website:'spam'},{...body,language:'xx'}]){res=response();await handler(request(invalid),res);assert.equal(res.statusCode,400);}
  res=response();await handler(request(body,{method:'GET'}),res);assert.equal(res.statusCode,405);
  res=response();await handler(request(body,{headers:{host:'example.test',origin:'https://attacker.test'}}),res);assert.equal(res.statusCode,403);
  let sent;
  globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true})};};
  res=response();await handler(request(body),res);assert.deepEqual(res.body,{ok:true});assert.equal(sent.chat_id,'123');assert.ok(sent.text.endsWith(body.text));assert.equal(sent.parse_mode,undefined);assert.equal(JSON.stringify(res.body).includes('test-token'),false);
  res=response();await handler(request(body),res);assert.equal(res.statusCode,429);
  globalThis.fetch=async()=>({ok:false,json:async()=>({ok:false,description:'private upstream error'})});
  res=response();await handler(request(body,{headers:{...request(body).headers,'x-forwarded-for':'192.0.2.2'}}),res);assert.equal(res.statusCode,502);assert.deepEqual(res.body,{code:'failed'});
  globalThis.fetch=async()=>{throw Error('timeout secret');};
  res=response();await handler(request(body,{headers:{...request(body).headers,'x-forwarded-for':'192.0.2.3'}}),res);assert.equal(res.statusCode,504);assert.deepEqual(res.body,{code:'uncertain'});
 } finally {globalThis.fetch=originalFetch;if(oldToken===undefined)delete process.env.TELEGRAM_BOT_TOKEN;else process.env.TELEGRAM_BOT_TOKEN=oldToken;if(oldChat===undefined)delete process.env.TELEGRAM_CHAT_ID;else process.env.TELEGRAM_CHAT_ID=oldChat;}
});
