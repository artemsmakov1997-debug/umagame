import {rooms} from './level.js?v=0.21.5';
// Pit rooms (roofs, studio): a fall costs one heart and returns Uma to the last safe surface she stood on.
export const FALL_RETURN_INV=1.6;
export function pitFall(g,room,isSafe){
 const p=g.player;
 const safe=[...g.safeTrail].reverse().find(m=>{const s=g.platforms.find(s=>s.id===m.platformId);return s&&s.room===room&&isSafe(s);});
 const s=safe?g.platforms.find(s=>s.id===safe.platformId):g.platforms.find(s=>s.id===room+':0');
 if(!g.testingInvulnerable){g.health--;if(g.health<=0){g.health=0;g.loseLife('fall');return true;}}
 const x=safe?Math.max(s.x+2,Math.min(s.x+s.w-p.w-2,safe.x)):s.x+20;
 Object.assign(p,{x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,climbing:false,knock:0,dash:0,attack:0,sneaking:false,inv:FALL_RETURN_INV,hurtTime:.5});
 g.emit('roofFall',{x:p.x,y:p.y,room});g.updateCamera();return true;
}
// After losing a life Uma restarts at the furthest checkpoint reached in this location.
export function placeAtCheckpoint(g,room,checkpoints,reached){
 const c=checkpoints[reached]||checkpoints[0],s=g.platforms.find(s=>s.id===room+':'+c.index);
 Object.assign(g.player,{x:rooms[room].x+c.x,y:s.y-48,supportId:s.id,grounded:true});g.safeTrail=[{platformId:s.id,x:g.player.x,y:g.player.y}];
}
