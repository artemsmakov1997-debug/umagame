import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {WAVE,COL,FREE,FLOOR,TOWER,RELAYS,RELAY_H,ROUND_PAIRS,towerScreen,relayRect,headBox,beamFloor} from './infoshum-combat.js?v=0.21.5';
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
const BEAM_EYE=125;// the glowing screen of the charging pose (idle7), in frame pixels from the top
function beamOrb(c,x,y,time,charge){const r=(charge?14:24)+Math.sin(time*30)*3,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#ff8af0e0');g.addColorStop(1,'#ff3ad800');c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();}
function drawRay(c,a,x0,y0,x1,y1,half,time,warn){const len=Math.hypot(x1-x0,y1-y0);c.save();c.translate(x0,y0);c.rotate(Math.atan2(y1-y0,x1-x0));if(warn)drawLineWarning(c,a,0,0,len,time);else drawGiantBeam(c,a,0,0,len,half,time);c.restore();}
function amberFrame(c,r,time,pad=0){c.save();c.strokeStyle='#ffc45e';c.shadowColor='#ffb347';c.shadowBlur=16;c.lineWidth=3;c.globalAlpha=.65+.3*Math.sin(time*8);c.strokeRect(r.x-pad,r.y-pad,r.w+pad*2,r.h+pad*2);c.restore();}
// ——— Phase 1: the broadcast tower ———
// assets/infoshum-tower.png: the huge square monitor on its pedestal — dark, static, face, charging, roaring, two shield
// frames, Yuri bursting in, half Yuri / half Infoshum, three crack levels. assets/infoshum-relays.png: a relay tower
// (idle, Yuri points, junction box open, hit, exploded, rebooting) and cable pieces (three pulse frames, two snapped ends).
// assets/infoshum-fx1.png: the scanning beam, a warning line, the cable whip, a thrown TV and its puddle of noise.
const TOWER_K=TOWER.w/AT.mon.face.r[2],EMO_BOX=[0,0,0,0];
function drawTowerAt(c,a,face,cx,base,k=1,time=0,{alpha=1,shake=0}={}){const p=AT.mon[face]||AT.mon.face,w=p.r[2]*TOWER_K*k;return stand(c,a.infoshumTower,p,cx+shake,base,w,{alpha});}
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
 if(n.take?.show==='yuri')amberFrame(c,towerScreen(g),time,4);
}
function drawHallFront(c,a,g,time){
 const n=g.boss.network,img=a.infoshumFx1,F=AT.fx1;
 for(const s of n.scans){const bottom=s.state==='go'?s.bottom:beamFloor(g,s.x);
  if(s.state==='warn'){c.save();c.globalAlpha=.25+.25*Math.abs(Math.sin(time*12));rect(c,s.x-WAVE.scanHalf,0,WAVE.scanHalf*2,bottom,'#ff5ae0');c.restore();const x0=Math.min(s.x,s.x+s.dir*WAVE.scanSpan),w=WAVE.scanSpan;drawLineWarning(c,a,x0,FLOOR-4,w,time);piece(c,img,F.scan0,s.x-24,0,48,64);}
  else{const p=F['scan'+(1+Math.floor(time*14)%2)];piece(c,img,p,s.x-38,0,76,bottom+12);}}
 for(const w of n.whips){const len=w.x1-w.x0;
  if(w.state==='warn'){drawLineWarning(c,a,w.x0,w.y-3,len,time);const k=1-Math.max(0,w.timer)/WAVE.whipWarn,p=F['whip'+Math.min(2,Math.floor(k*3))],x=w.from<0?w.x0-30:w.x1+30;stand(c,img,p,x,w.y+4,p.r[2]*1.2,{flip:w.from>0});}
  else{const k=Math.min(1,(WAVE.whipHit-w.timer)/(WAVE.whipHit+.35)),p=F['whip'+(3+Math.min(3,Math.floor(k*4)))];stand(c,img,p,w.x0+len/2,w.y+6,len+40,{flip:w.from>0});}}
 for(const q of n.puddles){const k=q.time/WAVE.puddle,p=F['pud'+Math.min(3,Math.floor(k*4))];stand(c,img,p,q.x,q.y+8,WAVE.puddleHalf*2.6);}
 for(const t of n.tvs){if(t.t<0)continue;if(t.state==='fly'){const k=t.t/WAVE.flight,x=t.fx+(t.tx-t.fx)*k,y=t.fy+(t.ty-t.fy)*k-Math.sin(k*Math.PI)*160,p=F['tv'+Math.floor(time*10)%2];piece(c,img,p,x-26,y-28,52,56);}
  else stand(c,img,F.tvhit,t.tx,t.ty+8,74);}
 // The open junction box: an amber glow so the cat sees where Yuri waits.
 n.relays.forEach((q,i)=>{if(q.state==='open'){const r=relayRect(g,i);amberFrame(c,{x:r.x+r.w*.55,y:r.y+r.h*.52,w:r.w*.36,h:r.h*.28},time,2);}});
}
// ——— The assembly: the relays fly into the tower, the colossus rises around it ———
const BODY_K=430/360,BASE=FLOOR+10;
function bodyFrame(c,a,name,cx,{flip=false,alpha=1,shake=0,bob=0}={}){if(alpha<=0)return null;const p=AT.body[name];if(!p||!a.infoshumColBody)return null;const k=BODY_K,w=p.r[2]*k,h=p.r[3]*k,hx=p.hx[0]*k,x=flip?cx-(w-hx):cx-hx,y=BASE-p.gy[0]*k+bob;piece(c,a.infoshumColBody,p,x+shake,y,w,h,{flip,alpha});return {x,y,w,h,k,p,flip};}
function bodyPoint(f,pt){const x=f.flip?f.x+f.w-pt[0]*f.k:f.x+pt[0]*f.k;return {x,y:f.y+pt[1]*f.k};}
function drawAssembly(c,a,g,time){
 const n=g.boss.network,k=n.transitionProgress,r=rooms[g.room],cx=r.x+TOWER.cx;
 const fly=Math.min(1,k/.32);
 if(k<.42){n.relays.forEach((q,i)=>{const rr=relayRect(g,i),e=fly*fly,x=rr.x+rr.w/2+(cx-rr.x-rr.w/2)*e,y=rr.y+rr.h/2+(TOWER.base-TOWER.h*.5-rr.y-rr.h/2)*e-Math.sin(fly*Math.PI)*80;
   if(fly<1){c.save();c.translate(x,y);c.rotate(fly*5*(i%2?1:-1));const p=AT.relay.r4,w=rr.w*(1-fly*.6),h=w*p.r[3]/p.r[2];piece(c,a.infoshumRelays,p,-w/2,-h/2,w,h);c.restore();}});
  drawTowerAt(c,a,k<.2?'crack3':'roar',cx,TOWER.base,1,time,{shake:Math.sin(time*60)*k*10});}
 if(k>.28&&k<.5){const f=Math.min(3,Math.floor((k-.28)/.22*4)),as=AT.colossus['as'+f],w=200+(k-.28)*900;piece(c,a.infoshumColossus,as,cx-w/2,BASE-w*as.r[3]/as.r[2],w,w*as.r[3]/as.r[2]);}
 if(k>=.46){const f=Math.min(5,Math.floor((k-.46)/.44*6)),fr=bodyFrame(c,a,'rise'+f,cx);
  if(fr&&f>=4&&fr.p.scr){const s=fr.p.scr,x0=fr.x+s[0]*fr.k,y0=fr.y+s[1]*fr.k,pic=AT.screens[f===4?'s1':'s2'];piece(c,a.infoshumScreenStates,pic,x0,y0,(s[2]-s[0])*fr.k,(s[3]-s[1])*fr.k,{alpha:.95});}}
 flash(c,g,k>.38&&k<.48?.5*(1-Math.abs(k-.43)/.05):0);flash(c,g,k>.9?(k-.9)/.1*.6:0);
}
// ——— Phase 2: the colossus ———
// assets/infoshum-colossus-body.png: whole-body frames — idle ×3, roar ×2, hurt ×2, charging; the fall ×4, lying ×2,
// getting up ×2; a ground slam ×7 (the fist lands on the left; mirrored for the right); low and high sweeps ×3 each;
// rising out of the heap ×6. The faces are painted into every frame.
function colossusPose(g,time){
 const a=g.boss.network.col;if(!a)return ['idle0'];
 if(a.mode==='intro')return ['idle'+(3+Math.floor(time*4)%2)];
 if(a.mode==='collapse'){if(a.clock<COL.fallTime)return ['fall'+Math.min(3,Math.floor(a.clock/COL.fallTime*4))];return ['fall'+(4+Math.floor(time*2)%2)];}
 if(a.mode==='rise')return [a.clock<COL.rise*.5?'fall6':a.clock<COL.rise?'fall7':'idle3'];
 const f=a.fist;if(f){const flip=f.side==='R';
  if(f.state==='aim')return [f.age<COL.windup?'slam0':'slam1',flip];if(f.state==='lock')return ['slam1',flip,Math.sin(time*80)*2];if(f.state==='fall')return ['slam2',flip];
  if(f.state==='stuck')return [f.timer>COL.stuck[0]-.18?'slam3':'slam4',flip];if(f.state==='broken')return ['slam5',flip];return ['slam6',flip];}
 const s=a.sweep;if(s){const o=s.low?0:3,flip=s.dir<0;if(s.state==='warn')return ['sweep'+o,flip];return ['sweep'+(o+(s.travel<COL.sweepSpan*.45?1:2)),flip];}
 if(a.beam)return ['idle7'];
 if(a.hurt>0)return ['idle'+(5+Math.floor(time*6)%2)];
 if(a.roar>0)return ['idle'+(3+Math.floor(time*5)%2)];
 if(a.emo)return ['idle0'];
 return ['idle0'];
}
function drawShaft(c,a,g,time){
 const img=a.infoshumAscent,vw=VW(g);
 if(img?.complete&&img.naturalWidth){const w=vw+40,h=img.naturalHeight*w/img.naturalWidth,off=(time*14)%h,x=g.camera-20;for(let y=off-h;y<512;y+=h-1)c.drawImage(img,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 else rect(c,g.camera,0,vw,512,'#1a0b33');
 c.save();c.globalAlpha=.35;rect(c,g.camera,0,vw,512,'#0a0418');c.restore();
}
// A short crossfade between two poses keeps the giant from snapping from frame to frame.
const FADE=.1;
function drawColossus(c,a,g,time){
 const col=g.boss.network.col||{},[name,flip=false,shake=0]=colossusPose(g,time),hurt=g.boss.hurtTime>0?Math.sin(time*60)*3:0,key=name+(flip?'~':''),cx=rooms[g.room].x+TOWER.cx;
 const fade=col.fade||(col.fade={key,prev:null,at:-9});if(fade.key!==key){fade.prev=fade.key;fade.at=time;fade.key=key;}
 const k=Math.min(1,Math.max(0,(time-fade.at)/FADE));
 // The new pose is drawn solid and the old one melts away on top of it, so the giant never turns see-through.
 const bob=name==='idle0'?Math.round(Math.sin(time*2.2)*2):0,fr=bodyFrame(c,a,name,cx,{flip,shake:shake+hurt,bob});
 if(fade.prev&&k<1){const [pn,pf]=[fade.prev.replace('~',''),fade.prev.endsWith('~')];bodyFrame(c,a,pn,cx,{flip:pf,alpha:(1-k)*.85,shake:hurt});}
 if(fr&&col.emo&&name==='idle0'){const s=AT.body.idle0.scr;drawEmotion(c,a,col.emo.name,inset({x:fr.x+s[0]*fr.k+hurt,y:fr.y+s[1]*fr.k,w:(s[2]-s[0])*fr.k,h:(s[3]-s[1])*fr.k},.13,.17),emoAlpha(col.emo)*Math.max(.35,k),time);}
 return fr;
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
function drawColossusForeground(c,a,g,time){
 const n=g.boss.network,col=n.col;if(!col)return;const img=a.infoshumParts,f=col.fist;
 if(f&&(f.state==='aim'||f.state==='lock')){const lock=f.state==='lock',p=AT.parts.shadow,w=lock?170:110+60*Math.min(1,f.age/1.2),h=w*p.r[3]/p.r[2];piece(c,img,p,f.x-w/2,FLOOR-h/2+4,w,h,{alpha:lock?.95:.6});if(lock)drawLineWarning(c,a,f.x-70,FLOOR-6,140,time);}
 for(const s of col.shocks){const p=AT.parts['shock'+Math.min(2,Math.floor(s.travel/50))],w=84,h=w*p.r[3]/p.r[2];piece(c,img,p,s.x-w/2,FLOOR-h+12,w,h,{alpha:Math.max(.25,1-s.travel/COL.shockRange)});}
 if(col.dust){const p=AT.parts.dust,k=col.dust.time/.45,w=180*(1+k*.5),h=w*p.r[3]/p.r[2];piece(c,img,p,col.dust.x-w/2,FLOOR-h+14,w,h,{alpha:1-k});}
 const s=col.sweep;if(s&&s.state==='warn'){const y=s.low?FLOOR-22:FLOOR-62;drawLineWarning(c,a,rooms[g.room].x+TOWER.cx-COL.sweepSpan/2,y,COL.sweepSpan,time);}
 const m=col.beam;if(m&&n.stage==='colossus'){const p7=AT.body.idle7,x0=rooms[g.room].x+TOWER.cx,y0=BASE-(p7.gy[0]-BEAM_EYE)*BODY_K;drawRay(c,a,x0,y0,m.x,FLOOR,COL.beamHalf,time,m.state==='charge');beamOrb(c,x0,y0,time,m.state==='charge');}
 flash(c,g,Math.min(.4,col.flash*1.4));
 if(n.stage==='breakout')drawBreakout(c,a,g,n.transitionProgress,time);
}
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
function drawFree(c,a,g,time){
 const b=g.boss,f=b.network.free;if(!f)return;
 for(const t of f.tentacles){if(t.state==='warn')freePiece(c,a,'crack',t.x,t.y+2,{k:.5,alpha:.6+.4*Math.abs(Math.sin(time*12))});
  else{const k=Math.min(1,t.time/.1)*(t.time>FREE.tentUp-.15?Math.max(0,(FREE.tentUp-t.time)/.15):1),p=AT.free.tent,w=p.r[2]*.62,h=p.r[3]*.62*k;piece(c,a.infoshumFree,p,t.x-w/2,t.y+10-h,w,h);}}
 for(const s of f.shards)freePiece(c,a,'sh'+Math.floor(time*12)%3,s.x,s.y,{k:.42,flip:s.vx<0});
 if(f.mode==='ramPrep'){const x0=Math.min(f.tx,f.ex),x1=Math.max(f.tx,f.ex);drawLineWarning(c,a,x0,f.ty,x1-x0,time);}
 // For the last blow Yuri holds him from a surviving screen.
 if(f.mode==='dizzy'&&f.yuri){const w=124,y=f.gy-262+Math.sin(time*3)*3;amberPath(c,f.x,y+70,f.x,f.gy-56,time);drawCasing(c,a,'med1',f.x-w/2,y,w,yur(a,3));amberFrame(c,{x:f.x-w/2,y,w,h:w*.82},time);}
 const ground={ay:1,y:f.gy+10};let name='i'+[0,1,2,3,4][Math.floor(time*6)%5],flip=false,place=null;
 if(f.mode==='enter')name='r'+Math.min(2,Math.floor((FREE.enter-f.timer)/FREE.enter*3));
 else if(f.mode==='tentacle')name='s'+Math.floor(time*8)%3;
 else if(f.mode==='volley')name=f.timer>0?'i0':'r'+(1+Math.floor(time*8)%2);
 else if(f.mode==='ramPrep'){name='w'+Math.min(2,Math.floor((1-Math.max(0,f.timer)/FREE.ramPrep)*3));flip=f.dir<0;}
 else if(f.mode==='ram'){name='m'+Math.floor(time*14)%2;flip=f.dir<0;}
 else if(f.mode==='crash'){name='c'+Math.min(2,Math.floor((FREE.crash-f.timer)/FREE.crash*3));place=ground;}
 else if(f.mode==='dizzy'){name='d'+Math.floor(time*4)%2;place=ground;}
 else if(f.mode==='hit'){name='t'+Math.min(1,Math.floor((FREE.hit-f.timer)/FREE.hit*2));}
 else if(b.hurtTime>0)name='h'+Math.floor(time*10)%2;
 free2(c,a,name,f.x,place?place.y:f.y,{flip,ay:place?1:.5});
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
 if(img?.complete&&img.naturalWidth){const w=1240,h=698,span=Math.max(1,r.width-960),k=Math.max(0,Math.min(1,(g.camera-r.x)/span)),x=g.camera-k*(w-960);c.drawImage(img,Math.round(x),-150,w,h);}
 else rect(c,r.x,0,r.width,512,'#1a0b33');
 c.save();for(let i=0;i<26;i++){const x=r.x+((i*173+time*(40+i%5*18))%r.width),y=(i*97+Math.sin(time+i)*30)%430+20;c.globalAlpha=.35+.3*(i%3)/2;rect(c,x,y,3+i%4,3+i%3,i%2?'#b77cff':'#68e8ff');}c.restore();
}
export function drawInfoshumBackdrop(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(n.stage==='free'){drawStormSky(c,a,g,time);return;}
 if(n.stage==='colossus'||n.stage==='breakout'){drawShaft(c,a,g,time);drawColossus(c,a,g,time);return;}
 if(n.stage==='assemble'){const r=rooms[g.room],bg=a.infoshumHall;if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,r.x,0,r.width,512);c.save();c.globalAlpha=Math.min(.7,n.transitionProgress*1.4);rect(c,r.x,0,r.width,512,'#05020f');c.restore();drawAssembly(c,a,g,time);return;}
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

