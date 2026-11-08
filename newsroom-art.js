import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {PRESSES,PRESS_W,PRESS_H,PRESS_REST,PRESS_SLAM,PRESS_HOLD,PRESS_CYCLE,pressState,BELT_TOP,BELT_SPEED,CENSOR} from './newsroom-systems.js?v=0.21.5';
import {drawCensorSprite} from './censor-art.js?v=0.21.5';
// Newsroom conveyor art. Atlases: newsroom-conveyor.png (tile | left drive end | right end, stored at 2×),
// newsroom-papers.png (newspapers riding the belt, 2×), newsroom-press-frames.png (the press, 4 states), censor-emerge.png.
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

// Behind the platforms: the hydraulic presses (assets/newsroom-press-frames.png, 4 cells of 190×252:
// raised, shaking before the slam, slammed with dust, rising). The sprite stands on the belt; its platen matches
// the collision head: bottom at PRESS_REST+PRESS_H when raised and at the belt when slammed.
export const PRESS_SPRITE={w:190,h:252,scale:1.434,platen:165.5};
export function pressFrame(s){if(s.drop===0)return s.warn?1:0;const rising=s.phase>=PRESS_HOLD;if(rising)return s.drop>.35?3:0;return s.drop>.5?2:3;}
export function drawNewsroomScenery(c,a,g,t){
 if(g.room!==1)return;const image=a.newsroomPressFrames,r=rooms[1];if(!image)return;const S=PRESS_SPRITE,w=S.w*S.scale,h=S.h*S.scale,top=PRESS_REST+PRESS_H-S.platen*S.scale;
 for(const press of PRESSES){
  const cx=r.x+press.x+PRESS_W/2;if(!visible(g,cx-w/2,w))continue;
  const s=pressState(press,t),frame=pressFrame(s),shake=s.warn?Math.round(Math.sin(t*40)):0;
  // A soft shadow behind the machine lifts it off the wall.
  c.save();c.globalAlpha=.35;c.fillStyle='#02040c';c.fillRect(Math.round(cx-w/2+10),Math.round(top+18),Math.round(w-8),Math.round(BELT_TOP-top-14));c.restore();
  c.drawImage(image,frame*S.w,0,S.w,S.h,Math.round(cx-w/2+shake),Math.round(top),Math.round(w),Math.round(h));
 }
}

// Over the platforms: press shadows and paper bursts, then Censors.
export function drawNewsroomMachines(c,g,t,a){
 if(g.room!==1)return;const r=rooms[1];
 for(const press of PRESSES){
  const x=r.x+press.x;if(!visible(g,x-30,PRESS_W+60))continue;const s=pressState(press,t),cx=x+PRESS_W/2;
  // Danger stripes on the belt under the press while it is about to slam or down.
  if(a?.newsroomStripe&&(s.warn||s.drop>0)){const blink=s.warn&&Math.floor(t*8)%2===0;c.save();c.globalAlpha=s.drop>0?.95:blink?.95:.55;c.drawImage(a.newsroomStripe,0,0,170,40,Math.round(x),BELT_TOP-6,PRESS_W,12);c.restore();}
  // Paper dust bursts out when the platen hits the belt.
  if(a?.newsroomDust&&s.drop>0&&s.phase>=PRESS_SLAM){const k=Math.min(.999,(s.phase-PRESS_SLAM)/(PRESS_CYCLE-PRESS_SLAM)),frame=Math.min(2,Math.floor(k*3));c.save();c.globalAlpha=1-k*.6;c.drawImage(a.newsroomDust,frame*135,0,135,85,Math.round(cx-PRESS_W*.75),BELT_TOP-62,Math.round(PRESS_W*1.5),62);c.restore();}
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
