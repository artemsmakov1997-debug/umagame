import {rect,text} from './pixel.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
import {STUDIO_PIECES,SPOTLIGHTS,STUDIO_DOOR} from './studio-map.js?v=0.21.5';
import {spotSpan,liveTake,fakesFor,ROOM} from './studio-systems.js?v=0.21.5';
// assets/studio-platforms.png: holograms (solid / warning / gone), stage risers (lit / dark), red and blue takes (live / idle),
// each as left cap, repeatable middle and right cap; then the camera dolly, a truss section and a flight case.
const P={
 holoSolid:[[34,95,124,80],[172,95,204,80],[389,95,114,80]],holoWarn:[[535,95,122,80],[672,95,204,80],[889,95,114,80]],holoGone:[[1039,96,116,78],[1170,96,200,78],[1385,96,116,78]],
 stageLit:[[67,279,156,100],[233,279,316,100],[559,279,159,100]],stageDark:[[806,279,154,99],[971,279,319,99],[1299,279,159,99]],
 redLive:[[28,480,168,93],[208,480,354,93],[574,480,164,93]],redIdle:[[794,480,168,96],[974,480,354,96],[1340,480,166,96]],
 blueLive:[[28,612,168,94],[208,612,353,94],[574,612,164,94]],blueIdle:[[794,602,168,104],[974,602,354,104],[1340,602,166,104]],
 dolly:[35,751,443,248],truss:[535,843,459,156],case:[1078,838,410,158]
};
// assets/studio-set.png: spotlight (left/down/right), ceiling truss, clapper (open/closed), sign (off/on), camera, boom, monitor, cable, door (closed/open).
const Q={spotL:[113,10,177,202],spotD:[427,10,174,202],spotR:[727,10,172,202],rail:[1036,67,443,94],clapOpen:[104,243,199,181],clapShut:[433,288,207,137],
 signOff:[777,296,279,120],signOn:[1152,296,280,120],camera:[108,459,238,251],boom:[467,457,288,253],monitor:[882,470,173,243],cable:[1198,572,240,138],doorShut:[271,741,347,268],doorOpen:[845,741,404,275]};
const DECOR=[{key:'camera',x:150,bottom:400,h:62},{key:'cable',x:40,bottom:400,h:18},{key:'boom',x:690,bottom:352,h:60},{key:'cable',x:1440,bottom:300,h:16},{key:'monitor',x:1930,bottom:262,h:46}];
const RISER_Y=310;
const X0=()=>rooms[ROOM].x;
const blit=(c,image,box,x,y,w,h)=>c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));
function strip(c,image,set,x,y,w,h){
 const [L,M,R]=set,k=h/M[3],lw=Math.min(L[2]*k,w/2),rw=Math.min(R[2]*k,w/2),mw=M[2]*k;
 c.save();c.beginPath();c.rect(x-2,y-4,w+4,h+8);c.clip();
 for(let xx=x+lw-2;xx<x+w-rw+2;xx+=mw-2)blit(c,image,M,xx,y,mw,h);
 blit(c,image,L,x,y,lw,h);blit(c,image,R,x+w-rw,y,rw,h);c.restore();
}
function setFor(piece,state){
 if(piece.type==='holo')return state==='gone'?P.holoGone:state==='warn'?P.holoWarn:P.holoSolid;
 if(piece.type==='stage')return state==='dark'?P.stageDark:P.stageLit;
 if(piece.type==='take')return P[piece.color+(state==='idle'?'Idle':'Live')];
}
function drawPiece(c,a,piece,x,y,state,t){
 const image=a.studioPlatforms;
 if(piece.type==='fixed'){
  if(piece.kind==='truss'){const h=40,k=h/P.truss[3],tw=P.truss[2]*k;c.save();c.beginPath();c.rect(x,y-2,piece.w,h+4);c.clip();for(let xx=x;xx<x+piece.w;xx+=tw-3)blit(c,image,P.truss,xx,y-1,tw,h);c.restore();return;}
  const box=P[piece.kind],k=piece.w/box[2],h=box[3]*k,top=piece.kind==='dolly'?117*k:4*k;blit(c,image,box,x,y-top,piece.w,h);return;
 }
 const set=setFor(piece,state),h=piece.type==='holo'?18:piece.type==='stage'?22:21;
 c.save();
 if(piece.type==='holo'&&state==='warn')c.globalAlpha=.55+.45*Math.abs(Math.sin(t*22));
 if(piece.type==='holo'&&state==='back')c.globalAlpha=.6;
 if(piece.type==='take'&&state==='swap')c.globalAlpha=.55+.45*Math.abs(Math.sin(t*16));
 strip(c,image,set,x,y-2,piece.w,h);c.restore();
}

export function drawStudioSurface(c,a,g,s){
 if(s.room!==ROOM||!s.studio||!a.studioPlatforms)return false;const piece=s.studio,x=X0()+piece.x;
 // A Нарезчик cut splits the surface into pieces: draw the whole prop, clipped to this piece, with ragged ends at the hole.
 if(Math.abs(s.w-piece.w)<.5){drawPiece(c,a,piece,s.x,s.y,s.studioState,g.time);return true;}
 c.save();c.beginPath();c.rect(s.x,s.y-140,s.w,300);c.clip();drawPiece(c,a,piece,x,s.y,s.studioState,g.time);c.restore();
 for(const [edge,dir]of [[s.x,1],[s.x+s.w,-1]])if(Math.abs(edge-x)>1&&Math.abs(edge-x-piece.w)>1)for(let k=0;k<5;k++)rect(c,edge-(dir<0?3:0)+dir*((k%2)*3),s.y+k*6,3,5,k%2?'#ffd56a':'#20121c');
 return true;
}
// Spotlight cones and the ceiling truss go behind the risers.
export function drawStudioBack(c,a,g,t){
 if(g.room!==ROOM||!a.studioSet)return;const x0=X0(),rail=Q.rail,rk=26/rail[3],rw=rail[2]*rk;
 for(let x=x0+780;x<x0+1530;x+=rw-4)blit(c,a.studioSet,rail,x,2,rw,26);
 for(const light of SPOTLIGHTS){const span=spotSpan(light,t),lx=x0+light.x,ly=58,sx=x0+span.x,cx=x0+span.center;
  const cone=c.createLinearGradient(0,ly,0,RISER_Y);cone.addColorStop(0,'#ffd27a88');cone.addColorStop(1,'#ffb35a22');
  c.save();c.fillStyle=cone;c.beginPath();c.moveTo(lx-8,ly);c.lineTo(lx+8,ly);c.lineTo(sx+span.w,RISER_Y+6);c.lineTo(sx,RISER_Y+6);c.closePath();c.fill();
  c.globalAlpha=.35;c.fillStyle='#fff1c0';c.beginPath();c.ellipse(cx,RISER_Y+4,span.w/2,6,0,0,Math.PI*2);c.fill();
  c.globalAlpha=.6;for(let i=0;i<8;i++){const k=((t*.3+i*.13)%1),px=lx+(cx-lx)*k+Math.sin(i*3+t)*span.w*.25*k,py=ly+(RISER_Y-ly)*k;rect(c,px,py,1,1,'#ffe9b0');}c.restore();
  const angle=cx-lx,box=angle<-40?Q.spotL:angle>40?Q.spotR:Q.spotD,k=48/box[3];blit(c,a.studioSet,box,lx-box[2]*k/2,14,box[2]*k,48);
 }
}
export function drawStudioProps(c,a,g,t){
 if(g.room!==ROOM||!a.studioSet)return;const x0=X0();
 for(const d of DECOR){const box=Q[d.key],k=d.h/box[3];blit(c,a.studioSet,box,x0+d.x,d.bottom-d.h+1,box[2]*k,d.h);}
 // «В ЭФИРЕ» board over the takes and the clapper that snaps on every swap.
 const live=liveTake(t),sign=live.warn?(Math.floor(t*8)%2?Q.signOn:Q.signOff):Q.signOn,sk=34/sign[3],sw=sign[2]*sk,sx=x0+1660,sy=150;
 rect(c,sx+sw*.25,0,2,sy,'#2a2434');rect(c,sx+sw*.75,0,2,sy,'#2a2434');blit(c,a.studioSet,sign,sx,sy,sw,34);
 text(c,'В ЭФИРЕ',sx+sw/2-21,sy+8,'#fff1e6',1,1);text(c,live.color==='red'?'ДУБЛЬ 1':'ДУБЛЬ 2',sx+sw/2-21,sy+19,live.color==='red'?'#ffb0a8':'#a8c8ff',1,1);
 const clap=live.warn?Q.clapOpen:Q.clapShut,ck=30/clap[3];blit(c,a.studioSet,clap,x0+1532,300-30,clap[2]*ck,30);
 // The pavilion door: shut while a studio transmitter still works.
 const open=!g.relays.some(d=>d.room===ROOM&&d.hp>0),door=open?Q.doorOpen:Q.doorShut,dk=STUDIO_DOOR.h/door[3];blit(c,a.studioSet,door,x0+STUDIO_DOOR.x,STUDIO_PIECES[14].y-STUDIO_DOOR.h+3,door[2]*dk,STUDIO_DOOR.h);
 // Дипфейк's fakes: the same pieces, but trembling, striped and without the real outline.
 for(const f of fakesFor(g)){if(!f.active)continue;const x=x0+f.x+Math.round(Math.sin(t*31+f.owner)*1.2),state=f.type==='stage'?'lit':f.type==='take'?'live':'solid';
  c.save();c.globalAlpha=.8;drawPiece(c,a,f,x,f.y,state,t);c.globalCompositeOperation='lighter';c.globalAlpha=.18;drawPiece(c,a,f,x+2,f.y,state,t);c.globalCompositeOperation='source-over';c.globalAlpha=.35;
  for(let y=f.y-2;y<f.y+20;y+=3)rect(c,x,y,f.w,1,'#100820');if(Math.floor(t*6+f.owner)%5===0){c.globalAlpha=.5;rect(c,x+((t*90)%f.w),f.y-2,6,22,'#ff6ad5');}c.restore();}
}
// Library portrait / in-game Дипфейк: assets/deepfake.png, 3×2 cells of 512×512 — hover ×2, notice, project, hit, dissolve.
const DF_PIVOT=[[240,270],[750,280],[1290,270],[250,780],[770,790],[1290,790]];
export function drawDeepfakePortrait(c,a,x,y,w,h,time=0,actor={}){
 if(!a.deepfake)return;const frame=actor.dead?5:actor.hurtTime>0?4:actor.state==='casting'?3:actor.state==='windup'||actor.noticeTime>0?2:Math.floor((actor.walkTime??time)*7)%2,col=frame%3,row=frame/3|0,scale=Math.min(w,h)/360;
 c.save();c.translate(Math.round(x+w/2),Math.round(y+h/2));if(actor.dir<0)c.scale(-1,1);
 c.drawImage(a.deepfake,col*512,row*512,512,512,-(DF_PIVOT[frame][0]-col*512)*scale,-(DF_PIVOT[frame][1]-row*512)*scale,512*scale,512*scale);c.restore();
}
