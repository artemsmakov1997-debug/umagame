import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {studioDock} from './manipulator-combat.js?v=0.21.5';

// Consistent pivots: every pose uses the same 256px cell and bottom baseline.
export function drawManipulatorPose(c,a,row,frame,x,y,w,h,flip=false){
 const image=a.manipulator;if(!image?.naturalWidth)return;
 c.save();c.translate(x+w/2,y+h);if(flip)c.scale(-1,1);c.imageSmoothingEnabled=false;
 const feet=[[231,227,229,230],[227,226,226,226],[229,229,229,229],[228,228,228,228],[228,228,225,228],[226,226,226,229]][row][frame];
 const scale=Math.min(w/256,h/230);c.drawImage(image,frame*256,row*256,256,256,-128*scale,-feet*scale,256*scale,256*scale);c.restore();
}
export function drawStudioBackdrop(c,a,g,t){
 if(g.room!==6)return;const r=rooms[6],image=a.studioArena;
 c.drawImage(image,0,0,image.width,600,r.x,0,r.width,422);
 c.drawImage(image,0,600,image.width,image.height-600,r.x,422,r.width,58);
 for(const [x,w]of[[210,310],[895,425]]){
  rect(c,r.x+x,422,w,58,'#060b22');
  for(let i=0;i<w;i+=14){const h=14+(i*7+Math.floor(t*30))%40;rect(c,r.x+x+i,480-h,2,h,'#ad3ee955');}
  rect(c,r.x+x,475,w,5,'#bd42f0');
 }
}
export function drawStudioPlatform(c,a,p,t){
 const phase=p.studioPhase||'solid',col=phase==='warning'?1:phase==='gap'?2:phase==='forming'?3:0;
 const image=a.studioProps;
 // Glow and hologram are drawn around the same collision-aligned steel top.
 c.save();if(phase==='forming')c.globalAlpha=.25+.65*(1-(p.studioTimer||0)/.35);c.drawImage(image,col*443.5,115,443.5,250,p.x-7,p.y-23,p.w+14,48);c.restore();
 if(phase==='warning'){const alpha=.45+.4*Math.abs(Math.sin(t*18));c.save();c.globalAlpha=alpha;rect(c,p.x+4,p.y-2,p.w-8,2,'#ff99e4');c.restore();}
 if(!p.studioPlatform&&p.y<400){
  for(const xx of[p.x+10,p.x+p.w-12]){
   rect(c,xx,0,2,p.y,'#263c5b');for(let y=8;y<p.y;y+=24)rect(c,xx-1,y,4,3,'#5e6990');
  }
  c.drawImage(image,86,493,294,344,p.x+6,p.y+9,38,44);
 }
}
export function drawManipulator(c,a,g,t){
 const b=g.boss,n=b.studio;if(!n)return;
 const row=n.mode==='rewrite'?1:n.mode==='charge'?2:n.mode==='beam'?3:n.mode==='relocate'?4:n.mode==='recover'||b.hurtTime>0?5:0;
 const frame=n.mode==='relocate'?Math.min(3,Math.floor((.9-n.timer)/.225)):n.mode==='charge'?Math.min(3,Math.floor((1.05-n.timer)/.263)):Math.floor(t*6)%4;
 drawManipulatorPose(c,a,row,frame,b.x-14,b.y-36,b.w+28,b.h+36,b.dir<0);
 if(n.mode==='relocate'){
  const s=studioDock(g,n.to);c.save();c.globalAlpha=.35;drawManipulatorPose(c,a,4,1,s.x+(s.w-128)/2,s.y-114,128,114);c.restore();
 }
 if(n.beam&&['charge','beam'].includes(n.mode)){
  const beam=n.beam,y=beam.y+6;
  if(n.mode==='charge'){
   c.save();c.globalAlpha=.45+.3*Math.abs(Math.sin(t*12));for(let x=beam.x;x<beam.x+beam.w;x+=13)rect(c,x,y,7,2,'#ff78d2');c.restore();
  }else{
   // Detailed energy strip repeats without stretching its end caps.
   for(let x=beam.x;x<beam.x+beam.w;x+=60){const w=Math.min(60,beam.x+beam.w-x);c.drawImage(a.studioProps,920,630,w/60*390,100,x,y-7,w,14);}
   rect(c,beam.x,y-1,beam.w,2,'#fff5ed');
  }
 }
 if(n.mode==='recover')for(const x of[b.x-5,b.x+b.w+3]){rect(c,x,b.y+4,2,13,'#bfff99');rect(c,x,b.y+4,8,2,'#bfff99');}
}
