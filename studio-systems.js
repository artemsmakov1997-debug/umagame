import {rooms} from './level.js?v=0.21.5';
import {STUDIO_PIECES,SPOTLIGHTS,SPOT_MIN_OVERLAP,TAKES,STUDIO_CHECKPOINTS} from './studio-map.js?v=0.21.5';
import {pitFall,placeAtCheckpoint} from './pit-falls.js?v=0.21.5';
// «Студия» mechanics: risers that exist only in a spotlight (a swinging lamp, or a lamp bank switched on the clapper beat).
// Each frame sets `intangible` on the studio platforms; solidSurfaces() skips those.
export const ROOM=5;
const x0=()=>rooms[ROOM].x;
export function createStudio(){return {checkpoint:0,lastTake:null,lastSwapWarn:-1};}

// Spotlight i: the lit span on the risers' level at time t.
export function spotSpan(light,t){const k=Math.max(-1,Math.min(1,(light.dwell??1)*Math.sin(t*2*Math.PI/light.period+light.phase))),c=light.mid+light.amp*k;return {x:c-light.w/2,w:light.w,center:c};}
export function stageLit(piece,t){return SPOTLIGHTS.some(l=>{const s=spotSpan(l,t);return Math.min(s.x+s.w,piece.x+piece.w)-Math.max(s.x,piece.x)>=Math.min(SPOT_MIN_OVERLAP,piece.w*.5);});}
// «Дубли»: which colour is live, and whether the swap is about to come.
export function liveTake(t){const k=((t%(2*TAKES.beat))+2*TAKES.beat)%(2*TAKES.beat);return {color:k<TAKES.beat?'red':'blue',warn:(k%TAKES.beat)>=TAKES.beat-TAKES.warn,beat:Math.floor(t/TAKES.beat)};}



// Called every frame (also outside "playing", so collisions always match the picture).
export function updateStudioPlatforms(g){
 const q=g.studio??=createStudio(),t=g.time;
 for(const s of g.platforms){if(s.room!==ROOM)continue;const piece=STUDIO_PIECES[s.index];if(!piece)continue;
  if(piece.type==='container'){s.studioState='container';s.intangible=true;}
  else if(piece.type==='stage'){const lit=stageLit(piece,t);s.studioState=lit?'lit':'dark';s.intangible=!lit;}
  else if(piece.type==='take'){const live=liveTake(t);s.studioState=live.color===piece.color?(live.warn?'swap':'live'):'idle';s.intangible=live.color!==piece.color;}
  else{s.studioState='fixed';s.intangible=false;}
 }
}

export function stepStudio(g,dt){
 if(g.room!==ROOM||g.mode!=='playing')return;const q=g.studio??=createStudio(),p=g.player;
 const live=liveTake(g.time);if(live.warn&&q.lastSwapWarn!==live.beat){q.lastSwapWarn=live.beat;g.emit('takeWarning',{x:p.x,y:p.y});}
 if(q.lastTake&&q.lastTake!==live.color)g.emit('takeSwap',{color:live.color,x:p.x,y:p.y});q.lastTake=live.color;
 // One hint per block, the first time Uma meets its rule.
 const hints=q.hints??=new Set(),local=p.x-x0();
 for(const [key,cond,text] of [['stage',local>240,'Подиум видно и держит только в луче прожектора. Иди за светом.'],['take',local>1570,'Прожекторы переключаются по хлопушке. Прыгай, пока мигает свет.']])if(cond&&!hints.has(key)){hints.add(key);g.emit('studioHint',{key,text});}
 for(const [i,c]of STUDIO_CHECKPOINTS.entries())if(i>q.checkpoint&&p.grounded&&p.supportId===ROOM+':'+c.index)q.checkpoint=i;
 updateStudioPlatforms(g);
}

export function studioFall(g){if(g.room!==ROOM)return false;return pitFall(g,ROOM,s=>STUDIO_PIECES[s.index]?.type==='fixed');}
export function placeAtStudioCheckpoint(g){if(g.room!==ROOM||!g.studio)return;placeAtCheckpoint(g,ROOM,STUDIO_CHECKPOINTS,g.studio.checkpoint);}
