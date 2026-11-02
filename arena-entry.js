import {LAST_ROOM,PORTAL_ROOM,PORTAL_X,MAX_HEALTH,spawns} from './level.js?v=0.13.0';
export const ARENA_ENTRY_DURATION=1.6;
export function beginArenaEntry(g){
 if(g.mode!=='playing'||g.room!==PORTAL_ROOM||g.arenaEntered)return false;
 const p=g.player;g.arenaEntry={time:0,fromX:p.x,fromY:p.y,transferred:false};g.mode='enteringArena';Object.assign(p,{attack:0,dash:0,vx:0,vy:0,climbing:false,sneaking:false,grounded:false,h:48});g.emit('arenaPull');return true;
}
export function stepArenaEntry(g,dt){
 const entry=g.arenaEntry,p=g.player;if(!entry)return;entry.time=Math.min(ARENA_ENTRY_DURATION,entry.time+Math.min(dt,1/30));
 if(entry.time<.78){const t=Math.min(1,entry.time/.78),ease=t*t;p.x=entry.fromX+(PORTAL_X-16-entry.fromX)*ease;p.y=entry.fromY+(205-entry.fromY)*ease;p.warpScale=1-ease*.8;g.updateCamera();}
 else if(!entry.transferred){
  entry.transferred=true;g.arenaEntered=true;g.room=LAST_ROOM;g.checkpoint=LAST_ROOM;g.health=MAX_HEALTH;g.bolts=[];g.portals=[];g.swallow=null;
  Object.assign(p,spawns[LAST_ROOM],{h:48,vx:0,vy:0,grounded:true,supportId:LAST_ROOM+':0',warpScale:.3,inv:1.5,dashCooldown:0});
  g.boss.active=true;g.boss.state='recover';g.boss.timer=2;g.boss.noticeTime=.4;g.emit('arenaEnter');g.emit('bossStart');g.updateCamera();
 }else p.warpScale=Math.min(1,.3+(entry.time-.78)/.82*.7);
 if(entry.time>=ARENA_ENTRY_DURATION){delete p.warpScale;g.arenaEntry=null;g.mode='playing';g.emit('arenaReady');}
}
