import {paperFeederPositions} from './spreader-combat.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
export function drawSpreaderEquipment(c,a,g,time){
 if(g.room!==2)return;const x=rooms[2].x,art=a.spreaderFeeders,sw=art.width/3,sh=art.height/2,frame=Math.floor(time*5)%3,feeders=paperFeederPositions(time);
 c.drawImage(art,frame*sw+100,30,350,450,x+62,-5+feeders[0].offset,110,141);
 c.drawImage(art,frame*sw+100,sh+30,350,450,x+416,-17+feeders[1].offset,105,135);
 // Ducts bolt both fixed paper machines to the ceiling.
 for(const xx of [x+107,x+457]){c.fillStyle='#10233a';c.fillRect(xx-7,0,14,35);c.fillStyle='#607e94';c.fillRect(xx-4,0,3,35);for(let y=3;y<35;y+=10){c.fillStyle='#92adba';c.fillRect(xx-8,y,16,3);}}
 // Pixel steel braces support the actual collision surfaces, without filled wedges.
 for(const s of g.platforms.filter(p=>p.room===2&&p.index!==0))for(const side of s.w>180?[-1,1]:[-1]){
  const xx=side===-1?s.x+10:s.x+s.w-14;
  c.fillStyle='#0a182b';c.fillRect(xx,s.y+12,5,39);
  for(let i=0;i<37;i++){c.fillStyle='#152c43';c.fillRect(xx+(side===-1?i:-i),s.y+47-i,6,5);c.fillStyle='#42617a';c.fillRect(xx+(side===-1?i:-i),s.y+47-i,2,2);}
 }
}
