import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

function pickPort(){return new Promise((resolve,reject)=>{
 const s=net.createServer();s.once('error',reject);
 s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});
});}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
test('end-to-end: Lampa calls backend, mock DeepSeek translates subtitles, polls completed cues',async()=>{
 const modelPort=await pickPort(),backendPort=await pickPort(),TOKEN='unit-test-token-0123456789012345';
 let received=0;
 const ai=http.createServer((req,res)=>{
  const chunks=[];req.on('data',x=>chunks.push(x));req.on('end',()=>{
   const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   assert.equal(req.url,'/v1/chat/completions');
   assert.equal(payload.model,'deepseek-chat');
   assert.equal(req.headers.authorization,'Bearer fake-private-api-key');
   const content=JSON.parse(payload.messages[1].content);
   received++;
   res.writeHead(200,{'Content-Type':'application/json'});
   res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({
     lines:content.lines.map(x=>'Перевод: '+x.text)
   })}}]}));
  });
 });
 await new Promise(resolve=>ai.listen(modelPort,'127.0.0.1',resolve));
 const cwd=fileURLToPath(new URL('../',import.meta.url));
 const child=spawn(process.execPath,['server.mjs'],{
  cwd,env:{...process.env,PORT:String(backendPort),HOST:'127.0.0.1',
    AI_BASE_URL:'http://127.0.0.1:'+modelPort+'/v1',
    AI_API_KEY:'fake-private-api-key',AI_MODEL:'deepseek-chat',ARX_CLIENT_TOKEN:TOKEN},
  stdio:['ignore','pipe','pipe']
 });
 let stderr='';child.stderr.on('data',x=>{stderr+=x.toString();});
 const base='http://127.0.0.1:'+backendPort;
 try {
  let healthy=false;
  for(let i=0;i<45;i++){
   if(child.exitCode!==null)throw Error('backend exited: '+stderr);
   try{const response=await fetch(base+'/health');if(response.ok){healthy=true;break;}}catch(e){}
   await delay(80);
  }
  assert.equal(healthy,true,'backend failed to become healthy');
  const cues=[{start:1,end:3,text:'Hello'},{start:3,end:5,text:'World'}];
  const fail=await fetch(base+'/v1/ai/translate',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cues,from:'en',to:'ru'})
  });assert.equal(fail.status,401);
  const create=await fetch(base+'/v1/ai/translate',{
   method:'POST',headers:{'Content-Type':'application/json','X-ARX-Token':TOKEN},
   body:JSON.stringify({cues,from:'en',to:'ru'})
  });
  assert.equal(create.status,202);
  const submitted=await create.json();assert.ok(/^[a-f0-9-]{36}$/.test(submitted.job_id));
  let finished=null;
  for(let i=0;i<45;i++){
   const response=await fetch(base+'/v1/ai/jobs/'+submitted.job_id,{headers:{'X-ARX-Token':TOKEN}});
   assert.equal(response.status,200);
   const data=await response.json();
   if(data.state==='completed'){finished=data;break;}
   if(data.state==='error')throw Error('backend translation error: '+data.error);
   await delay(80);
  }
  assert.ok(finished,'translation was not completed');
  assert.equal(finished.progress,100);
  assert.deepEqual(finished.cues,cues.map(x=>({start:x.start,end:x.end,text:'Перевод: '+x.text})));
  assert.equal(received,1);
 }finally{
  child.kill('SIGTERM');
  await new Promise(resolve=>ai.close(resolve));
 }
});
