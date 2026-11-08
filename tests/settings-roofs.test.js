import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {rooms,enemy} from '../level.js';
import {handleFlyingContact} from '../campaign-enemies.js';
import {activateRoom} from '../room-transitions.js';
import {solidSurfaces} from '../terrain.js';
import {jumpTo,walkTo,climbRoofs,roofLib} from './navigation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(protectedMode=false){const g=new Game({story:false,testingInvulnerable:protectedMode});g.start();activateRoom(g,3);g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];return g;}
test('temporary protection: a fall into the street returns Uma to her last roof without losing a heart',()=>{
 const g=ready(true);g.health=2;g.hurt();assert.equal(g.health,2);g.loseLife('clickbait');assert.equal(g.lives,3);assert.equal(g.mode,'playing');
 Object.assign(g.player,{y:560,grounded:false});tick(g,1);assert.equal(g.lives,3);assert.equal(g.health,2);assert.equal(g.player.supportId,'3:0');assert.ok(g.events.some(e=>e.type==='roofFall'));
 g.start();assert.equal(g.testingInvulnerable,true);g.testingInvulnerable=false;g.start();assert.equal(g.testingInvulnerable,false);
});
test('on the roofs a fall costs one heart and returns Uma to the last safe roof; the last heart costs a life and restarts at the checkpoint',()=>{
 const g=ready(true);g.testingInvulnerable=false;const roof=g.platforms.find(s=>s.id==='3:2');Object.assign(g.player,{x:roof.x+120,y:roof.y-48,grounded:true,supportId:roof.id});tick(g,2);g.roofs.checkpoint=1;
 Object.assign(g.player,{y:560,grounded:false,dash:.2,inv:99});g.health=3;tick(g,1);assert.equal(g.health,2);assert.equal(g.lives,3);assert.equal(g.player.supportId,'3:2');assert.ok(g.player.inv>1);
 Object.assign(g.player,{y:560,grounded:false,inv:0});g.health=1;tick(g,1);assert.equal(g.lives,2);assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.mode,'playing');assert.equal(g.health,4);assert.equal(g.room,3);assert.equal(g.player.supportId,'3:2');
});
test('a trampoline in the alley throws Uma up to the next roof; holding ↓ lets her stand on it; a miss drops her in the street',()=>{
 const g=ready(true),t0=g.platforms.find(s=>s.id==='3:8'),a0=g.platforms.find(s=>s.id==='3:0'),a1=g.platforms.find(s=>s.id==='3:1');assert.equal(t0.roof.type,'awning');assert.ok(a1.y<a0.y-115,'out of reach of an ordinary jump');
 Object.assign(g.player,{x:a0.x+a0.w-40,y:a0.y-48,grounded:true,supportId:a0.id});for(let i=0;i<200&&g.player.supportId!==a1.id;i++)tick(g,1,{right:true});assert.equal(g.player.supportId,a1.id);assert.ok(g.events.some(e=>e.type==='roofBounce'));
 const h=ready(true);Object.assign(h.player,{x:t0.x+20,y:t0.y-48,grounded:true,supportId:t0.id});tick(h,30,{down:true});assert.equal(h.player.supportId,t0.id);
 const m=ready(true),a2=m.platforms.find(s=>s.id==='3:2');Object.assign(m.player,{x:a2.x+a2.w+14,y:a2.y,grounded:false,supportId:null,vx:0,vy:0});for(let i=0;i<200&&!m.events.some(e=>e.type==='roofFall');i++)tick(m,1);assert.ok(m.events.some(e=>e.type==='roofFall'),'a gap between roofs drops into the street');
});
test('a taller building\'s wall stops Uma below its roof line',()=>{
 const g=ready(true),a1=g.platforms.find(s=>s.id==='3:1'),wall=a1.x+5;Object.assign(g.player,{x:wall-g.player.w-2,y:a1.y+40,grounded:false,vy:0,vx:0});tick(g,6,{right:true});assert.ok(g.player.x+g.player.w<=wall+.5);
});
test('the roofs are crossed with real trampoline bounces and jumps, waiting out the gusts',async()=>{
 const g=ready(),lib=await roofLib();assert.equal(climbRoofs(g,lib),true);assert.equal(g.lives,3);
});
test('a flock of Сенсации warns, knocks a standing Uma along its flight, misses a crouched one and pops to a paw',async()=>{
 const {flockState,BIRD,lanes}=await roofLib(),lane=lanes.SENSATION_LANES[0];
 const at=(g,k)=>{g.time=Math.ceil(g.time/lane.period+1)*lane.period-lane.phase+k;};
 for(const pose of ['stand','crouch','dash']){const g=ready(),rope=g.platforms.find(s=>s.id==='3:2'),seen=[],emit=g.emit.bind(g);g.emit=(type,data)=>{seen.push({type,...data});return emit(type,data);};Object.assign(g.player,{x:rope.x+50,y:rope.y-48,grounded:true,supportId:rope.id,inv:0});g.updateCamera();
  at(g,.2);tick(g,1);assert.ok(seen.some(e=>e.type==='sensationWarning'));assert.ok(seen.some(e=>e.type==='enemyIntroduction'&&e.enemyType==='sensation'));
  const health=g.health;for(let i=0;i<120;i++){if(pose==='dash')g.player.dash=.2;tick(g,1,pose==='crouch'?{down:true}:{});}
  if(pose==='stand'){assert.equal(g.health,health-1);assert.ok(seen.some(e=>e.type==='sensationHit'));assert.ok(seen.some(e=>e.type==='pushed'));}
  else{assert.equal(g.health,health,pose);assert.ok(!seen.some(e=>e.type==='sensationHit'),pose);}
 }
 const g=ready(true),rope=g.platforms.find(s=>s.id==='3:2');Object.assign(g.player,{x:rope.x+50,y:rope.y-48,grounded:true,supportId:rope.id,dir:1});at(g,BIRD.warn+.05);tick(g,1);
 const bird=flockState(lane,g.time).birds[0];g.player.x=bird.x+rooms[3].x-58;g.player.cooldown=0;tick(g,1,{attack:true});
 assert.ok(g.roofs.flocks[0].birds.some(b=>b.dead),'one bird popped');assert.ok(g.kills>0);
});
test('an echo field still transfers the protected cat but never consumes the last stock or reports a false lost life',()=>{const g=ready(true),e={kind:'echoOrb',type:'echo',id:'orb-test',room:3,w:40,h:38,ttl:99,state:'pulling',warpCooldown:0};g.lives=1;g.player.inv=0;g.echoImmunity=0;Object.assign(e,{x:g.player.x,y:g.player.y});handleFlyingContact(g,e);assert.equal(g.mode,'echoWarp');tick(g,50);assert.equal(g.lives,1);assert.equal(g.mode,'playing');assert.ok(g.events.some(e=>e.type==='testRescue'&&e.reason==='echo'));assert.ok(!g.events.some(e=>e.type==='lifeLost'||e.type==='lost'));});
