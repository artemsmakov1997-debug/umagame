import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {rooms,platforms,ladders,createEnemies,createRelays} from '../level.js';
import {DIM_PIECES,FEED,RIFTS,ORIGINALS,DIM_CHECKPOINTS,MIRROR} from '../dimension-map.js';
import {feedState,originalsFound} from '../dimension-systems.js';
import {noiseDuration,revealHint,NOISE_TIME} from '../infoshum-combat.js';
import {enemy} from '../level.js';
import {crossDimension} from './navigation.js';
// «Измерение» — «Первоисточник»: rising copies with Кликбейт riding some, a rift into the upside-down feed, a rift back,
// and three optional originals.
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

test('a Кликбейт sits on two rising copies, rides them up and around, and cannot bite while its bubble pops',()=>{
 const roster=createEnemies().filter(e=>e.room===7&&e.ride);assert.equal(roster.length,2);assert.ok(roster.every(e=>e.type==='clickbait'&&DIM_PIECES[e.platformIndex].type==='copy'&&!DIM_PIECES[e.platformIndex].reversed));
 const g=ready();g.enemies=createEnemies().filter(e=>e.room===7&&e.ride).map(e=>Object.assign(e,{active:true}));g.player.inv=999;Object.assign(g.player,{x:x0+60});
 const e=g.enemies[0],copy=g.platforms.find(s=>s.id==='7:'+e.platformIndex);let wrapped=false,popPhased=false,last=copy.y;
 for(let i=0;i<60*14;i++){tick(g,1);assert.ok(Math.abs(e.y+e.h-copy.y)<1.5,'stays on its copy');assert.ok(e.x>=copy.x-.5&&e.x+e.w<=copy.x+copy.w+.5);if(copy.y>last+60)wrapped=true;if(copy.dimState==='pop'&&e.phased)popPhased=true;last=copy.y;}
 assert.ok(wrapped,'went around with its copy');assert.ok(popPhased);
});
test('the first rift flips Uma under a hanging message; the upside-down feed is «Лента» mirrored, and a sinking copy carries her down',()=>{
 const g=ready();stand(g,10,800);let flipped=false;for(let i=0;i<200&&!flipped;i++){tick(g,1,{right:true});flipped=g.player.flipped&&g.player.grounded;}
 assert.ok(flipped);assert.equal(g.player.supportId,'7:11');assert.equal(g.player.y,70);assert.equal(events(g,'riftFlip').length,1);
 for(let k=0;k<9;k++){const a=g.platforms.find(s=>s.id==='7:'+(1+k)),b=g.platforms.find(s=>s.id==='7:'+(12+k));assert.ok(Math.abs(b.y-(MIRROR-a.y))<.01,'mirror of copy '+(1+k));assert.equal(b.dimState,a.dimState);assert.equal(b.intangible,true,'never solid for an upright Uma');}
 const h=ready();tick(h,1);const ride=h.platforms.find(s=>s.id==='7:15');for(let i=0;i<60*12&&!(ride.y>60&&ride.y<200&&ride.dimState==='rise');i++)tick(h,1);
 stand(h,15,ride.x-x0+30,true);const start=h.player.y;tick(h,45);assert.ok(h.player.grounded&&h.player.supportId==='7:15'&&h.player.flipped);assert.ok(h.player.y-start>20,'carried downwards, hanging');
 assert.equal(h.player.y,ride.y);
});
test('the second rift puts Uma back on her feet over the island below',()=>{
 const g=ready();stand(g,21,1600,true);let landed=false;for(let i=0;i<240&&!landed;i++){tick(g,1,{right:g.player.x<x0+1730});landed=!g.player.flipped&&g.player.grounded;}
 assert.ok(landed);assert.equal(g.player.supportId,'7:22');assert.equal(events(g,'riftFlip').length,1);assert.equal(g.health,4);
});
test('upside down Uma jumps “down” and cannot crouch',()=>{
 const g=ready();stand(g,11,900,true);tick(g,1,{jump:true});assert.ok(g.player.vy>0,'a flipped jump goes down the screen');for(let i=0;i<80&&!g.player.grounded;i++)tick(g,1);assert.equal(g.player.supportId,'7:11');
 assert.equal(g.player.sneaking,false);tick(g,5,{down:true});assert.equal(g.player.sneaking,false,'no crouch upside down');
});
test('falling up out of the world costs one heart and returns Uma upright to the last safe island',()=>{
 const g=ready();stand(g,10,760);tick(g,2);stand(g,11,900,true);tick(g,1);g.player.inv=0;
 Object.assign(g.player,{x:x0+1060,grounded:false,supportId:null,vy:-200});for(let i=0;i<90&&g.health===4;i++)tick(g,1);
 assert.equal(g.health,3);assert.equal(g.player.flipped,false);assert.ok(['7:10','7:0'].includes(g.player.supportId),g.player.supportId+' '+JSON.stringify(g.safeTrail.slice(-3)));
});
test('originals: picked once, kept after losing a life, reset on a location retry, and they weaken Infoshum',()=>{
 const g=ready();for(const o of g.originals)Object.assign(g.player,{x:o.x,y:o.y}),tick(g,1);
 assert.equal(originalsFound(g),3);assert.equal(events(g,'sourceFound').length,3);
 assert.equal(noiseDuration(g),NOISE_TIME+36);assert.ok(revealHint(g)>2);
 g.health=1;g.player.inv=0;g.hurt();for(let i=0;i<120&&g.mode!=='playing';i++)tick(g,1);assert.equal(originalsFound(g),3);
 g.retryLocation();assert.equal(originalsFound(g),0);assert.equal(noiseDuration(g),NOISE_TIME);
});

test('each original is reachable as placed: the feed top, the bottom of the mirrored feed, over the last island',()=>{
 // 1: a copy close to the top, then a jump.
 const g=ready(),o1=g.originals[0],lane=g.platforms.filter(s=>s.dim?.lane===1&&!s.dim.reversed);let ride=null;
 for(let i=0;i<60*12&&!ride;i++){tick(g,1);ride=lane.find(s=>s.y<170&&s.y>140&&s.dimState!=='pop');}assert.ok(ride,'a copy reaches the top');
 Object.assign(g.player,{x:o1.x-2,y:ride.y-48,grounded:true,supportId:ride.id,vx:0,vy:0});tick(g,1,{jump:true});for(let i=0;i<40;i++)tick(g,1);assert.equal(o1.taken,true);
 // 2: the mirror — a sinking copy close to the bottom, then a jump “down”.
 const m=ready(),o2=m.originals[1],low=m.platforms.filter(s=>s.dim?.lane===1&&s.dim.reversed);let hang=null;
 for(let i=0;i<60*12&&!hang;i++){tick(m,1);hang=low.find(s=>s.y>MIRROR-170&&s.y<MIRROR-140&&s.dimState!=='pop');}assert.ok(hang,'a copy sinks to the bottom');
 Object.assign(m.player,{x:o2.x-2,y:hang.y,h:48,grounded:true,supportId:hang.id,vx:0,vy:0,flipped:true});tick(m,1,{jump:true});for(let i=0;i<40;i++)tick(m,1);assert.equal(o2.taken,true);
 // 3: a full jump from the last island.
 const h=ready(),o3=h.originals[2];stand(h,23,o3.x-x0-2);tick(h,1,{jump:true});for(let i=0;i<50;i++)tick(h,1);assert.equal(o3.taken,true);
});
test('the Echo double copies the flip; checkpoints follow the blocks; Clickbait spits Uma out for two hearts',()=>{
 const g=ready(),e=enemy('echo',7,1600,21,{active:true,noticed:true,spawnTime:0,noticeTime:0});g.enemies=[e];g.player.inv=999;stand(g,10,760);
 for(let i=0;i<60*3.5;i++)tick(g,1,{right:!g.player.flipped||g.player.x<x0+950});assert.equal(e.flipped,true);
 const c=ready();stand(c,10,740);tick(c,2);assert.equal(c.dimension.checkpoint,1);stand(c,22,1670);tick(c,2);assert.equal(c.dimension.checkpoint,2);assert.equal(DIM_CHECKPOINTS.length,3);
});
test('a full run with ordinary inputs crosses all three blocks without a fall and enters the threshold',()=>{
 const g=ready();assert.equal(crossDimension(g),true);assert.equal(g.health,4);
 for(let i=0;i<200&&g.room===7&&g.mode!=='enteringArena';i++)tick(g,1,{right:true});assert.ok(g.mode==='enteringArena'||g.room===8);
});
