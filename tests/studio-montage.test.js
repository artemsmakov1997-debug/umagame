import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {solidSurfaces} from '../terrain.js';
import {rooms,createEnemies,platforms,enemy} from '../level.js';
import {STUDIO_PIECES,TAKES,STUDIO_CHECKPOINTS,SPOTLIGHTS} from '../studio-map.js';
import {stageLit,liveTake} from '../studio-systems.js';
import {botHop,BOT_BEAT,MAX_BOTS,botsOf} from '../botfarm.js';
import {SPOTLIGHTER,BOOM,beamBox,boomBox} from '../studio-monsters.js';
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
 const own=platforms.filter(s=>s.room===5);assert.equal(own.length,STUDIO_PIECES.filter(p=>p.type!=='removed').length);assert.ok(!own.some(s=>s.index===13),'the last blue take is removed');assert.ok(own.some(s=>s.index===10),'the earlier blue take stays');
 for(const s of own){assert.deepEqual(s.studio,STUDIO_PIECES[s.index]);assert.equal(s.motion,null);}
 const g=ready();assert.equal(g.mapProps.filter(d=>d.room===5).length,0);assert.equal(g.routePortals.filter(r=>r.room===5).length,0);
 assert.deepEqual([...new Set(createEnemies().filter(e=>e.room===5).map(e=>e.type))].sort(),['boom','botfarm','spotlight']);
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

test('red and blue takes both support Uma for 0.85 seconds before the clapper switches',()=>{
 const g=ready(),red=g.platforms.find(s=>s.id==='5:9'),blue=g.platforms.find(s=>s.id==='5:10');
 for(const color of [0,1]){const end=(color+1)*TAKES.beat;
  g.time=end-TAKES.overlap-.04;tick(g,1);assert.equal(solid(g,red.id),color===0);assert.equal(solid(g,blue.id),color===1);
  g.time=end-TAKES.overlap+.001;tick(g,1);assert.ok(solid(g,red.id)&&solid(g,blue.id));
  const incoming=color===0?blue:red;stand(g,incoming.index,incoming.x-x0+12);
  for(let i=0;i<48;i++){tick(g,1);assert.equal(g.player.supportId,incoming.id);assert.ok(solid(g,red.id)&&solid(g,blue.id));}
  assert.ok(g.events.some(e=>e.type==='takeWarning'));tick(g,4);assert.equal(liveTake(g.time).color,color===0?'blue':'red');assert.equal(solid(g,red.id),color!==0);assert.equal(solid(g,blue.id),color===0);
 }
});

const container=i=>STUDIO_PIECES[i]?.type==='container';
const enemyOn=(g,type,index)=>g.enemies.find(e=>e.type===type&&e.platformIndex===index);
function arm(g,e){Object.assign(e,{active:true,noticed:true,spawnTime:0,noticeTime:0,timer:0});return e;}

test('a Журавль sweeps his boom at head height: standing Uma is knocked back, crouching she crawls under; a hit stuns him, three break him',()=>{
 const mk=()=>{const g=ready({enemies:true}),e=arm(g,g.enemies.find(e=>e.type==='boom'&&e.platformIndex===3));g.enemies=[e];return {g,e};};
 const sweep=(g,e)=>{for(let i=0;i<120&&e.state!=='sweep';i++)tick(g,1);return e.state==='sweep';};
 let {g,e}=mk();stand(g,3,640);assert.ok(sweep(g,e));const box=boomBox(g,e);assert.ok(box.x<=x0+640&&box.x+box.w>=x0+660,'the boom reaches over the truss');
 tick(g,2);assert.equal(g.health,3,'standing under the boom is a knock');assert.ok(g.events.some(v=>v.type==='boomHit'));
 ({g,e}=mk());stand(g,3,640);tick(g,1,{down:true});assert.ok(sweep(g,e));for(let i=0;i<30;i++)tick(g,1,{down:true,right:i%2===0});assert.equal(g.health,4,'crawling under it is safe');
 // Waiting for the boom to go up lets her walk.
 ({g,e}=mk());stand(g,3,640);assert.ok(sweep(g,e));g.player.inv=99;for(let i=0;i<200&&e.state==='sweep';i++)tick(g,1);g.player.inv=0;assert.equal(e.state,'patrol');tick(g,5);assert.equal(g.health,4);
 ({g,e}=mk());stand(g,3,680);e.inv=0;assert.equal(g.hitEnemy(e),true);assert.equal(e.state,'stunned');for(let k=0;k<2;k++){e.inv=0;g.hitEnemy(e);}assert.equal(e.dead,true);
});
test('a Прожектор rides the ceiling rail and slows Uma by 45% without cutting the floor',()=>{
 const mk=()=>{const g=ready({enemies:true}),e=arm(g,g.enemies.find(e=>e.type==='spotlight'&&e.platformIndex===4));g.enemies=[e];return {g,e};};
 let {g,e}=mk();stand(g,8,1450);const startX=e.x;tick(g,60);assert.ok(e.x>startX+40);assert.ok(e.y+e.h<120);assert.equal(g.hitEnemy(e),false);
 ({g,e}=mk());stand(g,4,800);for(let i=0;i<200&&e.state!=='burn';i++)tick(g,1);assert.equal(e.state,'burn');tick(g,5);assert.equal(g.cuts.length,0);assert.ok(solid(g,'5:4'));assert.equal(g.health,4);assert.ok(g.player.spotSlowed);
 stand(g,3,610);e.beamX=g.player.x+17;e.timer=9;e.state='burn';tick(g,1,{right:true});assert.equal(g.player.vx,155*.55);
 stand(g,3,700);tick(g,1,{right:true});assert.equal(g.player.vx,155);assert.equal(g.player.spotSlowed,false);
 ({g,e}=mk());stand(g,4,880);for(let i=0;i<200&&e.state!=='burn';i++)tick(g,1,{down:true});const box=beamBox(g,e);assert.ok(box.y+box.h<=g.player.y+2);tick(g,20,{down:true});assert.equal(g.player.spotSlowed,false);assert.equal(g.cuts.length,0);assert.equal(g.health,4);
});
test('the huge Ботоферма at the far end sends bots left between fixed islands without falling',()=>{
 const g=ready({enemies:true}),farm=arm(g,g.enemies.find(e=>e.type==='botfarm'));g.enemies=[farm];assert.equal(farm.platformIndex,11);assert.ok(farm.h>=120,'big');assert.equal(farm.container,undefined);
 stand(g,4,880);let reached=false,fell=0;const fixed=new Set(STUDIO_PIECES.map((p,i)=>p.type==='fixed'?i:null).filter(i=>i!==null));
 for(let i=0;i<60*20;i++){g.player.inv=999;Object.assign(g.player,{x:x0+880});tick(g,1);fell+=g.events.filter(v=>v.type==='copyDissolve'&&v.reason!=='exit').length;g.events=[];for(const b of botsOf(g,farm))if(!b.jumpPhase&&(b.platformIndex===4||b.platformIndex===8))reached=true;}
 assert.ok(g.events.length>=0);assert.ok(reached,'a bot leapt left across to the fixed islands');assert.equal(fell,0,'no bot fell into a pit');
 assert.equal(g.hitEnemy(farm),true,'the machine can be broken');assert.equal(farm.hp,2);
});
test('a bot over a dark riser falls into the pit',()=>{
 const g=ready({enemies:true}),farm=arm(g,g.enemies.find(e=>e.type==='botfarm'));farm.timer=999;g.enemies=[farm];stand(g,11,1900);g.player.inv=999;
 const riser=g.platforms.find(s=>s.id==='5:5');let t=0;for(;t<20;t+=.05)if([0,.2,.5,.8,1].every(d=>!stageLit(riser.studio,t+d)))break;assert.ok(t<20);g.time=t;
 const bot=enemy('bot',5,riser.x-x0+36,5,{active:true,noticed:true,ownerId:farm.id,w:28,h:28,lastBeat:Math.floor(t/BOT_BEAT)});bot.y=riser.y-bot.h;g.enemies.push(bot);
 for(let i=0;i<90&&!bot.dead;i++)tick(g,1);
 assert.equal(bot.dead,true,'the dark riser drops the bot');
});
test('a bot hurts on contact and dies from one paw swing',()=>{
 const g=ready({enemies:true}),farm=arm(g,g.enemies.find(e=>e.type==='botfarm'));g.enemies=[farm];stand(g,11,1900);g.player.inv=999;
 for(let i=0;i<60*4&&!botsOf(g,farm).length;i++)tick(g,1);const [bot]=botsOf(g,farm);assert.ok(bot);
 for(let i=0;i<60*2&&(bot.spawnTime>0||bot.jumpPhase);i++)tick(g,1);farm.timer=99;
 g.player.inv=0;Object.assign(g.player,{x:bot.x,y:bot.y+bot.h-48,vy:0});const health=g.health;tick(g,1);assert.equal(g.health,health-1);
 g.player.inv=0;bot.inv=0;assert.equal(g.hitEnemy(bot),true);assert.equal(bot.dead,true);
});
test('the hanging flat over the dolly is a low ceiling: standing Uma stops at its edge, crouching she passes under',()=>{
 const g=ready(),flat=STUDIO_PIECES[15];assert.equal(flat.kind,'flat');const s=g.platforms.find(s=>s.id==='5:15');assert.equal(s.shelter,flat.shelter);
 stand(g,4,800);for(let i=0;i<60;i++)tick(g,1,{right:true});assert.ok(g.player.x+g.player.w<=x0+flat.x+6,'blocked standing');
 for(let i=0;i<240&&g.player.x<x0+flat.x+flat.w;i++)tick(g,1,{right:true,down:true});assert.ok(g.player.x>=x0+flat.x+flat.w-4,'crawled under');
});


test('falls cost one heart and return to the last safe truss; checkpoints follow the blocks',async()=>{
 const g=ready();stand(g,8,1480);tick(g,2);assert.equal(g.studio.checkpoint,1);
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
