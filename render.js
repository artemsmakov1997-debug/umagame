import {WIDTH,HEIGHT,WORLD,platforms} from './engine.js';
import {rect,text,catSprite,monster,fish,heart} from './pixel.js';
const C={navy:'#080f23',line:'#1f3952',cyan:'#65dce5',gold:'#efb85e'};
function rng(n){let s=n;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function plant(c,x,y){rect(c,x-6,y-9,12,10,'#9d6347');rect(c,x-8,y-11,16,3,'#c18c60');rect(c,x-1,y-37,2,27,'#456d54');for(let i=0;i<7;i++){const side=i%2?1:-1;rect(c,x+(side<0?-9:0),y-35+i*3,9,3,i%3?'#3d6953':'#6b8050');rect(c,x+side*7,y-36+i*3,4,3,'#284f47');}}
function lamp(c,x,y){rect(c,x,y-30,2,29,'#b28655');rect(c,x-7,y-32,16,4,'#c89c5b');rect(c,x-5,y-28,12,2,'#ffe2a0');rect(c,x-5,y-1,13,2,'#c89c5b');c.fillStyle='#e6a84a0c';c.beginPath();c.moveTo(x-5,y-27);c.lineTo(x-22,y);c.lineTo(x+24,y);c.lineTo(x+7,y-27);c.fill();}
function monitor(c,x,y,on=true){rect(c,x,y-30,34,27,'#263a4e');rect(c,x+2,y-29,30,23,'#456079');rect(c,x+4,y-27,25,18,'#0b2a43');rect(c,x+6,y-25,21,14,on?'#124d69':'#10283c');if(on){rect(c,x+9,y-22,14,1,'#5ec6df');rect(c,x+9,y-19,8,1,'#2f94b5');rect(c,x+9,y-16,12,1,'#3ba3bd');}rect(c,x+15,y-3,6,3,'#536274');rect(c,x+10,y,16,2,'#37495d');}
function books(c,x,y){for(let j=0;j<5;j++){rect(c,x+j%2,y-3-j*3,19,3,j%2?'#8f9aae':'#bfbdba');rect(c,x+3,y-2-j*3,13,1,'#676e88');}}
export class Renderer{
 constructor(canvas){this.c=canvas.getContext('2d');this.c.imageSmoothingEnabled=false;this.particles=[];}
 burst(x,y,color){for(let i=0;i<10;i++)this.particles.push({x,y,vx:(Math.random()-.5)*85,vy:-Math.random()*95,life:.5,color});}
 draw(g,dt=0){const c=this.c,t=g.time,cam=Math.floor(g.camera);rect(c,0,0,WIDTH,HEIGHT,C.navy);
 // Night sky and distant city use different parallax speeds.
 rect(c,0,20,480,182,'#0b1932');
 const random=rng(25);for(let i=0;i<60;i++){const x=((random()*800-cam*.12)%500+500)%500,y=25+random()*125;rect(c,x,y,1,1,i%4?'#314965':'#92cad4');}
 const moonX=370-cam*.04;rect(c,moonX,39,13,17,'#f1d69a');rect(c,moonX-3,42,17,11,'#f1d69a');rect(c,moonX+5,36,12,15,'#0b1932');
 const rand=rng(144);for(let i=-1;i<23;i++){const x=i*37-cam*.22%37,h=40+rand()*90;rect(c,x,179-h,32,h,'#10203b');rect(c,x+7,174-h,18,5,'#10203b');for(let a=0;a<4;a++)for(let b=0;b<6;b++)if(rand()>.46)rect(c,x+4+a*7,185-h+b*15,3,5,rand()>.6?'#c38b4d':'#2a415b');}
 // Window mullions and interior wall.
 for(let i=-1;i<8;i++){const x=i*100-cam*.4%100;rect(c,x,22,5,178,'#071321');rect(c,x+5,22,2,178,'#21344b');}
 rect(c,0,117,480,4,'#091525');rect(c,0,194,480,8,'#203549');rect(c,0,202,480,68,'#0d1b2c');
 for(let i=-1;i<14;i++){const x=i*40-cam*.65%40;rect(c,x,218,25,52,'#14253a');rect(c,x+2,222,21,2,'#1f3246');rect(c,x+2,227,21,2,'#1b3044');rect(c,x+5,235,4,25,'#0a1729');rect(c,x+12,235,8,25,'#1a2b40');}
 // Desks, shelves and set dressing in world coordinates.
 c.save();c.translate(-cam,0);
 for(let i=0;i<platforms.length;i++){const p=platforms[i];if(p.x+p.w<cam-40||p.x>cam+520)continue;
 const shelf=i>10;
 if(!shelf){rect(c,p.x+10,p.y+5,8,270-p.y,'#1d2c3b');rect(c,p.x+p.w-18,p.y+5,8,270-p.y,'#2b3541');rect(c,p.x+20,p.y+10,40,270-p.y,'#273548');for(let y=p.y+14;y<270;y+=20){rect(c,p.x+23,y,34,15,'#334154');rect(c,p.x+35,y+5,10,2,'#152638');}rect(c,p.x+65,p.y+15,p.w-100,4,'#1b2c3d');}
 rect(c,p.x,p.y,p.w,3,'#d2a164');rect(c,p.x,p.y+3,p.w,4,'#815e40');rect(c,p.x+3,p.y+7,p.w-6,3,'#352d2f');for(let k=7;k<p.w;k+=28)rect(c,p.x+k,p.y+1,13,1,'#f4c67b');
 if(!shelf){if(i%3===0)plant(c,p.x+28,p.y);else books(c,p.x+20,p.y);if(i!==10)monitor(c,p.x+p.w-58,p.y-2);if(i%2===0)lamp(c,p.x+p.w*.55,p.y-1);}
 }
 // Checkpoint lamp.
 rect(c,1150,183,3,28,'#6a8c9b');rect(c,1153,184,18,11,g.checkpoint?'#87e0ba':'#537e92');rect(c,1157,187,10,1,'#163143');
 for(const f of g.fishes)if(!f.taken&&f.x>cam-10&&f.x<cam+490)fish(c,Math.round(f.x),Math.round(f.y+Math.sin(t*3+f.x)*2));
 for(const e of g.enemies)if(!e.dead&&e.x>cam-30&&e.x<cam+500)monster(c,e.x,e.y,t);
 const b=g.boss;
 // Portal: an oversized infected CRT.
 rect(c,b.x-7,b.y-11,63,68,'#3d5164');rect(c,b.x-4,b.y-8,57,59,'#697580');rect(c,b.x,b.y-4,49,49,b.hp?'#0b4962':'#153a42');
 if(b.hp>0){const noise=rng(Math.floor(t*8));for(let i=0;i<65;i++)rect(c,b.x+3+noise()*42,b.y+noise()*40,2+Math.floor(noise()*5),1,noise()>.5?'#48c8de':'#1d7894');monster(c,b.x+7,b.y+7,t,true);rect(c,b.x-5,b.y-21,61,3,'#26364a');rect(c,b.x-5,b.y-21,61*b.hp/5,3,'#fa6b73');if(b.cooldown>.35)rect(c,b.x,b.y-4,49,49,'#d9ffff77');}
 else {text(c,'ТИШИНА',b.x+4,b.y+13,'#8ce0bd');}
 rect(c,b.x+13,b.y+57,23,3,'#314c60');rect(c,b.x+7,b.y+60,35,2,'#49657a');
 for(const bolt of g.bolts){rect(c,bolt.x,bolt.y,10,8,'#c0bcc8');rect(c,bolt.x+2,bolt.y+2,5,1,'#5d6383');rect(c,bolt.x-4,bolt.y+4,4,1,'#5dd5e7');}
 const p=g.player;
 if(p.inv===0||Math.floor(t*12)%2===0)catSprite(c,p.x,p.y,p.dir,p.vx?t*18:0,p.attack>0);
 if(p.attack>.05){c.strokeStyle='#fbe9bc';c.lineWidth=1;c.beginPath();c.arc(Math.round(p.x+8+p.dir*12),Math.round(p.y+13),16,p.dir>0?-1.1:2,p.dir>0?1.1:4.2);c.stroke();}
 for(const q of this.particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=160*dt;rect(c,q.x,q.y,2,2,q.color);}this.particles=this.particles.filter(q=>q.life>0);
 c.restore();
 // HUD.
 rect(c,0,0,480,22,'#070e1eee');rect(c,0,21,480,1,'#324b61');text(c,'НОЧНАЯ СМЕНА',10,8,'#c1e5e6');for(let i=0;i<3;i++)heart(c,205+i*13,8,i<g.lives);fish(c,269,10);text(c,String(g.fish).padStart(2,'0'),281,7);
 const seconds=Math.ceil(g.clock);text(c,`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`,428,7,'#f5dec1');
 rect(c,10,258,460,2,'#24394d');rect(c,10,258,Math.min(460,p.x/WORLD*460),2,'#5ac6d2');rect(c,467,255,3,7,'#efb85e');
 if(p.x<180&&g.mode==='playing'){text(c,'К ИСТОЧНИКУ ШУМА',20,39,'#a8cbd4');text(c,'БЕГИ ВПРАВО',20,51,'#e8d3ad');}
 if(p.x>2220&&b.hp&&g.mode==='playing')text(c,'УДАРЬ ПО МОНИТОРУ ЛАПОЙ!',258,40,'#f3d49e');
 }
}
