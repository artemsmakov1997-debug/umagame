import {enemy,rooms,chapters} from './level.js?v=0.16.0';
import {solidSurfaces} from './terrain.js?v=0.16.0';
import {stampInk} from './tactical-enemies.js?v=0.16.0';
import {alertNearby} from './enemies.js?v=0.16.0';
import {bossProxy,bossActorId} from './boss-actors.js?v=0.16.0';
import {releaseEchoPull} from './echo-pull.js?v=0.16.0';
export const bossTroops=Object.fromEntries(chapters.map(c=>[c.boss,c.monsters]));
export function summonPlaces(g,count=3){
 const b=g.boss,p=g.player,choices=solidSurfaces(g).filter(s=>s.room===g.room&&s.w>=120).sort((a,c)=>Math.abs(a.x+a.w/2-p.x)+Math.abs(a.y-p.y-p.h)-Math.abs(c.x+c.w/2-p.x)-Math.abs(c.y-p.y-p.h)),result=[];
 for(const s of choices){for(const x of [s.x+12,s.x+s.w-60,s.x+s.w/2-24]){
  if(Math.abs(x-p.x)<100&&Math.abs(s.y-p.y-p.h)<100)continue;
  const area={x:x-8,y:s.y-60,w:64,h:68};if(g.overlap(area,b)||g.enemies.some(e=>!e.dead&&e.active&&!e.phased&&e.room===g.room&&g.overlap(area,e))||result.some(t=>Math.abs(t.x-x)<64&&t.index===s.index))continue;
  result.push({x,y:s.y,index:s.index});if(result.length>=count)return result;break;
 }}return result;
}
export function summonBossTroops(g,{types=null,copy=false,count=2}={}){
 const b=g.boss,roster=types||bossTroops[b.id],all=g.enemies.filter(e=>e.bossOwnerId===b.id&&!e.dead),alive=all.filter(e=>!!e.copyOwnerId===copy),limit=copy?2:3,free=Math.min(count,limit-alive.length),places=summonPlaces(g,free);if(free<=0)return[];
 const made=[];for(const t of places){let type;
  for(let attempt=0;attempt<roster.length;attempt++){const candidate=roster[b.summonCursor++%roster.length];if(candidate==='clickbait'&&all.some(e=>e.type==='clickbait'))continue;if(!copy&&alive.concat(made).some(e=>e.type===candidate))continue;type=candidate;break;}
  if(!type)continue;const e=enemy(type,g.room,t.x-rooms[g.room].x,t.index,{id:'boss-troop-'+(++g.tacticalSerial),bossOwnerId:b.id,minion:true,active:true,noticed:true,spawnTime:.6,dir:g.player.x<t.x?-1:1,...(copy?{copyOwnerId:bossActorId(b),copyOf:'boss-print',hp:1,maxHp:1}:{})});
  const surface=g.platforms.find(s=>s.room===g.room&&s.index===t.index);e.y=t.y-(e.flying?100:e.h);e.origin=surface.x+8;e.end=surface.x+surface.w-e.w-8;
  g.enemies.push(e);made.push(e);g.emit(copy?'copySpawn':'bossSummon',{boss:b.id,enemyType:type,x:e.x,y:e.y});
 }return made;
}
export function castInherited(g,ability){
 const b=g.boss,p=g.player;
 if(ability==='summon'){summonBossTroops(g);return true;}
 if(ability==='copy'){summonBossTroops(g,{types:['fakenews'],copy:true,count:2});g.emit('copyScan',{x:b.x,y:b.y,enemyType:'copier'});return true;}
 if(ability==='ink'){
  const supports=solidSurfaces(g).filter(s=>s.room===g.room&&s.w>=110).sort((a,c)=>Math.abs(a.x+a.w/2-p.x)+Math.abs(a.y-p.y-p.h)-Math.abs(c.x+c.w/2-p.x)-Math.abs(c.y-p.y-p.h));
  for(const s of supports.slice(0,2))stampInk(g,{...bossProxy(g),platformIndex:s.index,x:Math.max(s.x+16,Math.min(s.x+s.w-64,p.x)),type:'censor'});return true;
 }
 if(ability==='alarm'){if(!p.sneaking){alertNearby(g,bossProxy(g));b.alarmActive=true;}return true;}
 if(ability==='splice'){g.tether={ownerId:bossActorId(b),remaining:5,total:5};g.emit('gluePull',{x:b.x,y:b.y,enemyType:'splicer'});return true;}
 if(ability==='lure'){summonBossTroops(g,{types:['clickbait'],count:1});return true;}
 return false;
}
export function clearBossHelpers(g){
 const b=g.boss;for(const e of g.enemies)if(e.bossOwnerId===b.id||e.portalOwnerId===bossActorId(b)){e.dead=true;e.hp=0;e.deathTime=.28;}
 for(const p of g.portals)if(p.ownerId===bossActorId(b))p.cancelled=true;
 releaseEchoPull(g);g.tether=null;g.player.pulled=false;g.inks=[];g.cuts=[];
}
