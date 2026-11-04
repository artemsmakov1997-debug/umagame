import {collisionWalls} from './world-geometry.js?v=0.22.0';
import {solidSurfaces} from './terrain.js?v=0.22.0';
import {platforms} from './level.js?v=0.22.0';
export const TELEPORT_PHASES={charge:.45,out:.24,blink:.1,in:.32};
export const TELEPORT_COOLDOWN=4.2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function teleportLandingClear(g,e,target){
 if(g.cuts?.some(c=>c.phase==='gap')&&!solidSurfaces(g).some(s=>s.room===e.room&&s.index===target.index&&target.x>=s.x&&target.x+e.w<=s.x+s.w&&Math.abs(target.y+e.h-s.y)<3))return false;
 const area={x:target.x-10,y:target.y-36,w:e.w+20,h:e.h+40};
 if(g.overlap(g.player,area)||collisionWalls(g,e).some(w=>g.overlap(area,w)))return false;
 return !g.enemies.some(other=>{
  if(other===e||!other.active||other.dead||other.room!==e.room)return false;
  const reserved=other.teleport&&!other.teleport.cancelled?other.teleport.target:null;
  return reserved&&g.overlap(area,{...reserved,w:other.w,h:other.h})||(!other.phased||other.teleport?.phase==='in')&&g.overlap(area,other);
 });
}
export function chooseInformantLanding(g,e){
 const p=g.player;if(!p.grounded||p.climbing)return null;
 const current=(g.platforms||platforms).find(s=>s.room===e.room&&s.index===e.platformIndex);if(current&&Math.abs(p.y+p.h-current.y)<2&&p.x+p.w>current.x&&p.x<current.x+current.w)return null;
 const feet=p.y+p.h,center=p.x+p.w/2,preferred=Math.max(72,Math.min(160,(g.viewWidth||768)*.36));
 const supports=solidSurfaces(g).filter(s=>s.room===e.room&&s.index!==e.platformIndex&&s.w>=110&&Math.abs(s.y-feet)<135&&Math.abs(s.x+s.w/2-center)<450);
 const options=[];
 for(const s of supports){
  const origin=s.x+8,end=s.x+s.w-e.w-8;
  for(const desired of [center-preferred-e.w/2,center+preferred-e.w/2,origin,end]){
   const narrow=(g.viewWidth||768)<350,visibleStart=narrow?Math.max(origin,g.camera+6):origin,visibleEnd=narrow?Math.min(end,g.camera+g.viewWidth-e.w-6):end;if(visibleStart>visibleEnd)continue;
   const x=clamp(desired,visibleStart,visibleEnd),distance=Math.abs(x+e.w/2-center),base=(g.platforms||platforms).find(base=>base.id===s.id)||s,target={x,y:s.y-e.h,index:s.index,localX:x-base.x,origin,end};
   if((g.viewWidth||768)<350&&(x<g.camera+6||x+e.w>g.camera+g.viewWidth-6))continue;
   if(distance<60||distance>320||!teleportLandingClear(g,e,target))continue;
   options.push({...target,score:Math.abs(distance-preferred)+Math.abs(s.y-feet)*1.4+Math.abs(x-e.x)*.03});
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

export function redirectInformant(g,e){const t=e.teleport;if(!t||!['charge','out'].includes(t.phase))return false;const options=solidSurfaces(g).filter(s=>s.room===e.room&&s.w>110&&Math.abs(s.y-t.target.y-e.h)<360).map(s=>{const x=s.x+(s.w-e.w)/2;return{x,y:s.y-e.h,index:s.index,localX:(s.w-e.w)/2,origin:s.x+8,end:s.x+s.w-e.w-8};}).filter(p=>Math.abs(p.x-t.target.x)>90&&Math.hypot(p.x-g.player.x,p.y-g.player.y)>140&&teleportLandingClear(g,e,p)).sort((a,b)=>Math.hypot(a.x-t.target.x,a.y-t.target.y)-Math.hypot(b.x-t.target.x,b.y-t.target.y));if(!options.length)return false;t.target=options[0];t.redirected=true;t.phase='charge';t.elapsed=0;e.state='teleportCharge';g.emit('signalRedirected',{x:t.target.x,y:t.target.y});return true;}
export function redirectMarkedSignal(g,paw){if(g.player.attack<=0)return;for(const e of g.enemies){const t=e.teleport;if(e.room!==g.room||!t||t.redirectSwing===g.player.swing)continue;const mark={x:t.target.x-12,y:t.target.y-22,w:e.w+24,h:e.h+35};if(g.overlap(paw,mark)){t.redirectSwing=g.player.swing;redirectInformant(g,e);}}}
