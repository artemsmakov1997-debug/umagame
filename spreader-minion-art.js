import {sprite} from './assets.js?v=0.21.5';
const frames=[[89,269,265,153],[530,284,246,158],[963,303,206,131],[1368,280,301,143],[1819,256,259,220]];
export function drawServant(c,a,e,time){
 const i=e.dead?4:e.state==='lunge'?3:e.state==='windup'?2:Math.floor(time*8)%2;
 const f=frames[i],w=38,h=w*f[3]/f[2];
 sprite(c,a.servant,f,e.x+(e.w-w)/2,e.y+e.h-h,w,h,e.dir<0);
}
