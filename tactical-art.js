import {drawPixelBarrier} from './shield-art.js?v=0.22.0';
import {rect,text} from './pixel.js?v=0.22.0';
import {scanArea} from './tactical-enemies.js?v=0.22.0';
export function drawTacticalTerrain(c,g,time){
 for(const ink of g.inks){
  if(ink.room!==g.room)continue;const s=g.platforms.find(s=>s.id===ink.platformId);if(!s)continue;const x=s.x+ink.localX,y=s.y;
  c.save();c.globalAlpha=Math.min(1,ink.time/1.1);
  rect(c,x,y-3,ink.w,5,'#0a0421');rect(c,x+3,y-4,ink.w-6,3,'#572682');
  for(let i=0;i<ink.w-4;i+=11){const bob=Math.sin(time*3+i)*1.5;rect(c,x+i,y-5-bob,6,3,'#9852c6');rect(c,x+i+3,y+1,3,4+i%4,'#311047');}
  c.restore();
 }
 for(const cut of g.cuts){
  if(cut.room!==g.room)continue;const s=g.platforms.find(s=>s.id===cut.platformId);if(!s)continue;const x=s.x+cut.localX,y=s.y;
  if(cut.phase==='warning'){
   const pulse=Math.floor(time*7)%2;c.save();c.globalAlpha=pulse?.9:.55;rect(c,x,y-5,cut.w,3,'#ed7464');
   for(let xx=x;xx<x+cut.w;xx+=11)rect(c,xx,y+15,6,2,'#ffb68b');
   for(const xx of [x,x+cut.w])for(let yy=y-5;yy<y+17;yy+=7)rect(c,xx,yy,2,4,'#ff897c');
   text(c,'!',x+cut.w/2-2,y-23,'#ffdf9c',2);c.restore();
  }else{
   for(const xx of [x-2,x+cut.w]){rect(c,xx,y-4,2,17,'#fa998e');rect(c,xx-1,y+2,3,3,'#fce6c8');}
   if(cut.time<.7)for(let xx=x;xx<x+cut.w;xx+=9)rect(c,xx,y-2,5,2,'#86e8e577');
  }
 }
 for(const e of g.enemies){
  if(!e.active||e.dead||e.room!==g.room||e.type!=='copier')continue;
  const area=scanArea(g,e);if(!area)continue;const active=['windup','printing'].includes(e.state);
  rect(c,area.x,area.y+area.h-4,area.w,2,active?'#8fe9f1':'#476e8a');
  for(const x of [area.x,area.x+area.w-2])rect(c,x,area.y+area.h-9,2,8,'#76b3bd');
  if(active){
   c.save();c.fillStyle=e.state==='printing'?'#64deff34':'#64deff1c';c.beginPath();c.moveTo(e.x+24,e.y-30);c.lineTo(area.x,area.y+area.h);c.lineTo(area.x+area.w,area.y+area.h);c.closePath();c.fill();
   const scan=area.x+((time*95)%area.w);rect(c,scan,area.y,2,area.h,'#9aeaf0');c.restore();
  }
 }
}
export function drawEnemyDefense(c,e,time){
 if(e.type==='inflator')drawPixelBarrier(c,e.x+e.w/2,e.y-5,50,44,{half:e.dir,alpha:.8,flash:e.guardFlash,time});
 if(e.type==='clickbait'){
  const x=e.x+19,y=e.y-60;rect(c,x,y,10,9,'#b2c4ce');rect(c,x+2,y+2,6,5,'#31546c');rect(c,x+3,y+9,4,2,'#b2c4ce');
 }
 if(e.copyOwnerId){c.save();c.globalAlpha=.55;c.strokeStyle='#92f1fa';c.setLineDash([3,3]);c.strokeRect(e.x-4,e.y-35,e.w+8,e.h+36);c.setLineDash([]);c.restore();}
 if(e.muffled){for(let i=0;i<3;i++)rect(c,e.x+12+i*7,e.y-25+(i%2)*3,5,6,'#6c389e');}
}
