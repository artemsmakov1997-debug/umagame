import {WIDTH,HEIGHT} from './engine.js?v=0.2.0';
import {rect,text,heart,headline} from './pixel.js?v=0.2.0';
import {cats,creatures,sprite} from './assets.js?v=0.2.0';
const HUD='#030a1e',CREAM='#ffe5a4',CYAN='#9ce7fa';
function title(c){headline(c,'ДЕРЖИ УХО ВОСТРО',12,14);text(c,'НОЧНАЯ СМЕНА',13,35,'#265f86',2);text(c,'НОЧНАЯ СМЕНА',12,34,CYAN,2);}
export function drawControls(canvas){const c=canvas.getContext('2d');rect(c,0,0,768,32,HUD);
 const key=(x,label,w=30)=>{rect(c,x,2,w,25,'#7d91b6');rect(c,x+2,4,w-4,21,'#101c38');text(c,label,x+7,8,'#c1d8ee',2);};
 key(14,'');key(51,''); // Arrow shapes are deliberately drawn with square pixels.
 const arrow=['00011000','00111000','01111111','11111111','01111111','00111000','00011000'];
 for(const [x,flip] of [[29,false],[66,true]])for(let y=0;y<7;y++)for(let i=0;i<8;i++)if(arrow[y][i]==='1')rect(c,x+((flip?7-i:i)-4)*2,7+y*2,2,2,'#c1d8ee');
 text(c,'БЕГ',89,11,'#c1d8ee',2);
 key(157,'');const up=['0001000','0011100','0111110','1111111','0001000','0001000','0001000'];for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(up[y][x]==='1')rect(c,165+x*2,7+y*2,2,2,'#c1d8ee');text(c,'ПРЫЖОК',198,11,'#c1d8ee',2);
 key(607,'ПРОБЕЛ',86);text(c,'-',700,13,'#c1d8ee');text(c,'ЛАПА',711,11,'#c1d8ee',2);
}
export class Renderer{
 constructor(canvas,assets){this.c=canvas.getContext('2d');this.c.imageSmoothingEnabled=false;this.assets=assets;this.particles=[];this.trail=[];this.trailTimer=0;}
 burst(x,y,color){for(let i=0;i<14;i++)this.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-Math.random()*140,life:.5,color});}
 draw(g,dt=0){const c=this.c,a=this.assets,t=g.time,p=g.player,b=g.boss;
 c.clearRect(0,0,WIDTH,HEIGHT);c.drawImage(a.room,0,0,WIDTH,512);
 // Fireflies and individual pixel sparks add motion without obscuring the painted level.
 for(let i=0;i<16;i++){const x=(i*137+Math.sin(t*.3+i)*7)%WIDTH,y=65+(i*43)%170;if(Math.sin(t+i*2)>.4)rect(c,x,y,1,1,'#8bc6ff');}
 // The source monitor and its monster are separate: defeating it removes the monster.
 if(b.hp>0){
  sprite(c,a.noise,creatures.boss,543,53+Math.round(Math.sin(t*2)*3),221,205);
  if(b.cooldown>.35){c.globalAlpha=.3;rect(c,619,125,114,124,'#d9ffff');c.globalAlpha=1;}
  if(p.x>485){rect(c,615,65,118,4,'#15243c');rect(c,615,65,118*b.hp/5,4,'#fa5f70');}
 }else{
  rect(c,627,131,102,110,'#0c4158');text(c,'ТИШИНА',643,181,'#b8f5c9',1);
 }
 for(const f of g.fishes)if(!f.taken){const y=f.y+Math.sin(t*3+f.x)*2;sprite(c,a.noise,creatures.fish,f.x-13,y-8,26,16);}
 for(const e of g.enemies)if(!e.dead){
  if(e.flying)sprite(c,a.noise,creatures.flyer,e.x-24,e.y-22,100,84,e.dir>0);
  else sprite(c,a.noise,creatures.crawler,e.x-19,e.y-19+Math.round(Math.sin(t*9)*.8),88,49,e.dir>0);
 }
 for(const bolt of g.bolts){c.save();c.translate(Math.round(bolt.x+8),Math.round(bolt.y+6));c.rotate(Math.sin(t*8)*.2);rect(c,-9,-7,18,14,'#ddd3c3');for(let j=0;j<3;j++)rect(c,-6,-4+j*4,11,2,'#697895');c.restore();}
 if(!p.grounded&&Math.abs(p.vx)>0&&g.mode==='playing'){
  this.trailTimer+=dt;if(this.trailTimer>.035){this.trailTimer=0;this.trail.push({x:p.x+9,y:p.y+34,life:.3});}
 }
 for(const trail of this.trail){trail.life-=dt;c.globalAlpha=Math.max(0,trail.life/.3);rect(c,trail.x,trail.y,3,3,'#ccd3ff');}c.globalAlpha=1;this.trail=this.trail.filter(v=>v.life>0);
 if(p.inv===0||Math.floor(t*12)%2===0){
  let pose=p.attack>0?4:!p.grounded&&!p.climbing?3:Math.abs(p.vx)>0?1+Math.floor(t*10)%2:0;
  const {box,anchor}=cats[pose],w=Math.round(box[2]*.195),h=Math.round(box[3]*.195);
  const center=p.x+p.w/2;const x=p.dir>0?center-w*anchor:center-w*(1-anchor);
  sprite(c,a.uma,box,x,p.y+p.h-h,w,h,p.dir<0);
 }
 if(p.attack>.07){c.save();c.translate(Math.round(p.x+17+p.dir*36),Math.round(p.y+24));if(p.dir<0)c.scale(-1,1);for(let i=0;i<3;i++){rect(c,10+i*2,-13+i*8,3,10,'#ffe6a7');rect(c,6+i*2,-15+i*8,4,2,'#ffe6a7');}c.restore();}
 for(const q of this.particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=160*dt;rect(c,q.x,q.y,3,3,q.color);}this.particles=this.particles.filter(q=>q.life>0);
 if(g.checkpoint){rect(c,308,303,3,6,'#a9e6ce');rect(c,311,303,11,5,'#39746b');}
 // Bold, compact HUD follows the approved reference; no outer app chrome.
 rect(c,0,0,WIDTH,48,HUD);title(c);
 c.save();c.scale(3,3);for(let i=0;i<3;i++)heart(c,111+i*9,6,i<g.lives);c.restore();
 sprite(c,a.noise,creatures.fish,431,17,31,19);text(c,String(g.fish).padStart(2,'0'),474,17,CREAM,3,1);
 const s=Math.ceil(g.clock);text(c,`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`,627,16,CREAM,3,1);
 }
}
