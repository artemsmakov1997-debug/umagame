import {rooms} from './level.js?v=0.21.6';
import {solidSurfaces} from './terrain.js?v=0.21.6';
// Studio monsters of the second redesign.
// Прожектор follows Uma along the ceiling, fixes its red beam and slows movement inside it.
// The beam stops at the first platform/flat and never removes collision surfaces.
export const SPOTLIGHTER={track:95,aim:1.35,burn:.9,cool:1.2,rest:.8,half:26,reach:560,lens:60,ride:70,lead:120,apart:420,slow:.45};
// Where the red beam lands: the first solid surface (or the flat) under its x, else the bottom of the screen.
export function beamSurface(g,e,x=e.beamX){
 const top=SPOTLIGHTER.lens+8;return solidSurfaces(g).filter(s=>s.room===e.room&&x>=s.x&&x<=s.x+s.w&&s.y>top).sort((a,b)=>a.y-b.y)[0]||null;
}
export function beamFloor(g,e,x=e.beamX){const hit=beamSurface(g,e,x);return hit?hit.y:480;}
export const lensPoint=e=>({x:e.x+e.w/2,y:SPOTLIGHTER.lens});
export function beamBox(g,e){const floor=beamFloor(g,e);return {x:e.beamX-SPOTLIGHTER.half,y:floor-150,w:SPOTLIGHTER.half*2,h:150};}
// Sample Uma's body across the painted cone, narrowing towards the lens.
export function spotlightSlow(g){
 const p=g.player;if(g.room!==5||p.dash>0)return 1;
 for(const e of g.enemies||[]){if(e.type!=='spotlight'||e.room!==g.room||!e.active||e.dead||e.spawnTime>0||e.state!=='burn')continue;
  const floor=beamFloor(g,e),side=e.beamX<e.x+e.w/2-4?-1:1,lens={x:e.x+e.w/2+side*24*.63,y:SPOTLIGHTER.lens};
  for(const y of[p.y+5,p.y+p.h/2,p.y+p.h-2]){if(y<lens.y||y>=floor)continue;const t=(y-lens.y)/(floor-lens.y),x=lens.x+(e.beamX-lens.x)*t,half=32*t;
   if(p.x+p.w>x-half&&p.x<x+half)return 1-SPOTLIGHTER.slow;
  }
 }return 1;
}
// The rail: the body drifts after a point a little ahead of Uma, never closer than `apart` to another Прожектор.
function ride(g,e,dt){
 const r=rooms[e.room],p=g.player,lo=r.x+40,hi=r.end-40-e.w;let goal=Math.max(lo,Math.min(hi,p.x+p.w/2+SPOTLIGHTER.lead-e.w/2));
 for(const o of g.enemies)if(o!==e&&o.type==='spotlight'&&o.room===e.room&&o.active&&!o.dead&&Math.abs(o.x-goal)<SPOTLIGHTER.apart)goal=o.x<e.x?Math.max(goal,o.x+SPOTLIGHTER.apart):Math.min(goal,o.x-SPOTLIGHTER.apart);
 goal=Math.max(lo,Math.min(hi,goal));const d=goal-e.x,step=SPOTLIGHTER.ride*dt;
 if(Math.abs(d)>1){e.x+=Math.sign(d)*Math.min(Math.abs(d),step);e.moving=true;e.walkTime=(e.walkTime||0)+dt;}
}
export function stepSpotlighter(g,e,dt,dx){
 const p=g.player,target=p.x+p.w/2,near=Math.abs(target-(e.x+e.w/2))<SPOTLIGHTER.reach;
 e.beamX??=e.x+e.w/2;
 if(e.state!=='burn')ride(g,e,dt);
 if(e.state==='patrol'){e.beamX+=(e.x+e.w/2-e.beamX)*Math.min(1,dt*2);if(near&&e.timer<=0){e.state='aim';e.timer=SPOTLIGHTER.aim;g.emit('spotAim',{x:e.beamX,y:e.y,enemyType:e.type});}}
 else if(e.state==='aim'){const d=target-e.beamX;e.beamX+=Math.sign(d)*Math.min(Math.abs(d),SPOTLIGHTER.track*dt);if(e.timer<=0){e.state='burn';e.timer=SPOTLIGHTER.burn;g.emit('spotBurn',{x:e.beamX,y:beamFloor(g,e),enemyType:e.type});}}
 else if(e.state==='burn'){if(e.timer<=0){e.state='cool';e.timer=SPOTLIGHTER.cool;}}
 else if(e.state==='cool'&&e.timer<=0){e.state='patrol';e.timer=SPOTLIGHTER.rest;}
}

const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
// Журавль: a sound operator at the end of a truss. He keeps the boom up, winds up, then lowers it to sweep at head
// height across `reach` px in front of him for a while. Standing Uma is knocked back; crouching she passes under.
// Three paw hits break him; a hit stuns him (the mic drops to the floor) for a moment.
export const BOOM={up:1.7,windup:.5,sweep:2,stun:1.8,reach:130,head:40,thick:12};
export function boomBox(g,e){
 const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex),floor=s?s.y:e.y+e.h,dir=e.dir;
 const hand=e.x+e.w/2+dir*10,tip=hand+dir*BOOM.reach;return {x:Math.min(hand,tip),y:floor-BOOM.head-BOOM.thick/2,w:Math.abs(tip-hand),h:BOOM.thick,floor,hand,tip};
}
export function stepBoom(g,e,dt,dx,dy){
 const p=g.player;
 if(e.state==='stunned'){if(e.timer<=0){e.state='patrol';e.timer=BOOM.up;}return;}
 if(e.state==='patrol'){if(e.timer<=0&&Math.abs(dx)<420&&Math.abs(dy)<160){e.state='windup';e.timer=BOOM.windup;g.emit('boomWarning',{x:e.x,y:e.y,enemyType:e.type});}}
 else if(e.state==='windup'&&e.timer<=0){e.state='sweep';e.timer=BOOM.sweep;e.knocked=false;g.emit('boomSweep',{x:e.x,y:e.y,enemyType:e.type});}
 else if(e.state==='sweep'){
  const box=boomBox(g,e);
  if(!e.knocked&&p.inv===0&&p.dash===0&&overlap(p,box)){e.knocked=true;g.hurt(false,box.tip);if(g.mode==='playing')g.push(-e.dir,box.hand);g.emit('boomHit',{x:p.x,y:p.y});}
  if(!overlap(p,box))e.knocked=false;
  if(e.timer<=0){e.state='patrol';e.timer=BOOM.up;}
 }
}
