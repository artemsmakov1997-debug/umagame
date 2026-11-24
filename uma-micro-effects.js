import {rect} from './pixel.js?v=0.21.6';
const clamp=v=>Math.max(0,Math.min(1,v));
// Pure drawing: all motion follows paused game/actor time, without particle queues or changes to Uma's sprite.
export function drawSpeedAura(c,p,time){
 const dash=p.dash>0,run=p.speedTime>0&&p.grounded&&Math.abs(p.vx)>5&&!p.sneaking&&!p.slipping&&!p.knock;
 if((!dash&&!run)||p.sleeping||p.climbing||p.hurtTime>0)return false;
 const cx=p.x+p.w/2,cy=p.y+p.h*.6,pulse=.5+.5*Math.sin(time*9),color=dash?'103,224,255':'255,215,125';
 c.save();c.globalAlpha*=.13+.05*pulse;const glow=c.createRadialGradient(cx,cy,3,cx,cy,43);glow.addColorStop(0,'rgba('+color+',.8)');glow.addColorStop(1,'rgba('+color+',0)');c.fillStyle=glow;c.fillRect(cx-43,cy-43,86,86);c.restore();
 c.save();for(let i=0;i<4;i++){const q=(time*1.9+i*.25)%1,x=cx-p.dir*(12+q*31),y=cy-14+i*8+Math.sin(time*7+i)*2;c.globalAlpha=.45*(1-q);rect(c,x,y,2+Math.floor(q*3),2,dash?'#a3f4ff':'#ffe3a0');}c.restore();return true;
}
const Z=['11111','00001','00010','00100','01000','10000','11111'];
export function drawSleepZ(c,p){
 if(!p.sleeping||p.sleepTime<=1)return false;
 c.save();for(let i=0;i<3;i++){const age=(p.sleepTime-1+i*.8)%2.4,q=age/2.4,k=1+i*.3,x=Math.round(p.x+p.w/2+(p.dir<0?-15:15)+q*12+Math.sin(age*2+i)*2),y=Math.round(p.y+5-q*40);c.globalAlpha=.8*Math.min(1,age/.25,(2.4-age)/.5);
  for(let row=0;row<Z.length;row++)for(let col=0;col<5;col++)if(Z[row][col]==='1')rect(c,x+Math.round(col*k),y+Math.round(row*k),Math.ceil(k),Math.ceil(k),'#badff5');
 }c.restore();return true;
}
export function drawClawMarks(c,p){
 const age=.19-(p.attack||0);if(!p.attack||age<.025)return false;
 const progress=clamp((age-.025)/.145),cy=p.y+p.h*.5;c.save();c.translate(Math.round(p.x+p.w/2+p.dir*36),Math.round(cy));if(p.dir<0)c.scale(-1,1);c.globalAlpha*=clamp(p.attack/.035);
 for(let claw=0;claw<3;claw++)for(let step=0;step<=12;step++){const q=step/12,end=progress-claw*.045;if(q>end||q<end-.58)continue;const x=Math.round(-6+Math.sin(q*Math.PI)*15+(claw-1)*4),y=Math.round(-20+q*36+(claw-1)*3);rect(c,x-1,y-1,4,4,'#e6a34e');rect(c,x,y,2,3,'#fff2cf');}
 c.restore();return true;
}
