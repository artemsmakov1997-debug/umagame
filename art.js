import {creatures,newCreatures,sprite,idleCats} from './assets.js?v=0.4.0';
import {rect} from './pixel.js?v=0.4.0';
import {idleFrame} from './menu-animation.js?v=0.4.0';
export function drawMonster(c,a,id,x,y,w,h,time=0,flip=false){
 if(id==='source'){
  const bh=h*.96,bw=bh*creatures.boss[2]/creatures.boss[3],left=x+(w-bw)/2;
  const mh=h*.75,mw=mh*290/335;c.drawImage(a.room,1220,215,290,335,left+bw*.3,y+h-mh,mw,mh);
  sprite(c,a.noise,creatures.boss,left,y,bw,bh);return;
 }
 const box=id==='infonoise'?creatures.crawler:newCreatures[id];
 if(!box)return;const scale=Math.min(w/box[2],h/box[3]),dw=box[2]*scale,dh=box[3]*scale;
 sprite(c,id==='infonoise'?a.noise:a.monsters,box,x+(w-dw)/2,y+h-dh,dw,dh,flip);
}
export function drawLure(c,a,x,y,time){
 const yy=Math.round(y+Math.sin(time*3)*2);sprite(c,a.noise,creatures.fish,x-13,yy-8,26,16);
 rect(c,x+5,yy-14,1,6,'#b7e5ed');rect(c,x+5,yy-14,7,1,'#b7e5ed');rect(c,x+11,yy-13,1,4,'#b7e5ed');rect(c,x+9,yy-10,3,1,'#f2f5eb');
}
export function drawSoup(c,a,x,y,h=30){const b=newCreatures.soup,w=h*b[2]/b[3];sprite(c,a.monsters,b,x-w/2,y-h/2,w,h);}
export function drawMenuScene(c,a,time,cat=true){
 const height=c.canvas.height;c.imageSmoothingEnabled=false;c.clearRect(0,0,768,height);if(height===480)c.drawImage(a.menu,0,0,768,512);else{const width=height*1.5;c.drawImage(a.menu,(768-width)/2,0,width,height);}
 if(cat){const {frame}=idleFrame(time),box=idleCats[frame],tall=height>700,h=(tall?300:215)+Math.sin(time*1.7)*.7,w=h*box[2]/box[3];sprite(c,a.idle,box,(tall?635:587)-w/2,(tall?height*.87:418)-h,w,h);}
}
export function drawPortrait(canvas,a,id,time=0){
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);
 const pad=canvas.width<=120?2:12;drawMonster(c,a,id,pad,pad,canvas.width-pad*2,canvas.height-pad*2,time);
 if(id==='infonoise')for(let i=0;i<2;i++){const x=canvas.width-57+i*22,y=25+i*17;rect(c,x,y,18,14,'#e0d3b7');for(let j=0;j<3;j++)rect(c,x+3,y+3+j*3,11,1,'#6c7490');}
}
