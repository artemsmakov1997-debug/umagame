import {rooms as campaignRooms} from '../level.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,WORLD,HEIGHT,FINAL_X,LAST_ROOM,ARENA_WIDTH,PORTAL_X,platforms} from '../engine.js';
import {spawns as checkpoints,enemy,createRelays} from '../level.js';
import {stepProjectiles,bossDocks} from '../boss.js';
import {stepWorldPlatforms} from '../world-platforms.js';
import {alertNearby} from '../enemies.js';
import {jumpTo,supportOf,walkTo} from './navigation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function setup(room=1,index=0,x=45){const g=new Game({story:false});g.start();g.tutorial.complete=true;g.abilities={attack:true,dash:true,sneak:true};g.enemies=[];g.fishes=[];g.soups=[];g.room=room;g.checkpoint=room;g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);const s=g.platforms.find(s=>s.room===room&&s.index===index);Object.assign(g.player,{x:campaignRooms[room].x+x,y:s.y-48,grounded:true,supportId:s.id});return g;}
test('the boss dimension occupies two full screens and has multiple complete platform routes',()=>{
 const g=setup(LAST_ROOM),stage=g.platforms.filter(s=>s.room===LAST_ROOM);assert.equal(ARENA_WIDTH,WIDTH*2);assert.equal(WORLD-FINAL_X,ARENA_WIDTH);assert.ok(stage.length>=16);assert.ok(new Set(stage.map(s=>s.y)).size>=8);assert.ok(stage.every(s=>s.x>=FINAL_X&&s.x+s.w<=WORLD));assert.ok(Math.max(...g.boss.network.monitors.map(m=>m.x))-Math.min(...g.boss.network.monitors.map(m=>m.x))>800);
});
test('the tower portal actually pulls Uma into a separate checkpoint and starts the boss after the transition',()=>{
 const g=setup(7,21,2140);g.relays.filter(d=>d.room===7).forEach(d=>d.hp=0);g.health=1;g.lives=2;tick(g,4,{right:true});assert.equal(g.mode,'enteringArena');const x=g.player.x;tick(g,25,{left:true,jump:true,attack:true});assert.ok(g.player.x>x);assert.ok(g.player.warpScale<1);tick(g,80);assert.equal(g.mode,'playing');assert.equal(g.room,LAST_ROOM);assert.equal(g.checkpoint,LAST_ROOM);assert.equal(g.lives,2);assert.equal(g.health,4);assert.equal(g.boss.active,true);assert.ok(g.camera>=FINAL_X);assert.equal(g.events.filter(e=>e.type==='arenaEnter').length,1);tick(g,80,{left:true});assert.ok(g.player.x>=FINAL_X+4);assert.ok(g.player.x<FINAL_X+100);
});
test('Esc freezes the portal pull and resumes the same transition without duplicating entry',()=>{
 const g=setup(7,21,2140);g.relays.filter(d=>d.room===7).forEach(d=>d.hp=0);tick(g,1,{right:true});tick(g,20);g.pausedFrom=g.mode;g.mode='paused';const snapshot=JSON.stringify(g);tick(g,200,{right:true});assert.equal(JSON.stringify(g),snapshot);g.mode=g.pausedFrom;delete g.pausedFrom;tick(g,100);assert.equal(g.room,LAST_ROOM);assert.equal(g.events.filter(e=>e.type==='arenaEnter').length,1);
});
test('both lower and upper arena routes are reachable through actual jumping and walking',()=>{
 for(const [route,minX] of [[[1,16,9],450],[[1,4,2,5,3,13],1200]]){const g=setup(LAST_ROOM,0,74);g.boss.active=false;for(const index of route)assert.equal(jumpTo(g,LAST_ROOM,index),true,'arena platform '+index);assert.equal(g.health,4);assert.ok(g.player.x>FINAL_X+minX);}
});
test('losing a life in the dimension restarts there and preserves collected items and investigation records',()=>{
 const g=setup(LAST_ROOM,0,74);g.arenaEntered=true;g.evidence=[{room:1,id:'autopublish'}];g.lifePickups[0].taken=true;g.health=1;g.hurt();assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.room,LAST_ROOM);assert.equal(g.checkpoint,LAST_ROOM);assert.equal(g.player.x,checkpoints[LAST_ROOM].x);assert.equal(g.boss.active,true);assert.equal(g.boss.hp,32);assert.equal(g.lifePickups[0].taken,true);assert.equal(g.evidence.length,1);assert.ok(g.camera>=FINAL_X);
});
test('Shift gives invulnerability throughout the actual dash and damage returns after it ends',()=>{
 const g=setup(),x=g.player.x;g.step(1/60,{dash:true,right:true});assert.equal(g.player.dash,.2);assert.equal(g.player.vx,430);assert.ok(g.player.x>x);for(const kind of ['paper','packet','rain','wave']){g.bolts=[{kind,x:g.player.x+4,y:g.player.y+4,w:20,h:16,vx:0,vy:0,ttl:1,fixedY:true}];stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.equal(g.health,4,kind);}g.hurt();g.push(-1,g.player.x+40);assert.equal(g.health,4);assert.equal(g.player.knock,0);tick(g,10);assert.ok(g.player.dash>0);g.hurt();assert.equal(g.health,4);tick(g,4);assert.equal(g.player.dash,0);g.player.inv=0;g.hurt();assert.equal(g.health,3);
});
test('falling loses a full life even during a dash, then restores the checkpoint',()=>{const g=setup();g.player.y=HEIGHT+35;g.player.dash=.1;g.hurt(true);assert.equal(g.lives,2);assert.equal(g.health,0);assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.health,4);assert.equal(g.player.y,checkpoints[1].y);});
test('a hidden cat-face cache restores one life, leaves hearts unchanged and cannot be collected twice',()=>{
 const g=setup(1,3,980),life=g.lifePickups.find(l=>l.room===1);Object.assign(g.player,{x:life.x-17,y:life.y-24});g.lives=2;g.health=1;tick(g,1);assert.equal(g.lives,3);assert.equal(g.health,1);assert.equal(life.taken,true);tick(g,60);assert.equal(g.lives,3);assert.equal(g.events.filter(e=>e.type==='lifePickup').length,1);
});
test('full lives leave a cache available; consumed caches stay spent after death and reset on restart',()=>{
 const g=setup(1,3,980),life=g.lifePickups.find(l=>l.room===1);Object.assign(g.player,{x:life.x-17,y:life.y-24});tick(g,1);assert.equal(life.taken,false);g.lives=2;tick(g,1);assert.equal(life.taken,true);g.loseLife();tick(g,70);assert.equal(life.taken,true);assert.equal(g.lives,2);g.start();assert.ok(g.lifePickups.every(l=>!l.taken));
});
test('each arena has an accessible side cache and every chapter has two optional caches',()=>{
 for(const room of campaignRooms.filter(r=>r.index>0)){const g=setup(room.index),caches=g.lifePickups.filter(l=>l.room===room.index);assert.equal(caches.length,room.arena?1:2);for(const life of caches){const s=g.platforms.find(s=>s.room===room.index&&s.index===life.platformIndex);assert.ok(life.x>s.x&&life.x<s.x+s.w);assert.equal(life.y,s.y-24);}if(room.arena){if(room.index===2){const t=g.platforms.find(s=>s.id==='2:1');Object.assign(g.player,{x:t.x+20,y:t.y-48,grounded:true,supportId:t.id});}for(const index of (room.index===2?[3]:room.index===6?[17,3]:room.index===4?[13,9,2,14]:room.index===8?[1,16,9]:[14,9]))assert.equal(jumpTo(g,room.index,index),true);g.lives=2;assert.equal(walkTo(g,caches[0].x-17),true);tick(g,2);assert.equal(caches[0].taken,true);assert.equal(g.lives,3);}}
});
test('TV horizontal platforms carry Uma and their passengers without fake walking or sliding',()=>{
 const g=setup(5,1,340),s=g.platforms.find(s=>s.room===5&&s.index===1),e=enemy('panicker',5,430,1,{active:true,noticed:true,state:'recover',timer:999});g.enemies=[e];const px=g.player.x-s.x,ex=e.x-s.x,x=s.x;tick(g,60);assert.ok(Math.abs(s.x-x)>30);assert.ok(Math.abs(g.player.x-s.x-px)<.001);assert.ok(Math.abs(e.x-s.x-ex)<.001);assert.equal(g.player.grounded,true);assert.equal(e.walkTime,0);assert.equal(g.health,4);
});
test('the TV lift carries feet vertically, releases a jump and freezes with the whole stage in pause',()=>{
 const g=setup(5);g.platformClocks[5]=3.7;stepWorldPlatforms(g,0);const s=g.platforms.find(s=>s.room===5&&s.index===10);Object.assign(g.player,{x:s.x+45,y:s.y-48,grounded:true,supportId:s.id});const y=s.y;tick(g,40);assert.notEqual(s.y,y);assert.equal(g.player.y+g.player.h,s.y);g.mode='paused';const snapshot=JSON.stringify(g);tick(g,80);assert.equal(JSON.stringify(g),snapshot);g.mode='playing';g.step(1/60,{jump:true});assert.equal(g.player.grounded,false);assert.ok(g.player.vy<0);
});
test('portal minions on a travelling studio platform inherit its current position and patrol bounds',()=>{
 const g=setup(5),owner=enemy('panicker',5,360,1,{active:true,noticed:true,state:'alarm',timer:999});g.enemies=[owner];alertNearby(g,owner);tick(g,70);const s=g.platforms.find(s=>s.room===5&&s.index===1),minion=g.enemies.find(e=>e.portalMinion);assert.ok(minion);assert.equal(minion.y+minion.h,s.y);assert.ok(minion.x>=s.x+12&&minion.x<=s.x+s.w-60);assert.equal(minion.origin,s.x+12);assert.equal(minion.end,s.x+s.w-60);
});
test('Нагнетатели stand on roofs and their wave really blows Uma off the edge',()=>{
 const g=setup(3,3,930),roof=g.platforms.find(s=>s.id==='3:3'),e=enemy('inflator',3,1010,3,{active:true,noticed:true,state:'blast',timer:.3,dir:-1});g.enemies=[e];tick(g,1);assert.ok(g.player.knock>0);for(let i=0;i<40&&g.player.grounded!==false;i++)tick(g,1);tick(g,12);assert.ok(g.player.x+g.player.w<roof.x+4,'blown off the roof');assert.equal(g.health,4);for(const m of new Game().enemies.filter(e=>e.type==='inflator'))assert.equal(platforms.find(s=>s.room===m.room&&s.index===m.platformIndex).roof?.type,'building');
});
test('satellites are on high platforms, open from one swing, and broadcast consoles deliberately require three hits',()=>{
 const dishes=createRelays();assert.equal(dishes.length,15);assert.ok(dishes.every(d=>d.room!==1),'the newsroom conveyor has no nodes');for(const d of dishes){assert.equal(d.hp,d.room===4?3:d.scripted?0:1);assert.equal(d.kind,({1:'printer',3:'broadcast',5:'edit',7:'signal'})[d.room]||'dish');const s=platforms.find(s=>s.room===d.room&&s.index===d.platformIndex);assert.equal(d.y+d.h,s.y);if(d.room!==8&&d.room!==3&&!d.scripted)assert.ok(s.y<=204);if(d.room===3)assert.equal(s.roof.type,'building');else assert.ok(d.scripted||d.platformIndex>=7);}
});
