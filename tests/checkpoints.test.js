import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {rooms,createEnemies} from '../level.js';
import {checkpointMarkers,checkpointVisual,TERMINAL_SKINS} from '../checkpoint-art.js';
import {MAX_BOTS,botsOf} from '../botfarm.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(room){const g=new Game({story:false,cinematic:true});g.start();g.tutorial.complete=true;activateRoom(g,room);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.baitOff=true;return g;}
function reach(g,marker){Object.assign(g.player,{x:marker.x-17,y:marker.y-48,h:48,vx:0,vy:0,grounded:true,supportId:g.room+':'+marker.index,inv:99});tick(g,2);}

test('option A uses a distinct grounded Yuri terminal for every location, with portrait windows inside both registered states',()=>{
 const columns=new Set();
 for(const room of [1,3,5,7]){
  const skin=TERMINAL_SKINS[room];columns.add(skin.col);
  for(const active of [false,true]){
   const marker={room,x:100,y:300,active},v=checkpointVisual(marker),s=v.screen;
   assert.equal(v.box[0],skin.col*384);assert.equal(v.box[1],active?512:0);
   assert.ok(s.x>=v.x&&s.y>=v.y&&s.x+s.w<=v.x+v.w&&s.y+s.h<=v.y+v.h);
   assert.ok(s.w>29&&s.h>23,'the original Yuri portrait remains readable');
   assert.ok(Math.abs(v.y+skin.feet[active?1:0]*.22-marker.y)<.001,'the support/anchor stays on its platform');
  }
 }
 assert.equal(columns.size,4);
});

for(const room of [1,3,5,7])test('visible checkpoint in room '+room+' activates once, survives death and resets on location retry',()=>{
 const g=ready(room),markers=checkpointMarkers(g),marker=markers[Math.floor(markers.length/2)];
 assert.equal(markers.length,1);assert.ok((marker.x-rooms[room].x)/rooms[room].width>1/3&&(marker.x-rooms[room].x)/rooms[room].width<2/3);assert.ok(markers.every(m=>{const s=g.platforms.find(s=>s.id===room+':'+m.index);return !m.active&&m.y===s.y&&m.terminalX>=s.x+32&&m.terminalX<=s.x+s.w-32;}));
 reach(g,marker);assert.ok(checkpointMarkers(g).find(m=>m.rank===marker.rank).current);assert.equal(g.events.filter(e=>e.type==='checkpoint').length,1);
 tick(g,4);assert.equal(g.events.filter(e=>e.type==='checkpoint').length,1);
 g.mode='paused';const before=JSON.stringify(g);tick(g,60,{right:true});assert.equal(JSON.stringify(g),before);g.mode='playing';
 g.loseLife('damage');tick(g,70);assert.equal(g.mode,'playing');assert.equal(g.health,4);assert.equal(g.lives,2);assert.equal(g.player.supportId,room+':'+marker.index);assert.ok(Math.abs(g.player.x-(marker.x-17))<2);
 g.retryLocation();assert.ok(checkpointMarkers(g).every(m=>!m.active));assert.equal(g.player.supportId,room+':0');
});

for(const health of [4,3,2,1])test('Clickbait returns Uma to a reached checkpoint with '+health+' hearts, without charging two whole lives',()=>{
 const g=ready(7),marker=checkpointMarkers(g)[0];reach(g,marker);g.health=health;
 Object.assign(g.player,{x:rooms[7].x+1200,y:200,flipped:true,launch:1,launchVx:300,dropTime:.2,dropConsumed:true,dash:.1,climbing:true});
 const captor={id:'bait',room:7,type:'clickbait',dead:true,captureTime:.5};g.enemies=[captor];g.swallow={enemyId:captor.id,timer:.01,total:.48};tick(g,1);
 assert.equal(g.swallow,null);assert.equal(captor.captureTime,null);
 if(health>2){assert.equal(g.health,health-2);assert.equal(g.lives,3);assert.equal(g.mode,'playing');assert.equal(g.enemies[0],captor,'teleport does not revive enemies or reset the level');}
 else{assert.equal(g.lives,2);assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.health,4);}
 assert.equal(g.player.flipped,false);assert.equal(g.player.launch,0);assert.equal(g.player.dash,0);assert.equal(g.player.dropTime,0);assert.equal(g.player.supportId,'7:'+marker.index);assert.equal(g.player.vy,0);assert.ok(g.player.inv>0);assert.ok(Math.abs(g.player.x-(marker.x-17))<2);
});

test('new newsroom Fakenews balance applies to the whole roster without changing other locations',()=>{
 const roster=createEnemies(),fakes=roster.filter(e=>e.type==='fakenews'&&e.room===1);
 assert.equal(fakes.length,5);assert.ok(fakes.every(e=>e.hp===2&&e.maxHp===2&&e.speed===48));
});

test('two supported studio farms print more often, keep their own bot cap and stop when broken',()=>{
 const g=ready(5),farms=createEnemies().filter(e=>e.room===5&&e.type==='botfarm');g.enemies=[...farms];
 for(const farm of farms){Object.assign(farm,{active:true,noticed:true,spawnTime:0,noticeTime:0,timer:0});const s=g.platforms.find(s=>s.id==='5:'+farm.platformIndex);assert.ok(farm.x>=s.x&&farm.x+farm.w<=s.x+s.w);assert.equal(farm.y+farm.h,s.y);}
 const times=new Map(farms.map(f=>[f.id,[]]));
 for(let i=0;i<60*12;i++){
  tick(g,1);for(const event of g.events)if(event.type==='botSpawn'){const bot=g.enemies.find(e=>e.type==='bot'&&e.x===event.x&&e.y===event.y);assert.ok(bot);times.get(bot.ownerId).push(g.time);}
  g.events=[];for(const farm of farms)assert.ok(botsOf(g,farm).length<=MAX_BOTS);
 }
 for(const farm of farms){const printed=times.get(farm.id);assert.ok(printed.length>=2);assert.ok(printed[1]-printed[0]<5.6,'less than the old 6.6-second cycle');farm.inv=0;g.hitEnemy(farm);farm.inv=0;g.hitEnemy(farm);farm.inv=0;g.hitEnemy(farm);assert.ok(farm.dead);}
 tick(g,90);assert.ok(g.enemies.filter(e=>e.type==='bot').every(e=>e.dead));assert.ok(!g.events.some(e=>e.type==='botSpawn'));
});
