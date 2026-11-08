import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {drawCableBlob,drawBreakout,drawSmokingCase} from './infoshum-anim-art.js?v=0.21.5';
import {monitorRect,glassRect,corePoint,headlineBoxes,figureBox,SPLIT,ARRIVE} from './infoshum-combat.js?v=0.21.5';
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
// Cable path between neighbouring monitors (bottom to bottom), used by the lit cable and the pulses.
function cablePoint(a,b,t){const x1=a.x+a.w/2,y1=a.y+a.h-8,x2=b.x+b.w/2,y2=b.y+b.h-8,q=1-t;return {x:q*q*q*x1+3*q*q*t*(x1+95)+3*q*t*t*(x2-95)+t*t*t*x2,y:q*q*q*y1+3*q*q*t*(y1+118)+3*q*t*t*(y2+118)+t*t*t*y2};}
// A move 0↔2 runs through the middle monitor: two cable spans.
function pathPoint(n,from,to,t){const ms=n.monitors;if(Math.abs(from-to)===1)return cablePoint(ms[from],ms[to],t);const mid=ms[1];return t<.5?cablePoint(ms[from],mid,t*2):cablePoint(mid,ms[to],t*2-1);}
function cables(c,n,time){
 const ms=n.monitors,moving=[n.transit,...(n.stage==='network'&&n.mode==='shuffle'?n.decoys:[])].filter(m=>m&&!m.done);
 const lit=(i,j)=>n.stage==='network'&&moving.some(m=>m.from===i||m.to===i||m.from===j||m.to===j);
 thickCable(c,ms[0],ms[1],lit(0,0),time);thickCable(c,ms[1],ms[2],lit(2,2),time);
}
const SCREEN_W=183,SCREEN_H=176;
function screen(c,a,m,frame,alpha=1){const img=a.infoshumScreens;if(!img)return false;const r=monitorRect(m);c.save();c.globalAlpha*=alpha;c.drawImage(img,frame*SCREEN_W,0,SCREEN_W,SCREEN_H,Math.round(r.x),Math.round(r.y),Math.round(r.w),Math.round(r.h));c.restore();return true;}
function cracks(c,m,count){if(!count)return;const g=glassRect(m);c.save();c.strokeStyle='#bff8ff';c.globalAlpha=.75;c.lineWidth=2;for(let k=0;k<count;k++){const sx=g.x+g.w*(.25+.25*k),sy=g.y+g.h*(.3+.2*(k%2));c.beginPath();for(let i=0;i<5;i++){const ang=i*1.26+k;c.moveTo(sx,sy);c.lineTo(sx+Math.cos(ang)*28,sy+Math.sin(ang)*22);}c.stroke();}c.restore();}
function monitorFrame(m,n,time){
 if(m.burst>0)return 5;
 if(n.mode==='hit'&&m.index===n.lastMonitorIndex)return 4;
 if(m.face!==null&&m.face!==undefined)return m.face;
 if(m.pulse)return m.pulse.kind==='real'?6:7;
 return 8;
}
function pulse(c,a,n,move,time,decoy){
 const t=Math.min(1,move.time/move.duration),p=pathPoint(n,move.from,move.to,t),q=pathPoint(n,move.from,move.to,Math.min(1,t+.03)),angle=Math.atan2(q.y-p.y,q.x-p.x||1e-6);
 for(let i=12;i>=1;i--){const r=Math.max(0,t-i/60),o=pathPoint(n,move.from,move.to,r);rect(c,o.x-2,o.y-2,4+i%3,3,decoy?(i%2?'#ff5ad8':'#8a2f86'):(i%2?'#3ecaff':'#b8f6ff'));}
 c.save();if(decoy){c.globalAlpha=.45+.35*Math.abs(Math.sin(time*18));c.filter='hue-rotate(70deg) saturate(1.5)';}
 drawCableBlob(c,a,p.x,p.y,angle,time);c.restore();
}
function drawShells(c,a,g,time){
 const n=g.boss.network;
 for(const m of n.monitors){
  const frame=monitorFrame(m,n,time);if(!screen(c,a,m,frame))drawInfoshumSprite(c,a,'crt',0,m.x,m.y-35,m.w,m.w*271/319);
  if(frame>=6||frame===8)cracks(c,m,m.cracks);
  if(n.mode==='reveal'&&m.face===0&&n.hintTime>0){const r=glassRect(m);c.save();c.globalAlpha=Math.min(1,n.hintTime)*(.55+.35*Math.sin(time*10));c.strokeStyle='#7ff4ff';c.lineWidth=4;c.strokeRect(r.x-6,r.y-6,r.w+12,r.h+12);c.restore();}
  if(frame===8){c.save();c.globalAlpha=.14;rect(c,m.x+20,m.y+20+(time*24+m.index*25)%(m.h-35),m.w-40,2,'#94f5ff');c.restore();}
 }
 if(n.mode==='shuffle'){if(n.transit)pulse(c,a,n,n.transit,time,false);for(const d of n.decoys)if(!d.done)pulse(c,a,n,d,time,true);}
 drawCableMap(c,g,time);
 if(n.mode==='reveal'){const left=n.timer;c.save();c.globalAlpha=.8;for(const m of n.monitors){if(m.face===null)continue;const r=glassRect(m),k=Math.max(0,left/5.4);rect(c,r.x,r.y+r.h+10,r.w*k,3,'#ff9bea');}c.restore();}
}
// A small cable map at the top of the view: all three screens and every pulse stay readable
// even when two monitors are off-screen.
function drawCableMap(c,g,time){
 const n=g.boss.network,x0=g.camera+22,y=12,xs=[0,46,92].map(v=>x0+v),ys=[y+6,y,y+6];
 c.save();c.globalAlpha=.88;rect(c,x0-8,y-6,132,34,"#0b0f26");rect(c,x0-8,y-6,132,2,"#5f3f96");
 for(const [i,j] of[[0,1],[1,2]])for(let k=0;k<=10;k++){const t=k/10;rect(c,xs[i]+12+(xs[j]-xs[i])*t,ys[i]+18+(ys[j]-ys[i])*t+Math.sin(t*Math.PI)*5,2,2,'#4a3f78');}
 for(const m of n.monitors){const i=m.index,lit=m.pulse?.kind==='real'?'#7ff4ff':m.pulse?.kind==='decoy'?'#ff6cda':m.face!==null?'#ffe08a':'#3a3d6a';rect(c,xs[i],ys[i],24,18,'#7a5bc4');rect(c,xs[i]+3,ys[i]+3,18,12,lit);for(let k=0;k<m.cracks;k++)rect(c,xs[i]+5+k*6,ys[i]+7,4,2,'#ffffff');}
 const dot=(move,decoy)=>{const t=Math.min(1,move.time/move.duration),seg=Math.abs(move.from-move.to)===1?null:t<.5?[move.from,1,t*2]:[1,move.to,t*2-1],[a,b,q]=seg||[move.from,move.to,t];const px=xs[a]+12+(xs[b]-xs[a])*q,py=ys[a]+18+(ys[b]-ys[a])*q+Math.sin(q*Math.PI)*5;
  if(decoy){rect(c,px-3,py-3,6,2,'#ff6cda');rect(c,px-3,py+1,6,2,'#ff6cda');rect(c,px-3,py-3,2,6,'#ff6cda');rect(c,px+1,py-3,2,6,'#ff6cda');}else{rect(c,px-3,py-3,6,6,'#b8f6ff');rect(c,px-1,py-1,2,2,'#ffffff');}};
 if(n.mode==='shuffle'){for(const d of n.decoys)if(!d.done)dot(d,true);if(n.transit)dot(n.transit,false);}
 c.restore();
}
// The screen Infoshum tears open: the one with the third crack.
const ruptureMonitor=n=>n.monitors[n.lastMonitorIndex]||n.monitors[1];
function screenExit(c,a,g,time){
 const n=g.boss.network,near=ruptureMonitor(n);if(!near)return;
 if(drawBreakout(c,a,near,n.transitionProgress,time))return;
}
// ——— Phase 2: core, headline ring and the cable staircase ———
let g_boss=null;const CABLE_W=184,CABLE_H=180,CORE_W=184,CORE_H=192,POSE_W=190,POSE_H=204,SILENCE_W=172,SILENCE_H=192;
function cell(c,img,cw,ch,frame,cx,cy,w,{flip=false,rot=0,alpha=1}={}){if(!img)return;const h=w*ch/cw;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-w/2,-h/2,w,h);c.restore();}
// The cable is tiled from the 30° segment (frame 1: axis (0,135)→(184,46), ribbed top 24 px above the axis),
// so its thickness stays the same however far the slam reaches. The steps lie on the ribbed top.
const SEG={cx:92,cy:90.5,angle:Math.atan2(46-135,184),len:204,top:24},CABLE_SCALE=.6;
function drawCable(c,a,n,frame,time){
 const cab=n.cable,img=a.infoshumCable;if(!cab||!img)return;const dx=(cab.to.x-cab.from.x)*cab.dir,dy=cab.to.y-cab.from.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),k=CABLE_SCALE,piece=SEG.len*k*.86;
 c.save();c.translate(cab.from.x,cab.from.y);if(cab.dir<0)c.scale(-1,1);c.rotate(angle);
 for(let d=-piece*.3;d<len+piece*.2;d+=piece){c.save();c.translate(d+piece/2,SEG.top*k);c.rotate(-SEG.angle);c.drawImage(img,CABLE_W,0,CABLE_W,CABLE_H,-SEG.cx*k,-SEG.cy*k,CABLE_W*k,CABLE_H*k);c.restore();}
 if(frame===5){c.globalAlpha=.6+.4*Math.abs(Math.sin(time*20));c.strokeStyle='#ff6cf0';c.lineWidth=2;c.beginPath();for(let d=0;d<=len;d+=14)c.lineTo(d,SEG.top*k+Math.sin(d*.31+time*30)*8);c.stroke();}
 c.restore();
 // The end that bites into the platform.
 cell(c,img,CABLE_W,CABLE_H,2,cab.from.x+cab.dir*6,cab.from.y-30,70,{flip:cab.dir<0,alpha:.95});
}
function drawWhip(c,a,n){const t=n.target;if(!t||!a.infoshumCable)return;const cp=corePoint(g_boss);cell(c,a.infoshumCable,CABLE_W,CABLE_H,6,(t.x+cp.x)/2,(t.y+cp.y)/2,150,{flip:cp.x<t.x,alpha:Math.max(0,n.timer/.35)});}
function drawRing(c,a,n,b,time){const img=a.infoshumCore;if(!img)return;for(const h of headlineBoxes(n,b))cell(c,img,CORE_W,CORE_H,4+(h.i+Math.floor(n.ring/6.283))%4,h.x+20,h.y+15,58,{rot:Math.sin(time*3+h.i)*.15});}
function drawFree(c,a,g,time){
 const b=g.boss,n=b.network,cp=corePoint(b),wob=Math.sin(time*2.7)*6;
 if(n.mode==='aim'&&n.target){cell(c,a.infoshumCable,CABLE_W,CABLE_H,7,n.target.x,n.target.y-14,96,{alpha:.6+.4*Math.abs(Math.sin(time*9))});}
 g_boss=b;if(n.cable)drawCable(c,a,n,n.mode==='retractWarn'?5:4,time);else if(n.mode==='retract')drawWhip(c,a,n);
 const exposed=['anchored','retractWarn','reel'].includes(n.mode);
 if(exposed&&a.infoshumCore){const frame=b.hurtTime>0?2:n.mode==='reel'?3:n.mode==='retractWarn'&&Math.floor(time*8)%2?1:0;cell(c,a.infoshumCore,CORE_W,CORE_H,frame,cp.x,cp.y-26+wob,300);}
 else if(a.infoshumPoses&&['aim','slam','retract'].includes(n.mode)){const frame=n.mode==='aim'?0:n.mode==='slam'?1:2;cell(c,a.infoshumPoses,POSE_W,POSE_H,frame,cp.x,cp.y-30+wob,320,{flip:n.target&&n.target.x<cp.x});}
 else{const frame=b.hurtTime>0?5:n.mode==='volley'?3:n.mode==='arrive'?1:0;
  // Leaving the monitor: a glitch trail of fading copies follows him to the middle.
  if(n.mode==='arrive'&&n.arriveFrom){for(let i=4;i>=1;i--){const k=i/5,x=b.x+(n.arriveFrom.x-b.x)*k*.5,y=b.y+(n.arriveFrom.y-b.y)*k*.5;c.save();c.globalAlpha=.16*(5-i)/4;c.filter=i%2?'hue-rotate(60deg)':'none';drawInfoshumSprite(c,a,'body',1,x+b.w/2-175+(i%2?-6:6),y-74,350,302);c.restore();}
   // He dissolves into glitch at the monitor and reassembles on the way.
   const k=Math.min(1,Math.max(0,1-(n.timer??0)/ARRIVE));drawAttackFx(c,a,'glitch',Math.min(3,Math.floor(k*8)),n.arriveFrom.x+b.w/2,n.arriveFrom.y+b.h/2,170,{alpha:Math.max(0,1-k*1.4)});drawAttackFx(c,a,'glitch',k<.7?3:k<.85?4:5,b.x+b.w/2,b.y+b.h/2,200,{alpha:.75});}
  drawInfoshumSprite(c,a,'body',frame,b.x+b.w/2-175,b.y-74+(n.mode==='arrive'?0:wob),350,302);}
}
// ——— Phase 3: the doubles ———
function drawNoise(c,a,g,time){
 const n=g.boss.network,img=a.infoshumPoses;
 // The split: the core bursts in a ring of white noise and the doubles fly out of it.
 if(n.mode==='split'&&n.splitFrom){const f=n.figures[0],k=Math.min(1,(f?.time||0)/.9);drawAttackFx(c,a,'burst',Math.min(3,Math.floor(k*4)),n.splitFrom.x,n.splitFrom.y,220+k*160,{alpha:k>.75?(1-k)/.25:1});}
 for(const f of n.figures){
  // Before a dive: a trail of glitch ghosts points at the landing, where a noise ripple already stirs.
  if(f.state==='warn'){for(let i=1;i<=3;i++){const q=i/4;drawAttackFx(c,a,'glitch',3,f.x+(f.tx-f.x)*q,f.y+(f.ty-20-f.y)*q,60,{alpha:(.45-.1*i)*(.7+.3*Math.sin(time*14+i))});}colorWarning(c,a,{x:f.tx,y:f.ty},time,'wave');}
  const flicker=f.real?1:.62+.25*Math.sin(time*23+f.id);
  if(f.state==='split')cell(c,img,POSE_W,POSE_H,5,f.x,f.y,330);
  else if(f.state==='dive'){const ang=Math.atan2(f.ty-f.y,f.tx-f.x),flip=f.tx<f.x;cell(c,img,POSE_W,POSE_H,3,f.x,f.y,300,{flip,rot:flip?ang-Math.PI+.6:ang-.6,alpha:flicker});}
  else if(f.state==='stuck')cell(c,img,POSE_W,POSE_H,4,f.x,f.ty-40,280);
  else if(f.state==='burst')cell(c,img,POSE_W,POSE_H,7,f.x,f.y,300,{alpha:Math.max(0,1-f.time/.45)});
  else if(f.real){const bob=Math.sin(time*2.7)*6;drawInfoshumSprite(c,a,'body',f.state==='warn'?1:0,f.x-150,f.y-130+bob,300,260);}
  else cell(c,img,POSE_W,POSE_H,6,f.x,f.y,300,{alpha:flicker});
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
 if(!a.infoshumPlatform?.complete||p.infoshumStep)return;
 const image=a.infoshumPlatform,scale=30/177,cap=Math.min(140*scale,p.w/3),y=p.y-3;
 c.drawImage(image,22,299,140,177,p.x,y,cap,30);
 for(let x=cap;x<p.w-cap;x+=300*scale){const w=Math.min(300*scale,p.w-cap-x);c.drawImage(image,430,299,w/scale,177,p.x+x,y,w,30);}
 c.drawImage(image,2011,299,140,177,p.x+p.w-cap,y,cap,30);
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(b.hp<=0){if(n.stage!=='network')for(const m of n.monitors)drawInfoshumSprite(c,a,'crt',5,m.x+m.w/2-55,380,110,94);return;}
 if(n.stage==='network'){drawShells(c,a,g,time);return;}
 if(n.stage==='rupture'){
  const torn=ruptureMonitor(n),k=n.transitionProgress;
  for(const m of n.monitors)if(m!==torn||!a.infoshumBreakout)screen(c,a,m,k<.3?8:k<.5?9:k<.7?10:11);
  screenExit(c,a,g,time);return;
 }
 for(const m of n.monitors)if(!(m===ruptureMonitor(n)&&drawSmokingCase(c,a,m)))drawInfoshumSprite(c,a,'crt',5,m.x+m.w/2-55,380,110,94);
 if(n.stage==='free')drawFree(c,a,g,time);else drawNoise(c,a,g,time);
}
// «Тишина»: he shrinks into a line and a dot like an old TV switching off (boss-defeat-art.js).
export function drawInfoshumDefeat(c,a,d){
 const img=a.infoshumSilence;if(!img)return false;const t=d.time,cx=d.x+d.w/2,cy=d.y+d.h/2,frame=t<.45?0:t<.85?1:t<1.25?2:3,alpha=frame===3?Math.max(0,1-(t-1.25)/.45):1;
 if(frame===0){const sh=Math.sin(t*80)*3;cell(c,img,SILENCE_W,SILENCE_H,0,cx+sh,cy,300);}else cell(c,img,SILENCE_W,SILENCE_H,frame,cx,cy,frame===1?320:200,{alpha});
 if(frame>=1&&frame<3){c.save();c.globalAlpha=.25*(1-(t-.45)/.8);c.fillStyle='#ffffff';c.fillRect(cx-800,0,1600,480);c.restore();}
 return true;
}
function colorWarning(c,a,t,time,kind){
 // A target marker drawn from the attack itself: a faint splash ring for rain, a stirring noise ripple for a wave.
 const pulse=.45+.4*Math.abs(Math.sin(time*9));
 if(kind==='rain'){drawAttackFx(c,a,'splash',2,t.x,t.y,120,{alpha:pulse});return;}
 drawAttackFx(c,a,'wave',0,t.x,t.y,kind==='beam'?190:96,{alpha:pulse*.8});
}

