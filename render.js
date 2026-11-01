import {WIDTH,HEIGHT,rooms,platforms,ladders,FINAL_X} from './engine.js?v=0.9.0';
import {rect,text} from './pixel.js?v=0.9.0';
import {cats,creatures,sprite} from './assets.js?v=0.9.0';
import {drawMonster,drawLure,drawSoup} from './art.js?v=0.9.0';
import {drawHud} from './hud.js?v=0.9.0';
import {sceneLayers,drawSurface,drawAmbience,drawCampaignObjects,drawWakeup,drawInfection,drawEpilogue,backgroundLayers,drawBackdrop,drawOpening,roomDarkness} from './campaign-art.js?v=0.9.0';
import {drawEmotion,hurtPose,drawTraversal} from './cat-animation.js?v=0.9.0';
const HUD='#030a1e',CREAM='#ffe5a4',CYAN='#9ce7fa';
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
 constructor(canvas,assets){this.c=canvas.getContext('2d');this.c.imageSmoothingEnabled=false;this.assets=assets;this.particles=[];this.trail=[];this.trailTimer=0;this.layers=sceneLayers(assets);this.backdrops=backgroundLayers(this.layers);this.wakeupStart=null;}
 burst(x,y,color){for(let i=0;i<14;i++)this.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-Math.random()*140,life:.5,color});}
 draw(g,dt=0,visualTime=g.time){
  const c=this.c,a=this.assets,bounds=c.canvas.getBoundingClientRect(),vw=Math.max(240,Math.round(HEIGHT*bounds.width/Math.max(1,bounds.height)));
  if(c.canvas.width!==vw)c.canvas.width=vw;if(c.canvas.height!==HEIGHT)c.canvas.height=HEIGHT;
  if(g.viewWidth!==vw){g.viewWidth=vw;g.updateCamera();}
  const t=g.time,p=g.player,b=g.boss,cam=Math.round(g.camera),opening=g.room===0&&(g.mode==='waking'||g.pausedFrom==='waking'||g.dialogue?.id==='intro');
  if(g.dialogue?.id==='ending'||g.mode==='won'||g.pausedFrom==='won'){c.imageSmoothingEnabled=false;drawEpilogue(c,a,visualTime,vw);return;}
  c.imageSmoothingEnabled=false;c.clearRect(0,0,vw,HEIGHT);c.save();c.translate(-cam,0);
  for(const [i,room] of rooms.entries()){
   if(room.x+WIDTH+150<cam||room.x-150>cam+vw)continue;
   drawBackdrop(c,this.backdrops[i],room,cam,roomDarkness(g.wakeTime));drawAmbience(c,room,t);
  }
  if(cam<WIDTH+150)drawOpening(c,a,g);
  c.save();if(opening)c.globalAlpha=roomDarkness(g.wakeTime);
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
  drawInfection(c,g);c.restore();
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
  for(const f of g.fishes)if(!opening&&!f.taken&&f.x>cam-20&&f.x<cam+vw+20)sprite(c,a.noise,creatures.fish,f.x-13,f.y+Math.sin(t*3+f.x)*2-8,26,16);
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
   const {box,anchor}=cats[pose],progress=g.swallow?1-Math.pow(g.swallow.timer/g.swallow.total,3):0,scale=g.swallow?Math.max(0,1-progress*1.18):1;
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
  drawHud(c,a,g,vw);
  if(g.mode==='respawning'||g.pausedFrom==='respawning'){
   const progress=1-g.respawnTime/1.1;c.globalAlpha=Math.max(0,(progress-.25)/.75)*.86;rect(c,0,47,vw,HEIGHT-47,'#030a1e');c.globalAlpha=1;
  }
 }
}
