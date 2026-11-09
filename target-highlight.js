import {rect} from './pixel.js?v=0.21.5';
import {agitatorTargets} from './agitator-combat.js?v=0.21.5';
import {infoshumTargets} from './infoshum-combat.js?v=0.21.5';
import {spreaderExposed} from './spreader-combat.js?v=0.21.5';
import {manipulatorExposed} from './manipulator-combat.js?v=0.21.5';
import {INFOSHUM_ATLAS} from './infoshum-atlas.js?v=0.21.5';
// Boss targets: a soft pulsing glow on exactly the area a paw swing must touch, plus a small
// bobbing chevron above it. Only targets that can be hit right now are marked.
export const TARGET_GOLD='#ffd36e',TARGET_PINK='#ff7fd8';

export function bossTargets(g){
 const b=g.boss,out=[];if(!b?.active||b.hp<=0||g.mode!=='playing'&&g.mode!=='paused')return out;
 if(g.room===6&&b.id==='manipulator'&&manipulatorExposed(b))out.push({id:'manipulator',x:b.x-4,y:b.y+4,w:b.w+8,h:b.h-4,color:TARGET_GOLD});
 if(g.room===2&&b.id==='spreader'&&spreaderExposed(b))out.push({id:'spreader',x:b.x-4,y:b.y+6,w:b.w+8,h:b.h-6,color:TARGET_GOLD});
 const n=b.broadcast;
 // Agitator: the robot is marked only while he is open (overheated megaphone, back turned on «УРА!», on his tower).
 if(g.room===4&&n)for(const box of agitatorTargets(g))out.push({...box,color:TARGET_GOLD});
 // Infoshum: the core while his cable is anchored, the real figure stuck in the floor. The real screen is never marked.
 if(g.room===8&&b.network)for(const box of infoshumTargets(g))out.push({...box,color:TARGET_PINK});
 return out;
}

// The marker (assets/target-marker-gold.png / -pink.png, infoshum-atlas.js «marker»): four corner brackets around
// the hit area, a soft glow behind it, a bobbing arrow with a paw print above, and a paw-shaped flash on the hit.
// Without the sheets the code-drawn version is used.
let lastBox=null;
export function drawTargetHighlights(c,g,t,a){
 const boxes=bossTargets(g);for(const box of boxes)drawTargetGlow(c,box,t,a);
 if(boxes.length)lastBox=boxes[0];
 // The paw flash plays where the last marked target was, for the moment after the hit.
 const b=g.boss;if(lastBox&&b?.hurtTime>0&&b.room===g.room)drawTargetFlash(c,lastBox,1-b.hurtTime/.35,a);
 if(!boxes.length&&!(b?.hurtTime>0))lastBox=null;
}
function markerSheet(box,a){const gold=box.color===TARGET_GOLD;return {img:a?.[gold?'targetMarkerGold':'targetMarkerPink'],m:INFOSHUM_ATLAS.marker[gold?'gold':'pink']};}
function put(c,img,p,cx,cy,w,alpha=1){if(!p)return;const h=w*p.r[3]/p.r[2];c.save();c.globalAlpha*=alpha;c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(cx-w/2),Math.round(cy-h/2),Math.round(w),Math.round(h));c.restore();}
function drawTargetFlash(c,box,k,a){const {img,m}=markerSheet(box,a);if(!img?.complete||!img.naturalWidth||k<0||k>1)return;put(c,img,m['f'+Math.min(2,Math.floor(k*3))],box.x+box.w/2,box.y+box.h/2,Math.max(56,Math.min(110,box.w*.9))*(1+k*.3),1-k*.5);}
export function drawTargetGlow(c,box,t,a){
 const {img,m}=markerSheet(box,a);
 if(img?.complete&&img.naturalWidth){
  const pulse=.5+.5*Math.sin(t*5),cx=box.x+box.w/2,cy=box.y+box.h/2,size=Math.max(18,Math.min(30,Math.min(box.w,box.h)*.4)),pad=size*.35;
  // A soft round glow behind the target (the sheet's glow blobs are cut square, so it is drawn as a gradient).
  const R=Math.min(120,Math.max(box.w,box.h)*.8+18),gr=c.createRadialGradient(cx,cy,0,cx,cy,R);gr.addColorStop(0,box.color+'66');gr.addColorStop(1,box.color+'00');c.save();c.globalAlpha=.55+.35*pulse;c.fillStyle=gr;c.fillRect(cx-R,cy-R,R*2,R*2);c.restore();
  const x0=box.x-pad,y0=box.y-pad,x1=box.x+box.w+pad,y1=box.y+box.h+pad,o=size/2;
  put(c,img,m.c0,x0+o,y0+o,size,.95);put(c,img,m.c1,x1-o,y0+o,size,.95);put(c,img,m.c2,x0+o,y1-o,size,.95);put(c,img,m.c3,x1-o,y1-o,size,.95);
  const f=Math.floor(t*6)%4,bob=Math.round(Math.abs(Math.sin(t*4))*5);put(c,img,m['a'+f],cx,y0-20-bob,30);
  return;
 }
 {
  const pulse=.5+.5*Math.sin(t*5),cx=box.x+box.w/2;
  c.save();
  // Layered glow: wide and faint, then tighter and brighter.
  for(const [grow,alpha] of [[14,.08],[8,.12],[3,.16]]){c.globalAlpha=alpha*(.6+.4*pulse);rect(c,box.x-grow,box.y-grow,box.w+grow*2,box.h+grow*2,box.color);}
  // Corner brackets frame the exact hit area.
  c.globalAlpha=.55+.35*pulse;const L=8,x0=box.x-4,y0=box.y-4,x1=box.x+box.w+4,y1=box.y+box.h+4;
  for(const [x,y,dx,dy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]){rect(c,dx>0?x:x-L,y-(dy>0?0:2),L,2,box.color);rect(c,x-(dx>0?0:2),dy>0?y:y-L,2,L,box.color);}
  // Bobbing chevron above.
  const ay=box.y-18-Math.round(Math.abs(Math.sin(t*4))*5);c.globalAlpha=.85;
  for(let i=0;i<4;i++)rect(c,cx-7+i*2,ay+i*2,14-i*4,2,box.color);
  c.restore();
 }
}
