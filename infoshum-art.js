// Pixel-art staging for the final arena. Reuses the game's existing Infoshum sprite atlas.
import {rect} from './pixel.js?v=0.21.5';
import {drawMonster} from './art.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
const cyan='#69e6f5',bright='#b6f9ff',purple='#cf61f2',scarlet='#ff527b';
function line(c,x1,y1,x2,y2,color,width=3){c.save();c.strokeStyle=color;c.lineWidth=width;c.lineCap='square';c.beginPath();c.moveTo(Math.round(x1),Math.round(y1));c.lineTo(Math.round(x2),Math.round(y2));c.stroke();c.restore();}
function pixels(c,x,y,radius,time,col=cyan){
 for(let i=0;i<14;i++){const a=i*2.399+time*.7,dist=radius*(.3+i/18);
  rect(c,Math.round(x+Math.cos(a)*dist),Math.round(y+Math.sin(a)*dist),i%4?3:5,i%3?2:4,i%4===0?bright:col);}
}
function staticNoise(c,m,time){
 const seed=Math.floor(time*10);
 rect(c,m.x+11,m.y+13,m.w-22,m.h-36,'#07192e');
 for(let i=0;i<130;i++){const x=(i*71+seed*(i%4+1)*7)%(m.w-28),y=(i*41+seed*11)%(m.h-43);
  rect(c,m.x+14+x,m.y+17+y,i%4?3:6,i%3?2:3,i%5?'#478ba4':'#8df1ee');}
 for(let j=0;j<7;j++)rect(c,m.x+13,m.y+20+j*15+(seed%3),m.w-26,1,'#0c3657');
}
function chassis(c,m){
 const x=m.x,y=m.y,w=m.w,h=m.h;
 rect(c,x-12,y+19,w+24,h-30,'#10132c');rect(c,x-8,y+12,w+16,h-20,'#22294f');
 rect(c,x,y,w,h-12,'#525b89');rect(c,x+5,y+5,w-10,h-23,'#182b50');
 rect(c,x+11,y+12,w-22,h-36,'#061b35');
 rect(c,x+11,y+9,w-22,4,'#7f9fc5');
 rect(c,x+9,y+h-24,w-18,8,'#334065');
 for(let i=0;i<7;i++)rect(c,x+14+i*10,y+h-22,5,2,i%3===0?'#83eafa':'#738cb3');
 rect(c,x+w/2-45,y-11,90,13,'#26385f');rect(c,x+w/2-39,y-8,78,6,'#3bd5ee');
 rect(c,x+w/2-50,y+h-12,100,15,'#313e68');
 rect(c,x+w/2-40,y+h+3,80,5,'#101d39');
 rect(c,x+3,y+8,4,h-22,'#a6acd1');rect(c,x+w-7,y+8,4,h-22,'#39456d');
 rect(c,x-18,y+31,9,44,'#35436d');rect(c,x+w+9,y+31,9,44,'#35436d');
}
function cracks(c,m,time){
 const x=m.x,y=m.y,w=m.w,h=m.h;
 const shift=Math.sin(time*13)*2;
 line(c,x+w*.14,y+16,x+w*.46+shift,y+h*.52,'#60ddf1',3);
 line(c,x+w*.46+shift,y+h*.52,x+w*.22,y+h-35,'#66c7fa',3);
 line(c,x+w*.46+shift,y+h*.52,x+w*.83,y+h*.17,'#c56df3',3);
 line(c,x+w*.46+shift,y+h*.52,x+w*.77,y+h-38,'#c56df3',3);
 line(c,x+w*.77,y+h-38,x+w*.95,y+h-30,'#69ecf6',2);
}
function wreck(c,m,time,portal=false){
 chassis(c,m);rect(c,m.x+12,m.y+14,m.w-24,m.h-39,'#0b0b23');
 cracks(c,m,time);
 const cx=m.x+m.w/2,cy=m.y+m.h*.51;
 if(portal){
  c.save();c.translate(cx,cy);
  for(let j=0;j<3;j++){c.strokeStyle=j===0?'#31205e':j===1?'#8234d1':'#d96bfc';c.lineWidth=8-j*2;
   c.beginPath();c.ellipse(0,0,m.w*.23+j*5,m.h*.25+j*4,time*.12+j*.5,0,Math.PI*2);c.stroke();}
  c.restore();pixels(c,cx,cy,45,time,purple);
 }else{for(let i=0;i<11;i++){
   const a=i*2.4;rect(c,cx+Math.cos(a)*m.w*.28,cy+Math.sin(a)*m.h*.25,7,4,i%2?'#233b62':'#615484');}}
 rect(c,m.x-13,m.y+m.h-4,12,9,'#392444');rect(c,m.x+m.w+1,m.y+m.h-4,12,9,'#392444');
}
function monitor(c,a,m,active,time,n){
 if(m.state==='broken'){wreck(c,m,time,false);return;}
 if(n.stage==='free'||n.stage==='rupture'){
  wreck(c,m,time,n.stage==='rupture'&&m.state!=='broken');return;
 }
 chassis(c,m);staticNoise(c,m,time);
 if(active){
  c.save();c.beginPath();c.rect(m.x+12,m.y+14,m.w-24,m.h-38);c.clip();
  rect(c,m.x+11,m.y+13,m.w-22,m.h-36,'#07162c');
  for(let i=0;i<9;i++)rect(c,m.x+15,m.y+18+i*12,m.w-30,1,'#145777');
  drawMonster(c,a,'infoshum',m.x-13,m.y-55,m.w+26,m.h+71,time,false,{projection:true,state:n.mode==='charge'?'windup':'idle'});
  c.restore();
  rect(c,m.x+9,m.y+m.h-23,m.w-18,3,'#37e3f1');
 }else if(m.state==='open'){
  rect(c,m.x+11,m.y+13,m.w-22,m.h-36,'#24142f');
  cracks(c,m,time);pixels(c,m.x+m.w/2,m.y+m.h/2,28,time,scarlet);
 }
 if(m.state==='open'){const tint=Math.sin(time*14)>.1?'#ff69ab':'#ffc2e5';
  rect(c,m.x-10,m.y+7,m.w+20,3,tint);rect(c,m.x-10,m.y+m.h-20,m.w+20,3,tint);}
}
function terminal(c,m,time,stage){
 if(stage==='free')return;
 const x=m.terminalX-23,y=m.terminalY,active=m.state==='open',broken=m.state==='broken';
 if(broken){rect(c,x-2,y+18,51,17,'#19152e');rect(c,x+7,y+15,35,3,'#8c537d');return;}
 rect(c,x-6,y+26,58,10,'#11132d');rect(c,x-4,y+3,54,29,'#37416b');
 rect(c,x+2,y+7,42,21,active?'#801a5d':'#191b43');
 rect(c,x+5,y+10,36,15,active?'#fa529f':'#513658');
 const flash=active&&Math.floor(time*9)%2===0;
 const color=flash?'#ffffff':active?'#ffe0e9':'#8d9ca6';
 const points=[[22,0],[16,10],[24,10],[18,23],[32,9],[24,9],[28,0]];
 for(let i=0;i<points.length-1;i++)line(c,x+points[i][0],y+9+points[i][1]*.65,x+points[i+1][0],y+9+points[i+1][1]*.65,color,3);
 if(active){pixels(c,x+23,y+14,26,time,scarlet);for(let i=0;i<3;i++)rect(c,x+10+i*13,y-9-Math.sin(time*5+i)*4,4,3,'#ffe3b5');}
}
function connect(c,a,b,lit,time){
 const x1=a.x+a.w/2,y1=a.y+a.h-7,x2=b.x+b.w/2,y2=b.y+b.h-7;
 c.save();
 c.strokeStyle='#0d1030';c.lineWidth=14;c.beginPath();c.moveTo(x1,y1);c.bezierCurveTo(x1+90,y1+130,x2-90,y2+130,x2,y2);c.stroke();
 c.strokeStyle=lit?'#43bfea':'#503774';c.lineWidth=4;c.beginPath();c.moveTo(x1,y1);c.bezierCurveTo(x1+90,y1+130,x2-90,y2+130,x2,y2);c.stroke();
 for(let i=0;i<12;i++){const t=i/11,omt=1-t,x=omt**3*x1+3*omt**2*t*(x1+90)+3*omt*t*t*(x2-90)+t**3*x2;
 const y=omt**3*y1+3*omt**2*t*(y1+130)+3*omt*t*t*(y2+130)+t**3*y2;
 if((i+Math.floor(time*10))%3===0)rect(c,x,y,4,3,lit?'#b8fbff':'#695493');}
 c.restore();
}
function wire(c,g,n,time){
 const ms=n.monitors;connect(c,ms[0],ms[1],n.fromIndex===0||n.toIndex===0,time);connect(c,ms[1],ms[2],n.fromIndex===2||n.toIndex===2,time);
}
function transfer(c,a,n,time){
 if(n.mode!=='transit')return;
 const a1=n.monitors[n.fromIndex],b1=n.monitors[n.toIndex],t=n.transitTime/n.transitDuration;
 const sx=a1.x+a1.w/2,sy=a1.y+a1.h/2,ex=b1.x+b1.w/2,ey=b1.y+b1.h/2;
 const x=sx+(ex-sx)*t,y=sy+(ey-sy)*t-Math.sin(t*Math.PI)*60;
 for(let i=0;i<32;i++){const q=Math.max(0,t-i/35),xx=sx+(ex-sx)*q,yy=sy+(ey-sy)*q-Math.sin(q*Math.PI)*60;
  rect(c,xx+Math.sin(i*23+time*8)*15,yy+Math.cos(i*17+time*10)*22,i%4?4:8,i%3?3:6,i%3?'#63dbf5':'#ea69e3');}
 c.save();c.globalAlpha=.85;drawMonster(c,a,'infoshum',x-60,y-64,120,116,time,false,{projection:true,state:'casting'});c.restore();
}
function tendril(c,b,n,time){
 if(!n.target||!['slamWarning','slam','weak'].includes(n.mode))return;
 const tx=n.target.x,ty=n.target.y-23,bx=b.x+b.w/2,by=b.y+b.h*.65;
 if(n.mode==='slamWarning'){
  for(let i=0;i<4;i++){const w=25+i*9;rect(c,tx-w/2,ty+23-i*2,w,2,'#eb648d');}
  pixels(c,tx,ty+12,16,time,scarlet);return;
 }
 const steps=44,length=n.mode==='weak'?1:Math.min(1,1-n.timer/.34);
 for(let i=0;i<steps*length;i++){const t=i/steps,xx=bx+(tx-bx)*t+Math.sin(t*Math.PI*3+time*4)*24*(1-t),yy=by+(ty-by)*t;
  rect(c,xx-7,yy-6,14,13,'#07182b');rect(c,xx-5,yy-5,10,10,'#117cac');rect(c,xx-4,yy-4,7,6,'#4cd9f2');}
 if(n.mode==='weak'){
  const hue=Math.floor(time*10)%2===0?'#fff5fa':scarlet;
  rect(c,tx-25,ty-24,50,48,'#201334');rect(c,tx-19,ty-18,38,36,'#54265c');
  rect(c,tx-12,ty-13,24,26,'#eb5dcb');rect(c,tx-7,ty-8,14,17,hue);pixels(c,tx,ty,28,time,purple);
 }
}
export function drawInfoshumBackdrop(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n)return;
 const r=rooms[g.room],center=r.x+r.width/2;
 // A digital vortex replaces the ordinary painted background only during the final transformation.
 if(n.stage==='rupture'||n.stage==='free'){
  c.save();c.globalAlpha=n.stage==='rupture'?.25+.2*n.transitionProgress:.38;
  for(let i=8;i>=0;i--){c.beginPath();c.ellipse(center,265,135+i*37,65+i*23,time*.06,0,Math.PI*2);
   c.strokeStyle=i%2?'#32135f':'#6a239a';c.lineWidth=3;c.stroke();}
  c.restore();
 }
 wire(c,g,n,time);
 for(const m of n.monitors){
  if(n.stage==='free'){if(m.state==='broken')wreck(c,m,time);continue;}
  monitor(c,a,m,n.stage==='network'&&m.index===n.activeIndex&&n.mode!=='transit',time,n);
  if(n.stage==='network')terminal(c,m,time,n.stage);
 }
}
export function drawInfoshumForeground(c,a,g,time){
 const b=g.boss,n=b.network;if(g.room!==8||!n||b.hp<=0)return;
 if(n.stage==='network'){
  transfer(c,a,n,time);
  if(n.mode==='charge'&&n.target){
   const t=n.target;for(let i=0;i<3;i++)rect(c,t.x-35-i*2,t.y-8-i*3,70+i*4,3,n.attackKind==='wave'?'#77bfe6':'#f36d9f');
   pixels(c,t.x,t.y-10,20,time,n.attackKind==='wave'?cyan:scarlet);
  }
  if(n.mode==='transferWarning'){
   const next=n.monitors[n.toIndex];if(next)pixels(c,next.x+next.w/2,next.y+next.h/2,45,time,cyan);
  }
  return;
 }
 if(n.stage==='rupture'){
  const last=n.monitors.find(m=>m.state!=='broken');if(last){
   const cx=last.x+last.w/2,cy=last.y+last.h/2;
   c.save();c.globalAlpha=.5+.5*n.transitionProgress;
   drawMonster(c,a,'infoshum',cx-135,cy-135,270,250,time,false,{projection:true,state:'casting'});c.restore();
   pixels(c,cx,cy,100*n.transitionProgress,time,purple);
  }
  return;
 }
 // Freed form reuses the existing sprite, animated without its CRT.
 c.save();c.translate(0,Math.sin(time*2.3)*7);
 drawMonster(c,a,'infoshum',b.x-64,b.y-82,256,215,time,false,{projection:true,state:n.mode==='slam'?'casting':n.mode==='weak'?'recover':'idle',hurtTime:b.hurtTime});
 c.restore();
 tendril(c,b,n,time);
 if(n.mode==='waveWarning'&&n.target){
  for(let i=0;i<5;i++)rect(c,n.target.x-36-i*3,n.target.y-9-i*3,72+i*6,2,'#eb73b6');
 }
}
