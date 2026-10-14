import {test} from 'node:test';
import assert from 'node:assert/strict';
import {params,providerURLs,normalize,parseSrt} from '../providers.mjs';
import {validate,batches,extractJSON} from '../ai.mjs';
import {server} from '../server.mjs';
test('validate query and episode',()=>{
 assert.equal(params(new URL('http://localhost/?imdb_id=tt0903747&season=1&episode=1&lang=rus')).episode,1);
 assert.equal(params(new URL('http://localhost/?imdb_id=tt1%26p%3D9')),null);
 assert.equal(params(new URL('http://localhost/?imdb_id=tt0903747&season=1&episode=9999')),null);
});
test('series routed to Stremio and REST sources',()=>{
 const q={imdb:'tt0903747',season:1,episode:1,lang:'rus'};
 assert.ok(providerURLs(q).stremio.includes('tt0903747%3A1%3A1'));
 assert.ok(providerURLs(q).rest.includes('episode-1/'));
});
test('merge providers into a normalized unique result',()=>{
 const q=normalize({subtitles:[{lang:'rus',url:'https://subs5.strem.io/en/file/1957291837',g:'10',subtitleFileName:'Pilot'}]},
 [{IDSubtitleFile:'1957291837',SubLanguageID:'rus',SubDownloadsCnt:'22'}],'rus');
 assert.equal(q.length,1);assert.equal(q[0].id,'1957291837');
});
test('parse SRT timing, UTF-8 and HTML',()=>{
 const s=parseSrt('1\n00:01:01,200 --> 00:01:04,600\nHello <i>world</i>\n\n2\n00:02:00.000 --> 00:02:02.000\nNext');
 assert.equal(s.length,2);assert.equal(s[0].start,61.2);assert.equal(s[0].text,'Hello world');
});
test('reject invalid translations',()=>{
 assert.throws(()=>validate({from:'en',to:'ru',cues:[{start:5,end:1,text:'bad'}]}));
 assert.throws(()=>validate({from:'en',to:'auto',cues:[{start:1,end:5,text:'bad'}]}));
});
test('batch limits and preserves order',()=>{
 const cue=Array.from({length:102},(_,i)=>({start:i,end:i+1,text:'hello'+i}));
 const parts=batches(cue);assert.equal(parts.length,3);assert.equal(parts.flat()[60].text,'hello60');
});
test('response parser handles JSON wrappers',()=>{
 const obj=extractJSON('{"lines":["привет"]}');assert.deepEqual(obj.lines,['привет']);
});
test('health and AI endpoints do not expose secrets',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const res=await fetch(base+'/health');
  assert.equal(res.status,200);const info=await res.json();assert.equal(info.subtitles,true);
  assert.equal((await fetch(base+'/v1/ai/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
  assert.equal((await fetch(base+'/v1/ai/jobs/12345678-1234-1234-1234-123456789012')).status,401);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
