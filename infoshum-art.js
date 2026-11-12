import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {WAVE,COL,FREE,FLOOR,TOWER,RELAYS,RELAY_H,ROUND_PAIRS,towerScreen,relayRect,headBox,beamFloor,ghostPos,ghostPrep} from './infoshum-combat.js?v=0.21.5';
import {INFOSHUM_ATLAS as AT} from './infoshum-atlas.js?v=0.21.5';
// Infoshum's three phases: the broadcast tower with Yuri in the relays, the colossus, the free creature in the storm.
import {rooms,WIDTH} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
const VW=g=>g.viewWidth||WIDTH;
const POSE_W=190,POSE_H=204,SILENCE_W=172,SILENCE_H=192;
function cell(c,img,cw,ch,frame,cx,cy,w,{flip=false,rot=0,alpha=1}={}){if(!img)return;const h=w*ch/cw;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-w/2,-h/2,w,h);c.restore();}
// One atlas piece into a rectangle (optionally mirrored).
function piece(c,img,p,x,y,w,h,{flip=false,alpha=1}={}){if(!img||!p)return;const [sx,sy,sw,sh]=p.r;c.save();c.globalAlpha*=alpha;if(flip){c.translate(Math.round(x+w),Math.round(y));c.scale(-1,1);c.drawImage(img,sx,sy,sw,sh,0,0,Math.round(w),Math.round(h));}else c.drawImage(img,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();}
// A piece anchored by its bottom centre.
function stand(c,img,p,cx,base,w,opts){if(!p)return null;const h=w*p.r[3]/p.r[2];piece(c,img,p,cx-w/2,base-h,w,h,opts);return {x:cx-w/2,y:base-h,w,h};}
// assets/infoshum-emotions.png: eight menacing faces painted as screen contents (grin, laugh, roar, sneer, glare,
// scream, tongue, glitch). They are laid over a monitor's glass, clipped to its rounded corners.
function drawEmotion(c,a,name,box,alpha,time){const p=AT.emo?.[name],img=a.infoshumEmotions;if(!p||!img||alpha<=0)return;
 const j=name==='glitch'||name==='scream'?Math.round(Math.sin(time*47)*2):0,r=Math.min(box.w,box.h)*.12;
 c.save();c.globalAlpha*=alpha;c.beginPath();c.roundRect?c.roundRect(box.x,box.y,box.w,box.h,r):c.rect(box.x,box.y,box.w,box.h);c.clip();
 c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(box.x-box.w*.04+j),Math.round(box.y-box.h*.04),Math.round(box.w*1.08),Math.round(box.h*1.08));
 if(name==='glitch'&&Math.floor(time*12)%3===0){c.globalAlpha*=.5;c.fillStyle='#ff4fd8';c.fillRect(box.x,box.y+box.h*((time*3)%1),box.w,3);}
 c.restore();}
const inset=(b,ix,iy)=>({x:b.x+b.w*ix,y:b.y+b.h*iy,w:b.w*(1-2*ix),h:b.h*(1-2*iy)});
const emoAlpha=e=>e?Math.min(1,(e.max-e.t)/.12,e.t/.12):0;
function crackLines(c,box,n){c.save();c.strokeStyle='rgba(150,240,255,.85)';c.lineWidth=1.5;c.beginPath();
 const L=[[.05,.9,.95,.35],[.6,.05,.35,.6],[.2,.15,.75,.95]];for(let i=0;i<Math.min(n,3);i++){const q=L[i];c.moveTo(box.x+q[0]*box.w,box.y+q[1]*box.h);c.lineTo(box.x+(q[0]+q[2])/2*box.w+6,box.y+(q[1]+q[3])/2*box.h-4);c.lineTo(box.x+q[2]*box.w,box.y+q[3]*box.h);}c.stroke();c.restore();}
const flash=(c,g,alpha,color='#f5d6ff')=>{if(alpha<=0)return;c.save();c.globalAlpha=Math.min(.6,alpha);rect(c,g.camera,0,VW(g),512,color);c.restore();};
function drawLineWarning(c,a,x,y,w,time){
 const img=a.infoshumFx1,p=AT.fx1['warn'+Math.floor(time*10)%4];c.save();c.globalAlpha=.55+.35*Math.abs(Math.sin(time*10));
 if(img&&p){const th=Math.max(4,p.r[3]*1.2),tw=p.r[2]*1.2;for(let xx=x;xx<x+w;xx+=tw-2)c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(xx),Math.round(y-th/2),Math.round(Math.min(tw,x+w-xx)),Math.round(th));}
 else for(let xx=x;xx<x+w;xx+=18)rect(c,xx,y-1,10,2,'#ff7ae6');c.restore();
}
// The big beams (the colossus head): infoshum-giant-beam.png, tiled along the line.
function drawGiantBeam(c,a,x,y,w,half,time){
 // One stretched piece (tiles left seams); two frames blend so the beam shimmers instead of flickering.
 const img=a.infoshumGiantBeam;if(!img)return;const t=time*10,f=Math.floor(t)%3,k=t-Math.floor(t),th=half*2.6*(1+Math.sin(time*18)*.06);
 c.save();for(const [i,al] of [[f,1-k],[(f+1)%3,k]]){const p=AT.giantBeam['b'+i];c.globalAlpha=al;c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],x,y-th/2,w,th);}c.restore();
}
function drawRay(c,a,x0,y0,x1,y1,half,time,warn){const len=Math.hypot(x1-x0,y1-y0);c.save();c.translate(x0,y0);c.rotate(Math.atan2(y1-y0,x1-x0));if(warn)drawLineWarning(c,a,0,0,len,time);else drawGiantBeam(c,a,0,0,len,half,time);c.restore();}
function amberFrame(c,r,time,pad=0){c.save();c.strokeStyle='#ffc45e';c.shadowColor='#ffb347';c.shadowBlur=16;c.lineWidth=3;c.globalAlpha=.65+.3*Math.sin(time*8);c.strokeRect(r.x-pad,r.y-pad,r.w+pad*2,r.h+pad*2);c.restore();}
// ——— Phase 1: the broadcast tower ———
// assets/infoshum-tower.png: the huge square monitor on its pedestal — dark, static, face, charging, roaring, two shield
// frames, Yuri bursting in, half Yuri / half Infoshum, three crack levels. assets/infoshum-relays.png: a relay tower
// (idle, Yuri points, junction box open, hit, exploded, rebooting) and cable pieces (three pulse frames, two snapped ends).
// assets/infoshum-fx1.png: the scanning beam, a warning line, the cable whip, a thrown TV and its puddle of noise.
const TOWER_K=TOWER.w/AT.mon.face.r[2],EMO_BOX=[0,0,0,0];
// Every state of the tower was painted at its own size; k = [scale, dx, dy] registers each frame onto «face». For the
// states that differ only on the glass, the casing is always the «face» casing and only the screen picture is taken
// from the state's frame, so the monitor cannot change size or shape when Yuri or a new face appears.
const SCREEN_ONLY=new Set(['face','yuri','half','dark','static','charge','roar','crack1','crack2']),GLASS=[50,32,111,90];
function drawTowerAt(c,a,face,cx,base,k=1,time=0,{alpha=1,shake=0}={}){const p=AT.mon[face]||AT.mon.face,f=AT.mon.face,u=TOWER_K*k,[s,dx,dy]=p.k||[1,0,0],ox=cx+shake-f.r[2]*u/2,oy=base-f.r[3]*u;
 if(!SCREEN_ONLY.has(face)){const x=ox-dx*u,y=oy-dy*u,w=p.r[2]*s*u,h=p.r[3]*s*u;piece(c,a.infoshumTower,p,x,y,w,h,{alpha});return {x,y,w,h};}
 piece(c,a.infoshumTower,f,ox,oy,f.r[2]*u,f.r[3]*u,{alpha});if(face==='face')return {x:ox,y:oy,w:f.r[2]*u,h:f.r[3]*u};
 const [gx,gy,gw,gh]=GLASS,sx=p.r[0]+(gx+dx)/s,sy=p.r[1]+(gy+dy)/s,img=a.infoshumTower;if(img){c.save();c.globalAlpha*=alpha;c.beginPath();c.roundRect?c.roundRect(ox+gx*u,oy+gy*u,gw*u,gh*u,9*u):c.rect(ox+gx*u,oy+gy*u,gw*u,gh*u);c.clip();c.drawImage(img,sx,sy,gw/s,gh/s,Math.round(ox+gx*u),Math.round(oy+gy*u),Math.round(gw*u),Math.round(gh*u));c.restore();}
 return {x:ox,y:oy,w:f.r[2]*u,h:f.r[3]*u};}
const RELAY_FRAME={live:'r0',yuri:'r1',open:'r2',hit:'r3',dead:'r4',reboot:'r5'};
function cablePath(g,i,k=1){const r=relayRect(g,i),R=RELAYS[i],tx=rooms[g.room].x+TOWER.cx,side=R.cx<TOWER.cx?-1:1,ty=TOWER.base-TOWER.h*.62;
 const x0=tx+side*TOWER.w*.46,y0=ty,x1=r.x+r.w/2-side*r.w*.38,y1=r.y+r.h*.32;return t=>{t*=k;const mx=(x0+x1)/2,my=Math.max(y0,y1)+60;const u=1-t;return {x:u*u*x0+2*u*t*mx+t*t*x1,y:u*u*y0+2*u*t*my+t*t*y1};};}
function drawCable(c,a,g,i,time,dead){
 const img=a.infoshumRelays;if(!img)return;const len=dead?.45:1,path=cablePath(g,i,len),seg=8,pulse=AT.relay['c'+Math.floor(time*8+i)%3];
 for(let s=0;s<seg;s++){const p0=path(s/seg),p1=path((s+1)/seg),l=Math.hypot(p1.x-p0.x,p1.y-p0.y);c.save();c.translate(p0.x,p0.y);c.rotate(Math.atan2(p1.y-p0.y,p1.x-p0.x));c.drawImage(img,pulse.r[0],pulse.r[1],pulse.r[2],pulse.r[3],-2,-11,l+4,22);c.restore();}
 if(dead){const e=path(1),b=path(.92),end=AT.relay['c'+(3+Math.floor(time*12)%2)];c.save();c.translate(e.x,e.y);c.rotate(Math.atan2(e.y-b.y,e.x-b.x));c.drawImage(img,end.r[0],end.r[1],end.r[2],end.r[3],-24,-14,58,28);c.restore();}
}
function drawRelay(c,a,g,i,state,time){const r=relayRect(g,i),p=AT.relay[RELAY_FRAME[state]||'r0'],shake=state==='hit'?Math.sin(time*80)*2:0;stand(c,a.infoshumRelays,p,r.x+r.w/2+shake,RELAYS[i].base+2,r.w*p.r[2]/AT.relay.r0.r[2]);}
function drawShield(c,g,time){const cx=rooms[g.room].x+TOWER.cx,cy=TOWER.base-TOWER.h*.62,rx=TOWER.w*.66,ry=TOWER.h*.58;
 c.save();const gr=c.createRadialGradient(cx,cy,rx*.3,cx,cy,rx);gr.addColorStop(0,'rgba(170,60,255,0)');gr.addColorStop(.75,'rgba(170,60,255,.16)');gr.addColorStop(1,'rgba(230,140,255,.5)');c.fillStyle=gr;c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#e9a6ff';c.lineWidth=2;c.shadowColor='#c155ff';c.shadowBlur=10;c.globalAlpha=.75;
 for(let k=0;k<4;k++){const a0=time*.9+k*1.6,seg=7;c.beginPath();for(let s=0;s<=seg;s++){const ang=a0+s*.12,j=Math.sin(time*31+s*7+k)*6;c[s?'lineTo':'moveTo'](cx+Math.cos(ang)*(rx+j),cy+Math.sin(ang)*(ry+j));}c.stroke();}c.restore();}
function drawHallBack(c,a,g,time){
 const r=rooms[g.room],n=g.boss.network,bg=a.infoshumHall;if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,r.x,0,r.width,512);else rect(c,r.x,0,r.width,512,'#120a2a');
 const pair=ROUND_PAIRS[n.round]||[];
 n.relays.forEach((q,i)=>drawCable(c,a,g,i,time,q.state==='dead'||q.state==='hit'));
 n.relays.forEach((q,i)=>drawRelay(c,a,g,i,q.state,time));
 const shake=n.face==='roar'?Math.sin(time*50)*2:n.face==='charge'?Math.sin(time*70)*1.2:0,fade=n.faceFade||(n.faceFade={face:n.face,prev:null,at:-9});
 if(fade.face!==n.face){fade.prev=fade.face;fade.face=n.face;fade.at=time;}const fk=Math.min(1,Math.max(0,(time-fade.at)/.12));
 if(fade.prev&&fk<1)drawTowerAt(c,a,fade.prev,r.x+TOWER.cx,TOWER.base,1,time,{alpha:1-fk});drawTowerAt(c,a,n.face,r.x+TOWER.cx,TOWER.base,1,time,{shake,alpha:fade.prev&&fk<1?Math.max(.4,fk):1});
 if(n.emo&&['face','crack1','crack2'].includes(n.face)&&n.take?.show!=='yuri'){const sc=towerScreen(g),box={x:sc.x+EMO_BOX[0],y:sc.y+EMO_BOX[1],w:sc.w+EMO_BOX[2],h:sc.h+EMO_BOX[3]};drawEmotion(c,a,n.emo.name,box,emoAlpha(n.emo),time);if(n.cracks)crackLines(c,box,n.cracks);}
 if(n.shield&&n.mode!=='opening')drawShield(c,g,time);
 if(n.take?.show==='yuri'){const sc=towerScreen(g);c.save();c.strokeStyle='#ffc45e';c.shadowColor='#ffb347';c.shadowBlur=14;c.lineWidth=2;c.globalAlpha=.55+.3*Math.sin(time*8);c.beginPath();c.roundRect?c.roundRect(sc.x+2,sc.y+2,sc.w-4,sc.h-4,10):c.rect(sc.x+2,sc.y+2,sc.w-4,sc.h-4);c.stroke();c.restore();}
}
// Televisions thrown from the tower's screen and the static puddles they leave.
function drawTvRain(c,a,n,time){
 const img=a.infoshumFx1,F=AT.fx1;if(!img)return;
 for(const q of n.puddles){const k=q.time/WAVE.puddle,p=F['pud'+Math.min(3,Math.floor(k*4))];stand(c,img,p,q.x,q.y+8,WAVE.puddleHalf*2.6);}
 for(const t of n.tvs){if(t.t<0)continue;if(t.state==='fly'){const k=t.t/WAVE.flight,x=t.fx+(t.tx-t.fx)*k,y=t.fy+(t.ty-t.fy)*k-Math.sin(k*Math.PI)*160,p=F['tv'+Math.floor(time*10)%2];piece(c,img,p,x-26,y-28,52,56);}
  else stand(c,img,F.tvhit,t.tx,t.ty+8,74);}
}
function drawHallFront(c,a,g,time){
 const n=g.boss.network,img=a.infoshumFx1,F=AT.fx1;
 for(const s of n.scans){const bottom=s.state==='go'?s.bottom:beamFloor(g,s.x);
  if(s.state==='warn'){c.save();c.globalAlpha=.25+.25*Math.abs(Math.sin(time*12));rect(c,s.x-WAVE.scanHalf,0,WAVE.scanHalf*2,bottom,'#ff5ae0');c.restore();const x0=Math.min(s.x,s.x+s.dir*WAVE.scanSpan),w=WAVE.scanSpan;drawLineWarning(c,a,x0,FLOOR-4,w,time);piece(c,img,F.scan0,s.x-24,0,48,64);}
  else{const p=F['scan'+(1+Math.floor(time*14)%2)];piece(c,img,p,s.x-38,0,76,bottom+12);}}
 for(const w of n.whips){const len=w.x1-w.x0;
  if(w.state==='warn'){drawLineWarning(c,a,w.x0,w.y-3,len,time);const k=1-Math.max(0,w.timer)/WAVE.whipWarn,p=F['whip'+Math.min(2,Math.floor(k*3))],x=w.from<0?w.x0-30:w.x1+30;stand(c,img,p,x,w.y+4,p.r[2]*1.2,{flip:w.from>0});}
  else{const k=Math.min(1,(WAVE.whipHit-w.timer)/(WAVE.whipHit+.35)),p=F['whip'+(3+Math.min(3,Math.floor(k*4)))];stand(c,img,p,w.x0+len/2,w.y+6,len+40,{flip:w.from>0});}}
 drawTvRain(c,a,n,time);
 // The open junction box: an amber glow so the cat sees where Yuri waits.
 n.relays.forEach((q,i)=>{if(q.state==='open'){const r=relayRect(g,i);amberFrame(c,{x:r.x+r.w*.55,y:r.y+r.h*.52,w:r.w*.36,h:r.h*.28},time,2);}});
}
// ——— Phase 2: the colossus, a cut-out rig (assets/infoshum-colossus-rig.png) ———
// Torso on its junk heap, the head monitor on the neck, and two arms of upper arm + forearm + fist (or open hand)
// on shoulder, elbow and wrist hubs. Every pose is computed from the fight state, so the giant moves in one piece:
// the arms are solved with two-bone IK towards the fist or palm, the left arm is mirrored for the right one.
const RIG=AT.rig,BASE=FLOOR+10,WRIST_UP=RIG.fist0.r[3]-RIG.fist0.w[1]-8,HAND_K=.8;
const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t,lerpP=(p,q,t)=>({x:lerp(p.x,q.x,t),y:lerp(p.y,q.y,t)});
const segLen=p=>Math.hypot(p.b[0]-p.a[0],p.b[1]-p.a[1]),segAng=p=>Math.atan2(p.b[1]-p.a[1],p.b[0]-p.a[0]);
const L1=segLen(RIG.upper),L2=segLen(RIG.fore);
// A rig piece drawn so its axis point `at` lands on (x, y), turned by `rot` and stretched along its own axis.
function rigPiece(c,img,p,at,x,y,rot,{stretch=1,axis=0,alpha=1,scale=1}={}){if(!p)return;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(y));c.rotate(rot+axis);if(stretch!==1)c.scale(stretch,1);c.rotate(-axis);if(scale!==1)c.scale(scale,scale);c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],-at[0],-at[1],p.r[2],p.r[3]);c.restore();}
// Two-bone IK: the elbow bends away from the body (towards smaller x in the left arm's space).
function solveArm(S,W){let d=Math.hypot(W.x-S.x,W.y-S.y);const k=Math.min(1.45,Math.max(1,d/(L1+L2))),l1=L1*k,l2=L2*k;d=Math.min(Math.max(d,Math.abs(l1-l2)+1),l1+l2-.01);
 const phi=Math.atan2(W.y-S.y,W.x-S.x),al=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d)))),e1={x:S.x+Math.cos(phi+al)*l1,y:S.y+Math.sin(phi+al)*l1},e2={x:S.x+Math.cos(phi-al)*l1,y:S.y+Math.sin(phi-al)*l1},E=e1.x<e2.x?e1:e2;
 const wr={x:E.x+(W.x-E.x)/Math.hypot(W.x-E.x,W.y-E.y)*l2,y:E.y+(W.y-E.y)/Math.hypot(W.x-E.x,W.y-E.y)*l2};return {S,E,W:wr,k};}
// The pose of the whole giant for this moment (positions in world pixels; the right arm in mirrored space).
// Render-only memory (smoothed wrists, the per-frame cache) lives beside the fight state, never inside it.
const RIG_MEMORY=new WeakMap(),rigMemory=a=>{let m=RIG_MEMORY.get(a);if(!m)RIG_MEMORY.set(a,m={});return m;};
function colossusRig(g,time,assembly=null){
 const n=g.boss.network,a=n.col||{},b=g.boss,m=rigMemory(a);if(!assembly&&m.cache?.time===time)return m.cache.rig;const rig=buildRig(g,n,a,b,time,assembly);if(!assembly)m.cache={time,rig};return rig;
}
function buildRig(g,n,a,b,time,assembly){
 const cx=rooms[g.room].x+TOWER.cx,R=RIG,mir=x=>2*cx-x;
 const breakout=n.stage==='breakout',fallK=breakout?1:a.mode==='collapse'?ease(a.clock/COL.fallTime):a.mode==='rise'?1-ease(a.clock/COL.rise):0;
 const shake=(b.hurtTime>0||a.hurt>.8?Math.sin(time*60)*3:0)+(a.fist?.state==='lock'?Math.sin(time*80)*1.5:0),bob=fallK?0:Math.round(Math.sin(time*2.2)*2);
 const rise=assembly?assembly.torso:0,tx=cx-R.torso.neck[0]+shake,ty=BASE-R.torso.gy[0]+bob+rise,dx=cx-R.down.neck[0]+shake,dy=BASE-R.down.gy[0];
 const sock=(key)=>lerpP({x:tx+R.torso[key][0],y:ty+R.torso[key][1]},{x:dx+R.down[key][0],y:dy+R.down[key][1]},fallK);
 const SL=sock('sL'),SRw=sock('sR'),SR={x:mir(SRw.x),y:SRw.y},neck={x:tx+R.torso.neck[0],y:ty+R.torso.neck[1]};
 // The head: on the neck, or falling in an arc onto the floor where its screen becomes the weak spot.
 const hb=headBox(g),sc=[(R.head.scr[0]+R.head.scr[2])/2,(R.head.scr[1]+R.head.scr[3])/2],up={x:neck.x,y:neck.y+8-R.head.neck[1]+sc[1]},down={x:hb.x+hb.w/2+shake,y:hb.y+hb.h/2};
 let head={x:lerp(up.x,down.x,fallK),y:lerp(up.y,down.y,fallK)-Math.sin(fallK*Math.PI)*60,rot:-Math.sin(fallK*Math.PI)*.35-fallK*.06,scale:1};
 if(assembly?.head){const t=assembly.head;head={x:lerp(t.x,head.x,t.k),y:lerp(t.y,head.y,t.k),rot:0,scale:lerp(t.scale,1,t.k)};}
 // Where each wrist rests: on the floor beside the heap; lying wide when he collapses.
 const restY=FLOOR+8-WRIST_UP,rest={x:cx-255,y:restY+bob},lie={x:cx-335,y:restY+6},calm=lerpP(rest,lie,fallK);
 const arm={L:{W:{...calm},tool:'fist'},R:{W:{...calm},tool:'fist'}};
 const roar=a.mode==='intro'||a.roar>0||a.mode==='rise'&&a.clock>COL.rise*.7;
 if(roar&&!fallK)for(const s of ['L','R'])arm[s].W={x:cx-250+Math.sin(time*9+(s==='L'?0:1))*6,y:150+Math.sin(time*7)*8};
 if(a.hurt>0&&!fallK){const s=a.hurtSide||'L';arm[s].W={x:cx-215+Math.sin(time*23)*14,y:300+Math.sin(time*17)*10};}
 const f=a.fist;if(f&&!fallK){const side=f.side,fx=side==='L'?f.x:mir(f.x),stuckW={x:fx,y:restY},A=arm[side];
  const high={x:fx-70,y:restY-175};if(f.state==='aim'){const k=ease(f.age/COL.windup);A.W=lerpP(rest,{x:high.x+Math.sin(time*5)*4,y:high.y-Math.sin(Math.min(1,f.age/COL.windup)*Math.PI)*30},k);}
  else if(f.state==='lock')A.W={...high};else if(f.state==='fall'){const q=1+f.y/240;A.W={x:lerp(high.x,fx,q),y:lerp(high.y,restY,q*q)};}
  if(['fall','stuck','broken'].includes(f.state))A.snap=true;
  if(f.state==='stuck'||f.state==='broken')A.W={x:fx+(f.state==='broken'?Math.sin(time*40)*3:0),y:restY};
  else if(f.state==='lift'){const q=1-Math.max(0,f.timer)/COL.lift,p=lerpP(stuckW,rest,ease(q));A.W={x:p.x,y:p.y-Math.sin(q*Math.PI)*120};}
  A.state=f.state==='stuck'&&f.weak?'weak':f.state==='broken'?'broken':null;}
 const sw=a.sweep;if(sw&&!fallK){const side=sw.dir>0?'L':'R',A=arm[side],S=side==='L'?SL:SR,toL=x=>side==='L'?x:mir(x),hy=sw.low?FLOOR-70:FLOOR-118;
  const reach=(RIG.hand.w[1]-100)*HAND_K;if(sw.state==='warn'){A.W={x:toL(cx-sw.dir*300)+Math.sin(time*12)*5,y:FLOOR-120};A.handRot=-.2;}
  else{A.W={x:toL(sw.x)-reach,y:hy};A.handRot=sw.low?Math.PI/2+.15:Math.PI/2;A.snap=true;}A.tool='hand';}
 for(const s of ['L','R'])if(a.hands&&!a.hands[s]&&!arm[s].state)arm[s].state='broken';
 if(assembly?.arms!==undefined){const o=assembly.arms;for(const s of ['L','R']){arm[s].fly={x:-(1-o)*520,y:-(1-o)*260,rot:(1-o)*(s==='L'?-2:2)};}}
 // Wrists glide towards their targets (the slam and the sweep stay exact), so poses never snap into each other.
 const mem=rigMemory(a),st=mem.smooth||(mem.smooth={t:time}),dt=Math.min(.1,Math.max(0,time-st.t));st.t=time;
 for(const s of ['L','R']){const A=arm[s];if(!st[s]||A.snap||assembly||fallK>0||dt===0&&!st[s])st[s]={...A.W};else st[s]=lerpP(st[s],A.W,1-Math.exp(-dt*12));if(!assembly)A.W={...st[s]};}
 for(const s of ['L','R'])Object.assign(arm[s],solveArm(s==='L'?SL:SR,arm[s].W));
 // Faces: the screen reacts to what the giant is doing; idle moods come from the emotions sheet.
 let face=a.emo?a.emo.name:null;
 if(roar)face='roar';if(f&&!fallK)face=f.state==='aim'||f.state==='lock'?'glare':f.state==='broken'?'scream':f.weak?'sneer':'grin';
 if(sw&&!fallK)face='roar';if(a.beam)face=a.beam.state==='charge'?'glare':'scream';if(a.hurt>0)face='scream';if(fallK>.3)face='glitch';
 const cracked=b.hurtTime>0&&fallK===1||breakout&&breakoutFrame(n.transitionProgress)>=2;
 return {cx,fallK,falling:a.mode==='collapse'&&!breakout,torso:{x:tx,y:ty},down:{x:dx,y:dy},SL,SR,arm,head,face,cracked,mir,assembly,emoAlpha:a.emo&&face===a.emo.name?emoAlpha(a.emo):1};
}
// The calm face between moods: the squid-eyed screen of the tower (assets/infoshum-tower.png, «face»).
function drawCalmFace(c,a,box){const img=a.infoshumTower,f=AT.mon.face.r;if(!img)return;c.save();c.beginPath();c.rect(box.x,box.y,box.w,box.h);c.clip();c.drawImage(img,f[0]+48,f[1]+28,122,94,Math.round(box.x-2),Math.round(box.y-2),Math.round(box.w+4),Math.round(box.h+4));c.restore();}
function drawRigArm(c,a,r,side,time){
 const img=a.infoshumColossusRig,A=r.arm[side],R=RIG;c.save();
 if(side==='R'){c.translate(2*r.cx,0);c.scale(-1,1);}
 if(A.fly){const p=A.S;c.translate(A.fly.x,A.fly.y);c.translate(p.x,p.y);c.rotate(A.fly.rot);c.translate(-p.x,-p.y);}
 const up=Math.atan2(A.E.y-A.S.y,A.E.x-A.S.x),fo=Math.atan2(A.W.y-A.E.y,A.W.x-A.E.x);
 rigPiece(c,img,R.upper,R.upper.a,A.S.x,A.S.y,up-segAng(R.upper),{stretch:A.k,axis:segAng(R.upper)});
 rigPiece(c,img,R.fore,R.fore.a,A.E.x,A.E.y,fo-segAng(R.fore),{stretch:A.k,axis:segAng(R.fore)});
 if(A.tool==='hand')rigPiece(c,img,R.hand,R.hand.w,A.W.x,A.W.y,A.handRot??fo+Math.PI/2,{scale:HAND_K});
 else{const p=R[A.state==='weak'?'fist1':A.state==='broken'?'fist2':'fist0'],tilt=(fo-Math.PI/2)*.35;rigPiece(c,img,p,p.w,A.W.x,A.W.y,tilt);
  if(A.state==='weak'){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.25+.2*Math.sin(time*10);rigPiece(c,img,p,p.w,A.W.x,A.W.y,tilt);c.restore();}}
 c.restore();
}
function headScreen(r){const h=r.head,R=RIG.head,s=R.scr,k=h.scale,cx=(s[0]+s[2])/2,cy=(s[1]+s[3])/2;return {x:h.x+(s[0]-cx)*k,y:h.y+(s[1]-cy)*k,w:(s[2]-s[0])*k,h:(s[3]-s[1])*k};}
function drawRigHead(c,a,r,time){
 const img=a.infoshumColossusRig,p=RIG[r.cracked?'headX':'head'],h=r.head,s=p.scr,sc=[(s[0]+s[2])/2,(s[1]+s[3])/2];
 rigPiece(c,img,p,sc,h.x,h.y,h.rot,{scale:h.scale});if(r.cracked)return;
 c.save();c.translate(h.x,h.y);c.rotate(h.rot);c.translate(-h.x,-h.y);const box=inset(headScreen(r),.03,.04);
 drawCalmFace(c,a,box);if(r.face)drawEmotion(c,a,r.face,box,r.emoAlpha,time);c.restore();
}
function drawRigDebris(c,a,r){if(!r.falling||r.fallK<=0||r.fallK>=1)return;const img=a.infoshumColossusRig;for(let i=0;i<9;i++){const p=RIG['deb'+i],t=r.fallK,dir=i%2?1:-1,x=r.cx+dir*(40+i*28)*t,y=200+i*6-Math.sin(t*Math.PI)*(90+i*12)+t*t*220;rigPiece(c,img,p,[p.r[2]/2,p.r[3]/2],x,Math.min(FLOOR-8,y),t*6*dir,{scale:.8,alpha:1-t*.4});}}
function drawColossus(c,a,g,time,assembly=null){
 const img=a.infoshumColossusRig;if(!img)return null;const r=colossusRig(g,time,assembly),R=RIG;
 c.save();if(assembly){c.beginPath();c.rect(r.cx-600,0,1200,BASE+4);c.clip();}
 const tA=1-ease((r.fallK-.25)/.5),dA=ease((r.fallK-.15)/.5);
 if(dA>0)rigPiece(c,img,R.down,[0,0],r.down.x,r.down.y,0,{alpha:dA});if(tA>0)rigPiece(c,img,R.torso,[0,0],r.torso.x,r.torso.y,0,{alpha:tA});
 c.restore();
 const lying=r.fallK>.5;if(!lying)drawRigHead(c,a,r,time);
 drawRigArm(c,a,r,'L',time);drawRigArm(c,a,r,'R',time);
 if(lying)drawRigHead(c,a,r,time);drawRigDebris(c,a,r);
 return r;
}
// ——— The assembly: the relays fly into the tower, then the giant rises out of the floor around its new head ———
function drawAssembly(c,a,g,time){
 const n=g.boss.network,k=n.transitionProgress,r=rooms[g.room],cx=r.x+TOWER.cx;
 const fly=Math.min(1,k/.32);
 if(k<.44){n.relays.forEach((q,i)=>{const rr=relayRect(g,i),e=fly*fly,x=rr.x+rr.w/2+(cx-rr.x-rr.w/2)*e,y=rr.y+rr.h/2+(TOWER.base-TOWER.h*.5-rr.y-rr.h/2)*e-Math.sin(fly*Math.PI)*80;
   if(fly<1){c.save();c.translate(x,y);c.rotate(fly*5*(i%2?1:-1));const p=AT.relay.r4,w=rr.w*(1-fly*.6),h=w*p.r[3]/p.r[2];piece(c,a.infoshumRelays,p,-w/2,-h/2,w,h);c.restore();}});
  drawTowerAt(c,a,k<.2?'crack3':'roar',cx,TOWER.base,1,time,{shake:Math.sin(time*60)*k*10});}
 if(k>=.4){const q=(k-.4)/.5,sc=towerScreen(g),scale=sc.w/((RIG.head.scr[2]-RIG.head.scr[0]));
  drawColossus(c,a,g,time,{torso:(1-ease(q/.6))*330,head:{x:sc.x+sc.w/2,y:sc.y+sc.h/2,scale,k:ease((q-.15)/.6)},arms:ease((q-.35)/.5)});}
 flash(c,g,k>.38&&k<.48?.5*(1-Math.abs(k-.43)/.05):0);flash(c,g,k>.9?(k-.9)/.1*.6:0);
}
function drawShaft(c,a,g,time){
 const img=a.infoshumAscent,vw=VW(g);
 if(img?.complete&&img.naturalWidth){const w=vw+40,h=img.naturalHeight*w/img.naturalWidth,off=(time*14)%h,x=g.camera-20;for(let y=off-h;y<512;y+=h-1)c.drawImage(img,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 else rect(c,g.camera,0,vw,512,'#1a0b33');
 c.save();c.globalAlpha=.35;rect(c,g.camera,0,vw,512,'#0a0418');c.restore();
}
// The breakout (assets/infoshum-breakout.png): bulging glass, tentacles through it, the burst, he tears out, the roar.
const BREAK=[[37,144,310,269],[394,140,373,273],[732,80,372,335],[1117,112,410,295],[8,552,386,383],[403,580,353,355],[780,548,320,373],[1141,589,380,309]];
export function breakoutFrame(progress){return progress<.2?0:progress<.38?1:progress<.5?2:progress<.64?3:progress<.84?4:5;}
function drawBreakout(c,a,g,progress,time){
 const img=a.infoshumBreakout;if(!img)return;const f=breakoutFrame(progress),box=BREAK[f],h=headBox(g),cx=h.x+h.w/2,cy=h.y+h.h/2-70-(f>=4?(progress-.64)/.36*70:0);
 const base=.72,k=f>=4?.46+.05*(f-4):base,shake=f===2?Math.sin(time*90)*4:f<2?Math.sin(time*60)*progress*6:0;
 c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(cx-box[2]*k/2+shake),Math.round(cy-box[3]*k/2),Math.round(box[2]*k),Math.round(box[3]*k));
 if(f>=2&&f<=4){const s=BREAK[7],spread=Math.min(1,(progress-.38)/.4),sk=base*(.8+spread*.7);c.save();c.globalAlpha=1-spread*.7;c.drawImage(img,s[0],s[1],s[2],s[3],Math.round(cx-s[2]*sk/2),Math.round(cy-s[3]*sk/2),Math.round(s[2]*sk),Math.round(s[3]*sk));c.restore();}
 if(f===2)flash(c,g,.6*(1-(progress-.38)/.12),'#ffe4fb');
 if(progress>.9)flash(c,g,(progress-.9)/.1*.8);
}
// ——— The broadcast cannon (assets/infoshum-cannon.png) ———
// It rises out of the colossus's head (mount ×3), the barrel charges (×4) and fires (×1); the beam is a tiled
// segment (×3) with a muzzle flare (×3) and an impact on the floor (×4). Mount and barrel turn towards Uma's side.
const CAN_K=.64,BEAM_TH=COL.beamHalf*2.5;
function drawCannon(c,a,g,time){
 const col=g.boss.network.col,m=col.beam,img=a.infoshumCannon,C=AT.cannon;if(!img||!C)return;
 const rig=colossusRig(g,time);if(rig.fallK>0)return;
 if(m)col.cannon={x:m.x,until:time+.3};const fold=!m&&col.cannon&&time<col.cannon.until?(col.cannon.until-time)/.3:0;
 if(!m&&!fold)return;
 const cx=rig.head.x,tx=m?m.x:col.cannon.x,left=tx<cx,yb=rig.head.y+RIG.head.top[1]-(RIG.head.scr[1]+RIG.head.scr[3])/2+8;
 const q=m?(m.state==='charge'?1-Math.max(0,m.timer)/COL.beamCharge:1):fold,mf=q<.12?0:q<.25?1:2,mp=C['m'+mf],mw=mp.r[2]*CAN_K,mh=mp.r[3]*CAN_K,mx=cx-(left?mw-mp.b[0]*CAN_K:mp.b[0]*CAN_K);
 piece(c,img,mp,mx,yb-mh,mw,mh,{flip:left});if(mf<2)return;
 const pv={x:left?mx+mw-mp.p[0]*CAN_K:mx+mp.p[0]*CAN_K,y:yb-mh+mp.p[1]*CAN_K},ang=Math.atan2(FLOOR-pv.y,tx-pv.x);
 const firing=m&&m.state==='fire',bf=!m?0:firing?(Math.floor(time*16)%3?4:3):q<.5?1:q<.78?2:3,bp=C['b'+bf],k=CAN_K;
 c.save();c.translate(Math.round(pv.x),Math.round(pv.y));c.rotate(ang);if(left)c.scale(1,-1);c.drawImage(img,bp.r[0],bp.r[1],bp.r[2],bp.r[3],Math.round(-bp.p[0]*k),Math.round(-bp.p[1]*k),Math.round(bp.r[2]*k),Math.round(bp.r[3]*k));c.restore();
 const mz={x:pv.x+Math.cos(ang)*(bp.mz[0]-bp.p[0])*k,y:pv.y+Math.sin(ang)*(bp.mz[0]-bp.p[0])*k};
 if(m&&m.state==='charge'){if(q>.3)drawRay(c,a,mz.x,mz.y,tx,FLOOR,COL.beamHalf,time,true);return;}
 if(!firing)return;
 // The beam: one frame for the whole length, scrolling outwards so it reads as a stream, never as torn pieces.
 const len=Math.hypot(tx-mz.x,FLOOR-mz.y),tp=C['beam'+Math.floor(time*14)%3],th=BEAM_TH*(1+Math.sin(time*24)*.05),tw=tp.r[2]*th/tp.r[3],off=(time*520)%tw;
 c.save();c.translate(mz.x,mz.y);c.rotate(ang);c.beginPath();c.rect(0,-th,len,th*2);c.clip();
 for(let x=-off;x<len;x+=tw-1)c.drawImage(img,tp.r[0],tp.r[1],tp.r[2],tp.r[3],Math.floor(x),Math.round(-th/2),Math.ceil(tw),Math.round(th));c.restore();
 const ip=C['imp'+Math.floor(time*12)%3],iw=210,ih=iw*ip.r[3]/ip.r[2];piece(c,img,ip,tx-iw/2,FLOOR+10-ih,iw,ih);
 const fp=C['fl'+Math.floor(time*12)%3],fs=th*1.9;c.save();c.globalCompositeOperation='lighter';piece(c,img,fp,mz.x-fs/2,mz.y-fs/2,fs,fs);c.restore();
}
function drawColossusForeground(c,a,g,time){
 const n=g.boss.network,col=n.col;if(!col)return;const img=a.infoshumParts,f=col.fist;
 if(f&&(f.state==='aim'||f.state==='lock')){const lock=f.state==='lock',p=AT.parts.shadow,w=lock?170:110+60*Math.min(1,f.age/1.2),h=w*p.r[3]/p.r[2];piece(c,img,p,f.x-w/2,FLOOR-h/2+4,w,h,{alpha:lock?.95:.6});if(lock)drawLineWarning(c,a,f.x-70,FLOOR-6,140,time);}
 for(const s of col.shocks){const p=AT.parts['shock'+Math.min(2,Math.floor(s.travel/50))],w=84,h=w*p.r[3]/p.r[2];piece(c,img,p,s.x-w/2,FLOOR-h+12,w,h,{alpha:Math.max(.25,1-s.travel/COL.shockRange)});}
 if(col.dust){const p=AT.parts.dust,k=col.dust.time/.45,w=180*(1+k*.5),h=w*p.r[3]/p.r[2];piece(c,img,p,col.dust.x-w/2,FLOOR-h+14,w,h,{alpha:1-k});}
 const s=col.sweep;if(s&&s.state==='warn'){const y=s.low?FLOOR-22:FLOOR-62;drawLineWarning(c,a,rooms[g.room].x+TOWER.cx-COL.sweepSpan/2,y,COL.sweepSpan,time);}
 if(n.stage==='colossus')drawCannon(c,a,g,time);
 flash(c,g,Math.min(.4,col.flash*1.4));
 if(n.stage==='breakout')drawBreakout(c,a,g,n.transitionProgress,time);
}
// The freed Infoshum as a small picture (the opening's monitor): the flying cycle fitted to a height.
export function drawInfoshumMini(c,a,cx,cy,height,time){const p=AT.free2['i'+Math.floor(time*6)%5],img=a.infoshumFree2;if(!p||!img)return false;const k=height/p.r[3];piece(c,img,p,cx-p.r[2]*k/2,cy-p.r[3]*k/2,p.r[2]*k,p.r[3]*k);return true;}
// ——— Phase 3: free in the storm ———
// assets/infoshum-free2.png: flying ×5, roar ×3, slamming tentacles into the ground ×3, the ram wind-up ×3, the ram ×2,
// the crash ×3, dizzy ×2, hurt ×2, a tentacle torn off ×2, the burst ×3. Each piece keeps its place in its grid cell.
// assets/infoshum-free.png: the crack in the ground, a tentacle bursting out, the headline shards.
const FS=1.4;
function free2(c,a,name,cx,cy,{flip=false,ay=.5}={}){const p=AT.free2[name],img=a.infoshumFree2;if(!p||!img)return;const [cw,ch]=p.cell,[ox,oy]=p.o,k=FS,x0=cx-cw*k/2,y0=cy-ch*k*ay,w=p.r[2]*k,h=p.r[3]*k,px=flip?x0+(cw-ox)*k-w:x0+ox*k;piece(c,img,p,px,y0+oy*k,w,h,{flip});}
function freePiece(c,a,name,cx,cy,{flip=false,alpha=1,ay=.5,k=1}={}){const p=AT.free[name],img=a.infoshumFree;if(!p||!img)return;const w=p.r[2]*k,h=p.r[3]*k;piece(c,img,p,cx-w/2,cy-h*ay,w,h,{flip,alpha});}
const yur=(a,i)=>[a.infoshumYuri,AT.yuri['y'+i]];
function drawCasing(c,a,name,x,y,w,pic){const cs=AT.casings[name],img=a.infoshumCasings;if(!cs||!img)return;const k=w/cs.r[2],h=cs.r[3]*k,s=cs.s;if(s&&pic?.[0])piece(c,pic[0],pic[1],x+s[0]*k-1,y+s[1]*k-1,s[2]*k+2,s[3]*k+2);piece(c,img,cs,x,y,w,h);}
function amberPath(c,x0,y0,x1,y1,time){c.save();c.strokeStyle='#ffc45e';c.shadowColor='#ffb347';c.shadowBlur=10;c.lineWidth=3;c.globalAlpha=.55+.25*Math.sin(time*8);c.setLineDash?.([10,8]);c.lineDashOffset=-time*60;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
// For the last blow Yuri flies in on a little TV (assets/infoshum-yuri-rope.png), lassoes Infoshum with a cable and
// pulls with all his strength; when the paw lands he gives a thumbs-up and climbs back into his screen.
const YR={"y0":{"r":[0,0,151,158],"b":[96.0,147.5]},"y1":{"r":[153,0,168,160],"b":[85.0,149.5]},"y2":{"r":[323,0,183,176],"b":[80.0,163.5]},"y3":{"r":[508,0,188,174],"b":[96.5,165.5],"rope":[187.0,56.0]},"y4":{"r":[698,0,173,182],"b":[94.5,171.5],"rope":[172.5,66.0]},"y5":{"r":[873,0,169,180],"b":[92.8,168.0],"rope":[168.5,88.5]},"y6":{"r":[0,184,158,174],"b":[99.0,160.5]},"y7":{"r":[160,184,164,168],"b":[108.0,151.6]}},YK=.8;
function yuriCheer(c,a,cx,cy,t){const img=a.infoshumYuriRope;if(!img)return;const p=YR['y'+(t<1.4?6:7)],w=p.r[2]*YK,h=p.r[3]*YK,x=cx-230,y=cy-150+Math.sin(t*3)*4-(t>2.2?(t-2.2)*60:0);c.save();c.globalAlpha=t>2.2?Math.max(0,1-(t-2.2)/.8):Math.min(1,t/.2);c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(x-w/2),Math.round(y-h/2),Math.round(w),Math.round(h));c.restore();}
function drawYuriRope(c,a,g,f,time){
 const img=a.infoshumYuriRope,b=g.boss;if(!img)return;const r=rooms[g.room];
 if(f.mode==='pulled'&&f.yuri){f.yuriT=FREE.pull-f.timer;f.yuriDone=undefined;}else if(f.mode==='dizzy'&&f.yuri){f.yuriT=FREE.pull+FREE.dizzyYuri-f.timer;f.yuriDone=undefined;}else if(b.hp<=0){if(f.yuriDone===undefined)f.yuriDone=time;}
 const won=b.hp<=0,e=won?time-f.yuriDone:f.yuriT||0,left=f.x-r.x>300,side=left?-1:1,ax=f.x+side*175,ay=f.gy-150+Math.sin(time*3)*4;
 let n;if(won)n=e<1.2?6:7;else if(e<.3)n=0;else if(e<.55)n=1;else if(e<.85)n=2;else n=Math.floor(e*1.4)%3===2?5:3+Math.floor(time*6)%2;
 const p=YR['y'+n],w=p.r[2]*YK,h=p.r[3]*YK,flip=!left,fly=n===0?(1-e/.3)*120:0,x0=ax-p.b[0]*YK*(flip?-1:1),y0=ay-p.b[1]*YK-fly;
 c.save();c.translate(Math.round(x0),Math.round(y0));if(flip)c.scale(-1,1);c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],0,0,Math.round(w),Math.round(h));c.restore();
 if(!won&&(p.rope||n===2&&e>.75)){const rp=p.rope||[p.r[2]*.9,p.r[3]*.2],sx=x0+rp[0]*YK*(flip?-1:1),sy=y0+rp[1]*YK,tx=f.x,ty=f.gy-40,mx=(sx+tx)/2,my=Math.max(sy,ty)+18+Math.sin(time*9)*4;
  c.save();c.lineCap='round';c.strokeStyle='#3a1260';c.lineWidth=9;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(mx,my,tx,ty);c.stroke();c.strokeStyle='#a347e6';c.lineWidth=5;c.stroke();c.strokeStyle='#e7a6ff';c.lineWidth=1.5;c.stroke();
  c.beginPath();c.ellipse(tx,ty,34,14,0,0,Math.PI*2);c.strokeStyle='#3a1260';c.lineWidth=8;c.stroke();c.strokeStyle='#a347e6';c.lineWidth=4;c.stroke();c.restore();}
}
// «Двойники»: the split — two pale copies slide out of him to either side, leaving afterimages, with a flash; then
// each attacker's line blinks while it aims and it dives along it; the copies vanish after their dive.
function ghostSprite(c,a,x,y,alpha,time,ang=null,frame='w2'){c.save();c.globalAlpha=alpha;c.filter='brightness(1.7) saturate(.35) drop-shadow(0 0 6px rgba(150,240,255,.9))';c.translate(x,y);if(ang!==null){let r=ang;if(Math.cos(ang)<0){c.scale(-1,1);r=Math.PI-ang;}c.rotate(r);}free2(c,a,frame,0,0);c.restore();}
function dashLine(c,x0,y0,x1,y1,time){c.save();c.globalAlpha=.4+.4*Math.abs(Math.sin(time*12));c.strokeStyle='#ff6ad8';c.lineWidth=3;c.setLineDash?.([10,7]);c.lineDashOffset=-time*90;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function drawGhosts(c,a,f,time){
 if(f.mode==='ghostPrep'){const split=1-Math.max(0,Math.min(1,f.timer/FREE.ghostSplit));if(split<=0)return;const e=split*split*(3-2*split);
  if(split<.25){c.save();c.globalAlpha=(1-split/.25)*.8;c.strokeStyle='#bff6ff';c.lineWidth=3;c.beginPath();c.ellipse(f.x,f.y,30+split*260,20+split*120,0,0,Math.PI*2);c.stroke();c.restore();}
  for(const gh of f.ghosts){const x=f.x+(gh.x0-f.x)*e,y=f.y+(gh.y0-f.y)*e;for(let i=3;i>=1;i--){const q=Math.max(0,e-i*.12);ghostSprite(c,a,f.x+(gh.x0-f.x)*q,f.y+(gh.y0-f.y)*q,.12*(4-i)*split,time);}ghostSprite(c,a,x,y,.25+.4*split,time);}
  return;}
 for(const [i,gh] of f.ghosts.entries()){if(gh.state==='gone')continue;
  if(gh.state==='wait')ghostSprite(c,a,gh.x0,gh.y0+Math.sin(time*4+i)*5,.55,time);
  else if(gh.state==='aim'){dashLine(c,gh.x0,gh.y0,gh.x1,gh.y1,time);ghostSprite(c,a,gh.x0,gh.y0,.7,time);}
  else{const q=ghostPos(gh,gh.k);ghostSprite(c,a,q.x,q.y,.7*(gh.k>.85?(1-gh.k)/.15:1),time,Math.atan2(gh.y1-gh.y0,gh.x1-gh.x0),'m'+Math.floor(time*14)%2);}}
 if(f.seq===2&&f.phase==='aim')dashLine(c,f.dive.x,f.y+40,f.dive.x,f.dive.y1+20,time);
}
function drawFree(c,a,g,time){
 const b=g.boss,f=b.network.free;if(!f)return;
 for(const t of f.tentacles){if(t.state==='warn')freePiece(c,a,'crack',t.x,t.y+2,{k:.5,alpha:.6+.4*Math.abs(Math.sin(time*12))});
  else{const k=Math.min(1,t.time/.1)*(t.time>FREE.tentUp-.15?Math.max(0,(FREE.tentUp-t.time)/.15):1),p=AT.free.tent,w=p.r[2]*.62,h=p.r[3]*.62*k;piece(c,a.infoshumFree,p,t.x-w/2,t.y+10-h,w,h);}}
 // A swatted shard turns gold on its way back.
 for(const s of f.shards){if(s.back){c.save();c.filter='sepia(1) saturate(3) brightness(1.35)';}freePiece(c,a,'sh'+Math.floor(time*12)%3,s.x,s.y,{k:.42,flip:s.vx<0});if(s.back)c.restore();}
 if(f.mode==='ramPrep'){const x0=Math.min(f.tx,f.ex),x1=Math.max(f.tx,f.ex);drawLineWarning(c,a,x0,f.ty,x1-x0,time);}
 // For the last blow Yuri holds him from a surviving screen.
 if((f.mode==='dizzy'||f.mode==='pulled')&&f.yuri)drawYuriRope(c,a,g,f,time);
 if(f.ghosts&&(f.mode==='ghostPrep'||f.mode==='ghostDash'))drawGhosts(c,a,f,time);
 const ground={ay:1,y:f.gy+10};let name='i'+[0,1,2,3,4][Math.floor(time*6)%5],flip=false,place=null;
 if(f.mode==='enter')name='r'+Math.min(2,Math.floor((FREE.enter-f.timer)/FREE.enter*3));
 else if(f.mode==='tentacle')name='s'+Math.floor(time*8)%3;
 else if(f.mode==='volley')name=f.timer>0?'i0':'r'+(1+Math.floor(time*8)%2);
 else if(f.mode==='ramPrep'){name='w'+Math.min(2,Math.floor((1-Math.max(0,f.timer)/FREE.ramPrep)*3));flip=f.dir<0;}
 else if(f.mode==='ram'){name='m'+Math.floor(time*14)%2;flip=f.dir<0;}
 else if(f.mode==='ghostPrep')name='r'+Math.min(2,Math.floor((1-Math.max(0,f.timer)/ghostPrep())*3));
 else if(f.mode==='ghostDash')name=f.seq===2&&f.phase==='dive'?'dive':'r'+(1+Math.floor(time*8)%2);
 else if(f.mode==='pulled')name='d0';
 else if(f.mode==='crash'){name='c'+Math.min(2,Math.floor((FREE.crash-f.timer)/FREE.crash*3));place=ground;}
 else if(f.mode==='dizzy'){name='d'+Math.floor(time*4)%2;place=ground;}
 else if(f.mode==='hit'){name='t'+Math.min(1,Math.floor((FREE.hit-f.timer)/FREE.hit*2));}
 else if(b.hurtTime>0)name='h'+Math.floor(time*10)%2;
 // He has to stand out of the purple storm: a dark halo behind him, a dark outline and a cyan glow around the
 // sprite, and smooth scaling (the sheet is drawn at 1.4×, which nearest-neighbour turns into uneven blocks).
 const cy=place?place.y-60:f.y;c.save();const halo=c.createRadialGradient(f.x,cy,10,f.x,cy,120);halo.addColorStop(0,'rgba(4,2,16,.62)');halo.addColorStop(1,'rgba(4,2,16,0)');c.fillStyle=halo;c.fillRect(f.x-120,cy-120,240,240);c.restore();
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.filter='drop-shadow(0 0 1px #090316) drop-shadow(0 0 1px #090316) drop-shadow(0 0 6px rgba(110,235,255,.8))';
 if(name==='dive'){c.translate(f.x,f.y);c.rotate(Math.PI/2);free2(c,a,'m'+Math.floor(time*14)%2,0,0);}
 else free2(c,a,name,f.x,place?place.y:f.y,{flip,ay:place?1:.5});c.restore();
 flash(c,g,Math.min(.4,f.flash*1.4));
}
// The storm (assets/infoshum-storm.jpg, infoshum-storm-platforms.png: slab, cracked slab, slab with a terminal).
const PLAT=[[6,273],[27,241],[47,192]],PLAT_TOP=22;
function drawStormIsland(c,a,p){
 const img=a.infoshumStormPlatforms;if(!img)return false;const [sx,sw]=PLAT[p.storm]||PLAT[0],kx=(p.w+14)/sw,ky=Math.min(.78,Math.max(.5,kx));
 c.drawImage(img,p.storm*290+sx,0,sw,120,Math.round(p.x-7),Math.round(p.y-PLAT_TOP*ky+2),Math.round(sw*kx),Math.round(120*ky));return true;
}
function drawStormSky(c,a,g,time){
 const r=rooms[g.room],img=a.infoshumStorm;
 if(img?.complete&&img.naturalWidth){const vw=VW(g),w=Math.max(1240,vw*1.2),h=w*img.naturalHeight/img.naturalWidth,span=Math.max(1,r.width-vw),k=Math.max(0,Math.min(1,(g.camera-r.x)/span)),x=g.camera-k*(w-vw);c.drawImage(img,Math.round(x),-150*w/1240,w,h);}
 else rect(c,r.x,0,r.width,512,'#1a0b33');
 c.save();for(let i=0;i<26;i++){const x=r.x+((i*173+time*(40+i%5*18))%r.width),y=(i*97+Math.sin(time+i)*30)%430+20;c.globalAlpha=.35+.3*(i%3)/2;rect(c,x,y,3+i%4,3+i%3,i%2?'#b77cff':'#68e8ff');}c.restore();
}
// The portal that carries Uma between phases (assets/infoshum-portal.png: opening ×6, spinning ×4, closing ×4).
function drawPortal(c,a,g,time){
 const o=g.boss.network.portal,img=a.infoshumPortal,P=AT.portal;if(!o||!img||!P)return;let name;
 if(o.mode==='in')name=o.q<.18?'o'+Math.min(5,Math.floor(o.q/.18*6)):o.q<.86?'l'+Math.floor(time*12)%4:'c'+Math.min(3,Math.floor((o.q-.86)/.14*4));
 else name=o.t<.5?'l'+Math.floor(time*12)%4:'c'+Math.min(3,Math.floor((o.t-.5)/.4*4));
 const p=P[name],s=240*(o.mode==='in'?Math.min(1,.6+o.q*2):1),gl=c.createRadialGradient(o.x,o.y,0,o.x,o.y,s*.75);gl.addColorStop(0,'#ff6af055');gl.addColorStop(1,'#ff6af000');
 c.save();c.fillStyle=gl;c.fillRect(o.x-s,o.y-s,s*2,s*2);c.translate(o.x,o.y);c.rotate(time*1.5);piece(c,img,p,-s/2,-s/2,s,s);c.restore();
}
export function drawInfoshumBackdrop(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(n.stage==='free'){drawStormSky(c,a,g,time);drawPortal(c,a,g,time);return;}
 if(n.stage==='colossus'||n.stage==='breakout'){drawShaft(c,a,g,time);drawColossus(c,a,g,time);drawPortal(c,a,g,time);return;}
 if(n.stage==='assemble'){const r=rooms[g.room],bg=a.infoshumHall;if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,r.x,0,r.width,512);c.save();c.globalAlpha=Math.min(.7,n.transitionProgress*1.4);rect(c,r.x,0,r.width,512,'#05020f');c.restore();drawAssembly(c,a,g,time);drawPortal(c,a,g,time);return;}
 drawHallBack(c,a,g,time);
}
export function drawInfoshumPlatform(c,a,p,time){
 if(p.storm!==undefined&&drawStormIsland(c,a,p))return;
 if(p.index===0&&p.room===8&&!p.storm)return;// the hall's floor is painted in its background
 if(!a.infoshumPlatform?.complete||p.infoshumStep)return;
 const image=a.infoshumPlatform,scale=30/177,cap=Math.min(140*scale,p.w/3),y=p.y-3;
 c.drawImage(image,22,299,140,177,p.x,y,cap,30);
 for(let x=cap;x<p.w-cap;x+=300*scale){const w=Math.min(300*scale,p.w-cap-x);c.drawImage(image,430,299,w/scale,177,p.x+x,y,w,30);}
 c.drawImage(image,2011,299,140,177,p.x+p.w-cap,y,cap,30);
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(n.stage==='network'){drawHallFront(c,a,g,time);return;}
 if(n.stage==='colossus'||n.stage==='breakout'){drawColossusForeground(c,a,g,time);return;}
 if(n.stage==='free')drawFree(c,a,g,time);
}
// «Тишина»: he shrinks into a line and a dot like an old TV switching off (boss-defeat-art.js).
export function drawInfoshumDefeat(c,a,d){
 const img=a.infoshumSilence;if(!img)return false;const t=d.time,cx=d.x+d.w/2,cy=d.y+d.h/2;yuriCheer(c,a,cx,cy,t);const frame=t<.45?0:t<.85?1:t<1.25?2:3,alpha=frame===3?Math.max(0,1-(t-1.25)/.45):1;
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

