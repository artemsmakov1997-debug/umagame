import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {DIM_ROOM,ENVELOPES,ENVELOPE,RIFTS} from './dimension-map.js?v=0.21.5';
// «Измерение» art. assets/dimension-pieces.png (4×3): Yuri's message, copy, fading copy, popping copy; island,
// hanging island, rift, rift flash; «первоисточник», threshold shut/open, cable. assets/dimension-envelopes.png (4×2):
// closed, open, swallowing, throwing; dead link ×2; tags ×3 and ×1.
const P={yuri:[58,125,320,138],copy:[425,125,321,139],fade:[789,125,315,138],pop:[1142,85,344,195],
 island:[40,409,343,181],hanging:[419,383,335,184],rift:[838,325,216,316],riftFlash:[1176,328,290,322],
 source:[55,723,294,217],gateShut:[387,664,362,279],gateOpen:[769,663,360,280],cable:[1169,735,319,203]};
const E={closed:[49,166,329,246],open:[425,106,313,313],swallow:[778,106,326,313],throw:[1144,106,371,317],
 dead:[57,666,296,227],deadSpark:[412,594,324,314],tag3:[792,622,305,274],tag1:[1174,623,306,275]};
const X0=()=>rooms[DIM_ROOM].x;
function blit(c,image,box,x,y,w,h,flip=false){if(!image)return;c.save();if(flip){c.translate(x+w,y);c.scale(-1,1);x=0;y=0;}c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();}
// Platforms: bubbles keep their flat top on the platform line; islands hang below or rise above it.
export function drawDimensionSurface(c,a,g,s){
 if(s.room!==DIM_ROOM||!s.dim||!a.dimensionPieces)return false;const img=a.dimensionPieces,piece=s.dim;
 if(piece.type==='yuri'||piece.type==='copy'){
  const box=piece.type==='yuri'?P.yuri:s.dimState==='pop'?P.pop:s.dimState==='fade'?P.fade:P.copy,k=s.w/(box===P.pop?P.copy[2]:box[2]);
  const top=box===P.pop?s.y-(P.copy[1]-P.pop[1])*k:s.y-3;blit(c,img,box,s.x-(box===P.pop?(box[2]-P.copy[2])*k/2:0),top,box[2]*k,box[3]*k);return true;
 }
 if(piece.inverted){const box=P.hanging,k=s.w/box[2];blit(c,img,box,s.x,s.y-box[3]*k+6,s.w,box[3]*k);return true;}
 const box=P.island,k=s.w/box[2];blit(c,img,box,s.x,s.y-3,s.w,box[3]*k);return true;
}
// Rifts, envelopes, the originals and the threshold.
export function drawDimensionProps(c,a,g,t){
 if(g.room!==DIM_ROOM)return;const x0=X0(),q=g.dimension||{},p=g.player;
 if(a.dimensionPieces){
  RIFTS.forEach((r,i)=>{const flash=(q.riftFlash?.[i]||0)>0,box=flash?P.riftFlash:P.rift,h=r.h,w=box[2]*h/box[3];
   c.save();c.globalAlpha=flash?1:.82+.18*Math.sin(t*4+i);blit(c,a.dimensionPieces,box,x0+r.x-w/2,r.y,w,h);c.restore();});
  // The threshold of Infoshum opens as Uma comes near: there is no lock any more.
  const gx=x0+2156,near=p.x>x0+2080,box=near?P.gateOpen:P.gateShut,gw=104,gh=box[3]*gw/box[2];blit(c,a.dimensionPieces,box,gx,300-gh+6,gw,gh);
  for(const o of g.originals||[]){if(o.room!==DIM_ROOM||o.taken)continue;const bob=Math.sin(t*3+o.x)*3,w=40,h=P.source[3]*w/P.source[2];blit(c,a.dimensionPieces,P.source,o.x+o.w/2-w/2,o.y+bob-3,w,h);}
  for(const [x,y,flip] of [[x0+40,0,false],[x0+1240,0,true],[x0+1860,236,false]])blit(c,a.dimensionPieces,P.cable,x,y,64,41,flip);
 }
 if(a.dimensionEnvelopes)for(const e of ENVELOPES){
  const used=(q.used?.[e.id]||0)>0,close=Math.abs(p.x+p.w/2-(x0+e.x+ENVELOPE.w/2))<90&&Math.abs(p.y+p.h-e.y)<110;
  const box=e.role==='dead'?(close&&(q.deadLinkTime||0)>0?E.deadSpark:E.dead):e.role==='out'?(used?E.throw:E.open):used||close?E.swallow:E.open;
  const k=72/E.closed[2],w=box[2]*k,h=box[3]*k,flip=(e.dir||1)<0;blit(c,a.dimensionEnvelopes,box,x0+e.x+ENVELOPE.w/2-w/2,e.y-h+4,w,h,flip);
  if(e.tag){const tb=e.tag===3?E.tag3:E.tag1,tw=34,th=tb[3]*tw/tb[2];blit(c,a.dimensionEnvelopes,tb,x0+e.x+ENVELOPE.w-6,e.y-ENVELOPE.h-th+18,tw,th);}
 }
}
