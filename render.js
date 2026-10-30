import {WIDTH,HEIGHT,WORLD,rooms,MAX_HEALTH} from './engine.js?v=0.3.0';
import {rect,text,heart,headline} from './pixel.js?v=0.3.0';
import {cats,creatures,sprite} from './assets.js?v=0.3.0';
import {abilityNames} from './boss.js?v=0.3.0';
const HUD='#030a1e',CREAM='#ffe5a4',CYAN='#9ce7fa';
function title(c){headline(c,'ДЕРЖИ УХО ВОСТРО',12,14);text(c,'НОЧНАЯ СМЕНА',13,35,'#265f86',2);text(c,'НОЧНАЯ СМЕНА',12,34,CYAN,2);}
export function drawControls(canvas){const c=canvas.getContext('2d');rect(c,0,0,768,32,HUD);
 const key=(x,label,w=30)=>{rect(c,x,2,w,25,'#7d91b6');rect(c,x+2,4,w-4,21,'#101c38');text(c,label,x+7,8,'#c1d8ee',2);};
 key(14,'');key(51,''); // Arrow shapes are deliberately drawn with square pixels.
 const arrow=['00011000','00111000','01111111','11111111','01111111','00111000','00011000'];
 for(const [x,flip] of [[29,false],[66,true]])for(let y=0;y<7;y++)for(let i=0;i<8;i++)if(arrow[y][i]==='1')rect(c,x+((flip?7-i:i)-4)*2,7+y*2,2,2,'#c1d8ee');
 text(c,'БЕГ',89,11,'#c1d8ee',2);
 key(157,'');const up=['0001000','0011100','0111110','1111111','0001000','0001000','0001000'];for(let y=0;y<7;y++)for(let x=0;x<7;x++)if(up[y][x]==='1')rect(c,165+x*2,7+y*2,2,2,'#c1d8ee');text(c,'ПРЫЖОК',198,11,'#c1d8ee',2);
 key(330,'ШИФТ',62);text(c,'РЫВОК',406,11,'#c1d8ee',2);
 key(607,'ПРОБЕЛ',86);text(c,'-',700,13,'#c1d8ee');text(c,'ЛАПА',711,11,'#c1d8ee',2);
}
export class Renderer{
 constructor(canvas,assets){this.c=canvas.getContext('2d');this.c.imageSmoothingEnabled=false;this.assets=assets;this.particles=[];this.trail=[];this.trailTimer=0;}
 burst(x,y,color){for(let i=0;i<14;i++)this.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-Math.random()*140,life:.5,color});}
 draw(g,dt=0){
  const c=this.c,a=this.assets,t=g.time,p=g.player,b=g.boss,cam=Math.round(g.camera);
  c.clearRect(0,0,WIDTH,HEIGHT);c.save();c.translate(-cam,0);
  for(const [i,room] of rooms.entries()){
   if(room.x+WIDTH<cam||room.x>cam+WIDTH)continue;
   c.drawImage(i===1?a.archive:a.room,room.x,0,WIDTH,512);
   if(i===2)rect(c,room.x,48,WIDTH,432,'#5a1c7918');
   if(i>0){rect(c,room.x,48,3,426,'#051024');rect(c,room.x+3,48,2,426,'#47627a');}
  }
  for(const relay of g.relays){
   const x=relay.room*WIDTH;
   if(relay.hp>0){
    rect(c,x+630,140,98,81,'#12364bcb');text(c,'РЕТРАНСЛЯТОР',x+639,153,'#a5e9ff');if(g.enemies.some(e=>e.room===relay.room&&e.guardian&&!e.dead))text(c,'ПОБЕДИ СТРАЖА',x+638,204,'#ffdd91');
    for(let i=0;i<relay.hp;i++)rect(c,x+642+i*23,176,15,18,relay.inv>0?'#fff1c9':'#70cadd');
    const gate=x+WIDTH-12;rect(c,gate,48,7,426,'#132c47');
    for(let y=50;y<474;y+=14)rect(c,gate+1,y,5,8,Math.sin(t*4)>0?'#71d2e7':'#397fa4');
   }else{rect(c,x+628,142,100,78,'#0c4158');text(c,'СИГНАЛ СНЯТ',x+644,173,'#b8f5c9');}
  }
  const bx=WIDTH*2;if(b.active){rect(c,bx+300,48,3,426,'#a7a3ff70');}
  if(b.hp>0){
   sprite(c,a.noise,creatures.boss,bx+543,53+Math.round(Math.sin(t*2)*3),221,205);
   if(b.active&&b.state==='recover')rect(c,b.x,245,b.w-20,7,'#a8ffc2');
   if(b.active&&b.state!=='recover'){c.strokeStyle='#91dfff';c.lineWidth=2;c.strokeRect(bx+620,123,115,127);}
   if(b.cooldown>0){c.globalAlpha=.35;rect(c,bx+619,125,114,124,'#d9ffff');c.globalAlpha=1;}
   if(b.active&&b.state==='windup'){
    if(b.ability==='rain')for(const x of b.targets){rect(c,x-13,80,26,394,'#ffb95b22');for(let y=85;y<470;y+=20)rect(c,x-1,y,2,9,'#ffd483');}
    if(b.ability==='wave'){rect(c,bx+300,263,430,12,'#ffb95b55');for(let x=bx+320;x<bx+720;x+=30)text(c,'!',x,250,'#ffda89',2);}
    if(b.ability==='volley'){c.strokeStyle='#f4bc66';c.setLineDash([4,7]);c.beginPath();c.moveTo(b.x,220);c.lineTo(b.aim.x,b.aim.y);c.stroke();c.setLineDash([]);}
    if(b.ability==='summon')for(const x of [bx+380,bx+550]){c.strokeStyle='#d5a4ff';c.lineWidth=3;c.strokeRect(x-4,x===bx+380?275:250,50,23);}
   }
  }else{rect(c,bx+627,131,102,110,'#0c4158');text(c,'ТИШИНА',bx+643,181,'#b8f5c9');}
  for(const f of g.fishes)if(!f.taken&&f.x>cam-20&&f.x<cam+WIDTH+20)sprite(c,a.noise,creatures.fish,f.x-13,f.y+Math.sin(t*3+f.x)*2-8,26,16);
  for(const e of g.enemies)if(!e.dead&&e.x>cam-110&&e.x<cam+WIDTH+60){
   if(e.inv>0&&Math.floor(t*20)%2===0)c.globalAlpha=.45;
   if(e.flying)sprite(c,a.noise,creatures.flyer,e.x-24,e.y-22,100,84,e.dir>0);
   else sprite(c,a.noise,creatures.crawler,e.x-19,e.y-19+Math.round(Math.sin(t*9)),88,49,e.dir>0);
   c.globalAlpha=1;
   rect(c,e.x+3,e.y-25,42,3,'#12203b');rect(c,e.x+3,e.y-25,42*e.hp/e.maxHp,3,e.guardian?'#ffcf77':e.armor?'#9bdfff':'#fc7b88');
   if(e.guardian)text(c,'!',e.x+38,e.y-38,'#ffcf77');
   if(e.armor){c.fillStyle='#86d7fc';c.beginPath();const x=e.dir<0?e.x-7:e.x+47;c.moveTo(x,e.y+4);c.lineTo(x+9,e.y+8);c.lineTo(x+7,e.y+22);c.lineTo(x+2,e.y+25);c.lineTo(x-3,e.y+15);c.fill();}
   if(e.state==='windup')text(c,'!',e.x+19,e.y-43,'#ffcf79',2);
   if(e.state==='lunge')for(let i=1;i<4;i++)rect(c,e.x-e.dir*i*10,e.y+20,6,2,'#f5a980');
  }
  for(const bolt of g.bolts){
   if(bolt.kind==='wave'){for(let i=0;i<5;i++)rect(c,bolt.x+i*6,bolt.y+(i%2)*3,5,bolt.h,'#b5efff');continue;}
   c.save();c.translate(Math.round(bolt.x+8),Math.round(bolt.y+6));c.rotate(Math.sin(t*8)*.2);
   rect(c,-9,-7,18,bolt.kind==='rain'?24:14,bolt.friendly?'#a4edff':'#ddd3c3');for(let j=0;j<3;j++)rect(c,-6,-4+j*4,11,2,'#697895');c.restore();
  }
  if((!p.grounded&&Math.abs(p.vx)>0||p.dash>0)&&g.mode==='playing'){
   this.trailTimer+=dt;if(this.trailTimer>.025){this.trailTimer=0;this.trail.push({x:p.x+9,y:p.y+34,life:.3,dash:p.dash>0});}
  }
  for(const trail of this.trail){trail.life-=dt;c.globalAlpha=Math.max(0,trail.life/.3);rect(c,trail.x,trail.y,trail.dash?12:3,3,trail.dash?'#72dffe':'#ccd3ff');}c.globalAlpha=1;this.trail=this.trail.filter(v=>v.life>0);
  if(p.inv===0||Math.floor(t*12)%2===0){
   const pose=p.attack>0?4:!p.grounded&&!p.climbing?3:Math.abs(p.vx)>0?1+Math.floor(t*10)%2:0;
   const {box,anchor}=cats[pose],w=Math.round(box[2]*.195),h=Math.round(box[3]*.195),center=p.x+p.w/2;
   sprite(c,a.uma,box,p.dir>0?center-w*anchor:center-w*(1-anchor),p.y+p.h-h,w,h,p.dir<0);
  }
  if(p.attack>.04){c.save();c.translate(Math.round(p.x+17+p.dir*36),Math.round(p.y+24));if(p.dir<0)c.scale(-1,1);for(let i=0;i<3;i++){rect(c,10+i*2,-13+i*8,3,10,'#ffe6a7');rect(c,6+i*2,-15+i*8,4,2,'#ffe6a7');}c.restore();}
  for(const q of this.particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=160*dt;rect(c,q.x,q.y,3,3,q.color);}this.particles=this.particles.filter(q=>q.life>0);
  for(let i=1;i<=g.checkpoint;i++){rect(c,WIDTH*i+28,281,3,22,'#accfc7');rect(c,WIDTH*i+31,281,18,10,'#60bd9b');}
  c.restore();
  rect(c,0,0,WIDTH,48,HUD);title(c);
  c.save();c.scale(2,2);for(let i=0;i<MAX_HEALTH;i++)heart(c,169+i*12,10,i<g.lives);c.restore();
  sprite(c,a.noise,creatures.fish,431,17,31,19);text(c,String(g.fish).padStart(2,'0'),474,17,CREAM,3,1);
  const s=Math.ceil(g.clock);text(c,`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`,627,16,CREAM,3,1);
  rect(c,9,54,260,27,'#030a1ee0');text(c,`${g.room+1}/3 ${rooms[g.room].name}`,15,58,CYAN);text(c,`СИГНАЛЫ ${g.relays.filter(r=>r.hp===0).length}/2`,15,70,CREAM);
  if(b.active&&b.hp>0){rect(c,296,54,434,28,'#030a1ee0');text(c,`ЭФИРНЫЙ ШУМ / ФАЗА ${b.phase}`,303,58,'#ffbfc4');rect(c,303,69,414,4,'#30364c');rect(c,303,69,414*b.hp/b.maxHp,4,'#ff6e85');text(c,b.state==='windup'?abilityNames[b.ability]:b.state==='recover'?'УЯЗВИМ: БЕЙ ПАНЕЛЬ ЛАПОЙ!':'ЩИТ',303,78,b.state==='recover'?'#a9efbf':'#ffe2a8');}
  rect(c,12,468,200,3,'#10253c');rect(c,12,468,p.x/WORLD*200,3,CYAN);for(let i=1;i<3;i++)rect(c,12+200*i/3,467,1,5,'#749ab3');
  rect(c,620,465,112,11,'#06152ae0');text(c,'РЫВОК',625,467,p.dashCooldown>0?'#5a718f':'#a8e3e9');rect(c,668,469,57*(1-p.dashCooldown/1.5),2,'#8ae5f4');
 }
}
