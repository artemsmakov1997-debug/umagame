import {actorById} from './boss-actors.js?v=0.21.5';
import {rooms,spawns} from './level.js?v=0.21.5';
import {solidSurfaces} from './terrain.js?v=0.21.5';
import {releaseEchoPull} from './echo-pull.js?v=0.21.5';
import {stepEchoDouble,echoDoubleContact} from './echo-double.js?v=0.21.5';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stepAirEnemy(g,e,dt){
 const p=g.player,r=rooms[e.room],dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+p.h/2-e.y-e.h/2,distance=Math.hypot(dx,dy)||1;
 if(e.type==='echo'){stepEchoDouble(g,e,dt);return;}
 e.timer-=dt;
 if(e.type==='static'){stepJelly(g,e,dt);e.x=clamp(e.x,r.x+8,r.end-e.w-8);e.y=clamp(e.y,48,480-e.h-12);return;}
 {
  if(e.state==='patrol'){
   if(e.noticed){e.x+=dx/distance*e.speed*dt;e.y+=dy/distance*e.speed*.7*dt;}
   if(distance<160&&e.timer<=0){e.state='windup';e.timer=.55;e.charge={vx:dx/distance*270,vy:dy/distance*230};g.emit('staticWarning',{x:e.x,y:e.y,enemyType:e.type});}
  }else if(e.state==='windup'&&e.timer<=0){e.state='lunge';e.timer=.35;e.strikeHit=false;g.emit('staticStrike',{x:e.x,y:e.y,enemyType:e.type});}
  else if(e.state==='lunge'){e.x+=e.charge.vx*dt;e.y+=e.charge.vy*dt;if(e.timer<=0){e.state='recover';e.timer=1.1;}}
  else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.5;}
 }
 e.x=clamp(e.x,r.x+8,r.end-e.w-8);e.y=clamp(e.y,48,480-e.h-12);if(Math.abs(dx)>5)e.dir=dx<0?-1:1;
}
// Помеха: a jellyfish of static hovering above Uma's head. It catches the signal, charges, and fires a column of
// static straight down: the column hurts and knocks Uma aside, and leaves a slippery glitch stripe on the floor.
// Then it overheats and sinks lower — the moment to jump and swat it.
export const JELLY_AI={hover:96,low:46,signal:.45,charge:.55,fire:.45,overheat:1.4,rest:.7,align:30,half:16,patch:84,patchTime:2.6};
export function jellyBeamFloor(g,e){const x=e.x+e.w/2,top=e.y+e.h,s=solidSurfaces(g).filter(s=>s.room===e.room&&x>=s.x&&x<=s.x+s.w&&s.y>=top).sort((a,b)=>a.y-b.y)[0];return {y:s?s.y:480,surface:s};}
function stepJelly(g,e,dt){
 const p=g.player,tx=p.x+p.w/2-e.w/2,low=e.state==='overheat',ty=p.y-(low?JELLY_AI.low:JELLY_AI.hover)-e.h/2;e.beamFloor=undefined;
 // While catching the signal it still drifts over her; once charged it is locked in place.
 if(e.state==='signal')e.x+=clamp(tx-e.x,-e.speed*.8*dt,e.speed*.8*dt);
 if(e.state==='patrol'||e.state==='overheat'){if(e.noticed||low){const s=e.speed*(low?.35:1);e.x+=clamp(tx-e.x,-s*dt,s*dt);e.y+=clamp(ty-e.y,-s*.8*dt,s*.8*dt);}}
 if(Math.abs(tx-e.x)>5)e.dir=tx<e.x?-1:1;
 if(e.state==='patrol'){if(e.noticed&&e.timer<=0&&Math.abs(tx-e.x)<JELLY_AI.align&&Math.abs(ty-e.y)<60){e.state='signal';e.timer=JELLY_AI.signal;g.emit('staticWarning',{x:e.x,y:e.y,enemyType:e.type});}}
 else if(e.state==='signal'&&e.timer<=0){e.state='charge';e.timer=JELLY_AI.charge;}
 else if(e.state==='charge'&&e.timer<=0){
  e.state='fire';e.timer=JELLY_AI.fire;e.strikeHit=false;const floor=jellyBeamFloor(g,e);g.emit('staticStrike',{x:e.x,y:e.y,enemyType:e.type});
  if(floor.surface){const s=floor.surface,w=Math.min(JELLY_AI.patch,s.w),localX=clamp(e.x+e.w/2-s.x-w/2,0,s.w-w);g.inks=g.inks.filter(i=>!(i.glitch&&i.platformId===s.id&&Math.abs(i.localX-localX)<40));g.inks.push({room:e.room,platformId:s.id,localX,w,time:JELLY_AI.patchTime,glitch:true,drift:0});}
 }
 else if(e.state==='fire'){
  const floor=jellyBeamFloor(g,e);e.beamFloor=floor.y;const cx=e.x+e.w/2,column={x:cx-JELLY_AI.half,y:e.y+e.h,w:JELLY_AI.half*2,h:Math.max(0,floor.y-e.y-e.h)};
  if(!e.strikeHit&&p.dash===0&&p.inv===0&&g.overlap(p,column)){e.strikeHit=true;const before=g.health;g.hurt(false,cx);if(g.mode==='playing'&&g.health<before){p.vx=(p.x+p.w/2>cx?1:-1)*240;p.vy=-160;p.knock=.22;p.grounded=false;g.emit('staticPush',{x:cx,y:p.y});}}
  if(e.timer<=0){e.state='overheat';e.timer=JELLY_AI.overheat;}
 }
 else if(e.state==='overheat'&&e.timer<=0){e.state='patrol';e.timer=JELLY_AI.rest;}
}
function warpLanding(g){
 const p=g.player,r=rooms[g.room],surfaces=solidSurfaces(g).filter(s=>s.room===g.room&&s.w>=88);
 const clear=(s,x)=>!g.enemies.some(e=>e.active&&!e.dead&&!e.phased&&e.room===g.room&&Math.abs(e.x+e.w/2-x-p.w/2)<88&&Math.abs(e.y+e.h-(s.y-12))<100);
 const marks=[...g.safeTrail].reverse().filter(m=>m.x<p.x-220).sort((a,b)=>Math.abs(p.x-a.x-480)-Math.abs(p.x-b.x-480));
 for(const mark of marks){const s=surfaces.find(s=>s.id===mark.platformId&&mark.x>=s.x&&mark.x+p.w<=s.x+s.w);if(s){const x=clamp(mark.x,s.x+6,s.x+s.w-p.w-6);if(clear(s,x))return{x,y:s.y-48,supportId:s.id};}}
 for(const s of surfaces.filter(s=>s.x<p.x-180&&g.visitedPlatforms.has(s.id)).sort((a,b)=>b.x-a.x)){
  for(const x of [s.x+8,s.x+s.w-p.w-8])if(clear(s,x))return{x,y:s.y-48,supportId:s.id};
 }
 const s=surfaces.find(s=>s.index===0);if(s)return{x:s.x+12,y:s.y-48,supportId:s.id};
 return{...spawns[g.room],supportId:g.room+':0'};
}
export function handleFlyingContact(g,e){
 const p=g.player;if(!g.overlap(p,e))return;
 if(e.kind==='echoOrb'){
  // Infoshum's echo fields keep the old suction-and-transfer trap.
  if(e.warpCooldown>0||g.echoImmunity>0||p.dash>0||p.inv>0||g.echoWarp)return;
  releaseEchoPull(g);g.echoWarp={from:{x:p.x,y:p.y},to:warpLanding(g),time:0,duration:.5,transferred:false,ownerId:e.id};g.mode='echoWarp';e.warpCooldown=7.5;e.attackFlash=.5;e.state='recover';e.timer=1.6;p.vx=0;p.vy=0;p.attack=0;p.sleeping=false;g.emit('echoTeleport',{x:e.x,y:e.y});
 }else if(e.type==='echo'){echoDoubleContact(g,e);
 }else if(e.state==='lunge'&&!e.strikeHit&&p.dash===0&&p.inv===0){
  e.strikeHit=true;const before=g.health;g.hurt(false,e.x);if(g.mode==='playing'&&g.health<before){p.vx=(p.x>e.x?1:-1)*280;p.vy=150;p.knock=.24;p.grounded=false;p.climbing=false;g.emit('staticPush',{x:e.x,y:e.y});}
 }
}
export function stepEchoWarp(g,dt){
 const warp=g.echoWarp;if(!warp)return;warp.time=Math.min(warp.duration,warp.time+Math.min(dt,1/30));
 if(warp.time>=.24&&!warp.transferred){
  warp.transferred=true;if(!g.testingInvulnerable)g.lives=Math.max(0,g.lives-1);Object.assign(g.player,warp.to,{h:48,vx:0,vy:0,grounded:true,climbing:false,sneaking:false,knock:0,dash:0,inv:1.2,hurtTime:.5,slipping:false,inkTime:0});g.echoImmunity=2.2;g.updateCamera();g.emit('echoArrive',{x:g.player.x,y:g.player.y});
  if(g.lives===0){g.health=0;g.echoWarp=null;g.mode='lost';g.emit('lost',{reason:'echo'});return;}
  if(g.testingInvulnerable)g.emit('testRescue',{reason:'echo'});else g.emit('lifeLost',{lives:g.lives,reason:'echo'});
 }
 if(warp.time>=warp.duration){g.echoWarp=null;g.mode='playing';g.emit('echoReady');}
}
export function stepSplicer(g,e,dt,dx,dy){
 if(e.state==='patrol'){
  e.x+=e.dir*e.speed*dt;
  if(Math.abs(dx)<285&&Math.abs(dy)<(e.container?210:120)&&e.timer<=0&&!g.tether&&!(g.player.glueGrace>0)){e.state='windup';e.timer=.7;g.emit('glueWarning',{x:e.x,y:e.y,enemyType:e.type});}
 }else if(e.state==='windup'&&e.timer<=0){e.state='pulling';e.timer=5;g.tether={ownerId:e.id,remaining:5,total:5};g.emit('gluePull',{x:e.x,y:e.y,enemyType:e.type});}
 else if(e.state==='pulling'&&e.timer<=0){releaseTether(g,e.id);e.state='recover';e.timer=2;}
 else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=2.3;}
}
export function releaseTether(g,ownerId=null){
 if(!g.tether||ownerId&&g.tether.ownerId!==ownerId)return;
 const e=actorById(g,g.tether.ownerId);if(e&&!e.dead){e.state='recover';e.timer=Math.max(1.6,e.timer>5?0:1.6);}
 g.tether=null;g.player.pulled=false;g.emit('glueRelease');
}
export function stepTether(g,dt){
 const p=g.player;p.pulled=false;if(!g.tether)return;
 const e=actorById(g,g.tether.ownerId),t=g.tether;
 if(!e||e.dead||e.room!==g.room||!(e.state==='pulling'||e===g.boss&&e.state==='casting'&&e.ability==='splice')||p.dash>0||Math.abs(e.x-p.x)>380||Math.abs(e.y+e.h-p.y-p.h)>(e.container?230:145)){if(p.dash>0)p.glueGrace=1.8;releaseTether(g);return;}
 t.remaining-=dt;if(t.remaining<=0){releaseTether(g);return;}
 p.pulled=true;p.sleeping=false;p.idleTime=0;p.slideTime=(p.slideTime||0)+dt;
 if(!p.knock)p.vx=clamp(p.vx+Math.sign(e.x+e.w/2-p.x-p.w/2)*175,-260,260);
}
