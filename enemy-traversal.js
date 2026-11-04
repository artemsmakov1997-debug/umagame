import {solidSurfaces} from './terrain.js?v=0.21.1';
import {rooms} from './level.js?v=0.21.1';
const GRAVITY=900,IMPULSE=460;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function flight(dy){const disc=IMPULSE*IMPULSE+2*GRAVITY*dy;return dy< -115||dy>170||disc<=0?0:(IMPULSE+Math.sqrt(disc))/GRAVITY;}
function reachable(a,b){
 const time=flight(b.y-a.y),gap=Math.max(0,b.x+8-(a.x+a.w-56),a.x+8-(b.x+b.w-56));
 if(b.y>a.y+15&&b.x+8>=a.x-52&&b.x+b.w-56<=a.x+a.w+4)return false;
 return time>0&&gap<=Math.min(280,250*time);
}
function future(g,s,seconds){
 if(!s.motion)return s;const t=(g.platformClocks[s.room]||0)+seconds,offset=Math.sin(t*Math.PI*2/s.motion.period)*s.motion.amplitude;
 return{...s,x:s.motion.axis==='x'?s.baseX+offset:s.x,y:s.motion.axis==='y'?s.baseY+offset:s.y};
}
export function chooseFakeLanding(g,e){
 const p=g.player,surfaces=solidSurfaces(g).filter(s=>s.room===e.room&&s.w>=78),source=surfaces.find(s=>s.index===e.platformIndex&&e.x+e.w>s.x&&e.x<s.x+s.w&&Math.abs(e.y+e.h-s.y)<4);
 if(!source)return null;
 const goal=surfaces.find(s=>s.id===p.supportId&&p.x+p.w>s.x&&p.x<s.x+s.w)||surfaces.slice().sort((a,b)=>Math.abs(a.x+a.w/2-p.x)+Math.abs(a.y-p.y-p.h)*2-Math.abs(b.x+b.w/2-p.x)-Math.abs(b.y-p.y-p.h)*2)[0];
 if(!goal||goal===source)return null;
 const queue=[source],previous=new Map([[source,null]]);let found=false;
 for(let head=0;head<queue.length;head++){
  const s=queue[head];if(s===goal){found=true;break;}
  for(const next of surfaces)if(!previous.has(next)&&reachable(s,next)){previous.set(next,s);queue.push(next);}
 }
 if(!found)return null;let next=goal;while(previous.get(next)&&previous.get(next)!==source)next=previous.get(next);
 let time=flight(next.y-source.y),destination=next;
 for(let i=0;i<3;i++){destination=future(g,next,time);time=flight(destination.y-source.y);if(!time)return null;}
 let left=destination.x+8,right=Math.max(left,destination.x+destination.w-e.w-8);const limit=Math.min(280,250*time),sourceLeft=Math.max(source.x+10,e.origin),sourceRight=Math.min(source.x+source.w-e.w-10,e.end);
 left=Math.max(left,sourceLeft-limit);right=Math.min(right,sourceRight+limit);
 // A lower overlapping platform requires leaving the current tabletop before descending.
 if(destination.y>source.y+15){
  const exits=[];if(right>=source.x+source.w+4)exits.push([Math.max(left,source.x+source.w+4),right]);
  if(left<=source.x-e.w-4)exits.push([left,Math.min(right,source.x-e.w-4)]);
  if(!exits.length)return null;exits.sort((a,b)=>Math.abs((a[0]+a[1])/2-p.x)-Math.abs((b[0]+b[1])/2-p.x));[left,right]=exits[0];
 }
 if(left>right)return null;const x=clamp(next===goal?p.x:destination.x+(destination.w-e.w)/2,left,right);
 const launchX=clamp(x>e.x?x-limit:x+limit,Math.max(source.x+10,e.origin),Math.min(source.x+source.w-e.w-10,e.end));
 if(Math.abs(x-e.x)>limit+3)return{platform:next,x,walkTarget:launchX,score:Math.abs(x-p.x)};
 const vx=(x-e.x)/time;return{platform:next,x,vx:destination.y>source.y+15?Math.sign(vx)*Math.max(Math.abs(vx),Math.min(250,Math.abs(x-e.x)/.9)):vx,score:Math.abs(x-p.x)};
}
export function beginFakeJump(g,e){
 if(!['fakenews','injection'].includes(e.type)||e.state!=='patrol'||e.jumpPhase||e.jumpCooldown>0||e.hurtTime>0)return false;
 const target=chooseFakeLanding(g,e);if(!target){delete e.navWalkX;return false;}
 if(target.walkTarget!==undefined){e.navWalkX=target.walkTarget;return false;}
 delete e.navWalkX;e.jumpTarget={index:target.platform.index,x:target.x,y:target.platform.y};e.jumpVx=target.vx;e.dir=target.vx<0?-1:1;e.jumpPhase='prepare';e.state='jumpWindup';e.timer=.16;e.vy=0;
 g.emit('fakeJumpReady',{x:e.x,y:e.y,enemyType:e.type});return true;
}
function land(e,s){
 e.y=s.y-e.h;e.vy=0;e.platformIndex=s.index;e.origin=s.x+8;e.end=Math.max(e.origin,s.x+s.w-e.w-8);e.x=clamp(e.x,e.origin,e.end);delete e.navWalkX;
 e.jumpPhase='land';e.state='land';e.timer=.18;e.jumpCooldown=1.1;
}
export function stepFakeJump(g,e,dt){
 if(!e.jumpPhase)return false;
 if(e.jumpPhase==='prepare'){
  if(e.hurtTime>0){e.jumpPhase=null;e.jumpTarget=null;e.jumpCooldown=1;return false;}
  e.timer-=dt;if(e.timer<=0){e.jumpPhase='air';e.state='jump';e.vy=-IMPULSE;g.emit('fakeJump',{x:e.x,y:e.y,enemyType:e.type});}return true;
 }
 if(e.jumpPhase==='land'){e.timer-=dt;if(e.timer<=0){e.jumpPhase=null;e.jumpTarget=null;e.state='patrol';e.timer=.55;}return true;}
 const oldBottom=e.y+e.h,nextX=e.x+e.jumpVx*dt;e.x=e.jumpTarget&&(e.jumpVx>0&&nextX>=e.jumpTarget.x||e.jumpVx<0&&nextX<=e.jumpTarget.x)?e.jumpTarget.x:nextX;e.vy=Math.min(580,e.vy+GRAVITY*dt);e.y+=e.vy*dt;
 e.x=clamp(e.x,rooms[e.room].x+8,rooms[e.room].end-e.w-8);
 if(e.vy>=0){const surfaces=solidSurfaces(g).filter(s=>s.room===e.room&&e.x+e.w>s.x+2&&e.x<s.x+s.w-2&&oldBottom<=(s.prevY??s.y)+1&&e.y+e.h>=s.y).sort((a,b)=>a.y-b.y);if(surfaces.length){land(e,surfaces[0]);g.emit('fakeLand',{x:e.x,y:e.y+e.h,enemyType:e.type});}}
 if(e.y>520){const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);e.x=clamp(e.x,s.x+8,s.x+s.w-e.w-8);e.y=s.y-e.h;e.jumpPhase=null;e.vy=0;e.state='recover';e.timer=.8;e.jumpCooldown=1.5;}
 return true;
}
