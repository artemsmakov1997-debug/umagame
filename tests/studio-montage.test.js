import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {solidSurfaces} from '../terrain.js';
import {rooms,createEnemies,platforms} from '../level.js';
import {STUDIO_PIECES,TAKES,STUDIO_CHECKPOINTS,SPOTLIGHTS} from '../studio-map.js';
import {stageLit,liveTake} from '../studio-systems.js';
import {botHop,BOT_BEAT,MAX_BOTS,botsOf} from '../botfarm.js';
import {planCut,CUT_HUNTER} from '../tactical-enemies.js';
import {crossStudio,studioLib,jumpTo} from './navigation.js';
// «Студия» (room 5): a dark stage whose risers exist only in a spotlight, lamp banks switching on the clapper,
// and monsters sealed in containers off the route: Нарезчик (hanging capsule), Склейка (floor grate), Ботоферма (wall cage).
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

test('the first lamp swings over two risers: each exists only in its light, and one of them is always lit',()=>{
 const g=ready(),[a,b]=[1,2].map(i=>g.platforms.find(s=>s.id==='5:'+i));let darkA=0,darkB=0,both=0;
 for(let i=0;i<60*8;i++){tick(g,1);for(const s of [a,b])assert.equal(s.intangible,!stageLit(s.studio,g.time));assert.ok(!(a.intangible&&b.intangible),'one riser is always lit');darkA+=a.intangible;darkB+=b.intangible;both+=!a.intangible&&!b.intangible;}
 assert.ok(darkA>60&&darkB>60,'each riser goes dark for real');assert.ok(both>30,'in the middle of the swing both are lit');
 assert.ok(STUDIO_PIECES.every(p=>!['holo','perch'].includes(p.type)&&p.kind!=='perch'),'no holograms or perches are left');
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

const container=i=>STUDIO_PIECES[i]?.type==='container';
const enemyOn=(g,type,index)=>g.enemies.find(e=>e.type===type&&e.platformIndex===index);
function arm(g,e){Object.assign(e,{active:true,noticed:true,spawnTime:0,noticeTime:0,timer:0});return e;}

test('every studio monster sits in a sealed container off the route that a paw cannot break',()=>{
 const roster=createEnemies().filter(e=>e.room===5),kinds={cutter:'hang',splicer:'floor',botfarm:'wall'};
 for(const e of roster){assert.ok(container(e.platformIndex),e.id);assert.equal(STUDIO_PIECES[e.platformIndex].kind,kinds[e.type],e.id);assert.equal(e.container,kinds[e.type]);}
 assert.deepEqual(roster.filter(e=>e.type==='botfarm').map(e=>e.printOn),[3,8,11]);assert.ok(roster.filter(e=>e.type==='cutter').every(e=>e.hunter));
 // Above, below or beside the route — never in Uma's way: no route surface lies within reach of a container's box.
 const route=STUDIO_PIECES.filter(p=>p.type!=='container');
 for(const p of STUDIO_PIECES.filter(p=>p.type==='container')){const under=route.filter(r=>r.x<p.x+p.w&&r.x+r.w>p.x);
  if(p.kind==='hang')assert.ok(under.every(r=>r.y-p.y>=100),'a capsule hangs high over the route');
  if(p.kind==='floor')assert.ok(under.every(r=>p.y-r.y>=100),'a grate lies deep under the route');
  if(p.kind==='wall')assert.ok(under.every(r=>r.y-p.y>=55),'a cage hangs above Uma\'s head');}
 const g=ready({enemies:true});for(const s of g.platforms.filter(s=>s.room===5&&container(s.index))){assert.equal(s.intangible,true);assert.ok(!solid(g,s.id));}
 for(const e of g.enemies.filter(e=>e.room===5)){arm(g,e);e.inv=0;const hp=e.hp;assert.equal(g.hitEnemy(e),false);assert.equal(e.hp,hp);assert.ok(e.guardFlash>0);}
 assert.ok(g.events.some(e=>e.type==='blocked'));
 // Touching a container never hurts.
 const farm=g.enemies.find(e=>e.type==='botfarm');g.enemies=[farm];farm.timer=99;Object.assign(g.player,{x:farm.x,y:farm.y,inv:0});const health=g.health;tick(g,3);assert.equal(g.health,health);
});
test('the caged Ботоферма prints up to three bots that jump together, from platform to platform towards Uma',()=>{
 const g=ready({enemies:true}),farm=arm(g,g.enemies.find(e=>e.type==='botfarm'&&e.printOn===3));g.enemies=[farm];stand(g,4,900);const x=farm.x;
 let together=0,crossed=false;
 for(let i=0;i<60*14;i++){g.player.inv=999;Object.assign(g.player,{x:x0+900});tick(g,1);const bots=botsOf(g,farm),air=bots.filter(b=>b.jumpPhase==='air');if(bots.length>1&&air.length===bots.length)together++;if(bots.some(b=>b.platformIndex===4&&!b.jumpPhase))crossed=true;}
 assert.ok(g.events.some(e=>e.type==='botPrint'));assert.ok(botsOf(g,farm).length<=MAX_BOTS);assert.equal(farm.x,x,'the cage never moves');
 assert.ok(together>10,'the bots share one beat');assert.ok(crossed,'a bot jumped across the gap onto the dolly');assert.ok(g.events.some(e=>e.type==='botLand'));
});
test('a bot on a riser that goes dark falls into the pit',()=>{
 const g=ready({enemies:true}),farm=arm(g,g.enemies.find(e=>e.type==='botfarm'&&e.printOn===8));g.enemies=[farm];stand(g,8,1440);g.player.inv=999;
 for(let i=0;i<60*4&&!botsOf(g,farm).length;i++)tick(g,1);const [bot]=botsOf(g,farm);assert.ok(bot);farm.timer=999;
 const riser=g.platforms.find(s=>s.id==='5:5');
 // Wait for a moment when riser 5 is lit but about to go dark, and put the bot on it; it hops on the spot meanwhile.
 for(let i=0;i<60*8&&!(stageLit(riser.studio,g.time)&&!stageLit(riser.studio,g.time+.4));i++)tick(g,1);
 Object.assign(bot,{x:riser.x+36,y:riser.y-bot.h,platformIndex:5,spawnTime:0,jumpPhase:null,vx:0,vy:0,noticed:false,lastBeat:Math.floor(g.time/BOT_BEAT)});
 for(let i=0;i<60*3&&!bot.dead;i++){bot.lastBeat=Math.floor(g.time/BOT_BEAT);tick(g,1);}
 assert.equal(bot.dead,true,'the dark riser drops the bot');
});
test('a bot hurts on contact and dies from one paw swing',()=>{
 const g=ready({enemies:true}),farm=arm(g,g.enemies.find(e=>e.type==='botfarm'&&e.printOn===8));g.enemies=[farm];stand(g,8,1430);g.player.inv=999;
 for(let i=0;i<60*4&&!botsOf(g,farm).length;i++)tick(g,1);const [bot]=botsOf(g,farm);assert.ok(bot);
 for(let i=0;i<60*2&&(bot.spawnTime>0||bot.jumpPhase);i++)tick(g,1);farm.timer=99;
 g.player.inv=0;Object.assign(g.player,{x:bot.x,y:bot.y+bot.h-48,vy:0});const health=g.health;tick(g,1);assert.equal(g.health,health-1);
 g.player.inv=0;bot.inv=0;assert.equal(g.hitEnemy(bot),true);assert.equal(bot.dead,true);
});
test('the hunter Нарезчик aims from its capsule right under Uma, wide and fast, on trusses, risers and takes alike',()=>{
 const g=ready({enemies:true}),cutter=arm(g,enemyOn(g,'cutter',15));g.enemies=[cutter];
 for(const [index,local] of [[3,600],[4,880],[6,1170]]){g.cuts=[];stand(g,index,local);tick(g,1);cutter.timer=0;cutter.state='patrol';
  assert.equal(planCut(g,cutter),true,'cuts piece '+index);const cut=g.cuts[0],s=g.platforms.find(s=>s.id===cut.platformId);
  assert.equal(s.index,index);assert.ok(cut.w>=Math.min(CUT_HUNTER.width,s.w-2*CUT_HUNTER.margin)-.01);assert.equal(cut.time,CUT_HUNTER.warning);
  const mid=s.x+cut.localX+cut.w/2;assert.ok(Math.abs(mid-(g.player.x+g.player.w/2))<s.w/2,'aimed at Uma');}
 const far=ready({enemies:true}),c2=arm(far,enemyOn(far,'cutter',17));far.enemies=[c2];stand(far,10,1770);far.time=TAKES.beat+.1;tick(far,1);
 assert.equal(planCut(far,c2),true);assert.equal(far.platforms.find(s=>s.id===far.cuts[0].platformId).index,10,'a live take is cut too');
 assert.ok(!platforms.some(s=>s.room===5&&(container(s.index)||s.index===14)&&s.cuttable));
});
test('a real hunter cut drops Uma from the dolly; the Нарезчик keeps cutting every couple of seconds',()=>{
 const g=ready({enemies:true}),cutter=arm(g,enemyOn(g,'cutter',15));g.enemies=[cutter];stand(g,4,880);g.player.inv=0;
 let fell=false,cuts=new Set();for(let i=0;i<60*8;i++){tick(g,1);for(const c of g.cuts)cuts.add(c.id);if(g.events.some(e=>e.type==='roofFall'))fell=true;if(g.player.grounded&&g.player.supportId==='5:4')Object.assign(g.player,{x:g.player.x});}
 assert.ok(fell,'standing still on a cut mark is a fall');assert.ok(cuts.size>=2,'several cuts in eight seconds');
});

test('a Склейка in its floor grate drags Uma off a riser into the pit unless she dashes',()=>{
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

test('a whole studio run with ordinary inputs follows the light to the door',async()=>{
 const g=ready(),lib=await studioLib(),stood=new Set(),step=g.step.bind(g);g.step=(dt,input)=>{step(dt,input);if(g.player.grounded)stood.add(g.player.supportId);};
 assert.equal(crossStudio(g,lib),true);
 assert.ok(![...stood].some(id=>id?.startsWith('5:')&&container(+id.slice(2))),'no route hop lands on a container');
 assert.ok(g.relays.filter(d=>d.room===5).every(d=>d.hp===0));assert.equal(g.health,4,'a timed run never falls');
 for(let i=0;i<400&&g.room===5;i++)g.step(1/60,{right:true});assert.notEqual(g.mode,'playing');
});
