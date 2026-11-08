import {rect} from './pixel.js?v=0.21.5';
import {FLOOR_Y,WINDUP,DASH_HITBOX} from './spreader-combat.js?v=0.21.5';
const clamp01=v=>Math.max(0,Math.min(1,v));
// assets/spreader-air.png: 8 cells of 192×184, centred, facing right.
//  0 wings up, 1 wings down, 2 bank, 3 bombing, 4 dive, 5 collecting, 6 overloaded, 7 hurt.
// assets/spreader-tube.png: 8 cells of 192×176, standing on the cell bottom (6 px margin), facing right.
//  0 rolling up, 1 tube, 2–3 roll, 4 crash, 5 flat & dizzy, 6 stuck in the floor, 7 shredded.
// assets/spreader-fx.png: 12 cells of 164×150, centred.
//  0 bundle, 1 bundle bursting, 2 fan of leaflets, 3 pile, 4 stream, 5 dust, 6 crack, 7 target marker,
//  8 ink splash, 9 stars, 10 leaflet shockwave, 11 impact flash.
export const AIR={w:192,h:184,scale:.78,bottom:[173,151,170,174,172,183,152,159]};
export const TUBE={w:192,h:176,scale:.74,base:6};
export const FX={w:164,h:150};
// assets/spreader-leaflets.png: 8 cells of 88×80 (0–5 tumbling, 6–7 landed).
// assets/spreader-shelters.png: table, press table, table with leaflets (2× scale).
const TABLE=[0,18,397,107],TABLE_LITTERED=[814,21,399,104],TOP_ROWS=68;
const flap=time=>Math.floor(time*7)%2;

export function spreaderFrame(b,time){
 const f=b.fight;if(!f)return['air',flap(time)];
 const ground=['landed','windup','dash','crash','stunned','stuck'].includes(f.mode);
 if(b.hurtTime>0&&!ground)return['air',7];
 switch(f.mode){
  case 'bombing':return['air',f.dropFlash>0?3:flap(time)];
  case 'turn':return['air',2];
  case 'collect':return['air',5];
  case 'sink':case 'heavy':return['air',6];
  case 'dive':return['air',4];
  case 'spear':return['air',4];
  case 'landed':return['tube',0];
  case 'windup':return['tube',f.timer>WINDUP/2?0:1];
  case 'dash':return['tube',2+Math.floor(time*14)%2];
  case 'crash':return['tube',4];
  case 'stunned':return['tube',5];
  case 'stuck':return['tube',6];
  case 'takeoff':return f.elapsed<.25?['tube',0]:['air',flap(time)];
  default:return['air',flap(time)];
 }
}
function cell(c,image,sheet,frame,cx,top,flip,alpha=1,rotation=0){
 const w=sheet.w*sheet.scale,h=sheet.h*sheet.scale;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(top+h/2));if(rotation)c.rotate(rotation);if(flip)c.scale(-1,1);
 c.drawImage(image,frame*sheet.w,0,sheet.w,sheet.h,-w/2,-h/2,w,h);c.restore();
}
function poseTop(b,kind,frame){
 if(kind==='tube')return b.y+b.h+TUBE.base*TUBE.scale-TUBE.h*TUBE.scale;
 // Overloaded and sunk: the heavy body rests on the surface under the box.
 if(frame===6)return b.y+b.h+6-AIR.bottom[6]*AIR.scale;
 return b.y+b.h/2-AIR.h*AIR.scale/2;
}
export function fx(c,a,frame,cx,cy,scale,alpha=1,flip=false){
 const image=a.spreaderFx;if(!image||alpha<=0)return;const w=FX.w*scale,h=FX.h*scale;c.save();c.globalAlpha*=alpha;c.translate(Math.round(cx),Math.round(cy));if(flip)c.scale(-1,1);
 c.drawImage(image,frame*FX.w,0,FX.w,FX.h,-w/2,-h/2,w,h);c.restore();
}

export function drawSpreader(c,a,g,time){
 const b=g.boss,air=a.spreaderAir,tube=a.spreaderTube;if(!air||!tube)return false;
 const f=b.fight,[kind,frame]=spreaderFrame(b,time),sheet=kind==='tube'?TUBE:AIR,image=kind==='tube'?tube:air,cx=b.x+b.w/2,top=poseTop(b,kind,frame),flip=b.dir<0;
 if(f?.mode==='windup')drawDashLane(c,g,b,time,clamp01(1-f.timer/WINDUP));
 if(f?.mode==='aim')drawTarget(c,a,f,time);
 if(f&&['stuck','pull'].includes(f.mode))fx(c,a,6,f.aimX,f.aimY-2,.62,f.mode==='pull'?clamp01(1-f.elapsed/.45):1);
 if(f?.mode==='dash'){for(const lag of[1,2,3])fx(c,a,5,cx-f.dashDir*(40+lag*26),FLOOR_Y-12,.42,.55/lag,f.dashDir<0);
  for(const lag of[1,2]){c.save();c.globalAlpha=.2/lag;cell(c,image,sheet,frame,cx-f.dashDir*lag*30,top,flip);c.restore();}}
 if(f?.mode==='heavy'||f?.mode==='sink'){const k=.5+.5*Math.sin(time*9);c.save();c.globalAlpha=.25+.2*k;c.fillStyle='#ffe9a8';c.beginPath();c.ellipse(cx,b.y+b.h+4,62,8,0,0,Math.PI*2);c.fill();c.restore();}
 const shake=f?.mode==='heavy'?Math.sin(time*40)*1.2:0;
 const rotation=f?.mode==='spear'?(flip?-1:1)*.75:0;
 cell(c,image,sheet,frame,cx+shake,top,flip,1,rotation);
 // Collecting the print run: arrows of wind and a glow in the belly.
 if(f?.mode==='collect'){const k=.5+.5*Math.sin(time*12);c.save();c.globalAlpha=.25+.25*k;c.fillStyle='#ffd27a';c.beginPath();c.arc(cx,b.y+b.h*.62,16+k*5,0,Math.PI*2);c.fill();c.restore();}
 if(f?.mode==='crash')fx(c,a,11,cx+f.dashDir*48,FLOOR_Y-30,.5,clamp01(f.timer/.35));
 if(f?.mode==='stuck'&&f.elapsed<.3)fx(c,a,11,f.aimX,f.aimY-24,.55,1-f.elapsed/.3);
 if(b.hurtTime>0)fx(c,a,8,cx,b.y+b.h*.55,.5,clamp01(b.hurtTime/.35));
 return true;
}
function drawTarget(c,a,f,time){
 const k=clamp01(f.elapsed/.9),pulse=.5+.5*Math.sin(time*16);
 c.save();c.globalAlpha=.25+.2*pulse;c.fillStyle='#ff3c3c';c.fillRect(f.aimX-1,0,2,f.aimY);c.restore();
 fx(c,a,7,f.aimX,f.aimY-4,.36+.18*(1-k),.65+.35*pulse);
}
function drawDashLane(c,g,b,time,charge){
 const r=g.platforms.find(s=>s.room===b.room&&s.index===0),dir=b.fight.dashDir,top=FLOOR_Y-DASH_HITBOX.h;
 const from=dir>0?b.x+b.w:r.x+8,to=dir>0?r.x+r.w-8:b.x,pulse=.5+.5*Math.sin(time*10);
 c.save();c.globalAlpha=.10+.12*charge;c.fillStyle='#ff4a4a';c.fillRect(from,top,to-from,DASH_HITBOX.h);
 c.globalAlpha=.45+.4*pulse*charge;for(let x=from;x<to;x+=3)rect(c,x,top,2,2,'#ff8a7a');
 const step=46,offset=(time*120*dir%step+step)%step;
 for(let x=from+offset;x<to-10;x+=step){const cx=Math.round(x),cy=top+DASH_HITBOX.h/2;c.globalAlpha=(.35+.5*charge)*(.6+.4*pulse);
  for(let i=0;i<7;i++){rect(c,cx+dir*(i<4?i:6-i)*2,cy-6+i*2,4,2,'#ffb19a');}}
 c.restore();
}

// Bundles, bursts, leaflet streams and shockwaves.
export function drawSpreaderLeaflets(c,a,g,time){
 const f=g.boss.fight;if(!f||g.room!==g.boss.room)return;
 for(const u of f.bundles)fx(c,a,0,u.x,u.y-10,.26,1);
 for(const s of f.bursts){const k=s.t/.5;if(s.t<.16)fx(c,a,1,s.x,s.y-16,.42,1);else fx(c,a,s.table?3:2,s.x,s.y-(s.table?6:20)-(s.table?0:k*10),s.table?.32:.5,1-k);}
 const leaf=a.spreaderLeaflets;
 if(leaf)for(const s of f.streams){const frame=(s.frame+Math.floor(time*12))%6;c.save();c.globalAlpha=.9;c.drawImage(leaf,frame*88,0,88,80,Math.round(s.x-11),Math.round(s.y-10),22,20);c.restore();}
 if(f.mode==='collect')for(const k of f.sources||[]){const x=g.platforms.find(s=>s.room===g.boss.room&&s.index===0).x+k;fx(c,a,4,x,FLOOR_Y-30,.36,.6+.3*Math.sin(time*10+k));}
 for(const s of f.shocks)fx(c,a,10,s.x,s.y-18,.42,1-s.t/.55,s.vx<0);
}

// Shelter tables: the top keeps its proportions; the legs stretch so only a crouched Uma fits beneath.
export function drawShelter(c,a,g,s){
 const image=a.spreaderShelters;if(!image)return false;
 const littered=!!g.boss.fight?.litter?.[s.index];
 const box=littered?TABLE_LITTERED:TABLE,scale=s.w/box[2],topH=TOP_ROWS*scale,surfaceRow=34*scale;
 const top=s.y-surfaceRow,legs=FLOOR_Y-(top+topH);
 c.drawImage(image,box[0],box[1],box[2],TOP_ROWS,s.x,Math.round(top),s.w,topH);
 c.drawImage(image,box[0],box[1]+TOP_ROWS,box[2],box[3]-TOP_ROWS,s.x,Math.round(top+topH),s.w,Math.max(4,legs));
 return true;
}

// Defeat: the tube unrolls into shreds that scatter and settle.
export function drawSpreaderDefeat(c,a,d){
 const t=d.time,image=a.spreaderTube;if(!image)return false;const cx=d.x+d.w/2,top=d.y+d.h+TUBE.base*TUBE.scale-TUBE.h*TUBE.scale;
 const frame=t<.35?5:7,alpha=t<1.2?1:clamp01(1-(t-1.2)/.5);cell(c,image,TUBE,frame,cx,top-(frame===7?Math.min(18,t*20):0),d.dir<0,alpha);
 for(let i=0;i<10;i++){const angle=i*2.399,travel=Math.max(0,t-.3)*(40+i*9);fx(c,a,2,cx+Math.cos(angle)*travel,d.y+d.h*.4+Math.sin(angle)*travel*.5-travel*.3+Math.max(0,t-.8)*30,.16,clamp01(1.6-t));}
 return true;
}
