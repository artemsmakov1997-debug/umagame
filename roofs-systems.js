import {rooms} from './level.js?v=0.21.5';
import {ROOF_BUILDINGS,FLOCK,WIND,ROOF_CHECKPOINTS} from './roofs-map.js?v=0.21.5';
import * as roofMap from './roofs-map.js?v=0.21.5';
export const lanes=roofMap;
// «Крыши» mechanics: solid building walls, a fall costs one heart and returns Uma to the last safe roof,
// the awning is a trampoline, wind gusts in the antenna forest and flocks of Сенсации.
import {pitFall,placeAtCheckpoint} from './pit-falls.js?v=0.21.5';
export const ROOM=3,AWNING_BOUNCE=-700,BIRD={w:34,h:18};
const x0=()=>rooms[ROOM].x;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function createRoofs(){return {flock:{phase:'wait',timer:FLOCK.first,lane:0,birds:[],serial:0},checkpoint:0,lastSupport:null,bounceTime:0,introduced:false,gust:false,gustWarned:false,wind:{phase:'calm',timer:2,source:null,dir:-1}};}

// The roofs' wind comes from the Нагнетатели: the one nearest to Uma runs its cycle calm → warn → gust,
// and its gust sweeps the whole map in the direction it faces.
export function windPhase(g){return g.roofs?.wind?.phase||'calm';}
export function inWind(g){return true;}
export function roofInflators(g){return g.enemies.filter(e=>e.room===ROOM&&e.type==='inflator'&&!e.dead);}
function stepWind(g,dt){
 const q=g.roofs,w=q.wind,p=g.player,blowers=roofInflators(g);
 const near=blowers.slice().sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
 if(!near||Math.abs(near.x-p.x)>1100){w.phase='calm';w.source=null;for(const e of blowers)e.state='patrol';return;}
 if(w.source!==near.id&&w.phase==='calm'){w.source=near.id;}
 w.timer-=dt;const calm=WIND.period-WIND.warn-WIND.gust;
 if(w.timer<=0){if(w.phase==='calm'){w.phase='warn';w.timer=WIND.warn;w.source=near.id;w.dir=near.dir;}else if(w.phase==='warn'){w.phase='gust';w.timer=WIND.gust;g.emit('blast',{x:near.x,y:near.y});}else{w.phase='calm';w.timer=calm;}}
 for(const e of blowers){const mine=e.id===w.source;e.state=mine&&w.phase==='warn'?'windup':mine&&w.phase==='gust'?'blast':mine&&w.phase==='calm'&&w.timer>calm-.8?'recover':'patrol';if(e.state==='blast')e.walkTime+=dt*6;}
}

// The flock: wait → warn (a cry from the left edge of the view; the lane is fixed at Uma's head height) → fly.
// Birds keep a V (the leader lowest, at Uma's head; the wings above) and bob; they fly on to the right edge of the map and only then the next wait starts.
function startFlock(q,g){
 const f=q.flock,p=g.player,view=g.viewWidth||768;f.serial++;
 f.birds=Array.from({length:FLOCK.count},(_,i)=>({i,x:g.camera+view+60+i*FLOCK.spacing,dy:[0,-12,-12,-24,-24][i]||0,phase:i*1.7,dead:false,hit:false,deathTime:0}));
}
export function birdBox(f,bird,t){return {x:bird.x-BIRD.w/2,y:f.lane+bird.dy+Math.sin(t*6+bird.phase)*FLOCK.wave-BIRD.h/2,w:BIRD.w,h:BIRD.h};}
function stepFlock(g,dt,paw){
 const q=g.roofs,f=q.flock,p=g.player,r=rooms[ROOM];f.timer-=dt;
 if(f.phase==='wait'&&f.timer<=0){f.phase='warn';f.timer=FLOCK.warn;f.lane=Math.max(FLOCK.minY,Math.min(FLOCK.maxY,p.y+2));g.emit('sensationWarning',{x:g.camera+(g.viewWidth||768)-20,y:f.lane});if(!q.introduced){q.introduced=true;g.emit('enemyIntroduction',{enemyType:'sensation',x:g.camera+(g.viewWidth||768)-20,y:f.lane});}}
 else if(f.phase==='warn'&&f.timer<=0){f.phase='fly';startFlock(q,g);}
 if(f.phase!=='fly')return;
 for(const bird of f.birds){bird.x-=FLOCK.speed*dt;bird.deathTime=Math.max(0,bird.deathTime-dt);if(bird.dead)continue;const box=birdBox(f,bird,g.time);
  if(p.attack>0&&overlap(paw,box)){bird.dead=true;bird.deathTime=.35;g.kills++;g.emit('enemyHit',{x:box.x+17,y:box.y,enemyType:'sensation'});continue;}
  if(!bird.hit&&p.dash===0&&p.inv===0&&overlap(p,box)){bird.hit=true;g.hurt(false,box.x+17);if(g.mode==='playing')g.push(-1,box.x+17);g.emit('sensationHit',{x:box.x+17,y:box.y});}
 }
 if(f.birds.every(b=>b.x+FLOCK.count*FLOCK.spacing<r.x||b.dead&&b.deathTime<=0)){f.phase='wait';f.timer=FLOCK.period;f.birds=[];}
}

// Buildings are solid below their roof line: walking or being blown into a taller wall stops Uma.
export function applyRoofWalls(g,oldX){
 if(g.room!==ROOM)return;const p=g.player;if(p.climbing)return;
 for(const b of ROOF_BUILDINGS){
  const left=x0()+(b.wall??b.x),right=x0()+b.x+b.w;
  if(p.y+p.h<=b.y+6||p.x+p.w<=left||p.x>=right)continue;
  if(oldX+p.w<=left+2){p.x=left-p.w;if(p.vx>0)p.vx=0;}
  else if(oldX>=right-2){p.x=right;if(p.vx<0)p.vx=0;}
 }
}

// A fall into the street: one heart, back to the last safe roof (never a rope or the awning).
export function roofFall(g){if(g.room!==ROOM)return false;return pitFall(g,ROOM,s=>!!s.roof&&['building','prop'].includes(s.roof.type));}
// After losing a life on the roofs, Uma restarts at the last checkpoint she reached.
export function placeAtRoofCheckpoint(g){if(g.room!==ROOM||!g.roofs)return;placeAtCheckpoint(g,ROOM,ROOF_CHECKPOINTS,g.roofs.checkpoint);}

export function stepRoofs(g,dt,paw,input={}){
 if(g.room!==ROOM||g.mode!=='playing')return;const q=g.roofs??=createRoofs(),p=g.player;
 q.bounceTime=Math.max(0,q.bounceTime-dt);
 // Checkpoints: the furthest one reached on its own roof.
 for(const [i,c]of ROOF_CHECKPOINTS.entries())if(i>q.checkpoint&&p.grounded&&p.supportId===ROOM+':'+c.index&&p.x>=x0()+c.x-40)q.checkpoint=i;
 // Awning trampoline: landing from the air throws Uma high; holding ↓ lets her stand on it.
 const support=p.grounded?g.platforms.find(s=>s.id===p.supportId):null;
 if(support?.roof?.type==='awning'&&q.lastSupport!==support.id&&!p.sneaking&&!input.down){p.vy=AWNING_BOUNCE;p.grounded=false;p.supportId=null;q.bounceTime=.35;g.emit('roofBounce',{x:p.x+p.w/2,y:support.y});}
 q.lastSupport=p.grounded?p.supportId:null;
 // Wind from the Нагнетатели: in the air Uma is carried along, on a roof she is pushed unless she crouches.
 stepWind(g,dt);const w=q.wind,phase=w.phase;q.gust=phase==='gust';
 if(phase==='warn'&&!q.gustWarned){q.gustWarned=true;g.emit('gustWarning',{x:p.x,y:p.y});if(!q.windIntroduced){q.windIntroduced=true;g.emit('windIntroduction',{x:p.x,y:p.y});}}
 if(phase==='calm')q.gustWarned=false;
 if(q.gust&&!p.climbing&&p.dash===0){const speed=p.grounded?(p.sneaking?0:Math.abs(WIND.ground)):Math.abs(WIND.speed);p.x+=w.dir*speed*dt;const r=rooms[ROOM];p.x=Math.max(r.x,Math.min(r.end-p.w,p.x));}
 // Сенсации: a flock sweeps the map from right to left and knocks Uma along its flight, to the left.
 stepFlock(g,dt,paw);
}
