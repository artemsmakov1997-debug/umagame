import {rect} from './pixel.js?v=0.21.5';
import {FLOOR_Y,WINDUP,DASH_HITBOX} from './spreader-combat.js?v=0.21.5';
const clamp01=v=>Math.max(0,Math.min(1,v));
// assets/spreader-moves.png: 2 rows × 6 cells of 256×280, facing right.
// Row 0: hover ×2, bombing, dive, landed, dash wind-up. Row 1: dash ×2, skid, stunned, hit, take-off.
const CELL_W=256,CELL_H=280,SCALE=.62;
// Feet rows (ground frames) inside each cell; air frames are centred on the boss box instead.
const FEET={'0:4':250,'0:5':250,'1:0':241,'1:1':243,'1:2':244,'1:3':246,'1:4':263,'1:5':245};
// assets/spreader-leaflets.png: 8 cells of 88×80 (0–5 tumbling, 6–7 landed).
// assets/spreader-shelters.png: table, press table, table with leaflets (2× scale).
const TABLE=[0,18,397,107],TABLE_LITTERED=[814,21,399,104],TOP_ROWS=68;

export function spreaderFrame(b,time){
 const f=b.fight;if(!f)return[0,Math.floor(time*6)%2];
 if(b.hurtTime>0)return[1,4];
 switch(f.mode){
  case 'bombing':return[0,Math.floor(time*8)%3===2?2:Math.floor(time*6)%2];
  case 'dive':return[0,3];
  case 'landed':return[0,4];
  case 'windup':return[0,5];
  case 'dash':return[1,Math.floor(time*14)%2];
  case 'skid':return[1,2];
  case 'stunned':return[1,3];
  case 'takeoff':return[1,5];
  default:return[0,Math.floor(time*6)%2];
 }
}

export function drawSpreader(c,a,g,time){
 const b=g.boss,image=a.spreaderMoves;if(!image)return false;
 const [row,col]=spreaderFrame(b,time),w=CELL_W*SCALE,h=CELL_H*SCALE,feet=FEET[row+':'+col];
 const cx=b.x+b.w/2,y=feet?b.y+b.h-feet*SCALE:b.y+b.h/2-h/2;
 const f=b.fight;
 // Dash line telegraph during the wind-up.
 // A red band marks the dash lane (the hitbox height): Uma must be above it, on a table and jumping.
 if(f?.mode==='windup')drawDashLane(c,g,b,time,clamp01(1-f.timer/WINDUP));
 if(f?.mode==='dash')for(const lag of[1,2]){c.save();c.globalAlpha=.18/lag;draw(c,image,row,col,cx-f.dashDir*lag*34,y,w,h,b.dir<0);c.restore();}
 draw(c,image,row,col,cx,y,w,h,b.dir<0);
 return true;
}
function drawDashLane(c,g,b,time,charge){
 const r=g.platforms.find(s=>s.room===b.room&&s.index===0),dir=b.fight.dashDir,top=FLOOR_Y-DASH_HITBOX.h;
 const from=dir>0?b.x+b.w:r.x+8,to=dir>0?r.x+r.w-8:b.x,pulse=.5+.5*Math.sin(time*10);
 c.save();c.globalAlpha=.10+.12*charge;c.fillStyle='#ff4a4a';c.fillRect(from,top,to-from,DASH_HITBOX.h);
 c.globalAlpha=.45+.4*pulse*charge;for(let x=from;x<to;x+=3)rect(c,x,top,2,2,'#ff8a7a');
 // Chevrons run along the lane in the dash direction.
 const step=46,offset=(time*120*dir%step+step)%step;
 for(let x=from+offset;x<to-10;x+=step){const cx=Math.round(x),cy=top+DASH_HITBOX.h/2;c.globalAlpha=(.35+.5*charge)*(.6+.4*pulse);
  for(let i=0;i<7;i++){rect(c,cx+dir*(i<4?i:6-i)*2,cy-6+i*2,4,2,'#ffb19a');}}
 c.restore();
}
function draw(c,image,row,col,cx,y,w,h,flip){
 c.save();if(flip){c.translate(cx,0);c.scale(-1,1);cx=0;}
 c.drawImage(image,col*CELL_W,row*CELL_H,CELL_W,CELL_H,Math.round(cx-w/2),Math.round(y),w,h);c.restore();
}

export function drawSpreaderLeaflets(c,a,g,time){
 const f=g.boss.fight,image=a.spreaderLeaflets;if(!f||!image||g.room!==2)return;
 for(const l of f.leaflets){
  const frame=l.landed?(l.landed<.25?6:7):(l.frame+Math.floor(time*10))%6;
  c.save();if(l.landed)c.globalAlpha=Math.max(0,1-l.landed/.55);
  c.drawImage(image,frame*88,0,88,80,Math.round(l.x-15),Math.round(l.y-(l.landed?26:14)),30,27);c.restore();
 }
}

// Shelter tables: the top keeps its proportions; the legs stretch so only a crouched Uma fits beneath.
export function drawShelter(c,a,g,s){
 const image=a.spreaderShelters;if(!image)return false;
 const littered=g.boss.fight?.leaflets.some(l=>l.landed&&l.x>s.x&&l.x<s.x+s.w&&Math.abs(l.y-s.y)<2);
 const box=littered?TABLE_LITTERED:TABLE,scale=s.w/box[2],topH=TOP_ROWS*scale,surfaceRow=34*scale;
 const top=s.y-surfaceRow,legs=FLOOR_Y-(top+topH);
 c.drawImage(image,box[0],box[1],box[2],TOP_ROWS,s.x,Math.round(top),s.w,topH);
 c.drawImage(image,box[0],box[1]+TOP_ROWS,box[2],box[3]-TOP_ROWS,s.x,Math.round(top+topH),s.w,Math.max(4,legs));
 return true;
}
