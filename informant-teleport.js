import {solidSurfaces} from './terrain.js?v=0.13.0';
import {platforms} from './level.js?v=0.13.0';
export const TELEPORT_PHASES={charge:.45,out:.24,blink:.1,in:.32};
export const TELEPORT_COOLDOWN=4.2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function teleportLandingClear(g,e,target){
 if(g.cuts?.some(c=>c.phase==='gap')&&!solidSurfaces(g).some(s=>s.room===e.room&&s.index===target.index&&target.x>=s.x&&target.x+e.w<=s.x+s.w&&Math.abs(target.y+e.h-s.y)<3))return false;
 const area={x:target.x-10,y:target.y-36,w:e.w+20,h:e.h+40};
 if(g.overlap(g.player,area))return false;
 return !g.enemies.some(other=>{
  if(other===e||!other.active||other.dead||other.room!==e.room)return false;
  const reserved=other.teleport&&!other.teleport.cancelled?other.teleport.target:null;
  return reserved&&g.overlap(area,{...reserved,w:other.w,h:other.h})||(!other.phased||other.teleport?.phase==='in')&&g.overlap(area,other);
 });
}
export function chooseInformantLanding(g,e){
 const p=g.player;if(!p.grounded||p.climbing)return null;
 const feet=p.y+p.h,center=p.x+p.w/2;
 const supports=solidSurfaces(g).filter(s=>s.room===e.room&&s.index!==e.platformIndex&&s.w>=150&&Math.abs(s.y-feet)<2&&p.x+p.w>s.x&&p.x<s.x+s.w);
 const options=[];
 for(const s of supports){
  const origin=s.x+8,end=s.x+s.w-e.w-8;
  for(const desired of [center-160-e.w/2,center+160-e.w/2,origin,end]){
   const x=clamp(desired,origin,end),distance=Math.abs(x+e.w/2-center),base=(g.platforms||platforms).find(base=>base.id===s.id)||s,target={x,y:s.y-e.h,index:s.index,localX:x-base.x,origin,end};
   if(distance<60||distance>320||!teleportLandingClear(g,e,target))continue;
   options.push({...target,score:Math.abs(distance-160)+Math.abs(x-e.x)*.03});
  }
 }
 return options.sort((a,b)=>a.score-b.score)[0]||null;
}
export function beginInformantTeleport(g,e){
 if(e.type!=='informant'||e.teleport||e.teleportCooldown>0||!e.noticed||e.noticeTime>0||e.hurtTime>0||!['patrol','recover'].includes(e.state))return false;
 const target=chooseInformantLanding(g,e);if(!target)return false;
 e.teleport={phase:'charge',elapsed:0,source:{x:e.x,y:e.y,index:e.platformIndex},target};e.state='teleportCharge';e.phased=false;e.aim=null;e.attackFlash=0;e.moving=false;
 g.emit('teleportStart',{x:e.x+24,y:e.y,targetX:target.x+24,targetY:target.y+e.h});return true;
}
export function cancelInformantTeleport(e){
 if(!e.teleport)return;e.teleport=null;e.phased=false;e.teleportCooldown=2;
}
export function stepInformantTeleport(g,e,dt){
 const t=e.teleport;if(!t)return false;
 t.elapsed+=dt;e.moving=false;
 if(t.elapsed>=TELEPORT_PHASES[t.phase]){
  t.elapsed=0;
  if(t.phase==='charge'){t.phase='out';e.state='teleportOut';g.emit('teleportOut',{x:e.x+24,y:e.y});}
  else if(t.phase==='out'){t.phase='blink';e.state='teleportBlink';}
  else if(t.phase==='blink'){
   if(teleportLandingClear(g,e,t.target)){
    const target=t.target;e.x=target.x;e.y=target.y;e.platformIndex=target.index;e.origin=target.origin;e.end=target.end;e.dir=g.player.x<e.x?-1:1;e.vy=0;t.arrived=true;
   }else{t.cancelled=true;g.emit('teleportAbort',{x:e.x+24,y:e.y});}
   t.phase='in';e.state='teleportIn';g.emit('teleportIn',{x:e.x+24,y:e.y});
  }else{
   e.teleport=null;e.phased=false;e.teleportCooldown=TELEPORT_COOLDOWN;e.state='recover';e.timer=.7;e.aim=null;return true;
  }
 }
 e.phased=t.phase==='blink'||t.phase==='in'||t.phase==='out'&&t.elapsed>=TELEPORT_PHASES.out/2;
 return true;
}
