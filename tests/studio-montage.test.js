import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {solidSurfaces} from '../terrain.js';
import {rooms,createEnemies,platforms} from '../level.js';
import {STUDIO_PIECES,HOLO,TAKES,STUDIO_CHECKPOINTS} from '../studio-map.js';
import {stageLit,liveTake} from '../studio-systems.js';
import {botHop,BOT_BEAT,MAX_BOTS,botsOf} from '../botfarm.js';
import {planCut,CUT_HUNTER} from '../tactical-enemies.js';
import {crossStudio,studioLib,jumpTo} from './navigation.js';
// «Студия» (room 5): holograms that fade under Uma, risers solid only in a spotlight, red/blue takes on the clapper,
// Ботоферма with its synchronised bots, and Нарезчик/Склейка working from perches off the route.
const x0=rooms[5].x;
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready({enemies=false}={}){const g=new Game({story:false});g.start();activateRoom(g,5);if(!enemies)g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];g.player.inv=0;return g;}
function stand(g,index,local){const s=g.platforms.find(s=>s.id==='5:'+index);Object.assign(g.player,{x:x0+(local??STUDIO_PIECES[index].x+12),y:s.y-48,vx:0,vy:0,grounded:true,supportId:s.id});return s;}
const solid=(g,id)=>solidSurfaces(g).some(s=>s.id===id);

test('the studio is built from its own pieces: no ladders, burrows, controllers or moving platforms',()=>{
 const own=platforms.filter(s=>s.room===5);assert.equal(own.length,STUDIO_PIECES.length);
 for(const s of own){assert.deepEqual(s.studio,STUDIO_PIECES[s.index]);assert.equal(s.motion,null);}
 const g=ready();assert.equal(g.mapProps.filter(d=>d.room===5).length,0);assert.equal(g.routePortals.filter(r=>r.room===5).length,0);
 assert.deepEqual([...new Set(createEnemies().filter(e=>e.room===5).map(e=>e.type))].sort(),['botfarm','cutter','splicer']);
 assert.ok(!createEnemies().some(e=>['injection','deepfake'].includes(e.type)),'Вброс and Дипфейк left the studio for good');
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

const perch=i=>STUDIO_PIECES[i].kind==='perch';
const enemyOn=(g,type,index)=>g.enemies.find(e=>e.type===type&&e.platformIndex===index);
function arm(g,e){Object.assign(e,{active:true,noticed:true,spawnTime:0,noticeTime:0,timer:0});return e;}

test('Нарезчик and Склейка work from perches off the route; a Ботоферма guards every transmitter',()=>{
 const roster=createEnemies().filter(e=>e.room===5);
 for(const e of roster.filter(e=>['cutter','splicer'].includes(e.type)))assert.ok(perch(e.platformIndex),e.id+' stands on a perch');
 assert.deepEqual(roster.filter(e=>e.type==='botfarm').map(e=>e.platformIndex),[3,8,11]);
 assert.ok(roster.filter(e=>e.type==='cutter').every(e=>e.hunter));
});

test('the Ботоферма prints up to three bots that hop together, and breaking it hangs and dissolves them',()=>{
 const g=ready({enemies:true}),farm=arm(g,enemyOn(g,'botfarm',3));g.enemies=[farm];stand(g,3,600);
 for(let i=0;i<60*12;i++){g.player.inv=999;tick(g,1);}
 const bots=botsOf(g,farm);assert.equal(bots.length,MAX_BOTS);assert.ok(g.events.some(e=>e.type==='botPrint'));
 assert.equal(farm.x,rooms[5].x+718,'the rack never moves');
 // All bots share one hop.
 g.time=Math.ceil(g.time/BOT_BEAT)*BOT_BEAT+.5;tick(g,1);const phase=botHop(g.time).phase;assert.equal(phase,'air');
 assert.ok(bots.every(b=>b.hopPhase==='air'));const lift=bots.map(b=>g.platforms.find(s=>s.id==='5:3').y-b.h-b.y);assert.ok(lift.every(h=>h>20&&Math.abs(h-lift[0])<.01));
 for(const b of bots){assert.ok(b.x>=g.platforms.find(s=>s.id==='5:3').x&&b.x+b.w<=g.platforms.find(s=>s.id==='5:3').x+190,'bots stay on their truss');}
 const health=g.health;g.player.inv=0;
 // Three hits break the rack; touching it never hurts.
 Object.assign(g.player,{x:farm.x+farm.w/2-17,inv:0});g.enemies=[farm];tick(g,3);assert.equal(g.health,health);
 g.enemies=[farm,...bots];for(let k=0;k<3;k++){farm.inv=0;g.hitEnemy(farm);}assert.equal(farm.dead,true);
 tick(g,2);assert.ok(bots.every(b=>b.frozen&&!b.dead));assert.equal(g.hitEnemy(bots[0]),false,'a hanging bot cannot be hit');
 tick(g,45);assert.ok(bots.every(b=>b.dead));
});

test('a bot hurts on contact, dies from one paw swing and from a stomp',()=>{
 const g=ready({enemies:true}),farm=arm(g,enemyOn(g,'botfarm',8));g.enemies=[farm];stand(g,8,1430);g.player.inv=999;
 for(let i=0;i<60*4&&!botsOf(g,farm).length;i++)tick(g,1);const [bot]=botsOf(g,farm);assert.ok(bot);
 bot.spawnTime=0;g.player.inv=0;Object.assign(g.player,{x:bot.x,y:bot.y+bot.h-48});farm.timer=99;g.time=Math.floor(g.time/BOT_BEAT)*BOT_BEAT+BOT_BEAT-.1;tick(g,1);assert.equal(g.health,3);
 g.player.inv=0;bot.inv=0;assert.equal(g.hitEnemy(bot),true);assert.equal(bot.dead,true);
});

test('the hunter Нарезчик cuts right under Uma, wide and fast, on holograms, risers and takes alike',()=>{
 const g=ready({enemies:true}),cutter=arm(g,enemyOn(g,'cutter',15));g.enemies=[cutter];
 for(const [index,local] of [[3,600],[4,880],[1,300]]){g.cuts=[];stand(g,index,local);tick(g,1);cutter.timer=0;cutter.state='patrol';
  assert.equal(planCut(g,cutter),true,'cuts piece '+index);const cut=g.cuts[0],s=g.platforms.find(s=>s.id===cut.platformId);
  assert.equal(s.index,index);assert.ok(cut.w>=Math.min(CUT_HUNTER.width,s.w-2*CUT_HUNTER.margin)-.01);assert.equal(cut.time,CUT_HUNTER.warning);
  const mid=s.x+cut.localX+cut.w/2;assert.ok(Math.abs(mid-(g.player.x+g.player.w/2))<s.w/2,'aimed at Uma');}
 const far=ready({enemies:true}),c2=arm(far,enemyOn(far,'cutter',17));far.enemies=[c2];stand(far,10,1770);far.time=TAKES.beat+.1;tick(far,1);
 assert.equal(planCut(far,c2),true);assert.equal(far.platforms.find(s=>s.id===far.cuts[0].platformId).index,10,'a live take is cut too');
 assert.ok(!platforms.some(s=>s.room===5&&(perch(s.index)||s.index===14)&&s.cuttable));
});

test('a real hunter cut drops Uma from the dolly; the Нарезчик keeps cutting every couple of seconds',()=>{
 const g=ready({enemies:true}),cutter=arm(g,enemyOn(g,'cutter',15));g.enemies=[cutter];stand(g,4,880);g.player.inv=0;
 let fell=false,cuts=new Set();for(let i=0;i<60*8;i++){tick(g,1);for(const c of g.cuts)cuts.add(c.id);if(g.events.some(e=>e.type==='roofFall'))fell=true;if(g.player.grounded&&g.player.supportId==='5:4')Object.assign(g.player,{x:g.player.x});}
 assert.ok(fell,'standing still on a cut mark is a fall');assert.ok(cuts.size>=2,'several cuts in eight seconds');
});

test('a Склейка on its perch drags Uma off a riser into the pit unless she dashes',()=>{
 const make=()=>{const g=ready({enemies:true}),s=arm(g,enemyOn(g,'splicer',16));g.enemies=[s];g.player.inv=0;stand(g,6,1200);return {g,s};};
 let {g,s}=make();g.time=0;for(let i=0;i<60*4&&!g.events.some(e=>e.type==='roofFall');i++)tick(g,1);
 assert.ok(g.events.some(e=>e.type==='gluePull'));assert.ok(g.events.some(e=>e.type==='roofFall'),'pulled off the riser');
 ({g,s}=make());g.time=0;for(let i=0;i<60*4&&!g.tether;i++)tick(g,1);assert.ok(g.tether);tick(g,1,{dash:true,right:true});assert.equal(g.tether,null);
});

test('falls cost one heart and return to the last safe truss; checkpoints follow the blocks',async()=>{
 const g=ready();stand(g,3,620);tick(g,2);assert.equal(g.studio.checkpoint,1);
 Object.assign(g.player,{x:x0+990,y:420,grounded:false,supportId:null,vy:200});for(let i=0;i<90&&g.health===4;i++)tick(g,1);
 assert.equal(g.health,3);tick(g,5);assert.equal(STUDIO_PIECES[g.platforms.find(s=>s.id===g.player.supportId)?.index]?.type,'fixed');
 g.health=1;g.player.inv=0;g.hurt();assert.equal(g.mode,'respawning');for(let i=0;i<120&&g.mode!=='playing';i++)tick(g,1);assert.equal(g.lives,2);
 assert.equal(g.mode,'playing');assert.equal(g.room,5);assert.ok(Math.abs(g.player.x-(x0+STUDIO_CHECKPOINTS[1].x))<4,'respawn at the reached checkpoint');
});

test('a whole studio run with ordinary inputs breaks all three transmitters and opens the door',async()=>{
 const g=ready(),lib=await studioLib(),stood=new Set(),step=g.step.bind(g);g.step=(dt,input)=>{step(dt,input);if(g.player.grounded)stood.add(g.player.supportId);};
 assert.equal(crossStudio(g,lib),true);
 assert.ok(![...stood].some(id=>id?.startsWith('5:')&&perch(+id.slice(2))),'no route hop lands on a perch');
 assert.ok(g.relays.filter(d=>d.room===5).every(d=>d.hp===0));assert.equal(g.health,4,'a timed run never falls');
 for(let i=0;i<400&&g.room===5;i++)g.step(1/60,{right:true});assert.notEqual(g.mode,'playing');
});
