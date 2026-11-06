import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BACKDROP_VEIL,RIM,drawPlatformRim,drawPlatformShadow} from '../readability.js';
const rooms=[1,2,3,4,5,6,7,8];
// A recording canvas: the rim must sit exactly on the collision top and span the platform with end caps.
function recorder(){const calls=[];return{calls,c:{save(){},restore(){},set globalAlpha(v){},set fillStyle(v){this.fill=v;},fillRect(x,y,w,h){calls.push({x,y,w,h,fill:this.fill});}}};}
test('every playable location calms its backdrop and outlines its surfaces',()=>{
 for(const room of rooms){assert.ok(BACKDROP_VEIL[room]>0&&BACKDROP_VEIL[room]<.4,'veil '+room);assert.match(RIM[room],/^#[0-9a-f]{6}$/i);}
 assert.ok(BACKDROP_VEIL[4]>=Math.max(...rooms.filter(r=>r!==4).map(r=>BACKDROP_VEIL[r])),'the busy Agitator roofs get the strongest veil');
});
test('the bright rim lies on the collision top, covers the full width and marks both ends',()=>{
 const p={x:100,y:300,w:120},{c,calls}=recorder();drawPlatformRim(c,{room:4},p,0);
 const edge=calls.find(r=>r.fill===RIM[4]&&r.w===p.w&&r.h===2);assert.ok(edge);assert.equal(edge.y+edge.h,p.y);assert.equal(edge.x,p.x);
 assert.ok(calls.some(r=>r.fill===RIM[4]&&r.x===p.x-2&&r.h>=6)&&calls.some(r=>r.fill===RIM[4]&&r.x===p.x+p.w&&r.h>=6),'end caps');
 const moving=recorder();drawPlatformRim(moving.c,{room:4},{...p,motion:{}},0);assert.ok(moving.calls.some(r=>r.fill==='#7ff3ff'&&r.w===p.w));
 const shadow=recorder();drawPlatformShadow(shadow.c,{room:4},p);assert.ok(shadow.calls.every(r=>r.y>p.y),'shadow stays below the walkable edge');
 const prologue=recorder();drawPlatformRim(prologue.c,{room:0},p,0);assert.equal(prologue.calls.length,0,'the cozy prologue keeps its own look');
});
test('hints are anchored under the HUD, not over the floor',()=>{
 const css=readFileSync(new URL('../style.css',import.meta.url),'utf8'),rule=css.slice(css.indexOf('#app .status{'),css.indexOf('}',css.indexOf('#app .status{')));
 assert.match(rule,/top:calc\(var\(--hud-height/);assert.match(rule,/bottom:auto/);
});
