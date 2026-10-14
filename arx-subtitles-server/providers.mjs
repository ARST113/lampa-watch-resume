// Public subtitle providers; never send private streaming URLs or credentials.
export function params(url){
 const imdb=url.searchParams.get('imdb_id')||'',season=url.searchParams.get('season'),episode=url.searchParams.get('episode');
 const lang=(url.searchParams.get('lang')||'rus').toLowerCase();
 if(!/^tt\d{5,12}$/.test(imdb)||!/^[a-z]{3}$/.test(lang)||(season===null)!==(episode===null))return null;
 const s=season===null?null:Number(season),e=episode===null?null:Number(episode);
 if(s!==null&&(!Number.isInteger(s)||s<0||s>100||!Number.isInteger(e)||e<1||e>1000))return null;
 return {imdb,season:s,episode:e,lang};
}
export function providerURLs(q){
 const serial=q.season!==null,id=q.imdb+(serial?':'+q.season+':'+q.episode:'');
 return {
   stremio:'https://opensubtitles-v3.strem.io/subtitles/'+(serial?'series':'movie')+'/'+encodeURIComponent(id)+'.json',
   rest:'https://rest.opensubtitles.org/search/'+(serial?'episode-'+q.episode+'/':'')+'imdbid-'+q.imdb.slice(2)+'/'+
     (serial?'season-'+q.season+'/':'')+'sublanguageid-'+q.lang
 };
}
export async function getRemote(url,text=false){
 const r=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'ARX-Lampa/0.3','Accept':text?'text/plain':'application/json'}});
 if(!r.ok)throw Error('upstream HTTP '+r.status);
 if(Number(r.headers.get('content-length')||0)>1500000)throw Error('upstream too large');
 const value=await r.text();
 if(value.length>1500000)throw Error('upstream too large');
 return text?value:JSON.parse(value);
}
export function normalize(stremio,rest,lang){
 const out=[],seen=new Set();
 function push(id,title,score,source){
   id=String(id||'');
   if(!/^\d{3,20}$/.test(id)||seen.has(id))return;
   seen.add(id);out.push({id,lang,title:String(title||'Субтитры').slice(0,140),score:Number(score)||0,source});
 }
 for(const x of (stremio?.subtitles||[])){
   const code=String(x.lang||x.language||'').toLowerCase();
   if(code!==lang&&!(lang==='rus'&&code==='ru')&&!(lang==='eng'&&code==='en'))continue;
   const found=String(x.url||'').match(/\/file\/(\d{3,20})(?:\.srt)?(?:[?#]|$)/);
   if(found)push(found[1],x.subtitleFileName||x.filename||x.movieReleaseName,x.g,'Stremio');
 }
 for(const x of (Array.isArray(rest)?rest:[])){
   if(String(x.SubLanguageID||'').toLowerCase()!==lang)continue;
   push(x.IDSubtitleFile,x.SubFileName||x.MovieReleaseName,x.SubDownloadsCnt,'OpenSubtitles REST');
 }
 return out.sort((a,b)=>b.score-a.score).slice(0,40);
}
export function parseSrt(raw){
 const blocks=String(raw||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split(/\n\s*\n/),cues=[];
 function sec(v){
   const a=String(v).trim().replace(',','.').split(':');
   if(a.length<2||a.length>3)return NaN;let n=0;
   for(const x of a){if(!/^\d+(?:\.\d+)?$/.test(x))return NaN;n=n*60+Number(x);}return n;
 }
 for(const b of blocks){
   const lines=b.trim().split('\n');let n=/^\d+$/.test(lines[0])?1:0;
   if(!lines[n]?.includes('-->'))continue;
   const [x,y]=lines[n].split('-->'),start=sec(x),end=sec(y.trim().split(/\s+/)[0]);
   const text=lines.slice(n+1).join('\n').replace(/<[^>]*>/g,'').trim();
   if(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&end-start<=90&&text)cues.push({start,end,text:text.slice(0,1800)});
   if(cues.length>=3500)break;
 }
 return cues;
}
