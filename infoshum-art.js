import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {screenCenter,beamRect,realScreen,WAVE,COL,FREE,FLOOR,headBox} from './infoshum-combat.js?v=0.21.5';
import {INFOSHUM_ATLAS as AT} from './infoshum-atlas.js?v=0.21.5';
// Infoshum's three phases: the sea of screens with Yuri, the colossus and his hands, the free creature in the storm.
import {rooms,WIDTH} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
const VW=g=>g.viewWidth||WIDTH;
const POSE_W=190,POSE_H=204,SILENCE_W=172,SILENCE_H=192;
function cell(c,img,cw,ch,frame,cx,cy,w,{flip=false,rot=0,alpha=1}={}){if(!img)return;const h=w*ch/cw;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-w/2,-h/2,w,h);c.restore();}
// One atlas piece into a rectangle (optionally mirrored).
function piece(c,img,p,x,y,w,h,{flip=false,alpha=1}={}){if(!img||!p)return;const [sx,sy,sw,sh]=p.r;c.save();c.globalAlpha*=alpha;if(flip){c.translate(Math.round(x+w),Math.round(y));c.scale(-1,1);c.drawImage(img,sx,sy,sw,sh,0,0,Math.round(w),Math.round(h));}else c.drawImage(img,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();}
// ——— Phase 1: the sea of screens ———
// What a screen shows: his face (assets/infoshum-screen-states.png) or Yuri (assets/infoshum-yuri.png: calm, points right,
// points left, holds him back, smiles, worried, breaking up, amber noise).
const scr=(a,i)=>[a.infoshumScreenStates,AT.screens['s'+i]],yur=(a,i)=>[a.infoshumYuri,AT.yuri['y'+i]];
function screenPic(a,t,time){
 if(t.pop>0)return scr(a,1);
 switch(t.state){
  case 'static':return scr(a,Math.floor(time*12+t.index)%6===0?0:1);
  case 'face':case 'held':return scr(a,2);
  case 'charge':return scr(a,Math.floor(time*14)%2?2:3);
  case 'fire':return scr(a,3);
  case 'glitch':return yur(a,Math.floor(time*10)%2?6:7);
  case 'yuri':return yur(a,t.kind==='huge'?3:t.point>0?1:2);
  case 'hold':return yur(a,3);
  case 'crack':case 'broken':return scr(a,5);
  default:return scr(a,0);
 }
}
// A casing with its screen: the picture goes into the casing's opening first, then the casing over it.
function drawCasing(c,a,name,x,y,w,pic,{flip=false,alpha=1,shake=0}={}){
 const cs=AT.casings[name],img=a.infoshumCasings;if(!cs||!img)return;const k=w/cs.r[2],h=cs.r[3]*k,holes=cs.s?[cs.s]:cs.holes||[];
 holes.forEach((s,i)=>{const q=i===0&&pic?pic:scr(a,0);if(!q[0]||!q[1])return;const sx=flip?cs.r[2]-s[0]-s[2]:s[0];piece(c,q[0],q[1],x+sx*k-1+shake,y+s[1]*k-1,s[2]*k+2,s[3]*k+2,{alpha});});
 piece(c,img,cs,x+shake,y,w,h,{flip,alpha});
}
const KIND_CASING={tiny:'tiny1',small:'small',med:'med1',large:'large1',huge:'huge'};
function amberFrame(c,t,time,pad=0){c.save();c.strokeStyle='#ffc45e';c.shadowColor='#ffb347';c.shadowBlur=14;c.lineWidth=pad?3:2;c.globalAlpha=.65+.3*Math.sin(time*8);c.strokeRect(t.x-pad+1,t.y-pad+1,t.w+pad*2-2,t.h+pad*2-2);c.restore();}
function amberPath(c,x0,y0,x1,y1,time){c.save();c.strokeStyle='#ffc45e';c.shadowColor='#ffb347';c.shadowBlur=10;c.lineWidth=3;c.globalAlpha=.55+.25*Math.sin(time*8);c.setLineDash?.([10,8]);c.lineDashOffset=-time*60;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function drawScreen(c,a,t,time){
 const shake=t.state==='charge'?Math.sin(time*70)*(t.kind==='huge'?3:1.5):0;
 drawCasing(c,a,KIND_CASING[t.kind],t.x,t.y,t.w,screenPic(a,t,time),{shake});
 // The huge wall keeps the cracks of the paws it took.
 if(t.cracked&&!['crack','broken'].includes(t.state)){const cs=AT.casings.huge,k=t.w/cs.r[2],s=cs.s;c.save();c.strokeStyle='#bff8ff';c.globalAlpha=.7;c.lineWidth=1.5;const n=3-t.hp;for(let j=0;j<n;j++){const cx=t.x+(s[0]+s[2]*(.3+.35*j))*k,cy=t.y+(s[1]+s[3]*.45)*k;c.beginPath();for(let i=0;i<6;i++){const ang=i*1.05+.3+j;c.moveTo(cx,cy);c.lineTo(cx+Math.cos(ang)*s[3]*k*.6,cy+Math.sin(ang)*s[3]*k*.48);}c.stroke();}c.restore();}
 if(['yuri','hold'].includes(t.state))amberFrame(c,t,time);
}
// The heap under each tier: stacked monitors down to the floor, cables slung between the tiers.
const HEAP_THICK={lying:40,side:38,floor:30};
function drawHeapSupports(c,a,g,time){
 const img=a.infoshumCasings;if(!img)return;const tiers=g.platforms.filter(s=>s.room===g.room&&s.heap&&s.heap!=='floor'&&!s.bossHidden);
 const byIndex=i=>tiers.find(s=>s.index===i);
 for(const [i,j] of [[6,9],[9,16],[17,10],[10,8],[1,4],[5,3]]){const s1=byIndex(i),s2=byIndex(j);if(!s1||!s2)continue;const L=s1.x<s2.x?s1:s2,R=L===s1?s2:s1,x0=L.x+L.w-10,x1=R.x+10,y0=L.y+12,y1=R.y+12;
  const cs=AT.casings.cableHang;c.save();c.globalAlpha=.9;c.translate(x0,y0);c.rotate(Math.atan2(y1-y0,x1-x0));const len=Math.hypot(x1-x0,y1-y0);c.drawImage(img,cs.r[0],cs.r[1],cs.r[2],cs.r[3],-4,-6,len+8,Math.min(60,len*.38));c.restore();}
 for(const s of tiers){const w=Math.min(120,Math.max(70,s.w*.42)),cs=AT.casings.stack,h=w*cs.r[3]/cs.r[2],x=s.x+s.w/2-w/2+((s.index*37)%30-15);
  for(let y=s.y+HEAP_THICK[s.heap]-14,k=0;y<474;y+=h-8,k++)drawCasing(c,a,'stack',x+(k%2?6:-4),y,w,scr(a,(s.index+k)%3===0?2:0),{flip:(s.index+k)%2===1});}
}
function drawHeapTier(c,a,p,time){
 const name=p.heap==='side'?'lyingSide':'lying',cs=AT.casings[name],th=HEAP_THICK[p.heap],k=th/cs.r[3]*(p.heap==='floor'?1.05:1),tw=cs.r[2]*k,n=Math.max(1,Math.round(p.w/tw)),w=p.w/n;
 for(let i=0;i<n;i++)drawCasing(c,a,name,p.x+i*w-2,p.y-4,w+4,scr(a,(p.index*3+i)%7===3&&Math.floor(time*1.7+i)%3===0?1:0),{flip:(p.index+i)%2===1});
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
// The big beams (the wall, the colossus head): infoshum-giant-beam.png, tiled along the line.
function drawGiantBeam(c,a,x,y,w,half,time,{dir=1}={}){
 const img=a.infoshumGiantBeam;if(!img)return;const p=AT.giantBeam['b'+(Math.floor(time*14)%3)],th=half*2.6,tw=p.r[2]*th/p.r[3];
 c.save();c.beginPath();c.rect(x,y-th/2-2,w,th+4);c.clip();for(let xx=dir>0?x:x+w-tw;dir>0?xx<x+w:xx>x-tw;xx+=dir*(tw-2))c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(xx),Math.round(y-th/2+Math.sin(time*40)*2),Math.round(tw),Math.round(th));c.restore();
}
function drawLineWarning(c,a,x,y,w,time){
 const img=a.infoshumGiantBeam,p=AT.giantBeam.warn;c.save();c.globalAlpha=.45+.35*Math.abs(Math.sin(time*10));
 if(img){const tw=p.r[2]*.7,th=p.r[3]*.7;for(let xx=x;xx<x+w;xx+=tw)c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(xx),Math.round(y-th/2),Math.round(tw),Math.round(th));}
 else for(let xx=x;xx<x+w;xx+=18)rect(c,xx,y-1,10,2,'#ff7ae6');c.restore();
}
// A ray from a point to a point (the colossus head's beam): a dashed line while it charges.
function drawRay(c,a,x0,y0,x1,y1,half,time,warn){const len=Math.hypot(x1-x0,y1-y0);c.save();c.translate(x0,y0);c.rotate(Math.atan2(y1-y0,x1-x0));if(warn)drawLineWarning(c,a,0,0,len,time);else drawGiantBeam(c,a,0,0,len,half,time);c.restore();}
function drawShards(c,a,t){const img=a.infoshumGlass;if(!img||t.shards<=0)return;const k=1-t.shards/.45,f=Math.min(2,Math.floor(k*3)),p=screenCenter(t);cell(c,img,110,72,f,p.x,p.y+k*14,Math.min(160,t.w*1.4)*(1+k*.5),{alpha:1-k*.4});}
function drawSeaForeground(c,a,g,time){
 const n=g.boss.network,real=realScreen(n);
 for(const t of n.tvs){
  if(t.kind==='huge'){const r=beamRect(t,n);if(t.state==='charge'&&n.giantY!==null)drawLineWarning(c,a,r.x,r.y+r.h/2,r.w,time);else if(t.state==='fire')drawGiantBeam(c,a,r.x,r.y+r.h/2,r.w,WAVE.giantHalf,time);}
  else if(t.state==='charge'&&t.role==='real'){const r=beamRect(t);drawLineWarning(c,a,r.x,r.y+r.h/2,r.w,time);drawTvBeam(c,a,t,time,true);}else if(t.state==='fire')drawTvBeam(c,a,t,time);
  drawShards(c,a,t);
 }
 // Yuri's light: an amber path from his screens to the real one; while he holds him, the screen is framed in amber.
 if(real&&n.yuriOn){const rc=screenCenter(real);for(const i of n.yuri){const t=n.tvs[i];if(!['yuri','hold'].includes(t.state))continue;const p=screenCenter(t);amberPath(c,p.x,p.y,rc.x,rc.y,time);}
  if(real.state==='held')amberFrame(c,real,time,5);}
}
// ——— The assembly ———
function drawAssembly(c,a,g,time){
 const n=g.boss.network,k=n.transitionProgress,r=rooms[g.room],cx=r.x+768,cy=200;
 n.tvs.forEach((t,i)=>{if(t.kind==='huge')return;const q=Math.min(1,Math.max(0,(k-.04*(i%8))/.6)),e=q*q,c0=screenCenter(t),x=c0.x+(cx-c0.x)*e,y=c0.y+(cy-c0.y)*e-Math.sin(q*Math.PI)*90;
  if(q<1){c.save();c.translate(x,y);c.rotate(q*6*(i%2?1:-1));drawCasing(c,a,KIND_CASING[t.kind],-t.w*(1-q*.5)/2,-t.h*(1-q*.5)/2,t.w*(1-q*.5),scr(a,5));c.restore();}});
 const huge=n.tvs.find(t=>t.kind==='huge');if(huge&&k<.55)drawCasing(c,a,'huge',huge.x,huge.y+k*30,huge.w,scr(a,5),{shake:Math.sin(time*60)*k*6,alpha:Math.max(0,1-k*1.8)});
 const f=Math.min(3,Math.floor(k*4.5)),as=AT.colossus['as'+f],img=a.infoshumColossus;if(img&&as&&k<.8){const w=(120+k*260)*(as.r[2]/180);piece(c,img,as,cx-w/2,cy-w*as.r[3]/as.r[2]/2,w,w*as.r[3]/as.r[2]);}
 if(k>.65)drawTorso(c,a,g,time,Math.min(1,(k-.65)/.3));
 if(k>.88){c.save();c.globalAlpha=(k-.88)/.12*.6;rect(c,g.camera,0,VW(g),512,'#f0d4ff');c.restore();}
}
// ——— Phase 2: the colossus ———
// assets/infoshum-colossus-parts.png (packed at 0.75): the torso with the head, a raised and a stuck fist for each hand,
// a sweeping arm, a smashed knuckle monitor, the collapsed colossus, three shockwave frames, dust, a fist's shadow.
// The other head screens (roar, charge, hurt) come from assets/infoshum-colossus.png.
const PK=1.4;
function part(c,a,name,cx,by,{k=PK,flip=false,alpha=1}={}){const p=AT.parts[name],img=a.infoshumParts;if(!p||!img)return null;const w=p.r[2]*k,h=p.r[3]*k;piece(c,img,p,cx-w/2,by-h,w,h,{flip,alpha});return {x:cx-w/2,y:by-h,w,h};}
function torsoPlace(g,time){const p=AT.parts.torso,w=p.r[2]*PK,h=p.r[3]*PK,x=rooms[g.room].x+768-w/2,y=FLOOR-h+14+Math.sin(time*.9)*5;return {x,y,w,h,hx:x+w*270/515,hy:y+h*137/422,hw:w*205/515,sl:{x:x+w*.2,y:y+h*.55},sr:{x:x+w*.8,y:y+h*.55}};}
function drawTorso(c,a,g,time,alpha=1){
 const img=a.infoshumParts;if(!img)return;const col=g.boss.network.col,pl=torsoPlace(g,time),dy=(1-alpha)*220;
 piece(c,img,AT.parts.torso,pl.x,pl.y+dy,pl.w,pl.h,{alpha});
 const head=col?.head||0;if(head&&a.infoshumColossus){const hd=AT.colossus['h'+head],hh=pl.hw*hd.r[3]/hd.r[2],shake=head===1?Math.sin(time*50)*3:0;piece(c,a.infoshumColossus,hd,pl.hx-pl.hw/2+shake,pl.hy+dy-hh/2,pl.hw,hh,{alpha});}
}
function drawCollapsed(c,a,g,time){const p=AT.parts.collapsed,w=814,h=w*p.r[3]/p.r[2],x=rooms[g.room].x+768-w/2;piece(c,a.infoshumParts,p,x+(g.boss.hurtTime>0?Math.sin(time*60)*3:0),FLOOR-h*237/256+2,w,h);}
function cable(c,x0,y0,x1,y1,wid=18){c.save();c.lineCap='round';c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(x1+(x0-x1)*.25,Math.min(y0,y1)-50,x1,y1);c.strokeStyle='#1c1030';c.lineWidth=wid+6;c.stroke();c.strokeStyle='#4a2878';c.lineWidth=wid;c.stroke();c.strokeStyle='#9a3bd0';c.lineWidth=3;c.stroke();c.restore();}
function drawFist(c,a,g,time){
 const f=g.boss.network.col.fist;if(!f)return;const pl=torsoPlace(g,time),sh=f.x<pl.x+pl.w/2?pl.sl:pl.sr;
 if(f.state==='aim'||f.state==='lock'){const shake=f.state==='lock'?Math.sin(time*80)*3:0;cable(c,sh.x,sh.y,f.x,-10);part(c,a,'raise'+f.side,f.x+shake,150);return;}
 const p=AT.parts['stuck'+f.side],h=p.r[3]*PK,by=FLOOR+f.y+h*.143;cable(c,sh.x,sh.y,f.x,by-h+24);part(c,a,'stuck'+f.side,f.x,by);
 if(!f.weak&&f.state!=='fall')part(c,a,'knuckle',f.x,FLOOR+f.y-6,{k:.55});
}
function drawSweep(c,a,g,time){const s=g.boss.network.col.sweep;if(!s||s.state==='warn')return;const yc=s.low?FLOOR-24:FLOOR-64,p=AT.parts.sweep,w=210,h=w*p.r[3]/p.r[2];
 cable(c,s.x-s.dir*70,yc,s.x-s.dir*900,yc-60,26);piece(c,a.infoshumParts,p,s.x-w/2,yc-h/2,w,h,{flip:s.dir<0});}
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
 const img=a.infoshumBreakout;if(!img)return;const f=breakoutFrame(progress),box=BREAK[f],h=headBox(g),cx=h.x+h.w/2,cy=h.y+h.h/2-30-(f>=4?(progress-.64)/.36*70:0);
 const base=.95,k=base*(f>=4?1.25+.15*(f-4):1),shake=f===2?Math.sin(time*90)*4:f<2?Math.sin(time*60)*progress*6:0;
 c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(cx-box[2]*k/2+shake),Math.round(cy-box[3]*k/2),Math.round(box[2]*k),Math.round(box[3]*k));
 if(f>=2&&f<=4){const s=BREAK[7],spread=Math.min(1,(progress-.38)/.4),sk=base*(.8+spread*.9);c.save();c.globalAlpha=1-spread*.7;c.drawImage(img,s[0],s[1],s[2],s[3],Math.round(cx-s[2]*sk/2),Math.round(cy-s[3]*sk/2),Math.round(s[2]*sk),Math.round(s[3]*sk));c.restore();}
 if(f===2){c.save();c.globalAlpha=.6*(1-(progress-.38)/.12);rect(c,g.camera,0,VW(g),512,'#ffe4fb');c.restore();}
 if(progress>.9){c.save();c.globalAlpha=(progress-.9)/.1*.8;rect(c,g.camera,0,VW(g),512,'#f5d6ff');c.restore();}
}
function drawColossusForeground(c,a,g,time){
 const n=g.boss.network,col=n.col;if(!col)return;const img=a.infoshumParts,f=col.fist;
 if(f&&(f.state==='aim'||f.state==='lock')){const lock=f.state==='lock',p=AT.parts.shadow,w=lock?170:120+50*Math.abs(Math.sin(time*6)),h=w*p.r[3]/p.r[2];piece(c,img,p,f.x-w/2,FLOOR-h/2+4,w,h,{alpha:lock?.95:.55});if(lock)drawLineWarning(c,a,f.x-70,FLOOR-6,140,time);}
 for(const s of col.shocks){const p=AT.parts['shock'+Math.min(2,Math.floor(s.travel/50))],w=84,h=w*p.r[3]/p.r[2];piece(c,img,p,s.x-w/2,FLOOR-h+12,w,h,{alpha:Math.max(.25,1-s.travel/COL.shockRange)});}
 if(col.dust){const p=AT.parts.dust,k=col.dust.time/.45,w=180*(1+k*.5),h=w*p.r[3]/p.r[2];piece(c,img,p,col.dust.x-w/2,FLOOR-h+14,w,h,{alpha:1-k});}
 const s=col.sweep;if(s&&s.state==='warn'){const y=s.low?FLOOR-22:FLOOR-62;drawLineWarning(c,a,g.camera,y,VW(g),time);}
 const m=col.beam;if(m&&n.stage==='colossus'){const pl=torsoPlace(g,time);drawRay(c,a,pl.hx,pl.hy,m.x,FLOOR,COL.beamHalf,time,m.state==='charge');}
 if(col.flash>0){c.save();c.globalAlpha=Math.min(.4,col.flash*1.4);rect(c,g.camera,0,VW(g),512,'#f5d6ff');c.restore();}
 if(n.stage==='breakout')drawBreakout(c,a,g,n.transitionProgress,time);
}
// ——— Phase 3: free in the storm ———
// assets/infoshum-free.png (packed at 0.6): hover ×2, roar, ram wind-up, ram, crashed, dizzy ×2, hurt, three bodies with
// fewer tentacles, a crack in the ground, a tentacle bursting out, three frames of headline shards.
const FS=1.35;
function freePiece(c,a,name,cx,cy,{flip=false,alpha=1,ay=.5,k=FS}={}){const p=AT.free[name],img=a.infoshumFree;if(!p||!img)return;const w=p.r[2]*k,h=p.r[3]*k;piece(c,img,p,cx-w/2,cy-h*ay,w,h,{flip,alpha});}
function drawFree(c,a,g,time){
 const b=g.boss,f=b.network.free;if(!f)return;
 for(const t of f.tentacles){if(t.state==='warn')freePiece(c,a,'crack',t.x,t.y+2,{k:.5,alpha:.6+.4*Math.abs(Math.sin(time*12))});
  else{const k=Math.min(1,t.time/.1)*(t.time>FREE.tentUp-.15?Math.max(0,(FREE.tentUp-t.time)/.15):1),p=AT.free.tent,w=p.r[2]*.62,h=p.r[3]*.62*k;piece(c,a.infoshumFree,p,t.x-w/2,t.y+10-h,w,h);}}
 for(const s of f.shards)freePiece(c,a,'sh'+Math.floor(time*12)%3,s.x,s.y,{k:.42,flip:s.vx<0});
 if(f.mode==='ramPrep'){const x0=Math.min(f.tx,f.ex),x1=Math.max(f.tx,f.ex);drawLineWarning(c,a,x0,f.ty,x1-x0,time);}
 // For the last blow Yuri holds him from a surviving screen.
 if(f.mode==='dizzy'&&f.yuri){const w=124,y=f.gy-262+Math.sin(time*3)*3;amberPath(c,f.x,y+70,f.x,f.gy-56,time);drawCasing(c,a,'med1',f.x-w/2,y,w,yur(a,3));amberFrame(c,{x:f.x-w/2,y,w,h:w*.82},time);}
 const idle=f.hits>=2?'t1':f.hits===1?'t2':'i'+Math.floor(time*3)%2;let name=idle,ay=.5,flip=false,y=f.y;
 if(f.mode==='enter')name='roar';else if(f.mode==='ramPrep'){name='prep';flip=f.dir<0;}else if(f.mode==='ram'){name='ram';flip=f.dir<0;}
 else if(f.mode==='crash'){name='crash';ay=1;y=f.gy+8;}else if(f.mode==='dizzy'){name='d'+Math.floor(time*4)%2;ay=1;y=f.gy+6;}else if(f.mode==='hit'||b.hurtTime>0)name='hurt';
 else if(f.mode==='tentacle'&&!f.hits)name='roar';
 freePiece(c,a,name,f.x,y,{flip,ay});
 if(f.flash>0){c.save();c.globalAlpha=Math.min(.4,f.flash*1.4);rect(c,g.camera,0,VW(g),512,'#f5d6ff');c.restore();}
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
 const r=rooms[g.room];
 if(n.stage==='free'){drawStormSky(c,a,g,time);return;}
 if(n.stage==='colossus'||n.stage==='breakout'){drawShaft(c,a,g,time);if(n.col.mode==='collapse')drawCollapsed(c,a,g,time);else{drawTorso(c,a,g,time);drawFist(c,a,g,time);drawSweep(c,a,g,time);}return;}
 const bg=a.infoshumSea;if(bg?.complete&&bg.naturalWidth)c.drawImage(bg,r.x,0,r.width,512);else rect(c,r.x,0,r.width,512,'#120a2a');
 if(n.stage==='assemble'){c.save();c.globalAlpha=Math.max(0,1-n.transitionProgress*1.6);drawHeapSupports(c,a,g,time);c.restore();c.save();c.globalAlpha=Math.min(.6,n.transitionProgress);rect(c,r.x,0,r.width,512,'#05020f');c.restore();drawAssembly(c,a,g,time);return;}
 drawHeapSupports(c,a,g,time);
 for(const t of n.tvs)drawScreen(c,a,t,time);
}
export function drawInfoshumPlatform(c,a,p,time){
 if(p.heap&&drawHeapTier(c,a,p,time))return;
 if(p.storm!==undefined&&drawStormIsland(c,a,p))return;
 if(!a.infoshumPlatform?.complete||p.infoshumStep)return;
 const image=a.infoshumPlatform,scale=30/177,cap=Math.min(140*scale,p.w/3),y=p.y-3;
 c.drawImage(image,22,299,140,177,p.x,y,cap,30);
 for(let x=cap;x<p.w-cap;x+=300*scale){const w=Math.min(300*scale,p.w-cap-x);c.drawImage(image,430,299,w/scale,177,p.x+x,y,w,30);}
 c.drawImage(image,2011,299,140,177,p.x+p.w-cap,y,cap,30);
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(n.stage==='network'){drawSeaForeground(c,a,g,time);return;}
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

