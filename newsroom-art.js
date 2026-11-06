import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {PRESSES,PRESS_W,pressState,BELT_TOP,BELT_SPEED,CENSOR} from './newsroom-systems.js?v=0.21.5';
import {drawCensorSprite} from './censor-art.js?v=0.21.5';
// Newsroom conveyor art. Atlases: newsroom-conveyor.png (tile | left drive end | right end, stored at 2×),
// newsroom-papers.png (newspapers riding the belt, 2×), newsroom-press.png (frame, head, lamps, 1×), censor-emerge.png.
const TILE=[0,0,208,89],BAND=13,LEFT=[216,0,316,145],LEFT_TOP=57,RIGHT=[540,0,300,112],RIGHT_TOP=24;
const PAPERS=[[0,0,67,49],[71,0,70,41],[145,0,81,42],[299,0,73,57],[376,0,41,42],[421,0,86,52],[552,0,57,46]];
const FRAME=[0,0,132,282],HEAD=[140,0,153,65],LAMP_OFF=[140,72,19,18],LAMP_ON=[166,70,22,24],LAMP_AT=[61,4],CYLINDER_BOTTOM=97,ROD=[59,15];
const ROD_COLORS=['#0a0e26','#3b4d85','#796a84','#edd5ae','#0d1129'];
const visible=(g,x,w,margin=40)=>x+w>g.camera-margin&&x<g.camera+(g.viewWidth||768)+margin;
function part(c,image,box,x,y,scale=1){c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),box[2]*scale,box[3]*scale);}

// The conveyor itself, drawn in place of the generic surface of platform 1:0.
export function drawNewsroomConveyor(c,a,g,t){
 const image=a.newsroomConveyor,r=rooms[1];if(!image)return;
 const tw=TILE[2]/2,th=TILE[3]/2,band=BAND/2,shift=((t*-BELT_SPEED)%tw+tw)%tw;
 for(let x=r.x-tw;x<r.end+tw;x+=tw){
  if(!visible(g,x,tw))continue;
  // Static frame below the belt band; the band itself scrolls left with the belt.
  c.drawImage(image,TILE[0],TILE[1]+BAND,TILE[2],TILE[3]-BAND,Math.round(x),BELT_TOP+band,tw,th-band);
  c.drawImage(image,TILE[0],TILE[1],TILE[2],BAND,Math.round(x-shift),BELT_TOP,tw,band);
  c.drawImage(image,TILE[0],TILE[1],TILE[2],BAND,Math.round(x-shift+tw),BELT_TOP,tw,band);
 }
 if(visible(g,r.x,LEFT[2]/2))part(c,image,LEFT,r.x-20,BELT_TOP-LEFT_TOP/2,.5);
 if(visible(g,r.end-RIGHT[2]/2,RIGHT[2]/2))part(c,image,RIGHT,r.end-RIGHT[2]/2+16,BELT_TOP-RIGHT_TOP/2,.5);
 // Newspapers riding the belt.
 const papers=a.newsroomPapers;if(!papers)return;
 for(let i=0;i<26;i++){
  const box=PAPERS[i%PAPERS.length],w=box[2]/2,h=box[3]/2,span=r.width+80;
  const x=r.x-40+(((i*397+Math.floor(i/7)*131+t*BELT_SPEED)%span)+span)%span;
  if(visible(g,x,w))c.drawImage(papers,box[0],box[1],box[2],box[3],Math.round(x),BELT_TOP-h+3,w,h);
 }
}

// Behind the platforms: press frames, rods and heads.
export function drawNewsroomScenery(c,a,g,t){
 if(g.room!==1)return;const image=a.newsroomPress,r=rooms[1];if(!image)return;
 for(const press of PRESSES){
  const cx=r.x+press.x+PRESS_W/2;if(!visible(g,cx-80,160))continue;
  const s=pressState(press,t),fx=cx-FRAME[2]/2,fy=474-FRAME[3],shake=s.warn?Math.round(Math.sin(t*40)):0;
  part(c,image,FRAME,fx,fy);
  const lit=s.warn?Math.floor(t*8)%2===0:s.drop>0;
  part(c,image,lit?LAMP_ON:LAMP_OFF,fx+LAMP_AT[0]-(lit?2:0),fy+LAMP_AT[1]-(lit?4:0));
  const top=Math.round(s.top),rodTop=fy+CYLINDER_BOTTOM;
  for(const [i,color] of ROD_COLORS.entries())rect(c,fx+ROD[0]+i*3+shake,rodTop,3,top-rodTop+6,color);
  part(c,image,HEAD,cx-HEAD[2]/2+shake,top);
 }
}

// Over the platforms: press shadows and paper bursts, then Censors.
export function drawNewsroomMachines(c,g,t,a){
 if(g.room!==1)return;const r=rooms[1];
 for(const press of PRESSES){
  const x=r.x+press.x;if(!visible(g,x,PRESS_W))continue;const s=pressState(press,t);
  if(s.warn||s.drop>0){
   // A shadow on the belt grows as the slam approaches: stand clear of it.
   const k=s.drop>0?1:Math.min(1,(s.phase-2.4)/1);c.save();c.globalAlpha=.25+.35*k;rect(c,x+6,BELT_TOP-3,PRESS_W-12,4,'#05070f');
   if(s.warn&&Math.floor(t*8)%2===0){c.globalAlpha=.55;rect(c,x+6,BELT_TOP-3,6,4,'#ff4a4a');rect(c,x+PRESS_W-12,BELT_TOP-3,6,4,'#ff4a4a');}
   c.restore();
  }
  if(s.drop===1){c.save();c.globalAlpha=.7;for(let k=0;k<8;k++)rect(c,x+6+k*(PRESS_W-12)/7,BELT_TOP-4-((k*7+Math.floor(t*30))%9),5,2,'#f2e6c8');c.restore();}
 }
 if(!a)return;
 for(const censor of g.censors||[]){
  if(!visible(g,censor.x-30,60))continue;
  let frame;
  if(censor.phase==='warn')frame=censor.time<CENSOR.warn/2?0:1;
  else if(censor.phase==='grow')frame=2+Math.min(2,Math.floor(censor.time/CENSOR.grow*3));
  else if(censor.phase==='retract')frame=9+Math.min(2,Math.floor(censor.time/CENSOR.retract*3));
  else frame=censor.flash>0?8:censor.time<.3?5:Math.floor(censor.time*3)%2?7:6;
  drawCensorSprite(c,a,frame,censor.x,BELT_TOP+2,.36,Math.floor(censor.source)%2===1);
 }
}
