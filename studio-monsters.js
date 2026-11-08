import {rooms} from './level.js?v=0.21.5';
import {solidSurfaces} from './terrain.js?v=0.21.5';
// Studio monsters of the second redesign.
// Прожекторщик: hangs from the ceiling truss, out of reach. It swings its red beam after Uma, locks it and burns:
// the beam hurts and pushes her out. White lamps hold the risers; the red one holds nothing. A low set flat in the
// way stops the beam (it lands on the flat), so crawling under the flat is safe.
export const SPOTLIGHTER={track:95,aim:1.35,burn:.9,cool:1.2,rest:.8,half:26,reach:560,lens:60};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
// Where the red beam lands: the first solid surface (or the flat) under its x, else the bottom of the screen.
export function beamFloor(g,e,x=e.beamX){
 const top=SPOTLIGHTER.lens+8,hit=solidSurfaces(g).filter(s=>s.room===e.room&&x>=s.x&&x<=s.x+s.w&&s.y>top).sort((a,b)=>a.y-b.y)[0];
 return hit?hit.y:480;
}
export const lensPoint=e=>({x:e.x+e.w/2,y:SPOTLIGHTER.lens});
export function beamBox(g,e){const floor=beamFloor(g,e);return {x:e.beamX-SPOTLIGHTER.half,y:floor-150,w:SPOTLIGHTER.half*2,h:150};}
export function stepSpotlighter(g,e,dt,dx){
 const p=g.player,[x1,x2]=e.sweep.map(v=>v+rooms[e.room].x),target=Math.max(x1,Math.min(x2,p.x+p.w/2)),near=p.x+p.w>x1-SPOTLIGHTER.reach/3&&p.x<x2+SPOTLIGHTER.reach/3;
 e.beamX??=e.x+e.w/2;
 if(e.state==='patrol'){if(near&&e.timer<=0){e.state='aim';e.timer=SPOTLIGHTER.aim;g.emit('spotAim',{x:e.beamX,y:e.y,enemyType:e.type});}}
 else if(e.state==='aim'){const d=target-e.beamX;e.beamX+=Math.sign(d)*Math.min(Math.abs(d),SPOTLIGHTER.track*dt);if(e.timer<=0){e.state='burn';e.timer=SPOTLIGHTER.burn;e.burned=false;g.emit('spotBurn',{x:e.beamX,y:beamFloor(g,e),enemyType:e.type});}}
 else if(e.state==='burn'){
  const box=beamBox(g,e);
  if(!e.burned&&p.inv===0&&p.dash===0&&overlap(p,box)){e.burned=true;g.hurt(false,e.beamX);if(g.mode==='playing')g.push(p.x+p.w/2<e.beamX?-1:1,e.beamX);g.emit('spotHit',{x:p.x,y:p.y});}
  if(e.timer<=0){e.state='cool';e.timer=SPOTLIGHTER.cool;}
 }
 else if(e.state==='cool'&&e.timer<=0){e.state='patrol';e.timer=SPOTLIGHTER.rest;}
}

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
