import {enemy,WIDTH} from './level.js?v=0.10.1';
import {beginFakeJump,stepFakeJump} from './enemy-traversal.js?v=0.10.1';
export function alertNearby(g,caller){
 const targets=g.enemies.filter(e=>e.active&&!e.dead&&e.room===caller.room&&e!==caller&&e.type!=='clickbait'&&e.type!=='panicker'&&Math.abs(e.x-caller.x)<420).sort((a,b)=>Math.abs(a.x-caller.x)-Math.abs(b.x-caller.x)).slice(0,4);
 for(const e of targets){e.alert=6;if(e.state==='patrol'||e.state==='recover')e.dir=g.player.x<e.x?-1:1;if(e.state==='patrol')e.timer=Math.min(e.timer,.3);}
 g.emit('alarm',{x:caller.x+24,y:caller.y,attracted:targets.length});
 if(!g.portals.some(p=>p.ownerId===caller.id&&!p.cancelled)&&g.enemies.filter(e=>e.portalMinion&&!e.dead&&e.room===caller.room).length<3){
  const preferred=caller.x+caller.dir*75,x=Math.max(caller.origin,Math.min(caller.end,preferred));
  g.portals.push({id:++g.portalSerial,ownerId:caller.id,room:caller.room,platformIndex:caller.platformIndex,x,y:caller.y+29,time:0,spawned:0,cancelled:false});g.emit('portal',{x,y:caller.y});
 }
}
export function stepPortals(g,dt){
 for(const portal of g.portals){
  if(portal.room!==g.room)continue;const owner=g.enemies.find(e=>e.id===portal.ownerId);
  if(!owner||owner.dead)portal.cancelled=true;
  if(portal.cancelled){portal.closeTime=(portal.closeTime||0)+dt;continue;}portal.time+=dt;
  if(portal.spawned<2&&portal.time>=.9+portal.spawned*.95){
   portal.spawned++;const count=g.enemies.filter(e=>e.portalMinion&&!e.dead&&e.room===portal.room).length;if(count>=3)continue;
   let x=portal.x;const p=g.player;if(Math.abs(x-p.x)<60)x=p.x<=(owner.origin+owner.end)/2?owner.end:owner.origin;
   const e=enemy('fakenews',portal.room,x-portal.room*WIDTH,portal.platformIndex,{id:`portal-${portal.id}-${portal.spawned}`,active:true,spawnTime:.45,portalMinion:true,hp:1,maxHp:1,dir:p.x<x?-1:1,noticed:true});g.enemies.push(e);g.emit('portalSpawn',{x:e.x,y:e.y});
  }
 }
 g.portals=g.portals.filter(p=>p.cancelled?(p.closeTime||0)<.3:p.time<2.8);
}
export function touchesBait(p,e){return Math.abs(p.x+p.w/2-(e.x+24))<26&&Math.abs(p.y+p.h/2-(e.y+8))<32;}
function reveal(g,e,dx){e.revealed=true;e.dir=dx<0?-1:1;e.state='emerge';e.timer=.16;e.revealTime=0;e.noticed=true;e.noticeTime=0;g.emit('baitReveal',{x:e.x,y:e.y});}
export function stepEnemies(g,dt,paw,prevBottom){
 const p=g.player;
 for(const e of g.enemies){
  if(e.dead){e.deathTime=Math.max(0,e.deathTime-dt);continue;}if(e.room!==g.room)continue;
  if(!e.active){if(p.x-e.room*WIDTH<e.trigger)continue;e.active=true;e.spawnTime=.55;g.emit('enemySpawn',{x:e.x,y:e.y});}
  if(e.spawnTime>0){e.spawnTime=Math.max(0,e.spawnTime-dt);e.moving=false;continue;}
  for(const key of ['inv','alert','attackFlash','hurtTime','noticeTime','pressureTime','shieldBroken','jumpCooldown'])e[key]=Math.max(0,(e[key]||0)-dt);e.moving=false;
  const previousX=e.x,dx=p.x-e.x,dy=p.y+p.h-(e.y+e.h),near=Math.abs(dx)<460&&Math.abs(dy)<190,silent=e.type==='panicker'&&p.sneaking;
  if(!e.noticed&&near&&!silent&&(e.type!=='clickbait'||e.revealed)){e.noticed=true;e.noticeTime=.32;g.emit('enemyNoticed',{x:e.x,y:e.y});}
  const traversing=e.type==='fakenews'&&(stepFakeJump(g,e,dt)||e.noticeTime===0&&beginFakeJump(g,e));
  if(!traversing&&e.noticeTime===0&&e.hurtTime===0){
   e.timer-=dt;if(e.type==='clickbait'&&e.state==='emerge')e.revealTime+=dt;
   if(e.type==='fakenews'){
    if(e.state==='patrol'){if(e.alert>0)e.dir=dx<0?-1:1;e.x+=e.dir*e.speed*(e.pressureTime>0?1.5:1)*dt;if(Math.abs(dx)<118&&Math.abs(dy)<65&&e.timer<=0){e.dir=dx<0?-1:1;e.state='windup';e.timer=.5;}}
    else if(e.state==='windup'&&e.timer<=0){e.state='lunge';e.timer=.32;g.emit('fakeLunge',{x:e.x,y:e.y});}
    else if(e.state==='lunge'){e.x+=e.dir*(e.pressureTime>0?270:210)*dt;if(e.timer<=0){e.state='recover';e.timer=.85;}}
    else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.65;}
   }else if(e.type==='informant'){
    if(e.state==='patrol'){
     if(Math.abs(dx)<135)e.x+=(dx<0?1:-1)*e.speed*dt;
     if(near&&e.timer<=0){e.dir=dx<0?-1:1;e.aim={x:p.x+p.w/2,y:p.y+(p.sneaking?p.h/2:8)};e.state='windup';e.timer=.9;}
    }else if(e.state==='windup'&&e.timer<=0){e.state='casting';e.shots=0;e.timer=0;}
    if(e.state==='casting'&&e.timer<=0){
     const tx=e.aim.x-(e.x+24),ty=e.aim.y-(e.y-6),len=Math.hypot(tx,ty)||1;
     g.bolts.push({kind:'packet',x:e.x+24,y:e.y-6,w:16,h:12,vx:tx/len*205,vy:ty/len*205,ttl:4,sourceId:e.id});e.shots++;e.attackFlash=.2;e.timer=.22;g.emit('enemyShot',{x:e.x,y:e.y});if(e.shots>=2){e.state='recover';e.timer=1.35;}
    }else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.8;}
   }else if(e.type==='inflator'){
    if(e.state==='patrol'&&Math.abs(dx)<330&&Math.abs(dy)<85){e.dir=dx<0?-1:1;e.state='windup';e.timer=.8;e.blastHit=false;}
    else if(e.state==='windup'&&e.timer<=0){e.state='blast';e.timer=.35;g.emit('blast',{x:e.x,y:e.y});for(const other of g.enemies)if(other.active&&!other.dead&&other.type==='fakenews'&&other.room===e.room&&Math.abs(other.x-e.x)<360){other.pressureTime=4;g.emit('inflate',{x:other.x,y:other.y});}}
    else if(e.state==='blast'&&e.timer<=0){e.state='recover';e.timer=2;}
    else if(e.state==='recover'&&e.timer<=0)e.state='patrol';
    if(e.state==='blast'&&!e.blastHit){const beam={x:e.dir>0?e.x+40:e.x-300,y:e.y-6,w:300,h:42};if(g.overlap(p,beam)){e.blastHit=true;if(p.dash===0)g.push(e.dir,e.x);}}
   }else if(e.type==='panicker'){
    if(e.state==='patrol'&&!silent&&Math.abs(dx)<215&&Math.abs(dy)<110){e.state='windup';e.timer=.6;}
    else if(e.state==='windup'&&silent){e.state='patrol';e.timer=.6;e.noticed=false;}
    else if(e.state==='windup'&&e.timer<=0){e.state='alarm';e.timer=1.25;alertNearby(g,e);}
    else if(e.state==='alarm'&&e.timer<=0){e.state='recover';e.timer=3.5;}
    else if(e.state==='recover'&&e.timer<=0)e.state='patrol';
   }else if(e.type==='clickbait'){
    if(e.state==='lure'&&touchesBait(p,e))reveal(g,e,dx);
    else if(e.state==='emerge'&&e.timer<=0){e.state='snap';e.timer=.24;e.attackFlash=.24;}
    else if(e.state==='patrol'&&Math.abs(dx)<100&&Math.abs(dy)<75&&e.timer<=0){e.dir=dx<0?-1:1;e.state='windup';e.timer=.65;}
    else if(e.state==='windup'&&e.timer<=0){e.state='snap';e.timer=.45;e.attackFlash=.45;}
    else if(e.state==='snap'&&e.timer<=0){e.state='recover';e.timer=1.4;}
    else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.5;}
    if(e.revealed&&e.state==='patrol')e.x+=e.dir*e.speed*dt;
   }
   if((e.type==='inflator'||e.type==='panicker')&&e.state==='patrol')e.x+=e.dir*e.speed*dt;
  }
  if(!e.jumpPhase&&(e.x<e.origin||e.x>e.end)){e.dir*=-1;e.x=Math.max(e.origin,Math.min(e.end,e.x));}
  e.moving=Math.abs(e.x-previousX)>.01;e.walkTime+=Math.abs(e.x-previousX)/24;
  if(p.attack>0&&e.lastSwing!==p.swing&&g.overlap(paw,e)){e.lastSwing=p.swing;if(e.type==='clickbait'&&!e.revealed)reveal(g,e,dx);g.hitEnemy(e);}
  if(e.dead)continue;
  if(e.type==='clickbait'){
   const mouth={x:e.dir>0?e.x+2:e.x-40,y:e.y-30,w:88,h:72};
   if(e.state==='snap'&&g.overlap(p,mouth)&&p.dash>0){e.state='recover';e.timer=1.4;}
   else if(e.state==='snap'&&p.inv===0&&g.overlap(p,mouth)){g.swallow={enemyId:e.id,x:p.x,y:p.y,targetX:e.x+12,targetY:e.y-14,timer:.48,total:.48};p.attack=0;p.vx=0;p.vy=0;e.state='recover';e.timer=2;e.attackFlash=.48;e.captureTime=0;g.emit('swallow',{x:e.x,y:e.y});return;}
  }else if(g.overlap(p,e)&&!(e.type==='panicker'&&p.sneaking&&e.state!=='alarm')&&!(e.type==='fakenews'&&e.state==='recover')){
   if(p.vy>0&&prevBottom<e.y+12){g.hitEnemy(e,true);p.vy=-330;}else g.hurt(false,e.x);
  }
 }
}
