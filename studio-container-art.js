import {CONTAINER_ART,STUDIO_PIECES} from './studio-map.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
// Studio containers: the monster is drawn behind the tinted glass, then the container over it.
// States: 0 sealed, 1 alarm (red lamp, neon on), 2 open (capsule shutters + downward light, grate lids up, cage lamp).
// assets/studio-container-fx.png: two spark frames (100×90) for a paw clanging off the glass, then the light beam (160×250).
const FX={spark:[[0,0,100,90],[100,0,100,90]],beam:[200,0,160,250]};
export function containerState(e){
 if(e.type==='cutter')return e.state==='cutting'||e.state==='windup'&&e.timer<.35?2:e.state==='windup'?1:0;
 if(e.type==='splicer')return e.state==='pulling'?2:e.state==='windup'?1:0;
 if(e.type==='botfarm')return e.state==='printing'?2:e.alarm?1:0;
 return 0;
}
function pieceOf(e){return STUDIO_PIECES[e.platformIndex];}
// The Нарезчик's beam: from the capsule's bottom to the mark it is cutting, flickering while it aims.
function drawCutBeam(c,a,g,e,piece,x0,t){
 const cut=g.cuts?.find(k=>k.ownerId===e.id&&k.phase==='warning');if(!cut||!a.studioContainerFx)return;
 const k=piece.w/CONTAINER_ART.hang.body,fromX=x0+piece.x+piece.w/2,fromY=piece.y-6*k,dx=cut.x-fromX,dy=cut.y-fromY,len=Math.hypot(dx,dy);
 const aiming=e.state==='windup'&&e.timer>=.35;
 c.save();c.globalAlpha=aiming?.25+.2*Math.abs(Math.sin(t*14)):.85;c.globalCompositeOperation='lighter';
 c.translate(fromX,fromY);c.rotate(Math.atan2(dy,dx)-Math.PI/2);const [bx,by,bw,bh]=FX.beam,w=aiming?16:30;
 c.drawImage(a.studioContainerFx,bx,by,bw,bh,-w/2,0,w,len+6);c.restore();
}
export function drawStudioContainer(c,a,g,e,t,drawMonster){
 const piece=pieceOf(e);if(!piece||piece.type!=='container')return false;
 const art=CONTAINER_ART[piece.kind],img=a[art.key];if(!img)return false;
 const x0=rooms[e.room].x,k=piece.w/art.body,cx=x0+piece.x+piece.w/2,state=containerState(e),[cw,ch]=art.cell;
 const [gx,gy,gw,gh]=art.glass,glass={x:cx+(gx-art.cx)*k-gw*k/2,y:piece.y-(art.bottom-gy)*k-gh*k/2,w:gw*k,h:gh*k};
 if(piece.kind==='hang'){c.fillStyle='#2b2639';c.fillRect(Math.round(cx-40*k),0,2,Math.max(0,piece.y-art.bottom*k));c.fillRect(Math.round(cx+38*k),0,2,Math.max(0,piece.y-art.bottom*k));}
 // The monster, shrunk to its cell and pressed against the glass.
 const size=Math.min(glass.w*1.05,glass.h*1.35),bob=Math.sin(t*2.4+e.x*.01)*1.5,mw=size*(e.type==='botfarm'?92/82:72/68),mh=size;
 const monster=()=>{c.save();c.beginPath();c.rect(glass.x,glass.y,glass.w,glass.h);c.clip();drawMonster(c,a,e.type,glass.x+glass.w/2-mw/2,glass.y+glass.h-mh*.92+bob,mw,mh,t,e.dir<0&&e.type!=='botfarm',e);c.restore();};
 monster();
 c.drawImage(img,state*cw,0,cw,ch,Math.round(cx-art.cx*k),Math.round(piece.y-art.bottom*k),Math.round(cw*k),Math.round(ch*k));
 // The glass is tinted: show the prisoner through it once more, half-strength, so it reads clearly.
 c.save();c.globalAlpha*=.6;monster();c.restore();
 if(e.type==='cutter')drawCutBeam(c,a,g,e,piece,x0,t);
 // A paw that reached the glass only strikes sparks.
 if(e.guardFlash>0&&a.studioContainerFx){const f=FX.spark[e.guardFlash>.12?0:1];c.drawImage(a.studioContainerFx,f[0],f[1],f[2],f[3],Math.round(glass.x+glass.w/2-30),Math.round(glass.y+glass.h/2-27),60,54);}
 return true;
}
