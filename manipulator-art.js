import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {solidSurfaces} from './terrain.js?v=0.21.5';
import {studioDock,cranePivot,craneTip,TRACK_Y,DOLLY,DECOYS,WARP,FRAME,VIEWFINDER,SCISSORS_AIM} from './manipulator-combat.js?v=0.21.5';
const clamp01=v=>Math.max(0,Math.min(1,v));
// assets/manipulator-camera.png: 4×3 cells of 181×181, facing right, body centred near x 91, bottom at y 161.
//  0–1 idle, 2 clapper glitch (teleport), 3 hurt flash, 4 beam forward, 5 beam down, 6 smoking (overheat),
//  7 cracked lens, 8 reel ejected, 9 without reel, 10 viewfinder, 11 shaking with rage.
export const CAM={cell:181,cx:91,bottom:161,top:14,body:156};
// assets/manipulator-projector.png: 4×2 cells of 192×256, facing right, body centre near x 72.
//  0 projecting, 1 bright, 2 dark, 3 cracked lens, 4 dashing, 5 screen with the neon image, 6 bursting, 7 smoking.
export const PROJ={w:192,h:256,cx:72,feet:[215,220,215,215,208,227,209,209]};
// assets/manipulator-crane.png (atlas): dolly, column, truss, joint, counterweight, claw, assembled crane, shadow.
export const CRANE={dolly:[5,131,194,106],column:[224,37,109,192],truss:[371,104,228,79],joint:[624,76,115,135],weight:[11,321,157,129],claw:[190,320,92,132],crane:[300,273,286,211],shadow:[541,426,216,50]};
// assets/manipulator-film.png (atlas): strip, strip with a hole, rolling strip, reel stand, taped strip, scissors open/cutting, falling piece.
export const FILM={strip:[14,117,164,73],hole:[206,117,164,73],roll:[398,99,161,106],reel:[585,82,166,141],taped:[14,341,164,73],scissors:[203,318,166,118],cut:[392,315,175,118],piece:[638,311,76,120]};
// assets/manipulator-fx.png (atlas): four viewfinder sizes, flash, stop-frame, beam tile, burst, light cone, shadow, neon platform, film swirl.
export const MFX={vf:[[28,31,184,139],[246,44,139,114],[439,59,109,85],[626,72,75,63]],flash:[35,194,152,131],photo:[220,193,151,131],beam:[395,214,170,89],burst:[595,190,137,133],cone:[28,342,167,155],shadow:[217,406,157,34],neon:[389,378,171,87],swirl:[579,347,166,133]};
const blit=(c,image,box,x,y,w,h)=>image&&c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));
function centered(c,image,box,cx,cy,w,alpha=1,flip=false,rotation=0){if(!image||alpha<=0)return;const h=w*box[3]/box[2];c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(rotation)c.rotate(rotation);if(flip)c.scale(-1,1);c.drawImage(image,box[0],box[1],box[2],box[3],-w/2,-h/2,w,h);c.restore();}

// The camera, standing (bottom of the body on `bottom`) and centred on cx; `width` is the body width.
export function drawCamera(c,a,frame,cx,bottom,width,flip=false,alpha=1){
 const image=a.manipulator;if(!image?.naturalWidth)return;const s=width/CAM.body,size=CAM.cell*s,col=frame%4,row=Math.floor(frame/4);
 c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(bottom));if(flip)c.scale(-1,1);c.drawImage(image,col*CAM.cell,row*CAM.cell,CAM.cell,CAM.cell,-CAM.cx*s,-CAM.bottom*s,size,size);c.restore();
}
export function drawProjector(c,a,frame,cx,feet,height,flip=false,alpha=1){
 const image=a.manipulatorProjector;if(!image?.naturalWidth)return;const s=height/160,col=frame%4,row=Math.floor(frame/4);
 c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(feet));if(flip)c.scale(-1,1);c.drawImage(image,col*PROJ.w,row*PROJ.h,PROJ.w,PROJ.h,-PROJ.cx*s,-PROJ.feet[frame]*s,PROJ.w*s,PROJ.h*s);c.restore();
}
// Library cards and the generic pose call: old pose rows mapped onto the new sheet.
export function drawManipulatorPose(c,a,row,frame,x,y,w,h,flip=false){
 const f=row===5?(frame%2?7:3):row===4?2:row===3?4:row===2?11:row===1?10:frame%2;
 drawCamera(c,a,f,x+w/2,y+h,Math.min(w*.92,h*1.06),flip);
}

export function drawStudioBackdrop(c,a,g,t){
 if(g.room!==6)return;const r=rooms[6],image=a.studioArena;
 c.drawImage(image,0,0,image.width,600,r.x,0,r.width,422);
 c.drawImage(image,0,600,image.width,image.height-600,r.x,422,r.width,58);
 for(const [x,w]of[[210,310],[895,425]]){
  rect(c,r.x+x,422,w,58,'#060b22');
  for(let i=0;i<w;i+=14){const h=14+(i*7+Math.floor(t*30))%40;rect(c,r.x+x+i,480-h,2,h,'#ad3ee955');}
  rect(c,r.x+x,475,w,5,'#bd42f0');
 }
 const n=g.boss?.studio;if(!n||g.boss.hp<=0)return;
 // Phase 3: the screen the projector throws its image on hangs over the stage.
 if(n.phase===3&&a.manipulatorProjector){const k=n.mode==='dark'?.35:.85,w=170,h=w*PROJ.h/PROJ.w;c.save();c.globalAlpha=k;c.drawImage(a.manipulatorProjector,PROJ.w,PROJ.h,PROJ.w,PROJ.h,r.x+r.width/2-w/2,30,w,h);c.restore();}
 drawTrack(c,g);
 // The crane stands behind the stage, in the backdrop's shade: it carries the camera but never touches Uma.
 if(n.crane){c.save();c.filter='brightness(.58) saturate(.75)';c.globalAlpha=.92;drawCrane(c,a,n.crane,n.phase===1);c.restore();}
 // Phase 3 illusions: fake strips and decoys look exactly like the real ones, but cast no shadow.
 if(n.phase===3&&n.mode!=='dark'){
  for(const i of n.decoys){const [x,y,w]=DECOYS[i];drawNeon(c,a,r.x+x,y,w,t,i);}
  for(const s of g.platforms)if(s.room===6&&s.intangible)drawNeon(c,a,s.x,s.y,s.w,t,s.index);
 }
}
function drawTrack(c,g){
 const r=rooms[6],y=TRACK_Y+3;c.save();c.globalAlpha=.9;
 for(const [x,w]of[[210,310],[895,425]]){rect(c,r.x+x,y,w,2,'#7d6aa8');rect(c,r.x+x,y+6,w,2,'#4b3f6e');for(let i=6;i<w;i+=22)rect(c,r.x+x+i,y,3,9,'#2a2140');}
 c.restore();
}
export function drawNeon(c,a,x,y,w,t,seed=0,alpha=1){
 const image=a.manipulatorFx;if(!image)return;const box=MFX.neon,H=30,cap=box[2]*.2,capW=Math.min(w/2,cap*H/box[3]),flick=.85+.15*Math.sin(t*9+seed*1.7),top=y-7;
 // Left cap, stretched middle, right cap.
 c.save();c.globalAlpha*=alpha*flick;
 c.drawImage(image,box[0],box[1],cap,box[3],x,top,capW,H);c.drawImage(image,box[0]+cap,box[1],box[2]-2*cap,box[3],x+capW,top,w-2*capW,H);c.drawImage(image,box[0]+box[2]-cap,box[1],cap,box[3],x+w-capW,top,capW,H);c.restore();
}
function drawStrip(c,a,p,t,taped){
 const image=a.manipulatorFilm;if(!image)return false;const h=22,box=FILM.strip,tw=box[2]*h/box[3];
 c.save();c.beginPath();c.rect(p.x,p.y-6,p.w,h+2);c.clip();for(let x=p.x;x<p.x+p.w;x+=tw-2)blit(c,image,box,x,p.y-5,tw,h);
 if(taped)blit(c,image,FILM.taped,p.x+p.w/2-tw/2,p.y-5,tw,h);c.restore();return true;
}
export function drawStudioPlatform(c,a,p,t,g){
 const n=g?.boss?.studio,live=n&&g.boss.hp>0&&p.studioPlatform;
 if(live&&n.phase===2){const phase=p.studioPhase||'solid';if(phase==='gap')return;c.save();if(phase==='forming')c.globalAlpha=.3+.7*(1-(p.studioTimer||0)/.35);drawStrip(c,a,p,t,n.taped[p.index]);c.restore();return;}
 if(live&&n.phase===3){drawNeon(c,a,p.x,p.y,p.w,t,p.index,n.mode==='dark'?.55:1);return;}
 const phase=p.studioPhase||'solid',col=phase==='warning'?1:phase==='gap'?2:phase==='forming'?3:0;
 const image=a.studioProps;
 c.save();if(phase==='forming')c.globalAlpha=.25+.65*(1-(p.studioTimer||0)/.35);c.drawImage(image,col*443.5,115,443.5,250,p.x-7,p.y-23,p.w+14,48);c.restore();
 if(phase==='warning'){const alpha=.45+.4*Math.abs(Math.sin(t*18));c.save();c.globalAlpha=alpha;rect(c,p.x+4,p.y-2,p.w-8,2,p.burned?'#ff5a7a':'#ff99e4');c.restore();}
 if(!p.studioPlatform&&p.y<400){
  for(const xx of[p.x+10,p.x+p.w-12]){rect(c,xx,0,2,p.y,'#263c5b');for(let y=8;y<p.y;y+=24)rect(c,xx-1,y,4,3,'#5e6990');}
  c.drawImage(image,86,493,294,344,p.x+6,p.y+9,38,44);
 }
}

// ——— Crane ———
function drawArm(c,a,from,to,thick){
 const image=a.manipulatorCrane,box=CRANE.truss,len=Math.hypot(to.x-from.x,to.y-from.y),angle=Math.atan2(to.y-from.y,to.x-from.x),tw=box[2]*thick/box[3];
 c.save();c.translate(from.x,from.y);c.rotate(angle);c.beginPath();c.rect(0,-thick/2,len,thick);c.clip();for(let x=0;x<len;x+=tw-2)c.drawImage(image,box[0],box[1],box[2],box[3],x,-thick/2,tw,thick);c.restore();
}
export function drawCrane(c,a,crane,withClaw=true){
 const image=a.manipulatorCrane;if(!image)return;const p=cranePivot(crane),tip=craneTip(crane),dir=crane.dir;
 const back={x:p.x-dir*70*Math.cos(crane.angle),y:p.y+70*Math.sin(crane.angle)};
 // Column from the dolly up to the pivot.
 const col=CRANE.column,ch=TRACK_Y-34-p.y+10,cw=col[2]*ch/col[3];blit(c,image,col,p.x-cw/2,p.y-10,cw,ch);
 drawArm(c,a,back,tip,22);
 centered(c,image,CRANE.weight,back.x-dir*8,back.y+4,50,1,dir<0);
 centered(c,image,CRANE.joint,p.x,p.y,42,1,dir<0);
 if(withClaw){const cl=CRANE.claw,w=30,h=w*cl[3]/cl[2];blit(c,image,cl,tip.x-w/2,tip.y-8,w,h);}
 const d=CRANE.dolly,dw=DOLLY.w+16,dh=dw*d[3]/d[2];blit(c,image,d,crane.x-dw/2,TRACK_Y+8-dh,dw,dh);
}

// ——— The boss ———
function cameraFrame(b,n,t){
 if(b.hurtTime>0)return n.phase===1?3:7;
 switch(n.mode){
  case 'aim':return 10;case 'pan':return n.beam?.live?5:10;case 'overheat':return 6;case 'intro':case 'raise':case 'roll':case 'park':return Math.floor(t*5)%2;
  case 'frame':return 10;case 'snap':return 4;case 'eject':return 8;case 'develop':return 9;case 'detach':return 11;
  case 'transform':return n.timer>.5?11:2;case 'warp':return 2;
  default:return Math.floor(t*5)%2;
 }
}
function projectorFrame(b,n,t){
 if(b.hurtTime>0)return 3;
 switch(n.mode){case 'project':return 0;case 'charge':case 'beam':return 1;case 'dark':return 2;case 'warp':return 4;default:return 0;}
}
export function drawManipulator(c,a,g,t){
 const b=g.boss,n=b.studio;if(!n)return;const cx=b.x+b.w/2,bottom=b.y+b.h,flip=b.dir<0,width=b.w+30;
 // Phase 3: real strips cast a shadow on what lies below.
 if(n.phase===3)drawShadows(c,a,g);
 for(const s of n.scorches)centered(c,a.manipulatorFx,MFX.flash,s.x,s.y-4,18*(1-s.t/.6)+6,1-s.t/.6);
 if(n.phase===2)drawStopFrame(c,a,g,n,t);
 const warping=n.mode==='warp',out=warping&&!n.arrived,arrive=warping?clamp01(1-n.timer/(WARP/2)):1;
 if(warping){const s=studioDock(g,n.to),k=out?clamp01(1-n.timer/WARP)*2:1;c.save();c.globalAlpha=.35*k;
  if(n.phase===3)drawProjector(c,a,4,s.x+s.w/2,s.y,104,flip);else drawCamera(c,a,2,s.x+s.w/2,s.y,width,flip);c.restore();}
 const alpha=warping?(out?clamp01(n.timer/WARP*2-.6):arrive):1;
 if(n.phase===3&&n.mode!=='transform'){
  if(n.mode==='beam'||n.mode==='charge')drawLaser(c,a,n,t);
  drawProjector(c,a,projectorFrame(b,n,t),cx,bottom,104,flip,alpha);
 }else{
  const shake=n.mode==='overheat'||n.mode==='detach'||n.mode==='transform'&&n.timer>.5?Math.sin(t*40)*1.5:0;
  drawCamera(c,a,cameraFrame(b,n,t),cx+shake,bottom,width,flip,alpha);
  if(n.phase===1&&n.beam)drawPanBeam(c,a,n,t);
  if(n.mode==='transform'&&n.timer<.5)centered(c,a.manipulatorFx,MFX.flash,cx,bottom-50,150*(1-n.timer/.5)+40,clamp01(n.timer/.5+.2));
 }
 if(n.mode==='overheat'){const k=.5+.5*Math.sin(t*8);c.save();c.globalAlpha=.25+.2*k;c.fillStyle='#ffcf7a';c.beginPath();c.ellipse(cx,bottom-2,62,7,0,0,Math.PI*2);c.fill();c.restore();}
 if(b.hurtTime>0)centered(c,a.manipulatorFx,MFX.burst,cx+b.dir*30,bottom-50,60,clamp01(b.hurtTime/.3));
}
function drawPanBeam(c,a,n,t){
 const s=n.beam,len=Math.hypot(s.x2-s.x1,s.y2-s.y1),angle=Math.atan2(s.y2-s.y1,s.x2-s.x1);
 if(n.mode==='aim'||!s.live){c.save();c.globalAlpha=n.mode==='aim'?.5+.35*Math.abs(Math.sin(t*12)):.28;c.translate(s.x1,s.y1);c.rotate(angle);for(let x=0;x<len;x+=14)rect(c,x,-1,8,2,'#ff6fae');c.restore();return;}
 const image=a.manipulatorFx,box=MFX.beam,thick=16,tw=box[2]*thick/(box[3]*.45);
 c.save();c.translate(s.x1,s.y1);c.rotate(angle);c.beginPath();c.rect(0,-thick,len,thick*2);c.clip();
 for(let x=-((t*240)%tw);x<len;x+=tw-2)c.drawImage(image,box[0],box[1]+box[3]*.28,box[2],box[3]*.45,x,-thick/2,tw,thick);
 rect(c,0,-1,len,2,'#fff5ed');c.restore();
 centered(c,a.manipulatorFx,MFX.flash,s.x2,s.y2-6,34+6*Math.sin(t*30),.9);
}
function drawLaser(c,a,n,t){
 const beam=n.beam;if(!beam)return;const y=beam.y+6;
 if(n.mode==='charge'){c.save();c.globalAlpha=.45+.3*Math.abs(Math.sin(t*12));for(let x=beam.x;x<beam.x+beam.w;x+=13)rect(c,x,y,7,2,'#ff78d2');c.restore();return;}
 const image=a.manipulatorFx,box=MFX.beam,h=16,tw=box[2]*h/(box[3]*.45);
 c.save();c.beginPath();c.rect(beam.x,y-h,beam.w,h*2);c.clip();for(let x=beam.x-((t*300)%tw);x<beam.x+beam.w;x+=tw-2)c.drawImage(image,box[0],box[1]+box[3]*.28,box[2],box[3]*.45,x,y-h/2,tw,h);c.restore();
 rect(c,beam.x,y-1,beam.w,2,'#fff5ed');
}
function drawStopFrame(c,a,g,n,t){
 const image=a.manipulatorFx;
 if(n.viewfinder&&n.mode==='frame'){const v=n.viewfinder,k=clamp01(n.elapsed/FRAME),i=Math.min(3,Math.floor(k*4)),box=MFX.vf[i],size=VIEWFINDER*(1.5-.5*k);
  centered(c,image,box,v.x,v.y,size*box[2]/Math.max(box[2],box[3]),.75+.25*Math.sin(t*14));
  if(n.timer<.45){c.save();c.globalAlpha=.25;c.fillStyle='#ff3b5c';c.fillRect(v.x-VIEWFINDER/2,v.y-VIEWFINDER/2,VIEWFINDER,VIEWFINDER);c.restore();}}
 if(n.photo){const p=n.photo,k=p.t/.7;centered(c,image,MFX.photo,p.x,p.y,VIEWFINDER*1.25,1-k);if(p.t<.18)centered(c,image,MFX.flash,p.x,p.y,140,1-p.t/.18);}
 // Scissors: open over the strip, then the snip; the cut piece tumbles down.
 if(n.scissors){const s=n.scissors,strip=g.platforms.find(q=>q.room===6&&q.index===s.index),k=1-s.timer/SCISSORS_AIM;if(strip){
  centered(c,a.manipulatorFilm,s.timer<.18?FILM.cut:FILM.scissors,s.x,strip.y-44+Math.sin(t*10)*3,56+12*k,1);
  c.save();c.globalAlpha=.35+.35*Math.abs(Math.sin(t*16));rect(c,s.x-1,strip.y-6,2,22,'#ffd46a');c.restore();}}
 for(const s of g.platforms){if(s.room!==6||!(s.index in n.cuts)||s.studioPhase!=='gap')continue;const k=n.cuts[s.index];if(k>1.2)continue;
  centered(c,a.manipulatorFilm,FILM.piece,s.x+s.w/2,s.y+k*k*260,26,1-k/1.2,false,k*3);}
}
function drawShadows(c,a,g){
 const n=g.boss.studio,surfaces=solidSurfaces(g).filter(s=>s.room===6);
 for(const s of g.platforms){if(s.room!==6||!s.studioPlatform||s.intangible)continue;const cx=s.x+s.w/2;
  const below=surfaces.filter(q=>q!==s&&q.y>s.y+4&&cx>q.x&&cx<q.x+q.w).sort((p,q)=>p.y-q.y)[0],y=below?below.y:TRACK_Y,depth=y-s.y;
  centered(c,a.manipulatorFx,MFX.shadow,cx,y-1,s.w*(.9-Math.min(.4,depth/500)),n.mode==='dark'?.45:.8);}
}

// Defeat: the projector bursts into film, then stands smoking.
export function drawManipulatorDefeat(c,a,d){
 const t=d.time,cx=d.x+d.w/2,feet=d.y+d.h,flip=d.dir<0;
 if(t<.9){drawProjector(c,a,6,cx+Math.sin(t*50)*2,feet,104,flip);centered(c,a.manipulatorFx,MFX.swirl,cx,feet-60,90+t*60,clamp01(1-t/.9));return true;}
 drawProjector(c,a,7,cx,feet,104,flip,clamp01(1-(t-1.3)/.4));return true;
}
