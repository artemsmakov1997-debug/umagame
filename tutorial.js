import {rooms} from './level.js?v=0.21.5';
// Quiet room: a two-screen controls course curated by Yuri from the old monitor.
// Stations left to right: run → crouch under the bench → dash through the «помехи» barrier →
// jump the broken floor → paw the infected monitor → the door opens to the newsroom.
// All x values are local to room 0; the floor is at y 445.
export const TUTORIAL_FLOOR=445;
export const BENCH={x:440,w:188,seat:{dx:34,w:128},top:410,underside:421};
export const BARRIER={x:690,w:184,field:{dx:45,w:95},top:320};
export const GAP={x:930,w:100,bottom:474};
export const MONITOR={x:1180,w:68,h:70};
export const DOOR={x:1408,w:120,h:140};
export const STATIONS=['run','crouch','dash','jump','attack','exit'];
export const tutorialLines={
 run:{keys:'Ума, я на связи! Беги вправо: ← → или A D.',touch:'Ума, я на связи! Беги вправо джойстиком.'},
 crouch:{keys:'Низкая скамья. Зажми ↓ или S и проползи под ней.',touch:'Низкая скамья. Потяни джойстик вниз и проползи под ней.'},
 dash:{keys:'Барьер помех! Пробей его рывком — Shift.',touch:'Барьер помех! Пробей его кнопкой «Рывок».'},
 jump:{keys:'Пол проломлен. Перепрыгни: ↑ или W.',touch:'Пол проломлен. Перепрыгни кнопкой ↑.'},
 attack:{keys:'Монитор заражён шумом. Ударь лапой — X или Пробел.',touch:'Монитор заражён шумом. Ударь его кнопкой «Лапа».'},
 exit:{keys:'Отлично! Дверь открыта — в редакцию.',touch:'Отлично! Дверь открыта — в редакцию.'}
};
export function createTutorial(){return {step:0,announced:-1,complete:false,barrierBroken:false,barrierTime:0,bumped:false,monitorBroken:false,monitorTime:0,doorOpen:false,doorTime:0,lastSwing:-1};}
const local=g=>rooms[0].x;
export function barrierBox(g){const x=local(g)+BARRIER.x+BARRIER.field.dx;return{x,y:BARRIER.top,w:BARRIER.field.w,h:TUTORIAL_FLOOR-BARRIER.top};}
export function monitorBox(g){const x=local(g)+MONITOR.x;return{x:x+8,y:TUTORIAL_FLOOR-MONITOR.h+6,w:MONITOR.w-16,h:MONITOR.h-12};}
export function doorLimit(g){return local(g)+DOOR.x+24;}
export function tutorialLine(g,step=g.tutorial.step){const line=tutorialLines[STATIONS[step]];return g.touchEnabled?line.touch:line.keys;}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

function advance(g,step){const q=g.tutorial;if(step<=q.step)return;q.step=step;if(step===STATIONS.length-1)q.complete=true;}

// Called every playing frame in room 0 after collisions; `paw` is the swing box, `oldX` the previous x.
export function stepTutorial(g,dt,paw,oldX){
 const q=g.tutorial,p=g.player;if(g.room!==0)return;
 q.barrierTime=q.barrierBroken?q.barrierTime+dt:0;q.monitorTime=q.monitorBroken?q.monitorTime+dt:0;q.doorTime=q.doorOpen?Math.min(1,q.doorTime+dt*2.5):0;
 // The barrier stops a walking Uma; a dash shatters it for good.
 if(!q.barrierBroken){const box=barrierBox(g);if(overlap(p,box)){
  if(p.dash>0){q.barrierBroken=true;g.emit('tutorialBarrier',{x:box.x+box.w/2,y:box.y+box.h/2});}
  else{p.x=oldX+p.w/2<box.x+box.w/2?box.x-p.w:box.x+box.w;p.vx=0;if(!q.bumped){q.bumped=true;g.emit('tutorialBump',{x:box.x,y:box.y});}}
 }}
 // The infected monitor breaks to one paw swing and opens the door.
 if(!q.monitorBroken&&p.attack>0&&q.lastSwing!==p.swing&&overlap(paw,monitorBox(g))){q.lastSwing=p.swing;q.monitorBroken=true;q.doorOpen=true;g.emit('tutorialMonitor',{x:monitorBox(g).x+26,y:monitorBox(g).y+20});}
 if(!q.doorOpen&&p.x+p.w>doorLimit(g)){p.x=doorLimit(g)-p.w;p.vx=0;}
 const x=p.x-local(g);
 if(x>=300&&p.y+p.h>=TUTORIAL_FLOOR-1)advance(g,1);
 if(x>=BENCH.x+BENCH.seat.dx+BENCH.seat.w-10)advance(g,2);
 if(q.barrierBroken)advance(g,3);
 if(q.step>=3&&x>=GAP.x+GAP.w&&p.grounded&&p.y+p.h<=TUTORIAL_FLOOR+1)advance(g,4);
 if(q.monitorBroken)advance(g,5);
 if(q.announced<q.step&&g.mode==='playing'){q.announced=q.step;g.emit('lesson',{step:q.step,station:STATIONS[q.step],text:tutorialLine(g)});}
}
