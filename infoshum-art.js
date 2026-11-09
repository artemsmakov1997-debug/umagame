import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {drawBreakout} from './infoshum-anim-art.js?v=0.21.5';
import {figureBox,SPLIT,ARRIVE,screenCenter,beamRect,WAVE,STORM,coreCenter} from './infoshum-combat.js?v=0.21.5';
// Infoshum's three phases: the room of screens, the doubles, the storm around the core.
import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
const POSE_W=190,POSE_H=204,SILENCE_W=172,SILENCE_H=192;
function cell(c,img,cw,ch,frame,cx,cy,w,{flip=false,rot=0,alpha=1}={}){if(!img)return;const h=w*ch/cw;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-w/2,-h/2,w,h);c.restore();}
// ——— Phase 1: the screens ———
// assets/infoshum-wall-tv.png: 6 cells of 190×168 — off, static, his face, charging, cracked, smashed (frame at 37..181 × 13..142).
// assets/infoshum-floor-tv.png: 6 cells of 136×97, the same states (body at 17..111 × 5..91).
const TV_ART={wall:{img:'infoshumWallTv',cw:190,ch:168,bx:37,by:13,bw:144},floor:{img:'infoshumFloorTv',cw:136,ch:97,bx:17,by:5,bw:94}};
const TV_FRAME={off:0,static:1,face:2,charge:3,fire:3,crack:4,broken:5};
function drawScreen(c,a,t,time){
 const art=TV_ART[t.kind],img=a[art.img];if(!img)return false;const k=t.w/art.bw;let f=TV_FRAME[t.state]??0;
 if(t.state==='static'&&t.role==='decoy'&&Math.floor(time*12)%5===0)f=0;
 if(t.state==='charge'&&Math.floor(time*14)%2)f=2;
 const shake=t.state==='charge'?Math.sin(time*70)*1.5:0;
 c.drawImage(img,f*art.cw,0,art.cw,art.ch,Math.round(t.x-art.bx*k+shake),Math.round(t.y-art.by*k),Math.round(art.cw*k),Math.round(art.ch*k));return true;
}
// assets/infoshum-tv-beam.png: 3 cells of 220×65 — the spark at the emitter, the beam half out, the full beam.
function drawTvBeam(c,a,t,time,charge=false){
 const img=a.infoshumTvBeam;if(!img)return;const r=beamRect(t),cy=r.y+r.h/2,x0=t.dir>0?r.x:r.x+r.w;
 c.save();c.translate(Math.round(x0),Math.round(cy));if(t.dir<0)c.scale(-1,1);
 if(charge){const k=.6+.4*Math.abs(Math.sin(time*16));c.globalAlpha=.85;c.drawImage(img,0,0,220,65,-6,-16*k,90*k,32*k);}
 else{const f=1+Math.floor(time*16)%2,th=34+Math.sin(time*40)*3;c.drawImage(img,f*220,0,220,65,-6,-th/2,r.w+6,th);}
 c.restore();
}
// A dashed line where the beam will go, while the screen charges.
function drawBeamWarning(c,t,time){const r=beamRect(t),cy=r.y+r.h/2;c.save();c.globalAlpha=.35+.25*Math.abs(Math.sin(time*10));for(let x=0;x<r.w;x+=18)rect(c,(t.dir>0?r.x+x:r.x+r.w-x-10),cy-1,10,2,'#ff7ae6');c.restore();}
function drawShards(c,a,t){const img=a.infoshumGlass;if(!img||t.shards<=0)return;const k=1-t.shards/.45,f=Math.min(2,Math.floor(k*3)),p=screenCenter(t);cell(c,img,110,72,f,p.x,p.y+k*14,t.w*1.4*(1+k*.5),{alpha:1-k*.4});}
// Ten screens at the top-left: grey — whole, pink — he is in it, crossed — smashed.
function drawScreenMap(c,g){
 const n=g.boss.network,x0=g.camera+22,y=14;c.save();c.globalAlpha=.9;rect(c,x0-8,y-6,10*15+10,26,'#0b0f26');rect(c,x0-8,y-6,10*15+10,2,'#5f3f96');
 n.tvs.forEach((t,i)=>{const x=x0+i*15,lit=['face','charge','fire'].includes(t.state);rect(c,x,y,12,10,'#7a5bc4');rect(c,x+2,y+2,8,6,t.state==='broken'||t.state==='crack'?'#14102a':lit?'#ff6cda':t.state==='static'?'#8fd8ff':'#3a3d6a');if(t.state==='broken'){rect(c,x+3,y+3,2,2,'#fff');rect(c,x+7,y+5,2,2,'#fff');}});
 c.restore();
}
function drawScreensForeground(c,a,g,time){
 const n=g.boss.network;
 for(const t of n.tvs){if(t.state==='charge'){drawBeamWarning(c,t,time);drawTvBeam(c,a,t,time,true);}else if(t.state==='fire')drawTvBeam(c,a,t,time);drawShards(c,a,t);}
 drawScreenMap(c,g);
}
// ——— Phase 2: the doubles ———
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
// ——— Phase 3: the storm ———
// assets/infoshum-storm-core.png: 6 cells of 240×210 — the caged core ×2, charging (a swirl), hit, bursting, fading.
// assets/infoshum-falling-tv.png: 3 cells of 200×160 — falling, the impact, the wreck.
// assets/infoshum-storm-platforms.png: 3 cells of 290×120 — a slab, a cracked slab, a slab with a terminal (top at y 21).
const PLAT=[[6,273],[27,241],[47,192]],PLAT_TOP=22;
function drawStormIsland(c,a,p){
 const img=a.infoshumStormPlatforms;if(!img)return false;const [sx,sw]=PLAT[p.storm]||PLAT[0],kx=(p.w+14)/sw,ky=Math.min(.78,Math.max(.5,kx));
 c.drawImage(img,p.storm*290+sx,0,sw,120,Math.round(p.x-7),Math.round(p.y-PLAT_TOP*ky+2),Math.round(sw*kx),Math.round(120*ky));return true;
}
function coreFrame(s,b,time){if(s.mode==='burst')return s.timer>STORM.burst*.45?4:5;if(b.hurtTime>0||s.mode==='hit')return 3;if(s.mode==='charge'||s.mode==='beam')return 2;return Math.floor(time*3)%2;}
function drawColumn(c,a,s,time,charge){
 const x=s.beamX??s.x,top=s.y+40,len=520-top;
 if(charge){c.save();c.globalAlpha=.18+.18*Math.abs(Math.sin(time*12));rect(c,x-STORM.beamHalf,top,STORM.beamHalf*2,len,'#ff5ae0');c.globalAlpha=.7;for(let y=top;y<480;y+=22)rect(c,x-2,y,4,10,'#ffd2fa');c.restore();return;}
 const img=a.infoshumTvBeam;if(!img)return;const f=1+Math.floor(time*16)%2,th=STORM.beamHalf*2+14+Math.sin(time*40)*5;
 c.save();c.translate(Math.round(x),Math.round(top-20));c.rotate(Math.PI/2);c.drawImage(img,f*220,0,220,65,0,-th/2,len+20,th);c.restore();
}
function drawDrop(c,a,d,time){
 const img=a.infoshumFallingTv;if(!img)return;
 if(d.state==='warn'){c.save();c.globalAlpha=.3+.35*Math.abs(Math.sin(time*12));rect(c,d.x-26,d.ty-3,52,4,'#ff6cda');for(let y=0;y<d.ty-20;y+=26)rect(c,d.x-1,y+((time*90)%26),2,12,'#ff9df0');c.restore();return;}
 const f=d.state==='fall'?0:d.state==='impact'?1:2,k=.42,alpha=d.state==='wreck'?Math.min(1,(STORM.wreck-d.time)/.4):1;
 c.save();c.globalAlpha=alpha;c.translate(Math.round(d.x),Math.round(d.y));if(d.state==='fall')c.rotate(Math.sin(time*9+d.x)*.25);c.drawImage(img,f*200,0,200,160,-100*k,-(f?152:125)*k,200*k,160*k);c.restore();
}
function drawStorm(c,a,g,time){
 const b=g.boss,n=b.network,s=n.storm;if(!s)return;
 for(const d of n.drops)drawDrop(c,a,d,time);
 if(s.mode==='charge')drawColumn(c,a,s,time,true);
 const p=coreCenter(n),img=a.infoshumStormCore,f=coreFrame(s,b,time),w=s.mode==='burst'?150+(1-s.timer/STORM.burst)*90:150,bob=['storm','rise'].includes(s.mode)?Math.sin(time*2.4)*4:0;
 // While he is spent and low, a soft ring shows the opening.
 if(['sink','spent'].includes(s.mode)){c.save();c.globalAlpha=.25+.2*Math.abs(Math.sin(time*6));c.strokeStyle='#8ff6ff';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,58,0,Math.PI*2);c.stroke();c.restore();}
 if(s.mode==='intro'){const k=1-Math.max(0,s.timer)/STORM.intro;drawAttackFx(c,a,'burst',Math.min(3,Math.floor(k*4)),p.x,p.y,180+k*120,{alpha:Math.max(0,1-k)});}
 cell(c,img,240,210,f,p.x,p.y+bob,w*240/184,{alpha:s.mode==='burst'?Math.min(1,s.timer/.35+.2):s.mode==='intro'?Math.min(1,(STORM.intro-s.timer)/1.2):1});
 if(s.mode==='beam')drawColumn(c,a,s,time,false);
}
// The storm itself: the painted sky with a little parallax, drifting debris and lightning.
function drawStormSky(c,a,g,time){
 const r=rooms[g.room],img=a.infoshumStorm,s=g.boss.network.storm;
 if(img?.complete&&img.naturalWidth){const w=1240,h=698,span=Math.max(1,r.width-960),k=Math.max(0,Math.min(1,(g.camera-r.x)/span)),x=g.camera-k*(w-960);c.drawImage(img,Math.round(x),-150,w,h);}
 else rect(c,r.x,0,r.width,512,'#1a0b33');
 c.save();for(let i=0;i<26;i++){const x=r.x+((i*173+time*(40+i%5*18))%r.width),y=(i*97+Math.sin(time+i)*30)%430+20;c.globalAlpha=.35+.3*(i%3)/2;rect(c,x,y,3+i%4,3+i%3,i%2?'#b77cff':'#68e8ff');}c.restore();
 if(s?.flash>0){c.save();c.globalAlpha=Math.min(.45,s.flash*1.5);rect(c,r.x,0,r.width,512,'#f5d6ff');c.restore();}
}
export function drawInfoshumBackdrop(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 const r=rooms[g.room];
 if(n.stage==='storm'){drawStormSky(c,a,g,time);return;}
 const target=n.stage==='network'?a.infoshumArenaNetwork:a.infoshumArenaFree;
 if(target?.complete&&target.naturalWidth)c.drawImage(target,r.x,0,r.width,512);
 // The screens are part of the room: drawn behind the platforms and Uma.
 for(const t of n.tvs)drawScreen(c,a,t,time);
 if(n.stage==='rupture'){c.save();c.globalAlpha=.16+.14*Math.sin(time*14);rect(c,r.x,0,r.width,512,'#e155fc');c.restore();}
}
export function drawInfoshumPlatform(c,a,p,time){
 if(p.storm!==undefined&&drawStormIsland(c,a,p))return;
 if(!a.infoshumPlatform?.complete||p.infoshumStep)return;
 const image=a.infoshumPlatform,scale=30/177,cap=Math.min(140*scale,p.w/3),y=p.y-3;
 c.drawImage(image,22,299,140,177,p.x,y,cap,30);
 for(let x=cap;x<p.w-cap;x+=300*scale){const w=Math.min(300*scale,p.w-cap-x);c.drawImage(image,430,299,w/scale,177,p.x+x,y,w,30);}
 c.drawImage(image,2011,299,140,177,p.x+p.w-cap,y,cap,30);
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 if(n.stage==='network'){drawScreensForeground(c,a,g,time);return;}
 if(n.stage==='rupture'){const t=n.tvs[n.lastMonitorIndex],p=screenCenter(t);drawBreakout(c,a,{x:p.x-75,y:p.y-52,w:150,h:105},n.transitionProgress,time);return;}
 if(n.stage==='noise'){drawNoise(c,a,g,time);return;}
 if(n.stage==='storm')drawStorm(c,a,g,time);
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

