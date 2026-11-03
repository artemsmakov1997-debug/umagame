import {platforms} from './level.js?v=0.17.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function solidSurfaces(g){
 const all=g.platforms||platforms;if(!g.cuts?.some(c=>c.phase==='gap'))return all;
 return all.flatMap(s=>{
  const cut=g.cuts.find(c=>c.platformId===s.id&&c.phase==='gap');if(!cut)return [s];
  const left=clamp(cut.localX,0,s.w),right=clamp(cut.localX+cut.w,0,s.w),parts=[];
  if(left>2)parts.push({...s,w:left,segment:0});
  if(right<s.w-2)parts.push({...s,x:s.x+right,prevX:(s.prevX??s.x)+right,w:s.w-right,segment:1});
  return parts;
 });
}
export function inkAt(g,actor){
 if(!g.inks||actor.climbing||actor.jumpPhase==='air'||actor.terrainFall)return null;
 const feet=actor.y+actor.h;
 return g.inks.find(ink=>{
  if(ink.room!==g.room||ink.time<=0)return false;
  const s=g.platforms.find(s=>s.id===ink.platformId);return s&&Math.abs(s.y-feet)<4&&actor.x+actor.w>s.x+ink.localX&&actor.x<s.x+ink.localX+ink.w;
 })||null;
}
export function stepTacticalTerrain(g,dt){
 for(const ink of g.inks)if(ink.room===g.room)ink.time-=dt;
 g.inks=g.inks.filter(i=>i.time>0);
 for(const cut of g.cuts){
  if(cut.room!==g.room)continue;
  const surface=g.platforms.find(s=>s.id===cut.platformId);if(surface){cut.x=surface.x+cut.localX+cut.w/2;cut.y=surface.y;}
  const owner=cut.ownerId==='boss:'+g.boss.id&&g.boss.active&&g.boss.hp>0?g.boss:g.enemies.find(e=>e.id===cut.ownerId&&!e.dead);
  if(cut.phase==='warning'&&(!owner||owner.hurtTime>0)){cut.time=0;continue;}
  cut.time-=dt;
  if(cut.phase==='warning'&&cut.time<=0){cut.phase='gap';cut.time=3;g.emit('platformCut',{x:cut.x,y:cut.y,enemyType:'cutter'});}
  else if(cut.phase==='gap'&&cut.time<=0)g.emit('platformRestore',{x:cut.x,y:cut.y});
 }
 g.cuts=g.cuts.filter(c=>c.time>0);
}
export function stepEnemyFall(g,e,dt){
 if(e.flying||e.phased||e.teleport||e.jumpPhase==='air')return false;
 const surfaces=solidSurfaces(g),feet=e.y+e.h;
 if(!e.terrainFall){
  const base=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);
  if(!base||!g.cuts.some(c=>c.platformId===base.id&&c.phase==='gap')||surfaces.some(s=>s.id===base.id&&Math.abs(s.y-feet)<4&&e.x+e.w>s.x+1&&e.x<s.x+s.w-1))return false;
  e.terrainFall=true;e.fallVx=e.dir*e.speed;e.vy=35;e.jumpPhase=null;e.state='fall';g.emit('enemyFall',{x:e.x,y:e.y,enemyType:e.type});
 }
 e.x+=e.fallVx*dt;e.vy=Math.min(550,e.vy+900*dt);e.y+=e.vy*dt;
 const landed=surfaces.filter(s=>s.room===e.room&&e.x+e.w>s.x+1&&e.x<s.x+s.w-1&&feet<=(s.prevY??s.y)+1&&e.y+e.h>=s.y).sort((a,b)=>a.y-b.y)[0];
 if(landed){e.y=landed.y-e.h;e.platformIndex=landed.index;e.origin=landed.x+4;e.end=Math.max(e.origin,landed.x+landed.w-e.w-4);e.x=clamp(e.x,e.origin,e.end);e.vy=0;e.terrainFall=false;e.state='recover';e.timer=.65;}
 else if(e.y>520){
  if(e.type==='clickbait'){const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);e.x=s.x+8;e.y=s.y-e.h;e.terrainFall=false;e.vy=0;e.state='recover';e.timer=1;}
  else{e.dead=true;e.hp=0;e.deathTime=.28;g.kills++;g.emit('pop',{x:e.x,y:e.y,enemyType:e.type});}
 }
 return true;
}
