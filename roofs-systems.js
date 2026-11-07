import {rooms} from './level.js?v=0.21.5';
import {ROOF_BUILDINGS,SENSATION_LANES,WIND,ROOF_CHECKPOINTS} from './roofs-map.js?v=0.21.5';
import * as roofMap from './roofs-map.js?v=0.21.5';
export const lanes=roofMap;
// «Крыши» mechanics: solid building walls, a fall costs one heart and returns Uma to the last safe roof,
// the awning is a trampoline, wind gusts in the antenna forest and flocks of Сенсации.
export const ROOM=3,AWNING_BOUNCE=-700,FALL_RETURN_INV=1.6,BIRD={w:34,h:18,gap:44,count:3,speed:270,warn:.9};
const x0=()=>rooms[ROOM].x;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function createRoofs(){return {flocks:SENSATION_LANES.map(l=>({id:l.id,cycle:-1,birds:[],warned:false})),checkpoint:0,lastSupport:null,bounceTime:0,introduced:false,gust:false,gustWarned:false};}

// Wind phase at time t: 'calm' | 'warn' | 'gust'.
export function windPhase(t){const k=((t%WIND.period)+WIND.period)%WIND.period,calm=WIND.period-WIND.warn-WIND.gust;return k<calm?'calm':k<calm+WIND.warn?'warn':'gust';}
export function inWind(g,x=g.player.x){const local=x-x0();return local>=WIND.x1&&local<WIND.x2;}

// Bird i of a lane at time t: position and whether the flock is crossing.
export function flockState(lane,t){
 const total=lane.period,k=(((t+lane.phase)%total)+total)%total,cycle=Math.floor((t+lane.phase)/total);
 const fly=k-BIRD.warn,span=lane.x2-lane.x1,entry=lane.from>0?lane.x2:lane.x1,dir=-lane.from;
 const birds=[];for(let i=0;i<BIRD.count;i++){const d=fly*BIRD.speed-i*BIRD.gap,x=entry+dir*d;birds.push({i,x,visible:fly>0&&d>=0&&d<=span});}
 return {warn:k<BIRD.warn,cycle,dir,birds,entry};
}
export function birdBox(lane,bird){return {x:x0()+bird.x-BIRD.w/2,y:lane.y-BIRD.h/2,w:BIRD.w,h:BIRD.h};}

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
export function roofFall(g){
 if(g.room!==ROOM)return false;const p=g.player;
 const safe=[...g.safeTrail].reverse().find(m=>{const s=g.platforms.find(s=>s.id===m.platformId);return s&&s.room===ROOM&&s.roof&&['building','prop'].includes(s.roof.type);});
 const s=safe?g.platforms.find(s=>s.id===safe.platformId):g.platforms.find(s=>s.id===ROOM+':0');
 if(!g.testingInvulnerable){g.health--;if(g.health<=0){g.health=0;g.loseLife('fall');return true;}}
 const x=safe?Math.max(s.x+2,Math.min(s.x+s.w-p.w-2,safe.x)):s.x+20;
 Object.assign(p,{x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,climbing:false,knock:0,dash:0,attack:0,sneaking:false,inv:FALL_RETURN_INV,hurtTime:.5});
 g.emit('roofFall',{x:p.x,y:p.y});g.updateCamera();return true;
}
// After losing a life on the roofs, Uma restarts at the last checkpoint she reached.
export function placeAtRoofCheckpoint(g){
 if(g.room!==ROOM||!g.roofs)return;const c=ROOF_CHECKPOINTS[g.roofs.checkpoint]||ROOF_CHECKPOINTS[0],s=g.platforms.find(s=>s.id===ROOM+':'+c.index);
 Object.assign(g.player,{x:x0()+c.x,y:s.y-48,supportId:s.id,grounded:true});g.safeTrail=[{platformId:s.id,x:g.player.x,y:g.player.y}];
}

export function stepRoofs(g,dt,paw,input={}){
 if(g.room!==ROOM||g.mode!=='playing')return;const q=g.roofs??=createRoofs(),p=g.player;
 q.bounceTime=Math.max(0,q.bounceTime-dt);
 // Checkpoints: the furthest one reached on its own roof.
 for(const [i,c]of ROOF_CHECKPOINTS.entries())if(i>q.checkpoint&&p.grounded&&p.supportId===ROOM+':'+c.index&&p.x>=x0()+c.x-40)q.checkpoint=i;
 // Awning trampoline: landing from the air throws Uma high; holding ↓ lets her stand on it.
 const support=p.grounded?g.platforms.find(s=>s.id===p.supportId):null;
 if(support?.roof?.type==='awning'&&q.lastSupport!==support.id&&!p.sneaking&&!input.down){p.vy=AWNING_BOUNCE;p.grounded=false;p.supportId=null;q.bounceTime=.35;g.emit('roofBounce',{x:p.x+p.w/2,y:support.y});}
 q.lastSupport=p.grounded?p.supportId:null;
 // Wind: airborne Uma drifts left during a gust in the antenna forest.
 const phase=windPhase(g.time);q.gust=phase==='gust';
 if(phase==='warn'&&!q.gustWarned&&inWind(g)){q.gustWarned=true;g.emit('gustWarning',{x:p.x,y:p.y});if(!q.windIntroduced){q.windIntroduced=true;g.emit('windIntroduction',{x:p.x,y:p.y});}}
 if(phase==='calm')q.gustWarned=false;
 if(q.gust&&inWind(g)&&!p.grounded&&!p.climbing&&p.dash===0)p.x+=WIND.speed*dt;
 // Сенсации: each flock crosses its lane; contact knocks Uma along their flight, a paw pops one bird.
 for(const [li,lane] of SENSATION_LANES.entries()){
  const f=q.flocks[li],s=flockState(lane,g.time);
  if(s.cycle!==f.cycle){f.cycle=s.cycle;f.birds=s.birds.map(()=>({dead:false,hit:false,deathTime:0}));f.warned=false;}
  const onScreen=Math.abs(x0()+s.entry-(g.camera+(g.viewWidth||768)/2))<(g.viewWidth||768)/2+160;
  if(s.warn&&!f.warned&&onScreen){f.warned=true;g.emit('sensationWarning',{x:x0()+s.entry,y:lane.y});if(!q.introduced){q.introduced=true;g.emit('enemyIntroduction',{enemyType:'sensation',x:x0()+s.entry,y:lane.y});}}
  for(const bird of s.birds){const state=f.birds[bird.i];state.deathTime=Math.max(0,state.deathTime-dt);if(!bird.visible||state.dead)continue;const box=birdBox(lane,bird);
   if(p.attack>0&&overlap(paw,box)){state.dead=true;state.deathTime=.35;g.kills++;g.emit('enemyHit',{x:box.x+17,y:box.y,enemyType:'sensation'});continue;}
   if(!state.hit&&p.dash===0&&p.inv===0&&overlap(p,box)){state.hit=true;g.hurt(false,box.x+17);if(g.mode==='playing'){g.push(s.dir,box.x+17);}g.emit('sensationHit',{x:box.x+17,y:box.y});}
  }
 }
}
