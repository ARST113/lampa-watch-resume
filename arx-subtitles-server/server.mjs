import http from 'node:http';
import {params,providerURLs,getRemote,normalize,parseSrt} from './providers.mjs';
import {config,authorize,submit,status} from './ai.mjs';
const port=Number(process.env.PORT||8091),host=process.env.HOST||'127.0.0.1';
const counters=new Map();
function reply(res,code,data){
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
function throttle(req){
  // Origin/IP headers are not trusted: the TCP peer is the only rate-limit key.
  const key=String(req.socket.remoteAddress||'none')+':'+req.method,now=Date.now();
  let o=counters.get(key);
  if(!o||now-o.start>60000)o={start:now,count:0};
  o.count++;counters.set(key,o);
  return o.count<=(req.method==='POST'?5:90);
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];let length=0;
    req.on('data',x=>{length+=x.length;if(length>1200000){
      reject(Error('body too large'));req.destroy();return;
    }chunks.push(x);});
    req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}
      catch(e){reject(Error('invalid JSON'));}});
    req.on('error',reject);
  });
}
export function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,X-ARX-Token');
  res.setHeader('Access-Control-Max-Age','3600');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  let u;try{u=new URL(req.url,'http://localhost');}
  catch(e){return reply(res,400,{error:'bad URL'});}
  if(req.method==='GET'&&u.pathname==='/health')
    return reply(res,200,{status:'ok',version:'0.1.0',subtitles:true,
      ai:Boolean(config.apiKey&&config.token),model:config.model});
  if(!throttle(req))return reply(res,429,{error:'too many requests'});
  if(req.method==='GET'&&u.pathname==='/v1/subtitles/search'){
    const q=params(u);
    if(!q)return reply(res,400,{error:'invalid imdb_id, episode or language'});
    const urls=providerURLs(q);
    return Promise.allSettled([getRemote(urls.stremio),getRemote(urls.rest)]).then(data=>{
      if(data.every(x=>x.status==='rejected'))return reply(res,502,{error:'subtitles providers unavailable'});
      const results=normalize(data[0].status==='fulfilled'?data[0].value:null,
        data[1].status==='fulfilled'?data[1].value:null,q.lang);
      reply(res,200,{subtitles:results,count:results.length,
        providers:data.map((x,i)=>({name:i===0?'Stremio':'OpenSubtitles REST',available:x.status==='fulfilled'}))});
    }).catch(()=>reply(res,502,{error:'subtitle search error'}));
  }
  const file=u.pathname.match(/^\/v1\/subtitles\/file\/(\d{3,20})$/);
  if(req.method==='GET'&&file){
    const endpoint='https://subs5.strem.io/en/download/subencoding-stremio-utf8/src-api/file/'+file[1]+'.srt';
    return getRemote(endpoint,true).then(raw=>{
      const cues=parseSrt(raw);
      if(!cues.length)return reply(res,422,{error:'unrecognized subtitles'});
      reply(res,200,{cues,count:cues.length});
    }).catch(()=>reply(res,502,{error:'subtitles download error'}));
  }
  if(u.pathname==='/v1/ai/translate'&&req.method==='POST'){
    if(!authorize(req))return reply(res,401,{error:'unauthorized'});
    return readBody(req).then(body=>{
      try{return reply(res,202,submit(body));}
      catch(e){return reply(res,e.message==='AI not configured'?503:400,{error:e.message});}
    }).catch(e=>reply(res,400,{error:e.message}));
  }
  const poll=u.pathname.match(/^\/v1\/ai\/jobs\/([a-f0-9-]{36})$/);
  if(poll&&req.method==='GET'){
    if(!authorize(req))return reply(res,401,{error:'unauthorized'});
    const job=status(poll[1]);return reply(res,job?200:404,job||{error:'expired or unknown job'});
  }
  return reply(res,404,{error:'not found'});
}
export const server=http.createServer(handler);
if(process.argv[1]&&process.argv[1].endsWith('/server.mjs')) {
  server.listen(port,host,()=>console.log('ARX subtitles server listening on '+host+':'+port));
}
