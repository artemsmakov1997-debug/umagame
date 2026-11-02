import {LAST_ROOM,PORTAL_ROOM,PORTAL_X,MAX_HEALTH,spawns} from './level.js?v=0.15.1';
import {activateRoom,canLeaveRoom} from './room-transitions.js?v=0.15.1';
export const ARENA_ENTRY_DURATION=1.6;
export function beginArenaEntry(g){
 if(g.mode!=='playing'||g.room!==PORTAL_ROOM||g.arenaEntered||!canLeaveRoom(g))return false;
 const p=g.player;g.arenaEntry={time:0,fromX:p.x,fromY:p.y,transferred:false};g.mode='enteringArena';Object.assign(p,{attack:0,dash:0,vx:0,vy:0,climbing:false,sneaking:false,grounded:false,h:48});g.emit('arenaPull');return true;
}
export function stepArenaEntry(g,dt){
 const entry=g.arenaEntry,p=g.player;if(!entry)return;entry.time=Math.min(ARENA_ENTRY_DURATION,entry.time+Math.min(dt,1/30));
 if(entry.time<.78){const t=Math.min(1,entry.time/.78),ease=t*t;p.x=entry.fromX+(PORTAL_X-16-entry.fromX)*ease;p.y=entry.fromY+(205-entry.fromY)*ease;p.warpScale=1-ease*.8;g.updateCamera();}
 else if(!entry.transferred){
  entry.transferred=true;activateRoom(g,LAST_ROOM);p.warpScale=.3;g.emit('arenaEnter');
 }else p.warpScale=Math.min(1,.3+(entry.time-.78)/.82*.7);
 if(entry.time>=ARENA_ENTRY_DURATION){delete p.warpScale;g.arenaEntry=null;g.mode='playing';g.emit('arenaReady');}
}
