import {feedState} from '../dimension-systems.js';
import {MIRROR} from '../dimension-map.js';
import {rooms as campaignRooms} from '../level.js';
// Test pilot: supplies only ordinary movement/jump inputs to the live game model.
export function supportOf(g){const p=g.player;return g.platforms.find(s=>s.room===g.room&&Math.abs(s.y-p.y-p.h)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function future(g,s,seconds){if(s.dim?.type==='copy'){const y=feedState(s.dim,g.time+seconds).y;return {...s,y:s.dim.reversed?MIRROR-y:y};}const t=(g.platformClocks[s.room]||0)+seconds,offset=s.motion?Math.sin(t*Math.PI*2/s.motion.period)*s.motion.amplitude:0;return {...s,x:s.motion?.axis==='x'?s.baseX+offset:s.x,y:s.motion?.axis==='y'?s.baseY+offset:s.y};}
function tick(g,input){if(g.mode==='dialogue')g.advanceDialogue(true);else g.step(1/60,input);}
export function walkTo(g,x,max=500){for(let i=0;i<max;i++){if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}if(g.mode!=='playing')return false;const d=x-g.player.x;if(Math.abs(d)<=3)return true;tick(g,{right:d>0,left:d<0});}return false;}
// Upside down (Измерение) the pilot works in the mirror image, where the flipped physics are the ordinary ones.
const view=(g,s)=>s&&g.player.flipped?{...s,y:MIRROR-s.y}:s;
const feetOf=p=>p.flipped?MIRROR-p.y:p.y+p.h;
function supportView(g){const p=g.player;if(!p.flipped)return supportOf(g);return view(g,g.platforms.find(s=>s.room===g.room&&s.dim?.inverted&&Math.abs(s.y-p.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w));}
export function jumpTo(g,room,index,max=1800){
 let airborne=false,landing=0,sourceAtLaunch=null;
 for(let frame=0;frame<max;frame++){
  if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}if(g.mode!=='playing')return false;
  const p=g.player,target=g.platforms.find(s=>s.room===room&&s.index===index),source=supportView(g);if(!target)return false;
  if(p.grounded&&source?.id===target.id)return true;
  if(p.grounded){
   airborne=false;if(!source){tick(g,{});continue;}
   let flight=.9,destination=target;
   for(let n=0;n<3;n++){destination=view(g,future(g,target,flight));const discriminant=250000+2160*(destination.y-source.y);flight=discriminant>=0?(500+Math.sqrt(discriminant))/1080:0;}
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
   const destination=view(g,future(g,target,.35));landing=clamp(landing,destination.x+4,destination.x+destination.w-p.w-4);
   if(sourceAtLaunch&&destination.y>sourceAtLaunch.y+15&&feetOf(p)<sourceAtLaunch.y+8){
    if(destination.x+destination.w>sourceAtLaunch.x+sourceAtLaunch.w+p.w+8)landing=Math.max(landing,sourceAtLaunch.x+sourceAtLaunch.w+7);
    else if(destination.x<sourceAtLaunch.x-p.w-8)landing=Math.min(landing,sourceAtLaunch.x-p.w-7);
   }
   const d=landing-p.x;tick(g,{right:d>3,left:d< -3});
  }
 }
 return false;
}
export const antennaRoutes={3:[1,8,1,2,10,17,18,11,12,19,25,26],5:[1,10,11,8,12,19,20,13,14,21,27,28],7:[1,8,1,2,10,17,18,11,12,19,25,26]};
// Quiet-room course with ordinary inputs: run, crawl under the bench, dash the barrier, jump the gap, paw the monitor.
export function completeTutorial(g,{exit=false}={}){
 const p=g.player,x0=campaignRooms[0].x,run=(cond,input,max=900)=>{for(let i=0;i<max&&!cond();i++)tick(g,typeof input==='function'?input(i):input);return cond();};
 run(()=>p.x>=x0+430,{right:true});
 run(()=>p.x>=x0+610,{right:true,down:true});
 run(()=>g.tutorial.barrierBroken||p.x>=x0+700&&p.vx===0,{right:true},300);
 for(let k=0;k<4&&!g.tutorial.barrierBroken;k++){tick(g,{right:true,dash:true});run(()=>p.dashCooldown===0,{},120);}
 run(()=>p.x>=x0+880,{right:true});tick(g,{right:true,jump:true});run(()=>p.grounded,{right:true},120);
 run(()=>p.x>=x0+1135,{right:true});tick(g,{attack:true});tick(g,{});
 if(exit)run(()=>g.room!==0||g.mode==='loading',{right:true},400);
 return g.tutorial.monitorBroken;
}
// «Крыши» pilot with ordinary inputs: walk off a roof onto a trampoline, steer the bounce onto the next roof,
// wait for a calm between the Нагнетатели's gusts. Сенсации are ignored (the pilot keeps a grace period).
export async function roofLib(){return import('../roofs-systems.js');}
export function climbRoofs(g,lib){
 const p=g.player,x0=campaignRooms[3].x,on=i=>p.grounded&&p.supportId==='3:'+i,surface=i=>g.platforms.find(s=>s.id==='3:'+i);
 const run=(cond,input,max=900)=>{for(let i=0;i<max&&!cond();i++){p.inv=Math.max(p.inv,5);tick(g,typeof input==='function'?input(i):input);}return cond();};
 const calm=()=>run(()=>!g.roofs||g.roofs.wind.phase==='calm'&&g.roofs.wind.timer>2.4,{},900);
 // Steer towards the middle of a surface; off a roof edge first if needed.
 const steer=i=>()=>{const s=surface(i),c=s.x+s.w/2-p.w/2;return {right:p.x<c-6,left:p.x>c+6};};
 const bounceTo=(i,...via)=>{calm();for(const t of via)if(!run(()=>on(t)||p.vy<0&&!p.grounded,steer(t),400))return false;return run(()=>on(i),steer(i),500);};
 const off=(edge)=>run(()=>!p.grounded,{right:true},300);
 if(!run(()=>p.x>x0+215,{right:true},300))return false;off();if(!bounceTo(1,8))return false;
 if(!jumpTo(g,3,2))return false;
 walkTo(g,x0+850);calm();off();if(!bounceTo(3,9))return false;
 if(!jumpTo(g,3,4))return false;
 walkTo(g,x0+1400);calm();off();if(!bounceTo(5,10,11))return false;
 if(!jumpTo(g,3,6)||!jumpTo(g,3,7))return false;
 return on(7);
}
// «Студия» pilot with ordinary inputs: riser jumps timed to the spotlights,
// takes timed to the clapper, a paw swing at every transmitter.
export async function studioLib(){return import('../studio-systems.js');}
export function crossStudio(g,lib,{relays=true}={}){
 const {stageLit,liveTake}=lib,p=g.player,x0=campaignRooms[5].x,on=i=>p.grounded&&p.supportId==='5:'+i,piece=i=>g.platforms.find(s=>s.id==='5:'+i).studio;
 const run=(cond,input,max=900)=>{for(let i=0;i<max&&!cond();i++)tick(g,typeof input==='function'?input(i):input);return cond();};
 const hit=i=>{if(!relays)return;const d=g.relays.find(d=>d.room===5&&d.platformIndex===i&&d.hp);if(!d)return;walkTo(g,d.x-37);p.dir=1;p.cooldown=0;tick(g,{attack:true});tick(g,{});};
 // Timed hops: stand at the edge first, then wait until the target stays solid through the whole flight and a bit after.
 const hop=(i,ready)=>{if(ready){const s=g.platforms.find(s=>s.id===p.supportId);if(s)walkTo(g,s.x+s.w-p.w-8);run(ready,{},900);}return jumpTo(g,5,i);};
 const solidFor=(i,test)=>()=>[.1,.3,.5,.7,.9,1.1].every(d=>test(g.time+d));
 const litSoon=i=>solidFor(i,t=>stageLit(piece(i),t));
 const takeSoon=i=>solidFor(i,t=>liveTake(t).color===piece(i).color);
 if(!hop(1,litSoon(1))||!hop(2,litSoon(2))||!hop(3))return false;hit(3);
 if(!hop(4))return false;
 if(!hop(5,litSoon(5))||!hop(6,litSoon(6))||!hop(7,litSoon(7))||!hop(8))return false;hit(8);
 if(!hop(9,takeSoon(9))||!hop(10,takeSoon(10))||!hop(11))return false;hit(11);
 if(!hop(12,takeSoon(12))||!hop(13,takeSoon(13))||!hop(14))return false;
 return on(14);
}

// «Измерение» pilot with ordinary inputs: ride the rising feed, walk into the first rift, ride the upside-down feed
// (the same moves in the mirror image), walk into the second rift and hop to the threshold.
export function crossDimension(g){
 const p=g.player,x0=campaignRooms[7].x,piece=i=>g.platforms.find(s=>s.id==='7:'+i);
 const run=(cond,input,max=900)=>{for(let i=0;i<max&&!cond();i++)tick(g,typeof input==='function'?input(i):input);return cond();};
 const on=i=>p.grounded&&p.supportId==='7:'+i;
 // A lane of copies; `first` is 1 for the rising feed, 12 for the upside-down one. In the mirror both look the same.
 const lane=(first,l)=>[0,1,2].map(k=>piece(first+l*3+k));
 const feet=()=>feetOf(p);
 const pick=(first,l,lo,hi)=>()=>{const cand=lane(first,l).map(s=>({s,y:feedState(s.dim,g.time+.6).y,k:feedState(s.dim,g.time+1.4).k})).filter(c=>c.y>=lo()&&c.y<=hi()&&c.k<.8&&c.k>.05).sort((a,b)=>b.y-a.y)[0];return cand?.s;};
 const hopToLane=(first,l,lo,hi)=>{let target=null;if(!run(()=>(target=pick(first,l,lo,hi)()),{},900))return false;return jumpTo(g,7,target.index,400);};
 const feed=(first,end)=>{
  if(!hopToLane(first,0,()=>330,()=>430))return 'lane0@'+first;
  if(!hopToLane(first,1,()=>feet()-80,()=>feet()+50))return 'lane1@'+first;
  if(!hopToLane(first,2,()=>feet()-80,()=>feet()+50))return 'lane2@'+first;
  if(!run(()=>feet()<=405&&feet()>=210,{},400))return 'wait@'+first;
  if(!jumpTo(g,7,end,400))return 'end@'+first;return true;
 };
 walkTo(g,x0+170);
 let r=feed(1,10);if(r!==true)return r;
 // The first rift runs through the far end of Yuri's message: walk into it and fall up under the hanging one.
 if(!run(()=>p.flipped&&on(11),{right:true},300))return 'flip11 '+Math.round(p.x-x0)+' '+Math.round(p.y)+' '+p.flipped;
 walkTo(g,x0+1000);
 r=feed(12,21);if(r!==true)return r;
 if(!run(()=>!p.flipped&&on(22),{right:p.x<x0+1730},300))return 'land22 '+Math.round(p.x-x0)+' '+Math.round(p.y)+' '+p.flipped;
 if(!jumpTo(g,7,23,400)||!jumpTo(g,7,24,400))return 'threshold';
 return on(24);
}
