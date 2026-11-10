import {signalProfile} from './signal.js?v=0.21.5';
import {buildWall} from './infoshum-combat.js?v=0.21.5';
import {rooms,spawns,platforms,MAX_HEALTH,LAST_ROOM} from './level.js?v=0.21.5';
import {createBoss} from './boss.js?v=0.21.5';
import {syncAgitatorPlatforms} from './agitator-combat.js?v=0.21.5';
import {wakePlayer} from './player-rest.js?v=0.21.5';
import {createRoofs} from './roofs-systems.js?v=0.21.5';
import {createStudio,updateStudioPlatforms} from './studio-systems.js?v=0.21.5';
import {createDimension,updateDimensionPlatforms} from './dimension-systems.js?v=0.21.5';
export const LOCATION_LOAD_TIME=1.1;
export function remainingAntennas(g,room=g.room){return g.relays.filter(d=>d.room===room&&!d.scripted&&d.hp>0);}
export function canLeaveRoom(g,room=g.room){
 const r=rooms[room];if(!r)return false;
 if(r.tutorial)return !!g.tutorial?.doorOpen;
 if(remainingAntennas(g,room).length)return false;
 return !r.arena||g.bossesDefeated.has(r.boss);
}
export function activateRoom(g,index,{heal=true}={}){
 const r=rooms[index],p=g.player;if(!r)return;
 if(index===LAST_ROOM||index===6||index===4){for(const surface of g.platforms.filter(s=>s.room===index)){const original=platforms.find(s=>s.id===surface.id);if(original)Object.assign(surface,{...original,baseX:original.x,baseY:original.y,prevX:original.x,prevY:original.y,dx:0,dy:0,bossHidden:false,storm:undefined,heap:undefined,debris:undefined,drift:0,infoshumStep:false,intangible:false,burned:false,studioPhase:'solid',studioTimer:5+surface.index*.33});}}
 g.defeat=null;g.signal={...signalProfile(index),echoTime:0};g.sectionTransition=null;g.room=index;g.checkpoint=index;g.chapter=r.chapter;g.roomHistory.add(index);g.transition=null;g.bolts=[];g.portals=[];g.swallow=null;g.inks=[];g.cuts=[];g.tether=null;g.echoWarp=null;g.echoPull=null;p.echoPulled=false;p.echoGrace=0;
 wakePlayer(p);Object.assign(p,spawns[index],{w:34,h:48,vx:0,vy:0,grounded:true,supportId:index+':0',climbing:false,sneaking:false,dropTime:0,dropId:null,dropHeld:false,slipping:false,inkTime:0,glueGrace:0,pulled:false,knock:0,dash:0,dashCooldown:0,attack:0,inv:1.5,hurtTime:0});delete p.warpScale;
 g.visitedPlatforms=new Set([index+':0']);g.safeTrail=[{platformId:index+':0',x:p.x,y:p.y}];g.echoImmunity=1.5;
 if(heal)g.health=r.arena?MAX_HEALTH:Math.min(MAX_HEALTH,g.health+1);
 if(index===2||index===6)for(const d of g.relays)if(d.room===index)d.hp=0;
 g.boss=createBoss(index);if(g.boss.network&&!g.bossesDefeated.has(r.boss))buildWall(g);if(r.arena){if(g.bossesDefeated.has(r.boss)){g.boss.hp=0;g.boss.active=false;if(g.boss.broadcast){g.boss.broadcast.stage='done';g.boss.broadcast.mast='bent';}}else{g.boss.active=true;g.boss.state='recover';g.boss.timer=2;g.boss.noticeTime=.35;g.emit('bossStart',{boss:r.boss});for(const n of g.notebooks||[])if(n.bossStart&&n.room===index&&!n.taken)n.readyAt=g.time;}}
 if(index===4)syncAgitatorPlatforms(g);
 if(index===3)g.roofs=createRoofs();
 if(index===5){g.studio=createStudio();updateStudioPlatforms(g);}
 if(index===7){g.dimension=createDimension();g.player.flipped=false;g.player.launch=0;updateDimensionPlatforms(g);}
 if(index===LAST_ROOM)g.arenaEntered=true;
 g.unlockForRoom(index);g.updateCamera();g.emit('locationEnter',{room:index,chapter:r.chapter});
}
export function beginLocationTransition(g,to=g.room+1){
 if(g.mode!=='playing'||!rooms[to]||!canLeaveRoom(g))return false;
 const p=g.player;g.loading={from:g.room,to,time:0,transferred:false,duration:rooms[to].chapter!==rooms[g.room].chapter&&rooms[g.room].chapter?1.8:LOCATION_LOAD_TIME};g.mode='loading';Object.assign(p,{vx:0,vy:0,attack:0,dash:0,climbing:false});g.emit('locationExit',{from:g.room,to});return true;
}
export function stepLocationTransition(g,dt){
 const load=g.loading;if(!load)return;load.time=Math.min(load.duration,load.time+Math.min(dt,1/30));
 if(load.time>=load.duration/2&&!load.transferred){load.transferred=true;activateRoom(g,load.to);}
 if(load.time>=load.duration){g.loading=null;g.mode='playing';g.emit('locationReady',{room:g.room});}
}
