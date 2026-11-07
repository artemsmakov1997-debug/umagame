import {rooms} from '../level.js';
// The old generic layout of room 7 — kept only as a mechanics playground for legacy tests (copier, stamp, informant,
// moving platforms). The real «Измерение» is built from dimension-map.js; without its pieces its systems stay idle.
export const LEGACY_ROOM7=[
 [0,360,228],[290,292,216],[558,252,242],[0,450,246],[302,418,308],[0,474,232],[304,474,486],[0,222,112],[452,184,170],[150,276,132],
 [814,308,224],[1090,256,220],[1372,298,218],[800,414,260],[1100,414,282],[792,474,494],[1338,474,254],[930,196,170],[1210,154,178],
 [1622,306,218],[1898,264,210],[2160,244,144],[1572,414,270],[1900,414,274],[1560,474,744],[1752,198,170],[2024,150,176],[790,225,140],[1515,235,130]
];
const MOTIONS={'7:13':{axis:'x',amplitude:38,period:7.2},'7:27':{axis:'y',amplitude:28,period:6},'7:28':{axis:'x',amplitude:42,period:7}};
const legacySurface=index=>{const l=LEGACY_ROOM7[index];return l&&{x:rooms[7].x+l[0],y:l[1],w:l[2]};};
export function installLegacyRoom7(g){
 const x0=rooms[7].x;
 g.platforms=g.platforms.filter(s=>s.room!==7).concat(LEGACY_ROOM7.map(([x,y,w],index)=>{const id='7:'+index;
  return {id,x:x0+x,y,w,room:7,index,fragile:false,roof:null,studio:null,dim:null,cuttable:false,motion:MOTIONS[id]||null,baseX:x0+x,baseY:y,prevX:x0+x,prevY:y,dx:0,dy:0};}));
 g.originals=[];g.player.flipped=false;return g;
}
// Re-seat an enemy made by level.enemy() on the legacy ledge it names.
export function seatLegacy(e){
 if(e.room!==7)return e;const s=legacySurface(e.platformIndex);if(!s)return e;
 e.y=s.y-(e.flying?100:e.h);e.origin=s.x+12;e.end=s.x+s.w-60;if(e.source)e.source.localX=Math.max(24,Math.min(s.w-24,e.x+e.w/2-s.x));return e;
}
export const legacyPlatform=index=>{const s=legacySurface(index);return s&&{...s,room:7,index,id:'7:'+index};};
