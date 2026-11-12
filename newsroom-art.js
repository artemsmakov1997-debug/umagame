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

// Desks, catwalks, newspaper piles and the small hanging pieces (assets/newsroom-platforms.png). Strips are three
// pieces — left cap, repeatable middle, right cap; t = the walkable top line inside the piece.
const NP={"deskL":{"r":[0,0,221,101],"t":[23.0]},"deskM":{"r":[223,0,274,96],"t":[18.0]},"deskR":{"r":[499,0,220,114],"t":[37.0]},"walkL":{"r":[721,0,216,95],"t":[35.5]},"walkM":{"r":[0,116,269,87],"t":[35.5]},"walkR":{"r":[271,116,214,95],"t":[35.5]},"pileL":{"r":[487,116,217,76],"t":[24.0]},"pileM":{"r":[706,116,268,54],"t":[6.5]},"pileR":{"r":[0,213,214,76],"t":[25.5]},"shelfL":{"r":[216,213,230,94],"t":[42.0]},"shelfM":{"r":[448,213,276,76],"t":[41.0]},"shelfR":{"r":[726,213,229,94],"t":[42.0]},"lamp":{"r":[0,309,148,68],"t":[2.5]},"books":{"r":[150,309,158,81],"t":[3.0]},"crate":{"r":[310,309,152,88],"t":[23.5]}};
const NEWS_KIND={'1:1':'desk','1:2':'pile','1:3':'walk','1:4':'desk','1:5':'books','1:6':'lamp','2:3':'walk','2:4':'walk'};
const NEWS_K={desk:.42,walk:.4,pile:.42,shelf:.4};
function cut(c,img,p,sx,sw,x,y,k){if(sw<=0)return;c.drawImage(img,p.r[0]+sx,p.r[1],sw,p.r[3],Math.round(x),Math.round(y-p.t[0]*k),Math.ceil(sw*k),Math.round(p.r[3]*k));}
export function newsroomPlatformKind(p){return NEWS_KIND[p.id]||null;}
export function drawNewsroomPlatform(c,a,p){
 const kind=NEWS_KIND[p.id],img=a.newsroomPlatforms;if(!kind||!img?.complete||!img.naturalWidth)return false;
 const x=Math.round(p.x),y=Math.round(p.y),w=Math.round(p.w);
 if(NP[kind]){const q=NP[kind],k=w*1.08/q.r[2];cut(c,img,q,0,q.r[2],x-w*.04,y,k);return true;}
 const L=NP[kind+'L'],M=NP[kind+'M'],R=NP[kind+'R'],k=NEWS_K[kind],lw=L.r[2]*k,rw=R.r[2]*k;
 if(w<lw+rw){const half=w/2/k;cut(c,img,L,0,half,x,y,k);cut(c,img,R,R.r[2]-half,half,x+w/2,y,k);return true;}
 cut(c,img,L,0,L.r[2],x,y,k);cut(c,img,R,0,R.r[2],x+w-rw,y,k);
 for(let xx=x+lw;xx<x+w-rw;xx+=M.r[2]*k){const left=Math.min(M.r[2],(x+w-rw-xx)/k);cut(c,img,M,0,left,xx,y,k);}
 return true;
}

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
  const f=outlinedPress(image,frame,Math.round(w),Math.round(h));c.drawImage(f,Math.round(cx-w/2+shake)-1,Math.round(top)-1);
 }
}
// A thin warm rim (the colour of the belt's edge) traced around the press so it reads as part of the conveyor and
// not as a picture on the wall. Frames are outlined once at draw size and cached.
const pressCache=new Map();
function outlinedPress(image,frame,w,h){
 const key=frame+':'+w+'x'+h;let o=pressCache.get(key);if(o)return o;
 o=document.createElement('canvas');o.width=w+2;o.height=h+2;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
 const sil=document.createElement('canvas');sil.width=w+2;sil.height=h+2;const s=sil.getContext('2d');s.imageSmoothingEnabled=false;
 s.drawImage(image,frame*PRESS_SPRITE.w,0,PRESS_SPRITE.w,PRESS_SPRITE.h,1,1,w,h);s.globalCompositeOperation='source-in';s.fillStyle='#d9ae5f';s.fillRect(0,0,w+2,h+2);
 x.globalAlpha=.8;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])x.drawImage(sil,dx,dy);x.globalAlpha=1;
 x.drawImage(image,frame*PRESS_SPRITE.w,0,PRESS_SPRITE.w,PRESS_SPRITE.h,1,1,w,h);
 pressCache.set(key,o);return o;
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
