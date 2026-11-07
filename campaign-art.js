function safeWarning(p){return p.collapseCharge>.35;}
import {rooms,WIDTH} from './level.js?v=0.21.5';
import {rect,text} from './pixel.js?v=0.21.5';
import {sprite,idleCats} from './assets.js?v=0.21.5';
import {drawEmotion,wakePose} from './cat-animation.js?v=0.21.5';
import {drawMonster,drawHauntedMonitor} from './art.js?v=0.21.5';
import {drawDish,drawTowerPortal} from './stage-art.js?v=0.21.5';
export function sceneLayers(assets){
 return rooms.map(room=>{
  const canvas=document.createElement('canvas');canvas.width=room.width;canvas.height=512;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  if(room.index===2){canvas.height=480;const image=assets.spreaderArena,scale=Math.max(canvas.width/image.width,480/image.height);c.drawImage(image,(canvas.width-image.width*scale)/2,(480-image.height*scale)/2,image.width*scale,image.height*scale);return canvas;}
  if(room.index===3&&assets.roofsBlock1){[assets.roofsBlock1,assets.roofsBlock2,assets.roofsBlock3].forEach((image,i)=>c.drawImage(image,i*768,0,768,512));for(const seam of[768,1536]){const fade=c.createLinearGradient(seam-50,0,seam+50,0);fade.addColorStop(0,'#04092000');fade.addColorStop(.5,'#040920cc');fade.addColorStop(1,'#04092000');c.fillStyle=fade;c.fillRect(seam-50,0,100,512);}return canvas;}
  if(room.tutorial){c.drawImage(assets.cozy,0,0,768,512);if(assets.tutorialRoom){c.drawImage(assets.tutorialRoom,768,0,768,512);c.drawImage(assets.tutorialRoom,60,150,90,110,768+78,75,45,55);/* the joined window keeps one moon */}return canvas;}
  const index={newsroom:0,roofs:1,studio:2,noise:3}[room.theme],sw=assets.backdrops.width/2,sh=assets.backdrops.height/2;
  c.filter='saturate(.62) brightness(.65)';
  for(let offset=0;offset<room.width;offset+=768){
   // Newsroom blocks: editorial hall keeps the chapter backdrop; print shop and server room have their own.
   if(room.index===1&&offset>0&&assets.newsroomBlocks){c.drawImage(assets.newsroomBlocks,offset===768?0:768,0,768,512,offset,0,768,512);continue;}
   c.save();c.translate(offset,0);if(offset===768){c.translate(768,0);c.scale(-1,1);}
   c.drawImage(assets.backdrops,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,0,0,768,512);c.restore();
  }
  if(room.index===1&&assets.newsroomBlocks)for(const seam of[768,1536]){
   // Soften the seams between different block paintings.
   const fade=c.createLinearGradient(seam-40,0,seam+40,0);fade.addColorStop(0,'#06102400');fade.addColorStop(.5,'#061024aa');fade.addColorStop(1,'#06102400');c.fillStyle=fade;c.fillRect(seam-40,0,80,512);
  }
  c.filter='none';rect(c,0,0,canvas.width,512,room.arena?'#030c2338':'#03102340');
  // Subareas retain a shared newsroom world but have different machinery and light.
 if(!room.arena)for(let section=0;section<3;section++){
  const x=section*768;c.save();c.globalAlpha=.12;rect(c,x,0,768,512,[['#16425c','#453921','#1e1949'],['#192a50','#4e2145','#133c4a'],['#312745','#155151','#452c2c'],['#211843','#123451','#41204a']][{newsroom:0,roofs:1,studio:2,noise:3}[room.theme]][section]);c.restore();
 }
 // Distant editorial and broadcast machinery varies the three-screen route.
  if(room.theme==='newsroom')for(let i=0;i<(room.index===1&&assets.newsroomBlocks?3:9);i++){const x=58+i*258;rect(c,x,375,120,90,'#122139');rect(c,x+3,377,114,4,'#4a5666');for(let k=0;k<4;k++)rect(c,x+8,387+k*16,104,2,'#30465a');}
  if(room.arena&&room.theme==='roofs')for(const x of [room.width*.25,room.width*.73]){rect(c,x,54,8,350,'#26374f');for(let y=60;y<400;y+=28){rect(c,x-16,y,40,3,'#344d63');}}
  if(room.arena&&room.theme==='studio')for(let i=0;i<5;i++){const x=110+i*285;rect(c,x,25,75,26,'#284255');rect(c,x+6,30,63,15,'#597286');}
  return canvas;
 });
}
export function backgroundLayers(layers){
 return layers.map((base,index)=>{
  if(index===0||index===2)return base;
  const canvas=document.createElement('canvas');canvas.width=base.width+160;canvas.height=512;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  c.save();c.translate(80,0);c.scale(-1,1);c.drawImage(base,0,0,80,512,0,0,80,512);c.restore();
  c.drawImage(base,80,0);
  c.save();c.translate(canvas.width,0);c.scale(-1,1);c.drawImage(base,base.width-80,0,80,512,0,0,80,512);c.restore();
  const mask=c.createLinearGradient(0,0,canvas.width,0);mask.addColorStop(0,index===0||rooms[index].arena?'#fff':'#fff0');mask.addColorStop(80/canvas.width,'#fff');mask.addColorStop((canvas.width-80)/canvas.width,'#fff');mask.addColorStop(1,index===layers.length-1?'#fff':'#fff0');
  c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,canvas.width,512);return canvas;
 });
}
export function backgroundOffset(room,camera){return room.index===0||room.theme==='cozy'?0:Math.max(-64,Math.min(64,(camera-(room.x+WIDTH*.25))*.16));}
export function drawBackdrop(c,layer,room,camera,darkness=0){c.save();if(room.theme==='cozy'&&darkness>0)c.filter=`brightness(${1-darkness*.8})`;if(room.index===2||room.index===3){c.drawImage(layer,room.x,0);c.restore();return;}c.drawImage(layer,Math.round(room.x-(room.theme==='cozy'?0:80)+backgroundOffset(room,camera)),0);if(room.theme==='cozy')for(const x of[room.x-4,room.x+room.width]){rect(c,x,0,4,512,'#241b25');rect(c,x+1,0,1,512,'#836140');}c.restore();}
export function drawSurface(c,a,p,time){
 if(p.room===0&&p.index===7)return;
 const bed=p.room===0&&p.index===0,x=bed?160:p.x,y=p.y,w=bed?p.w-160:p.w,theme=rooms[p.room].theme;
 rect(c,x+3,y+9,w,15,'#010714c9');rect(c,x-2,y-4,w+4,19,'#020611');
 const base=p.motion?'#397187':theme==='noise'?'#51456e':theme==='cozy'?'#876440':theme==='press'?'#896341':theme==='roofs'?'#8d665c':'#556a7c';
 rect(c,x,y,w,13,base);rect(c,x+2,y+4,w-4,6,'#21394c');
 for(let xx=x+9;xx<x+w-7;xx+=28){rect(c,xx,y+5,11,2,'#a1bdc4');rect(c,xx,y+8,2,2,'#0a1424');}
 rect(c,x,y-3,w,3,p.motion?'#9cf7f0':theme==='noise'?'#cfb5ff':'#ffe6a3');rect(c,x,y,Math.max(0,w-1),1,'#c88e44');rect(c,x+1,y+11,w-2,2,'#16334a');
 for(const xx of [x,x+w-3]){rect(c,xx,y-3,3,7,'#e5fbeb');rect(c,xx,y+5,2,7,'#8bc7d0');}
 if(p.fragile){for(let i=0;i<4;i++)rect(c,x+10+i*(w-20)/4,y-2,3,10,safeWarning(p)?'#ff775c':'#af7558');}
 if(p.belt){c.save();c.beginPath();c.rect(x+2,y+2,w-4,9);c.clip();const offset=((time*p.belt)%22+22)%22;for(let xx=x-22+offset;xx<x+w+22;xx+=22){rect(c,xx,y+3,9,2,'#f2ce83');rect(c,xx+3,y+5,9,2,'#b98a51');}c.restore();}
}
export function drawAmbience(c,room,time){
 if(room.theme==='roofs')for(let i=0;i<45;i++){const x=room.x+(i*79+Math.floor(time*17))%room.width,y=55+(i*47+Math.floor(time*95))%410;rect(c,x,y,1,4,'#69a1c338');}
 if(room.theme==='studio')for(let i=0;i<Math.ceil(room.width/270);i++){const x=room.x+100+i*270,shift=Math.sin(time*.4+i)*35;c.fillStyle='#34628a22';c.beginPath();c.moveTo(x,70);c.lineTo(x-55+shift,390);c.lineTo(x+65+shift,390);c.closePath();c.fill();}
 if(room.theme==='noise')for(let i=0;i<40;i++){const xx=room.x+(i*119+Math.floor(time*8))%room.width,yy=40+(i*47+Math.floor(time*4))%425;rect(c,xx,yy,2,2,i%3?'#72b8e832':'#b8a7ef40');}
 if(room.theme==='tower')for(let i=0;i<4;i++)rect(c,room.x+70+i*181,115+(i%2)*70,3,3,Math.floor(time*2+i)%2?'#ef795c77':'#1c243d');
}
const peopleSprites={reporter:[210,10,330,616],editor:[773,18,292,608],crew:[193,628,376,615],yuri:[753,629,342,614]};
export function drawPerson(c,a,person,time,scale=1){
 const box=peopleSprites[person.id],h=48*scale,w=h*box[2]/box[3];
 sprite(c,a.journalists,box,person.x-w/2,person.y-h,w,h);
}
export function drawCampaignObjects(c,a,g,time){
 for(const portal of g.portals){
  if(portal.room!==g.room)continue;const grow=portal.cancelled?1-(portal.closeTime||0)/.3:Math.min(1,portal.time/.6),r=25*grow;c.save();c.translate(Math.round(portal.x+24),Math.round(portal.y-2));
  rect(c,-r,-r*1.6,r*2,r*1.6,'#19104099');for(let i=0;i<18;i++){const angle=i*Math.PI/9+time*2;rect(c,Math.cos(angle)*r,Math.sin(angle)*r*.55-9,3,3,i%3?'#8e8aff':'#68ecf4');}c.restore();
 }

 for(const dish of g.relays)if(dish.room===g.room&&g.room!==8&&g.room!==4)drawDish(c,a,dish,time);

 drawTowerPortal(c,g,time,a);
}
export function drawWakeup(c,a,p,elapsed){drawEmotion(c,a,wakePose(elapsed).frame,p.x+17,p.y+p.h,76);}
export function roomDarkness(time){return Math.max(0,Math.min(1,(time-2.7)/.45));}
export function drawOpening(c,a,g){
 if(g.wakeTime<2.2)return;
 const screen={x:214,y:154,w:135,h:104};c.save();c.beginPath();c.rect(screen.x,screen.y,screen.w,screen.h);c.clip();
 rect(c,screen.x,screen.y,screen.w,screen.h,'#041930');
 for(let i=0;i<10;i++)rect(c,screen.x+3,screen.y+4+i*12,screen.w-6,1,Math.floor((g.wakeTime+g.time)*16+i)%3?'#0b627d':'#57e6ed');
 if(g.wakeTime>=2.7&&(g.mode==='waking'||g.pausedFrom==='waking')){const progress=Math.min(1,(g.wakeTime-2.7)/.35);c.globalAlpha=progress;drawMonster(c,a,'infoshum',screen.x-4,screen.y+8+(1-progress)*90,screen.w+8,screen.h-8,g.wakeTime+g.time,false,{state:g.mode==='waking'?'casting':'idle',projection:true});}
 c.restore();
}
// These screens are scenery only; their rectangles never enter collision geometry.
export const hauntedScreens=[{room:3,lx:596,y:306,w:84,h:84},{room:5,lx:630,y:115,w:108,h:108},{room:5,lx:1080,y:350,w:82,h:82},{room:5,lx:1170,y:350,w:82,h:82,forged:true}];
export function drawInfection(c,g,a){
 for(const m of hauntedScreens)if(m.room===g.room)drawHauntedMonitor(c,a,rooms[m.room].x+m.lx,m.y,m.w,m.h,g.time);
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
