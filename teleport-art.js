import {rect} from './pixel.js?v=0.12.0';
import {drawMonster} from './art.js?v=0.12.0';
import {TELEPORT_PHASES} from './informant-teleport.js?v=0.12.0';
function ring(c,x,y,time,strength){
 c.save();c.globalAlpha*=strength;
 rect(c,x-25,y+2,50,3,'#020918');
 for(let i=0;i<24;i++){const angle=i*Math.PI/12;rect(c,x+Math.cos(angle)*25,y+Math.sin(angle)*6,3,2,i%3?'#75eff5':'#c997ff');}
 for(let i=0;i<7;i++){const yy=(Math.floor(time*42)+i*11)%56;rect(c,x-21+i*7,y-yy,2,4,i%2?'#8eeef2':'#b39cff');}
 c.restore();
}
export function drawTeleportMarkers(c,e,time){
 const t=e.teleport;if(!t)return;
 const progress=t.elapsed/TELEPORT_PHASES[t.phase],strength=t.phase==='charge'?.35+.65*progress:t.phase==='in'?1-progress*.5:1;
 ring(c,t.source.x+24,t.source.y+e.h,time,strength*.75);
 ring(c,t.target.x+24,t.target.y+e.h,time,strength);
 if(t.phase==='blink'){
  c.save();c.globalAlpha*=.35;c.strokeStyle='#c7b4ff';c.lineWidth=2;c.setLineDash([3,8]);c.beginPath();c.moveTo(t.source.x+24,t.source.y-5);c.lineTo(t.target.x+24,t.target.y-5);c.stroke();c.restore();
 }
}
export function drawTeleportingInformant(c,a,e,time){
 const t=e.teleport;if(!t)return false;
 const x=e.x-18,y=e.y-56,w=84,h=85,progress=Math.min(1,t.elapsed/TELEPORT_PHASES[t.phase]);
 if(t.phase==='blink')return true;
 if(t.phase==='charge'){
  drawMonster(c,a,'informant',x,y,w,h,time,e.dir<0,{...e,state:'windup',moving:false});
  c.save();c.globalAlpha*=.25+.5*progress;rect(c,e.x+21,e.y-56,6,9,'#d9ffff');rect(c,e.x+16,e.y-52,16,2,'#8fedff');c.restore();return true;
 }
 const visible=t.phase==='out'?1-progress:progress,pose={...e,state:t.phase==='out'?'windup':'patrol',moving:false};
 for(let row=0;row<17;row++){
  const order=(row*7)%17;if(order>=Math.ceil(visible*17))continue;
  const glitch=(row%3-1)*Math.round((1-visible)*7);
  c.save();c.beginPath();c.rect(x-8,y+row*5,w+16,5);c.clip();c.globalAlpha*=.55+visible*.45;
  drawMonster(c,a,'informant',x+glitch,y,w,h,time,e.dir<0,pose);c.restore();
  if(visible<.9&&row%4===0)rect(c,x+glitch+9,y+row*5,Math.round(w*(1-visible)*.7),1,'#8cdef4');
 }
 return true;
}
