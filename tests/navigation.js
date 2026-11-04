import {solidSurfaces} from '../terrain.js';
import {rooms as campaignRooms,ladders} from '../level.js';
// Test pilot: supplies only ordinary movement/jump inputs to the live game model.
export function supportOf(g){const p=g.player,held=g.platforms.find(s=>s.id===p.supportId);if(held&&p.grounded&&Math.abs(held.y-p.y-p.h)<3)return held;return g.platforms.find(s=>s.room===g.room&&Math.abs(s.y-p.y-p.h)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function future(g,s,seconds){const t=(g.platformClocks[s.room]||0)-(s.motionPausedTime||0)+seconds,offset=s.motion?Math.sin(t*Math.PI*2/s.motion.period)*s.motion.amplitude:0;return {...s,x:s.motion?.axis==='x'?s.baseX+offset:s.x,y:s.motion?.axis==='y'?s.baseY+offset:s.y};}
function tick(g,input){if(g.mode==='dialogue')g.advanceDialogue(true);else g.step(1/60,input);}
export function walkTo(g,x,max=500){for(let i=0;i<max;i++){if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}if(g.mode!=='playing')return false;const d=x-g.player.x;if(Math.abs(d)<=3)return true;tick(g,{right:d>0,left:d<0});}return false;}
function hopTo(g,room,index,max=700,requested=null){
 let airborne=false,hasLeft=false,landing=0,sourceAtLaunch=null;
 for(let frame=0;frame<max;frame++){
  if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}if(g.mode!=='playing')return false;
  const p=g.player,target=requested||g.platforms.find(s=>s.room===room&&s.index===index),source=supportOf(g);if(!target)return false;
  if(!p.grounded)hasLeft=true;
  if(p.grounded&&Math.abs(p.y+p.h-target.y)<2&&p.x+p.w/2>target.x+6&&p.x+p.w/2<target.x+target.w-6)return true;
  if(p.grounded&&hasLeft)return false;
  if(p.grounded){
   airborne=false;if(!source){tick(g,{});continue;}if(Math.abs(source.y-target.y)<3&&Math.max(source.x,target.x)-Math.min(source.x+source.w,target.x+target.w)<18){const d=target.x+(target.w-p.w)/2-p.x;tick(g,{right:d>2,left:d< -2});continue;}
   if(target.y>source.y+8&&p.x+p.w>target.x+6&&p.x<target.x+target.w-6){sourceAtLaunch={...source};airborne=true;landing=clamp(p.x,target.x+6,target.x+target.w-p.w-6);tick(g,{down:true,attack:true});continue;}
   let flight=.9,destination=target;
   for(let n=0;n<3;n++){destination=future(g,target,flight);const discriminant=250000+2160*(destination.y-source.y);flight=discriminant>=0?(500+Math.sqrt(discriminant))/1080:0;}
   const launch=destination.x>source.x+source.w-48?source.x+source.w-p.w-6:destination.x+destination.w<source.x+48?source.x+6:clamp(destination.x+(destination.w-p.w)/2,source.x+6,source.x+source.w-p.w-6);
   landing=clamp(launch,destination.x+6,destination.x+destination.w-p.w-6);
   if(destination.y>source.y+15){if(destination.x+destination.w>source.x+source.w+p.w+8)landing=Math.max(landing,source.x+source.w+7);else if(destination.x<source.x-p.w-8)landing=Math.min(landing,source.x-p.w-7);}
   const gap=Math.max(0,destination.x-source.x-source.w,source.x-destination.x-destination.w);
   if(destination.y>source.y+15&&gap<155*Math.sqrt(2*(destination.y-source.y)/1080)+p.w-4){
    sourceAtLaunch={...source};airborne=true;const d=landing-p.x;tick(g,{right:d>3,left:d< -3});continue;
   }
   const d=launch-p.x,valid=flight>0&&Math.abs(landing-launch)<155*flight+p.w+6;
   if(Math.abs(d)>5){tick(g,{right:d>0,left:d<0});continue;}
   if(!valid){tick(g,{});continue;}
   sourceAtLaunch={...source};airborne=true;const axis=landing-p.x;tick(g,{jump:true,right:axis>3,left:axis< -3});
  }else{
   if(!airborne){landing=target.x+(target.w-p.w)/2;airborne=true;}
   const destination=future(g,target,.35);landing=clamp(landing,destination.x+4,destination.x+destination.w-p.w-4);
   if(sourceAtLaunch&&destination.y>sourceAtLaunch.y+15&&p.y+p.h<sourceAtLaunch.y+8){
    if(destination.x+destination.w>sourceAtLaunch.x+sourceAtLaunch.w+p.w+8)landing=Math.max(landing,sourceAtLaunch.x+sourceAtLaunch.w+7);
    else if(destination.x<sourceAtLaunch.x-p.w-8)landing=Math.min(landing,sourceAtLaunch.x-p.w-7);
   }
   const d=landing-p.x;tick(g,{right:d>3,left:d< -3});
  }
 }
 return false;
}
export const antennaRoutes={1:[7,18,26],3:[8,18,26],5:[11,20,28],7:[8,18,26]};

const blockedPaths=new WeakMap();
function pathTo(g,target){
 const blocked=blockedPaths.get(g)||new Set();let surfaces=solidSurfaces(g).filter(s=>s.room===g.room&&!s.temporary&&s.w>=35);
 for(const wall of g.partitions.filter(w=>w.room===g.room&&!w.open))surfaces=surfaces.flatMap(s=>{if(wall.y>=s.y||wall.y+wall.h<s.y-40||wall.x>=s.x+s.w||wall.x+wall.w<=s.x)return[s];const out=[];if(wall.x-s.x>=35)out.push({...s,w:wall.x-s.x,motion:null});if(s.x+s.w-wall.x-wall.w>=35)out.push({...s,x:wall.x+wall.w,w:s.x+s.w-wall.x-wall.w,motion:null});return out;});
 surfaces=surfaces.map(s=>({...s,navId:s.id+'@'+Math.round(s.x)+':'+Math.round(s.w)}));const held=supportOf(g),source=held&&surfaces.find(s=>s.id===held.id&&g.player.x+g.player.w>s.x&&g.player.x<s.x+s.w),goal=surfaces.find(s=>s.id===target.id&&target.x+target.w/2>=s.x&&target.x+target.w/2<=s.x+s.w)||surfaces.find(s=>s.id===target.id);if(!source||!goal)return null;
 const queue=[source],previous=new Map([[source.navId,null]]),edge=new Map();
 for(let i=0;i<queue.length;i++){const a=queue[i];if(a.navId===goal.navId)break;for(const b of surfaces){if(previous.has(b.navId)||a===b)continue;
 const ax=a===source?g.player.x+17:a.x+a.w/2,bx=b.x+b.w/2;if(g.partitions.some(w=>w.room===g.room&&!w.open&&w.x>Math.min(ax,bx)&&w.x<Math.max(ax,bx)&&w.y<Math.min(a.y,b.y)-110&&w.y+w.h>Math.max(a.y,b.y)-40))continue;
 const same=Math.abs(a.y-b.y)<4&&Math.max(a.x,b.x)-Math.min(a.x+a.w,b.x+b.w)<24,dy=b.y-a.y,disc=250000+2160*dy,time=disc>0?(500+Math.sqrt(disc))/1080:0,gap=Math.max(0,b.x-a.x-a.w,a.x-b.x-b.w);
 const ladder=ladders.find(l=>l.room===g.room&&a.x+a.w>l.x+4&&a.x<l.x+l.w-4&&b.x+b.w>l.x+4&&b.x<l.x+l.w-4&&Math.min(a.y,b.y)>=l.y-2&&Math.max(a.y,b.y)<=l.y+l.h+3);
 if((same||ladder||dy>=-112&&time>0&&gap+38<155*time)&&(!(blocked.has(a.id+'>'+b.id))||same||ladder)){previous.set(b.navId,a);edge.set(b.navId,ladder?{ladder}:{});queue.push(b);}
 }}if(!previous.has(goal.navId))return null;const path=[];let cur=goal;while(previous.get(cur.navId)){path.push({surface:cur,...edge.get(cur.navId)});cur=previous.get(cur.navId);}return path.reverse();
}

function climbTo(g,s,ladder){const p=g.player,up=s.y<p.y+p.h;if(!walkTo(g,ladder.x+(ladder.w-p.w)/2,500))return false;for(let i=0;i<900;i++){const feet=p.y+p.h;if(p.grounded&&Math.abs(feet-s.y)<2)return true;if(up?feet<s.y-.1:feet>=s.y-3&&feet<=s.y+1){const center=s.x+s.w/2,dir=center>=p.x+p.w/2?1:-1;for(let n=0;n<90;n++){tick(g,{right:dir>0,left:dir<0});if(p.grounded&&Math.abs(p.y+p.h-s.y)<2&&p.x+p.w>s.x&&p.x<s.x+s.w)return true;}return false;}tick(g,up?{up:true}:{down:true});if(g.mode!=='playing')return false;}return false;}

export function jumpTo(g,room,index,max=1800){blockedPaths.delete(g);const target=g.platforms.find(s=>s.room===room&&s.index===index);if(!target)return false;if(!campaignRooms[room].multiStorey)return hopTo(g,room,index,max);for(let retry=0;retry<24;retry++){tick(g,{});for(let i=0;i<120&&!g.player.grounded;i++)tick(g,{});const path=pathTo(g,target);if(!path)return false;if(!path.length)return true;let success=true;for(const step of path){const start=supportOf(g);if(step.ladder){if(!climbTo(g,step.surface,step.ladder)){const set=blockedPaths.get(g)||new Set();set.add((start?.id||'air')+'>'+step.surface.id);blockedPaths.set(g,set);success=false;break;}}else if(!hopTo(g,room,step.surface.index,600,step.surface)){const set=blockedPaths.get(g)||new Set();set.add((start?.id||'air')+'>'+step.surface.id);blockedPaths.set(g,set);success=false;break;}}if(success)return true;}return false;}

export {pathTo as planRoute};
