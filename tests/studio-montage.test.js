import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {solidSurfaces} from '../terrain.js';
import {rooms,createEnemies,platforms} from '../level.js';
import {STUDIO_PIECES,FAKES,HOLO,TAKES,STUDIO_CHECKPOINTS} from '../studio-map.js';
import {stageLit,liveTake,fakesFor} from '../studio-systems.js';
import {crossStudio,studioLib,jumpTo} from './navigation.js';
// «Студия» (room 5): holograms that fade under Uma, risers solid only in a spotlight, red/blue takes on the clapper,
// and Дипфейк's fake platforms.
const x0=rooms[5].x;
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready({enemies=false}={}){const g=new Game({story:false});g.start();activateRoom(g,5);if(!enemies)g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];g.player.inv=0;return g;}
function stand(g,index,local){const s=g.platforms.find(s=>s.id==='5:'+index);Object.assign(g.player,{x:x0+(local??STUDIO_PIECES[index].x+12),y:s.y-48,vx:0,vy:0,grounded:true,supportId:s.id});return s;}
const solid=(g,id)=>solidSurfaces(g).some(s=>s.id===id);

test('the studio is built from its own pieces: no ladders, burrows, controllers or moving platforms',()=>{
 const own=platforms.filter(s=>s.room===5);assert.equal(own.length,STUDIO_PIECES.length);
 for(const s of own){assert.deepEqual(s.studio,STUDIO_PIECES[s.index]);assert.equal(s.motion,null);}
 const g=ready();assert.equal(g.mapProps.filter(d=>d.room===5).length,0);assert.equal(g.routePortals.filter(r=>r.room===5).length,0);
 assert.deepEqual([...new Set(createEnemies().filter(e=>e.room===5).map(e=>e.type))].sort(),['cutter','deepfake','splicer']);
 assert.ok(!createEnemies().some(e=>e.type==='injection'),'Вброс left the studio for good');
});

test('a hologram warns under Uma, vanishes, drops her through and comes back',()=>{
 const g=ready(),s=stand(g,1);tick(g,1);assert.ok(g.events.some(e=>e.type==='holoWarning'));assert.equal(s.studioState,'warn');assert.ok(solid(g,s.id));
 tick(g,Math.ceil(HOLO.warn*60)+2);assert.equal(s.studioState,'gone');assert.equal(s.intangible,true);assert.ok(!solid(g,s.id));assert.ok(g.events.some(e=>e.type==='holoVanish'));
 for(let i=0;i<120&&!g.events.some(e=>e.type==='roofFall');i++)tick(g,1);
 assert.ok(g.events.some(e=>e.type==='roofFall'),'Uma falls through');assert.equal(g.health,3);
 tick(g,Math.ceil((HOLO.gone+HOLO.back)*60)+5);assert.equal(s.intangible,false);assert.equal(s.studioState,'solid');
});

test('spotlight risers exist only while lit; the lamps carry Uma from left to right',()=>{
 const g=ready(),[a,b,c]=[5,6,7].map(i=>g.platforms.find(s=>s.id==='5:'+i));let darkA=0,darkC=0;
 for(let i=0;i<60*8;i++){tick(g,1);for(const s of [a,b,c])assert.equal(s.intangible,!stageLit(s.studio,g.time));assert.equal(b.intangible,false,'the middle riser is always in a beam');assert.ok(!(a.intangible&&c.intangible),'one outer riser is always lit');darkA+=a.intangible;darkC+=c.intangible;}
 assert.ok(darkA>60&&darkC>60,'each outer riser goes dark for real');
});

test('red and blue takes swap on the clapper beat with a warning first',()=>{
 const g=ready(),red=g.platforms.find(s=>s.id==='5:9'),blue=g.platforms.find(s=>s.id==='5:10');
 g.time=TAKES.beat-TAKES.warn-.05;tick(g,1);assert.equal(liveTake(g.time).color,'red');assert.ok(solid(g,red.id));assert.ok(!solid(g,blue.id));
 tick(g,6);assert.ok(g.events.some(e=>e.type==='takeWarning'));assert.equal(red.studioState,'swap');
 tick(g,Math.ceil(TAKES.warn*60));assert.ok(g.events.some(e=>e.type==='takeSwap'&&e.color==='blue'));assert.ok(!solid(g,red.id));assert.ok(solid(g,blue.id));
});

test('Дипфейк projects fake platforms that never hold Uma, and breaking the projector dispels them',()=>{
 const g=ready({enemies:true}),df=g.enemies.find(e=>e.type==='deepfake'&&e.fakeOwner===0);df.active=true;
 const fake=fakesFor(g).find(f=>f.owner===0);assert.equal(fake.active,true);
 assert.ok(!solidSurfaces(g).some(s=>s.room===5&&Math.abs(s.y-fake.y)<1&&s.x<x0+fake.x+fake.w&&s.x+s.w>x0+fake.x),'a fake is only a picture');
 g.hitEnemy(df,false,99);assert.equal(fakesFor(g).find(f=>f.owner===0).active,false);
 assert.equal(FAKES.length,createEnemies().filter(e=>e.type==='deepfake').length);
});

test('Дипфейк hovers near home, focuses before projecting and hurts on contact unless Uma dashes',()=>{
 const g=ready({enemies:true}),df=g.enemies.find(e=>e.type==='deepfake'&&e.fakeOwner===1);g.enemies=[df];Object.assign(df,{active:true,noticed:true,timer:0});stand(g,4,900);
 tick(g,2);assert.equal(df.state,'windup');assert.ok(g.events.some(e=>e.type==='deepfakeFocus'));tick(g,32);assert.equal(df.state,'casting');
 for(let i=0;i<600;i++){tick(g,1);assert.ok(Math.abs(df.x-df.homeX)<=130.01);}
});

test('falls cost one heart and return to the last safe truss; checkpoints follow the blocks',async()=>{
 const g=ready();stand(g,3,620);tick(g,2);assert.equal(g.studio.checkpoint,1);
 Object.assign(g.player,{x:x0+990,y:420,grounded:false,supportId:null,vy:200});for(let i=0;i<90&&g.health===4;i++)tick(g,1);
 assert.equal(g.health,3);tick(g,5);assert.equal(STUDIO_PIECES[g.platforms.find(s=>s.id===g.player.supportId)?.index]?.type,'fixed');
 g.health=1;g.player.inv=0;g.hurt();assert.equal(g.mode,'respawning');for(let i=0;i<120&&g.mode!=='playing';i++)tick(g,1);assert.equal(g.lives,2);
 assert.equal(g.mode,'playing');assert.equal(g.room,5);assert.ok(Math.abs(g.player.x-(x0+STUDIO_CHECKPOINTS[1].x))<4,'respawn at the reached checkpoint');
});

test('a whole studio run with ordinary inputs breaks all three transmitters and opens the door',async()=>{
 const g=ready(),lib=await studioLib();assert.equal(crossStudio(g,lib),true);
 assert.ok(g.relays.filter(d=>d.room===5).every(d=>d.hp===0));assert.equal(g.health,4,'a timed run never falls');
 for(let i=0;i<400&&g.room===5;i++)g.step(1/60,{right:true});assert.notEqual(g.mode,'playing');
});
