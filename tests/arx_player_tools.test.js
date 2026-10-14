'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
function run(exportsOnly=true, options={}) {
  let src=fs.readFileSync(path.join(__dirname,'..','arx_player_tools.js'),'utf8');
  src=src.replace(/\}\)\(\);\s*$/,"window.__test={metadata,mapType,clock,put,parseSkipDB,parseIntroDB,parseTheIntroDB,parseAniSkip,parseIntroHater,fromLaunch,combine,fingerprint,appendManual,readManual,readChapters,readSubtitleSuggestions,remoteRequests,playerStart,playerVideo,tick,subtitleNormalize,srtParse,subtitleServer,subtitleFind,subtitleSelect,subtitleTranslate,subtitleDisable,subtitlePublicUrls,subtitleDownloadUrl,aiConfiguration,aiTranslationBatches,aiParseTranslation,aiChatRequest,subtitleUseCues,subtitleCancelTranslation,on,playerPanelVisible,hidePlayerInfo,aiEnabled,aiEndpoint,aiSettingsVisibility,skipNow};})();");
  const handlers={},store={},settings=[],children=[],tvNodes=[],requests=[],timeouts=[];
  let panelVisible=Boolean(options.panelVisible),panelObserver=null;
  const mockPanel={classList:{contains(name){return name==='panel--visible'&&panelVisible;}}};
  mockPanel.setVisible=function(flag){panelVisible=!!flag;if(panelObserver)panelObserver.callback();};
  const video={
    duration:2820,currentTime:0,paused:false,volume:1,playbackRate:1,videoWidth:1920,videoHeight:1080,
    events:{},addEventListener(k,f){this.events[k]=f;},removeEventListener(k){delete this.events[k];},
    pause(){this.paused=true;},seekable:{length:1,start(){return 0;},end(){return 2820;}}
  };
  const div={
    appendChild(el){children.push(el);el.parentNode=this;return el;},
    removeChild(el){let idx=children.indexOf(el);if(idx>=0)children.splice(idx,1);el.parentNode=null;},
    querySelector(s){if(s==='.selector')return children.find(el=>(el.className||'').includes('selector'))||null;return null;},
    get firstChild(){return children[0]||null;}
  };
  const panelRight={children:[],appendChild(el){this.children.push(el);el.parentNode=this;return el;},
    querySelector(s){return this.children.find(x=>(x.className||'').includes(s.replace('.','')))||null;}};
  const activeTV={name:'player',selected:null,items:[],controllers:{},
    add(name,ctrl){this.controllers[name]=ctrl;},
    enabled(){return {name:this.name};},
    toggle(name){this.name=name;const ctrl=this.controllers[name];if(ctrl&&ctrl.toggle)ctrl.toggle();},
    collectionSet(el){this.collection=el;},
    collectionFocus(el){this.selected=el;}
  };
  const navigator={
    move(dir){
      const walk=(el)=>{let acc=[];if(!el)return acc;
        if((el.className||'').split(' ').includes('selector'))acc.push(el);
        (el.children||[]).forEach(x=>{acc=acc.concat(walk(x));});return acc;};
      const controls=walk(activeTV.collection);
      if(!controls.length)return;
      let i=controls.indexOf(activeTV.selected);
      let delta=dir==='up'||dir==='left'?-1:1;
      activeTV.selected=controls[(i+delta+controls.length)%controls.length];
    }
  };
  activeTV.add('player_panel',{toggle(){activeTV.collectionSet(panelRight);activeTV.collectionFocus(panelRight.children[0]||null);}});
  activeTV.add('player',{toggle(){activeTV.selected=null;}});

  const fakeDoc={
    readyState:exportsOnly?'loading':'complete',head:div,body:div,
    createElement(t){return {tagName:t,style:{},textContent:'',parentNode:null,children:[],
      addEventListener(k,f){this[k]=f;},setAttribute(){},
      appendChild(x){this.children.push(x);x.parentNode=this;return x;},
      removeChild(x){this.children.splice(this.children.indexOf(x),1);x.parentNode=null;},
      get firstChild(){return this.children[0]||null;},
      querySelector(sel){
        if(sel==='.selector')return this.children.find(x=>(x.className||'').split(' ').includes('selector'))||null;
        return null;
      },
      querySelectorAll(sel){
        if(sel!=='.selector')return [];
        const walk=(e)=>{let a=[];(e.children||[]).forEach(x=>{
          if((x.className||'').split(' ').includes('selector'))a.push(x);
          a=a.concat(walk(x));
        });return a;};return walk(this);
      }
    };},
    querySelector(s){if(s==='.player')return div;
      if(s==='.player-panel')return mockPanel;
      if(s==='.player-panel__right')return panelRight;return null;},
    getElementById(){return null;},addEventListener(){}
  };
  const fakeLampa={
    Storage:{get(k,def){return Object.hasOwn(store,k)?store[k]:def;},set(k,v){store[k]=v;}},
    Activity:{active(){return {card:{name:'Example',id:22,imdb_id:'tt1234567'}};}},
    PlayerVideo:{video(){return video;},listener:{follow(k,f){handlers['v:'+k]=f;}}},
    Player:{listener:{follow(k,f){handlers[k]=f;}}},
    Listener:{follow(k,f){handlers['app:'+k]=f;}},
    SettingsApi:{addComponent(x){settings.push(x);},addParam(x){settings.push(x);}},
    Noty:{show(){}},
    Controller:activeTV,Navigator:navigator
  };
  const window={Lampa:fakeLampa,Navigator:navigator,addEventListener(k,fn){handlers['window:'+k]=fn;}};
  window.MutationObserver=function(callback){
    this.callback=callback;
    this.observe=function(){panelObserver=this;};
    this.disconnect=function(){if(panelObserver===this)panelObserver=null;};
  };
  function XHR(){
    this.readyState=0;this.status=0;this.responseText='';
  }
  XHR.prototype.open=function(m,url){this.url=url;this.method=m;};
  XHR.prototype.setRequestHeader=function(k,v){this.headers=this.headers||{};this.headers[k]=v;};
  XHR.prototype.send=function(body){
    requests.push({url:this.url,method:this.method,body,headers:this.headers||{}});
    const response=options.xhrResponse&&options.xhrResponse(this.url,this.method,body);
    this.readyState=4;
    this.status=response?response.status:404;
    this.responseText=response?
      (typeof response.data==='string'?response.data:JSON.stringify(response.data)):'';this.onreadystatechange();
  };
  XHR.prototype.abort=function(){};
  const context={window,document:fakeDoc,console,
    XMLHttpRequest:XHR,setTimeout(fn,delay){timeouts.push({fn,delay});return timeouts.length;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},
    Date,Math,isFinite,Number,Array,Object,JSON,parseFloat,parseInt,Promise,encodeURIComponent};
  vm.runInNewContext(src,context);
  if(!exportsOnly && handlers['app:app'])handlers['app:app']({type:'ready'});
  return {api:window.__test,handlers,settings,store,video,children,window,document:fakeDoc,
    controller:activeTV,panelRight,navigator,requests,mockPanel,timeouts};
}
function plain(x){return JSON.parse(JSON.stringify(x));}
const e=run(),f=e.api;
test('metadata: IMDb/TMDB and SxxExx',()=>{
  assert.deepEqual(plain(f.metadata({title:'Example S01E03',card:{id:22,imdb_id:'tt1234567'}})),
    {imdb:'tt1234567',tmdb:'22',mal:null,season:1,episode:3,movie:false});
});
test('metadata: explicit playlist episodes and MAL IDs',()=>{
  let m=f.metadata({url:'second',playlist:[{url:'first',season:1,episode:1},{url:'second',season:2,episode:8,mal_id:55}]});
  assert.equal(m.season,2);assert.equal(m.episode,8);assert.equal(m.mal,55);
});
test('malicious/malformed media IDs are omitted from network query',()=>{
  let m=f.metadata({card:{imdb_id:'tt1234567&secret=1',id:'../../hello'},season:1,episode:1});
  assert.equal(m.imdb,'');assert.equal(m.tmdb,'');
});
test('parse SkipDB: milliseconds and confidence, out-of-range never trusted',()=>{
  let a=plain(f.parseSkipDB({segments:{intro:{start_ms:61000,end_ms:91000,confidence:.94,match:'exact'},outro:{start_ms:2760000,end_ms:2820000,confidence:.96,match:'out-of-range'}}}));
  assert.equal(a[0].start,61);assert.equal(a[0].end,91);assert.equal(a[0].unsafe,false);
  assert.equal(a[1].type,'credits');assert.equal(a[1].unsafe,true);
});
test('SkipDB empty-sentinel is not a zero-second skip',()=>{
  assert.equal(f.parseSkipDB({segments:{intro:{start_ms:0,end_ms:0,confidence:1}}}).length,0);
});
test('IntroDB: clock strings and array',()=>{
  let a=plain(f.parseIntroDB({segments:[{segment_type:'recap',start_sec:'0:01:10',end_sec:'0:02:00'}]}));
  assert.equal(a[0].start,70);assert.equal(a[0].end,120);
});
test('IntroDB: seconds and millisecond object forms',()=>{
  let a=plain(f.parseIntroDB({segments:{intro:[{start_ms:60000,end_ms:90000}]}}));
  assert.equal(a[0].start,60);
});
test('TheIntroDB: outro milliseconds',()=>{
  let a=plain(f.parseTheIntroDB({outro:[{start_ms:2700000,end_ms:2820000}]}));
  assert.equal(a[0].type,'credits');assert.equal(a[0].start,2700);
});
test('AniSkip: matched episode length, safely reject incompatible cut',()=>{
  let x={found:true,results:[{skipType:'op',episodeLength:1420,interval:{startTime:60,endTime:135}},{skipType:'ed',episodeLength:1420,interval:{startTime:1280,endTime:1420}}]};
  assert.equal(f.parseAniSkip(x,1420).length,2);
  assert.equal(f.parseAniSkip(x,1600).length,0);
  assert.equal(f.parseAniSkip(x,1420)[0].unsafe,false);
});
test('Introduction and post-credit scenes are distinct types',()=>{
  assert.equal(f.mapType('mixed-op'),'intro');
  assert.equal(f.mapType('post-credits'),'postcredits');
  assert.equal(f.mapType('unknown'),null);
});
test('Launch-provided segments take priority over external API',()=>{
  let launch=plain(f.fromLaunch({segments:{skip:[{start:60,end:90}]}},2820));
  let remote=[{type:'intro',start:62,end:91,source:'IntroDB',unsafe:false,quality:.6}];
  let x=plain(f.combine(launch,remote,[],2820));
  assert.equal(x[0].start,60);assert.equal(x[0].source,'Lampa');assert.equal(x[0].trusted,true);
});
test('Two independent agreeing sources can be auto-skipped',()=>{
  let x=plain(f.combine([],[{type:'intro',start:60,end:90,source:'IntroDB',unsafe:false,quality:.5},
  {type:'intro',start:62,end:91,source:'TheIntroDB',unsafe:false,quality:.5}],[],2820));
  assert.equal(x.length,1);assert.equal(x[0].trusted,true);
});
test('One weak source and out-of-range match require manual click',()=>{
  let x=plain(f.combine([],[{type:'intro',start:60,end:90,source:'IntroDB',unsafe:false,quality:.7}],[],2820));
  assert.equal(x[0].trusted,false);
  let y=plain(f.combine([],[{type:'credits',start:600,end:700,source:'SkipDB',unsafe:true,quality:1}],[],2820));
  assert.equal(y[0].trusted,false);
});
test('Multiple non-overlapping segments of the same type survive consensus',()=>{
  let x=plain(f.combine([],[{type:'ad',start:60,end:90,source:'Lampa',quality:1},
    {type:'ad',start:160,end:190,source:'Lampa',quality:1}],[],2820));
  assert.equal(x.length,2);
});
test('Manual correction supersedes database result',()=>{
  let x=plain(f.combine([],[{type:'intro',start:60,end:92,source:'SkipDB',quality:1}],
    [{type:'intro',start:59,end:89,source:'Manual',quality:1}],2820));
  assert.equal(x[0].start,59);assert.equal(x[0].source,'Manual');
});
test('Wrong playlist duration rejected without arbitrary seek',()=>{
  assert.equal(f.fromLaunch({segments:{duration_ms:1800000,skip:[{start:60,end:90}]}},2820).length,0);
});
test('Invalid and reversed time spans rejected',()=>{
  let arr=[];
  f.put(arr,'intro',100,50,'Lampa',1);
  f.put(arr,'intro',-1,80,'Lampa',1);
  f.put(arr,'intro',60,70,'Lampa',1);
  assert.equal(arr.length,1);
});
test('Fingerprint differentiates episodes and editions',()=>{
  let m={imdb:'tt1234567',season:1,episode:2};
  assert.notEqual(f.fingerprint(m,1600),f.fingerprint(m,1800));
  assert.notEqual(f.fingerprint(m,1600),f.fingerprint({...m,episode:3},1600));
});
test('No external URL sent to providers, only IDs and duration',()=>{
  let req=f.remoteRequests({imdb:'',tmdb:'',mal:null,season:1,episode:1},2820);
  assert.equal(req.length,0);
});
test('Initialize and register internal player listeners on ready environment',()=>{
  let a=run(false);assert.equal(a.settings.length,36);
  assert.ok(a.handlers.start);assert.ok(a.handlers.ready);assert.ok(a.handlers.destroy);
  assert.ok(!a.children.some(x=>x.className==='arx-tools-quick'));
});
test('Registering playback does not write to progress storage keys',()=>{
  let a=run(false);
  a.handlers.start({url:'https://example.org/movie.mkv',season:1,episode:1,card:{id:22,imdb_id:'tt1234567'}});
  assert.equal(Object.keys(a.store).some(k=>/file_view|sync_view|torrents_view/.test(k)),false);
});

test('Chapter cue named opening creates manual-only suggestion',()=>{
  const track={kind:'chapters',cues:[{startTime:31,endTime:88,text:'Opening Theme'}]};
  const result=plain(f.readChapters({textTracks:[track]}));
  assert.equal(result.length,1);assert.equal(result[0].type,'intro');
  assert.equal(result[0].unsafe,true);
});
test('Subtitle gap hints never become trusted auto-skip',()=>{
  const cues=Array.from({length:10},(_,i)=>({startTime:i===0?60:i*100,endTime:i===0?70:i*100+25}));
  const result=plain(f.readSubtitleSuggestions({textTracks:[{kind:'subtitles',cues}]},2700));
  assert.ok(result.length>0);
  assert.equal(result[0].unsafe,true);
});
test('Manual segment overrides even a far-away unreliable database match',()=>{
  let a=plain(f.combine([],[{type:'intro',start:15,end:50,source:'SkipDB',unsafe:false,quality:0.99}],
    [{type:'intro',start:180,end:240,source:'Manual',unsafe:false,quality:1}],2820));
  assert.equal(a.length,1);
  assert.equal(a[0].start,180);
});

test('Manual skip control seeks to segment end and undo restores original timestamp',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.com/S01E01.mkv',season:1,episode:1,
    card:{id:22,imdb_id:'tt1234567'},segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=67;
  a.video.events.timeupdate({type:'timeupdate'});
  const capsule=a.children.find(x=>(x.className||'').split(' ').includes('arx-tools-capsule'));
  assert.ok(capsule);
  const skip=capsule.children.find(x=>(x.className||'').split(' ').includes('arx-tools-skip'));
  const undo=capsule.children.find(x=>(x.className||'').split(' ').includes('arx-tools-undo'));
  assert.equal(skip.style.display,'flex');
  assert.equal(capsule.style.display,'flex');
  skip.click();
  assert.equal(a.video.currentTime,95);
  assert.equal(undo.style.display,'block');
  undo.click();
  assert.equal(a.video.currentTime,67);
});
test('Automatic skip remains off by default',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.com/S01E01.mkv',season:1,episode:1,
    card:{id:22,imdb_id:'tt1234567'},segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=67;
  a.video.events.timeupdate({type:'timeupdate'});
  assert.equal(a.video.currentTime,67);
});
test('Autoskipping trusted source works when user opts in',()=>{
  const a=run(false);
  a.window.Lampa.Storage.set('arx_tools_auto',true);
  a.handlers.start({url:'https://example.com/S01E01.mkv',season:1,episode:1,
    card:{id:22,imdb_id:'tt1234567'},segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=67;
  a.video.events.timeupdate({type:'timeupdate'});
  assert.equal(a.video.currentTime,95);
});
test('Autoskipping does not attempt to seek outside available media range',()=>{
  const a=run(false);
  a.window.Lampa.Storage.set('arx_tools_auto',true);
  a.video.seekable={length:1,start(){return 0;},end(){return 30;}};
  a.handlers.start({url:'https://example.com/S01E01.mkv',season:1,episode:1,
    card:{id:22,imdb_id:'tt1234567'},segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=67;
  a.video.events.timeupdate({type:'timeupdate'});
  assert.equal(a.video.currentTime,67);
});

test('TV: ARX entry is inserted as a native Lampa selector in player panel',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.org/video.mkv',card:{id:22,imdb_id:'tt1234567'}});
  const arx=a.panelRight.children.find(x=>(x.className||'').includes('arx-tools-panel-entry'));
  assert.ok(arx);
  assert.ok(arx.className.includes('selector'));
  assert.equal(typeof arx['hover:enter'],'function');
});
test('TV: Enter via native hover:enter opens ARX controller, Back restores player panel',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.org/movie.mkv',card:{id:22,imdb_id:'tt1234567'}});
  a.controller.toggle('player_panel');
  a.controller.selected['hover:enter']();
  assert.equal(a.controller.enabled().name,'arx_tools_menu');
  assert.ok(a.controller.selected);
  assert.ok((a.controller.selected.className||'').includes('selector'));
  const first=a.controller.selected;
  a.controller.controllers.arx_tools_menu.down();
  assert.notEqual(a.controller.selected,first);
  a.controller.controllers.arx_tools_menu.back();
  assert.equal(a.controller.enabled().name,'player_panel');
});
test('TV: skip during playback automatically focuses a selector and Enter seeks',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.org/s01e01.mkv',card:{id:22,imdb_id:'tt1234567'},
    season:1,episode:1,segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=66;
  a.video.events.timeupdate({type:'timeupdate'});
  assert.equal(a.controller.enabled().name,'arx_tools_skip');
  assert.ok(a.controller.selected.className.includes('selector'));
  a.controller.selected['hover:enter']();
  assert.equal(a.video.currentTime,95);
  assert.equal(a.controller.enabled().name,'player');
});
test('TV: native skip button has priority while already visible',()=>{
  const a=run(false);
  const native={classList:{contains(x){return x==='player-skip'?true:false;}}};
  const original=a.document.querySelector;
  a.document.querySelector=function(s){if(s==='.player-skip')return native;return original.call(this,s);};
  a.handlers.start({url:'https://example.org/s01e01.mkv',card:{id:22,imdb_id:'tt1234567'},
    season:1,episode:1,segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=66;a.video.events.timeupdate({type:'timeupdate'});
  assert.equal(a.controller.enabled().name,'player');
});

test('TV: native skip keeps focus when handling hidden launch-provided segments',()=>{
  const a=run(false);
  const native={className:'player-skip hide',classList:{contains(x){return x==='hide';}}};
  const old=a.document.querySelector;
  a.document.querySelector=function(sel){if(sel==='.player-skip')return native;return old.call(this,sel);};
  a.handlers.start({url:'https://example.org/series.mkv',card:{id:22,imdb_id:'tt1234567'},
    season:1,episode:1,segments:{skip:[{start:60,end:95}]}});
  a.video.currentTime=65;
  a.video.events.timeupdate({type:'timeupdate'});
  assert.equal(a.controller.enabled().name,'player');
  assert.equal(a.video.currentTime,65);
});
test('TV: native Back key closes ARX panel without closing video',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.org/movie.mkv',card:{id:22,imdb_id:'tt1234567'}});
  a.controller.toggle('player_panel');
  a.controller.selected['hover:enter']();
  let prevented=false,stopped=false;
  a.handlers['window:keydown']({keyCode:10009,preventDefault(){prevented=true;},
    stopImmediatePropagation(){stopped=true;}});
  assert.equal(prevented,true);
  assert.equal(stopped,true);
  assert.equal(a.controller.enabled().name,'player_panel');
});

test('ARX no longer creates the floating corner button outside the player',()=>{
 const a=run(false);assert.ok(!a.children.some(x=>(x.className||'').split(' ').includes('arx-tools-quick')));
 a.handlers.start({url:'https://example.org/media.mkv',card:{id:22,imdb_id:'tt1234567'}});
 assert.ok(!a.children.some(x=>(x.className||'').split(' ').includes('arx-tools-quick')));
 assert.ok(a.panelRight.children.some(x=>(x.className||'').includes('arx-tools-panel-entry')));
});
test('Subtitle provider results are deduplicated by normalized file id',()=>{
 const a=run(),result=plain(a.api.subtitleNormalize({subtitles:[
 {lang:'rus',url:'https://subs5.strem.io/en/download/src-api/file/1957291837',subtitleFileName:'Pilot',g:'4'}]},
 [{IDSubtitleFile:'1957291837',SubLanguageID:'rus',SubDownloadsCnt:'30'}],'rus'));
 assert.equal(result.length,1);assert.equal(result[0].id,'1957291837');
});
test('External subtitle SRT parses text and timestamps without HTML',()=>{
 const a=run(),cues=plain(a.api.srtParse('1\n00:01:00,100 --> 00:01:03,200\n<i>Привет!</i>\n\n2\n00:01:04.000 --> 00:01:07.000\nДо свидания'));
 assert.equal(cues.length,2);assert.equal(cues[0].start,60.1);
 assert.equal(cues[0].text,'Привет!');
});
test('AI subtitle service URL is HTTPS-only except local development',()=>{
 const a=run();
 a.window.Lampa.Storage.set('arx_tools_subtitle_api','http://example.org:8091');
 assert.equal(a.api.subtitleServer(),'');
 a.window.Lampa.Storage.set('arx_tools_subtitle_api','https://subs.example.org');
 assert.equal(a.api.subtitleServer(),'https://subs.example.org');
});

test('legacy OpenSubtitles RU is disabled, without erasing its account settings',()=>{
 const a=run(false);
 assert.equal(a.store['opensubtitles_ru_enabled'],'false');
 assert.equal(Object.hasOwn(a.store,'opensubtitles_ru_device_token'),false);
});

test('Public subtitle endpoints are generated without any ARX server',()=>{
 const a=run(),m={imdb:'tt0903747',season:1,episode:2},u=a.api.subtitlePublicUrls(m,'rus');
 assert.ok(u.stremio.includes('opensubtitles-v3.strem.io'));
 assert.ok(u.stremio.includes('tt0903747%3A1%3A2'));
 assert.ok(u.rest.includes('rest.opensubtitles.org'));
 assert.equal(a.api.subtitleDownloadUrl('1957291837'),
   'https://subs5.strem.io/en/download/subencoding-stremio-utf8/src-api/file/1957291837.srt');
 assert.equal(a.api.subtitleDownloadUrl('../private'),'');
});
test('Search stays client-side even when an AI backend URL is configured',async()=>{
 const sample={subtitles:[{lang:'rus',url:'https://subs5.strem.io/en/file/1957291837',
   subtitleFileName:'Русские',g:3}]};
 const a=run(false,{xhrResponse:(url)=>{
   if(url.includes('opensubtitles-v3.strem.io'))return {status:200,data:sample};
   if(url.includes('rest.opensubtitles.org'))return {status:200,data:[]};
   return {status:404,data:[]};
 }});
 a.window.Lampa.Storage.set('arx_tools_subtitle_api','https://subs.example.org');
 a.handlers.start({url:'https://example.org/S01E02.mkv',card:{id:22,imdb_id:'tt0903747'},
   season:1,episode:2});
 a.api.subtitleFind('rus');
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.ok(a.requests.some(x=>x.url.includes('opensubtitles-v3.strem.io')));
 assert.ok(a.requests.some(x=>x.url.includes('rest.opensubtitles.org')));
 assert.equal(a.requests.filter(x=>x.url.includes('subs.example.org')).length,0,
   'configured AI server must not receive ready-made subtitle searches when providers respond');
});
test('Subtitle file selection first downloads SRT directly, even with configured AI backend',async()=>{
 const text='1\n00:00:02,000 --> 00:00:05,000\nЗдравствуйте\n';
 const a=run(false,{xhrResponse:(url)=>{
   if(url.includes('subs5.strem.io'))return {status:200,data:text};
   return {status:404,data:''};
 }});
 a.window.Lampa.Storage.set('arx_tools_subtitle_api','https://subs.example.org');
 a.handlers.start({url:'https://example.org/video.mkv',card:{id:22,imdb_id:'tt0903747'}});
 a.api.subtitleSelect({id:'1957291837',lang:'rus',title:'Русские'});
 await Promise.resolve();await Promise.resolve();
 assert.equal(a.requests.filter(x=>x.url.includes('subs5.strem.io')).length,1);
 assert.equal(a.requests.filter(x=>x.url.includes('subs.example.org')).length,0);
});

test('Lampa SettingsApi renders ARX text inputs without undefined Params.values',()=>{
 const a=run(false);
 // Emulate the exact Param registration and update expressions from
 // lampa-source/src/interaction/settings/api.js and params.js:
 const values={},defaults={};
 for(const item of a.settings){
   if(!item.param)continue;
   const p=item.param;
   if(p.type==='trigger'){
     values[p.name]={'true':'Yes','false':'No'};defaults[p.name]=p.default;
   }
   if(p.type==='select'||p.type==='input'){
     values[p.name]=p.values;defaults[p.name]=p.default;
   }
 }
 const inputs=a.settings.filter(x=>x.param?.type==='input');
 assert.deepEqual(inputs.map(x=>x.param.name).sort(),
   ['arx_tools_ai_custom_base','arx_tools_ai_custom_key','arx_tools_ai_custom_model','arx_tools_ai_key_openrouter','arx_tools_ai_model_openrouter','arx_tools_subtitle_api']);
 for(const input of inputs){
   const name=input.param.name,key='';
   // This previously raised: Cannot read properties of undefined (reading '').
   assert.doesNotThrow(()=>{
     const val=typeof values[name]==='string'?key:
       values[name][key]||values[name][defaults[name]];
     assert.equal(val,'');
   });
   assert.equal(typeof input.param.values,'string');
 }
});
test('All ARX settings resolve via Lampa Params.update for defaults and stored choices',()=>{
 const a=run(false);
 const values={},defaults={};
 for(const item of a.settings){
   if(!item.param)continue;
   const p=item.param;
   if(p.type==='trigger'){values[p.name]={'true':'Yes','false':'No'};defaults[p.name]=p.default;}
   else if(p.type==='select'||p.type==='input'){values[p.name]=p.values;defaults[p.name]=p.default;}
 }
 for(const item of a.settings){
   if(!item.param)continue;
   const {name,type}=item.param;
   assert.doesNotThrow(()=>{
     const key=a.window.Lampa.Storage.get(name,String(defaults[name]));
     const val=typeof values[name]==='string'?key:
       values[name][key]||values[name][defaults[name]];
     if(type==='input')assert.equal(typeof val,'string');
     else assert.ok(val!==undefined,'unset display value for '+name);
   },name);
 }
});

test('Direct AI configuration uses OpenRouter by default and accepts any validated HTTPS OpenAI compatible base',()=>{
 const a=run();
 let cfg=a.api.aiConfiguration();
 assert.equal(cfg.provider,'openrouter');
 assert.equal(cfg.endpoint,'https://openrouter.ai/api/v1/chat/completions');
 assert.equal(cfg.model,'openrouter/free');
 assert.equal(cfg.enabled,false);
 a.window.Lampa.Storage.set('arx_tools_ai_provider','custom');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_base','https://translate.example.org/v1');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_model','custom-model-1');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_key','test-secret');
 cfg=a.api.aiConfiguration();
 assert.equal(cfg.provider,'custom');
 assert.equal(cfg.endpoint,'https://translate.example.org/v1/chat/completions');
 assert.equal(cfg.model,'custom-model-1');
 assert.equal(cfg.key,'test-secret');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_base','http://translate.example.org/v1');
 assert.equal(a.api.aiConfiguration().endpoint,'');
 assert.equal(a.api.aiEndpoint('https://translate.example.org/v1/chat/completions'),
  'https://translate.example.org/v1/chat/completions');
 assert.equal(a.api.aiEndpoint('https://user:password@translate.example.org/v1'),'');
 assert.equal(a.api.aiEndpoint('https://translate.example.org/v1?secret=yes'),'');
});
test('Direct AI splits subtitle blocks into bounded chunks while retaining original cues',()=>{
 const a=run(),cues=Array.from({length:76},(_,i)=>({start:i*2,end:i*2+1,text:'Dialogue '+i}));
 const parts=a.api.aiTranslationBatches(cues);
 assert.equal(parts.length,3);
 assert.deepEqual(plain(parts.map(p=>p.length)),[35,35,6]);
 assert.equal(parts.flat()[63].text,'Dialogue 63');
});
test('AI JSON extractor verifies exact number of translated subtitles',()=>{
 const a=run();
 assert.deepEqual(plain(a.api.aiParseTranslation('{"lines":["Привет", "Мир"]}',2)),['Привет','Мир']);
 assert.throws(()=>a.api.aiParseTranslation('{"lines":["one"]}',2));
 assert.throws(()=>a.api.aiParseTranslation('Sorry, unable to translate',2));
});
test('Direct AI OpenAI-compatible provider uses user-chosen URL and key, preserving translated lines',async()=>{
 const a=run(false,{xhrResponse:(url,method,body)=>{
   assert.equal(url,'https://translate.example.org/v1/chat/completions');
   assert.equal(method,'POST');
   const payload=JSON.parse(body),request=JSON.parse(payload.messages[1].content);
   assert.equal(payload.model,'local-translator');
   return {status:200,data:{choices:[{message:{content:JSON.stringify({lines:request.lines.map(x=>'Перевод '+x.text)})}}]}};
 }});
 a.window.Lampa.Storage.set('arx_tools_ai_enabled',true);
 a.window.Lampa.Storage.set('arx_tools_ai_provider','custom');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_base','https://translate.example.org/v1');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_model','local-translator');
 a.window.Lampa.Storage.set('arx_tools_ai_custom_key','custom-private-test-key');
 const config=a.api.aiConfiguration();
 const result=await a.api.aiChatRequest(config,[{start:2,end:4,text:'Hello'}],'en','ru');
 assert.equal(result.ok,true);
 assert.deepEqual(plain(result.lines),['Перевод Hello']);
 assert.equal(a.requests.length,1);
 assert.equal(a.requests[0].headers.Authorization,'Bearer custom-private-test-key');
});
test('Direct AI translation is opt-in and fully bypasses ARX subtitle server',async()=>{
 const a=run(false,{xhrResponse:(url,method,body)=>{
   if(!url.includes('openrouter.ai'))return {status:404,data:{}};
   const packet=JSON.parse(body),request=JSON.parse(packet.messages[1].content);
   return {status:200,data:{choices:[{message:{content:JSON.stringify({
    lines:request.lines.map(x=>'Перевод '+x.text)
   })}}]}};
 }});
 a.window.Lampa.Storage.set('arx_tools_ai_key_openrouter','not-a-real-key');
 a.window.Lampa.Storage.set('arx_tools_subtitle_api','https://backend-unused.invalid');
 a.handlers.start({url:'https://example.org/video.mp4',card:{id:22,imdb_id:'tt0903747'}});
 a.api.subtitleUseCues([{start:1,end:3,text:'Hello'},{start:4,end:6,text:'World'}],
   {lang:'eng',title:'English'});
 a.api.subtitleTranslate();
 assert.equal(a.requests.filter(x=>x.url.includes('/chat/completions')).length,0);
 a.window.Lampa.Storage.set('arx_tools_ai_enabled',true);
 a.api.subtitleTranslate();
 for(let i=0;i<20;i++)await Promise.resolve();
 assert.equal(a.requests.filter(x=>x.url.includes('/chat/completions')).length,1);
 assert.equal(a.requests.filter(x=>x.url.includes('backend-unused.invalid')).length,0);
 const panelNodes=a.children.filter(x=>x.className==='arx-tools-subtitles');
 assert.ok(panelNodes.length);
 a.video.currentTime=2;
 a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(panelNodes[0].textContent,'Перевод Hello');
});
test('OpenRouter direct chat call uses configured provider URL and API key',async()=>{
 const a=run(false,{xhrResponse:(url,method,body)=>{
   assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
   const data=JSON.parse(body);
   assert.equal(data.model,'google/gemini-2.5-flash');
   return {status:200,data:{choices:[{message:{content:'{"lines":["Это проверка"]}'}}]}};
 }});
 a.window.Lampa.Storage.set('arx_tools_ai_enabled',true);
 const config={provider:'openrouter',model:'google/gemini-2.5-flash',
   key:'test-key-openrouter-only',endpoint:'https://openrouter.ai/api/v1/chat/completions'};
 const response=await a.api.aiChatRequest(config,[{start:5,end:7,text:'This is a test'}],'en','ru');
 assert.equal(response.ok,true);
 assert.equal(response.lines[0],'Это проверка');
 assert.equal(a.requests[0].headers.Authorization,'Bearer test-key-openrouter-only');
});
test('API 401 does not expose secrets in error messages or retry automatically',async()=>{
 const a=run(false,{xhrResponse:()=>({status:401,data:{error:{message:'invalid credential'}}})});
 a.window.Lampa.Storage.set('arx_tools_ai_enabled',true);
 const config={provider:'custom',model:'model',key:'very-private-test-key',
   endpoint:'https://translate.example.org/v1/chat/completions'};
 const response=await a.api.aiChatRequest(config,[{start:5,end:6,text:'Hello'}],'en','ru');
 assert.equal(response.ok,false);
 assert.equal(response.status,401);
 assert.equal(response.error,'HTTP 401');
 assert.ok(!JSON.stringify(response).includes('very-private-test-key'));
 assert.equal(a.requests.length,1);
});

test('Lampa absent boolean default is an empty string and must be disabled',()=>{
 const a=run();
 a.window.Lampa.Storage.get=function(name,fallback){
   return (name==='arx_tools_info'||name==='arx_tools_auto'||name==='arx_tools_stats')?'':fallback;
 };
 assert.equal(a.api.on('info',false),false);
 assert.equal(a.api.on('auto',false),false);
 assert.equal(a.api.on('stats',false),false);
 assert.equal(a.api.on('skip',true),true);
});
test('Info overlay obeys disabled setting and remains hidden even with player controls visible',()=>{
 const a=run(false,{panelVisible:true});
 a.handlers.start({url:'https://example.org/video.mkv',card:{id:22,imdb_id:'tt1234567'}});
 const info=a.children.find(x=>x.className==='arx-tools-info');
 assert.ok(info);
 a.video.currentTime=75;a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(info.style.display,'none');
 a.window.Lampa.Storage.set('arx_tools_info',false);
 a.api.tick();
 assert.equal(info.style.display,'none');
});
test('Enabled ARX info follows native panel visibility and hides immediately on DOM change',()=>{
 const a=run(false,{panelVisible:true});
 a.window.Lampa.Storage.set('arx_tools_info',true);
 a.handlers.start({url:'https://example.org/video.mkv',card:{id:22,imdb_id:'tt1234567'}});
 const info=a.children.find(x=>x.className==='arx-tools-info');
 a.video.currentTime=75;a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(info.style.display,'block');
 a.mockPanel.setVisible(false);
 assert.equal(info.style.display,'none','MutationObserver should immediately hide overlay');
 a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(info.style.display,'none');
 a.mockPanel.setVisible(true);
 assert.equal(info.style.display,'block');
 a.handlers.destroy();
 assert.equal(info.style.display,'none');
});
test('OpenRouter selects Auto Router when toggle default is enabled',()=>{
 const a=run();
 a.window.Lampa.Storage.set('arx_tools_ai_provider','openrouter');
 a.window.Lampa.Storage.set('arx_tools_ai_key_openrouter','test-openrouter-key');
 a.window.Lampa.Storage.set('arx_tools_ai_model_openrouter','google/gemini-2.5-flash');
 assert.equal(a.api.aiConfiguration().model,'openrouter/free');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_auto',true);
 assert.equal(a.api.aiConfiguration().model,'openrouter/free');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_free',false);
 assert.equal(a.api.aiConfiguration().model,'openrouter/auto');
});
test('OpenRouter manually selected preset overrides custom text only when auto disabled',()=>{
 const a=run();
 a.window.Lampa.Storage.set('arx_tools_ai_provider','openrouter');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_auto',false);
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_free',false);
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_manual_preset','openai/gpt-4.1-mini');
 a.window.Lampa.Storage.set('arx_tools_ai_model_openrouter','google/gemini-2.5-flash');
 assert.equal(a.api.aiConfiguration().model,'openai/gpt-4.1-mini');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_manual_preset','custom');
 assert.equal(a.api.aiConfiguration().model,'google/gemini-2.5-flash');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_auto',true);
 assert.equal(a.api.aiConfiguration().model,'openrouter/auto');
});
test('OpenRouter Auto Router chat body uses documented model slug, without changing keys',async()=>{
 const a=run(false,{xhrResponse:(url,method,body)=>{
   const packet=JSON.parse(body);
   assert.equal(packet.model,'openrouter/auto');
   assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
   return {status:200,data:{choices:[{message:{content:'{"lines":["Привет"]}'}}]}};
 }});
 a.window.Lampa.Storage.set('arx_tools_ai_provider','openrouter');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_free',false);
 a.window.Lampa.Storage.set('arx_tools_ai_key_openrouter','test-key');
 a.window.Lampa.Storage.set('arx_tools_ai_enabled',true);
 const config=a.api.aiConfiguration();
 const result=await a.api.aiChatRequest(config,[{start:1,end:4,text:'Hello'}],'en','ru');
 assert.equal(result.ok,true);
 assert.equal(a.requests[0].headers.Authorization,'Bearer test-key');
});
test('Auto router toggle and manual model entries have correct TV settings metadata',()=>{
 const a=run(false);
 const all=a.settings.filter(x=>x.param);
 const toggle=all.find(x=>x.param.name==='arx_tools_ai_openrouter_auto');
 assert.ok(toggle);assert.equal(toggle.param.type,'trigger');
 assert.equal(toggle.param.default,true);
 assert.equal(typeof toggle.onRender,'function');
 assert.equal(typeof toggle.onChange,'function');
 const select=all.find(x=>x.param.name==='arx_tools_ai_openrouter_manual_preset');
 assert.ok(select);assert.equal(select.param.type,'select');
 assert.equal(select.param.default,'custom');
 assert.equal(typeof select.onRender,'function');
 const manual=all.find(x=>x.param.name==='arx_tools_ai_model_openrouter');
 assert.equal(typeof manual.onRender,'function');
});

test('OpenRouter Auto and Free together use the free-only router by default',()=>{
 const a=run();
 a.window.Lampa.Storage.set('arx_tools_ai_provider','openrouter');
 a.window.Lampa.Storage.set('arx_tools_ai_key_openrouter','sk-or-test');
 const config=a.api.aiConfiguration();
 assert.equal(config.model,'openrouter/free');
 assert.equal(config.endpoint,'https://openrouter.ai/api/v1/chat/completions');
 const free=a.settings.find(x=>x.param?.name==='arx_tools_ai_openrouter_free');
 assert.ok(!free,'Settings are registered only in fully initialized runtime');
});
test('OpenRouter Free guard prevents accidental paid manual model use',()=>{
 const a=run();
 a.window.Lampa.Storage.set('arx_tools_ai_provider','openrouter');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_auto',false);
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_free',true);
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_manual_preset','openai/gpt-4.1-mini');
 assert.equal(a.api.aiConfiguration().model,'openrouter/free');
 a.window.Lampa.Storage.set('arx_tools_ai_openrouter_manual_preset','custom');
 a.window.Lampa.Storage.set('arx_tools_ai_model_openrouter','meta-llama/test-model:free');
 assert.equal(a.api.aiConfiguration().model,'meta-llama/test-model:free');
 a.window.Lampa.Storage.set('arx_tools_ai_model_openrouter','custom-paid-model');
 assert.equal(a.api.aiConfiguration().model,'openrouter/free');
});
test('OpenRouter Free and Auto are independent TV switches with default On',()=>{
 const a=run(false);
 const entries=a.settings.filter(x=>x.param);
 const free=entries.find(x=>x.param.name==='arx_tools_ai_openrouter_free');
 const auto=entries.find(x=>x.param.name==='arx_tools_ai_openrouter_auto');
 assert.ok(free&&auto);
 assert.equal(free.param.type,'trigger');
 assert.equal(free.param.default,true);
 assert.equal(auto.param.default,true);
 assert.equal(typeof free.onChange,'function');
 assert.equal(typeof free.onRender,'function');
});
test('Frosted TV controls group menu, skip and undo inside an accessible capsule',()=>{
 const a=run(false);
 a.handlers.start({url:'https://example.org/S01E01.mkv',season:1,episode:1,
   card:{imdb_id:'tt1234567'},segments:{skip:[{start:60,end:95}]}});
 const capsule=a.children.find(x=>(x.className||'').includes('arx-tools-capsule'));
 assert.ok(capsule);
 assert.equal(capsule.style.display,'none');
 assert.ok(capsule.children.some(x=>(x.className||'').includes('arx-tools-skip-menu')));
 assert.ok(capsule.children.some(x=>(x.className||'').includes('arx-tools-undo')));
 a.video.currentTime=63;a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(capsule.style.display,'flex');
 const menu=capsule.children.find(x=>(x.className||'').includes('arx-tools-skip-menu'));
 assert.equal(typeof menu['hover:enter'],'function');
 const skip=capsule.children.find(x=>(x.className||'').includes('arx-tools-skip selector'));
 assert.equal(skip.children.length,0,'Skip must be a text button without the skip-forward icon');
 assert.equal(skip.textContent,'Пропустить: Заставка (00:32)');
});
test('D-pad Left moves from skip to menu and OK opens ARX, Back returns to video',()=>{
 const a=run(false);
 a.handlers.start({url:'https://example.org/S01E01.mkv',season:1,episode:1,
  card:{imdb_id:'tt1234567'},segments:{skip:[{start:60,end:95}]}});
 a.video.currentTime=63;a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(a.controller.enabled().name,'arx_tools_skip');
 const original=a.controller.selected;
 a.controller.controllers.arx_tools_skip.left();
 assert.notEqual(a.controller.selected,original);
 a.controller.selected['hover:enter']();
 assert.equal(a.controller.enabled().name,'arx_tools_menu');
 a.controller.controllers.arx_tools_menu.back();
 assert.equal(a.controller.enabled().name,'arx_tools_skip');
});
test('Capsule is hidden on exit and in player without available skip',()=>{
 const a=run(false);
 const capsule=a.children.find(x=>(x.className||'').includes('arx-tools-capsule'));
 assert.ok(capsule);
 assert.equal(capsule.style.display,'none');
 a.handlers.start({url:'https://example.org/movie.mp4',card:{imdb_id:'tt1234567'}});
 assert.equal(capsule.style.display,'none');
 a.handlers.destroy();
 assert.equal(capsule.style.display,'none');
});

test('ARX capsule and player controls use native Lampa semi-transparent white background',()=>{
  const a=run(false);
  const css=a.children.filter(x=>x.tagName==='style'&&x.id==='arx-tools-style').map(x=>x.textContent).join('');
  assert.ok(css.includes('.arx-tools-capsule{'), 'frosted controls style missing');
  assert.ok(css.includes('background:rgba(255,255,255,.10)'));
  assert.ok(css.includes('backdrop-filter:blur(1em)'));
  assert.ok(css.includes('.arx-tools-capsule-button.focus'));
  assert.ok(css.includes('background:#fff!important;color:#000!important'),'focus must invert like native Lampa');
  assert.ok(css.includes('border-radius:4em'),'native Lampa pill rounding must be reused');
  assert.ok(!css.includes('background:rgba(75,52,91,.55)'),'old purple glass still used');
});
test('ARX panel background is glass, with legacy near-black opaque color removed',()=>{
  const a=run(false);
  const css=a.children.filter(x=>x.tagName==='style'&&x.id==='arx-tools-style').map(x=>x.textContent).join('');
  assert.ok(css.includes('background:rgba(70,70,70,.42)'));
  assert.ok(css.includes('backdrop-filter:blur(1.6em)'));
  assert.ok(!css.includes('background:rgba(15,20,29,.96)'));
  assert.ok(!css.includes('background:rgba(16,24,32,.93)'));
  assert.ok(!css.includes('background:#000a'));
  assert.ok(!css.includes('background:rgba(108,83,128,.35)'));
  assert.ok(css.includes('.arx-tools-panel-row button.focus'));
});
test('ARX SVG menu glyph inherits native Lampa focus color',()=>{
  const a=run(false);
  a.handlers.start({url:'https://example.org/movie.mkv',card:{imdb_id:'tt1234567'}});
  const entry=a.panelRight.children.find(x=>(x.className||'').includes('arx-tools-panel-entry'));
  assert.ok(entry);
  assert.ok(entry.children.some(x=>(x.className||'').includes('arx-tools-glyph')));
  const css=a.children.find(x=>x.tagName==='style'&&x.id==='arx-tools-style').textContent;
  assert.ok(css.includes('pointer-events:none;color:inherit'));
  assert.ok(css.includes('.arx-tools-panel-entry.focus,.arx-tools-panel-entry:focus{background:#fff!important;color:#000!important'));
});

test('Untrusted credits have a clean manual-skip label but do not auto-skip',async()=>{
 const a=run(false,{xhrResponse:(url)=>{
   if(url.includes('skipdb.tv'))return {status:200,data:{segments:{
     outro:{start_ms:160000,end_ms:280000,confidence:0.65,match:'exact'}
   }}};
   return {status:404,data:null};
 }});
 a.window.Lampa.Storage.set('arx_tools_auto',true);
 a.handlers.start({url:'https://example.org/S01E01.mp4',
   card:{id:22,imdb_id:'tt1234567'},season:1,episode:1});
 for(let i=0;i<18;i++)await Promise.resolve();
 a.video.currentTime=178;
 a.video.events.timeupdate({type:'timeupdate'});
 const capsule=a.children.find(x=>(x.className||'').split(' ').includes('arx-tools-capsule'));
 const skip=capsule.children.find(x=>(x.className||'').split(' ').includes('arx-tools-skip'));
 assert.equal(skip.style.display,'flex');
 assert.equal(skip.title,'Пропустить: Титры (01:42)');
 assert.equal(skip.textContent,skip.title);
 assert.equal(skip.title.includes('проверить'),false);
 assert.equal(a.video.currentTime,178,'Untrusted credits must remain manual even with auto-skip enabled');
 skip.click();
 assert.equal(a.video.currentTime,280,'User may still click to skip untrusted credits');
});
test('Trusted skip title is concise without internal reliability text',()=>{
 const a=run(false);
 a.handlers.start({url:'https://example.org/S01E01.mp4',
   card:{id:22,imdb_id:'tt1234567'},season:1,episode:1,
   segments:{skip:[{start:60,end:95}]}});
 a.video.currentTime=65;
 a.video.events.timeupdate({type:'timeupdate'});
 const capsule=a.children.find(x=>(x.className||'').split(' ').includes('arx-tools-capsule'));
 const skip=capsule.children.find(x=>(x.className||'').split(' ').includes('arx-tools-skip'));
 assert.equal(skip.title,'Пропустить: Заставка (00:30)');
 assert.equal(skip.textContent,skip.title);
 assert.equal(skip.title.includes('проверить'),false);
});

test('Text skip button retains frosted capsule layout and remains wide enough on TV',()=>{
 const a=run(false);
 const css=a.children.find(x=>x.tagName==='style'&&x.id==='arx-tools-style').textContent;
 assert.ok(css.includes('.arx-tools-capsule .arx-tools-skip{'));
 assert.ok(css.includes('flex:0 1 auto;width:auto'));
 assert.ok(css.includes('max-width:calc(100vw - 135px)'));
 assert.ok(css.includes('white-space:nowrap;overflow:hidden;text-overflow:ellipsis'));
 assert.ok(css.includes('background:rgba(255,255,255,.10)'));
 assert.ok(!css.includes('background:rgba(75,52,91,.55)'));
});
test('D-pad OK still activates text skip and no internal reliability label appears',()=>{
 const a=run(false);
 a.handlers.start({url:'https://example.org/S01E01.mp4',card:{id:22,imdb_id:'tt1234567'},
  season:1,episode:1,segments:{skip:[{start:60,end:95}]}});
 a.video.currentTime=65;
 a.video.events.timeupdate({type:'timeupdate'});
 assert.equal(a.controller.enabled().name,'arx_tools_skip');
 const btn=a.controller.selected;
 assert.equal(btn.textContent,'Пропустить: Заставка (00:30)');
 assert.ok(!btn.textContent.includes('проверить'));
 btn['hover:enter']();
 assert.equal(a.video.currentTime,95);
});

test('AI provider settings are hidden unless AI is deliberately enabled',()=>{
 const a=run(false),params=a.settings.filter(x=>x.param);
 const main=params.find(x=>x.param.name==='arx_tools_ai_enabled');
 assert.ok(main);assert.equal(main.param.default,false);assert.equal(main.param.type,'trigger');
 const provider=params.find(x=>x.param.name==='arx_tools_ai_provider');
 assert.equal(provider.param.default,'openrouter');
 assert.equal(typeof provider.onRender,'function');
 const names=params.map(x=>x.param.name);
 assert.equal(names.some(n=>n.includes('ai_key_deepseek')),false);
 assert.equal(names.some(n=>n.includes('ai_model_deepseek')),false);
 for(const p of ['ai_custom_base','ai_custom_model','ai_custom_key','ai_key_openrouter']){
   assert.equal(typeof params.find(x=>x.param.name==='arx_tools_'+p).onRender,'function');
 }
});
test('AI disabled prevents even direct HTTP calls with saved keys',async()=>{
 const a=run(false);
 const cfg={provider:'custom',endpoint:'https://translate.example.org/v1/chat/completions',
   model:'test-model',key:'private-key'};
 const outcome=await a.api.aiChatRequest(cfg,[{start:0,end:1,text:'Hello'}],'en','ru');
 assert.equal(outcome.ok,false);assert.equal(a.requests.length,0);
});
test('Ready-made subtitle search works with AI disabled, never sends key',async()=>{
 const a=run(false,{xhrResponse:(url)=>{
   if(url.includes('opensubtitles-v3.strem.io'))return {status:200,data:{subtitles:[]}};
   if(url.includes('rest.opensubtitles.org'))return {status:200,data:[]};
   return {status:404,data:null};
 }});
 a.window.Lampa.Storage.set('arx_tools_ai_custom_key','user-secret');
 a.handlers.start({url:'https://example.org/video.mkv',card:{id:22,imdb_id:'tt0903747'}});
 a.api.subtitleFind('rus');
 for(let i=0;i<20;i++)await Promise.resolve();
 assert.ok(a.requests.some(x=>x.url.includes('opensubtitles-v3.strem.io')));
 assert.equal(a.requests.filter(x=>x.headers.Authorization).length,0);
 assert.equal(a.requests.some(x=>JSON.stringify(x).includes('user-secret')),false);
});
test('Undo expires after three seconds for auto-skip and five for manual skip',()=>{
 const a=run(false);
 a.window.Lampa.Storage.set('arx_tools_auto',true);
 a.handlers.start({url:'https://example.org/video.mkv',card:{imdb_id:'tt1234567'},
   season:1,episode:1,segments:{skip:[{start:60,end:95}]}});
 a.video.currentTime=61;a.video.events.timeupdate({type:'timeupdate'});
 assert.ok(a.timeouts.some(t=>t.delay===3000),'Auto skip must expire after 3s');
 a.handlers.destroy();
 const b=run(false);
 b.handlers.start({url:'https://example.org/video.mkv',card:{imdb_id:'tt1234567'},
   season:1,episode:1,segments:{skip:[{start:60,end:95}]}});
 b.video.currentTime=61;b.video.events.timeupdate({type:'timeupdate'});
 const capsule=b.children.find(x=>(x.className||'').includes('arx-tools-capsule'));
 capsule.children.find(x=>(x.className||'').includes('arx-tools-skip selector')).click();
 assert.ok(b.timeouts.some(t=>t.delay===5000),'Manual skip must expire after 5s');
});
