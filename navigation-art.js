import {rooms,PORTAL_ROOM,PORTAL_X,LAST_ROOM} from './level.js?v=0.22.0';
import {canLeaveRoom} from './room-transitions.js?v=0.22.0';
import {rect} from './pixel.js?v=0.22.0';
export function exitMarker(g){if(g.room===LAST_ROOM||!canLeaveRoom(g))return null;const r=rooms[g.room];return{x:g.room===PORTAL_ROOM?PORTAL_X-80:r.end-70,y:g.room===0?200:172};}
const arrow=['0000000011000000','0000000011100000','0000000011110000','0111111111111000','0111111111111100','0111111111111110','0111111111111100','0111111111111000','0000000011110000','0000000011100000','0000000011000000'];
export function drawExitArrow(c,g,time,width){if(g.room===LAST_ROOM||g.mode!=='playing')return;let mark=exitMarker(g),locked=!mark;if(locked){if(rooms[g.room].end-g.player.x>260)return;mark={x:rooms[g.room].end-70,y:172};}const off=mark.x>g.camera+width-48,x=Math.round(off?g.camera+width-42:mark.x+(locked?0:Math.sin(time*2.6)*2)),y=off?62:mark.y,theme=rooms[g.room].theme;
 // A bevelled sign sits on a material-specific bracket, rather than a triangle and stick.
 rect(c,x-4,y+25,39,6,theme==='roofs'?'#684c4d':theme==='studio'?'#443454':theme==='noise'?'#42356a':'#384b5e');rect(c,x-2,y+24,35,2,locked?'#506c7b':'#94c9d3');for(const xx of[x,x+28])rect(c,xx,y+27,2,2,'#b2c8c9');
 for(let row=0;row<arrow.length;row++)for(let col=0;col<16;col++)if(arrow[row][col]==='1'){rect(c,x+col*2+2,y+row*2+3,2,2,'#020a1a');rect(c,x+col*2,y+row*2+1,2,2,locked?'#293d55':'#a16c35');rect(c,x+col*2,y+row*2,2,2,locked?'#78909f':row<4?'#fff2bf':row<8?'#ffdb85':'#dfad5c');}
 if(locked){rect(c,x+6,y+6,8,8,'#25364d');rect(c,x+8,y+4,4,3,'#b2c1cc');rect(c,x+9,y+9,2,3,'#dfbe78');}else{const a=.35+Math.sin(time*3)*.1;c.save();c.globalAlpha=a;rect(c,x-4,y+4,2,14,'#70dfe6');rect(c,x+35,y+8,2,7,'#70dfe6');c.restore();}
}
