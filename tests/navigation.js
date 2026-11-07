import {rooms as campaignRooms} from '../level.js';
// Test pilot: supplies only ordinary movement/jump inputs to the live game model.
export function supportOf(g){const p=g.player;return g.platforms.find(s=>s.room===g.room&&Math.abs(s.y-p.y-p.h)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function future(g,s,seconds){const t=(g.platformClocks[s.room]||0)+seconds,offset=s.motion?Math.sin(t*Math.PI*2/s.motion.period)*s.motion.amplitude:0;return {...s,x:s.motion?.axis==='x'?s.baseX+offset:s.x,y:s.motion?.axis==='y'?s.baseY+offset:s.y};}
function tick(g,input){if(g.mode==='dialogue')g.advanceDialogue(true);else g.step(1/60,input);}
export function walkTo(g,x,max=500){for(let i=0;i<max;i++){if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}if(g.mode!=='playing')return false;const d=x-g.player.x;if(Math.abs(d)<=3)return true;tick(g,{right:d>0,left:d<0});}return false;}
export function jumpTo(g,room,index,max=1800){
 let airborne=false,landing=0,sourceAtLaunch=null;
 for(let frame=0;frame<max;frame++){
  if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}if(g.mode!=='playing')return false;
  const p=g.player,target=g.platforms.find(s=>s.room===room&&s.index===index),source=supportOf(g);if(!target)return false;
  if(p.grounded&&source?.id===target.id)return true;
  if(p.grounded){
   airborne=false;if(!source){tick(g,{});continue;}
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
// «Крыши» pilot with ordinary inputs: jumps, both ladders, the awning, a calm moment for the windy gap,
// waiting out each flock of Сенсации, and a paw swing at every transmitter on the way.
export async function roofLib(){return import('../roofs-systems.js');}
export function climbRoofs(g,lib,{relays=true}={}){
 const {flockState,windPhase,BIRD}=lib,{SENSATION_LANES}=lib.lanes,p=g.player,x0=campaignRooms[3].x,on=i=>p.grounded&&p.supportId==='3:'+i;
 const run=(cond,input,max=900)=>{for(let i=0;i<max&&!cond();i++)tick(g,typeof input==='function'?input(i):input);return cond();};
 const clear=(li,need,input={})=>{const lane=SENSATION_LANES[li],fly=(lane.x2-lane.x1+40+BIRD.gap*BIRD.count)/BIRD.speed;return run(()=>{const k=(((g.time+lane.phase)%lane.period)+lane.period)%lane.period;return k>BIRD.warn+fly&&lane.period-k>need;},input,600);};
 const hit=i=>{if(!relays)return;const d=g.relays.find(d=>d.room===3&&d.platformIndex===i&&d.hp);if(!d)return;walkTo(g,d.x-37);p.dir=1;p.cooldown=0;tick(g,{attack:true});tick(g,{});};
 if(!jumpTo(g,3,1))return false;
 walkTo(g,x0+524);if(!run(()=>on(2),{up:true},300))return false;hit(2);
 walkTo(g,x0+680);clear(0,1.8);if(!jumpTo(g,3,9)||!jumpTo(g,3,3))return false;
 clear(1,1.4);if(!jumpTo(g,3,4))return false;
 if(!run(()=>on(5),{right:true},300))return false;hit(5);
 walkTo(g,x0+1500);run(()=>windPhase(g.time)==='calm'&&windPhase(g.time+1.2)==='calm',{},400);run(()=>p.x>x0+1524,{right:true});tick(g,{right:true,jump:true});if(!run(()=>p.grounded,{right:true},120)||!on(6))return false;
 walkTo(g,x0+1760);clear(2,1.2);if(!jumpTo(g,3,7))return false;run(()=>false,{down:true},2);clear(2,2.1,{down:true});
 hit(7);walkTo(g,x0+1980);return run(()=>on(8),{up:true},300);
}
