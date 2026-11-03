import {rooms,PORTAL_ROOM,PORTAL_X,LAST_ROOM} from './level.js?v=0.20.0';
import {canLeaveRoom} from './room-transitions.js?v=0.20.0';
import {rect} from './pixel.js?v=0.20.0';
export function exitMarker(g){
 if(g.room===LAST_ROOM||!canLeaveRoom(g))return null;const r=rooms[g.room];return{x:g.room===PORTAL_ROOM?PORTAL_X-80:r.end-70,y:g.room===0?200:192};
}
export function drawExitArrow(c,g,time,width){
 const mark=exitMarker(g);if(!mark||g.mode!=='playing')return;
 const offscreen=mark.x>g.camera+width-44,x=Math.round(offscreen?g.camera+width-37:mark.x+Math.sin(time*3)*3),y=offscreen?143:mark.y;
 rect(c,x-12,y-13,28,29,'#051328d9');for(let i=0;i<6;i++){rect(c,x+i*3,y-10+i*2,3,21-i*4,'#ffe3a2');}rect(c,x-9,y-3,13,7,'#78e6e6');
}
