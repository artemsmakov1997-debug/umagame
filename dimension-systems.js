import {rooms} from './level.js?v=0.21.5';
import {DIM_ROOM,DIM_PIECES,FEED,ENVELOPES,ENVELOPE,RIFTS,ORIGINALS,DIM_CHECKPOINTS,isSafeDimPiece} from './dimension-map.js?v=0.21.5';
import {pitFall,placeAtCheckpoint} from './pit-falls.js?v=0.21.5';
// «Измерение» mechanics: rising message copies, envelope portals with a launch, gravity rifts, «первоисточники».
const x0=()=>rooms[DIM_ROOM].x;
export function createDimension(){return {checkpoint:0,hints:{},riftCooldown:0,envelopeCooldown:0,deadLinkTime:0,used:{},riftFlash:{}};}
export function createOriginals(){return ORIGINALS.map(o=>({...o,room:DIM_ROOM,x:rooms[DIM_ROOM].x+o.x,y:o.y,w:30,h:30,taken:false}));}
export const originalsFound=g=>(g.originals||[]).filter(o=>o.taken).length;

// A copy in a feed lane: where it is and whether it is about to pop.
export function feedState(piece,t){
 const range=FEED.bottom-FEED.top,spacing=range/FEED.perLane;
 const travel=((FEED.speed*t+(piece.slot+FEED.lanePhase[piece.lane])*spacing)%range+range)%range,k=travel/range;
 return {y:FEED.bottom-travel,k,state:k>=FEED.pop?'pop':k>=FEED.fade?'fade':'rise'};
}
// Runs inside the world-platform step after prev positions are stored, and on its own outside play.
export function placeDimensionPiece(g,s){
 const piece=s.dim;if(!piece)return;
 if(piece.inverted){s.intangible=true;s.dimState='hanging';return;}
 if(piece.type!=='copy'){s.dimState=piece.type;s.intangible=false;return;}
 const f=feedState(piece,g.time),wrapped=f.y>s.y+60;s.y=f.y;s.dimState=f.state;s.intangible=f.state==='pop';
 if(wrapped){s.prevY=s.y;s.dy=0;}else s.dy=s.y-s.prevY;
}
// Snap every piece to the current time (room entry, retry) without carrying anyone.
export function updateDimensionPlatforms(g){for(const s of g.platforms)if(s.room===DIM_ROOM&&s.dim){placeDimensionPiece(g,s);s.prevY=s.y;s.dy=0;}}

const envelopeBox=e=>({x:x0()+e.x+8,y:e.y-ENVELOPE.h+8,w:ENVELOPE.w-16,h:ENVELOPE.h-8});
// Leave the paired envelope with a launch. Entering faster (a dash, a long fall) can add speed.
export function launchFrom(g,out,entry){
 const p=g.player,speed=out.minSpeed+Math.max(0,entry-155)*(out.gain||0),a=out.angle*Math.PI/180;
 Object.assign(p,{x:x0()+out.x+ENVELOPE.w/2-p.w/2+out.dir*14,y:out.y-10-p.h,vx:out.dir*speed*Math.cos(a),vy:-speed*Math.sin(a),grounded:false,supportId:null,dash:0,climbing:false,sneaking:false});
 p.launch=ENVELOPE.launch;p.launchVx=p.vx;p.dir=out.dir;
}
// Physics for the upside-down Uma: she stands *under* hanging islands, their line is the floor above her.
export function landFlipped(g,prevTop){
 const p=g.player;if(!p.flipped||p.vy>0)return;
 const s=g.platforms.filter(s=>s.room===g.room&&s.dim?.inverted&&p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevTop>=s.y-1&&p.y<=s.y).sort((a,b)=>b.y-a.y)[0];
 if(s){p.y=s.y;p.vy=0;p.grounded=true;p.supportId=s.id;p.launch=0;}
}
export function dimensionFall(g){
 if(g.room!==DIM_ROOM||!hasPieces(g))return false;const p=g.player;
 if(!(p.y>500||p.flipped&&p.y+p.h<-30))return false;
 p.flipped=false;p.launch=0;return pitFall(g,DIM_ROOM,s=>isSafeDimPiece(s.dim));
}
export function placeAtDimensionCheckpoint(g){if(g.room!==DIM_ROOM)return;g.player.flipped=false;g.player.launch=0;placeAtCheckpoint(g,DIM_ROOM,DIM_CHECKPOINTS,g.dimension?.checkpoint||0);}

const hasPieces=g=>g.platforms.some(s=>s.room===DIM_ROOM&&s.dim);
export function stepDimension(g,dt,oldX){
 if(g.room!==DIM_ROOM||g.mode!=='playing'||!hasPieces(g))return;
 const q=g.dimension??=createDimension(),p=g.player,local=p.x-x0();
 q.riftCooldown=Math.max(0,q.riftCooldown-dt);q.envelopeCooldown=Math.max(0,q.envelopeCooldown-dt);q.deadLinkTime=Math.max(0,q.deadLinkTime-dt);
 for(const k of Object.keys(q.used))q.used[k]=Math.max(0,q.used[k]-dt);for(const k of Object.keys(q.riftFlash))q.riftFlash[k]=Math.max(0,q.riftFlash[k]-dt);
 if(p.grounded)p.launch=0;
 // Rifts: crossing the line flips gravity.
 const c0=oldX+p.w/2,c1=p.x+p.w/2;
 RIFTS.forEach((r,i)=>{const X=x0()+r.x;if(q.riftCooldown>0||c0===c1||(c0-X)*(c1-X)>0||p.y+p.h<r.y||p.y>r.y+r.h)return;
  p.flipped=!p.flipped;p.vy=0;p.grounded=false;p.supportId=null;p.launch=0;q.riftCooldown=.3;q.riftFlash[i]=.45;g.emit('riftFlip',{x:X,y:p.y,flipped:p.flipped});});
 // Envelopes.
 if(q.envelopeCooldown===0)for(const e of ENVELOPES){
  if(!g.overlap(p,envelopeBox(e)))continue;
  if(e.role==='dead'){if(q.deadLinkTime===0){q.deadLinkTime=1;g.emit('deadLink',{x:x0()+e.x,y:e.y});}continue;}
  if(e.role!=='in')continue;
  const out=ENVELOPES.find(o=>o.id===e.pair),entry=Math.hypot(p.vx,p.vy);
  q.used[e.id]=.5;q.used[out.id]=.6;q.envelopeCooldown=.5;g.emit('envelopeIn',{x:x0()+e.x,y:e.y});launchFrom(g,out,entry);g.emit('envelopeOut',{x:x0()+out.x,y:out.y});g.updateCamera?.();break;
 }
 // «Первоисточники».
 for(const o of g.originals||[])if(o.room===DIM_ROOM&&!o.taken&&g.overlap(p,o)){o.taken=true;g.emit('sourceFound',{x:o.x,y:o.y,count:originalsFound(g),total:ORIGINALS.length});}
 // Checkpoints and one hint per block.
 DIM_CHECKPOINTS.forEach((c,i)=>{if(i>q.checkpoint&&p.grounded&&p.supportId===DIM_ROOM+':'+c.index&&local>=c.x-30)q.checkpoint=i;});
 for(const [key,from] of [['feed',-1],['envelope',700],['rift',1540]])if(!q.hints[key]&&local>from){q.hints[key]=true;g.emit('dimensionHint',{kind:key});}
}
