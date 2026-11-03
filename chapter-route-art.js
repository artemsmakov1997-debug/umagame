import {rooms} from './level.js?v=0.17.0';
import {rect,text} from './pixel.js?v=0.17.0';
import {sectionNames} from './chapter-routes.js?v=0.17.0';
const columns={server:0,power:1,console:2,anchor:3};
export function drawMapProps(c,a,g,t){
 if(!a.destructibles)return;
 for(const d of g.mapProps||[]){if(d.room!==g.room||d.x<g.camera-100||d.x>g.camera+(g.viewWidth||768)+100)continue;
  const col=columns[d.kind],row=d.hp?0:d.breakTime>.25?1:2,sw=a.destructibles.width/4,sh=a.destructibles.height/3;c.drawImage(a.destructibles,col*sw,row*sh,sw,sh,d.x-21,d.y-18,90,80);
  if(d.hp){rect(c,d.x+20,d.y-18,8,2,'#ffda8a');rect(c,d.x+23,d.y-21,2,8,'#ffda8a');}
 }
 for(const r of g.routePortals||[]){if(r.room!==g.room)continue;const control=g.mapProps.find(d=>d.id===r.controlId);for(const index of[r.fromIndex,r.toIndex]){const s=g.platforms.find(s=>s.room===r.room&&s.index===index),x=s.x+s.w/2;if(x<g.camera-80||x>g.camera+(g.viewWidth||768)+80)continue;
   const col=r.room===1?0:r.room===3?2:r.room===5?1:0,row=r.room===7?2:0,sw=a.sources.width/3,sh=a.sources.height/3;c.save();c.globalAlpha=control.hp?.45:1;c.drawImage(a.sources,col*sw,row*sh,sw,sh,x-38,s.y-66,76,66);c.restore();
   if(!control.hp){text(c,'↑',x-4,s.y-73,'#a3f4e7',2);for(let k=0;k<3;k++)rect(c,x-20+k*19,s.y-8-Math.sin(t*3+k)*4,2,2,'#9be8e8');}
  }}
 // Warned environmental machinery belongs to each sector, and stops with its controller.
 for(const d of g.mapProps||[]){if(d.room!==g.room||!d.hp)continue;const phase=(t+d.section*.8)%5;if(phase>2.2)continue;const x=rooms[g.room].x+d.section*768+260,w=110,color=g.room===3?'#bfe9f0':g.room===5?'#ffdd8a':g.room===7?'#ba94f1':'#86d9e0';
  c.save();c.globalAlpha=phase<1.2?.25+.15*Math.sin(t*12):.7;
  for(let k=0;k<8;k++)rect(c,x+k*14,468,9,3,color);
  if(phase>=1.2)for(let k=0;k<18;k++){const yy=55+(k*29+t*(g.room===3?90:155))%410,xx=x+(k*17)%w;rect(c,xx,yy,g.room===3?18:4,g.room===3?2:9,color);}c.restore();
 }
}
export function drawSectionTransition(c,g,width){
 const s=g.sectionTransition;if(!s)return;const alpha=Math.sin(Math.min(1,s.time/.65)*Math.PI);c.save();c.globalAlpha=alpha;rect(c,0,0,width,480,'#03091d');c.font=`${width<300?25:34}px UmaText,monospace`;c.fillStyle='#ffe6ae';c.textAlign='center';c.fillText(s.title,width/2,242,width-24);c.restore();
}
