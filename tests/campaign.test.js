import test from 'node:test';
import assert from 'node:assert/strict';
import {monsterFrame} from '../monster-animation.js';
import {Game,rooms,chapters,WIDTH,LAST_ROOM,PORTAL_ROOM,PORTAL_X} from '../engine.js';
import {enemy,createEnemies,createNotebooks} from '../level.js';
import {activateRoom,canLeaveRoom,remainingAntennas} from '../room-transitions.js';
import {handleFlyingContact,stepSplicer,stepTether} from '../campaign-enemies.js';
import {bossPatterns,planAttack,castAttack,stepBoss,damageBoss} from '../boss.js';
import {chooseFakeLanding} from '../enemy-traversal.js';
import {alertNearby,stepPortals} from '../enemies.js';
import {jumpTo,walkTo,antennaRoutes} from './navigation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(room=1,story=false){const g=new Game({story});g.start();if(story){g.finishWakeup();g.advanceDialogue(true);}g.tutorial.complete=true;activateRoom(g,room);g.player.inv=0;g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];return g;}
const actor=(type,room,x,index=0,extra={})=>enemy(type,room,x,index,{active:true,noticed:true,spawnTime:0,...extra});
test('four large chapters each have a separate complete boss arena and three assigned regular species',()=>{
 assert.equal(rooms.length,9);for(const chapter of chapters){const main=rooms[chapter.room],arena=rooms[chapter.arena];assert.equal(main.width,WIDTH*3);assert.equal(arena.width,WIDTH*2);assert.equal(arena.boss,chapter.boss);assert.deepEqual(new Set(createEnemies().filter(e=>e.room===chapter.room).map(e=>e.type)),new Set(chapter.monsters));assert.equal(createEnemies().filter(e=>e.room===chapter.arena).length,0);assert.ok(new Game().platforms.filter(s=>s.room===chapter.arena).length>=18);}
});
test('each of the 17 one-hit antennas can be reached and broken using ordinary movement and jumps',()=>{
 let broken=0;for(const room of rooms.filter(r=>!r.tutorial)){const g=ready(room.index);g.boss.active=false;const route=room.arena?[14,9,10,11,12,13]:antennaRoutes[room.index];for(const index of route){if(room.index===5&&index===10)for(let i=0;i<650;i++){const lift=g.platforms.find(s=>s.id==='5:10');if(lift.dy<0&&lift.y>300)break;g.step(1/60);}assert.equal(jumpTo(g,room.index,index),true,room.name+':'+index);const d=g.relays.find(d=>d.room===room.index&&d.platformIndex===index);if(d){const s=g.platforms.find(s=>s.id===g.player.supportId);assert.equal(walkTo(g,Math.max(s.x+4,Math.min(s.x+s.w-38,d.x-37))),true);g.player.cooldown=0;g.step(1/60,{attack:true,right:true});assert.equal(d.hp,0,d.id);broken++;}}assert.equal(remainingAntennas(g).length,0);assert.equal(g.health,4);}assert.equal(broken,17);
});
test('an open chapter exit pauses for loading, transfers once, and freezes in Esc pause',()=>{
 const g=ready();assert.equal(g.leaveRoom(),false);g.relays.filter(d=>d.room===1).forEach(d=>d.hp=0);assert.equal(g.leaveRoom(),true);assert.equal(g.mode,'loading');tick(g,15,{attack:true,right:true});assert.equal(g.room,1);const load=JSON.stringify(g.loading);g.mode='paused';tick(g,120);assert.equal(JSON.stringify(g.loading),load);g.mode='loading';tick(g,55);assert.equal(g.room,2);assert.equal(g.checkpoint,2);assert.equal(g.mode,'playing');assert.equal(g.boss.id,'spreader');assert.equal(g.events.filter(e=>e.type==='locationEnter'&&e.room===2).length,1);
});
test('boss arenas require both the antenna and the boss, and losing a life preserves a broken shield',()=>{
 const g=ready(2);assert.equal(canLeaveRoom(g),false);g.relays.filter(d=>d.room===2).forEach(d=>d.hp=0);assert.equal(canLeaveRoom(g),false);g.health=1;g.hurt();tick(g,70);assert.equal(g.room,2);assert.equal(remainingAntennas(g).length,0);assert.equal(g.boss.hp,g.boss.maxHp);g.boss.state='recover';g.boss.cooldown=0;assert.equal(damageBoss(g,99),true);assert.equal(canLeaveRoom(g),true);assert.equal(g.evidence.length,1);
});
test('all three minibosses telegraph distinct media attacks and recover; their antennas shield them',()=>{
 for(const room of [2,4,6]){const g=ready(room),b=g.boss;assert.equal(damageBoss(g,2,true),false);g.relays.filter(d=>d.room===room).forEach(d=>d.hp=0);const casts=new Set();for(let i=0;i<2100;i++){stepBoss(g,1/60);for(const e of g.events)if(e.type==='bossCast')casts.add(e.ability);g.events=[];}assert.deepEqual(casts,new Set(bossPatterns[b.id]));assert.ok(g.bolts.length>0);b.state='recover';b.cooldown=0;g.player.x=b.x+b.w/2-b.dir*100;assert.equal(damageBoss(g,1),true);}
});
test('Spreader flies between attacks and drops real falling newspapers',()=>{
 const g=ready(2),b=g.boss;b.ability='scatter';castAttack(g);const x=b.x,y=b.y;for(let i=0;i<60;i++){g.time+=1/60;stepBoss(g,1/60);}assert.ok(b.x!==x||b.y!==y);assert.ok(g.bolts.length>=4);assert.ok(g.bolts.every(b=>b.vy>0&&b.kind==='paper'));
});
test('Manipulator opens actual temporary platform cuts and marks the selected frame',()=>{
 const g=ready(6);g.boss.turn=bossPatterns.manipulator.indexOf('cut');planAttack(g);assert.equal(g.boss.ability,'cut');assert.ok(g.cuts.length>=1);assert.ok(g.cuts.every(c=>c.phase==='warning'&&c.ownerId==='boss:manipulator'));tick(g,65);assert.ok(g.cuts.some(c=>c.phase==='gap'));
});
test('Panicker starts alarms ten seconds apart and releases three Fakenews from each completed portal',()=>{
 const g=ready(3),e=actor('panicker',3,160,0,{timer:0,speed:0});g.enemies=[e];g.player.x=rooms[3].x+15;const starts=[];for(let i=0;i<760;i++){g.player.inv=100;g.step(1/60);for(const event of g.events)if(event.type==='alarm')starts.push(g.time);g.events=[];for(const m of g.enemies)if(m.portalMinion){m.timer=999;m.jumpCooldown=999;m.speed=0;}}assert.ok(starts.length>=2);assert.ok(Math.abs(starts[1]-starts[0]-10)<.06);assert.equal(g.enemies.filter(e=>e.portalMinion).length,6);
});
test('Skleyka pulls for five seconds, contact damages hearts, and Shift or a hit breaks the tape',()=>{
 for(const escape of ['dash','hit','timeout']){const g=ready(5),e=actor('splicer',5,180,0,{state:'windup',timer:0,speed:0});g.enemies=[e];stepSplicer(g,e,1/60,-100,0);assert.equal(g.tether.remaining,5);stepTether(g,1/60);assert.equal(g.player.pulled,true);assert.ok(g.player.vx>0);if(escape==='dash'){g.player.dash=.2;stepTether(g,1/60);}else if(escape==='hit')g.hitEnemy(e);else for(let i=0;i<301;i++)stepTether(g,1/60);assert.equal(g.tether,null);assert.equal(g.player.pulled,false);}
 const g=ready(5),e=actor('splicer',5,45,0,{state:'pulling',timer:5});g.enemies=[e];g.tether={ownerId:e.id,remaining:5,total:5};tick(g,1);assert.equal(g.health,3);
});
test('Echo sends Uma to a safe earlier visited ledge without losing hearts, stocks, fish or antenna progress',()=>{
 const g=ready(7),s=g.platforms.find(s=>s.id==='7:11');Object.assign(g.player,{x:s.x+60,y:s.y-48,grounded:true,supportId:s.id,inv:0});g.safeTrail=[{platformId:'7:0',x:rooms[7].x+40,y:312},{platformId:'7:1',x:rooms[7].x+330,y:244}];g.visitedPlatforms.add('7:1');g.echoImmunity=0;g.fish=9;g.relays.find(d=>d.room===7).hp=0;const e=actor('echo',7,1100,11);Object.assign(e,{x:g.player.x,y:g.player.y});g.enemies=[e];const x=g.player.x;handleFlyingContact(g,e);assert.equal(g.mode,'echoWarp');tick(g,12);g.mode='paused';const snapshot=JSON.stringify(g);tick(g,120);assert.equal(JSON.stringify(g),snapshot);g.mode='echoWarp';tick(g,25);assert.equal(g.mode,'playing');assert.ok(g.player.x<x-220);assert.equal(g.health,4);assert.equal(g.lives,3);assert.equal(g.fish,9);assert.equal(remainingAntennas(g).length,2);assert.ok(g.player.inv>0);assert.ok(e.warpCooldown>7);handleFlyingContact(g,e);assert.equal(g.mode,'playing');
});
test('a protected dash ignores Echo and the Static lunge; Static otherwise damages and pushes down',()=>{
 for(const type of ['echo','static'])for(const dash of [0,.2]){const g=ready(7),e=actor(type,7,45,0,{state:'lunge',strikeHit:false});Object.assign(e,{x:g.player.x,y:g.player.y});g.enemies=[e];g.echoImmunity=0;g.player.dash=dash;handleFlyingContact(g,e);if(dash){assert.equal(g.mode,'playing');assert.equal(g.health,4);}else if(type==='echo')assert.equal(g.mode,'echoWarp');else{assert.equal(g.health,3);assert.ok(g.player.vy>0);assert.ok(Math.abs(g.player.vx)>=280);}}
});
test('Fakenews and Vbros select real detours toward a distant player and never teleport',()=>{
 for(const type of ['fakenews','injection']){const g=ready(type==='fakenews'?1:5),r=g.room,s=g.platforms.find(s=>s.room===r&&s.index===12);Object.assign(g.player,{x:s.x+60,y:s.y-48,supportId:s.id});const e=actor(type,r,100,0,{jumpCooldown:0});g.enemies=[e];const target=chooseFakeLanding(g,e);assert.ok(target);assert.ok(target.platform.x<g.player.x-500);assert.ok(target.walkTarget!==undefined||Math.abs(target.vx)<=250);const x=e.x;tick(g,1);assert.ok(Math.abs(e.x-x)<12);assert.ok(e.navWalkX!==undefined||e.jumpPhase==='prepare');}
 const g=ready(5),e=actor('injection',5,180,0,{state:'windup',timer:0,aim:{x:g.player.x,y:g.player.y+10}});g.enemies=[e];tick(g,1);assert.ok(g.events.some(e=>e.type==='tickerShot'));assert.equal(monsterFrame('injection',g.time,e),4,'the actual shot displays the attack pose');
});
test('all decorated big screens and ladder tops allow a normal jump without frozen input',async()=>{
 const {hauntedScreens}=await import('../campaign-art.js');for(const m of hauntedScreens){const g=ready(m.room),s=g.platforms.find(s=>s.room===m.room&&s.index===2);Object.assign(g.player,{x:s.x+s.w-56,y:s.y-48,grounded:true,supportId:s.id});const y=g.player.y;g.step(1/60,{up:true,jump:true});assert.ok(g.player.vy<0);assert.ok(g.player.y<y);assert.equal(g.player.climbing,false);assert.equal(g.mode,'playing');}
});
test('location retry restores local boss and antennas while keeping earlier campaign progress',()=>{
 const g=ready(4);g.bossesDefeated.add('spreader');g.relays.filter(d=>d.room===2||d.room===4).forEach(d=>d.hp=0);g.fish=17;g.notebooks=createNotebooks();g.notebooks[0].taken=true;g.lives=0;g.mode='lost';g.retryLocation();assert.equal(g.mode,'playing');assert.equal(g.lives,3);assert.equal(g.health,4);assert.equal(g.room,4);assert.equal(remainingAntennas(g,2).length,0);assert.equal(remainingAntennas(g,4).length,1);assert.ok(g.bossesDefeated.has('spreader'));assert.equal(g.boss.id,'agitator');assert.equal(g.fish,17);assert.equal(g.notebooks[0].taken,true);
});

test('the numerous primary enemies can pursue through a complete chapter rather than remaining on the first screen',()=>{
 for(const [type,room,index]of [['fakenews',1,21],['injection',5,23],['informant',3,21],['static',7,21]]){
  const g=ready(room),s=g.platforms.find(s=>s.room===room&&s.index===index),px=s.x+45,py=s.y-48,e=actor(type,room,100,0,{jumpCooldown:0,teleportCooldown:0});g.enemies=[e];let reached=false;
  for(let i=0;i<11000;i++){Object.assign(g.player,{x:px,y:py,grounded:true,supportId:s.id,inv:999});g.updateCamera();const before=e.x;g.step(1/60);if(['fakenews','injection'].includes(type))assert.ok(Math.abs(e.x-before)<65,'physical pursuit');if(Math.abs(e.x-px)<195&&Math.abs(e.y+e.h-s.y)<145){reached=true;break;}}
  assert.equal(reached,true,type+' crosses the chapter');assert.ok(e.x>rooms[room].x+1900,type+' reaches the final sector');
 }
});
