import {WIDTH,HEIGHT,WORLD,rooms,MAX_HEALTH,platforms,ladders,FINAL_X} from './engine.js?v=0.8.0';
import {rect,text,heart} from './pixel.js?v=0.8.0';
import {cats,creatures,sprite} from './assets.js?v=0.8.0';
import {drawMonster,drawLure,drawSoup} from './art.js?v=0.8.0';
import {abilityNames} from './boss.js?v=0.8.0';
import {sceneLayers,drawSurface,drawAmbience,drawCampaignObjects,drawWakeup,drawInfection,drawEpilogue,drawRoomJoin} from './campaign-art.js?v=0.8.0';
import {drawEmotion,hurtPose,drawTraversal} from './cat-animation.js?v=0.8.0';
const HUD='#030a1e',CREAM='#ffe5a4',CYAN='#9ce7fa';
function title(c){text(c,'УМА ПРОТИВ ИНФОШУМА',12,10,CREAM,2,1);rect(c,10,28,203,18,'#176185');rect(c,11,29,201,16,HUD);text(c,'ДЕРЖИ УХО ВОСТРО',15,30,CYAN,2);}
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
 constructor(canvas,assets){this.c=canvas.getContext('2d');this.c.imageSmoothingEnabled=false;this.assets=assets;this.particles=[];this.trail=[];this.trailTimer=0;this.layers=sceneLayers(assets);this.wakeupStart=null;}
 burst(x,y,color){for(let i=0;i<14;i++)this.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-Math.random()*140,life:.5,color});}
 draw(g,dt=0,visualTime=g.time){
  const c=this.c,a=this.assets,bounds=c.canvas.getBoundingClientRect(),vw=Math.max(240,Math.round(HEIGHT*bounds.width/Math.max(1,bounds.height)));
  if(c.canvas.width!==vw)c.canvas.width=vw;if(c.canvas.height!==HEIGHT)c.canvas.height=HEIGHT;
  if(g.viewWidth!==vw){g.viewWidth=vw;g.updateCamera();}
  const t=g.time,p=g.player,b=g.boss,cam=Math.round(g.camera);
  if(g.dialogue?.id==='ending'||g.mode==='won'||g.pausedFrom==='won'){c.imageSmoothingEnabled=false;drawEpilogue(c,a,visualTime,vw);return;}
  c.imageSmoothingEnabled=false;c.clearRect(0,0,vw,HEIGHT);c.save();c.translate(-cam,0);
  for(const [i,room] of rooms.entries()){
   if(room.x+WIDTH<cam||room.x>cam+vw)continue;
   c.drawImage(this.layers[i],room.x,0);drawAmbience(c,room,t);
  }
  for(let i=1;i<rooms.length;i++)if(i*WIDTH>cam-60&&i*WIDTH<cam+vw+60)drawRoomJoin(c,this.layers,i);
  // Restore only playable tabletop strips, then give every collision surface a bright edge.
  for(const platform of platforms){
   if(platform.x+platform.w<cam||platform.x>cam+vw)continue;
   drawSurface(c,a,platform,t);
  }
  for(const ladder of ladders){
   if(ladder.x<cam-40||ladder.x>cam+vw)continue;
   rect(c,ladder.x-1,ladder.y+9,ladder.w+2,ladder.h-9,'#050e1e');
   for(const x of [ladder.x,ladder.x+ladder.w-3])rect(c,x,ladder.y+9,3,ladder.h-9,'#b6c8c9');
   for(let y=ladder.y+20;y<ladder.y+ladder.h;y+=19){rect(c,ladder.x+3,y,ladder.w-6,3,'#91bdcc');rect(c,ladder.x+3,y+3,ladder.w-6,2,'#415b6c');}
  }
  drawCampaignObjects(c,a,g,t);
  drawInfection(c,g);
  const bx=FINAL_X;if(b.active){rect(c,bx+300,48,3,426,'#a7a3ff70');}
  if(b.hp>0){
   drawMonster(c,a,'infoshum',bx+543,53,221,205,t,false,b);
   if(b.active&&b.state==='recover')rect(c,b.x,245,b.w-20,7,'#a8ffc2');
   if(b.active&&b.state!=='recover'){c.strokeStyle='#91dfff';c.lineWidth=2;c.strokeRect(bx+620,123,115,127);}
   if(b.cooldown>0){c.globalAlpha=.35;rect(c,bx+619,125,114,124,'#d9ffff');c.globalAlpha=1;}
   if(b.active&&b.state==='windup'){
    if(b.ability==='rain')for(const x of b.targets){rect(c,x-13,80,26,394,'#ffb95b22');for(let y=85;y<470;y+=20)rect(c,x-1,y,2,9,'#ffd483');}
    if(b.ability==='wave'){rect(c,bx+300,263,430,12,'#ffb95b55');for(let x=bx+320;x<bx+720;x+=30)text(c,'!',x,250,'#ffda89',2);}
    if(b.ability==='volley'){c.strokeStyle='#f4bc66';c.setLineDash([4,7]);c.beginPath();c.moveTo(b.x,220);c.lineTo(b.aim.x,b.aim.y);c.stroke();c.setLineDash([]);}
    if(b.ability==='summon')for(const x of [bx+380,bx+550]){c.strokeStyle='#d5a4ff';c.lineWidth=3;c.strokeRect(x-4,x===bx+380?275:250,50,23);}
   }
  }else{rect(c,bx+627,131,102,110,'#0c4158');text(c,'ЖУРНАЛ',bx+649,143,'#b8f5c9');text(c,'ПРОСМОТРЫ 999',bx+636,165,'#ffe0a4');text(c,'РЕАКЦИИ 999',bx+636,183,'#ffe0a4');text(c,'ПРОВЕРКА ВЫКЛ',bx+633,214,'#ff8193');}
  for(const f of g.fishes)if(!f.taken&&f.x>cam-20&&f.x<cam+vw+20)sprite(c,a.noise,creatures.fish,f.x-13,f.y+Math.sin(t*3+f.x)*2-8,26,16);
  for(const soup of g.soups)if(!soup.taken){drawSoup(c,a,soup.x,soup.y+Math.sin(t*2.6)*2,32);for(let i=0;i<3;i++)rect(c,soup.x-13+i*12,soup.y-20-Math.sin(t*3+i)*4,2,2,'#ffde8a');}
  for(const e of g.enemies)if(e.active&&(!e.dead||e.deathTime>0)&&e.x>cam-140&&e.x<cam+vw+140){
   if(e.type==='clickbait'&&!e.revealed){drawLure(c,a,e.x+24,e.y+8,t);continue;}
   if(e.spawnTime>0){c.globalAlpha=1-e.spawnTime/.6;for(let i=0;i<8;i++)rect(c,e.x+i*6,e.y+29,3,2,'#83ccf2');}
   else if(e.dead)c.globalAlpha=e.deathTime/.28;else if(e.inv>0&&Math.floor(t*20)%2===0)c.globalAlpha=.7;
   if(e.type==='fakenews'){const scale=e.pressureTime>0?1.25:1;drawMonster(c,a,e.type,e.x+24-38*scale,e.y+29-72*scale,76*scale,72*scale,t,e.dir<0,e);}
   if(e.type==='informant'){
    drawMonster(c,a,e.type,e.x-18,e.y-56,84,85,t,e.dir<0,e);
    if(e.state==='windup'&&e.aim){c.strokeStyle='#d2a6ff';c.setLineDash([3,5]);c.beginPath();c.moveTo(e.x+24,e.y-6);c.lineTo(e.aim.x,e.aim.y);c.stroke();c.setLineDash([]);rect(c,e.aim.x-3,e.aim.y-3,6,6,'#b28ce577');}
    if(['windup','casting'].includes(e.state)&&e.shieldBroken===0){c.strokeStyle='#ac92ff';c.lineWidth=2;c.strokeRect(e.x-8,e.y-42,64,70);}
   }
   if(e.type==='inflator')drawMonster(c,a,e.type,e.x-18,e.y-46,89,76,t,e.dir<0,e);
   if(e.type==='panicker')drawMonster(c,a,e.type,e.x-9,e.y-35,67,65,t,false,e);
   if(e.type==='clickbait')drawMonster(c,a,e.type,e.x-35,e.y-79,112,108,t,e.dir>0,e);
   c.globalAlpha=1;if(e.dead||e.spawnTime>0)continue;
   rect(c,e.x+3,e.y-60,42,3,'#12203b');rect(c,e.x+3,e.y-60,42*Math.max(0,e.hp)/e.maxHp,3,e.guardian?'#ffcf77':'#fc7b88');
   if(e.guardian)text(c,'!',e.x+38,e.y-72,'#ffcf77');if(e.state==='windup')text(c,'!',e.x+19,e.y-78,'#ffcf79',2);
   if(e.type==='inflator'&&['windup','blast'].includes(e.state)){
    const start=e.dir>0?e.x+40:e.x-300;if(e.state==='windup'){for(let x=start;x<start+300;x+=14)rect(c,x,e.y+13,6,1,'#e7ad63');}
    else for(let wave=0;wave<3;wave++)for(let yy=-17;yy<=17;yy+=3){const dx=Math.round(Math.sqrt(17*17-yy*yy)*.65),dist=35+wave*75+(t*125)%50;rect(c,e.x+24+e.dir*(dist+dx),e.y+13+yy,3,3,'#98eaff');}
   }
   if(e.type==='panicker'&&['windup','alarm'].includes(e.state)){const radius=e.state==='alarm'?35+(t*70)%90:35;for(let i=0;i<12;i++){const angle=i*Math.PI/6;rect(c,e.x+24+Math.cos(angle)*radius,e.y-9+Math.sin(angle)*radius,3,5,'#ffb777');}}
  }
  for(const bolt of g.bolts){
   if(bolt.kind==='wave'){for(let i=0;i<5;i++)rect(c,bolt.x+i*6,bolt.y+(i%2)*3,5,bolt.h,'#b5efff');continue;}
   if(bolt.kind==='packet'){rect(c,bolt.x,bolt.y,16,12,bolt.friendly?'#b7ffe4':'#67ddff');rect(c,bolt.x+2,bolt.y+2,12,8,'#153a69');for(let i=0;i<6;i++)rect(c,bolt.x+2+i*2,bolt.y+2+Math.min(i,5-i),2,1,'#b6eeff');continue;}
   c.save();c.translate(Math.round(bolt.x+8),Math.round(bolt.y+6));c.rotate(Math.sin(t*8)*.2);
   rect(c,-9,-7,18,bolt.kind==='rain'?24:14,bolt.friendly?'#a4edff':'#ddd3c3');for(let j=0;j<3;j++)rect(c,-6,-4+j*4,11,2,'#697895');c.restore();
  }
  if((!p.grounded&&Math.abs(p.vx)>0||p.dash>0)&&g.mode==='playing'){
   this.trailTimer+=dt;if(this.trailTimer>.025){this.trailTimer=0;this.trail.push({x:p.x+9,y:p.y+34,life:.3,dash:p.dash>0});}
  }
  for(const trail of this.trail){trail.life-=dt;c.globalAlpha=Math.max(0,trail.life/.3);rect(c,trail.x,trail.y,trail.dash?12:3,3,trail.dash?'#72dffe':'#ccd3ff');}c.globalAlpha=1;this.trail=this.trail.filter(v=>v.life>0);
  if(g.storyEnabled&&!g.seenScenes.has('intro')||g.dialogue?.id==='intro'){
   drawWakeup(c,a,p,g.wakeTime);
  }else if(p.hurtTime>0){
   drawEmotion(c,a,hurtPose(p.hurtTime),p.x+p.w/2,p.y+p.h,76,p.dir>0);
  }else if((p.climbing||p.sneaking)&&drawTraversal(c,a,p)){
   if(p.sneaking)rect(c,p.x+10,p.y-5,14,2,'#a9eac977');
  }else{
   if(p.inv>0&&Math.floor(t*12)%2!==0&&!g.swallow)c.globalAlpha=.6;
   this.wakeupStart=null;
   const pose=p.attack>0?4:!p.grounded&&!p.climbing?3:Math.abs(p.vx)>0?1+Math.floor(t*10)%2:0;
   const {box,anchor}=cats[pose],progress=g.swallow?1-g.swallow.timer/g.swallow.total:0,scale=g.swallow?Math.max(0,1-progress*1.18):1;
   const w=Math.round(box[2]*.195*scale),h=Math.round(box[3]*.195*scale);
   const center=g.swallow?(g.swallow.x+17)*(1-progress)+(g.swallow.targetX+12)*progress:p.x+p.w/2;
   const feet=g.swallow?(g.swallow.y+48)*(1-progress)+(g.swallow.targetY+24)*progress:p.y+p.h;
   if(w>0&&h>0)sprite(c,a.uma,box,p.dir>0?center-w*anchor:center-w*(1-anchor),feet-h,w,h,p.dir<0);
   if(p.powerTime>0)for(let i=0;i<5;i++)rect(c,p.x-13+i*14,p.y-10+Math.sin(t*5+i)*5,2,2,'#ffe6a0');
   c.globalAlpha=1;
  }
  if(p.attack>.04){c.save();c.translate(Math.round(p.x+17+p.dir*36),Math.round(p.y+24));if(p.dir<0)c.scale(-1,1);for(let i=0;i<3;i++){rect(c,10+i*2,-13+i*8,3,10,'#ffe6a7');rect(c,6+i*2,-15+i*8,4,2,'#ffe6a7');}c.restore();}
  for(const q of this.particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=160*dt;rect(c,q.x,q.y,3,3,q.color);}this.particles=this.particles.filter(q=>q.life>0);
  for(let i=1;i<=g.checkpoint;i++){rect(c,WIDTH*i+28,281,3,22,'#accfc7');rect(c,WIDTH*i+31,281,18,10,'#60bd9b');}
  c.restore();
  const compact=vw<600;rect(c,0,0,vw,48,HUD);
  if(compact){
   text(c,'УМА',8,8,CREAM,2);c.save();c.scale(2,2);for(let i=0;i<MAX_HEALTH;i++)heart(c,28+i*9,5,i<g.lives);c.restore();
   sprite(c,a.noise,creatures.fish,8,30,20,12);text(c,String(g.fish).padStart(2,'0'),34,32,CREAM);text(c,`СЛЕДЫ ${g.evidence.length}/5`,82,32,CYAN);
  }else{title(c);c.save();c.scale(2,2);for(let i=0;i<MAX_HEALTH;i++)heart(c,169+i*12,10,i<g.lives);c.restore();sprite(c,a.noise,creatures.fish,431,17,31,19);text(c,String(g.fish).padStart(2,'0'),474,17,CREAM,3,1);}
  const s=Math.ceil(g.clock);if(g.room>0)text(c,`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`,compact?vw-124:vw-165,compact?10:16,CREAM,compact?2:3,compact?0:1);
  rect(c,9,54,Math.min(272,vw-18),31,'#030a1ee0');text(c,`${g.room===0?'0':g.room+'/'+(rooms.length-1)} ${rooms[g.room].name}`,15,58,CYAN);text(c,rooms[g.room].objective,15,72,CREAM);
  if(g.room===0){
   const tasks=g.touchEnabled?['ДЖОЙСТИК ВПРАВО','КНОПКА ПРЫЖКА - ЧЕРЕЗ РАЗРЫВ','ДЖОЙСТИК ВВЕРХ У ЛЕСТНИЦЫ','ГОТОВО! ИДИ В РЕДАКЦИЮ']:['← → / A D - ПРОЙДИ ВПРАВО','↑ / W - ПЕРЕПРЫГНИ РАЗРЫВ','↑ ↓ / W S - ЛЕСТНИЦА','ГОТОВО! ИДИ В РЕДАКЦИЮ'];
   rect(c,9,88,Math.min(vw-18,318),38,'#031022ed');text(c,tasks[g.tutorial.step],16,94,'#ffd38a');
   for(let i=0;i<3;i++){rect(c,17+i*29,110,20,4,g.tutorial.step>i?'#9fe4b7':'#34516a');}
  }
  if(!b.active&&!compact&&g.room>0){rect(c,296,54,168,20,'#030a1ee0');text(c,`СЛЕДЫ СИГНАЛА ${g.evidence.length}/5`,303,60,CYAN);}
  if(b.active&&b.hp>0){const x=compact?9:296,y=compact?88:54,w=compact?vw-18:Math.min(434,vw-310);rect(c,x,y,w,34,'#030a1ee0');text(c,`ИНФОШУМ / ФАЗА ${b.phase}`,x+7,y+4,'#ffbfc4');rect(c,x+7,y+15,w-20,4,'#30364c');rect(c,x+7,y+15,(w-20)*b.hp/b.maxHp,4,'#ff6e85');text(c,b.state==='windup'?abilityNames[b.ability]:b.state==='recover'?'БЕЙ ПАНЕЛЬ ЛАПОЙ!':'ЩИТ',x+7,y+24,b.state==='recover'?'#a9efbf':'#ffe2a8');}
  const progressWidth=Math.min(200,vw*.44);rect(c,12,468,progressWidth,3,'#10253c');rect(c,12,468,p.x/WORLD*progressWidth,3,CYAN);for(let i=1;i<rooms.length;i++)rect(c,12+progressWidth*i/rooms.length,467,1,5,'#749ab3');
  if(p.sneaking){rect(c,9,132,112,16,'#102d35e0');text(c,'ТИХИЕ ЛАПЫ',16,137,'#b4eccb');}
  if(g.transition){const f=g.transition.time/g.transition.duration;c.globalAlpha=Math.sin(Math.PI*f)*.45;rect(c,0,48,vw,HEIGHT-48,'#123552');c.globalAlpha=1;}
  if(p.powerTime>0){const x=compact?vw-113:242;drawSoup(c,a,x,468,15);text(c,`СУПЕР-МУР ${Math.ceil(p.powerTime)}`,x+13,465,'#ffdd98');}
  if(!compact){rect(c,vw-148,465,112,11,'#06152ae0');text(c,'РЫВОК',vw-143,467,p.dashCooldown>0?'#5a718f':'#a8e3e9');rect(c,vw-100,469,57*(1-p.dashCooldown/1.5),2,'#8ae5f4');}
 }
}
