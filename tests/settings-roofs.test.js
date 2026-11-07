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
test('the striped awning throws Uma up to the tall roof; holding ↓ lets her stand on it',()=>{
 const g=ready(true),awning=g.platforms.find(s=>s.roof?.type==='awning'),b1=g.platforms.find(s=>s.id==='3:4'),tall=g.platforms.find(s=>s.id==='3:5');assert.ok(tall.y<b1.y-115,'out of reach of an ordinary jump');
 Object.assign(g.player,{x:b1.x+b1.w-40,y:b1.y-48,grounded:true,supportId:b1.id});for(let i=0;i<200&&g.player.supportId!==tall.id;i++)tick(g,1,{right:true});assert.equal(g.player.supportId,tall.id);assert.ok(g.events.some(e=>e.type==='roofBounce'));
 Object.assign(g.player,{x:awning.x+8,y:awning.y-90,vy:0,grounded:false,supportId:null});tick(g,40,{down:true});assert.equal(g.player.supportId,awning.id);
});
test('a standing Uma cannot walk through a taller building; walls do not stop her on a ladder',()=>{
 const g=ready(true),a1=g.platforms.find(s=>s.id==='3:1'),a2=g.platforms.find(s=>s.id==='3:2');Object.assign(g.player,{x:a1.x+150,y:a1.y-48,grounded:true,supportId:a1.id});tick(g,90,{right:true});assert.ok(g.player.x+g.player.w<=rooms[3].x+562+1);assert.equal(g.player.supportId,a1.id);
 Object.assign(g.player,{x:rooms[3].x+524});tick(g,150,{up:true});assert.equal(g.player.supportId,a2.id);
});
test('wind gusts in the antenna forest move Uma only in the air',()=>{
 const g=ready(true),c0=g.platforms.find(s=>s.id==='3:6');Object.assign(g.player,{x:c0.x+90,y:c0.y-48,grounded:true,supportId:c0.id});
 for(let i=0;i<400&&!g.roofs.gust;i++)tick(g,1);assert.equal(g.roofs.gust,true);const x=g.player.x;tick(g,10);assert.equal(g.player.x,x,'standing still on a roof');
 tick(g,1,{jump:true});const air=g.player.x;tick(g,10);assert.ok(g.player.x<air-10,'blown left in the air');
});
test('all three roof transmitters are reached and broken with real jumps, ladders, the awning and timing',async()=>{
 const g=ready(),lib=await roofLib();assert.equal(climbRoofs(g,lib),true);assert.equal(g.relays.filter(d=>d.room===3&&d.hp>0).length,0);assert.equal(g.lives,3);
 for(let i=0;i<400&&g.mode==='playing';i++)tick(g,1,{right:true});assert.equal(g.mode,'loading');
});
test('a flock of Сенсации warns, knocks a standing Uma along its flight, misses a crouched one and pops to a paw',async()=>{
 const {flockState,BIRD,lanes}=await roofLib(),lane=lanes.SENSATION_LANES[0];
 const at=(g,k)=>{g.time=Math.ceil(g.time/lane.period+1)*lane.period-lane.phase+k;};
 for(const pose of ['stand','crouch','dash']){const g=ready(),rope=g.platforms.find(s=>s.roof?.type==='rope'),seen=[],emit=g.emit.bind(g);g.emit=(type,data)=>{seen.push({type,...data});return emit(type,data);};Object.assign(g.player,{x:rope.x+50,y:rope.y-48,grounded:true,supportId:rope.id,inv:0});g.updateCamera();
  at(g,.2);tick(g,1);assert.ok(seen.some(e=>e.type==='sensationWarning'));assert.ok(seen.some(e=>e.type==='enemyIntroduction'&&e.enemyType==='sensation'));
  const health=g.health;for(let i=0;i<120;i++){if(pose==='dash')g.player.dash=.2;tick(g,1,pose==='crouch'?{down:true}:{});}
  if(pose==='stand'){assert.equal(g.health,health-1);assert.ok(seen.some(e=>e.type==='sensationHit'));assert.ok(seen.some(e=>e.type==='pushed'));}
  else{assert.equal(g.health,health,pose);assert.ok(!seen.some(e=>e.type==='sensationHit'),pose);}
 }
 const g=ready(true),rope=g.platforms.find(s=>s.roof?.type==='rope');Object.assign(g.player,{x:rope.x+50,y:rope.y-48,grounded:true,supportId:rope.id,dir:1});at(g,BIRD.warn+.05);tick(g,1);
 const bird=flockState(lane,g.time).birds[0];g.player.x=bird.x+rooms[3].x-58;g.player.cooldown=0;tick(g,1,{attack:true});
 assert.ok(g.roofs.flocks[0].birds.some(b=>b.dead),'one bird popped');assert.ok(g.kills>0);
});
test('an echo field still transfers the protected cat but never consumes the last stock or reports a false lost life',()=>{const g=ready(true),e={kind:'echoOrb',type:'echo',id:'orb-test',room:3,w:40,h:38,ttl:99,state:'pulling',warpCooldown:0};g.lives=1;g.player.inv=0;g.echoImmunity=0;Object.assign(e,{x:g.player.x,y:g.player.y});handleFlyingContact(g,e);assert.equal(g.mode,'echoWarp');tick(g,50);assert.equal(g.lives,1);assert.equal(g.mode,'playing');assert.ok(g.events.some(e=>e.type==='testRescue'&&e.reason==='echo'));assert.ok(!g.events.some(e=>e.type==='lifeLost'||e.type==='lost'));});
