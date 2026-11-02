import {rooms,spawns,MAX_HEALTH,LAST_ROOM} from './level.js?v=0.15.1';
import {createBoss} from './boss.js?v=0.15.1';
import {wakePlayer} from './player-rest.js?v=0.15.1';
export const LOCATION_LOAD_TIME=1.1;
export function remainingAntennas(g,room=g.room){return g.relays.filter(d=>d.room===room&&d.hp>0);}
export function canLeaveRoom(g,room=g.room){
 const r=rooms[room];if(!r)return false;
 if(r.tutorial)return g.tutorial.complete;
 if(remainingAntennas(g,room).length)return false;
 return !r.arena||g.bossesDefeated.has(r.boss);
}
export function activateRoom(g,index,{heal=true}={}){
 const r=rooms[index],p=g.player;if(!r)return;
 g.room=index;g.checkpoint=index;g.chapter=r.chapter;g.roomHistory.add(index);g.transition=null;g.bolts=[];g.portals=[];g.swallow=null;g.inks=[];g.cuts=[];g.tether=null;g.echoWarp=null;g.echoPull=null;p.echoPulled=false;p.echoGrace=0;
 wakePlayer(p);Object.assign(p,spawns[index],{w:34,h:48,vx:0,vy:0,grounded:true,supportId:index+':0',climbing:false,sneaking:false,slipping:false,inkTime:0,glueGrace:0,pulled:false,knock:0,dash:0,dashCooldown:0,attack:0,inv:1.5,hurtTime:0});delete p.warpScale;
 g.visitedPlatforms=new Set([index+':0']);g.safeTrail=[{platformId:index+':0',x:p.x,y:p.y}];g.echoImmunity=1.5;
 if(heal)g.health=r.arena?MAX_HEALTH:Math.min(MAX_HEALTH,g.health+1);
 g.boss=createBoss(index);if(r.arena){if(g.bossesDefeated.has(r.boss)){g.boss.hp=0;g.boss.active=false;}else{g.boss.active=true;g.boss.state='recover';g.boss.timer=2;g.boss.noticeTime=.35;g.emit('bossStart',{boss:r.boss});}}
 if(index===LAST_ROOM)g.arenaEntered=true;
 g.unlockForRoom(index);g.updateCamera();g.emit('locationEnter',{room:index,chapter:r.chapter});
}
export function beginLocationTransition(g,to=g.room+1){
 if(g.mode!=='playing'||!rooms[to]||!canLeaveRoom(g))return false;
 const p=g.player;g.loading={from:g.room,to,time:0,transferred:false,duration:LOCATION_LOAD_TIME};g.mode='loading';Object.assign(p,{vx:0,vy:0,attack:0,dash:0,climbing:false});g.emit('locationExit',{from:g.room,to});return true;
}
export function stepLocationTransition(g,dt){
 const load=g.loading;if(!load)return;load.time=Math.min(load.duration,load.time+Math.min(dt,1/30));
 if(load.time>=.5&&!load.transferred){load.transferred=true;activateRoom(g,load.to);}
 if(load.time>=load.duration){g.loading=null;g.mode='playing';g.emit('locationReady',{room:g.room});}
}
