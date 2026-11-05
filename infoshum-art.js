// Rendered production assets for the two-stage Infoshum encounter.
// Frame atlases are actual SVG image assets, preloaded in assets.js and drawn with pixel smoothing off.
import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
const cyan='#67ebff',magenta='#ff60da';
const crtFrame=256,crtHeight=240,bodyFrame=320,bodyHeight=280,terminalFrame=80,terminalHeight=60;
function atlas(c,image,index,sw,sh,x,y,w,h){
 if(!image?.complete||!image.naturalWidth)return;
 c.drawImage(image,index*sw,0,sw,sh,Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function point(c,x,y,r,time,color=cyan){
 const phase=Math.sin(time*7);
 c.save();c.lineWidth=2;c.strokeStyle=color;c.globalAlpha=.7+.2*phase;
 for(let i=0;i<4;i++){const a=Math.PI/2*i+Math.PI/4;const start=r*.65;
  c.beginPath();c.moveTo(x+Math.cos(a)*start,y+Math.sin(a)*start);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke();}
 c.restore();
}
function thickCable(c,a,b,lit,time){
 const sx=a.x+a.w/2,sy=a.y+a.h-8,ex=b.x+b.w/2,ey=b.y+b.h-8;
 c.save();c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx+95,sy+118,ex-95,ey+118,ex,ey);
 c.lineWidth=14;c.strokeStyle='#050b28';c.stroke();
 c.strokeStyle=lit?'#43bdf0':'#4a3675';c.lineWidth=5;c.stroke();
 c.strokeStyle=lit?'#cefaff':'#793aaa';c.lineWidth=1.5;c.setLineDash([12,22]);c.lineDashOffset=-time*36;c.stroke();
 c.restore();
}
function cables(c,n,time){
 const ms=n.monitors;
 thickCable(c,ms[0],ms[1],n.stage==='network'&&(n.fromIndex===0||n.toIndex===0),time);
 thickCable(c,ms[1],ms[2],n.stage==='network'&&(n.fromIndex===2||n.toIndex===2),time);
}
function monitorFrame(m,n,time){
 if(m.state==='broken')return 5;
 if(n.stage==='rupture'||n.stage==='free')return 4;
 if(m.state==='open')return 3;
 if(n.mode==='transit'&&(m.index===n.fromIndex||m.index===n.toIndex))return 2;
 if(n.mode==='transferWarning'&&m.index===n.activeIndex)return Math.floor(time*8)%3===0?2:1;
 if(m.index===n.activeIndex)return n.mode==='charge'&&Math.floor(time*10)%5===0?2:1;
 return 0;
}
function crt(c,a,m,n,time){
 const frame=monitorFrame(m,n,time);
 atlas(c,a.infoshumCRT,frame,crtFrame,crtHeight,m.x-21,m.y-26,m.w+42,m.h+68);
 if(frame===3){point(c,m.x+m.w/2,m.y+m.h/2,48,time,magenta);}
 if(frame===4){point(c,m.x+m.w/2,m.y+m.h/2,72,time,magenta);}
 if(m.state==='open'){c.save();c.strokeStyle='#ff74d5';c.lineWidth=3;c.globalAlpha=.5+.5*Math.abs(Math.sin(time*8));c.strokeRect(m.x-16,m.y-14,m.w+32,m.h+34);c.restore();}
}
function terminal(c,a,m,n,time){
 if(n.stage!=='network')return;
 const frame=m.state==='broken'?3:m.state==='open'?1:0;
 const x=m.terminalX-40,y=m.terminalY-9;
 atlas(c,a.infoshumTerminal,frame,terminalFrame,terminalHeight,x,y,80,60);
 if(m.state==='open'){point(c,m.terminalX,m.terminalY+19,29,time,magenta);}
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
 c.save();c.globalAlpha=.85;atlas(c,a.infoshumBody,2,bodyFrame,bodyHeight,x-66,y-58,132,117);c.restore();
}
function screenExit(c,a,g,time){
 const b=g.boss,n=b.network,near=n.monitors.find(m=>m.state!=='broken');
 if(!near)return;
 const x=near.x+near.w/2,y=near.y+near.h/2;
 c.save();c.globalAlpha=.2+n.transitionProgress*.8;
 const scale=.5+n.transitionProgress*.75;
 atlas(c,a.infoshumBody,5,bodyFrame,bodyHeight,x-170*scale,y-148*scale,340*scale,296*scale);
 c.restore();
 for(let i=0;i<33;i++){const a=i*2.4+time*3,r=(15+(i%12)*7)*n.transitionProgress;
  rect(c,x+Math.cos(a)*r,y+Math.sin(a)*r,3+i%3*3,3+i%4,i%2?'#ff55ed':'#4ae6fb');}
}
function tendril(c,b,n,time){
 if(!n.target||!['slamWarning','slam','weak'].includes(n.mode))return;
 const x=n.target.x,y=n.target.y-26,headX=b.x+b.w/2,headY=b.y+b.h*.5;
 if(n.mode==='slamWarning'){
  c.save();c.strokeStyle='#fd76d4';c.lineWidth=3;c.setLineDash([7,5]);c.strokeRect(x-30,y-5,60,30);c.restore();
  point(c,x,y,25,time,magenta);return;
 }
 const strength=n.mode==='weak'?1:Math.min(1,1-n.timer/.34);
 const ex=headX+(x-headX)*strength,ey=headY+(y-headY)*strength;
 const path=()=>{c.beginPath();c.moveTo(headX,headY);c.bezierCurveTo(headX+44,headY-65,ex-65,ey+48,ex,ey);};
 c.save();c.lineCap='round';path();c.strokeStyle='#020b28';c.lineWidth=21;c.stroke();
 path();c.strokeStyle='#0c689e';c.lineWidth=14;c.stroke();
 path();c.strokeStyle='#29bff0';c.lineWidth=6;c.stroke();
 path();c.strokeStyle='#c3faff';c.lineWidth=2;c.setLineDash([9,14]);c.lineDashOffset=-time*23;c.stroke();c.restore();
 if(n.mode==='weak'){
  c.save();c.translate(x,y);c.strokeStyle='#e177fa';c.lineWidth=5;c.beginPath();c.arc(0,0,28,0,Math.PI*2);c.stroke();c.fillStyle='#f748c7';c.fillRect(-13,-13,26,26);c.fillStyle='#ffe6ff';c.fillRect(-7,-7,14,14);c.restore();
  point(c,x,y,38,time,magenta);
 }
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
 const w=Math.round(p.w);
 for(let i=0;i<w;i+=64){const slice=Math.min(64,w-i);c.drawImage(a.infoshumPlatform,0,0,slice,42,Math.round(p.x+i),Math.round(p.y-3),slice,42);}
 // Physical platforms integrate with the luminous metal tile rather than the game's old rectangle style.
 rect(c,p.x,p.y-5,p.w,2,'#f2caff');
 rect(c,p.x,p.y-2,p.w,2,'#74e4ff');
 rect(c,p.x+2,p.y+12,p.w-4,2,'#13132f');
 for(let i=0;i<p.w-12;i+=43)rect(c,p.x+7+i,p.y+3,4,2,'#c9eafd');
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n||b.hp<=0)return;
 if(n.stage==='network'){
  for(const m of n.monitors)crt(c,a,m,n,time);
  for(const m of n.monitors)terminal(c,a,m,n,time);
  transfer(c,a,n,time);
  if(n.mode==='charge'&&n.target){
   const t=n.target;colorWarning(c,t,time,n.attackKind);
  }
  if(n.mode==='transferWarning'){
   const t=n.monitors[n.toIndex];if(t)point(c,t.x+t.w/2,t.y+t.h/2,48,time,cyan);
  }
  return;
 }
 if(n.stage==='rupture'){
  for(const m of n.monitors)crt(c,a,m,n,time);
  screenExit(c,a,g,time);return;
 }
 // The last screen tears open. Free form is a dedicated six-pose sprite atlas, not a
 // reused projection of the old CRT sprite.
 for(const m of n.monitors)crt(c,a,m,n,time);
 const frame=b.hurtTime>0?5:n.mode==='weak'?4:n.mode==='slam'?3:n.mode==='slamWarning'?2:n.mode==='waveWarning'?2:Math.floor(time*2)%2;
 const wobble=Math.sin(time*2.7)*8,spread=n.mode==='slam'?1.1:1;
 const w=350*spread,h=302*spread;
 atlas(c,a.infoshumBody,frame,bodyFrame,bodyHeight,b.x+b.w/2-w/2,b.y-94+wobble,w,h);
 tendril(c,b,n,time);
 if(n.mode==='waveWarning'&&n.target)colorWarning(c,n.target,time,'wave');
}
function colorWarning(c,t,time,kind){
 const w=kind==='wave'?86:66;
 c.save();c.globalAlpha=.55+.4*Math.abs(Math.sin(time*9));
 rect(c,t.x-w/2,t.y-8,w,3,kind==='wave'?cyan:magenta);
 for(let i=0;i<4;i++)rect(c,t.x-w/2+i*16,t.y-15,10,3,kind==='wave'?'#aafaff':'#ffc3fa');
 c.restore();
}
