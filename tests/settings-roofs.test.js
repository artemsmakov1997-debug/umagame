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
test('a flock of Сенсации cries from the right, sweeps the whole map right to left at Uma\'s head height: it knocks a standing Uma, misses a crouched one and pops to a paw',async()=>{
 const {BIRD}=await roofLib();
 const arm=g=>{g.roofs.flock.timer=0;};
 for(const pose of ['stand','crouch','dash']){const g=ready(),roof=g.platforms.find(s=>s.id==='3:2'),seen=[],emit=g.emit.bind(g);g.emit=(type,data)=>{seen.push({type,...data});return emit(type,data);};Object.assign(g.player,{x:roof.x+90,y:roof.y-48,grounded:true,supportId:roof.id,inv:0});g.updateCamera();
  tick(g,1);arm(g);tick(g,1);assert.equal(g.roofs.flock.phase,'warn');assert.ok(seen.some(e=>e.type==='sensationWarning'&&e.x>g.player.x));assert.ok(seen.some(e=>e.type==='enemyIntroduction'&&e.enemyType==='sensation'));
  const health=g.health;for(let i=0;i<200;i++){if(pose==='dash'){g.player.dash=.2;Object.assign(g.player,{x:roof.x+90,y:roof.y-48,vy:0,grounded:true,supportId:roof.id});}tick(g,1,pose==='crouch'?{down:true}:{});}
  if(pose==='stand'){assert.equal(g.health,health-1);assert.ok(seen.some(e=>e.type==='sensationHit'));assert.ok(seen.some(e=>e.type==='pushed'));}
  else{assert.equal(g.health,health,pose);assert.ok(!seen.some(e=>e.type==='sensationHit'),pose);}
 }
 // They fly on to the right edge of the map, then the next flock comes after a pause.
 const f=ready(true),r=rooms[3];Object.assign(f.player,{x:r.end-100});f.updateCamera();tick(f,1);arm(f);let minX=Infinity;for(let i=0;i<60*14&&f.roofs.flock.phase!=='wait'||i<5;i++){tick(f,1);for(const b of f.roofs.flock.birds)minX=Math.min(minX,b.x);}
 assert.ok(minX<r.x,'the flock crosses the whole map');assert.equal(f.roofs.flock.phase,'wait');
 // A paw pops a bird.
 const g=ready(true),roof=g.platforms.find(s=>s.id==='3:2');Object.assign(g.player,{x:roof.x+90,y:roof.y-48,grounded:true,supportId:roof.id,dir:1});g.updateCamera();tick(g,1);arm(g);
 for(let i=0;i<200&&!g.roofs.flock.birds.some(b=>b.x<g.player.x+g.player.w+70);i++)tick(g,1);g.player.cooldown=0;tick(g,1,{attack:true});tick(g,10);
 assert.ok(g.roofs.flock.birds.some(b=>b.dead),'one bird popped');assert.ok(g.kills>0);
});
test('an echo field still transfers the protected cat but never consumes the last stock or reports a false lost life',()=>{const g=ready(true),e={kind:'echoOrb',type:'echo',id:'orb-test',room:3,w:40,h:38,ttl:99,state:'pulling',warpCooldown:0};g.lives=1;g.player.inv=0;g.echoImmunity=0;Object.assign(e,{x:g.player.x,y:g.player.y});handleFlyingContact(g,e);assert.equal(g.mode,'echoWarp');tick(g,50);assert.equal(g.lives,1);assert.equal(g.mode,'playing');assert.ok(g.events.some(e=>e.type==='testRescue'&&e.reason==='echo'));assert.ok(!g.events.some(e=>e.type==='lifeLost'||e.type==='lost'));});
test('a Папарацци aims, charges and flashes: the flash always blinds Uma within reach; two hits break it',()=>{
 const setup=(face,{roof='3:2',ex=830,ux=720}={})=>{const g=ready(),s=g.platforms.find(p=>p.id===roof),e=enemy('paparazzi',3,ex,+roof.slice(2),{active:true,noticed:true,timer:0});g.enemies=[e];Object.assign(g.player,{x:rooms[3].x+ux,y:s.y-48,grounded:true,supportId:s.id,dir:face,inv:0});g.updateCamera();return {g,e};};
 const flash=(g,e,input={})=>{for(let i=0;i<120&&e.state!=='flash';i++)g.step(1/60,input);return g.events.find(v=>v.type==='cameraFlash');};
 let {g,e}=setup(1);const shot=flash(g,e);assert.ok(g.events.some(v=>v.type==='flashWarning'),'the lamp warns first');assert.equal(shot.seen,true);assert.ok(g.player.blindTime>0);
 const x=g.player.x;for(let i=0;i<20;i++)g.step(1/60,{right:true,jump:true});assert.equal(g.player.x,x,'blinded Uma freezes');assert.equal(g.player.grounded,true);
 ({g,e}=setup(-1));assert.equal(flash(g,e).seen,true,'turning away no longer helps');assert.ok(g.player.blindTime>0);
 ({g,e}=setup(-1,{roof:'3:1',ex:430,ux:540}));assert.equal(flash(g,e,{down:true}).seen,true,'nor does a chimney');
 ({g,e}=setup(1,{ex:760,ux:715}));for(let k=0;k<2;k++){e.inv=0;g.hitEnemy(e);}assert.equal(e.dead,true);
});
test('every Нагнетатель on the roofs faces Uma (right to left) and its gust pushes her to the left',()=>{
 const g=new Game({story:false});g.start();activateRoom(g,3);const machines=g.enemies.filter(e=>e.room===3&&e.type==='inflator');assert.equal(machines.length,3);
 for(const e of machines)assert.equal(e.dir,-1);
 g.mode='playing';g.notebooks=[];g.enemies=machines;const s=g.platforms.find(s=>s.room===3&&s.index===1);Object.assign(g.player,{x:s.x+s.w/2,y:s.y-48,grounded:true,supportId:s.id,vx:0,vy:0});
 g.roofs.wind={phase:'gust',timer:1,source:machines[0].id,dir:machines[0].dir};g.roofs.gust=true;const x=g.player.x;for(let i=0;i<20;i++)g.step(1/60,{});assert.ok(g.player.x<x-4,'blown left');
});
