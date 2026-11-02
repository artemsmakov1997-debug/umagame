import {platforms,WIDTH,rooms} from './level.js?v=0.12.0';
const GRAVITY=900,IMPULSE=460;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Pick a reachable landing spot that brings the creature closer to Uma's level.
export function chooseFakeLanding(g,e){
 const p=g.player,feet=e.y+e.h,targetFeet=p.y+p.h,currentScore=Math.abs(e.x-p.x)+Math.abs(feet-targetFeet)*1.8;
 const candidates=(g.platforms||platforms).filter(s=>s.room===e.room&&s.index!==e.platformIndex&&s.w>=90);
 return candidates.map(s=>{
  const dy=s.y-feet,disc=IMPULSE*IMPULSE+2*GRAVITY*dy;
  if(dy < -110||dy>145||disc<=0)return null;
  const flight=(IMPULSE+Math.sqrt(disc))/GRAVITY,left=Math.max(s.x+12,e.x-250*flight),right=Math.min(s.x+s.w-60,e.x+250*flight);
  if(left>right)return null;const x=clamp(p.x,left,right),vx=(x-e.x)/flight;
  const score=Math.abs(x-p.x)+Math.abs(s.y-targetFeet)*1.8;
  if(Math.abs(x-e.x)>280||Math.abs(vx)>250||score>currentScore-48)return null;
  return {platform:s,x,vx,score};
 }).filter(Boolean).sort((a,b)=>a.score-b.score)[0]||null;
}
export function beginFakeJump(g,e){
 if(e.type!=='fakenews'||e.state!=='patrol'||e.jumpPhase||e.jumpCooldown>0||e.hurtTime>0)return false;
 const target=chooseFakeLanding(g,e);if(!target)return false;
 e.jumpTarget={index:target.platform.index,x:target.x,y:target.platform.y};e.jumpVx=target.vx;e.dir=target.vx<0?-1:1;e.jumpPhase='prepare';e.state='jumpWindup';e.timer=.16;e.vy=0;
 g.emit('fakeJumpReady',{x:e.x,y:e.y});return true;
}
function land(e,s){
 e.y=s.y-e.h;e.vy=0;e.platformIndex=s.index;e.origin=s.x+12;e.end=s.x+s.w-60;e.x=clamp(e.x,e.origin,e.end);
 e.jumpPhase='land';e.state='land';e.timer=.18;e.jumpCooldown=1.35;
}
// Air physics continues through a hit reaction. Pause freezes it with the rest of the model.
export function stepFakeJump(g,e,dt){
 if(!e.jumpPhase)return false;
 if(e.jumpPhase==='prepare'){
  if(e.hurtTime>0){e.jumpPhase=null;e.jumpTarget=null;e.jumpCooldown=1;return false;}
  e.timer-=dt;if(e.timer<=0){e.jumpPhase='air';e.state='jump';e.vy=-IMPULSE;g.emit('fakeJump',{x:e.x,y:e.y});}return true;
 }
 if(e.jumpPhase==='land'){
  e.timer-=dt;if(e.timer<=0){e.jumpPhase=null;e.jumpTarget=null;e.state='patrol';e.timer=.55;}return true;
 }
 const oldBottom=e.y+e.h;e.x+=e.jumpVx*dt;e.vy=Math.min(580,e.vy+GRAVITY*dt);e.y+=e.vy*dt;
 e.x=clamp(e.x,e.room*WIDTH+12,rooms[e.room].x+rooms[e.room].width-60);
 if(e.vy>=0){
  const surfaces=(g.platforms||platforms).filter(s=>s.room===e.room&&e.x+e.w>s.x+2&&e.x<s.x+s.w-2&&oldBottom<=(s.prevY??s.y)+1&&e.y+e.h>=s.y).sort((a,b)=>a.y-b.y);
  if(surfaces.length){land(e,surfaces[0]);g.emit('fakeLand',{x:e.x,y:e.y+e.h});}
 }
 return true;
}
