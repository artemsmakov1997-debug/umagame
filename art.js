import {creatures,newCreatures,sprite} from './assets.js?v=0.10.1';
import {rect} from './pixel.js?v=0.10.1';
import {idlePlacement} from './menu-animation.js?v=0.10.1';
import {motion,monsterFrame,monsterReaction,previewActor,clickbaitAppearanceFrame,baitEmergenceFrames,locomotionFrame} from './monster-animation.js?v=0.10.1';
export function drawCrt(c,x,y,w,h,time=0){
 rect(c,x,y,w,h,'#080f22');rect(c,x+2,y+2,w-4,h-5,'#8792ab');rect(c,x+5,y+5,w-10,h-15,'#303f61');rect(c,x+9,y+9,w-18,h-23,'#062c51');
 for(let i=0;i<9;i++){const yy=y+12+i*(h-30)/9;rect(c,x+12,yy,w-24,2,'#0b658b');for(let j=0;j<6;j++)if((i*3+j+Math.floor(time*7))%4===0)rect(c,x+13+j*(w-28)/6,yy,Math.max(2,w/14),2,'#77ecff');}
 for(let i=0;i<4;i++)rect(c,x+w-27+i*5,y+h-9,2,3,'#253551');rect(c,x+w*.43,y+h,w*.14,5,'#66728c');rect(c,x+w*.23,y+h+5,w*.54,3,'#384563');
}
export function drawMonster(c,a,id,x,y,w,h,time=0,flip=false,actor={}){
 const atlas=motion[id];if(!atlas)return;
 const index=monsterFrame(id,time,actor),appearance=id==='clickbait'?clickbaitAppearanceFrame(actor):null,gait=locomotionFrame(id,time,actor),reaction=appearance===null?(gait||monsterReaction(id,time,actor)):null,frame=appearance===null?(reaction||atlas.frames[index]):baitEmergenceFrames[appearance],{box,pivot}=frame;
 if(id==='infoshum'&&!actor.projection)drawCrt(c,x+w*.35,y+h*.18,w*.54,h*.73,time);
 const scale=Math.min(w/(appearance===null?(reaction?.width||atlas.width):512),h/(appearance===null?(reaction?.height||atlas.height):480)),cx=x+w/2,feet=y+h;
 c.save();c.translate(Math.round(cx),Math.round(feet));if(flip!==(appearance===null&&!reaction&&id==='clickbait'&&index===3))c.scale(-1,1);
 sprite(c,a[appearance===null?(reaction?.asset||atlas.asset):'baitMotion'],box,(box[0]-pivot[0])*scale,(box[1]-pivot[1])*scale,box[2]*scale,box[3]*scale);c.restore();
}
export function drawLure(c,a,x,y,time){
 const yy=Math.round(y+Math.sin(time*3)*2);sprite(c,a.noise,creatures.fish,x-13,yy-8,26,16);
 rect(c,x+5,yy-14,1,6,'#b7e5ed');rect(c,x+5,yy-14,7,1,'#b7e5ed');rect(c,x+11,yy-13,1,4,'#b7e5ed');rect(c,x+9,yy-10,3,1,'#f2f5eb');
}
export function drawSoup(c,a,x,y,h=30){const b=newCreatures.soup,w=h*b[2]/b[3];sprite(c,a.monsters,b,x-w/2,y-h/2,w,h);}
export function drawNoiseEyes(c,x,y,w,h,time){
 rect(c,x,y,w,h,'#06263c');
 for(let row=0;row<20;row++)rect(c,x,y+row*h/20,w,Math.max(1,h/180),row%3===Math.floor(time*12)%3?'#0b5266':'#0c374b');
 const tick=Math.floor(time*14),flicker=tick%19===0,blink=tick%71>=68,shift=(tick%13===0?3:0)*w/100;
 if(flicker)return;
 const eye=(side)=>{c.save();c.translate(x+w*(side? .67:.32)+shift,y+h*.48);c.scale((side?-1:1)*w/100,h/100);c.shadowColor='#ff253b';c.shadowBlur=12;
  c.fillStyle=blink?'#8c293c':'#ff3147';c.beginPath();c.moveTo(-13,blink?0:-9);c.lineTo(11,blink?1:4);c.lineTo(5,blink?3:14);c.lineTo(-10,blink?2:6);c.closePath();c.fill();c.shadowBlur=0;c.restore();};eye(false);eye(true);
 const line=(tick*17)%Math.max(1,Math.floor(h));rect(c,x,y+line,w,Math.max(1,h/140),'#6fd6d438');
}
export function drawMenuScene(c,a,time,cat=true){
 const height=c.canvas.height;c.imageSmoothingEnabled=false;c.clearRect(0,0,768,height);if(height===480)c.drawImage(a.menu,0,0,768,512);else{const width=height*1.5;c.drawImage(a.menu,(768-width)/2,0,width,height);}
 const width=height===480?768:height*1.5,imageHeight=height===480?512:height;
 c.save();c.translate((768-width)/2,0);c.scale(width/1536,imageHeight/1024);c.beginPath();c.moveTo(1376,547);c.lineTo(1498,519);c.lineTo(1498,682);c.lineTo(1376,696);c.closePath();c.clip();drawNoiseEyes(c,1374,516,126,182,time);c.restore();
 if(height>700){const x=610,y=height*.54;drawCrt(c,x,y,135,147,time);drawNoiseEyes(c,x+9,y+9,117,121,time);}
 if(cat){const {box,x,y,w,h}=idlePlacement(time,height);sprite(c,a.idle,box,x,y,w,h);}
}
export function drawPortrait(canvas,a,id,time=0){
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);
 const big=canvas.width>200,pad=big?8:3,actor=previewActor(time),cast=actor.state==='casting';
 if(cast){actor.state=id==='inflator'?'blast':id==='panicker'?'alarm':id==='clickbait'?'snap':'casting';actor.attackFlash=1;}
 drawMonster(c,a,id,pad,pad,canvas.width-pad*2,canvas.height-pad*2,time,false,actor);
}
