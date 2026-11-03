import {actorById} from './boss-actors.js?v=0.20.0';
import {enemy,rooms} from './level.js?v=0.20.0';
import {inkAt,solidSurfaces} from './terrain.js?v=0.20.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const TACTICAL_TYPES=['censor','copier','cutter'];
export function scanArea(g,e){
 const s=g.platforms.find(s=>s.room===e.room&&s.index===(e.scanIndex??e.platformIndex));if(!s)return null;
 const w=Math.min(e.scanW||136,s.w-24),localX=clamp(e.scanStart??32,12,s.w-w-12);return {x:s.x+localX,y:s.y-52,w,h:54,surface:s};
}
export function scanSource(g,e){
 const area=scanArea(g,e);if(!area)return null;
 return g.enemies.filter(other=>other!==e&&other.room===e.room&&other.active&&!other.dead&&!other.copyOwnerId&&!other.phased&&!other.terrainFall&&other.jumpPhase!=='air'&&['fakenews','informant','panicker','inflator'].includes(other.type)&&other.platformIndex===area.surface.index&&other.x+other.w/2>=area.x&&other.x+other.w/2<=area.x+area.w&&Math.abs(other.y+other.h-area.surface.y)<3).sort((a,b)=>(a.type==='fakenews'?0:1)-(b.type==='fakenews'?0:1))[0]||null;
}
export function cleanCopies(g){
 for(const copy of g.enemies){
  if(!copy.copyOwnerId||copy.dead)continue;
  const owner=actorById(g,copy.copyOwnerId);if(!owner||owner.dead||owner.hp<=0){
   copy.dead=true;copy.hp=0;copy.deathTime=.28;g.emit('copyDissolve',{x:copy.x,y:copy.y,enemyType:copy.type});
  }
 }
}
export function stampInk(g,e){
 const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);if(!s)return;
 const w=Math.min(96,s.w-8),localX=clamp(e.x+e.w/2-s.x-w/2,4,s.w-w-4),old=g.inks.find(i=>i.platformId===s.id&&Math.abs(i.localX-localX)<35);
 if(old){old.localX=localX;old.time=9;}else g.inks.push({id:'ink-'+(++g.tacticalSerial),room:e.room,platformId:s.id,localX,w,time:9,drift:e.x+e.w/2>s.x+s.w/2?1:-1});
 const own=g.inks.filter(i=>i.room===e.room);if(own.length>8)g.inks.splice(g.inks.indexOf(own[0]),1);
 g.emit('inkStamp',{x:e.x+e.w/2,y:s.y,enemyType:e.type});
}
function copyEnemy(g,e){
 const original=scanSource(g,e),area=scanArea(g,e);if(!original||original.id!==e.copySourceId||!area)return false;
 if(g.enemies.filter(c=>!c.dead&&c.copyOwnerId===e.id).length>=1||g.enemies.filter(c=>!c.dead&&c.copyOwnerId&&c.room===e.room).length>=2)return false;
 const supports=solidSurfaces(g).filter(s=>s.id===area.surface.id&&s.w>=92),s=supports.find(s=>e.x>=s.x&&e.x<s.x+s.w)||supports[0];if(!s)return false;
 const start=s.x+4,end=s.x+s.w-52,options=[e.x+e.dir*66,start,end,s.x+s.w*.25,s.x+s.w*.75];
 const x=options.map(x=>clamp(x,start,end)).find(x=>Math.abs(x-g.player.x)>62&&!g.enemies.some(other=>other.active&&!other.dead&&!other.phased&&other.room===e.room&&other.platformIndex===s.index&&x+50>other.x&&x-2<other.x+other.w));if(x===undefined)return false;
 const copy=enemy(original.type,e.room,x-rooms[e.room].x,s.index,{id:'copy-'+(++g.tacticalSerial),copyOwnerId:e.id,copyOf:original.id,active:true,noticed:true,spawnTime:.65,hp:1,maxHp:1,dir:g.player.x<x?-1:1,shieldBroken:2});
 copy.y=s.y-copy.h;copy.origin=start;copy.end=end;g.enemies.push(copy);g.emit('copySpawn',{x:copy.x,y:copy.y,enemyType:e.type});return true;
}
export function planCut(g,e){
 const p=g.player,surfaces=g.platforms.filter(s=>s.room===e.room&&s.cuttable&&!g.cuts.some(c=>c.platformId===s.id));
 const s=surfaces.sort((a,b)=>Math.abs(a.x+a.w/2-p.x)+Math.abs(a.y-p.y-p.h)-Math.abs(b.x+b.w/2-p.x)-Math.abs(b.y-p.y-p.h))[0];if(!s||Math.abs(s.x+s.w/2-e.x)>520)return false;
 const w=Math.min(88,s.w-88),center=p.supportId===s.id?p.x+p.w/2:s.x+s.w/2,localX=clamp(center-s.x-w/2,44,s.w-w-44);
 const cut={id:'cut-'+(++g.tacticalSerial),ownerId:e.id,room:e.room,platformId:s.id,localX,w,phase:'warning',time:1.8,x:s.x+localX+w/2,y:s.y};g.cuts.push(cut);e.cutId=cut.id;g.emit('cutWarning',{x:cut.x,y:cut.y,enemyType:e.type});return true;
}
export function stepTacticalEnemy(g,e,dt,dx,dy){
 if(e.type==='censor'){
  if(e.state==='patrol'){
   e.x+=e.dir*e.speed*dt;
   if(e.timer<=0&&Math.abs(dx)<300&&Math.abs(dy)<170){e.state='windup';e.timer=.48;g.emit('inkWarning',{x:e.x,y:e.y,enemyType:e.type});}
  }else if(e.state==='windup'&&e.timer<=0){stampInk(g,e);e.state='stamping';e.timer=.28;}
  else if(e.state==='stamping'&&e.timer<=0){e.state='recover';e.timer=.55;}
  else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=1.7;}
 }else if(e.type==='copier'){
  if(e.state==='patrol'){
   e.x+=e.dir*e.speed*dt;const source=scanSource(g,e);
   if(e.timer<=0&&Math.abs(dx)<380&&Math.abs(dy)<200){e.copySourceId=source?.id||null;e.state='windup';e.timer=.9;g.emit('copyScan',{x:e.x,y:e.y,enemyType:e.type});}
  }else if(e.state==='windup'&&e.timer<=0){e.state='printing';e.timer=.55;copyEnemy(g,e);}
  else if(e.state==='printing'&&e.timer<=0){e.state='recover';e.timer=1.1;}
  else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=2.4;}
 }else if(e.type==='cutter'){
  if(e.state==='patrol'){
   e.x+=e.dir*e.speed*dt;
   if(e.timer<=0&&Math.abs(dx)<500&&planCut(g,e)){e.state='windup';e.timer=1.8;}
  }else if(e.state==='windup'&&e.timer<=0){e.state='cutting';e.timer=.3;}
  else if(e.state==='cutting'&&e.timer<=0){e.state='recover';e.timer=1.2;}
  else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=3.4;}
 }
}
export function updateEnemyInk(g,e){
 const ink=e.type!=='censor'&&inkAt(g,e);e.inkSlow=ink?.38:1;
 if(e.type==='panicker'){
  const was=e.muffled;e.muffled=!!ink;
  if(ink){e.alertedOnce=false;if(!was)g.emit('alarmMuffled',{x:e.x,y:e.y,enemyType:e.type});e.state='patrol';e.timer=Math.max(e.timer,.65);e.noticed=false;for(const portal of g.portals)if(portal.ownerId===e.id)portal.cancelled=true;}
 }
}
