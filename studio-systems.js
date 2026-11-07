import {rooms} from './level.js?v=0.21.5';
import {STUDIO_PIECES,HOLO,SPOTLIGHTS,SPOT_MIN_OVERLAP,TAKES,FAKES,STUDIO_CHECKPOINTS} from './studio-map.js?v=0.21.5';
import {pitFall,placeAtCheckpoint} from './pit-falls.js?v=0.21.5';
// «Студия» mechanics: vanishing holograms, risers that exist only in a spotlight, red/blue «дубли» on the clapper beat,
// and Дипфейк's fake platforms. Each frame sets `intangible` on the studio platforms; solidSurfaces() skips those.
export const ROOM=5;
const x0=()=>rooms[ROOM].x;
export function createStudio(){return {holo:{},checkpoint:0,lastTake:null,lastSwapWarn:-1};}

// Spotlight i: the lit span on the risers' level at time t.
export function spotSpan(light,t){const k=Math.max(-1,Math.min(1,(light.dwell??1)*Math.sin(t*2*Math.PI/light.period+light.phase))),c=light.mid+light.amp*k;return {x:c-light.w/2,w:light.w,center:c};}
export function stageLit(piece,t){return SPOTLIGHTS.some(l=>{const s=spotSpan(l,t);return Math.min(s.x+s.w,piece.x+piece.w)-Math.max(s.x,piece.x)>=Math.min(SPOT_MIN_OVERLAP,piece.w*.5);});}
// «Дубли»: which colour is live, and whether the swap is about to come.
export function liveTake(t){const k=((t%(2*TAKES.beat))+2*TAKES.beat)%(2*TAKES.beat);return {color:k<TAKES.beat?'red':'blue',warn:(k%TAKES.beat)>=TAKES.beat-TAKES.warn,beat:Math.floor(t/TAKES.beat)};}
// A blinking hologram's own cycle.
function blinkPhase(b,t){const k=(((t+b.phase)%b.period)+b.period)%b.period;return k<HOLO.warn?'warn':k<HOLO.warn+1.2?'gone':'solid';}

export function fakeActive(g,fake){return g.enemies.some(e=>e.type==='deepfake'&&e.room===ROOM&&e.fakeOwner===fake.owner&&!e.dead&&e.active);}
export function fakesFor(g){return FAKES.map(f=>({...f,active:fakeActive(g,f)}));}

// Called every frame (also outside "playing", so collisions always match the picture).
export function updateStudioPlatforms(g){
 const q=g.studio??=createStudio(),t=g.time;
 for(const s of g.platforms){if(s.room!==ROOM)continue;const piece=STUDIO_PIECES[s.index];if(!piece)continue;
  if(piece.type==='holo'){const h=q.holo[s.index]||'solid',b=piece.blink?blinkPhase(piece.blink,t):'solid',state=[h,b].includes('gone')?'gone':[h,b].includes('back')?'back':[h,b].includes('warn')?'warn':'solid';s.studioState=state;s.intangible=state==='gone';}
  else if(piece.type==='stage'){const lit=stageLit(piece,t);s.studioState=lit?'lit':'dark';s.intangible=!lit;}
  else if(piece.type==='take'){const live=liveTake(t);s.studioState=live.color===piece.color?(live.warn?'swap':'live'):'idle';s.intangible=live.color!==piece.color;}
  else{s.studioState='fixed';s.intangible=false;}
 }
}

export function stepStudio(g,dt){
 if(g.room!==ROOM||g.mode!=='playing')return;const q=g.studio??=createStudio(),p=g.player;
 // Holograms under Uma: warn → gone → back.
 for(const [index,piece] of STUDIO_PIECES.entries()){if(piece.type!=='holo')continue;const state=q.holo[index];
  if(!state&&p.grounded&&p.supportId===ROOM+':'+index){q.holo[index]='warn';q['holoTimer'+index]=HOLO.warn;g.emit('holoWarning',{x:x0()+piece.x+piece.w/2,y:piece.y});continue;}
  if(!state)continue;q['holoTimer'+index]-=dt;if(q['holoTimer'+index]>0)continue;
  if(state==='warn'){q.holo[index]='gone';q['holoTimer'+index]=HOLO.gone;g.emit('holoVanish',{x:x0()+piece.x+piece.w/2,y:piece.y});}
  else if(state==='gone'){q.holo[index]='back';q['holoTimer'+index]=HOLO.back;}
  else delete q.holo[index];
 }
 const live=liveTake(g.time);if(live.warn&&q.lastSwapWarn!==live.beat){q.lastSwapWarn=live.beat;g.emit('takeWarning',{x:p.x,y:p.y});}
 if(q.lastTake&&q.lastTake!==live.color)g.emit('takeSwap',{color:live.color,x:p.x,y:p.y});q.lastTake=live.color;
 // One hint per block, the first time Uma meets its rule.
 const hints=q.hints??=new Set(),local=p.x-x0();
 for(const [key,cond,text] of [['holo',Object.keys(q.holo).length>0,'Голограмма гаснет под лапами — не стой на месте!'],['stage',local>990,'Подиум держит только в луче прожектора. Иди за светом.'],['take',local>1570,'Дубли сменяются по хлопушке. Прыгай, пока мигает табло.']])if(cond&&!hints.has(key)){hints.add(key);g.emit('studioHint',{key,text});}
 for(const [i,c]of STUDIO_CHECKPOINTS.entries())if(i>q.checkpoint&&p.grounded&&p.supportId===ROOM+':'+c.index)q.checkpoint=i;
 updateStudioPlatforms(g);
}

export function studioFall(g){if(g.room!==ROOM)return false;return pitFall(g,ROOM,s=>STUDIO_PIECES[s.index]?.type==='fixed');}
export function placeAtStudioCheckpoint(g){if(g.room!==ROOM||!g.studio)return;placeAtCheckpoint(g,ROOM,STUDIO_CHECKPOINTS,g.studio.checkpoint);}

// Дипфейк: hovers over its fakes, drifts towards a noticed Uma, focuses and projects; contact hurts.
export function stepDeepfake(g,e,dt){
 const p=g.player;e.homeX??=e.x;e.homeY??=e.y;e.timer-=dt;e.bob=(e.bob||0)+dt;
 const dx=p.x+p.w/2-e.x-e.w/2;
 if(e.state==='patrol'){if(e.noticed&&Math.abs(dx)<300)e.x+=Math.sign(dx)*Math.min(Math.abs(dx),e.speed*dt);if(e.noticed&&e.timer<=0&&Math.abs(dx)<300){e.state='windup';e.timer=.5;g.emit('deepfakeFocus',{x:e.x,y:e.y,enemyType:'deepfake'});}}
 else if(e.state==='windup'&&e.timer<=0){e.state='casting';e.timer=1;g.emit('deepfakeProject',{x:e.x,y:e.y,enemyType:'deepfake'});}
 else if(e.state==='casting'&&e.timer<=0){e.state='patrol';e.timer=2.4;}
 e.x=Math.max(e.homeX-130,Math.min(e.homeX+130,e.x));e.y=e.homeY+Math.sin(e.bob*2.2)*7;e.dir=dx<0?-1:1;
}
export function deepfakeContact(g,e){
 const p=g.player;if(p.dash>0||p.inv>0)return;const before=g.health;g.hurt(false,e.x);
 if(g.mode==='playing'&&g.health<before){p.vx=(p.x>e.x?1:-1)*220;p.vy=-120;p.knock=.2;p.grounded=false;}
}
