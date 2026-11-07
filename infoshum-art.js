import {drawInfoshumTentacle} from './infoshum-tentacle-art.js?v=0.21.5';
import {drawPixelBarrier} from './shield-art.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {drawScreenContent,drawCableBlob,drawBreakout,drawSmokingCase} from './infoshum-anim-art.js?v=0.21.5';
// Rendered production assets for the two-stage Infoshum encounter.
// Frame atlases are original pixel PNG assets, preloaded in assets.js and drawn with pixel smoothing off.
import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
const cyan='#67ebff',magenta='#ff60da';
const crtFrame=256,crtHeight=240,bodyFrame=320,bodyHeight=280,terminalFrame=80,terminalHeight=60;
function atlas(c,image,index,sw,sh,x,y,w,h,a,kind){drawInfoshumSprite(c,a,kind,index,x,y,w,h);}
function point(c,x,y,r,time,color=cyan){
 const phase=Math.sin(time*7);
 c.save();c.lineWidth=2;c.strokeStyle=color;c.globalAlpha=.7+.2*phase;
 for(let i=0;i<4;i++){const a=Math.PI/2*i+Math.PI/4;const start=r*.65;
  c.beginPath();c.moveTo(x+Math.cos(a)*start,y+Math.sin(a)*start);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke();}
 c.restore();
}
function thickCable(c,a,b,lit,time){const x1=a.x+a.w/2,y1=a.y+a.h-8,x2=b.x+b.w/2,y2=b.y+b.h-8;for(let i=0;i<=96;i++){const t=i/96,q=1-t,x=q*q*q*x1+3*q*q*t*(x1+95)+3*q*t*t*(x2-95)+t*t*t*x2,y=q*q*q*y1+3*q*q*t*(y1+118)+3*q*t*t*(y2+118)+t*t*t*y2;rect(c,Math.round(x)-6,Math.round(y)-6,12,12,'#07112b');rect(c,Math.round(x)-2,Math.round(y)-2,4,4,lit?'#4fcbe9':'#5e3b87');if(lit&&(i+Math.floor(time*12))%10===0)rect(c,x-2,y-3,4,5,'#dcfcff');}}
function cables(c,n,time){
 const ms=n.monitors;
 thickCable(c,ms[0],ms[1],n.stage==='network'&&(n.fromIndex===0||n.toIndex===0),time);
 thickCable(c,ms[1],ms[2],n.stage==='network'&&(n.fromIndex===2||n.toIndex===2),time);
}
function monitorFrame(m,n,time){
 if(m.state==='broken')return m.destroyTime>.45?4:5;
 if(n.stage==='rupture'||n.stage==='free')return 4;
 if(m.state==='open')return m.shieldTime>0?1:2;
 if(n.mode==='transit'&&(m.index===n.fromIndex||m.index===n.toIndex))return 2;
 if(n.mode==='transferWarning'&&m.index===n.activeIndex)return Math.floor(time*8)%3===0?2:1;
 if(m.index===n.activeIndex)return n.mode==='charge'?3:1;
 return 0;
}
function crt(c,a,m,n,time){
 const frame=monitorFrame(m,n,time);
 atlas(c,a.infoshumCRT,frame,crtFrame,crtHeight,m.x,m.y-35,m.w,m.w*271/319,a,'crt');
 if(m.destroyTime>0){for(let i=0;i<8;i++){const travel=(.9-m.destroyTime)*55,ang=i*2.4;c.save();c.globalAlpha=Math.min(1,m.destroyTime*2);c.drawImage(a.infoshumCRT,36+(i%3)*85,77+Math.floor(i/3)*80,38,34,m.x+m.w/2+Math.cos(ang)*travel,m.y+m.h/2+Math.sin(ang)*travel,8,7);c.restore();}}
 // Screen content for the moves between screens drawn over the glass.
 if(n.stage==='network'&&m.state!=='broken'){const active=m.index===n.activeIndex,p=n.mode==='transit'?Math.min(1,n.transitTime/n.transitDuration):0;
  const kind=n.mode==='transit'?(m.index===n.fromIndex?'empty':m.index===n.toIndex&&p>.6?'eyes':null):(m.arrival||0)>0&&active?'assemble':active&&n.mode==='transferWarning'?'socket':active&&n.mode==='charge'?'pressed':active&&n.mode==='attack'?'strike':null;
  if(kind)drawScreenContent(c,a,m,kind,kind==='eyes'?.6+.4*Math.abs(Math.sin(time*20)):1);}
 if(frame<4){c.save();c.globalAlpha=.16;rect(c,m.x+20,m.y+20+(time*24+m.index*25)%(m.h-35),m.w-40,2,'#94f5ff');c.restore();}
 if(frame===3){point(c,m.x+m.w/2,m.y+m.h/2,48,time,magenta);}
 if(frame===4){point(c,m.x+m.w/2,m.y+m.h/2,72,time,magenta);}
 if((m.state!=='open'||m.shieldTime>0)&&m.state!=='broken'&&n.stage==='network')drawPixelBarrier(c,m.x+m.w/2,m.y+55,m.w*.56,105,{time,alpha:m.shieldTime>0?.8:.45,flash:m.guardFlash});
 // The hittable terminal below is marked by target-highlight.js; the screen itself is not a target.
}
function terminal(c,a,m,n,time){
 if(n.stage!=='network')return;
 const frame=m.destroyTime>.45?2:m.state==='broken'?3:m.state==='open'&&m.shieldTime<=0?1:0;
 const x=m.terminalX-40,y=m.terminalY-27;
 atlas(c,a.infoshumTerminal,frame,terminalFrame,terminalHeight,x,y,80,60,a,'terminal');
 for(let i=0;i<2;i++)rect(c,m.terminalX-10+i*12,m.terminalY+30,8,3,i<(m.armor??2)?'#72edff':'#553b69');
 if(m.state==='open'&&m.shieldTime<=0){point(c,m.terminalX,m.terminalY+19,29,time,magenta);}
}
function transfer(c,a,n,time){
 if(n.mode!=='transit')return;
 const f=n.monitors[n.fromIndex],t=n.monitors[n.toIndex],p=Math.min(1,n.transitTime/n.transitDuration);
 const sx=f.x+f.w/2,sy=f.y+f.h/2,ex=t.x+t.w/2,ey=t.y+t.h/2;
 const x=sx+(ex-sx)*p,y=sy+(ey-sy)*p-Math.sin(p*Math.PI)*54;
 for(let i=20;i>=0;i--){
  const r=Math.max(0,p-i/36),px=sx+(ex-sx)*r,py=sy+(ey-sy)*r-Math.sin(r*Math.PI)*54;
  rect(c,px-12*Math.sin(i*2),py+9*Math.cos(i*4),4+i%4*2,3+i%3,i%3?'#3ecaff':'#fa70e9');
 }
 // A blob of noise travelling inside the cable, turned along the arc.
 const q=Math.min(1,p+.02),nx=sx+(ex-sx)*q,ny=sy+(ey-sy)*q-Math.sin(q*Math.PI)*54,angle=Math.atan2(ny-y,nx-x||1e-6);
 if(!drawCableBlob(c,a,x,y,angle,time)){c.save();c.globalAlpha=.85;atlas(c,a.infoshumBody,7,bodyFrame,bodyHeight,x-66,y-58,132,117,a,'body');c.restore();}
}
// The screen Infoshum tears open: the one still standing when the others are broken.
const ruptureMonitor=n=>n.monitors.find(m=>m.state!=='broken')||n.monitors[n.lastMonitorIndex]||n.monitors.at(-1);
function screenExit(c,a,g,time){
 const b=g.boss,n=b.network,near=ruptureMonitor(n);
 if(!near)return;
 const x=near.x+near.w/2,y=near.y+near.h/2;
 if(drawBreakout(c,a,near,n.transitionProgress,time))return;
 c.save();c.globalAlpha=.2+n.transitionProgress*.8;
 const scale=.5+n.transitionProgress*.75;
 atlas(c,a.infoshumBody,7,bodyFrame,bodyHeight,x-170*scale,y-148*scale,340*scale,296*scale,a,'body');
 c.restore();
 for(let i=0;i<33;i++){const a=i*2.4+time*3,r=(15+(i%12)*7)*n.transitionProgress;
  rect(c,x+Math.cos(a)*r,y+Math.sin(a)*r,3+i%3*3,3+i%4,i%2?'#ff55ed':'#4ae6fb');}
}
function tendril(c,a,b,n,time){
 if(!n.target||!['slamWarning','slam','weak'].includes(n.mode))return;
 const x=n.target.x,y=n.target.y-26,headX=b.x+b.w/2,headY=b.y+b.h*.5;
 if(n.mode==='slamWarning'){
  c.save();c.strokeStyle='#fd76d4';c.lineWidth=3;c.setLineDash([7,5]);c.strokeRect(x-30,y-5,60,30);c.restore();
  point(c,x,y,25,time,magenta);return;
 }
 drawInfoshumTentacle(c,a,b,n,time);
}
export function drawInfoshumBackdrop(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 const r=rooms[g.room];
 const target=n.stage==='network'?a.infoshumArenaNetwork:a.infoshumArenaFree;
 if(target?.complete&&target.naturalWidth)c.drawImage(target,r.x,0,r.width,512);
 // Transitions: background and monitors are separate layers so platforms never slice through screens.
 cables(c,n,time);
 if(n.stage==='rupture'){
  c.save();c.globalAlpha=.16+.14*Math.sin(time*14);
  rect(c,r.x,0,r.width,512,'#e155fc');c.restore();
 }
}
export function drawInfoshumPlatform(c,a,p,time){
 if(!a.infoshumPlatform?.complete)return;
 const image=a.infoshumPlatform,scale=30/177,cap=Math.min(140*scale,p.w/3),y=p.y-3;
 c.drawImage(image,22,299,140,177,p.x,y,cap,30);
 for(let x=cap;x<p.w-cap;x+=300*scale){const w=Math.min(300*scale,p.w-cap-x);c.drawImage(image,430,299,w/scale,177,p.x+x,y,w,30);}
 c.drawImage(image,2011,299,140,177,p.x+p.w-cap,y,cap,30);
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(b.hp<=0){if(n.stage==='free')for(const m of n.monitors)drawInfoshumSprite(c,a,'crt',5,m.x+m.w/2-55,380,110,94);return;}
 if(n.stage==='network'){
  for(const m of n.monitors)crt(c,a,m,n,time);
  for(const m of n.monitors)terminal(c,a,m,n,time);
  transfer(c,a,n,time);
  if(n.mode==='charge'&&n.target){
   for(const t of[n.target,...(n.extraTargets||[])])colorWarning(c,t,time,n.attackKind);
  }
  if(n.mode==='transferWarning'){
   const t=n.monitors[n.toIndex];if(t)point(c,t.x+t.w/2,t.y+t.h/2,48,time,cyan);
  }
  return;
 }
 if(n.stage==='rupture'){
  const torn=ruptureMonitor(n);for(const m of n.monitors)if(m!==torn||!a.infoshumBreakout)crt(c,a,m,n,time);
  screenExit(c,a,g,time);return;
 }
 // The last screen tears open. Free form is a dedicated eight-pose sprite atlas, not a
 // reused projection of the old CRT sprite.
 for(const m of n.monitors)if(!(m===ruptureMonitor(n)&&drawSmokingCase(c,a,m)))drawInfoshumSprite(c,a,'crt',5,m.x+m.w/2-55,380,110,94);
 const frame=b.hurtTime>0?5:n.mode==='weak'?4:n.mode==='slam'?2:['slamWarning','rainWarning','beamWarning'].includes(n.mode)?1:['waveWarning','scan','rain'].includes(n.mode)?3:0;
 const wobble=Math.sin(time*2.7)*8,spread=n.mode==='slam'?1.1:1;
 const w=350*spread,h=302*spread;
 atlas(c,a.infoshumBody,frame,bodyFrame,bodyHeight,b.x+b.w/2-w/2,b.y-74+wobble,w,h,a,'body');
 tendril(c,a,b,n,time);
 if(['waveWarning','rainWarning','beamWarning','platformWarning','slamWarning'].includes(n.mode)&&n.target){for(const t of[n.target,...(n.extraTargets||[])])colorWarning(c,t,time,n.mode==='rainWarning'?'rain':n.mode==='beamWarning'?'beam':'wave');}
 if(n.mode==='scan'&&n.target){const x=n.scanX;rect(c,x-7,20,14,n.target.y-20,'#c642b54d');rect(c,x-2,20,4,n.target.y-20,'#ffa5f2');drawInfoshumSprite(c,a,'effect',3,x-24,n.target.y-30,48,44);}

}
function colorWarning(c,t,time,kind){
 const w=kind==='rain'?110:kind==='beam'?190:kind==='wave'?86:76;
 c.save();c.globalAlpha=.55+.4*Math.abs(Math.sin(time*9));
 rect(c,t.x-w/2,t.y-8,w,3,kind==='wave'?cyan:magenta);
 for(let i=0;i<4;i++)rect(c,t.x-w/2+i*16,t.y-15,10,3,kind==='wave'?'#aafaff':'#ffc3fa');
 c.restore();
}
