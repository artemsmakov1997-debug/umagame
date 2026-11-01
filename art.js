import {creatures,newCreatures,sprite} from './assets.js?v=0.7.0';
import {rect} from './pixel.js?v=0.7.0';
import {idlePlacement} from './menu-animation.js?v=0.7.0';
import {motion,monsterFrame,monsterReaction,previewActor} from './monster-animation.js?v=0.7.0';
export function drawCrt(c,x,y,w,h,time=0){
 rect(c,x,y,w,h,'#080f22');rect(c,x+2,y+2,w-4,h-5,'#8792ab');rect(c,x+5,y+5,w-10,h-15,'#303f61');rect(c,x+9,y+9,w-18,h-23,'#062c51');
 for(let i=0;i<9;i++){const yy=y+12+i*(h-30)/9;rect(c,x+12,yy,w-24,2,'#0b658b');for(let j=0;j<6;j++)if((i*3+j+Math.floor(time*7))%4===0)rect(c,x+13+j*(w-28)/6,yy,Math.max(2,w/14),2,'#77ecff');}
 for(let i=0;i<4;i++)rect(c,x+w-27+i*5,y+h-9,2,3,'#253551');rect(c,x+w*.43,y+h,w*.14,5,'#66728c');rect(c,x+w*.23,y+h+5,w*.54,3,'#384563');
}
export function drawMonster(c,a,id,x,y,w,h,time=0,flip=false,actor={}){
 const atlas=motion[id];if(!atlas)return;
 const index=monsterFrame(id,time,actor),reaction=monsterReaction(id,time,actor),frame=reaction||atlas.frames[index],{box,pivot}=frame;
 if(id==='source')drawCrt(c,x+w*.35,y+h*.18,w*.54,h*.73,time);
 const scale=Math.min(w/(reaction?.width||atlas.width),h/(reaction?.height||atlas.height)),cx=x+w/2,feet=y+h;
 c.save();c.translate(Math.round(cx),Math.round(feet));if(flip!==(!reaction&&id==='clickbait'&&index===3))c.scale(-1,1);
 sprite(c,a[reaction?.asset||atlas.asset],box,(box[0]-pivot[0])*scale,(box[1]-pivot[1])*scale,box[2]*scale,box[3]*scale);c.restore();
}
export function drawLure(c,a,x,y,time){
 const yy=Math.round(y+Math.sin(time*3)*2);sprite(c,a.noise,creatures.fish,x-13,yy-8,26,16);
 rect(c,x+5,yy-14,1,6,'#b7e5ed');rect(c,x+5,yy-14,7,1,'#b7e5ed');rect(c,x+11,yy-13,1,4,'#b7e5ed');rect(c,x+9,yy-10,3,1,'#f2f5eb');
}
export function drawSoup(c,a,x,y,h=30){const b=newCreatures.soup,w=h*b[2]/b[3];sprite(c,a.monsters,b,x-w/2,y-h/2,w,h);}
export function drawMenuScene(c,a,time,cat=true){
 const height=c.canvas.height;c.imageSmoothingEnabled=false;c.clearRect(0,0,768,height);if(height===480)c.drawImage(a.menu,0,0,768,512);else{const width=height*1.5;c.drawImage(a.menu,(768-width)/2,0,width,height);}
 if(cat){const {box,x,y,w,h}=idlePlacement(time,height);sprite(c,a.idle,box,x,y,w,h);}
}
export function drawPortrait(canvas,a,id,time=0){
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);
 const big=canvas.width>200,pad=big?8:3,actor=previewActor(time),cast=actor.state==='casting';
 if(cast){actor.state=id==='headline'?'blast':id==='panicker'?'alarm':id==='clickbait'?'snap':'casting';actor.attackFlash=1;}
 if(id==='infonoise'){
  const atlas=motion.infonoise,index=monsterFrame(id,time,actor),{box,pivot}=atlas.frames[index];
  const h=canvas.height-pad*2,w=big?canvas.width*.78:canvas.width-pad*2,s=Math.min(w/500,h/(index===3?365:290)),cx=big?canvas.width*.38:canvas.width/2,feet=canvas.height-pad;
  sprite(c,a.noiseMotion,box,cx+(box[0]-pivot[0])*s,feet+(box[1]-pivot[1])*s,box[2]*s,box[3]*s);
  if(big)for(let i=0;i<3;i++){const x=canvas.width*.77+i%2*24+(cast?(time%1)*22:0),y=22+i*39+Math.sin(time*2+i)*3;c.save();c.translate(x,y);c.rotate((i-1)*.16);rect(c,0,0,42,32,'#fae4bb');for(let j=0;j<3;j++)rect(c,6,6+j*7,29,3,'#747d9c');c.restore();}
 }else drawMonster(c,a,id,pad,pad,canvas.width-pad*2,canvas.height-pad*2,time,false,actor);
}
