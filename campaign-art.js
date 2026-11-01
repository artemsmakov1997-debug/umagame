import {rooms,WIDTH} from './level.js?v=0.10.1';
import {rect,text} from './pixel.js?v=0.10.1';
import {sprite,idleCats} from './assets.js?v=0.10.1';
import {drawEmotion,wakePose} from './cat-animation.js?v=0.10.1';
import {drawMonster} from './art.js?v=0.10.1';
export function sceneLayers(assets){
 return rooms.map(room=>{
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.filter=room.theme==='cozy'?'none':'saturate(.4) contrast(.78)';
  const index={street:0,press:1,studio:2,tower:3}[room.theme];
  if(room.theme==='cozy')c.drawImage(assets.cozy,0,0,768,512);
  else if(room.theme==='newsroom')c.drawImage(assets.room,0,0,768,512);
  else if(room.theme==='dispatch')c.drawImage(assets.library,0,0,768,512);
  else{const sw=assets.journey.width/2,sh=assets.journey.height/2;c.drawImage(assets.journey,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,0,0,768,512);}
  c.filter='none';if(room.theme!=='cozy')rect(c,0,0,768,512,'#031023ac');
  if(room.theme==='dispatch')for(let rack=0;rack<5;rack++){const x=35+rack*150;rect(c,x,100,100,354,'#081426');rect(c,x+3,103,94,349,'#263b50');for(let row=0;row<9;row++){rect(c,x+8,109+row*37,84,29,'#101e31');rect(c,x+14,116+row*37,43,3,'#284e66');rect(c,x+77,117+row*37,3,3,row%3?'#258496':'#bd8b4b');}}
  return canvas;
 });
}
export function backgroundLayers(layers){
 return layers.map((base,index)=>{
  const canvas=document.createElement('canvas');canvas.width=928;canvas.height=512;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  c.save();c.translate(80,0);c.scale(-1,1);c.drawImage(base,0,0,80,512,0,0,80,512);c.restore();
  c.drawImage(base,80,0);
  c.save();c.translate(928,0);c.scale(-1,1);c.drawImage(base,688,0,80,512,0,0,80,512);c.restore();
  const mask=c.createLinearGradient(0,0,928,0);mask.addColorStop(0,index===0?'#fff':'#fff0');mask.addColorStop(80/928,'#fff');mask.addColorStop(848/928,'#fff');mask.addColorStop(1,index===layers.length-1?'#fff':'#fff0');
  c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,928,512);return canvas;
 });
}
export function backgroundOffset(room,camera){return room.index===0||room.theme==='cozy'?0:Math.max(-64,Math.min(64,(camera-(room.x+WIDTH*.25))*.16));}
export function drawBackdrop(c,layer,room,camera,darkness=0){c.save();if(room.theme==='cozy'&&darkness>0)c.filter=`brightness(${1-darkness*.8})`;c.drawImage(layer,Math.round(room.x-80+backgroundOffset(room,camera)),0);c.restore();}
export function drawSurface(c,a,p,time){
 if(p.room===0&&p.index===7)return;
 const bed=p.room===0&&p.index===0,x=bed?160:p.x,y=p.y,w=bed?p.w-160:p.w,theme=rooms[p.room].theme;
 rect(c,x+3,y+9,w,15,'#010714c9');rect(c,x-2,y-4,w+4,19,'#020611');
 const base=theme==='cozy'?'#876440':theme==='press'?'#896341':theme==='street'?'#576579':'#556a7c';
 rect(c,x,y,w,13,base);rect(c,x+2,y+4,w-4,6,'#21394c');
 for(let xx=x+9;xx<x+w-7;xx+=28){rect(c,xx,y+5,11,2,'#a1bdc4');rect(c,xx,y+8,2,2,'#0a1424');}
 rect(c,x,y-3,w,3,'#ffe6a3');rect(c,x,y,Math.max(0,w-1),1,'#c88e44');rect(c,x+1,y+11,w-2,2,'#16334a');
 for(const xx of [x,x+w-3]){rect(c,xx,y-3,3,7,'#e5fbeb');rect(c,xx,y+5,2,7,'#8bc7d0');}
 if(p.belt){c.save();c.beginPath();c.rect(x+2,y+2,w-4,9);c.clip();const offset=((time*p.belt)%22+22)%22;for(let xx=x-22+offset;xx<x+w+22;xx+=22){rect(c,xx,y+3,9,2,'#f2ce83');rect(c,xx+3,y+5,9,2,'#b98a51');}c.restore();}
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
}
export function drawCampaignObjects(c,a,g,time){
 if(g.room===0){
  rect(c,748,162,20,84,'#101d32');rect(c,752,168,12,74,g.tutorial.complete?'#10728a':'#3c4c5a');rect(c,754,173,2,62,g.tutorial.complete?'#8bebdf':'#71828a');
  text(c,'В РЕДАКЦИЮ',647,223,'#9cc7cd');
  for(let i=0;i<3;i++)rect(c,752+i*4,157,2,3,g.tutorial.step>i?'#a8f2b2':'#29465a');
  if(g.mode==='playing'){
   const q=g.tutorial.step,notes=g.touchEnabled?['ДЖОЙСТИК →','↑ ПРЫЖОК','ДЖОЙСТИК ↑','→']:['← → / A D','↑ / W','↑ ↓ / W S','→'];
   const x=q===0?120:q===1?207:q===2?420:705,y=q===0?225:q===1?324:q===2?214:214;rect(c,x-7,y-7,q<3?112:28,25,'#06152ddb');text(c,notes[q],x,y,'#ffe1a1');
  }
 }
 for(const portal of g.portals){
  if(portal.room!==g.room)continue;const grow=portal.cancelled?1-(portal.closeTime||0)/.3:Math.min(1,portal.time/.6),r=25*grow;c.save();c.translate(Math.round(portal.x+24),Math.round(portal.y-2));
  rect(c,-r,-r*1.6,r*2,r*1.6,'#19104099');for(let i=0;i<18;i++){const angle=i*Math.PI/9+time*2;rect(c,Math.cos(angle)*r,Math.sin(angle)*r*.55-9,3,3,i%3?'#8e8aff':'#68ecf4');}c.restore();
 }

 for(const relay of g.relays){
  const x=relay.x-21,y=relay.y-25;
  if(relay.hp>0){
   rect(c,x,y,98,81,'#092039f2');rect(c,x+2,y+2,94,77,'#315a6d');rect(c,x+5,y+5,88,71,'#091a30');
   text(c,'РЕТРАНСЛЯТОР',x+9,y+13,'#a5e9ff');
   for(let i=0;i<relay.hp;i++)rect(c,x+12+i*23,y+36,15,18,relay.inv>0?'#fff1c9':'#70cadd');
   if(g.enemies.some(e=>e.room===relay.room&&e.guardian&&!e.dead))text(c,'УБЕРИ ЗАЩИТНИКА',x+5,y+64,'#ffdd91');
   else text(c,'ТРИ УДАРА ЛАПОЙ',x+7,y+64,'#ffdd91');
   const gate=WIDTH*(relay.room+1)-12;rect(c,gate,48,7,426,'#132c47');for(let yy=50;yy<474;yy+=14)rect(c,gate+1,yy,5,8,Math.sin(time*4)>0?'#71d2e7':'#397fa4');
  }else{rect(c,x,y,98,81,'#0a2638');text(c,'ЖУРНАЛ СИГНАЛА',x+7,y+14,'#b8f5c9');for(let i=0;i<4;i++)rect(c,x+12,y+31+i*8,68-(i%2)*19,2,'#6ba9b6');}
 }
}
export function drawWakeup(c,a,p,elapsed){drawEmotion(c,a,wakePose(elapsed).frame,p.x+17,p.y+p.h,76);}
export function roomDarkness(time){return Math.max(0,Math.min(1,(time-2.7)/.45));}
export function drawOpening(c,a,g){
 if(g.wakeTime<2.2)return;
 const screen={x:214,y:154,w:135,h:104};c.save();c.beginPath();c.rect(screen.x,screen.y,screen.w,screen.h);c.clip();
 rect(c,screen.x,screen.y,screen.w,screen.h,'#041930');
 for(let i=0;i<10;i++)rect(c,screen.x+3,screen.y+4+i*12,screen.w-6,1,Math.floor((g.wakeTime+g.time)*16+i)%3?'#0b627d':'#57e6ed');
 if(g.wakeTime>=2.7){const progress=Math.min(1,(g.wakeTime-2.7)/.35);c.globalAlpha=progress;drawMonster(c,a,'infoshum',screen.x-4,screen.y+8+(1-progress)*90,screen.w+8,screen.h-8,g.wakeTime+g.time,false,{state:g.mode==='waking'?'casting':'idle',projection:true});}
 c.restore();
}
export function drawInfection(c,g){
 if(g.room!==1||g.truthFound)return;
 for(const [i,[lx,y,w,h]]of [[73,343,34,31],[386,352,54,35],[627,137,94,102]].entries()){
  const x=WIDTH+lx;rect(c,x,y,w,h,'#001128ee');for(let row=0;row<7;row++)rect(c,x+2,y+3+row*(h-6)/7,w-4,1,(row+Math.floor(g.time*8))%3?'#1595b2':'#8df2ff');rect(c,x+w*.25,y+h*.38,w*.13,h*.18,'#ff334c');rect(c,x+w*.61,y+h*.38,w*.13,h*.18,'#ff334c');
 }
}
export function drawEpilogue(c,a,time,width=768){
 const backgroundWidth=Math.max(768,width);c.drawImage(a.menu,(width-backgroundWidth)/2,0,backgroundWidth,backgroundWidth*2/3);rect(c,0,0,width,70,'#030a1eea');const compact=width<768;
 c.save();if(!compact)c.translate((width-768)/2,0);
 text(c,'ШУМ ОСТАНОВЛЕН',compact?Math.max(8,(width-168)/2):215,22,'#ffe5a4',compact?2:3,compact?0:1);
 if(compact){
  drawPerson(c,a,{id:'yuri',x:width*.29,y:286,rescued:true},time,2.4);
  for(const [i,id]of ['reporter','editor','crew'].entries())drawPerson(c,a,{id,x:width*(.18+i*.32),y:400,rescued:true},time,1.5);
 }else for(const [id,x] of [['reporter',130],['editor',285],['crew',397],['yuri',519]])drawPerson(c,a,{id,x,y:286,rescued:true},time,id==='yuri'?2.4:2);
 const left=compact?8:70,tableWidth=compact?width-16:640,catX=compact?width*.72:600;
 rect(c,left,270,tableWidth,12,'#8d5a34');rect(c,left,268,tableWidth,3,'#ffd38a');rect(c,left+8,282,8,55,'#322735');rect(c,left+tableWidth-16,282,8,55,'#322735');
 rect(c,catX-35,264,67,5,'#386f8d');rect(c,catX-31,265,59,2,'#e2d4b4');
 const box=idleCats[Math.floor(time*2)%17===0?1:0],h=87,w=h*box[2]/box[3];sprite(c,a.idle,box,catX-w/2,264-h,w,h);
 const bowl=compact?width-35:645;rect(c,bowl,258,28,5,'#c9e8e4');rect(c,bowl+4,263,20,5,'#82aab0');rect(c,bowl+3,257,22,2,'#e5b373');
 c.restore();
}
