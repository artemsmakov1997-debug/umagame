import {rooms} from './level.js?v=0.21.5';
import {drawPixelBarrier} from './shield-art.js?v=0.21.5';
import {antennaStation} from './agitator-combat.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';

export function drawAgitatorPose(c,a,row,frame,x,y,w,h,flip=false){
 const image=a.agitator;if(!image?.naturalWidth)return;
 const feet=[[230,230,230,230],[229,229,227,226],[229,230,229,229],[229,226,224,225],[225,215,224,225],[223,223,223,223]][row][frame],scale=Math.min(w/256,h/234);c.save();c.translate(x+w/2,y+h);if(flip)c.scale(-1,1);
 c.drawImage(image,frame*256,row*256,256,256,-128*scale,-feet*scale,256*scale,256*scale);c.restore();
}
export function drawAgitatorBackdrop(c,a,g,t){
 if(g.room!==4)return;const r=rooms[4];rect(c,r.x,0,r.width,480,'#03112d');c.drawImage(a.agitatorRoof,r.x,13,r.width,480);
}
export function drawAgitatorPlatform(c,a,p,t){
 // The same painted steel used elsewhere, with real brackets/cables anchored in the roof facade.
 c.drawImage(a.studioProps,0,210,443,100,p.x,p.y-2,p.w,22);
 if(p.y<400){for(const x of[p.x+8,p.x+p.w-10]){rect(c,x-3,p.y+18,8,422-p.y-18,'#10243d');rect(c,x,p.y+18,3,422-p.y-18,'#466482');for(let y=p.y+25;y<422;y+=24)rect(c,x-4,y,10,3,'#71849c');}}
}
function energy(c,x,y,tx,ty,alpha=1){
 c.save();c.globalAlpha=alpha;c.strokeStyle='#16acc65c';c.lineWidth=10;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.strokeStyle='#24d3f0';c.lineWidth=4;c.stroke();c.strokeStyle='#ceffff';c.lineWidth=1;c.stroke();c.restore();
}
function antenna(c,a,g,station,t){
 const at=antennaStation(g,station),index=station.index,step=station.hits,cw=a.agitatorAntennas.width/4,ch=a.agitatorAntennas.height/2;
 const w=250,h=250,x=at.platform.x+at.platform.w/2-w/2,y=at.y-200;
 if(station.turnTime>0&&step>0){c.save();c.globalAlpha=station.turnTime/.65;c.drawImage(a.agitatorAntennas,(step-1)*cw,index*ch,cw,ch,x,y,w,h);c.globalAlpha=1-station.turnTime/.65;c.drawImage(a.agitatorAntennas,step*cw,index*ch,cw,ch,x,y,w,h);c.restore();}
 else c.drawImage(a.agitatorAntennas,step*cw,index*ch,cw,ch,x,y,w,h);
 if(step&&g.boss.broadcast.stage!=='chase'){const b=g.boss,side=index?-1:1,px=x+(index?55:395)/cw*w,py=y+165/ch*h;energy(c,px,py,b.x+b.w/2,b.y+b.h/2-8,(.35+step*.18)*(g.boss.broadcast.stage==='break'?g.boss.broadcast.timer/1.6:1));}
 const blocked=station.hits<3&&(station.lockTime>0||station.locked&&g.boss.broadcast.antennas.some(other=>other!==station&&other.hits<3));
 if(blocked)drawPixelBarrier(c,x+w/2,y+h*.42,118,112,{time:t,alpha:.75,flash:station.flash});
 for(let i=0;i<3;i++){rect(c,at.x-25+i*18,at.y+8,13,7,i<station.hits?'#75f6ff':'#273d64');rect(c,at.x-25+i*18,at.y+8,13,1,'#ddfaff');}
}
export function drawAgitatorEquipment(c,a,g,t){if(g.room===4&&g.boss.broadcast)for(const station of g.boss.broadcast.antennas)antenna(c,a,g,station,t);}
export function drawAgitator(c,a,g,t){
 const b=g.boss,n=b.broadcast;if(!n)return;
 const row=b.hurtTime>0?5:n.stage==='break'?3:n.stage==='chase'?(n.mode==='hop'?4:3):n.mode==='sonic'?1:n.mode==='headline'?2:n.mode==='warning'?(n.turn%2?2:1):0,frame=Math.floor(t*6)%4;
 if(n.mode==='hop'){for(const lag of[.12,.24]){const q=Math.max(0,1-n.timer/n.hopDuration-lag);c.save();c.globalAlpha=.22;drawAgitatorPose(c,a,4,frame,n.from.x+(n.to.x-n.from.x)*q-12,n.from.y+(n.to.y-n.from.y)*q-Math.sin(q*Math.PI)*80-35,b.w+24,b.h+35,b.dir<0);c.restore();}}
 drawAgitatorPose(c,a,row,frame,b.x-12,b.y-35,b.w+24,b.h+35,b.dir<0);
 if(n.stage==='shield'||n.stage==='break'){
  const alpha=n.stage==='break'?Math.max(0,n.timer/1.6):.8;
  drawPixelBarrier(c,b.x+b.w/2,b.y+b.h/2-8,78,77,{time:t,alpha,flash:n.stage==='break'?.3:b.guardFlash});
  if(n.stage==='break')for(let i=0;i<14;i++){const angle=i*2.4,r=80+(1-n.timer/1.6)*70;rect(c,b.x+b.w/2+Math.cos(angle)*r,b.y+b.h/2+Math.sin(angle)*r,4,7,'#a2faff');}
 }
 if(n.wave){const wave=n.wave,boxes=[[173,98,128,214],[136,66,181,282],[93,33,262,353],[54,3,352,409]],f=Math.min(3,Math.floor(wave.age*4)),box=boxes[f];for(const side of[-1,1]){c.save();c.globalAlpha=Math.min(.85,(2.5-wave.age)*2);c.translate(wave.x,wave.y);if(side<0)c.scale(-1,1);c.drawImage(a.agitatorEffects,f*443.5+box[0],443.5+box[1],box[2],box[3],0,-wave.radius,wave.radius,wave.radius*2);c.restore();}}
}
export function drawAgitatorProjectile(c,a,bolt,t){
 if(bolt.kind!=='headline')return false;const f=Math.floor(t*9)%4;
 const boxes=[[29,187,389,105],[32,168,374,128],[21,155,393,141],[23,174,393,146]],box=boxes[f],scale=Math.min(bolt.w/box[2],bolt.h/box[3]),w=box[2]*scale,h=box[3]*scale;c.drawImage(a.agitatorEffects,f*443.5+box[0],box[1],box[2],box[3],bolt.x+(bolt.w-w)/2,bolt.y+(bolt.h-h)/2,w,h);return true;
}
