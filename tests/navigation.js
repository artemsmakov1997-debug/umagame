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
export const dishRoutes={1:[9,7],2:[1,8],3:[1,8,10],4:[1,8],5:[1,10,11]};
export function reachDish(g,room){
 for(const index of dishRoutes[room]){if(room===5&&index===10){for(let i=0;i<650;i++){const lift=g.platforms.find(s=>s.room===5&&s.index===10);if(lift.dy<0&&lift.y>300)break;tick(g,{});}}if(!jumpTo(g,room,index))return false;}
 const d=g.relays.find(d=>d.room===room),s=supportOf(g);if(!d||!s)return false;
 const goal=clamp(d.x-g.player.w-3,s.x+4,s.x+s.w-g.player.w-4);if(!walkTo(g,goal))return false;
 g.step(1/60,{right:true,attack:true});return d.hp===0;
}
