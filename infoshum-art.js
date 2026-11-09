import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {figureBox,SPLIT,screenCenter,beamRect,WAVE,ASCENT,ASSEMBLE,eyeBeamRect,sweepRect,debrisPieces} from './infoshum-combat.js?v=0.21.5';
import {INFOSHUM_ATLAS as AT} from './infoshum-atlas.js?v=0.21.5';
// Infoshum's three phases: the wall of monitors, the colossus climb, the doubles in the storm.
import {rooms,WIDTH} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
const VW=g=>g.viewWidth||WIDTH;
const POSE_W=190,POSE_H=204,SILENCE_W=172,SILENCE_H=192;
function cell(c,img,cw,ch,frame,cx,cy,w,{flip=false,rot=0,alpha=1}={}){if(!img)return;const h=w*ch/cw;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-w/2,-h/2,w,h);c.restore();}
// One atlas piece into a rectangle (optionally mirrored).
function piece(c,img,p,x,y,w,h,{flip=false,alpha=1}={}){if(!img||!p)return;const [sx,sy,sw,sh]=p.r;c.save();c.globalAlpha*=alpha;if(flip){c.translate(Math.round(x+w),Math.round(y));c.scale(-1,1);c.drawImage(img,sx,sy,sw,sh,0,0,Math.round(w),Math.round(h));}else c.drawImage(img,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();}
const screenState=(t,time)=>t.state==='static'?(t.role==='decoy'&&Math.floor(time*12)%5===0?0:1):t.state==='face'?(t.cracked?4:2):t.state==='charge'?(Math.floor(time*14)%2?2:3):t.state==='fire'?3:t.state==='crack'||t.state==='broken'?5:0;
// ——— Phase 1: the wall of monitors ———
// A casing with its screen: the picture goes into the casing's opening first, then the casing over it.
function drawCasing(c,a,name,x,y,w,content,{flip=false,alpha=1,shake=0}={}){
 const cs=AT.casings[name],img=a.infoshumCasings;if(!cs||!img)return;const k=w/cs.r[2],h=cs.r[3]*k;
 if(content!==null&&content!==undefined&&a.infoshumScreenStates){const s=cs.s||cs.holes?.[0];if(s){const sx=flip?cs.r[2]-s[0]-s[2]:s[0];piece(c,a.infoshumScreenStates,AT.screens['s'+content],x+sx*k-1+shake,y+s[1]*k-1,s[2]*k+2,s[3]*k+2,{alpha});}}
 for(const s of (content===null?[]:cs.holes||[]).slice(cs.s?0:1)){const sx=flip?cs.r[2]-s[0]-s[2]:s[0];piece(c,a.infoshumScreenStates,AT.screens.s0,x+sx*k,y+s[1]*k,s[2]*k,s[3]*k,{alpha});}
 piece(c,img,cs,x+shake,y,w,h,{flip,alpha});
}
const KIND_CASING={tiny:'tiny1',small:'small',med:'med1',large:'large1',huge:'huge'};
function drawScreen(c,a,t,time){
 const shake=t.state==='charge'?Math.sin(time*70)*(t.kind==='huge'?3:1.5):0;
 drawCasing(c,a,KIND_CASING[t.kind],t.x,t.y,t.w,screenState(t,time),{shake});
 // A large screen that took one paw keeps its cracks.
 if(t.cracked&&t.state==='off'){const cs=AT.casings[KIND_CASING[t.kind]],k=t.w/cs.r[2],s=cs.s;c.save();c.strokeStyle='#bff8ff';c.globalAlpha=.7;c.lineWidth=1.5;const cx=t.x+(s[0]+s[2]*.45)*k,cy=t.y+(s[1]+s[3]*.4)*k;c.beginPath();for(let i=0;i<6;i++){const ang=i*1.05+.3;c.moveTo(cx,cy);c.lineTo(cx+Math.cos(ang)*s[2]*k*.42,cy+Math.sin(ang)*s[3]*k*.5);}c.stroke();c.restore();}
}
// The heap under each tier: stacked monitors down to the floor, cables slung between the tiers.
const HEAP_THICK={lying:40,side:38,floor:30};
function drawHeapSupports(c,a,g,time){
 const img=a.infoshumCasings;if(!img)return;const tiers=g.platforms.filter(s=>s.room===g.room&&s.heap&&s.heap!=='floor'&&!s.bossHidden);
 const byIndex=i=>tiers.find(s=>s.index===i);
 for(const [i,j] of [[6,9],[9,16],[17,10],[10,8],[1,4],[5,3]]){const s1=byIndex(i),s2=byIndex(j);if(!s1||!s2)continue;const L=s1.x<s2.x?s1:s2,R=L===s1?s2:s1,x0=L.x+L.w-10,x1=R.x+10,y0=L.y+12,y1=R.y+12;
  const cs=AT.casings.cableHang;c.save();c.globalAlpha=.9;c.translate(x0,y0);c.rotate(Math.atan2(y1-y0,x1-x0));const len=Math.hypot(x1-x0,y1-y0);c.drawImage(img,cs.r[0],cs.r[1],cs.r[2],cs.r[3],-4,-6,len+8,Math.min(60,len*.38));c.restore();}
 for(const s of tiers){const w=Math.min(120,Math.max(70,s.w*.42)),cs=AT.casings.stack,h=w*cs.r[3]/cs.r[2],x=s.x+s.w/2-w/2+((s.index*37)%30-15);
  for(let y=s.y+HEAP_THICK[s.heap]-14,k=0;y<474;y+=h-8,k++){drawCasing(c,a,'stack',x+(k%2?6:-4),y,w,0,{flip:(s.index+k)%2===1});}}
}
function drawHeapTier(c,a,p,time){
 const name=p.heap==='side'?'lyingSide':'lying',cs=AT.casings[name],th=HEAP_THICK[p.heap],k=th/cs.r[3]*(p.heap==='floor'?1.05:1),tw=cs.r[2]*k,n=Math.max(1,Math.round(p.w/tw)),w=p.w/n;
 for(let i=0;i<n;i++){const cols=p.heap==='floor'?1:0;drawCasing(c,a,name,p.x+i*w-2,p.y-4,w+4,(p.index*3+i)%7===3&&Math.floor(time*1.7+i)%3===0?1:0,{flip:(p.index+i)%2===1});}
 return true;
}
// assets/infoshum-tv-beam.png: 3 cells of 220×65 — a screen's beam along its tier.
function drawTvBeam(c,a,t,time,charge=false){
 const img=a.infoshumTvBeam;if(!img)return;const r=beamRect(t),cy=r.y+r.h/2,x0=t.dir>0?r.x:r.x+r.w,th=r.h*2.2;
 c.save();c.translate(Math.round(x0),Math.round(cy));if(t.dir<0)c.scale(-1,1);
 if(charge){const k=.6+.4*Math.abs(Math.sin(time*16));c.globalAlpha=.85;c.drawImage(img,0,0,220,65,-6,-th*.5*k,90*k,th*k);}
 else{const f=1+Math.floor(time*16)%2;c.drawImage(img,f*220,0,220,65,-6,-th/2,r.w+6,th+Math.sin(time*40)*3);}
 c.restore();
}
// The huge beams (the wall, the colossus head, the eyes): infoshum-giant-beam.png, tiled along the line.
function drawGiantBeam(c,a,x,y,w,half,time,{dir=1}={}){
 const img=a.infoshumGiantBeam;if(!img)return;const p=AT.giantBeam['b'+(Math.floor(time*14)%3)],th=half*2.6,tw=p.r[2]*th/p.r[3];
 c.save();c.beginPath();c.rect(x,y-th/2-2,w,th+4);c.clip();for(let xx=dir>0?x:x+w-tw;dir>0?xx<x+w:xx>x-tw;xx+=dir*(tw-2))c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(xx),Math.round(y-th/2+Math.sin(time*40)*2),Math.round(tw),Math.round(th));c.restore();
}
function drawLineWarning(c,a,x,y,w,time){
 const img=a.infoshumGiantBeam,p=AT.giantBeam.warn;c.save();c.globalAlpha=.45+.35*Math.abs(Math.sin(time*10));
 if(img){const tw=p.r[2]*.7,th=p.r[3]*.7;for(let xx=x;xx<x+w;xx+=tw)c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(xx),Math.round(y-th/2),Math.round(tw),Math.round(th));}
 else for(let xx=x;xx<x+w;xx+=18)rect(c,xx,y-1,10,2,'#ff7ae6');c.restore();
}
function drawShards(c,a,t){const img=a.infoshumGlass;if(!img||t.shards<=0)return;const k=1-t.shards/.45,f=Math.min(2,Math.floor(k*3)),p=screenCenter(t);cell(c,img,110,72,f,p.x,p.y+k*14,Math.min(160,t.w*1.4)*(1+k*.5),{alpha:1-k*.4});}
function drawScreenMap(c,g){
 const n=g.boss.network,x0=g.camera+22,y=14,count=n.tvs.length;c.save();c.globalAlpha=.9;rect(c,x0-8,y-6,count*15+10,26,'#0b0f26');rect(c,x0-8,y-6,count*15+10,2,'#5f3f96');
 n.tvs.forEach((t,i)=>{const x=x0+i*15,lit=t.role==='face'&&['face','charge','fire'].includes(t.state),big=t.kind==='huge';rect(c,x,y-(big?2:0),12,big?14:10,big?'#c08cff':'#7a5bc4');rect(c,x+2,y+2-(big?2:0),8,big?10:6,t.state==='broken'||t.state==='crack'?'#14102a':lit?'#ff6cda':t.state==='static'?'#8fd8ff':'#3a3d6a');if(t.state==='broken'){rect(c,x+3,y+3,2,2,'#fff');rect(c,x+7,y+5,2,2,'#fff');}else if(t.hp<SCREEN_HITS(t))rect(c,x+4,y+4,4,1,'#fff');});
 c.restore();
}
const SCREEN_HITS=t=>({tiny:1,small:1,med:1,large:2,huge:3})[t.kind];
function drawWallForeground(c,a,g,time){
 const n=g.boss.network;
 for(const t of n.tvs){
  if(t.kind==='huge'){const r=beamRect(t,n);if(t.state==='charge'&&n.giantY!==null)drawLineWarning(c,a,r.x,r.y+r.h/2,r.w,time);else if(t.state==='fire')drawGiantBeam(c,a,r.x,r.y+r.h/2,r.w,WAVE.giantHalf,time);}
  else if(t.state==='charge'){const r=beamRect(t);drawLineWarning(c,a,r.x,r.y+r.h/2,r.w,time);drawTvBeam(c,a,t,time,true);}else if(t.state==='fire')drawTvBeam(c,a,t,time);
  drawShards(c,a,t);
 }
 drawScreenMap(c,g);
}
// ——— The assembly ———
function drawAssembly(c,a,g,time){
 const n=g.boss.network,k=n.transitionProgress,r=rooms[g.room],cx=r.x+768,cy=200;
 n.tvs.forEach((t,i)=>{if(t.kind==='huge')return;const q=Math.min(1,Math.max(0,(k-.05*(i%6))/.6)),e=q*q,c0=screenCenter(t),x=c0.x+(cx-c0.x)*e,y=c0.y+(cy-c0.y)*e-Math.sin(q*Math.PI)*90;
  if(q<1){c.save();c.translate(x,y);c.rotate(q*6*(i%2?1:-1));drawCasing(c,a,KIND_CASING[t.kind],-t.w*(1-q*.5)/2,-t.h*(1-q*.5)/2,t.w*(1-q*.5),5);c.restore();}});
 const huge=n.tvs.find(t=>t.kind==='huge');if(huge&&k<.55)drawCasing(c,a,'huge',huge.x,huge.y+k*30,huge.w,5,{shake:Math.sin(time*60)*k*6,alpha:1-k*1.2});
 const f=Math.min(3,Math.floor(k*4.5)),as=AT.colossus['as'+f],img=a.infoshumColossus;if(img&&as){const w=(120+k*260)*(as.r[2]/180);piece(c,img,as,cx-w/2,cy-w*as.r[3]/as.r[2]/2,w,w*as.r[3]/as.r[2]);}
 if(k>.7)drawColossusBody(c,a,g,time,(k-.7)/.3);
 if(k>.85){c.save();c.globalAlpha=(k-.85)/.15*.6;rect(c,g.camera,0,VW(g),512,'#f0d4ff');c.restore();}
}
// ——— Phase 2: the colossus climb ———
// assets/infoshum-colossus.png: the body, five head screens (calm, roar, charge, hurt, breaking open), four assembly frames.
const HEAD={x:376,y:128,w:186};
function colossusPlace(g,time){const k=1.28,body=AT.colossus.body,w=body.r[2]*k,h=body.r[3]*k,x=g.camera+VW(g)/2-w/2+(rooms[g.room].x+768-(g.camera+VW(g)/2))*.25,y=6+Math.sin(time*.9)*6;return {x,y,w,h,k};}
function drawColossusBody(c,a,g,time,alpha=1){
 const img=a.infoshumColossus;if(!img)return;const n=g.boss.network,pl=colossusPlace(g,time),asc=n.ascent;
 c.save();c.filter='brightness(.6) saturate(.85)';piece(c,img,AT.colossus.body,pl.x,pl.y+(1-alpha)*200,pl.w,pl.h,{alpha});c.restore();
 const head=asc?.head??0,hd=AT.colossus['h'+head],hw=HEAD.w*pl.k,hh=hw*hd.r[3]/hd.r[2],shake=head===1||head===4?Math.sin(time*50)*3:0;
 c.save();c.filter='brightness(.85)';piece(c,img,hd,pl.x+HEAD.x*pl.k-hw/2+shake,pl.y+(1-alpha)*200+HEAD.y*pl.k-hh/2,hw,hh,{alpha});c.restore();
}
function drawAscentSky(c,a,g,time){
 const img=a.infoshumAscent,n=g.boss.network,climbed=n.ascent?.climbed||0;
 if(img?.complete&&img.naturalWidth){const w=VW(g)+40,h=img.naturalHeight*w/img.naturalWidth,off=(climbed*.35)%h,x=g.camera-20;for(let y=off-h;y<512;y+=h-1)c.drawImage(img,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 else rect(c,g.camera,0,VW(g),512,'#1a0b33');
 c.save();for(let i=0;i<22;i++){const x=g.camera+((i*173)%VW(g)),y=((i*97+climbed*(1.2+i%4*.3)+time*40)%540)-30;c.globalAlpha=.3+.25*(i%3)/2;rect(c,x,y,2+i%3,6+i%5,i%2?'#b77cff':'#68e8ff');}c.restore();
}
function drawDebris(c,a,p,time){
 const img=a.infoshumDebris;if(!img)return false;let name=p.debris;if(p.y>ASCENT.waveTop-60)name='crumble'+(1+Math.min(2,Math.floor((p.y-(ASCENT.waveTop-60))/22)));
 const d=AT.debris[name]||AT.debris.medium,k=(p.w+10)/d.r[2],ky=Math.min(k,1.15);piece(c,img,d,p.x-5,p.y-d.top[0]*ky+2,d.r[2]*k,d.r[3]*ky);return true;
}
function drawWave(c,a,g,time){
 const img=a.infoshumNoiseWave;const top=ASCENT.waveTop-8+Math.sin(time*2)*3;
 if(!img){rect(c,g.camera,top,VW(g),80,'#2a2c9a');return;}
 const p=AT.wave['w'+Math.floor(time*8)%3],k=1.6,tw=p.r[2]*k,th=p.r[3]*k,off=(time*40)%tw;
 for(let x=g.camera-off-tw;x<g.camera+VW(g)+tw;x+=tw-2)c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(x),Math.round(top-12),Math.round(tw),Math.round(th));
 rect(c,g.camera,top-12+th-4,VW(g),80,'#090624');
}
function drawDrop(c,a,d,time){
 const img=a.infoshumFallingTv;if(!img)return;
 if(d.state==='warn'){c.save();c.globalAlpha=.3+.35*Math.abs(Math.sin(time*12));rect(c,d.x-26,d.ty-3,52,4,'#ff6cda');for(let y=0;y<d.ty-20;y+=26)rect(c,d.x-1,y+((time*90)%26),2,12,'#ff9df0');c.restore();return;}
 const f=d.state==='fall'?0:d.state==='impact'?1:2,k=.42,alpha=d.state==='wreck'?Math.min(1,(ASCENT.wreck-d.time)/.4):1;
 c.save();c.globalAlpha=alpha;c.translate(Math.round(d.x),Math.round(d.y));if(d.state==='fall')c.rotate(Math.sin(time*9+d.x)*.25);c.drawImage(img,f*200,0,200,160,-100*k,-(f?152:125)*k,200*k,160*k);c.restore();
}
// assets/infoshum-eye-relay.png: closed, aiming, firing, stunned (the weak moment), cracked, bursting. Head centre at (70,58) of 118×210.
function drawEye(c,a,e,time){
 const img=a.infoshumEyeRelay;if(!img)return;const f={fly:0,leave:0,aim:1,fire:2,stunned:3,cracked:4,boom:5}[e.state]??0,p=AT.eye['e'+f],k=ASCENT.eyeHead/92;
 const bob=['fly','aim','stunned'].includes(e.state)?Math.sin(time*5)*2:0,flip=e.side<0;
 const w=p.r[2]*k,h=p.r[3]*k,ox=(flip?p.r[2]-70:70)*k;piece(c,img,p,e.x-ox,e.y-58*k+bob,w,h,{flip});
}
function drawColossusForeground(c,a,g,time){
 const n=g.boss.network,s=n.ascent;if(!s)return;
 for(const d of n.drops)drawDrop(c,a,d,time);
 const e=s.eye;if(e){if(e.state==='aim'){const r=eyeBeamRect(e);drawLineWarning(c,a,r.x,r.y+r.h/2,r.w,time);}drawEye(c,a,e,time);if(e.state==='fire'){const r=eyeBeamRect(e);drawGiantBeam(c,a,r.x,r.y+r.h/2,r.w,ASCENT.eyeHalf,time,{dir:e.dir});}}
 if(s.beamMode==='aim'){const r=sweepRect(s);drawLineWarning(c,a,g.camera,r.y+r.h/2,VW(g),time);}
 else if(s.beamMode==='sweep'){const r=sweepRect(s);drawGiantBeam(c,a,g.camera-10,r.y+r.h/2,VW(g)+20,ASCENT.sweepHalf,time);}
 drawWave(c,a,g,time);
 if(s.flash>0){c.save();c.globalAlpha=Math.min(.4,s.flash*1.4);rect(c,g.camera,0,VW(g),512,'#f5d6ff');c.restore();}
 if(n.stage==='breakout'){const k=n.transitionProgress,pl=colossusPlace(g,time),hx=pl.x+HEAD.x*pl.k,hy=pl.y+HEAD.y*pl.k;if(k>.45)drawAttackFx(c,a,'burst',Math.min(3,Math.floor((k-.45)*8)),hx,hy,200+k*300,{alpha:Math.max(0,1.2-k)});if(k>.8){c.save();c.globalAlpha=(k-.8)/.2*.7;rect(c,g.camera,0,VW(g),512,'#f5d6ff');c.restore();}}
}
// ——— Phase 3: the doubles in the storm ———
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
// ——— Phase 3: the storm (assets/infoshum-storm.jpg, infoshum-storm-platforms.png: slab, cracked slab, slab with a terminal) ———
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
 const r=rooms[g.room];
 if(n.stage==='noise'){drawStormSky(c,a,g,time);return;}
 if(n.stage==='colossus'||n.stage==='breakout'){drawAscentSky(c,a,g,time);drawColossusBody(c,a,g,time);return;}
 const bg=a.infoshumWallBg;if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,r.x,0,r.width,512);else rect(c,r.x,0,r.width,512,'#120a2a');
 if(n.stage==='assemble'){c.save();c.globalAlpha=Math.max(0,1-n.transitionProgress*1.6);drawHeapSupports(c,a,g,time);c.restore();c.save();c.globalAlpha=Math.min(.6,n.transitionProgress);rect(c,r.x,0,r.width,512,'#05020f');c.restore();drawAssembly(c,a,g,time);return;}
 drawHeapSupports(c,a,g,time);
 for(const t of n.tvs)drawScreen(c,a,t,time);
}
export function drawInfoshumPlatform(c,a,p,time){
 if(p.heap&&drawHeapTier(c,a,p,time))return;
 if(p.debris&&drawDebris(c,a,p,time))return;
 if(p.storm!==undefined&&drawStormIsland(c,a,p))return;
 if(!a.infoshumPlatform?.complete||p.infoshumStep)return;
 const image=a.infoshumPlatform,scale=30/177,cap=Math.min(140*scale,p.w/3),y=p.y-3;
 c.drawImage(image,22,299,140,177,p.x,y,cap,30);
 for(let x=cap;x<p.w-cap;x+=300*scale){const w=Math.min(300*scale,p.w-cap-x);c.drawImage(image,430,299,w/scale,177,p.x+x,y,w,30);}
 c.drawImage(image,2011,299,140,177,p.x+p.w-cap,y,cap,30);
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(n.stage==='network'){drawWallForeground(c,a,g,time);return;}
 if(n.stage==='colossus'||n.stage==='breakout'){drawColossusForeground(c,a,g,time);return;}
 if(n.stage==='noise'){drawNoise(c,a,g,time);return;}
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

