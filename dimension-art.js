import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {DIM_ROOM,RIFTS,DIM_PIECES} from './dimension-map.js?v=0.21.5';
// «Измерение» art. assets/dimension-pieces.png (4×3): Yuri's message, copy, fading copy, popping copy; island,
// hanging island, rift, rift flash; «первоисточник», threshold shut/open, cable.
const P={yuri:[58,125,320,138],copy:[425,125,321,139],fade:[789,125,315,138],pop:[1142,85,344,195],
 island:[40,409,343,181],hanging:[419,383,335,184],rift:[838,325,216,316],riftFlash:[1176,328,290,322],
 source:[55,723,294,217],gateShut:[387,664,362,279],gateOpen:[769,663,360,280],cable:[1169,735,319,203]};
const X0=()=>rooms[DIM_ROOM].x;
function blit(c,image,box,x,y,w,h,flip=false){if(!image)return;c.save();if(flip){c.translate(x+w,y);c.scale(-1,1);x=0;y=0;}c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();}
function drawBaitBubble(c,img,s,t){
 const box=P.yuri,k=s.w/box[2],w=box[2]*k,h=box[3]*k,cx=s.x+w/2,cy=s.y+h/2-3,pulse=.5+.5*Math.sin(t*6);
 c.save();const halo=c.createRadialGradient(cx,cy,8,cx,cy,w*.75);halo.addColorStop(0,`rgba(255,120,210,${.45+.25*pulse})`);halo.addColorStop(1,'rgba(255,120,210,0)');c.fillStyle=halo;c.fillRect(cx-w,cy-w*.75,2*w,1.5*w);c.restore();
 c.save();c.filter=`hue-rotate(125deg) saturate(1.9) brightness(${1.25+.15*pulse}) drop-shadow(0 0 ${4+4*pulse}px #ffd34a)`;blit(c,img,box,s.x,s.y-3,w,h);c.restore();
 // Sparkles circling the bubble.
 c.save();for(let i=0;i<4;i++){const a=t*2.2+i*Math.PI/2,x=cx+Math.cos(a)*w*.56,y=cy+Math.sin(a)*h*.75,r=2+((i+Math.floor(t*8))%2);c.fillStyle=i%2?'#fff6b0':'#ffffff';c.fillRect(Math.round(x-r),Math.round(y),r*2+1,1);c.fillRect(Math.round(x),Math.round(y-r),1,r*2+1);}c.restore();
 // A red notification badge with «!», bobbing on the corner.
 const bx=Math.round(s.x+w-6),by=Math.round(s.y-10+Math.sin(t*5)*2);c.save();c.fillStyle='#2a0418';c.beginPath();c.arc(bx,by,9,0,Math.PI*2);c.fill();c.fillStyle='#ff2e57';c.beginPath();c.arc(bx,by,7,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.fillRect(bx-1,by-5,3,6);c.fillRect(bx-1,by+2,3,2);c.restore();
}
// Platforms: bubbles keep their flat top on the platform line; islands hang below or rise above it.
export function drawDimensionSurface(c,a,g,s){
 if(s.room!==DIM_ROOM||!s.dim||!a.dimensionPieces)return false;const img=a.dimensionPieces,piece=s.dim;
 if(piece.type==='yuri'||piece.type==='copy'||piece.type==='slide'){
  // Upside-down messages are the same bubbles mirrored about their line: Uma hangs under them.
  // A blue message at the very top of the feed fades out and is gone for a moment before it comes back below.
  if(piece.blue&&s.dimState==='pop')return true;
  if(piece.inverted){c.save();c.translate(0,2*s.y);c.scale(1,-1);}
  if(piece.blue&&s.dimState==='fade'){c.save();c.globalAlpha=.55+.45*Math.abs(Math.sin(g.time*14));}
  // Yuri's own blue messages hold; purple forwarded copies crack and pop (see dimension-systems.js).
  // A bright bait bubble (dimension-map.js isBaitCopy) glows hot pink and gold, sparkles and wears a red badge.
  if(s.bait&&s.dimState!=='pop'){drawBaitBubble(c,img,s,g.time);if(piece.blue&&s.dimState==='fade')c.restore();if(piece.inverted)c.restore();return true;}
  const box=piece.blue?P.yuri:s.dimState==='pop'?P.pop:s.dimState==='fade'?P.fade:P.copy,k=s.w/(box===P.pop?P.copy[2]:box[2]);
  const top=box===P.pop?s.y-(P.copy[1]-P.pop[1])*k:s.y-3;blit(c,img,box,s.x-(box===P.pop?(box[2]-P.copy[2])*k/2:0),top,box[2]*k,box[3]*k);
  if(piece.blue&&s.dimState==='fade')c.restore();
  if(piece.inverted)c.restore();return true;
 }
 if(piece.inverted){const box=P.hanging,k=s.w/box[2];blit(c,img,box,s.x,s.y-box[3]*k+6,s.w,box[3]*k);return true;}
 const box=P.island,k=s.w/box[2];blit(c,img,box,s.x,s.y-3,s.w,box[3]*k);return true;
}
// Rifts, the originals and the threshold.
export function drawDimensionProps(c,a,g,t){
 if(g.room!==DIM_ROOM)return;const x0=X0(),q=g.dimension||{},p=g.player;
 if(a.dimensionPieces){
  RIFTS.forEach((r,i)=>{const flash=(q.riftFlash?.[i]||0)>0,box=flash?P.riftFlash:P.rift,h=r.h,w=box[2]*h/box[3];
   c.save();c.globalAlpha=flash?1:.82+.18*Math.sin(t*4+i);blit(c,a.dimensionPieces,box,x0+r.x-w/2,r.y,w,h);c.restore();});
  // The threshold of Infoshum opens as Uma comes near: there is no lock any more.
  const door=DIM_PIECES.at(-1),gx=x0+door.x+6,near=p.x>x0+door.x-70,box=near?P.gateOpen:P.gateShut,gw=104,gh=box[3]*gw/box[2];blit(c,a.dimensionPieces,box,gx,door.y-gh+6,gw,gh);
  for(const o of g.originals||[]){if(o.room!==DIM_ROOM||o.taken)continue;const bob=Math.sin(t*3+o.x)*3,w=40,h=P.source[3]*w/P.source[2];blit(c,a.dimensionPieces,P.source,o.x+o.w/2-w/2,o.y+bob-3,w,h);}
  for(const [x,y,flip] of [[x0+40,0,false],[x0+700,0,true],[x0+1860,236,false]])blit(c,a.dimensionPieces,P.cable,x,y,64,41,flip);
 }
}
