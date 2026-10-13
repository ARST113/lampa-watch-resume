/* ARX Player Tools for Lampa 0.1.0
 * Independent enhancement for Lampa's INTERNAL HTML5 player.
 * Data sources: SkipDB, IntroDB, TheIntroDB. No analytics.
 */
(function () {
  'use strict';
  if (window.__ARX_PLAYER_TOOLS_01__) return;
  window.__ARX_PLAYER_TOOLS_01__ = true;
  var L = window.Lampa, NS = 'arx_tools_', VERSION = '0.1.0';
  var SUB_URL = 'https://m3dfatboi.github.io/lampa-opensubtitles-ru/opensubtitles_ru.js';
  var TYPES = ['intro', 'recap', 'credits', 'preview', 'ad'];
  var LABELS = {intro:'Пропустить заставку',recap:'Пропустить рекап',credits:'Пропустить титры',preview:'Пропустить анонс',ad:'Пропустить рекламу'};
  var active = null, count = 0, button = null, undoButton = null, info = null, boundVideo = null, sleepTimer = null, undoTimer = null;
  var css = false, started = false, keyHandler = null;

  function log() { try { console.log.apply(console, ['[ARX Player Tools]'].concat([].slice.call(arguments))); } catch(e) {} }
  function get(k,d) { try {var v=L.Storage.get(NS+k,d); return v === undefined || v === null ? d : v;} catch(e){return d;} }
  function enabled(k,d) {var v=get(k,d); return !(v === false || v === 'false' || v === 0 || v === '0');}
  function notify(msg) {try {if(L.Noty && L.Noty.show) L.Noty.show(msg);} catch(e){} }
  function number(v) {var n=Number(v); return isFinite(n) ? n : NaN;}
  function positiveInt(v) {var n=number(v); return isFinite(n) && n>=0 && Math.floor(n)===n ? n : null;}
  function video() {try {return L.PlayerVideo && L.PlayerVideo.video && L.PlayerVideo.video();} catch(e) {return null;}}
  function currentDuration() {var v=video(); return v && isFinite(v.duration) && v.duration>0 ? v.duration : 0;}
  function safeJSON(s) {try{return typeof s==='string' ? JSON.parse(s) : s;}catch(e){return null;}}
  function cardFrom(p) {
    var a=null; try{a=L.Activity && L.Activity.active && L.Activity.active();}catch(e){}
    return p.card || (a && (a.card || a.movie)) || {};
  }
  function metadata(p) {
    p=p || {};
    var c=cardFrom(p), ep=p.episode, season=p.season, im=p.imdb_id || c.imdb_id || c.imdb || '', tm=p.tmdb_id || c.id || '';
    var playlist=Array.isArray(p.playlist)?p.playlist:[];
    for(var i=0;i<playlist.length;i++){
      if(playlist[i] && (playlist[i].url===p.url || playlist.length===1)){
        season=season==null?(playlist[i].season!=null?playlist[i].season:playlist[i].s):season;
        ep=ep==null?(playlist[i].episode!=null?playlist[i].episode:playlist[i].e):ep;
        break;
      }
    }
    var name=String(p.title || p.name || '');
    var match=name.match(/(?:S|С)(\d{1,2})\s*(?:E|Е)(\d{1,3})/i);
    if(match){if(season==null)season=match[1];if(ep==null)ep=match[2];}
    im=String(im || '').trim();
    tm=String(tm || '').trim();
    return {imdb:/^tt\d{5,12}$/.test(im)?im:'',tmdb:/^\d+$/.test(tm)?tm:'',
      season:positiveInt(season),episode:positiveInt(ep)};
  }
  function streamPayload(p) {
    if(!p) return [];
    var seg=p.segments, playlist=Array.isArray(p.playlist)?p.playlist:[];
    if(!seg) for(var i=0;i<playlist.length;i++) if(playlist[i] && playlist[i].url===p.url){seg=playlist[i].segments;break;}
    if(!seg) return [];
    var raw=[], res=[];
    if(Array.isArray(seg))raw=seg;
    else if(typeof seg==='object'){
      if(Array.isArray(seg.skip)) seg.skip.forEach(function(x){raw.push({type:x.type||'intro',start:x.start,end:x.end});});
      if(Array.isArray(seg.ad)) seg.ad.forEach(function(x){raw.push({type:'ad',start:x.start,end:x.end});});
      TYPES.forEach(function(t){if(seg[t]) [].concat(seg[t]).forEach(function(x){raw.push({type:t,start:x.start,end:x.end});});});
    }
    var declared=number(seg && seg.duration_ms), runtime=currentDuration(), ratio=1;
    // Reject grossly mismatched duration instead of skipping arbitrary content.
    if(isFinite(declared) && declared>0 && runtime>0 && Math.abs(runtime-declared/1000)>20)return [];
    if(isFinite(declared) && declared>0 && runtime>0)ratio=runtime/(declared/1000);
    raw.forEach(function(x){var s=number(x.start)*ratio,e=number(x.end)*ratio;
      if(isFinite(s)&&isFinite(e)&&e>s&&e-s>=3&&e-s<1200)res.push({type:mapType(x.type),start:s,end:e,source:'launch',quality:1});
    });
    return res;
  }
  function mapType(t) {
    t=String(t||'intro').toLowerCase();
    if(t==='outro'||t==='ending'||t==='endcredits')return 'credits';
    if(t==='advertisement'||t==='commercial')return 'ad';
    if(t==='op'||t==='opening')return 'intro';
    return TYPES.indexOf(t)>=0?t:'intro';
  }
  function addSegment(out,t,s,e,source,quality) {
    s=number(s);e=number(e);
    if(!isFinite(s)||!isFinite(e)||s<0||e<=s||e-s<4||e-s>900)return;
    out.push({type:mapType(t),start:s,end:e,source:source,quality:quality||0.5});
  }
  function parseSkipDB(o) {
    var out=[];
    if(o && o.segments) Object.keys(o.segments).forEach(function(t){
      var x=o.segments[t]; if(!x || x.match==='out-of-range')return;
      if(number(x.confidence)<0.3)return;
      addSegment(out,t,number(x.start_ms)/1000,number(x.end_ms)/1000,'SkipDB',Math.min(1,Math.max(0.3,number(x.confidence)||0.6)));
    });
    return out;
  }
  function parseIntroDB(o) {
    var out=[], payload=o&&o.segments?o.segments:o;
    if(Array.isArray(payload)) payload.forEach(function(x){if(!x)return;
      var s=x.start_sec!=null?x.start_sec:x.start, e=x.end_sec!=null?x.end_sec:x.end;
      if(typeof s==='string'&&s.indexOf(':')>=0)s=parseClock(s);
      if(typeof e==='string'&&e.indexOf(':')>=0)e=parseClock(e);
      if(s==null&&x.start_ms!=null)s=number(x.start_ms)/1000;
      if(e==null&&x.end_ms!=null)e=number(x.end_ms)/1000;
      addSegment(out,x.segment_type||x.type,s,e,'IntroDB',0.7);
    });
    else if(payload&&typeof payload==='object') TYPES.concat(['outro']).forEach(function(t){
      var arr=payload[t]; if(arr&&!Array.isArray(arr))arr=[arr];
      (arr||[]).forEach(function(x){
        if(!x)return;
        var s=x.start_sec!=null?x.start_sec:x.start_ms!=null?number(x.start_ms)/1000:x.start;
        var e=x.end_sec!=null?x.end_sec:x.end_ms!=null?number(x.end_ms)/1000:x.end;
        if(typeof s==='string'&&s.indexOf(':')>=0)s=parseClock(s);
        if(typeof e==='string'&&e.indexOf(':')>=0)e=parseClock(e);
        addSegment(out,t,s,e,'IntroDB',0.7);
      });
    });
    return out;
  }
  function parseClock(v) {
    var a=String(v).split(':').map(Number), x=0;
    if(!a.length||a.length>3||a.some(function(i){return !isFinite(i)||i<0;}))return NaN;
    for(var i=0;i<a.length;i++)x=x*60+a[i]; return x;
  }
  function parseTheIntroDB(o) {
    var out=[];
    if(!o)return out;
    var z=o.segments||o;
    if(Array.isArray(z))return parseIntroDB({segments:z});
    TYPES.concat(['outro']).forEach(function(t){
      var list=z[t]; if(!list)return;
      (Array.isArray(list)?list:[list]).forEach(function(x){
        if(!x)return;
        var s=x.start_ms!=null?number(x.start_ms)/1000:x.start_sec!=null?x.start_sec:x.start;
        var e=x.end_ms!=null?number(x.end_ms)/1000:x.end_sec!=null?x.end_sec:x.end;
        addSegment(out,t,s,e,'TheIntroDB',0.7);
      });
    });
    return out;
  }
  function request(url) {
    return new Promise(function(resolve){
      var xhr=new XMLHttpRequest(), ended=false;
      var timer=setTimeout(function(){if(!ended){ended=true;try{xhr.abort();}catch(e){}resolve(null);}},5500);
      try {
        xhr.open('GET',url,true);
        xhr.onreadystatechange=function(){
          if(xhr.readyState!==4||ended)return;
          ended=true;clearTimeout(timer);
          resolve(xhr.status>=200&&xhr.status<300?safeJSON(xhr.responseText):null);
        };
        xhr.onerror=function(){if(!ended){ended=true;clearTimeout(timer);resolve(null);}};
        xhr.send();
      }catch(e){if(!ended){ended=true;clearTimeout(timer);resolve(null);}}
    });
  }
  function cacheKey(m){return 'segments_'+(m.imdb||'')+'_'+(m.tmdb||'')+'_'+m.season+'_'+m.episode;}
  function loadRemote(m) {
    var key=cacheKey(m), cached=safeJSON(get(key,null));
    if(cached && Date.now()-cached.time<86400000 && Array.isArray(cached.items))return Promise.resolve(cached.items);
    var jobs=[], q=[];
    if(m.imdb){
      q=['imdb_id='+encodeURIComponent(m.imdb)];
      if(m.season!=null && m.episode!=null)q.push('season='+m.season,'episode='+m.episode);
      var d=currentDuration();if(d)q.push('duration='+Math.round(d));
      jobs.push(request('https://api.skipdb.tv/api/segments?'+q.join('&')).then(parseSkipDB));
      q=['imdb_id='+encodeURIComponent(m.imdb)];
      if(m.season!=null && m.episode!=null)q.push('season='+m.season,'episode='+m.episode);
      else q.push('is_movie=true');
      jobs.push(request('https://api.introdb.app/segments?'+q.join('&')).then(parseIntroDB));
    }
    if(m.tmdb&&m.season!=null&&m.episode!=null)
      jobs.push(request('https://api.theintrodb.org/v2/media?tmdb_id='+encodeURIComponent(m.tmdb)+'&season='+m.season+'&episode='+m.episode).then(parseTheIntroDB));
    if(!jobs.length)return Promise.resolve([]);
    return Promise.all(jobs.map(function(p){return p.catch(function(){return [];});})).then(function(results){
      var list=[];results.forEach(function(a){if(Array.isArray(a))list=list.concat(a);});
      try{L.Storage.set(NS+key,{time:Date.now(),items:list});}catch(e){}
      return list;
    });
  }
  function bestSegments(injected,remote,duration) {
    var byType={}, out=[];
    TYPES.forEach(function(t){byType[t]=[];});
    remote.concat(injected).forEach(function(s){
      if(byType[s.type] && (!duration || s.start<duration) && s.end>s.start) byType[s.type].push(s);
    });
    TYPES.forEach(function(t){
      var values=byType[t];
      var primary=values.filter(function(s){return s.source==='launch';})[0];
      if(primary){out.push(Object.assign({},primary,{trusted:true}));return;}
      // Group independent sources with nearby boundaries, retaining source diversity.
      var clusters=[];
      values.forEach(function(s){
        var c=clusters.filter(function(x){return Math.abs(x.start-s.start)<=16 && Math.abs(x.end-s.end)<=16;})[0];
        if(!c){c={start:s.start,end:s.end,items:[]};clusters.push(c);}
        if(!c.items.some(function(x){return x.source===s.source;}))c.items.push(s);
      });
      clusters.sort(function(a,b){
        function score(c){return c.items.length*10+Math.max.apply(null,c.items.map(function(v){return v.quality;}));}
        return score(b)-score(a);
      });
      if(clusters.length){
        var c=clusters[0], items=c.items, first=items[0], strong=items.length>=2 || (first.source==='SkipDB'&&first.quality>=0.8);
        out.push({type:t,start:Math.round(items.reduce(function(a,x){return a+x.start;},0)/items.length*10)/10,
          end:Math.round(items.reduce(function(a,x){return a+x.end;},0)/items.length*10)/10,
          source:items.map(function(x){return x.source;}).join(' + '),trusted:strong});
      }
    });
    return out.sort(function(a,b){return a.start-b.start;});
  }
  function cssOnce(){
    if(css||document.getElementById('arx-player-tools-style')){css=true;return;}
    var node=document.createElement('style');node.id='arx-player-tools-style';
    node.textContent='.arx-tools-skip,.arx-tools-undo{position:absolute;right:2.5%;bottom:22%;background:rgba(14,19,25,.91);color:#fff;border:1px solid rgba(255,255,255,.5);border-radius:11px;padding:13px 18px;z-index:5002;font:inherit;font-size:1.05em;cursor:pointer;max-width:80%;box-shadow:0 4px 20px #0007}.arx-tools-undo{bottom:30%;background:rgba(25,30,40,.92)}.arx-tools-skip:focus,.arx-tools-undo:focus{outline:3px solid #fff}.arx-tools-info{position:absolute;right:2%;top:5%;font-size:.82em;color:white;background:rgba(0,0,0,.55);padding:5px 9px;z-index:5000;border-radius:6px;pointer-events:none}';
    document.head.appendChild(node);css=true;
  }
  function attach(){
    var base=document.querySelector('.player')||document.body;
    if(button&&button.parentNode!==base)base.appendChild(button);
    if(undoButton&&undoButton.parentNode!==base)base.appendChild(undoButton);
    if(info&&info.parentNode!==base)base.appendChild(info);
  }
  function element(cls){
    var e=document.createElement('button');e.type='button';e.className=cls;e.style.display='none';return e;
  }
  function controls(){
    cssOnce();
    if(!button){button=element('arx-tools-skip');button.addEventListener('click',skipNow);}
    if(!undoButton){undoButton=element('arx-tools-undo');undoButton.textContent='Отменить пропуск';undoButton.addEventListener('click',undo);}
    if(!info){info=document.createElement('div');info.className='arx-tools-info';info.style.display='none';}
    attach();
  }
  function hide(){if(button)button.style.display='none';if(active)active.shownKey='';}
  function clearUndo(){if(undoTimer)clearTimeout(undoTimer);undoTimer=null;if(undoButton)undoButton.style.display='none';}
  function cleanup(){
    count++; active=null;hide();clearUndo();
    if(info)info.style.display='none';
    if(sleepTimer)clearTimeout(sleepTimer);sleepTimer=null;
    if(boundVideo){boundVideo.removeEventListener('timeupdate',videoTick);boundVideo.removeEventListener('ended',ended);boundVideo=null;}
  }
  function skipNow(){
    var a=active, v=video(); if(!a||!v||!a.current)return;
    var s=a.current, prev=v.currentTime, target=Math.min(s.end,isFinite(v.duration)?v.duration:s.end);
    if(target<=prev)return;
    clearUndo();a.skipped=s;hide();v.currentTime=target;
    undoButton.style.display='block';
    undoTimer=setTimeout(clearUndo,9000);
  }
  function undo(){
    var a=active,v=video(); if(a&&v&&a.skipped)v.currentTime=Math.max(0,a.skipped.start);
    if(a)a.skipped=null;
    clearUndo();
  }
  function format(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+('0'+sec%60).slice(-2);}
  function videoTick(){
    var a=active, v=video();if(!a||!v||!enabled('skip',true)){hide();return;}
    var t=number(v.currentTime);if(!isFinite(t))return;
    if(!button)controls();
    var hit=null;
    a.segments.some(function(s){
      if(t>=s.start && t<Math.min(s.end-0.35,s.start+900) && enabled('type_'+s.type,s.type!=='ad'&&s.type!=='preview')){hit=s;return true;}
      return false;
    });
    if(!hit||a.skipped===hit){hide();}
    else {
      var k=hit.type+':'+hit.start, shouldAuto=enabled('auto',false)&&hit.trusted&&hit.type!=='ad'&&hit.type!=='preview';
      if(shouldAuto && a.autoDone!==k){a.current=hit;a.autoDone=k;skipNow();return;}
      if(a.shownKey!==k){
        a.shownKey=k;a.current=hit;
        button.textContent=LABELS[hit.type]+(hit.trusted?'':' (проверить)')+' · '+format(hit.end-t);
        attach();button.style.display='block';
      }else button.textContent=LABELS[hit.type]+(hit.trusted?'':' (проверить)')+' · '+format(hit.end-t);
    }
    if(enabled('info',false) && v.duration>0){
      var remain=Math.max(0,v.duration-t)/((v.playbackRate&&v.playbackRate>0)?v.playbackRate:1);
      var finish=new Date(Date.now()+remain*1000);
      info.textContent='Осталось '+format(remain)+' · Конец '+('0'+finish.getHours()).slice(-2)+':'+('0'+finish.getMinutes()).slice(-2);
      info.style.display='block';
    }else if(info)info.style.display='none';
  }
  function ended(){if(get('sleep','off')==='end'){var v=video();if(v)v.pause();}}
  function bindVideo(){
    var v=video();if(!v||boundVideo===v)return;
    if(boundVideo){boundVideo.removeEventListener('timeupdate',videoTick);boundVideo.removeEventListener('ended',ended);}
    boundVideo=v;v.addEventListener('timeupdate',videoTick);v.addEventListener('ended',ended);
  }
  function sleep(){
    if(sleepTimer)clearTimeout(sleepTimer);sleepTimer=null;
    var minutes=positiveInt(get('sleep','off'));
    if(minutes&&minutes>0){sleepTimer=setTimeout(function(){
      var v=video();if(v && active){v.pause();notify('ARX: таймер сна — воспроизведение приостановлено');}
    },minutes*60000);}
  }
  function playerStart(data) {
    var p=data && (data.data || data) || {}, v=video();
    if(!p||typeof p!=='object')p={};
    // Avoid resetting a stream when Lampa emits both "start" and "ready".
    var url=String(p.url||''), id=url+'|'+(p.season||'')+'|'+(p.episode||'');
    if(active && active.id===id && id!=='||'){bindVideo();return;}
    cleanup();controls();
    var serial=count, m=metadata(p), injected=streamPayload(p);
    active={id:id,meta:m,payload:p,segments:bestSegments(injected,[],currentDuration()),shownKey:'',current:null,skipped:null,autoDone:''};
    bindVideo();sleep();videoTick();
    if(!enabled('skip',true))return;
    loadRemote(m).then(function(remote){
      if(serial!==count||!active)return;
      active.segments=bestSegments(injected,remote,currentDuration());videoTick();
      log('Segments',active.segments.length, m.imdb||m.tmdb||'provided only');
    }).catch(function(e){log('Lookup error',e);});
  }
  function keyDown(e){
    if(!active||!button||button.style.display==='none')return;
    // TV colour key 403 (red) is optional; Enter keeps normal Lampa focus rules.
    var isRed=(e.keyCode===403||e.keyCode===0x193);
    if(isRed && enabled('red_key',false)){e.preventDefault();e.stopPropagation();skipNow();}
  }
  function pluginListed(url){
    try {
      var p=safeJSON(L.Storage.get('plugins',[]))||[];
      return Array.isArray(p)&&p.some(function(x){return x && String(x.url||'').indexOf(url)>=0;});
    }catch(e){return false;}
  }
  function loadSubtitles(){
    if(!enabled('subs',false)||pluginListed('opensubtitles_ru.js'))return;
    if(document.querySelector('script[data-arx-subs]'))return;
    var tag=document.createElement('script');tag.src=SUB_URL;tag.async=true;tag.setAttribute('data-arx-subs','yes');
    tag.onerror=function(){notify('OpenSubtitles RU: не удалось загрузить модуль');};
    document.head.appendChild(tag);
  }
  function setting(k,type,name,values,defaultValue){
    var p={name:NS+k,type:type,default:defaultValue};
    if(values)p.values=values;
    L.SettingsApi.addParam({component:'arx_player_tools',param:p,field:{name:name}});
  }
  function initSettings(){
    if(!L.SettingsApi || !L.SettingsApi.addComponent)return;
    L.SettingsApi.addComponent({component:'arx_player_tools',name:'ARX Player Tools',after:'player',icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 4 12 8-12 8V4Z"/><path d="M20 4v16"/></svg>'});
    setting('skip','trigger','Пропуск заставок и титров',null,true);
    setting('auto','trigger','Автопропуск только надёжных меток',null,false);
    setting('type_intro','trigger','Заставки',null,true);
    setting('type_recap','trigger','Рекапы',null,true);
    setting('type_credits','trigger','Титры',null,true);
    setting('type_preview','trigger','Анонсы следующих серий',null,false);
    setting('type_ad','trigger','Рекламные сегменты',null,false);
    setting('red_key','trigger','Красная кнопка пульта: пропустить',null,false);
    setting('info','trigger','Время до конца фильма на экране',null,false);
    setting('sleep','select','Таймер сна (с начала воспроизведения)',{off:'Выключен','15':'15 минут','30':'30 минут','45':'45 минут','60':'60 минут','90':'90 минут',end:'После окончания видео'},'off');
    setting('subs','trigger','Загружать OpenSubtitles RU при старте Lampa (если отдельно не установлен)',null,false);
  }
  function init(){
    if(started||!L||!L.Player||!L.Player.listener||!L.SettingsApi)return;
    started=true;initSettings();controls();loadSubtitles();
    L.Player.listener.follow('start',playerStart);
    L.Player.listener.follow('ready',function(d){if(!active)playerStart(d);bindVideo();videoTick();});
    L.Player.listener.follow('destroy',cleanup);
    if(L.PlayerVideo&&L.PlayerVideo.listener)L.PlayerVideo.listener.follow('timeupdate',videoTick);
    keyHandler=keyDown;document.addEventListener('keydown',keyHandler,true);
    log('version',VERSION,'initialized');
  }
  if(L&&L.Listener&&L.Listener.follow)L.Listener.follow('app',function(ev){if(ev&&ev.type==='ready')init();});
  if(document.readyState==='complete'||document.readyState==='interactive')setTimeout(init,0);
  else document.addEventListener('DOMContentLoaded',init);
  var tries=0, retry=setInterval(function(){init();if(started||++tries>30)clearInterval(retry);},500);
})();