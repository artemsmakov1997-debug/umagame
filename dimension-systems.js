import {rooms} from './level.js?v=0.21.5';
import {DIM_ROOM,FEED,MIRROR,RIFTS,ORIGINALS,DIM_CHECKPOINTS,CRUMBLE,isSafeDimPiece,slideX} from './dimension-map.js?v=0.21.5';
import {pitFall,placeAtCheckpoint} from './pit-falls.js?v=0.21.5';
// «Измерение» mechanics: rising message copies (and their upside-down mirror), gravity rifts, «первоисточники».
const x0=()=>rooms[DIM_ROOM].x;
export function createDimension(){return {checkpoint:0,hints:{},riftCooldown:0,riftFlash:{}};}
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
 if(piece.type==='copy'){
  // A reversed copy is the mirror image: it sinks from the ceiling and Uma hangs under its line.
  const f=feedState(piece,g.time),y=piece.reversed?MIRROR-f.y:f.y,wrapped=piece.reversed?y<s.y-60:y>s.y+60;
  // A purple copy crumbles under Uma (she stands on it, or hangs under it in «Изнанка») and stays gone until it wraps.
  if(wrapped)delete s.crumbleAt;
  const p=g.player,under=!piece.blue&&p&&p.grounded&&p.supportId===s.id&&g.room===DIM_ROOM;
  if(under&&s.crumbleAt===undefined){s.crumbleAt=g.time;g.emit?.('messageCrack',{x:s.x+s.w/2,y:s.y});}
  const age=s.crumbleAt===undefined?-1:g.time-s.crumbleAt;if(age<-.01)delete s.crumbleAt;
  const state=age>=CRUMBLE.pop?'pop':age>=CRUMBLE.crack?'fade':f.state;
  s.y=y;s.dimState=state;s.intangible=piece.inverted||state==='pop';
  if(wrapped){s.prevY=s.y;s.dy=0;}else s.dy=s.y-s.prevY;
  // A Кликбейт sitting on a copy rides it (pinned here; the world step then adds this frame's dy), reappears with it
  // after a wrap and cannot bite while its bubble pops.
  for(const e of g.enemies||[])if(e.ride&&e.room===DIM_ROOM&&e.platformIndex===s.index&&!e.dead){e.y=s.y-e.h-s.dy;e.x=Math.max(s.x,Math.min(s.x+s.w-e.w,e.x));e.phased=state==='pop';}
  return;
 }
 if(piece.type==='slide'){const x=rooms[DIM_ROOM].x+slideX(piece,g.time);s.dx=x-s.prevX;s.x=x;s.dimState='slide';s.intangible=false;
  // A Кликбейт riding a slide keeps its place on it (pinned here; the world step adds this frame's dx).
  for(const e of g.enemies||[])if(e.ride&&e.room===DIM_ROOM&&e.platformIndex===s.index&&!e.dead){const room=Math.max(0,s.w-e.w);e.rideOffset=Math.max(0,Math.min(room,e.rideOffset===undefined?e.x-s.prevX:e.x-s.prevX));e.x=s.x+e.rideOffset-s.dx;e.y=s.y-e.h;}
  return;}
 if(piece.inverted){s.intangible=true;s.dimState='hanging';return;}
 s.dimState=piece.type;s.intangible=false;
}
// Snap every piece to the current time (room entry, retry) without carrying anyone.
export function updateDimensionPlatforms(g){for(const s of g.platforms)if(s.room===DIM_ROOM&&s.dim){placeDimensionPiece(g,s);s.prevY=s.y;s.dy=0;s.prevX=s.x;s.dx=0;}}

// Physics for the upside-down Uma: she stands *under* hanging islands, their line is the floor above her.
export function landFlipped(g,prevTop){
 const p=g.player;if(!p.flipped||p.vy>0)return;
 const s=g.platforms.filter(s=>s.room===g.room&&s.dim?.inverted&&s.dimState!=='pop'&&p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevTop>=s.y-1&&p.y<=s.y).sort((a,b)=>b.y-a.y)[0];
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
 q.riftCooldown=Math.max(0,q.riftCooldown-dt);
 for(const k of Object.keys(q.riftFlash))q.riftFlash[k]=Math.max(0,q.riftFlash[k]-dt);
 if(p.grounded)p.launch=0;
 // Rifts: crossing the line flips gravity.
 const c0=oldX+p.w/2,c1=p.x+p.w/2;
 RIFTS.forEach((r,i)=>{const X=x0()+r.x;if(q.riftCooldown>0||c0===c1||(c0-X)*(c1-X)>0||p.y+p.h<r.y||p.y>r.y+r.h)return;
  p.flipped=!p.flipped;p.vy=0;p.grounded=false;p.supportId=null;p.launch=0;q.riftCooldown=.3;q.riftFlash[i]=.45;g.emit('riftFlip',{x:X,y:p.y,flipped:p.flipped});});
 // «Первоисточники».
 for(const o of g.originals||[])if(o.room===DIM_ROOM&&!o.taken&&g.overlap(p,o)){o.taken=true;g.emit('sourceFound',{x:o.x,y:o.y,count:originalsFound(g),total:ORIGINALS.length});}
 // Checkpoints and one hint per block.
 DIM_CHECKPOINTS.forEach((c,i)=>{if(i>q.checkpoint&&p.grounded&&p.supportId===DIM_ROOM+':'+c.index&&local>=c.x-30)q.checkpoint=i;});
 for(const [key,from] of [['feed',-1],['flip',700],['back',1520],['slide',1860]])if(!q.hints[key]&&local>from){q.hints[key]=true;g.emit('dimensionHint',{kind:key});}
}
