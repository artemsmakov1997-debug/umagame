import {rect} from './pixel.js?v=0.21.5';
import {drawTargetSprite} from './target-art.js?v=0.21.5';
import {drawHauntedMonitor} from './art.js?v=0.21.5';
import {catLife} from './hud.js?v=0.21.5';
import {rooms,PORTAL_X,PORTAL_ROOM} from './level.js?v=0.21.5';
const dishFrames=[
 {box:[0,0,512,512],pivot:[318,480]}, {box:[512,0,512,512],pivot:[830,480]}, {box:[1024,0,512,512],pivot:[1335,480]},
 {box:[0,512,512,512],pivot:[318,988]}, {box:[512,512,512,512],pivot:[811,988]}, {box:[1024,512,512,512],pivot:[1328,988]}
];
export function drawDish(c,a,d,time){
 if(d.scripted)return;
 if(d.kind!=='dish'&&a.destructibles){const col={printer:0,broadcast:1,edit:2,signal:3}[d.kind]??0,row=d.hp?0:d.breakTime>.25?1:2,sw=a.destructibles.width/4,sh=a.destructibles.height/3;drawTargetSprite(c,a.destructibles,[col*sw,row*sh,sw,sh],d.x+d.w/2-45,d.y+d.h-80,90,80,time,d.hp>0);return;}
 const index=d.hp>0?Math.floor(time*3)%2:d.breakTime>.52?2:d.breakTime>.32?3:d.breakTime>.1?4:5,{box,pivot}=dishFrames[index],scale=80/480,cx=d.x+d.w/2,feet=d.y+d.h;
 drawTargetSprite(c,a.dishes,box,cx+(box[0]-pivot[0])*scale,feet+(box[1]-pivot[1])*scale,box[2]*scale,box[3]*scale,time,d.hp>0);
 if(d.hp>0)for(let i=0;i<3;i++){const radius=8+i*8+Math.sin(time*2)*3;c.strokeStyle=i%2?'#66c9e84d':'#b3f2f24d';c.lineWidth=1;c.beginPath();c.arc(cx-35,feet-63,radius,Math.PI*1.03,Math.PI*1.53);c.stroke();}

}
export function drawMovingRails(c,platforms,time){
 for(const s of platforms)if(s.motion){
  const {axis,amplitude}=s.motion;c.save();c.globalAlpha=.65;
  if(axis==='x'){
   const left=s.baseX-amplitude,right=s.baseX+amplitude+s.w;rect(c,left,s.baseY+21,right-left,2,'#284a66');
   for(let x=left;x<=right;x+=16)rect(c,x,s.baseY+19,5,5,'#51748a');
  }else{
   const x=s.baseX+s.w/2;rect(c,x-1,48,2,s.baseY+amplitude-40,'#466479');
   for(let y=52;y<s.baseY+amplitude;y+=11)rect(c,x-3,y,6,2,'#7991a2');
   rect(c,x-15,41,30,14,'#132a43');rect(c,x-9,44,18,7,'#719ea9');rect(c,x-3,46,6,4,'#a1eff1');
  }c.restore();
 }
}
let lifeIcon;
function getLifeIcon(){
 if(lifeIcon)return lifeIcon;
 const face=document.createElement('canvas');face.width=26;face.height=18;const ink=face.getContext('2d');ink.scale(2,2);catLife(ink,0,0);
 lifeIcon=document.createElement('canvas');lifeIcon.width=36;lifeIcon.height=30;const glow=lifeIcon.getContext('2d');glow.filter='drop-shadow(0px 0px 2px #ffc76c)';glow.drawImage(face,5,5);return lifeIcon;
}
export function drawLifeCaches(c,g,time){
 const p=g.player;
 for(const life of g.lifePickups){
  if(life.taken||life.room!==g.room)continue;const near=Math.abs(p.x+17-life.x)<190&&Math.abs(p.y+p.h/2-life.y)<150;
  const x=Math.round(life.x),y=Math.round(life.y);rect(c,x-19,y+3,38,22,'#071326');rect(c,x-17,y+5,34,18,'#294359');
  for(let i=0;i<3;i++)rect(c,x-13+i*10,y+15,6,2,'#6e858d');
  if(near){
   c.save();c.globalAlpha*=g.lives<3?1:.6;c.drawImage(getLifeIcon(),x-18,y-17+Math.sin(time*3+life.x)*2);c.restore();
   for(let i=0;i<3;i++)rect(c,x-20+i*19,y-15-Math.sin(time*3+i)*5,2,2,'#ffe1a3');
  }else rect(c,x+10,y+4,3,2,Math.floor(time*2)%3===0?'#ffe6a4':'#2c7081');
 }
}
export function drawTowerPortal(c,g,time,a){
 if(g.room!==PORTAL_ROOM&&g.pausedFrom!=='enteringArena')return;
 if(a?.dimensionPieces)return; // «Порог Инфошума» (dimension-art.js) replaces the old barrier column
 if(a?.barriers){const sw=a.barriers.width/4,sh=a.barriers.height/2,open=!g.relays.some(d=>d.room===PORTAL_ROOM&&d.hp>0);c.drawImage(a.barriers,3*sw,(open?1:0)*sh,sw,sh,PORTAL_X-108,98,216,288);return;}
 const x=PORTAL_X-72,y=100,w=144,h=216;
 rect(c,x-9,y-8,w+18,h+22,'#020817');rect(c,x-6,y-5,w+12,h+15,'#345473');rect(c,x,y,w,h,'#020b22');
 for(let i=0;i<30;i++){const a=i*Math.PI/15+time*.7,rx=w*.43,ry=h*.43;rect(c,x+w/2+Math.cos(a)*rx,y+h/2+Math.sin(a)*ry,4,7,i%3?'#71dde8':'#bd8df5');}
 for(let i=0;i<18;i++){const a=i*2.4+time,r=(i*17+time*16)%58;rect(c,x+w/2+Math.cos(a)*r,y+h/2+Math.sin(a)*r*1.4,2,2,i%2?'#265084':'#7458ac');}
 if(a)drawHauntedMonitor(c,a,x+10,y+20,w-20,h-40,time,true);
 rect(c,x+w/2-10,y+h+14,20,9,'#355069');rect(c,x+w/2-38,y+h+23,76,5,'#4a7184');
}
export function drawArenaTransfer(c,g,width){
 const e=g.arenaEntry;if(!e)return;const alpha=Math.min(1,Math.max(0,1-Math.abs(e.time-.8)/.44));
 c.save();c.globalAlpha=alpha;rect(c,0,0,width,480,'#03071b');
 c.globalAlpha=alpha*.7;for(let i=0;i<36;i++){const a=i*.8+e.time*7,r=24+i*8;rect(c,width/2+Math.cos(a)*r,240+Math.sin(a)*r*.6,3,5,i%3?'#74bfe4':'#a78bff');}c.restore();
}

export function drawLocationLoading(c,g,width){
 if(g.loading){const e=g.loading,alpha=Math.min(1,e.time/.25,(1.1-e.time)/.25);c.save();c.globalAlpha=Math.max(0,alpha);rect(c,0,0,width,480,'#03091b');
  const title=rooms[e.to].name; c.font='26px UmaText, monospace';c.textAlign='center';c.fillStyle='#ffe0a0';c.fillText(title,width/2,222);c.font='18px UmaText, monospace';c.fillStyle='#77cddf';c.fillText('ПЕРЕХОД',width/2,252);for(let i=0;i<3;i++)rect(c,width/2-17+i*14,273,6,4,i<=Math.floor(e.time*4)%3?'#a0edec':'#28455b');c.restore();
 }
 if(g.echoWarp){const e=g.echoWarp,alpha=Math.sin(Math.min(1,e.time/.5)*Math.PI)*.8;c.save();c.globalAlpha=alpha;rect(c,0,0,width,480,'#211342');c.restore();}
}
