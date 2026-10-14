'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
function run(exportsOnly=true, options={}) {
  let src=fs.readFileSync(path.join(__dirname,'..','arx_player_tools.js'),'utf8');
  if(exportsOnly) src=src.replace(/\}\)\(\);\s*$/,"window.__test={metadata,mapType,clock,put,parseSkipDB,parseIntroDB,parseTheIntroDB,parseAniSkip,parseIntroHater,fromLaunch,combine,fingerprint,appendManual,readManual,readChapters,readSubtitleSuggestions,remoteRequests,playerStart,playerVideo,tick};})();");
  const handlers={},store={},settings=[],children=[],tvNodes=[];
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
  function XHR(){
    this.readyState=0;this.status=0;this.responseText='';
  }
  XHR.prototype.open=function(m,url){this.url=url;};
  XHR.prototype.send=function(){
    this.readyState=4;this.status=404;this.onreadystatechange();
  };
  XHR.prototype.abort=function(){};
  const context={window,document:fakeDoc,console,
    XMLHttpRequest:XHR,setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},
    Date,Math,isFinite,Number,Array,Object,JSON,parseFloat,parseInt,Promise,encodeURIComponent};
  vm.runInNewContext(src,context);
  if(!exportsOnly && handlers['app:app'])handlers['app:app']({type:'ready'});
  return {api:window.__test,handlers,settings,store,video,children,window,document:fakeDoc,
    controller:activeTV,panelRight,navigator};
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
  let a=run(false);assert.equal(a.settings.length,25);
  assert.ok(a.handlers.start);assert.ok(a.handlers.ready);assert.ok(a.handlers.destroy);
  assert.ok(a.children.some(x=>x.className==='arx-tools-quick'));
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
  const skip=a.children.find(x=>x.className==='arx-tools-skip');
  const undo=a.children.find(x=>x.className==='arx-tools-undo');
  assert.equal(skip.style.display,'block');
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
