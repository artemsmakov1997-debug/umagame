import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom,beginLocationTransition} from '../room-transitions.js';
import {stepBoss,damageBoss,bossShielded} from '../boss.js';
import {stepStudioPlatforms,studioDock} from '../manipulator-combat.js';
import {solidSurfaces} from '../terrain.js';
import {jumpTo} from './navigation.js';
import {rooms} from '../level.js';
import {routeInfo} from '../route-transition-art.js';
function ready(){const g=new Game({story:false,cinematic:true,testingInvulnerable:true});g.start();activateRoom(g,6);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;return g;}
function ticks(g,n){for(let i=0;i<n;i++)g.step(1/60,{});}
test('all three permanent camera docks are reachable through ordinary jumps',()=>{
 const g=ready();g.boss.active=false;
 for(const index of[6,7,1,9,10,2,10,9,1,7,6,17,3])assert.ok(jumpTo(g,6,index),'studio platform '+index);
 assert.ok(g.platforms.filter(s=>s.room===6).every(s=>!s.motion));
});
test('a live chase crosses the entire active arena without falling, using the permanent docks to wait for return',()=>{
 const g=ready();
 for(const [look,route]of[[[6,7],[6,7,1]],[[9,10],[9,10,2]],[[10,9],[10,9,1]],[[7,6,17],[7,6,17,3]]]){
  let waited=0;
  for(;waited<1500;waited++){const next=look.map(index=>g.platforms.find(s=>s.id==='6:'+index));if(next.every(s=>s.studioPhase==='solid'&&s.studioTimer>3.5))break;g.step(1/60);}
  assert.ok(waited<1500,'route must reopen');for(const index of route)assert.ok(jumpTo(g,6,index),'active chase '+index);
 }
 assert.equal(g.events.filter(e=>e.type==='testRescue').length,0);
});
test('standing on a hologram warns, removes its actual collision, then restores it',()=>{
 const g=ready(),s=g.platforms.find(s=>s.id==='6:7');Object.assign(g.player,{x:s.x+10,y:s.y-48,grounded:true,supportId:s.id});
 stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'warning');assert.ok(solidSurfaces(g).includes(s));
 for(let i=0;i<43;i++)stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'gap');assert.ok(!solidSurfaces(g).includes(s));
 g.player.grounded=false;for(let i=0;i<95;i++)stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'solid');assert.ok(solidSurfaces(g).includes(s));
});
test('the camera never removes all holographic routes together',()=>{const g=ready();g.player.grounded=false;for(let i=0;i<2400;i++){stepStudioPlatforms(g,1/60);assert.ok(g.platforms.filter(s=>s.room===6&&['gap','forming'].includes(s.studioPhase)).length<=2);}});
test('laser has a fixed telegraph and real horizontal damage, jumping and Shift protect',()=>{
 for(const evade of['none','dash','jump']){
  const g=ready(),b=g.boss,n=b.studio,s=studioDock(g,b.dock);g.testingInvulnerable=false;Object.assign(g.player,{x:s.x+5,y:s.y-48,inv:0,dash:0});
  n.mode='rewrite';n.timer=0;stepBoss(g,1/60);assert.equal(n.mode,'charge');const beam={...n.beam};
  g.player.x-=10;stepBoss(g,.2);assert.deepEqual(n.beam,beam);assert.equal(g.health,4);
  n.timer=0;stepBoss(g,1/60);assert.equal(n.mode,'beam');Object.assign(g.player,{x:beam.x+beam.w-25,y:beam.y-5,inv:0,dash:evade==='dash'?.2:0});if(evade==='jump')g.player.y=beam.y-60;
  stepBoss(g,1/60);assert.equal(g.health,evade==='none'?3:4);
 }
});
test('six real counters move the camera between supported docks and preserve the original interlude',()=>{
 const g=ready(),b=g.boss,positions=[];assert.equal(bossShielded(g),false);
 for(let i=0;i<6;i++){
  positions.push(b.dock);b.studio.mode='recover';b.state='recover';b.cooldown=0;
  assert.ok(damageBoss(g,1));if(i<5){assert.equal(b.studio.mode,'relocate');assert.equal(damageBoss(g,1),false);for(let j=0;j<60;j++)stepBoss(g,1/60);const s=studioDock(g,b.dock);assert.equal(b.y+b.h,s.y);}
 }
 assert.equal(new Set(positions).size,3);assert.equal(g.mode,'bossDefeat');assert.equal(g.bolts.length,0);g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'interlude');assert.equal(g.interlude.boss,'manipulator');
});
test('pause freezes beam and disappearing floors, and retry restores the arena',()=>{
 const g=ready();g.platforms.find(s=>s.id==='6:7').studioPhase='gap';g.mode='paused';const before=JSON.stringify(g);ticks(g,120);assert.equal(JSON.stringify(g),before);g.retryLocation();assert.ok(g.platforms.filter(s=>s.room===6).every(s=>s.studioPhase==='solid'));assert.equal(g.boss.studio.relocations,0);assert.equal(bossShielded(g),false);
});
test('three chapter maps use the right landmarks, transfer once and respect pause',()=>{
 for(const [room,to,fromIndex,toIndex]of[[2,3,0,1],[4,5,1,2],[6,7,2,3]]){
  const g=ready();activateRoom(g,room);g.relays.forEach(d=>d.hp=0);g.bossesDefeated.add(g.boss.id);assert.ok(beginLocationTransition(g,to));assert.deepEqual(routeInfo(g.loading),{from:fromIndex,to:toIndex,step:fromIndex});
  g.mode='paused';const before=JSON.stringify(g);ticks(g,90);assert.equal(JSON.stringify(g),before);g.mode='loading';ticks(g,120);assert.equal(g.room,to);assert.equal(g.mode,'playing');assert.equal(g.events.filter(e=>e.type==='locationReady').length,1);
 }
});
test('Spreader has no shield and an arena of floor, two shelters and two side ledges',()=>{const g=ready();activateRoom(g,2);assert.equal(bossShielded(g),false);const s=g.platforms.filter(s=>s.room===2);assert.equal(s.length,5);assert.equal(s.filter(p=>p.shelter).length,2);});
