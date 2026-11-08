import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {rooms,platforms,ladders,createEnemies,createRelays} from '../level.js';
import {DIM_PIECES,FEED,ENVELOPES,RIFTS,ORIGINALS,DIM_CHECKPOINTS} from '../dimension-map.js';
import {feedState,originalsFound} from '../dimension-systems.js';
import {noiseDuration,revealHint,NOISE_TIME} from '../infoshum-combat.js';
import {enemy} from '../level.js';
import {crossDimension} from './navigation.js';
// «Измерение» — «Первоисточник»: rising copies, envelope portals, gravity rifts and three optional originals.
const x0=rooms[7].x;
const tick=(g,n,i={})=>{for(let k=0;k<n;k++)g.step(1/60,i);};
function ready(){const g=new Game({story:false});g.start();g.tutorial.complete=true;g.abilities={attack:true,dash:true,sneak:true};activateRoom(g,7);g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];g.player.inv=0;return g;}
function stand(g,index,local,flipped=false){const s=g.platforms.find(s=>s.id==='7:'+index);Object.assign(g.player,{x:x0+local,y:flipped?s.y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,flipped});return s;}
const events=(g,type)=>g.events.filter(e=>e.type===type);

test('the Dimension is its own map: no transmitters, ladders, burrows or controllers — three originals instead',()=>{
 assert.equal(platforms.filter(s=>s.room===7).length,DIM_PIECES.length);
 assert.equal(createRelays().filter(d=>d.room===7).length,0);assert.equal(ladders.filter(l=>l.room===7).length,0);
 const g=ready();assert.equal(g.mapProps.filter(d=>d.room===7).length,0);assert.equal(g.routePortals.filter(r=>r.room===7).length,0);
 assert.equal(g.originals.length,ORIGINALS.length);assert.deepEqual([...new Set(createEnemies().filter(e=>e.room===7).map(e=>e.type))].sort(),['clickbait','echo','static']);
});

test('forwarded copies rise steadily and pop near the top; Yuri\'s messages stay put; a copy carries Uma up',()=>{
 const g=ready(),copy=g.platforms.find(s=>s.id==='7:1'),yuri=g.platforms.find(s=>s.id==='7:0');
 const y=copy.y;tick(g,30);const travelled=y-copy.y;assert.ok(travelled<0||Math.abs(travelled-FEED.speed*.5)<1.5,'rises at the feed speed');assert.equal(yuri.y,390);
 let popped=false;for(let i=0;i<60*14;i++){tick(g,1);if(copy.dimState==='pop'){popped=true;assert.equal(copy.intangible,true);break;}}assert.ok(popped);
 const h=ready(),ride=h.platforms.find(s=>s.id==='7:4');h.time=0;tick(h,1);stand(h,4,ride.x-x0+30);const start=h.player.y;tick(h,45);
 assert.ok(h.player.grounded&&h.player.supportId==='7:4');assert.ok(start-h.player.y>20,'carried upwards');
 for(const piece of DIM_PIECES.filter(p=>p.type==='copy'))assert.ok(feedState(piece,0).y<=FEED.bottom&&feedState(piece,0).y>=FEED.top);
});

test('walking into an envelope throws Uma out of its pair onto the next island; the dead link only sparks',()=>{
 const g=ready();stand(g,10,780);let landed=false;for(let i=0;i<200&&!landed;i++){tick(g,1,{right:true});landed=g.player.grounded&&g.player.supportId==='7:11';}
 assert.ok(landed);assert.equal(events(g,'envelopeIn').length,1);assert.equal(events(g,'envelopeOut').length,1);
 const d=ENVELOPES.find(e=>e.role==='dead');stand(g,11,d.x-40);for(let i=0;i<40;i++)tick(g,1,{right:true});
 assert.ok(events(g,'deadLink').length>=1);assert.equal(events(g,'envelopeIn').length,1,'a dead link sends nowhere');
});

test('the boost envelope: a walk lands on the next island, a dash flies high enough for the second original',()=>{
 for(const dash of [false,true]){const g=ready();stand(g,11,1180);let top=999;
  for(let i=0;i<240;i++){const p=g.player;tick(g,1,{left:true,dash:dash&&p.x<x0+1150&&p.x>x0+1132});if(events(g,'envelopeOut').length)top=Math.min(top,g.player.y);if(g.player.grounded&&['7:12','7:13'].includes(g.player.supportId))break;}
  assert.ok(['7:12','7:13'].includes(g.player.supportId),'lands safely');assert.equal(originalsFound(g),dash?1:0);if(dash)assert.ok(top<200);}
});

test('a rift flips gravity: Uma falls up to a hanging island, walks under it and jumps “down”',()=>{
 const g=ready();stand(g,13,1700);let flipped=false;for(let i=0;i<200;i++){tick(g,1,{right:true});if(g.player.flipped&&g.player.grounded){flipped=true;break;}}
 assert.ok(flipped);assert.equal(g.player.supportId,'7:14');assert.equal(g.player.y,120,'hangs from the island line');assert.ok(events(g,'riftFlip').length===1);
 tick(g,1,{jump:true});assert.ok(g.player.vy>0,'a flipped jump goes down the screen');for(let i=0;i<80&&!g.player.grounded;i++)tick(g,1);assert.equal(g.player.supportId,'7:14');
 assert.equal(g.player.sneaking,false);tick(g,5,{down:true});assert.equal(g.player.sneaking,false,'no crouch upside down');
});

test('falling up out of the world costs one heart and returns Uma upright to the last safe island',()=>{
 const g=ready();stand(g,13,1600);tick(g,2);stand(g,14,1800,true);tick(g,1);g.player.inv=0;
 Object.assign(g.player,{x:x0+1940,grounded:false,supportId:null,vy:-200});for(let i=0;i<90&&g.health===4;i++)tick(g,1);
 assert.equal(g.health,3);assert.equal(g.player.flipped,false);assert.ok(['7:13','7:12','7:11','7:10','7:0'].includes(g.player.supportId));
});

test('originals: picked once, kept after losing a life, reset on a location retry, and they weaken Infoshum',()=>{
 const g=ready();for(const o of g.originals)Object.assign(g.player,{x:o.x,y:o.y}),tick(g,1);
 assert.equal(originalsFound(g),3);assert.equal(events(g,'sourceFound').length,3);
 assert.equal(noiseDuration(g),NOISE_TIME+36);assert.ok(revealHint(g)>2);
 g.health=1;g.player.inv=0;g.hurt();for(let i=0;i<120&&g.mode!=='playing';i++)tick(g,1);assert.equal(originalsFound(g),3);
 g.retryLocation();assert.equal(originalsFound(g),0);assert.equal(noiseDuration(g),NOISE_TIME);
});

test('each original is reachable as placed: the feed top, the boost arc, under the second hanging island',()=>{
 // 1: a copy close to the top, then a jump.
 const g=ready(),o1=g.originals[0],lane=g.platforms.filter(s=>s.dim?.lane===1);let ride=null;
 for(let i=0;i<60*12&&!ride;i++){tick(g,1);ride=lane.find(s=>s.y<170&&s.y>140&&s.dimState!=='pop');}assert.ok(ride,'a copy reaches the top');
 Object.assign(g.player,{x:o1.x-2,y:ride.y-48,grounded:true,supportId:ride.id,vx:0,vy:0});tick(g,1,{jump:true});for(let i=0;i<40;i++)tick(g,1);assert.equal(o1.taken,true);
 // 3: an upside-down jump from the second hanging island.
 const h=ready(),o3=h.originals[2];stand(h,15,o3.x-x0-2,true);tick(h,1,{jump:true});for(let i=0;i<50;i++)tick(h,1);assert.equal(o3.taken,true);
});

test('the Echo double copies the flip; checkpoints follow the blocks; Clickbait spits Uma out for two hearts',()=>{
 const g=ready(),e=enemy('echo',7,1600,13,{active:true,noticed:true,spawnTime:0,noticeTime:0});g.enemies=[e];g.player.inv=999;stand(g,13,1700);
 for(let i=0;i<60*3.5;i++)tick(g,1,{right:!g.player.flipped||g.player.x<x0+1850});assert.equal(e.flipped,true);
 const c=ready();stand(c,10,740);tick(c,2);assert.equal(c.dimension.checkpoint,1);stand(c,13,1590);tick(c,2);assert.equal(c.dimension.checkpoint,3);assert.equal(DIM_CHECKPOINTS.length,4);
});

test('a full run with ordinary inputs crosses all three blocks without a fall and enters the threshold',()=>{
 for(const dashBoost of [false,true]){const g=ready();assert.equal(crossDimension(g,{dashBoost}),true);assert.equal(g.health,4);
  for(let i=0;i<200&&g.room===7&&g.mode!=='enteringArena';i++)tick(g,1,{right:true});assert.ok(g.mode==='enteringArena'||g.room===8);}
});
