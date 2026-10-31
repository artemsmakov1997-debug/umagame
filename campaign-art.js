import {rooms,WIDTH} from './level.js?v=0.6.0';
import {rect,text} from './pixel.js?v=0.6.0';
import {sprite,idleCats} from './assets.js?v=0.6.0';
export function sceneLayers(assets){
 return rooms.map((room,i)=>{
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.filter='saturate(.58)';
  if(i===0)c.drawImage(assets.room,0,0,768,512);
  else{const sw=assets.journey.width/2,sh=assets.journey.height/2,index=i-1;c.drawImage(assets.journey,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,0,0,768,512);}
  c.filter='none';rect(c,0,0,768,512,'#03102378');return canvas;
 });
}
export function drawSurface(c,a,p,time){
 const x=p.x,y=p.y,w=p.w,theme=rooms[p.room].theme;
 rect(c,x-1,y-2,w+2,16,'#020918');
 if(p.room===0)c.drawImage(a.room,x*2,(y-1)*2,w*2,20,x,y-1,w,10);
 else{
  const base=theme==='street'?'#4b3941':theme==='press'?'#5d4a3b':theme==='studio'?'#304b66':'#3f5064';
  rect(c,x,y,w,12,base);rect(c,x+2,y+3,w-4,5,'#0b1b30');
  for(let xx=x+8;xx<x+w-4;xx+=22){rect(c,xx,y+5,7,2,theme==='street'?'#ad7854':'#738b96');rect(c,xx,y+9,2,2,'#091528');}
  for(const xx of [x+9,x+w-15]){rect(c,xx,y+12,6,16,'#14253a');rect(c,xx+1,y+12,2,13,base);}
  if(p.belt){c.save();c.beginPath();c.rect(x,y+2,w,9);c.clip();const offset=((time*p.belt)%22+22)%22;for(let xx=x-22+offset;xx<x+w+22;xx+=22){rect(c,xx,y+3,9,2,'#e9ba70');rect(c,xx+3,y+5,9,2,'#b77d43');rect(c,xx+6,y+7,9,2,'#735135');}c.restore();}
 }
 rect(c,x,y-2,w,2,'#ffd38a');rect(c,x+1,y+11,w-2,2,'#152b42');
 rect(c,x,y-2,2,5,'#d5f0e1');rect(c,x+w-2,y-2,2,5,'#d5f0e1');
}
export function drawAmbience(c,room,time){
 if(room.theme==='street')for(let i=0;i<45;i++){const x=room.x+(i*79+Math.floor(time*17))%768,y=55+(i*47+Math.floor(time*95))%410;rect(c,x,y,1,4,'#69a1c338');}
 if(room.theme==='studio')for(let i=0;i<3;i++){const x=room.x+100+i*270,shift=Math.sin(time*.4+i)*35;c.fillStyle='#34628a22';c.beginPath();c.moveTo(x,70);c.lineTo(x-55+shift,390);c.lineTo(x+65+shift,390);c.closePath();c.fill();}
 if(room.theme==='tower')for(let i=0;i<4;i++)rect(c,room.x+70+i*181,115+(i%2)*70,3,3,Math.floor(time*2+i)%2?'#ef795c77':'#1c243d');
}
const peopleSprites={reporter:[210,10,330,616],editor:[773,18,292,608],crew:[193,628,376,615],yuri:[753,629,342,614]};
export function drawPerson(c,a,person,time,scale=1){
 const box=peopleSprites[person.id],h=48*scale,w=h*box[2]/box[3];
 sprite(c,a.journalists,box,person.x-w/2,person.y-h,w,h);
 if(!person.rescued){const x=person.x-14;rect(c,x,person.y-53,29,56,'#1737505c');for(let yy=person.y-50;yy<person.y;yy+=10)rect(c,x,yy,29,1,'#74cbe875');}
}
export function drawCampaignObjects(c,a,g,time){
 for(const person of g.people)if(person.room===g.room)drawPerson(c,a,person,time);
 for(const relay of g.relays){
  const x=relay.x-21,y=relay.y-25;
  if(relay.hp>0){
   rect(c,x,y,98,81,'#092039f2');rect(c,x+2,y+2,94,77,'#315a6d');rect(c,x+5,y+5,88,71,'#091a30');
   text(c,'РЕТРАНСЛЯТОР',x+9,y+13,'#a5e9ff');
   for(let i=0;i<relay.hp;i++)rect(c,x+12+i*23,y+36,15,18,relay.inv>0?'#fff1c9':'#70cadd');
   if(g.enemies.some(e=>e.room===relay.room&&e.guardian&&!e.dead))text(c,'ПОБЕДИ ИНФОШУМ',x+8,y+64,'#ffdd91');
   else text(c,'ТРИ УДАРА ЛАПОЙ',x+7,y+64,'#ffdd91');
   const gate=WIDTH*(relay.room+1)-12;rect(c,gate,48,7,426,'#132c47');for(let yy=50;yy<474;yy+=14)rect(c,gate+1,yy,5,8,Math.sin(time*4)>0?'#71d2e7':'#397fa4');
  }else{rect(c,x,y,98,81,'#0a2638');text(c,'СИГНАЛ СНЯТ',x+15,y+35,'#b8f5c9');}
  if(relay.room===0){rect(c,x+62,y+84,19,15,'#d49b48');rect(c,x+65,y+86,14,11,'#f7deb0');for(let i=0;i<3;i++)rect(c,x+68,y+88+i*3,8,1,'#716c7b');}
 }
}
export function drawWakeup(c,a,p,page,elapsed){
 const frame=page===0&&elapsed<1.5?1:page===2?2:0,box=idleCats[frame],s=76/474;
 sprite(c,a.idle,box,p.x+17-box[2]*s*.5,p.y+p.h-box[3]*s,box[2]*s,box[3]*s);
 const x=102,y=289;rect(c,x,y,36,14,'#8a6952');rect(c,x+3,y+3,19,8,'#17283b');for(let i=0;i<5;i++)rect(c,x+4+i*3,y+4,1,6,'#627a82');rect(c,x+27,y+5,4,4,'#a8c7c9');rect(c,x+27,y+2,2,2,Math.floor(elapsed*4)%2?'#73e4e8':'#236980');
}
export function drawEpilogue(c,a,time){
 c.drawImage(a.menu,0,0,768,512);rect(c,0,0,768,70,'#030a1eea');text(c,'РЕДАКЦИЯ СНОВА ВМЕСТЕ',150,22,'#ffe5a4',3,1);
 for(const [id,x] of [['reporter',130],['editor',285],['crew',397],['yuri',519]])drawPerson(c,a,{id,x,y:286,rescued:true},time,id==='yuri'?2.4:2);
 rect(c,70,270,640,12,'#8d5a34');rect(c,70,268,640,3,'#ffd38a');rect(c,78,282,8,55,'#322735');rect(c,690,282,8,55,'#322735');
 rect(c,565,264,67,5,'#386f8d');rect(c,569,265,59,2,'#e2d4b4');
 const box=idleCats[Math.floor(time*2)%17===0?1:0],h=87,w=h*box[2]/box[3];sprite(c,a.idle,box,600-w/2,264-h,w,h);
 rect(c,645,258,28,5,'#c9e8e4');rect(c,649,263,20,5,'#82aab0');rect(c,648,257,22,2,'#e5b373');
 for(let i=0;i<3;i++)rect(c,650+i*7,249-Math.floor(time*4+i)%4,1,4,'#d9ecdf77');
}
