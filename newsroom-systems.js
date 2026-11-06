import {rooms,createEnemies} from './level.js?v=0.21.5';
import {PRESS,hazardZone,blockCalm,machineActive,newsroomNodes} from './chapter-routes.js?v=0.21.5';
import {cleanCopies} from './tactical-enemies.js?v=0.21.5';
// «Тираж»: the newsroom's location rules.
// 1. While a block's printing node works, its fallen monsters return from their sources.
//    A broken node calms the block: no returns, its machine stops, and it becomes the checkpoint.
// 2. The machines run on one rhythm and hit everyone: the press crushes monsters under it,
//    floor discharges stun them, the belt carries them.
export const RESPAWN_DELAY=6,RESPAWN_CLEARANCE=220,NODE_DECKS=[6,12,18];
const BELT=13,ROOM=1;
export function blockOf(x){return Math.max(0,Math.min(2,Math.floor((x-rooms[ROOM].x)/768)));}
export function machinePhase(t,section){return(t+section*.8)%5;}
let templates=null;
function template(id){templates??=new Map(createEnemies().filter(e=>e.room===ROOM).map(e=>[e.id,e]));const e=templates.get(id);return e?structuredClone(e):null;}
const grounded=e=>!e.dead&&!e.flying&&!e.phased&&e.jumpPhase!=='air'&&!e.terrainFall;

function crush(g,e,kind){
 e.hp=0;e.dead=true;e.deathTime=.28;e.respawnWait=0;g.kills++;
 g.emit('pop',{x:e.x+24,y:e.y,enemyType:e.type});g.emit(kind,{x:e.x+e.w/2,y:e.y+e.h,enemyType:e.type});
}

export function stepNewsroom(g,dt){
 if(!g.cinematic||g.room!==ROOM||g.mode!=='playing')return;
 const r=rooms[ROOM],t=g.time,local=g.enemies.filter(e=>e.room===ROOM);
 // Belt: carries monsters standing on it, like Uma.
 const belt=g.platforms.find(s=>s.id===ROOM+':'+BELT);
 if(belt)for(const e of local)if(grounded(e)&&e.active&&e.platformIndex===BELT&&Math.abs(e.y+e.h-belt.y)<3)e.x=Math.max(e.origin,Math.min(e.end,e.x+belt.belt*dt));
 // Press: a landed head crushes every grounded monster under it on the lower path.
 if(machineActive(g,ROOM,PRESS.section)){
  const phase=machinePhase(t,PRESS.section);
  if(phase>=1.32&&phase<=2.2){const x0=r.x+PRESS.x,x1=x0+PRESS.w;let crushed=false;
   for(const e of local)if(e.active&&grounded(e)&&e.y+e.h>360&&e.x+e.w>x0+6&&e.x<x1-6){crush(g,e,'pressCrush');crushed=true;}
   if(crushed)cleanCopies(g);}
 }
 // Server floor: a discharge stuns grounded monsters once per strike.
 if(machineActive(g,ROOM,2)){
  const phase=machinePhase(t,2),[from,to]=hazardZone(ROOM,2),pulse=Math.floor((t+2*.8)/5);
  if(phase>=1.2&&phase<=2.2)for(const e of local){
   if(!e.active||!grounded(e)||e.y+e.h<=360||e.shockPulse===pulse)continue;
   const x=e.x+e.w/2-r.x-1536;if(x<from||x>to)continue;
   e.shockPulse=pulse;e.state='recover';e.timer=Math.max(e.timer||0,1.6);e.attackFlash=0;g.emit('enemyShock',{x:e.x+e.w/2,y:e.y,enemyType:e.type});
  }
 }
 // Node rule: fallen monsters of a working block return from their sources.
 const p=g.player,near=g.enemies.filter(e=>e.room===ROOM&&e.active&&!e.dead&&Math.abs(e.x-p.x)<620).length;
 for(const [i,e] of g.enemies.entries()){
  if(e.room!==ROOM||!e.dead||e.deathTime>0||e.copyOwnerId||e.bossOwnerId||e.portalMinion||e.source?.transient)continue;
  const fresh=template(e.id);if(!fresh||blockCalm(g,ROOM,blockOf(fresh.x)))continue;
  e.respawnWait=(e.respawnWait||0)+dt;
  if(e.respawnWait<RESPAWN_DELAY||Math.abs(fresh.x-p.x)<RESPAWN_CLEARANCE||near>=3)continue;
  // Back to its source, inactive: the ordinary arrival (source animation, local caps) brings it in.
  g.enemies[i]=fresh;g.emit('enemyReturn',{x:fresh.x,y:fresh.y,enemyType:fresh.type});
 }
}

// Checkpoint: after losing a life Uma returns to the deck of the furthest calmed node.
export function newsroomCheckpoint(g){
 if(g.room!==ROOM)return null;const nodes=newsroomNodes(g);let block=-1;
 for(let i=0;i<nodes.length;i++)if(nodes[i].hp===0)block=i;if(block<0)return null;
 const deck=g.platforms.find(s=>s.room===ROOM&&s.index===NODE_DECKS[block]);return{deck,x:deck.x+12};
}
export function placeAtNewsroomCheckpoint(g){
 const point=newsroomCheckpoint(g);if(!point)return false;const p=g.player;
 Object.assign(p,{x:point.x,y:point.deck.y-p.h,vx:0,vy:0,grounded:true,supportId:point.deck.id});
 g.visitedPlatforms?.add(point.deck.id);g.safeTrail=[{platformId:point.deck.id,x:p.x,y:p.y}];g.updateCamera();return true;
}
// A restored checkpoint keeps calmed blocks calm: monsters that fell there stay gone.
export function keepCalmBlocks(g,before){
 if(g.room!==ROOM)return;
 for(const e of g.enemies){if(e.room!==ROOM||!blockCalm(g,ROOM,blockOf(e.x)))continue;
  const old=before.find(o=>o.id===e.id);if(old?.dead)Object.assign(e,{dead:true,hp:0,deathTime:0,active:true});
 }
 placeAtNewsroomCheckpoint(g);
}
