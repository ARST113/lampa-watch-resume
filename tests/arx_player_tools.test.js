'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function boot() {
  const filename = path.join(__dirname, '..', 'arx_player_tools.js');
  const source = fs.readFileSync(filename, 'utf8').replace(
    /\}\)\(\);\s*$/,
    'window.__test = {metadata,parseSkipDB,parseIntroDB,parseTheIntroDB,streamPayload,bestSegments,parseClock};})();'
  );
  const fake = {
    Lampa: {
      Storage: { get: () => null },
      Activity: {active: () => ({card: {name: 'Example Series', id: 22, imdb_id:'tt1234567'}})},
      PlayerVideo: {video: () => ({duration: 2820})}
    }
  };
  const document = {readyState: 'loading',addEventListener() {}};
  vm.runInNewContext(source, {window: fake, document, setInterval() {return 1;}, clearInterval() {}, setTimeout() {return 1;}, clearTimeout() {}, console});
  return fake.__test;
}
const testAPI = boot();
function plain(o){return JSON.parse(JSON.stringify(o));}

test('metadata extracts IMDb/TMDB and TV episode', () => {
  assert.deepEqual(plain(testAPI.metadata({title:'Example S01E03', card:{id:22, imdb_id:'tt1234567'}})),
    {imdb:'tt1234567',tmdb:'22',season:1,episode:3});
});
test('metadata extracts episode from matching playlist entry', () => {
  const m=testAPI.metadata({url:'second',playlist:[{url:'first',season:1,episode:1},{url:'second',season:2,episode:8}]});
  assert.equal(m.season,2);
  assert.equal(m.episode,8);
});
test('SkipDB parses seconds correctly and refuses out-of-range matches', () => {
  const a=plain(testAPI.parseSkipDB({segments:{
    intro:{start_ms:61000,end_ms:91000,confidence:0.94,match:'exact'},
    outro:{start_ms:2700000,end_ms:2820000,confidence:0.91,match:'out-of-range'}
  }}));
  assert.equal(a.length,1);
  assert.equal(a[0].start,61);assert.equal(a[0].end,91);
});
test('IntroDB supports array payload and timestamps in hh:mm:ss', () => {
  const a=plain(testAPI.parseIntroDB({segments:[{segment_type:'recap',start_sec:'0:01:10',end_sec:'0:02:00'}]}));
  assert.equal(a[0].start,70);assert.equal(a[0].end,120);
});
test('TheIntroDB handles ms, normalize outro as credits', () => {
  const a=plain(testAPI.parseTheIntroDB({outro:[{start_ms:2700000,end_ms:2820000}]}));
  assert.equal(a[0].type,'credits');assert.equal(a[0].start,2700);
});
test('launch-provided skips win over weaker remote timestamps', () => {
  const source=plain(testAPI.streamPayload({segments:{skip:[{start:60,end:90}]}}));
  const remote=[{type:'intro',start:42,end:65,source:'IntroDB',quality:0.6}];
  const selected=plain(testAPI.bestSegments(source,remote,2820));
  assert.equal(selected[0].start,60);assert.equal(selected[0].source,'launch');
  assert.equal(selected[0].trusted,true);
});
test('service consensus is trusted, solitary uncertain data is manual-only', () => {
  const a=plain(testAPI.bestSegments([], [
    {type:'intro',start:60,end:90,source:'IntroDB',quality:0.7},
    {type:'intro',start:62,end:92,source:'TheIntroDB',quality:0.7}
  ],2820));
  const b=plain(testAPI.bestSegments([], [
    {type:'intro',start:60,end:90,source:'IntroDB',quality:0.7}
  ],2820));
  assert.equal(a[0].trusted,true);assert.equal(b[0].trusted,false);
});
test('bad/mismatched launch duration is rejected instead of unsafe seeking', () => {
  const result=plain(testAPI.streamPayload({segments:{duration_ms:1800000,skip:[{start:10,end:80}]}}));
  assert.equal(result.length,0);
});
test('a missing or malformed time interval is never accepted', () => {
  const result=plain(testAPI.parseIntroDB({segments:[{segment_type:'intro',start_sec:-5,end_sec:10},{segment_type:'intro',start_sec:100,end_sec:90}]}));
  assert.equal(result.length,0);
});
