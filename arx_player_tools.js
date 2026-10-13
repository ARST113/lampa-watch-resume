/* ARX Player Tools 0.3.0 — Lampa internal HTML5 player
 * Public metadata only; no torrent URLs, credentials or watch history transmitted.
 * Supports skip services, episode-specific corrections, remote navigation,
 * HTML5 text tracks, chapter cues, sleep timer and playback information.
 */
(function () {
  'use strict';
  if (window.__ARX_PLAYER_TOOLS__) return;
  window.__ARX_PLAYER_TOOLS__ = true;
  var L = window.Lampa, VERSION = '0.3.0', NS = 'arx_tools_';
  var SUBS_URL = 'https://m3dfatboi.github.io/lampa-opensubtitles-ru/opensubtitles_ru.js';
  var TYPES = ['intro','recap','credits','preview','ad','postcredits'];
  var NAMES = {intro:'Заставка',recap:'Рекап',credits:'Титры',preview:'Анонс',ad:'Реклама',postcredits:'Сцена после титров'};
  var mounted = false, current = null, playerToken = 0, control = {}, attachedVideo = null, cacheTimer = null;
  var sleepId = null, fadeId = null, undoTimer = null, scheduledEnd = 0, sleepOriginalVolume = null;
  var previewMark = null, styleReady = false, keyBound = false, dualTrack = null, dualMode = null;
  var sources = ['SkipDB','IntroDB','TheIntroDB','AniSkip'];
  function log() {try {console.log.apply(console,['[ARX Tools '+VERSION+']'].concat([].slice.call(arguments)));} catch(e){}}
  function number(x) {var n = Number(x);return x === null || x === '' || typeof x === 'undefined' || !isFinite(n) ? NaN : n;}
  function positiveInt(x) {var n=number(x);return n>=0 && Math.floor(n)===n ? n : null;}
  function json(x) {if(typeof x!=='string')return x;try{return JSON.parse(x);}catch(e){return null;}}
  function get(k,d) {try{var v=L.Storage.get(NS+k,d);return v===null||typeof v==='undefined'?d:v;}catch(e){return d;}}
  function set(k,v) {try{L.Storage.set(NS+k,v);}catch(e){log('Storage write failed',k);}}
  function on(k,d) {var v=get(k,d);return !(v===false||v==='false'||v==='0'||v===0||v===null);}
  function notice(s) {try{if(L.Noty && L.Noty.show)L.Noty.show(s);else log(s);}catch(e){log(s);}}
  function playerVideo() {try{return L.PlayerVideo&&L.PlayerVideo.video&&L.PlayerVideo.video();}catch(e){return null;}}
  function duration() {var v=playerVideo(),n=v?number(v.duration):NaN;return n>0&&isFinite(n)?n:0;}
  function time() {var v=playerVideo();return v?number(v.currentTime):NaN;}
  function fmt(n) {n=Math.max(0,Math.floor(number(n)||0));return (n>=3600?Math.floor(n/3600)+':':'')+('0'+Math.floor(n%3600/60)).slice(n>=3600?-2:-2)+':'+('0'+n%60).slice(-2);}
  function readCard(data) {var a;try{a=L.Activity&&L.Activity.active&&L.Activity.active();}catch(e){}return data.card||(a&&(a.card||a.movie))||{};}
  function metadata(p) {
    p=p||{};
    var c=readCard(p), pl=Array.isArray(p.playlist)?p.playlist:[];
    var imdb=String(p.imdb_id||c.imdb_id||c.imdb||'').trim();
    var tmdb=String(p.tmdb_id||c.id||'').trim();
    var mal=positiveInt(p.mal_id||p.malId||c.mal_id||c.malId||c.myanimelist_id);
    var season=p.season,episode=p.episode;
    for(var i=0;i<pl.length;i++){var e=pl[i];if(e&&(e.url===p.url||(pl.length===1&&!p.url))){
      if(season==null)season=e.season!=null?e.season:e.s;
      if(episode==null)episode=e.episode!=null?e.episode:e.e;
      if(mal==null)mal=positiveInt(e.mal_id||e.malId);
      break;
    }}
    var title=String(p.title||p.name||''), m=title.match(/(?:S|С)(\d{1,2})\s*(?:E|Е)(\d{1,3})/i);
    if(m){if(season==null)season=m[1];if(episode==null)episode=m[2];}
    var sn=positiveInt(season),en=positiveInt(episode);
    if((sn==null||en==null)&&p.file) {
      m=String(p.file).match(/(?:S|С)(\d{1,2})\s*(?:E|Е)(\d{1,3})/i);
      if(m){if(sn==null)sn=positiveInt(m[1]);if(en==null)en=positiveInt(m[2]);}
    }
    return {imdb:/^tt\d{5,12}$/.test(imdb)?imdb:'',tmdb:/^\d+$/.test(tmdb)?tmdb:'',
      mal:mal,season:sn,episode:en,movie:sn==null||en==null};
  }
  function mapType(t) {
    t=String(t||'intro').toLowerCase().replace(/[\s_-]/g,'');
    var aliases={op:'intro',opening:'intro',ed:'credits',mixedop:'intro',mixeded:'credits',
      outro:'credits',ending:'credits',endcredits:'credits',commercial:'ad',advertisement:'ad',
      postcredit:'postcredits',postcreditscene:'postcredits',next:'preview'};
    return aliases[t]|| (TYPES.indexOf(t)>=0?t:null);
  }
  function clock(v) {
    if(typeof v==='number')return v;
    var a=String(v).trim().split(':');if(a.length<2||a.length>3)return number(v);
    var n=0;for(var i=0;i<a.length;i++){var z=number(a[i]);if(!isFinite(z)||z<0||(i>0&&z>=60))return NaN;n=n*60+z;}
    return n;
  }
  function put(arr,type,start,end,source,quality,flags) {
    type=mapType(type);var s=clock(start),e=clock(end);
    if(!type||!isFinite(s)||!isFinite(e)||s<0||e-s<4||e-s>900)return;
    arr.push({type:type,start:s,end:e,source:source||'Unknown',quality:isFinite(number(quality))?Number(quality):0.5,
      unsafe:!!(flags&&flags.unsafe),explicit:!!(flags&&flags.explicit)});
  }
  function parseSkipDB(data) {
    var out=[], seg=data&&data.segments||{};
    TYPES.forEach(function(t){var x=seg[t==='credits'?'outro':t];if(!x)return;
      var q=number(x.confidence),bad=x.match==='out-of-range'||x.match==='agnostic'||(isFinite(q)&&q<0.35);
      put(out,t,number(x.start_ms)/1000,number(x.end_ms)/1000,'SkipDB',isFinite(q)?q:0.4,{unsafe:bad});
    });return out;
  }
  function parseIntroDB(data) {
    var out=[], payload=(data&&data.segments)||data;
    if(Array.isArray(payload))payload.forEach(function(x){if(!x)return;
      var s=x.start_sec!=null?x.start_sec:x.start_ms!=null?number(x.start_ms)/1000:x.start;
      var e=x.end_sec!=null?x.end_sec:x.end_ms!=null?number(x.end_ms)/1000:x.end;
      put(out,x.segment_type||x.type||'intro',s,e,'IntroDB',x.confidence,{});
    });
    else if(payload&&typeof payload==='object'){
      if(payload.start_sec!=null||payload.start_ms!=null)put(out,payload.segment_type||payload.type||'intro',
        payload.start_sec!=null?payload.start_sec:number(payload.start_ms)/1000,
        payload.end_sec!=null?payload.end_sec:number(payload.end_ms)/1000,'IntroDB',payload.confidence);
      TYPES.concat(['outro']).forEach(function(type){
        var a=payload[type];(Array.isArray(a)?a:a?[a]:[]).forEach(function(x){
          if(!x)return;
          put(out,type,x.start_sec!=null?x.start_sec:x.start_ms!=null?number(x.start_ms)/1000:x.start,
            x.end_sec!=null?x.end_sec:x.end_ms!=null?number(x.end_ms)/1000:x.end,'IntroDB',x.confidence);
        });
      });
    }
    return out;
  }
  function parseTheIntroDB(data) {
    if(!data)return [];
    var out=[], payload=data.segments||data;
    if(Array.isArray(payload))return parseTheIntroDB({segments:{intro:payload}});
    TYPES.concat(['outro']).forEach(function(type){
      var a=payload[type];(Array.isArray(a)?a:a?[a]:[]).forEach(function(x){
        if(!x)return;
        put(out,type,x.start_ms!=null?number(x.start_ms)/1000:x.start,
          x.end_ms!=null?number(x.end_ms)/1000:x.end,'TheIntroDB',0.6);
      });
    });return out;
  }
  function parseAniSkip(data,length) {
    var out=[];if(!data||data.found!==true||!Array.isArray(data.results))return out;
    data.results.forEach(function(x){
      if(!x||!x.interval)return;
      var n=number(x.episodeLength),exact=length>0&&isFinite(n)&&Math.abs(length-n)<=3;
      var unsafe=length>0&&isFinite(n)&&Math.abs(length-n)>15;
      if(unsafe)return;
      put(out,x.skipType,x.interval.startTime,x.interval.endTime,'AniSkip',exact?0.92:0.55,{unsafe:!exact});
    });return out;
  }
  function parseIntroHater(data){
    var out=[], arr=Array.isArray(data)?data:data&&Array.isArray(data.segments)?data.segments:[];
    arr.forEach(function(x){if(!x)return;
      put(out,x.type||x.label||x.segment_type,x.start_sec!=null?x.start_sec:x.start,
        x.end_sec!=null?x.end_sec:x.end,'IntroHater',0.5,{unsafe:true});
    });return out;
  }
  function fromLaunch(p,len) {
    p=p||{};var source=p.segments,pl=Array.isArray(p.playlist)?p.playlist:[];
    if(!source)for(var i=0;i<pl.length;i++)if(pl[i]&&pl[i].url===p.url){source=pl[i].segments;break;}
    var out=[], list=[];
    if(!source)return out;
    if(Array.isArray(source))list=source;
    else if(typeof source==='object'){
      if(Array.isArray(source.skip))list=list.concat(source.skip);
      if(Array.isArray(source.ad))source.ad.forEach(function(x){list.push({type:'ad',start:x.start,end:x.end});});
      TYPES.forEach(function(t){if(source[t])(Array.isArray(source[t])?source[t]:[source[t]]).forEach(function(x){
        list.push({type:t,start:x.start,end:x.end});
      });});
    }
    var declared=number(source.duration_ms),ratio=1;
    if(isFinite(declared)&&declared>0&&len>0){
      if(Math.abs(len-declared/1000)>20)return [];
      ratio=len/(declared/1000);
    }
    list.forEach(function(x){if(!x)return;put(out,x.type||'intro',number(x.start)*ratio,number(x.end)*ratio,'Lampa',1,{explicit:true});});
    return out;
  }
  function combine(injected,remote,manual,len) {
    var list=[], groups=[], result=[];
    (injected||[]).concat(remote||[],manual||[]).forEach(function(x){
      if(!x||TYPES.indexOf(x.type)<0||!isFinite(x.start)||!isFinite(x.end))return;
      if(len>0&&(x.start>len-2||x.end>len+1))return;
      list.push(x);
    });
    list.sort(function(a,b){return a.start-b.start;});
    // Each temporal cluster is independent; multiple adverts and credits markers survive.
    list.forEach(function(x){
      var match=null;
      for(var i=0;i<groups.length;i++)if(groups[i].type===x.type&&
        Math.abs(groups[i].start-x.start)<=12&&Math.abs(groups[i].end-x.end)<=12){match=groups[i];break;}
      if(!match){match={type:x.type,start:x.start,end:x.end,items:[]};groups.push(match);}
      match.items.push(x);
    });
    groups.forEach(function(g){
      // The launch payload and user edits take priority, regardless of network opinion.
      var preferred=g.items.filter(function(x){return x.source==='Manual'||x.source==='Lampa';});
      preferred.sort(function(a,b){return (a.source==='Manual'?1:0)-(b.source==='Manual'?1:0);});
      var winner=preferred[preferred.length-1],safe=false,items;
      if(winner){result.push({type:g.type,start:winner.start,end:winner.end,source:winner.source,trusted:true});return;}
      items=g.items.filter(function(x){return !x.unsafe;});
      var distinct=[],coords=[];
      items.forEach(function(x){if(distinct.indexOf(x.source)<0){distinct.push(x.source);coords.push(x);}});
      safe=distinct.length>=2 || items.some(function(x){return x.source==='SkipDB'&&x.quality>=0.85&&!x.unsafe;});
      if(!items.length){items=g.items;distinct=items.map(function(x){return x.source;});}
      var s=items.reduce(function(a,x){return a+x.start;},0)/items.length;
      var e=items.reduce(function(a,x){return a+x.end;},0)/items.length;
      result.push({type:g.type,start:Math.round(s*10)/10,end:Math.round(e*10)/10,
        source:distinct.join('+'),trusted:safe});
    });
    result.sort(function(a,b){return a.start-b.start;});
    return result;
  }
  function fingerprint(m,len) {
    var identity=m.imdb?'imdb-'+m.imdb:m.tmdb?'tmdb-'+m.tmdb:m.mal?'mal-'+m.mal:'unknown';
    return identity+'-s'+(m.season==null?'movie':m.season)+'-e'+(m.episode==null?'movie':m.episode)+'-d'+(len?Math.round(len/5)*5:'unknown');
  }
  function readManual(key) {var j=json(get('manual_'+key,[]));return Array.isArray(j)?j:[];}
  function saveManual(key,data) {set('manual_'+key,data.slice(0,40));}
  function appendManual(key,type,s,e) {
    var list=readManual(key),raw=[];put(raw,type,s,e,'Manual',1,{explicit:true});
    if(!raw.length)return false;
    list=list.filter(function(x){return x.type!==type||Math.abs(x.start-s)>10;});
    list.push(raw[0]);saveManual(key,list);return true;
  }
  function request(url){
    return new Promise(function(resolve){
      var xhr=new XMLHttpRequest(),done=false,timer=null;
      function finish(ok,val){if(done)return;done=true;if(timer)clearTimeout(timer);resolve({ok:ok,data:val});}
      try{
        xhr.open('GET',url,true);
        xhr.onreadystatechange=function(){if(xhr.readyState!==4)return;
          if(xhr.status>=200&&xhr.status<300){var obj=json(xhr.responseText);finish(!!obj,obj);}
          else finish(xhr.status===204||xhr.status===404,null);
        };
        xhr.onerror=function(){finish(false,null);};
        timer=setTimeout(function(){try{xhr.abort();}catch(e){}finish(false,null);},6500);
        xhr.send();
      }catch(e){finish(false,null);}
    });
  }
  function remoteRequests(m,len) {
    var jobs=[],q,serial=m.season!=null&&m.episode!=null;
    if(m.imdb){
      q='imdb_id='+encodeURIComponent(m.imdb)+(serial?'&season='+m.season+'&episode='+m.episode:'');
      jobs.push(request('https://api.skipdb.tv/api/segments?'+q+(len?'&duration='+Math.round(len):'')+'&adjust=conservative').then(function(r){return {ok:r.ok,items:parseSkipDB(r.data)};}));
      jobs.push(request('https://api.introdb.app/segments?'+q+(serial?'':'&is_movie=true')).then(function(r){return {ok:r.ok,items:parseIntroDB(r.data)};}));
    }
    if(serial&&m.tmdb)jobs.push(request('https://api.theintrodb.org/v2/media?tmdb_id='+m.tmdb+'&season='+m.season+'&episode='+m.episode)
      .then(function(r){return {ok:r.ok,items:parseTheIntroDB(r.data)};}));
    if(serial&&m.mal&&m.episode>0)jobs.push(request('https://api.aniskip.com/v2/skip-times/'+m.mal+'/'+m.episode+
      (len?'?episodeLength='+Math.round(len)+'&types=op&types=ed&types=recap':'?types=op&types=ed&types=recap'))
      .then(function(r){return {ok:r.ok,items:parseAniSkip(r.data,len)};}));
    if(serial&&m.imdb&&on('introhater',false))jobs.push(request('https://introhater.com/api/skip/'+m.imdb+':'+m.season+':'+m.episode)
      .then(function(r){return {ok:r.ok,items:parseIntroHater(r.data)};}));
    return jobs;
  }
  function loadRemote(m,len) {
    var key=fingerprint(m,len),obj=json(get('remote_'+key,null));
    if(obj && obj.timestamp && Date.now()-obj.timestamp<86400000 && Array.isArray(obj.items))
      return Promise.resolve(obj.items);
    var jobs=remoteRequests(m,len);if(!jobs.length)return Promise.resolve([]);
    return Promise.all(jobs.map(function(p){return p.catch(function(){return {ok:false,items:[]};});}))
      .then(function(a){
        var out=[],succeeded=false;
        a.forEach(function(x){if(x.ok)succeeded=true;if(Array.isArray(x.items))out=out.concat(x.items);});
        if(succeeded)set('remote_'+key,{timestamp:Date.now(),items:out.slice(0,60)});
        return out;
      });
  }
  function make(tag,cls,label) {var el=document.createElement(tag);if(cls)el.className=cls;if(label!=null)el.textContent=label;return el;}
  function css() {
    if(styleReady || document.getElementById('arx-tools-style')){styleReady=true;return;}
    var e=make('style');e.id='arx-tools-style';
    e.textContent='.arx-tools-quick,.arx-tools-skip,.arx-tools-undo,.arx-tools-panel button{background:rgba(16,24,32,.93);color:#fff;border:1px solid #ffffff55;border-radius:10px;padding:9px 13px;font:inherit;cursor:pointer}.arx-tools-quick{position:absolute;right:2%;bottom:11%;z-index:8503;font-size:.86em}.arx-tools-skip{position:absolute;right:2%;bottom:21%;z-index:8503}.arx-tools-undo{position:absolute;right:2%;bottom:32%;z-index:8503}.arx-tools-quick:focus,.arx-tools-skip:focus,.arx-tools-undo:focus,.arx-tools-panel button:focus{outline:3px solid #fff}.arx-tools-panel{position:absolute;right:2%;bottom:20%;max-height:65%;width:min(560px,94%);box-sizing:border-box;overflow:auto;background:rgba(15,20,29,.96);color:#fff;padding:15px;border-radius:12px;z-index:8510;box-shadow:0 4px 20px #000a}.arx-tools-panel-title{font-weight:bold;font-size:1.1em;margin-bottom:8px}.arx-tools-panel-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.arx-tools-panel button{font-size:.9em}.arx-tools-info{position:absolute;right:2%;top:6%;color:#fff;background:#000a;padding:7px 12px;border-radius:8px;font-size:.80em;z-index:8501;pointer-events:none;white-space:pre-line}.arx-tools-dual{position:absolute;bottom:8%;left:5%;width:90%;z-index:8502;color:#f5e2a4;text-align:center;font-size:1.05em;text-shadow:1px 2px 4px #000,0 0 3px #000;pointer-events:none}.arx-tools-markers{position:absolute;inset:0;pointer-events:none;z-index:5}.arx-tools-marker{position:absolute;top:0;bottom:0;width:3px;opacity:.8;background:#e4d788;pointer-events:none}.arx-tools-marker[data-type="credits"]{background:#67c0e5}.arx-tools-marker[data-type="recap"]{background:#d9a0e8}.arx-tools-marker[data-type="ad"]{background:#df8888}.arx-tools-legend{font-size:.78em;opacity:.84;margin:4px 0}';
    document.head.appendChild(e);styleReady=true;
  }
  function placeRoot(){return document.querySelector('.player')||document.body;}
  function controls() {
    css();
    if(control.quick)return;
    control.quick=make('button','arx-tools-quick','ARX');control.quick.type='button';
    control.skip=make('button','arx-tools-skip');control.skip.type='button';control.skip.style.display='none';
    control.undo=make('button','arx-tools-undo','Отменить перемотку');control.undo.type='button';control.undo.style.display='none';
    control.info=make('div','arx-tools-info');control.info.style.display='none';
    control.dual=make('div','arx-tools-dual');control.dual.style.display='none';
    control.panel=make('div','arx-tools-panel');control.panel.style.display='none';
    control.quick.addEventListener('click',togglePanel);
    control.skip.addEventListener('click',skipNow);control.undo.addEventListener('click',undo);
    ['quick','skip','undo','info','dual','panel'].forEach(function(k){placeRoot().appendChild(control[k]);});
  }
  function mountControls() {
    if(!control.quick)return;var root=placeRoot();
    ['quick','skip','undo','info','dual','panel'].forEach(function(k){
      if(control[k]&&control[k].parentNode!==root)root.appendChild(control[k]);
    });
    control.quick.style.display=on('quick',true)?'block':'none';
  }
  function clearChildren(el) {while(el&&el.firstChild)el.removeChild(el.firstChild);}
  function panelButton(row,title,fn) {
    var b=make('button','',title);b.type='button';b.addEventListener('click',fn);row.appendChild(b);return b;
  }
  function line(parent,label){var d=make('div','arx-tools-panel-row');parent.appendChild(d);if(label)d.appendChild(make('span','',label));return d;}
  function closePanel(){if(control.panel)control.panel.style.display='none';}
  function togglePanel(){if(!current)return;var shown=control.panel.style.display!=='none';if(shown)closePanel();else renderPanel();}
  function seekable(v,target) {
    if(!v||!isFinite(target)||target<0||!isFinite(v.duration)||v.duration<=0)return false;
    try {
      var ranges=v.seekable;
      if(ranges&&ranges.length){for(var i=0;i<ranges.length;i++)if(target>=ranges.start(i)&&target<=ranges.end(i)+0.2)return true;return false;}
      // Some engines omit seekable despite supporting currentTime.
      return true;
    }catch(e){return false;}
  }
  function skipNow() {
    if(!current||!current.hover)return;
    var v=playerVideo(),s=current.hover,target=Math.min(s.end,duration()-0.1);
    if(!seekable(v,target)||target<=v.currentTime)return notice('ARX: поток не поддерживает перемотку');
    var previous=v.currentTime;
    current.lastSkip={segment:s,position:previous};current.ignored[s.type+'-'+s.start]=true;current.hover=null;
    control.skip.style.display='none';clearUndo();
    try{v.currentTime=target;}catch(e){notice('ARX: ошибка перемотки');return;}
    control.undo.style.display='block';undoTimer=setTimeout(clearUndo,10000);
  }
  function clearUndo(){if(undoTimer)clearTimeout(undoTimer);undoTimer=null;if(control.undo)control.undo.style.display='none';}
  function undo() {
    if(!current||!current.lastSkip)return;
    var v=playerVideo(),item=current.lastSkip;current.lastSkip=null;
    if(seekable(v,item.position)){try{v.currentTime=item.position;}catch(e){}}
    current.ignored[item.segment.type+'-'+item.segment.start]=true;clearUndo();
  }
  function renderPanel(){
    controls();var p=control.panel;clearChildren(p);
    p.appendChild(make('div','arx-tools-panel-title','ARX Player Tools '+VERSION));
    var v=playerVideo(),now=time(),m=current&&current.meta;
    p.appendChild(make('div','arx-tools-legend',(m?(m.imdb||m.tmdb||m.mal||'без ID')+' · '+(m.movie?'фильм':'S'+m.season+'E'+m.episode):'')+
      ' · '+fmt(now)+' / '+fmt(duration())));
    var segments=current?current.segments:[];
    var found=segments.length?segments.map(function(s){return NAMES[s.type]+' '+fmt(s.start)+'–'+fmt(s.end)+' ['+s.source+(s.trusted?' ✓':' ?')+']';}).join('\n'):'В базах нет меток';
    var list=make('div','arx-tools-legend',found);list.style.whiteSpace='pre-line';p.appendChild(list);
    var row=line(p);
    panelButton(row,'Перепроверить базы',function(){refreshRemote(true);closePanel();});
    panelButton(row,'−10 секунд',function(){if(v&&seekable(v,Math.max(0,v.currentTime-10)))v.currentTime=Math.max(0,v.currentTime-10);});
    panelButton(row,'+30 секунд',function(){if(v&&seekable(v,v.currentTime+30))v.currentTime+=30;});
    var types=line(p);
    var selected=current?current.editType:'intro';
    TYPES.forEach(function(t){
      var btn=panelButton(types,(selected===t?'● ':'')+NAMES[t],function(){if(current){current.editType=t;renderPanel();}});
      if(selected===t)btn.style.borderColor='#e0c56b';
    });
    var edit=line(p);
    panelButton(edit,'Отметить начало',function(){if(current&&isFinite(time())){current.markStart=time();notice('Начало '+fmt(current.markStart));renderPanel();}});
    panelButton(edit,'Сохранить конец',function(){
      if(!current||!isFinite(current.markStart)||!isFinite(time())||time()<=current.markStart+3)return notice('Отметьте сначала начало и затем конец сегмента');
      if(appendManual(current.key,current.editType,current.markStart,time())){
        current.markStart=null;mergeCurrent();renderPanel();notice('ARX: сегмент сохранён только для этой серии и версии файла');
      }
    });
    panelButton(edit,'Удалить свои метки этого типа',function(){
      if(!current)return;var old=readManual(current.key),keep=old.filter(function(x){return x.type!==current.editType;});
      saveManual(current.key,keep);mergeCurrent();renderPanel();
    });
    var playback=line(p);
    [0.75,1,1.25,1.5,2].forEach(function(n){panelButton(playback,n+'×',function(){
      if(v){v.playbackRate=n;notice('Скорость '+n+'×');}
    });});
    var extra=line(p);
    panelButton(extra,'Таймер +15 мин',function(){scheduleSleep(15,true);});
    panelButton(extra,'Таймер +30 мин',function(){scheduleSleep(30,true);});
    panelButton(extra,'Отменить таймер',function(){cancelSleep();notice('Таймер выключен');});
    if(current&&current.lastSkip){var undoRow=line(p);panelButton(undoRow,'Вернуть пропущенное',undo);}
    var last=line(p);panelButton(last,'Закрыть',closePanel);
    p.style.display='block';
    try{var b=p.querySelector&&p.querySelector('button');if(b&&b.focus)b.focus();}catch(e){}
  }
  function locateTimeline(){
    var targets=['.player-time__progress','.player-panel__timeline','.player-panel__progress','.player-progress','.player-timeline','.player-time','.player-line'];
    for(var i=0;i<targets.length;i++){
      var el=document.querySelector(targets[i]);
      if(el&&el.getBoundingClientRect){var b=el.getBoundingClientRect();if(b.width>80&&b.height>1&&b.height<90)return el;}
    }
    return null;
  }
  function updateTimeline(){
    if(!current||!on('markers',true)||duration()<=0)return;
    var host=locateTimeline();if(!host)return;
    if(current.markerHost!==host){
      if(current.markerNode&&current.markerNode.parentNode)current.markerNode.parentNode.removeChild(current.markerNode);
      var node=make('div','arx-tools-markers');
      // Only attach if timeline already has a positioning context.
      if(window.getComputedStyle && window.getComputedStyle(host).position==='static')return;
      host.appendChild(node);current.markerNode=node;current.markerHost=host;current.markerFingerprint='';
    }
    var fp=current.segments.map(function(s){return s.type+':'+s.start+':'+s.end;}).join('|')+'|'+duration();
    if(fp===current.markerFingerprint)return;
    current.markerFingerprint=fp;clearChildren(current.markerNode);
    current.segments.forEach(function(s){
      var marker=make('div','arx-tools-marker');marker.setAttribute('data-type',s.type);
      marker.style.left=(100*s.start/duration()).toFixed(3)+'%';current.markerNode.appendChild(marker);
      var end=make('div','arx-tools-marker');end.setAttribute('data-type',s.type);
      end.style.left=(100*s.end/duration()).toFixed(3)+'%';end.style.opacity='0.4';current.markerNode.appendChild(end);
    });
  }
  function hideSkip(){if(control.skip)control.skip.style.display='none';if(current)current.hover=null;}
  function tick(){
    if(!current)return;
    var v=playerVideo();if(!v)return;
    if(attachedVideo!==v)bindVideo();
    mountControls();
    var now=number(v.currentTime);
    if(isFinite(now)&&on('skip',true)&&!window.__skipIntroLoaded&&on('skip_ui',true)){
      var found=null;
      current.segments.some(function(s){
        if(!on('type_'+s.type,s.type!=='preview'&&s.type!=='ad'&&s.type!=='postcredits'))return false;
        if(current.ignored[s.type+'-'+s.start])return false;
        if(now>=s.start&&now<s.end-0.5){found=s;return true;}
        return false;
      });
      if(found){
        var key=found.type+'-'+found.start,auto=on('auto',false)&&found.trusted&&
          found.type!=='ad'&&found.type!=='preview'&&found.type!=='postcredits';
        if(auto&&!current.auto[key]&&now>=found.start+0.1){
          current.auto[key]=true;current.hover=found;skipNow();
        }else if(!current.auto[key]){
          control.skip.textContent='Пропустить: '+NAMES[found.type]+' ('+fmt(found.end-now)+')'+(found.trusted?'':' · проверить');
          control.skip.style.display='block';current.hover=found;
        }
      }else hideSkip();
    }else hideSkip();
    if(on('info',false)&&isFinite(now)&&duration()>0){
      var remain=Math.max(0,(duration()-now)/(number(v.playbackRate)>0?v.playbackRate:1)),end=new Date(Date.now()+remain*1000);
      var text='Осталось '+fmt(remain)+' · До '+('0'+end.getHours()).slice(-2)+':'+('0'+end.getMinutes()).slice(-2);
      if(on('stats',false)){
        text+='\n'+v.videoWidth+'×'+v.videoHeight+' · '+(v.playbackRate||1)+'×';
        try{if(v.buffered&&v.buffered.length){
          var en=v.buffered.end(v.buffered.length-1);text+=' · Буфер '+Math.max(0,Math.round(en-now))+' с';
        }}catch(e){}
      }
      control.info.textContent=text;control.info.style.display='block';
    }else if(control.info)control.info.style.display='none';
    renderSecondary();
    updateTimeline();
  }
  function setSecondaryTrack(track){
    if(dualTrack===track)return;
    restoreTrack();
    if(track && track.mode!=='showing') {
      dualTrack=track;dualMode=track.mode;
      try{track.mode='hidden';}catch(e){dualTrack=null;}
    }
  }
  function restoreTrack(){
    if(dualTrack){try{dualTrack.mode=dualMode;}catch(e){}}
    dualTrack=null;dualMode=null;
    if(control.dual)control.dual.style.display='none';
  }
  function pickSecondary(){
    if(!on('dualsubs',false)){restoreTrack();return;}
    var v=playerVideo(),tracks=v&&v.textTracks;
    if(!tracks||!tracks.length){restoreTrack();return;}
    var lang=String(get('dual_lang','en')).toLowerCase(),choice=null;
    for(var i=0;i<tracks.length;i++){
      var tr=tracks[i],code=String(tr.language||tr.label||'').toLowerCase();
      if(tr.kind!=='subtitles'&&tr.kind!=='captions')continue;
      if(tr.mode==='showing')continue; // never override the current primary subtitle
      if(code===lang||code.indexOf(lang+'-')===0||code.indexOf(lang+' ')>=0){choice=tr;break;}
    }
    setSecondaryTrack(choice);
  }
  function renderSecondary(){
    if(!control.dual)return;
    if(!on('dualsubs',false)){if(dualTrack)restoreTrack();return;}
    if(!dualTrack)pickSecondary();
    if(!dualTrack)return;
    var cues=dualTrack.cues,t=time()+number(get('dual_delay',0)),parts=[];
    if(!cues||!isFinite(t))return;
    for(var i=0;i<cues.length&&parts.length<2;i++){
      var c=cues[i];if(c.startTime<=t&&c.endTime>=t){
        var msg=String(c.text||'').replace(/<[^>]*>/g,'').trim();if(msg)parts.push(msg);
      }
    }
    control.dual.textContent=parts.join('\n');control.dual.style.display=parts.length?'block':'none';
    control.dual.style.bottom=get('dual_pos','8')+'%';
  }
  function bindVideo(){
    var v=playerVideo();if(!v||attachedVideo===v)return;
    if(attachedVideo){
      ['timeupdate','loadedmetadata','durationchange','emptied','ended','ratechange'].forEach(function(k){
        try{attachedVideo.removeEventListener(k,videoEvent);}catch(e){}
      });
    }
    restoreTrack();attachedVideo=v;
    ['timeupdate','loadedmetadata','durationchange','emptied','ended','ratechange'].forEach(function(k){v.addEventListener(k,videoEvent);});
    var preset=number(get('speed',1));
    if(preset>0&&preset!==1){try{v.playbackRate=preset;}catch(e){}}
    setTimeout(function(){pickSecondary();tick();},50);
  }
  function videoEvent(e){
    if(e&&e.type==='ended')return onEnd();
    if(e&&(e.type==='loadedmetadata'||e.type==='durationchange')) {
      if(current && !current.durationKnown && duration()>0){
        current.durationKnown=true;refreshRemote(false);mergeCurrent();
      }
      pickSecondary();
    }
    if(e&&e.type==='emptied')hideSkip();
    tick();
  }
  function clearFade(restore){
    if(fadeId)clearInterval(fadeId);fadeId=null;
    if(sleepOriginalVolume!=null){
      var v=playerVideo();if(restore&&v){try{v.volume=sleepOriginalVolume;}catch(e){}}
      sleepOriginalVolume=null;
    }
  }
  function cancelSleep(){
    if(sleepId)clearTimeout(sleepId);sleepId=null;scheduledEnd=0;clearFade(true);
  }
  function scheduleSleep(minutes,manual){
    cancelSleep();var ms=minutes*60000;if(!isFinite(ms)||ms<1000||ms>43200000)return;
    scheduledEnd=Date.now()+ms;
    var token=playerToken;
    if(on('fade',false)&&ms>30000){
      fadeId=setInterval(function(){
        if(token!==playerToken)return clearFade(true);
        var v=playerVideo(),remain=scheduledEnd-Date.now();
        if(!v)return;
        if(remain<=30000&&remain>0){
          if(sleepOriginalVolume==null)sleepOriginalVolume=v.volume;
          try{v.volume=Math.max(0,sleepOriginalVolume*remain/30000);}catch(e){}
        }
      },1000);
    }
    sleepId=setTimeout(function(){
      sleepId=null;scheduledEnd=0;clearFade(false);
      if(token!==playerToken)return;
      var v=playerVideo();if(v){try{v.pause();}catch(e){}}
      notice('ARX: таймер сна — пауза');
      // Restore volume so the next playback is not silent.
      clearFade(true);
    },ms);
    if(manual)notice('Таймер: '+minutes+' минут');
  }
  function onEnd(){if(get('sleep','off')==='end'){var v=playerVideo();if(v){try{v.pause();}catch(e){}}}}
  function refreshRemote(force){
    if(!current)return;
    var token=playerToken,ref=current,m=ref.meta,len=duration();
    if(force)set('remote_'+fingerprint(m,len),null);
    loadRemote(m,len).then(function(segments){
      if(token!==playerToken||current!==ref)return;
      ref.remote=segments;mergeCurrent();log('Remote segments',segments.length);
    }).catch(function(e){log('Remote unavailable',String(e));});
  }
  function mergeCurrent(){
    if(!current)return;
    var vlen=duration();
    current.key=fingerprint(current.meta,vlen);
    current.injected=fromLaunch(current.data,vlen);
    current.segments=combine(current.injected,current.remote,readManual(current.key),vlen);
    current.markerFingerprint='';tick();
  }
  function clearEpisode(){
    playerToken++;
    if(cacheTimer)clearTimeout(cacheTimer);cacheTimer=null;
    cancelSleep();restoreTrack();hideSkip();clearUndo();closePanel();
    if(current && current.markerNode && current.markerNode.parentNode)current.markerNode.parentNode.removeChild(current.markerNode);
    current=null;
    if(control.info)control.info.style.display='none';
    if(control.quick)control.quick.style.display='none';
    if(attachedVideo) {
      ['timeupdate','loadedmetadata','durationchange','emptied','ended','ratechange'].forEach(function(k){
        try{attachedVideo.removeEventListener(k,videoEvent);}catch(e){}
      });
      attachedVideo=null;
    }
  }
  function playerStart(data){
    var p=data&&(data.data||data)||{},m=metadata(p);
    var unique=String(p.url||'')+'|'+(m.imdb||m.tmdb||m.mal||'')+'|'+m.season+'|'+m.episode;
    if(current&&current.unique===unique&&unique!=='|null|null'){bindVideo();return;}
    clearEpisode();controls();
    current={unique:unique,meta:m,data:p,remote:[],injected:[],segments:[],ignored:{},auto:{},key:'',
      durationKnown:duration()>0,hover:null,lastSkip:null,editType:'intro',markStart:null,
      markerHost:null,markerNode:null,markerFingerprint:''};
    bindVideo();mountControls();mergeCurrent();
    var timer=get('sleep','off'),minutes=positiveInt(timer);
    if(minutes>0)scheduleSleep(minutes,false);
    if(on('skip',true)&&!window.__skipIntroLoaded)refreshRemote(false);
    tick();
  }
  function loadSubtitles(){
    if(!on('subs',false))return;
    try{
      var plugins=json(L.Storage.get('plugins',[]))||[];
      if(Array.isArray(plugins)&&plugins.some(function(x){return x&&String(x.url||'').indexOf('opensubtitles_ru.js')>=0;}))return;
      if(document.querySelector('script[data-arx-subs]'))return;
      var s=make('script');s.src=SUBS_URL;s.async=true;s.setAttribute('data-arx-subs','1');
      s.onerror=function(){notice('OpenSubtitles RU: ошибка загрузки');};
      document.head.appendChild(s);
    }catch(e){log('OpenSubtitles loader',e);}
  }
  function setupItem(key,type,name,def,values){
    var param={name:NS+key,type:type,default:def};if(values)param.values=values;
    L.SettingsApi.addParam({component:'arx_player_tools',param:param,field:{name:name}});
  }
  function settings(){
    L.SettingsApi.addComponent({component:'arx_player_tools',name:'ARX Player Tools',after:'player',
      icon:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 4 12 8-12 8V4Z"/><path d="M20 4v16"/></svg>'});
    setupItem('skip','trigger','Пропуск заставок и титров',true);
    setupItem('auto','trigger','Автопропуск только подтверждённых сегментов',false);
    setupItem('skip_ui','trigger','Кнопка пропуска на экране',true);
    setupItem('markers','trigger','Метки на шкале времени (если поддерживается)',true);
    setupItem('type_intro','trigger','Пропуск заставок',true);
    setupItem('type_recap','trigger','Пропуск рекапов',true);
    setupItem('type_credits','trigger','Пропуск титров',true);
    setupItem('type_preview','trigger','Пропуск анонсов',false);
    setupItem('type_ad','trigger','Пропуск рекламы',false);
    setupItem('type_postcredits','trigger','Пропуск сцен после титров (осторожно)',false);
    setupItem('introhater','trigger','IntroHater (экспериментальный источник)',false);
    setupItem('quick','trigger','Показывать кнопку ARX с дополнительными функциями',true);
    setupItem('red_key','trigger','Красная кнопка пульта: пропустить',false);
    setupItem('info','trigger','Оставшееся время и время окончания',false);
    setupItem('stats','trigger','Информация о разрешении и буфере',false);
    setupItem('speed','select','Скорость при начале воспроизведения', '1',
      {'0.75':'0.75×','1':'1×','1.25':'1.25×','1.5':'1.5×','2':'2×'});
    setupItem('sleep','select','Таймер сна при старте видео', 'off',
      {off:'Выкл','15':'15 минут','30':'30 минут','45':'45 минут','60':'60 минут','90':'90 минут',end:'После окончания'});
    setupItem('fade','trigger','Тихое затухание громкости перед сном',false);
    setupItem('subs','trigger','Подключать OpenSubtitles RU (после перезапуска)',false);
    setupItem('dualsubs','trigger','Вторые HTML5-субтитры (экспериментально)',false);
    setupItem('dual_lang','select','Язык вторых субтитров','en',{en:'Английский',ru:'Русский',es:'Испанский',de:'Немецкий',fr:'Французский'});
    setupItem('dual_delay','select','Смещение вторых субтитров','0',
      {'-5':'−5 сек','-2':'−2 сек','-1':'−1 сек','0':'0 сек','1':'+1 сек','2':'+2 сек','5':'+5 сек'});
    setupItem('dual_pos','select','Вертикальное положение вторых субтитров','8',
      {'6':'Низко','8':'Ниже центра','16':'Выше'});
  }
  function keydown(e){
    if(!current||!e)return;
    if(e.key==='Escape'&&control.panel&&control.panel.style.display!=='none'){closePanel();return;}
    if((e.keyCode===403||e.keyCode===0x193)&&on('red_key',false)){
      if(control.skip&&control.skip.style.display!=='none'){e.preventDefault();e.stopPropagation();skipNow();}
    }
  }
  function init(){
    L=window.Lampa;if(mounted||!L||!L.Storage||!L.Player||!L.Player.listener||!L.SettingsApi)return;
    mounted=true;settings();controls();loadSubtitles();
    L.Player.listener.follow('start',playerStart);
    L.Player.listener.follow('ready',function(data){if(!current)playerStart(data);bindVideo();tick();});
    L.Player.listener.follow('destroy',clearEpisode);
    if(L.PlayerVideo&&L.PlayerVideo.listener)L.PlayerVideo.listener.follow('timeupdate',tick);
    if(!keyBound){keyBound=true;document.addEventListener('keydown',keydown,true);}
    if(window.__skipIntroLoaded)notice('ARX: сторонний Auto Skip включён; собственный пропуск отключён');
    log('Initialized. Use settings → ARX Player Tools.');
  }
  if(L&&L.Listener&&L.Listener.follow)L.Listener.follow('app',function(e){if(e&&e.type==='ready')init();});
  if(document.readyState==='complete'||document.readyState==='interactive')setTimeout(init,0);
  else document.addEventListener('DOMContentLoaded',init);
  var attempts=0,loader=setInterval(function(){init();if(mounted||++attempts>=50)clearInterval(loader);},300);
})();