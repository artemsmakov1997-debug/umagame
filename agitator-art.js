import {rooms} from './level.js?v=0.21.5';
import {rect,text} from './pixel.js?v=0.21.5';
import {FLOOR_Y,MAST_X,MAST_DECK,LETTER,TOWERS,CHIMNEYS,HATCHES,AGI,PILLARS,slotRect,SLOT_ORDER} from './agitator-map.js?v=0.21.5';
import {SLOGAN_TIMES,windDir} from './agitator-combat.js?v=0.21.5';
import {drawSensationBird} from './roofs-art.js?v=0.21.5';
import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
// assets/agitator-boss.png: 16 cells of 212×248, feet on y=240, facing right.
// 0 idle, 1 shout, 2 overheated, 3 stomp, 4 stunned, 5 megaphone bursts, 6 jump, 7 land,
// 8 announce, 9 low swing, 10 rally aura, 11 blow, 12 knocked back, 13 cracked, 14 slumped, 15 scrap.
const BOSS_CELL=[212,248],BOSS_FEET=240,BOSS_BODY=180;
// assets/agitator-letters.png: 12 cells of 128×112 (В С Е Г О Р Я Т ! / stuck / shatter / flying).
const LETTER_CELL=[128,112];
// assets/agitator-placards.png: 8 cells of 132×140, feet on y=136.
// 0 out of the hatch, 1 «!» standing, 2–3 «!» walking, 4 megaphone, 5 fist, 6 knocked over, 7 broken.
const PLACARD_CELL=[132,140];
// assets/agitator-fx.png: 12 cells of 128×116.
const FX={glow:0,smoke:1,explosion:2,wave:3,wind:4,stars:5,dust:6,crack:7,burst:8,mushroom:9,rings:10,sparks:11},FX_CELL=[128,116];
// assets/agitator-props.png
const PROPS={mast:[0,19,116,354],bent:[120,56,121,317],tower:[245,0,166,373],chimneyLow:[415,276,74,97],chimneyTall:[493,237,81,136],hatch:[578,312,95,61],hatchOpen:[677,282,98,91]};
const MAST_DECK_ROW=72,TOWER_DECK_ROW=100;
const X0=()=>rooms[4].x;
const blit=(c,img,box,x,y,w,h)=>c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));
// Draws boss frame `frame` with its feet centred at (cx,feet), body `height` world pixels tall.
export function drawAgitatorFrame(c,a,frame,cx,feet,height,flip=false){
 const img=a.agitatorBoss;if(!img?.naturalWidth&&!img?.width)return;const s=height/BOSS_BODY,[cw,ch]=BOSS_CELL;
 c.save();c.translate(Math.round(cx),Math.round(feet));if(flip)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-cw/2*s,-BOSS_FEET*s,cw*s,ch*s);c.restore();
}
// Library, HUD and defeat callers: fit a frame into a box.
export function drawAgitatorPose(c,a,frame,x,y,w,h,flip=false){drawAgitatorFrame(c,a,frame,x+w/2,y+h-2,Math.min(h*.92,w*1.05),flip);}
function fxFrame(c,a,kind,cx,cy,w,alpha=1,flip=false){
 const img=a.agitatorFx;if(!img)return;const [cw,ch]=FX_CELL,h=w*ch/cw;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(flip)c.scale(-1,1);c.drawImage(img,FX[kind]*cw,0,cw,ch,-w/2,-h/2,w,h);c.restore();
}
function letterFrame(c,a,frame,cx,cy,size,rot=0,alpha=1){
 const img=a.agitatorLetters;if(!img)return;const [cw,ch]=LETTER_CELL,s=size/92;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rot)c.rotate(rot);c.drawImage(img,frame*cw,0,cw,ch,-cw/2*s,-ch/2*s,cw*s,ch*s);c.restore();
}
// ——— Scenery ———
export function drawAgitatorBackdrop(c,a,g,t){
 if(g.room!==4)return;const r=rooms[4],img=a.agitatorArena;rect(c,r.x,0,r.width,480,'#0e1640');
 // The two painted streets scroll slower than the roof.
 if(img){const view=g.viewWidth||768,span=Math.max(1,r.width-view),cam=Math.max(r.x,Math.min(r.x+span,g.camera)),k=(cam-r.x)/span,sc=Math.max(1,view/img.width),x=cam-k*Math.max(0,img.width*sc-view);c.drawImage(img,Math.round(x),0,img.width*sc,img.height*sc);}
 // Broadcast-blue haze during the live phase.
 const n=g.boss?.broadcast;if(n?.stage==='air'&&n.wind.phase!=='calm'){c.save();c.globalAlpha=n.wind.phase==='gust'?.16:.07;rect(c,r.x,0,r.width,480,'#4fd9ff');c.restore();}
 drawTowers(c,a,g,t);drawMast(c,a,g,t);
}
function drawTowers(c,a,g,t){
 const img=a.agitatorProps;if(!img)return;const box=PROPS.tower,s=(FLOOR_Y+2-150)/(box[3]-TOWER_DECK_ROW),w=box[2]*s,h=box[3]*s;
 for(const tw of TOWERS){const x=X0()+tw.x;c.save();if(tw.side===0){c.translate(x+w,0);c.scale(-1,1);blit(c,img,box,0,150-TOWER_DECK_ROW*s,w,h);}else blit(c,img,box,x,150-TOWER_DECK_ROW*s,w,h);c.restore();
  // Red warning lamps blink while he broadcasts from this tower.
  const n=g.boss?.broadcast,live=n?.stage==='air'&&n.tower===tw.side&&g.boss.hp>0;if(live){c.save();c.globalAlpha=.35+.35*Math.sin(t*9);rect(c,x+w*(tw.side?.4:.6)-6,150-TOWER_DECK_ROW*s+2,12,12,'#ff5a4a');c.restore();}}
}
function drawMast(c,a,g,t){
 const img=a.agitatorProps;if(!img)return;const n=g.boss?.broadcast,bent=!n||n.mast!=='standing'||g.boss.hp<=0&&g.bossesDefeated?.has('agitator');
 if(!bent){const box=PROPS.mast,s=(FLOOR_Y+2-MAST_DECK.y)/(box[3]-MAST_DECK_ROW),w=box[2]*s;blit(c,img,box,X0()+MAST_X-w/2,MAST_DECK.y-MAST_DECK_ROW*s,w,box[3]*s);}
 else{const box=PROPS.bent,s=.82,w=box[2]*s,h=box[3]*s;blit(c,img,box,X0()+MAST_X-w/2-8,FLOOR_Y+2-h,w,h);}
}
// Platforms: the roof itself, steel catwalks on the mast and towers, chimneys. Letter slots are drawn as letters.
export function drawAgitatorPlatform(c,a,p,t){
 const i=p.index;
 if(i===AGI.floor){
  const art=a.roofsPieces;rect(c,p.x,p.y+8,p.w,480-p.y,'#1a1430');const fall=c.createLinearGradient(0,p.y,0,480);fall.addColorStop(0,'#3a2a3c');fall.addColorStop(1,'#0a0814');c.fillStyle=fall;c.fillRect(p.x,p.y+10,p.w,480-p.y);
  if(art){const box=[458,108,623,165],k=34/165,mw=box[2]*k;for(let x=p.x-6;x<p.x+p.w;x+=mw-2)blit(c,art,box,x,p.y-4,mw,box[3]*k);}
  else{rect(c,p.x,p.y,p.w,6,'#8a5a48');}
  return;
 }
 if(i===AGI.mast||AGI.towers.includes(i)){
  if(a.studioProps)c.drawImage(a.studioProps,0,210,443,100,p.x,p.y-2,p.w,22);else rect(c,p.x,p.y,p.w,8,'#7b8aa8');
  return;
 }
 const ci=AGI.chimneys.indexOf(i);
 if(ci>=0){const ch=CHIMNEYS[ci],box=ch.tall?PROPS.chimneyTall:PROPS.chimneyLow,k=p.w/box[2]*1.08,w=box[2]*k,h=box[3]*k,potRise=ch.tall?28*k:22*k;if(a.agitatorProps)blit(c,a.agitatorProps,box,p.x+p.w/2-w/2,p.y-potRise,w,h);return;}
}
// Hatches lie on the roof in front of the floor tiles.
export function drawAgitatorEquipment(c,a,g,t){
 if(g.room!==4||!a.agitatorProps)return;const n=g.boss?.broadcast;
 for(const [i,x] of HATCHES.entries()){const open=n&&n.hatches[i]>0,box=open?PROPS.hatchOpen:PROPS.hatch,w=open?62:58,h=box[3]*w/box[2];blit(c,a.agitatorProps,box,X0()+x-w/2,FLOOR_Y+6-h,w,h);}
}
// ——— The robot and his phase objects ———
function bossFrame(g,t){
 const b=g.boss,n=b.broadcast,m=n.mode;
 if(m==='jump'){const j=n.jump;return j&&j.time/j.duration>.82?7:6;}
 if(n.stage==='slogan')return m==='overheat'?2:m==='burst'?5:m==='stun'?4:['windup','volley'].includes(m)||n.blast>0?1:0;
 if(n.stage==='leap')return 5;
 if(n.stage==='climb')return 13;
 if(n.stage==='rally')return m==='ura'?10:m==='uraWarn'?8:m==='swing'?9:m==='stomp'?3:m==='land'?7:m==='stun'?12:Math.floor(n.walkTime*3.2)%2?3:0;
 if(n.stage==='air')return m==='stun'?12:m==='swing'?9:m==='swingWarn'?1:n.wind.phase==='gust'?11:n.wind.phase==='warn'?8:0;
 return 0;
}
export function drawAgitator(c,a,g,t){
 const b=g.boss,n=b.broadcast;if(!n)return;
 drawLetters(c,a,g,t,false);drawPlacards(c,a,g,t);
 const frame=bossFrame(g,t),cx=b.x+b.w/2,feet=b.y+b.h+2,bob=frame===0?Math.round(Math.sin(t*3)*1.5):0;
 if(n.mode==='jump'&&n.jump){for(const lag of[.1,.2]){const q=Math.max(0,n.jump.time/n.jump.duration-lag);const x=n.jump.from.x+(n.jump.to.x-n.jump.from.x)*q,y=n.jump.from.y+(n.jump.to.y-n.jump.from.y)*q-Math.sin(q*Math.PI)*n.jump.arc;c.save();c.globalAlpha=.2;drawAgitatorFrame(c,a,6,x+b.w/2,y+b.h+2,b.h,b.dir<0);c.restore();}}
 // Overheated megaphone glows and smokes before the body.
 const mouth={x:cx+b.dir*64,y:b.y+78};
 if(n.stage==='slogan'&&n.mode==='overheat'){fxFrame(c,a,'glow',mouth.x,mouth.y,70,.55+.25*Math.sin(t*14));fxFrame(c,a,'smoke',mouth.x+b.dir*6,mouth.y-46,64,.75,b.dir<0);}
 c.save();if(b.hurtTime>0&&Math.floor(t*24)%2)c.filter='brightness(1.9)';if(b.guardFlash>0)c.filter='brightness(1.35) saturate(.6)';
 drawAgitatorFrame(c,a,frame,cx,feet+bob,b.h,b.dir<0);c.restore();
 if(n.stage==='slogan'&&n.mode==='windup')drawSlotMarks(c,g,t);
 if(n.blast>0||n.mode==='swingWarn'||n.mode==='stomp'||n.mode==='shoutWarn'){const blink=Math.floor(t*10)%2;text(c,'!',cx-5,b.y-30+(blink?-2:0),'#ffd083',3);}
 // The rally call is a big exclamation mark over his head; his open back is outlined.
 if(n.stage==='rally'&&(n.mode==='ura'||n.mode==='uraWarn')){const warn=n.mode==='uraWarn',bob=Math.abs(Math.sin(t*8))*4,frame=warn?[0,2][Math.floor(t*8)%2]:[1,0,2,3][Math.floor(t*10)%4];drawAttackFx(c,a,'bang',frame,cx,b.y-34-bob,warn?52:72);}
 if(n.stage==='rally'&&n.mode==='shoutWarn')fxFrame(c,a,'glow',cx+b.dir*40,b.y+40,60,.5+.4*Math.sin(t*20));
 for(const w of n.shouts||[])drawShot(c,a,w,t);
 drawLetters(c,a,g,t,true);drawBirds(c,a,g,t);drawWind(c,a,g,t);drawFx(c,a,n,t);
}
// Ranged shots of phase 2: a sound wave that widens as it flies (parried → burst), or a spinning placard (→ impact).
function drawShot(c,a,w,t){
 if(w.kind==='placard'){
  if(w.state==='burst')drawAttackFx(c,a,'placard',4+Math.min(2,Math.floor(w.time/.15)),w.x,w.y-26,64,{alpha:w.time>.3?Math.max(0,1-(w.time-.3)/.15):1});
  else drawAttackFx(c,a,'placard',Math.floor(w.time*12)%4,w.x,w.y,58,{flip:w.vx<0,rot:Math.sin(w.time*9)*.15});
  return;
 }
 const ang=Math.atan2(w.vy,w.vx),back=Math.abs(ang)>Math.PI/2;
 if(w.state==='burst'){const k=w.time/.4;fxFrame(c,a,'burst',w.x,w.y,60+k*40,1-k);return;}
 // The wave is drawn from its back edge: the inner arc trails, the outer arcs lead.
 const frame=Math.min(3,Math.floor(w.time*7)),size=54+frame*10;drawAttackFx(c,a,'shout',frame,w.x-Math.cos(ang)*size*.45,w.y-Math.sin(ang)*size*.45,size,{rot:back?ang+Math.PI:ang,flip:back});
}
function drawSlotMarks(c,g,t){
 const n=g.boss.broadcast,blink=Math.floor(t*8)%2;c.save();c.globalAlpha=blink?.65:.3;c.strokeStyle='#ffb36a';c.lineWidth=2;
 for(let i=0;i<SLOT_ORDER.length;i++){const s=slotRect(n.side,i);c.strokeRect(X0()+s.x+2,s.y+2,s.w-4,s.h-4);}c.restore();
}
function drawLetters(c,a,g,t,flying){
 const n=g.boss.broadcast;
 for(const l of n.letters){
  if(flying!==(l.state==='fly'||l.state==='back'))continue;
  if(l.state==='block'){const settle=Math.max(0,1-l.time/.18);letterFrame(c,a,l.frame,l.x,l.y+settle*-6,LETTER+8);continue;}
  if(l.state==='crumble'){const k=l.time/SLOGAN_TIMES.crumble;if(k<.45){const shake=Math.sin(l.time*90)*2;letterFrame(c,a,l.frame,l.x+shake,l.y,LETTER+8);}else{const q=(k-.45)/.55;for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){c.save();c.beginPath();c.rect(l.x+(dx<0?-30:0)+dx*q*18,l.y+(dy<0?-30:0)+dy*q*10+q*q*30,30,30);c.clip();letterFrame(c,a,l.frame,l.x+dx*q*18,l.y+dy*q*10+q*q*30,LETTER+8,dx*q*.5,1-q);c.restore();}if(q<.5)fxFrame(c,a,'dust',l.x,l.y+14,60,1-q*2);}continue;}
  if(l.state==='fly'){for(const lag of[.05,.1]){c.save();c.globalAlpha=.25;letterFrame(c,a,l.frame,l.x-(l.to.x-l.from.x)*lag/.62*.6,l.y,LETTER,0);c.restore();}letterFrame(c,a,l.frame,l.x,l.y,LETTER+4,Math.sin(l.time*9)*.25);continue;}
  if(l.state==='back'){const b=g.boss,dir=Math.sign(b.x+b.w/2-l.x)||1;c.save();c.globalAlpha=.75;for(let i=0;i<5;i++)rect(c,l.x-dir*(26+i*9),l.y-12+i*6,18-i*2,3,'#7ff4ff');c.restore();c.save();c.shadowColor='#5ff0ff';c.shadowBlur=14;letterFrame(c,a,l.frame,l.x,l.y,LETTER+6,l.time*12);c.restore();}
 }
}
function drawPlacards(c,a,g,t){
 const n=g.boss.broadcast,img=a.agitatorPlacards;if(!img)return;const [cw,ch]=PLACARD_CELL,s=.5;
 for(const p of n.placards){
  let frame,alpha=1,lift=p.lift||0,clip=null;
  if(p.state==='rise'){frame=0;clip=Math.min(1,p.time/.5);}
  else if(p.state==='knocked')frame=6;
  else if(p.state==='broken'){frame=7;alpha=Math.max(0,1-p.time/.7);}
  else frame=p.kind===0?[1,2,1,3][(n.beat+(p.id%2))%4]:p.kind===1?4:5;
  const cx=p.x+p.w/2,feet=p.y+p.h+2-lift;c.save();c.globalAlpha=alpha;c.translate(Math.round(cx),Math.round(feet));if(p.dir<0&&frame!==0)c.scale(-1,1);
  if(p.state==='march'&&p.kind!==0)c.rotate(Math.sin((n.beatClock+p.id)*Math.PI*2/(60/132))*.06);
  if(clip!==null){c.beginPath();c.rect(-cw*s/2,-ch*s,cw*s,ch*s);c.clip();c.translate(0,(1-clip)*24);}
  c.drawImage(img,frame*cw,0,cw,ch,-cw/2*s,-136*s,cw*s,ch*s);c.restore();
 }
}
function drawBirds(c,a,g,t){const n=g.boss.broadcast;for(const s of n.birds)drawSensationBird(c,a,s.x+s.w/2,s.y+s.h/2,s.dir,t+s.x*.01,{burst:s.state==='burst',alpha:s.state==='burst'?Math.max(0,1-s.time/.35):1});}
function drawWind(c,a,g,t){
 const n=g.boss.broadcast;if(n.stage!=='air'||n.mode==='jump'||n.wind.phase==='calm')return;
 const dir=windDir(n),gust=n.wind.phase==='gust',r=rooms[4],view=g.viewWidth||768,from=g.camera-40,span=view+80;
 c.save();for(let i=0;i<(gust?26:8);i++){const speed=gust?640:200,x=dir>0?from+((i*137+t*speed)%span):from+span-((i*137+t*speed)%span),y=40+(i*53)%370,len=gust?34+i%3*14:14;c.globalAlpha=gust?.5:.25;rect(c,x,y,len,2,i%3?'#d6f4ff':'#ffffff');}
 if(gust)for(let i=0;i<4;i++){const x=dir>0?from+((i*260+t*520)%span):from+span-((i*260+t*520)%span);fxFrame(c,a,'wind',x,120+i*80,110,.55,dir<0);}
 c.restore();
 const b=g.boss;if(gust)fxFrame(c,a,'wave',b.x+b.w/2+dir*92,b.y+78,90,.8,dir<0);
}
function drawFx(c,a,n,t){
 for(const f of n.fx){const k=f.age/f.life,alpha=Math.max(0,1-k);
  if(f.kind==='dust')fxFrame(c,a,'dust',f.x,f.y-(f.small?10:26),f.small?64:130,alpha);
  else if(f.kind==='rings')fxFrame(c,a,'rings',f.x,f.y-14,120+k*70,alpha);
  else if(f.kind==='stomp')drawAttackFx(c,a,'stomp',Math.min(2,Math.floor(k*3)),f.x,f.y,200+k*40,{alpha:k>.7?(1-k)/.3:1});
  else if(f.kind==='stars')fxFrame(c,a,'stars',f.x,f.y+Math.sin(t*6)*2,90,Math.min(1,alpha*2));
  else if(f.kind==='wave')fxFrame(c,a,'wave',f.x+(f.dir||1)*k*60,f.y,90+k*50,alpha,(f.dir||1)<0);
  else if(f.kind==='explosion')fxFrame(c,a,'explosion',f.x,f.y,80+k*30,alpha);
  else if(f.kind==='sparks')fxFrame(c,a,'sparks',f.x,f.y,80,alpha);
  else if(f.kind==='burst')fxFrame(c,a,f.cyan?'burst':'explosion',f.x,f.y,70+k*40,alpha);
 }
}
// Scrap flying off at the end of the fight (boss-defeat-art.js).
export function drawAgitatorDefeat(c,a,d){
 const t=d.time,cx=d.x+d.w/2,feet=d.y+d.h+2,flip=d.dir<0;
 if(t<.55){const shake=Math.sin(t*70)*3;drawAgitatorFrame(c,a,13,cx+shake,feet,d.h,flip);if(t>.2)fxFrame(c,a,'sparks',cx+20,d.y+40,70,.9);return;}
 if(t<.9){drawAgitatorFrame(c,a,14,cx,feet,d.h,flip);fxFrame(c,a,'smoke',cx,d.y+10,70,.8);return;}
 const k=Math.min(1,(t-.9)/.8);c.save();c.globalAlpha=Math.max(0,1-k*.9);c.translate(cx,feet-d.h/2);c.scale(1+k*.25,1+k*.25);c.translate(-cx,-(feet-d.h/2));drawAgitatorFrame(c,a,15,cx,feet+k*10,d.h*1.05,flip);c.restore();
 fxFrame(c,a,'mushroom',cx,feet-60-k*30,120+k*40,Math.max(0,1-k));
}
