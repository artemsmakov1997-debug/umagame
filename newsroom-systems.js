import {rooms} from './level.js?v=0.21.5';
import {cleanCopies} from './tactical-enemies.js?v=0.21.5';
// «Конвейер»: the newsroom is one newspaper conveyor running towards Uma (right to left).
// - The belt carries Uma, monsters and Stamp ink to the left.
// - Presses over the belt take a whole life; they crush monsters too.
// - Censors grow out of the belt ahead of Uma, ride it towards her and hurt on touch: jump over them.
// - Catwalks are checkpoints: after a lost life Uma returns to the furthest one she reached.
const ROOM=1;
export const BELT_ID='1:0',BELT_TOP=430,BELT_SPEED=-45;
// Press heads (local x of the head's left edge) and their phase offsets in the shared cycle.
export const PRESSES=[{x:560,offset:0},{x:1240,offset:1.5},{x:1700,offset:3},{x:2010,offset:.75}];
export const PRESS_W=153,PRESS_H=65,PRESS_REST=300,PRESS_STRIKE=371;
// Cycle: head up (safe) → warning (lamp blinks, head shakes) → slam → hold → rise.
export const PRESS_CYCLE=4.5,PRESS_WARN=2.4,PRESS_SLAM=3.4,PRESS_LANDED=3.52,PRESS_HOLD=3.95;
export const CENSOR_SOURCES=[1050,1480,1600,2230];
export const CENSOR={warn:.6,grow:.3,stand:2.6,retract:.35,height:62,width:24,cooldown:4.5,near:200,far:460,max:2};
export const CHECKPOINTS=[2,4,5];

export function pressState(press,t){
 const phase=((t+press.offset)%PRESS_CYCLE+PRESS_CYCLE)%PRESS_CYCLE;
 const drop=phase<PRESS_SLAM?0:phase<PRESS_LANDED?(phase-PRESS_SLAM)/(PRESS_LANDED-PRESS_SLAM):phase<PRESS_HOLD?1:1-(phase-PRESS_HOLD)/(PRESS_CYCLE-PRESS_HOLD);
 return{phase,drop,warn:phase>=PRESS_WARN&&phase<PRESS_SLAM,top:PRESS_REST+(PRESS_STRIKE-PRESS_REST)*drop};
}
const grounded=e=>!e.dead&&!e.flying&&!e.phased&&e.jumpPhase!=='air'&&!e.terrainFall;
const onBelt=e=>e.platformIndex===0&&Math.abs(e.y+e.h-BELT_TOP)<3;

export function censorHeight(c){
 if(c.phase==='warn')return 0;
 if(c.phase==='grow')return CENSOR.height*Math.min(1,c.time/CENSOR.grow);
 if(c.phase==='retract')return CENSOR.height*Math.max(0,1-c.time/CENSOR.retract);
 return CENSOR.height;
}
export function censorBox(c){const h=censorHeight(c);return{x:c.x-CENSOR.width/2,y:BELT_TOP-h,w:CENSOR.width,h};}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

export function stepNewsroom(g,dt){
 if(!g.cinematic||g.room!==ROOM||g.mode!=='playing')return;
 const r=rooms[ROOM],t=g.time,p=g.player;g.censors??=[];g.censorCooldowns??={};
 // Belt: monsters and ink ride it like Uma does.
 for(const e of g.enemies)if(e.room===ROOM&&e.active&&grounded(e)&&onBelt(e))e.x=Math.max(e.origin,Math.min(e.end,e.x+BELT_SPEED*dt));
 for(const ink of g.inks)if(ink.platformId===BELT_ID)ink.localX+=BELT_SPEED*dt;
 g.inks=g.inks.filter(ink=>ink.platformId!==BELT_ID||ink.localX+ink.w>0);
 // Presses.
 let crushed=false;
 for(const press of PRESSES){
  const s=pressState(press,t),x0=r.x+press.x,x1=x0+PRESS_W,bottom=s.top+PRESS_H;
  if(p.x+p.w>x0+8&&p.x<x1-8&&bottom>p.y+6&&s.drop>0){g.emit('pressHit',{x:p.x+p.w/2,y:p.y});g.loseLife('press');return;}
  if(s.drop<1)continue;
  for(const e of g.enemies)if(e.room===ROOM&&e.active&&grounded(e)&&e.y+e.h>BELT_TOP-4&&e.x+e.w>x0+6&&e.x<x1-6){
   e.hp=0;e.dead=true;e.deathTime=.28;g.kills++;crushed=true;g.emit('pop',{x:e.x+24,y:e.y,enemyType:e.type});g.emit('pressCrush',{x:e.x+e.w/2,y:BELT_TOP,enemyType:e.type});
  }
  for(const c of g.censors)if(c.phase!=='retract'&&c.x>x0&&c.x<x1){c.phase='retract';c.time=0;g.emit('pressCrush',{x:c.x,y:BELT_TOP,enemyType:'censor'});}
 }
 if(crushed)cleanCopies(g);
 // Censors.
 for(const [i,local] of CENSOR_SOURCES.entries()){
  g.censorCooldowns[i]=Math.max(0,(g.censorCooldowns[i]||0)-dt);
  const x=r.x+local,dx=x-(p.x+p.w/2);
  if(g.censorCooldowns[i]>0||dx<CENSOR.near||dx>CENSOR.far||g.censors.length>=CENSOR.max||g.censors.some(c=>c.source===i))continue;
  g.censors.push({id:'censor-'+(++g.tacticalSerial),source:i,x,phase:'warn',time:0,flash:0});g.censorCooldowns[i]=CENSOR.cooldown;
  g.emit('censorWarn',{x,y:BELT_TOP});
  if(!g.seenScenes.has('sighting:censor')){g.seenScenes.add('sighting:censor');g.emit('enemyIntroduction',{enemyType:'censor',room:ROOM});}
 }
 const box={x:p.x+4,y:p.y+4,w:p.w-8,h:p.h-6};
 for(const c of g.censors){
  c.time+=dt;c.flash=Math.max(0,c.flash-dt);c.x+=BELT_SPEED*dt;
  if(c.phase==='warn'&&c.time>=CENSOR.warn){c.phase='grow';c.time=0;g.emit('censorRise',{x:c.x,y:BELT_TOP});}
  else if(c.phase==='grow'&&c.time>=CENSOR.grow){c.phase='stand';c.time=0;}
  else if(c.phase==='stand'&&c.time>=CENSOR.stand){c.phase='retract';c.time=0;}
  else if(c.phase==='retract'&&c.time>=CENSOR.retract)c.done=true;
  const hit=censorBox(c);
  if(hit.h>18&&overlaps(box,hit)&&p.inv<=0&&g.mode==='playing'){c.flash=.3;g.hurt(false,c.x);if(g.mode!=='playing')break;}
 }
 g.censors=g.censors.filter(c=>!c.done&&c.x>r.x-40);
 // Checkpoints: standing on a catwalk marks it.
 if(p.grounded&&p.supportId){const index=Number(p.supportId.split(':')[1]);const rank=CHECKPOINTS.indexOf(index);
  if(p.supportId.startsWith('1:')&&rank>=0&&rank>(g.newsroomCheckpoint??-1)){g.newsroomCheckpoint=rank;g.emit('checkpoint',{x:p.x,y:p.y});}}
}

export function placeAtNewsroomCheckpoint(g){
 if(g.room!==ROOM)return false;g.censors=[];g.censorCooldowns={};
 const rank=g.newsroomCheckpoint??-1;if(rank<0)return false;
 const deck=g.platforms.find(s=>s.id==='1:'+CHECKPOINTS[rank]),p=g.player;
 Object.assign(p,{x:deck.x+deck.w/2-p.w/2,y:deck.y-p.h,vx:0,vy:0,grounded:true,supportId:deck.id});
 g.visitedPlatforms?.add(deck.id);g.safeTrail=[{platformId:deck.id,x:p.x,y:p.y}];g.updateCamera();return true;
}
export function newsroomRestore(g){placeAtNewsroomCheckpoint(g);}
export function resetNewsroom(g){g.newsroomCheckpoint=null;g.censors=[];g.censorCooldowns={};}
