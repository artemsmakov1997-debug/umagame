import {rooms} from './level.js?v=0.19.0';
import {canLeaveRoom} from './room-transitions.js?v=0.19.0';
const themes={newsroom:0,roofs:1,studio:2,noise:3};
function gateway(c,a,center,theme,open,height=330,mirror=false){
 const art=a.barriers;if(!art)return;const sw=art.width/4,sh=art.height/2,w=height*sw/sh;
 c.save();c.translate(Math.round(center),474);if(mirror)c.scale(-1,1);c.drawImage(art,theme*sw,(open?1:0)*sh,sw,sh,-w/2,-height,w,height);c.restore();
}
export function drawPassages(c,a,g){
 const room=rooms[g.room],theme=themes[room.theme];if(theme===undefined)return;
 // Internal architecture is always passable: the same world continues through the arch.
 if(!room.arena)for(const offset of[768,1536]){
  const x=room.x+offset;if(x>g.camera-180&&x<g.camera+(g.viewWidth||768)+180)gateway(c,a,x,theme,true,390);
 }
 // The chapter exit keeps its existing unlock rules, presented as a substantial gate.
 if(g.room!==7&&g.room!==8)gateway(c,a,room.end+6,theme,canLeaveRoom(g),370);
 if(room.arena)gateway(c,a,room.x-88,theme,false,370,true);
}
