// Censor sprite atlas (assets/censor-emerge.png): 12 cells of 128×256, baseline at y=241.
// Frames: 0–1 bulge in the papers, 2–4 growing, 5 angry at full height, 6–7 sway, 8 hit flash, 9–11 retracting.
export const CENSOR_CELL=128,CENSOR_BASE=241,CENSOR_FULL=211;
export function drawCensorSprite(c,a,frame,cx,baseY,scale=.36,flip=false){
 const image=a.censorEmerge;if(!image)return;
 const w=CENSOR_CELL*scale,h=256*scale;c.save();
 if(flip){c.translate(cx,0);c.scale(-1,1);cx=0;}
 c.drawImage(image,frame*CENSOR_CELL,0,CENSOR_CELL,256,cx-w/2,baseY-CENSOR_BASE*scale,w,h);c.restore();
}
// Library/portrait poses: sway while idle, glare on notice, grow on attack, flash when hit.
export function drawCensorPortrait(c,a,x,y,w,h,time=0,actor={}){
 const scale=Math.min(h/CENSOR_FULL,w/CENSOR_CELL)*.95;
 const frame=actor.hurtTime>0?8:actor.state==='windup'?5:['casting','blast','alarm','snap'].includes(actor.state)?3:Math.floor((actor.walkTime??time)/.15)%2?7:6;
 drawCensorSprite(c,a,frame,x+w/2,y+h-(256-CENSOR_BASE)*scale*.2,scale);
}
