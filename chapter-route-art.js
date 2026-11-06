import {rooms} from './level.js?v=0.21.5';
import {hazardZone,machineActive} from './chapter-routes.js?v=0.21.5';
import {rect,text} from './pixel.js?v=0.21.5';
import {drawTargetSprite} from './target-art.js?v=0.21.5';
import {drawNewsroomMachines} from './newsroom-art.js?v=0.21.5';
const columns={server:0,power:1,console:2,anchor:3};
export function drawMapProps(c,a,g,t){
 drawNewsroomMachines(c,g,t,a);
 if(!a.destructibles)return;
 for(const d of g.mapProps||[]){if(d.room!==g.room||d.x<g.camera-100||d.x>g.camera+(g.viewWidth||768)+100)continue;
  const col=columns[d.kind],row=d.hp?0:d.breakTime>.25?1:2,sw=a.destructibles.width/4,sh=a.destructibles.height/3;drawTargetSprite(c,a.destructibles,[col*sw,row*sh,sw,sh],d.x-21,d.y-18,90,80,t,d.hp>0);
  if(d.hp){rect(c,d.x+20,d.y-18,8,2,'#ffda8a');rect(c,d.x+23,d.y-21,2,8,'#ffda8a');}
 }
 for(const r of g.routePortals||[]){if(r.room!==g.room||!a.burrows)continue;for(const index of[r.fromIndex,r.toIndex]){const s=g.platforms.find(s=>s.room===r.room&&s.index===index),x=s.x+s.w/2;if(x<g.camera-80||x>g.camera+(g.viewWidth||768)+80)continue;
  const cell=r.room===3?1:r.room===5?2:3,sw=a.burrows.width/2,sh=a.burrows.height/2;c.save();c.shadowColor='#ffd771';c.shadowBlur=5;c.drawImage(a.burrows,cell%2*sw,Math.floor(cell/2)*sh,sw,sh,x-44,s.y-59,88,59);c.restore();
  if(g.hintsEnabled!==false){rect(c,x-34,s.y-77,68,18,'#04132b');text(c,'↑ НОРКА',x-29,s.y-73,'#fff3ba');}
 }}
 // Warned environmental machinery belongs to each sector, and stops with its controller.
 for(const d of g.mapProps||[]){if(d.room!==g.room||!machineActive(g,g.room,d.section))continue;const phase=(t+d.section*.8)%5;if(phase>2.2)continue;const [from,to]=hazardZone(g.room,d.section),x=rooms[g.room].x+d.section*768+from,w=to-from,color=g.room===3?'#bfe9f0':g.room===5?'#ffdd8a':g.room===7?'#ba94f1':'#86d9e0';
  c.save();c.globalAlpha=phase<1.2?.25+.15*Math.sin(t*12):.7;
  rect(c,x-3,466,w+6,9,'#071224');rect(c,x,466,w,3,color);rect(c,x+3,469,w-6,4,'#294557');
  if(phase>=1.2&&!(g.room===1&&d.section===1))for(let k=0;k<18;k++){const yy=g.room===1?360+(k*29+t*155)%105:55+(k*29+t*(g.room===3?90:155))%410,xx=x+(k*17)%w;rect(c,xx,yy,g.room===3?18:4,g.room===3?2:9,color);}c.restore();
 }
}
