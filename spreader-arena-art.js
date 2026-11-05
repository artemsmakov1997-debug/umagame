import {rooms} from './level.js?v=0.21.5';
export function drawSpreaderEquipment(c,a,g,time){
 if(g.room!==2)return;const x=rooms[2].x,art=a.spreaderFeeders,sw=art.width/3,sh=art.height/2,frame=Math.floor(time*5)%3;
 c.drawImage(art,frame*sw+100,30,350,450,x+62,-5,110,141);
 c.drawImage(art,frame*sw+100,sh+30,350,450,x+708,128,105,135);
 // Pixel steel braces support the actual collision surfaces, without filled wedges.
 for(const s of g.platforms.filter(p=>p.room===2&&p.index!==0))for(const side of s.w>180?[-1,1]:[-1]){
  const xx=side===-1?s.x+10:s.x+s.w-14;
  c.fillStyle='#0a182b';c.fillRect(xx,s.y+12,5,39);
  for(let i=0;i<37;i++){c.fillStyle='#152c43';c.fillRect(xx+(side===-1?i:-i),s.y+47-i,6,5);c.fillStyle='#42617a';c.fillRect(xx+(side===-1?i:-i),s.y+47-i,2,2);}
 }
}
