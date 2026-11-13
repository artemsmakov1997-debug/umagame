import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
// New monsters of the second redesign: Папарацци (Крыши), Прожектор and Журавль (Студия).
// Each has a painted strip (assets/paparazzi.png etc.). Until a strip is loaded, a stand-in made of existing
// sprites is drawn, so the gameplay works and reads before the art arrives.
// assets/paparazzi.png: 8 cells, feet on the bottom row: 0–1 idle, 2 aim, 3 charge, 4 FLASH, 5 cooling, 6 hit, 7 broken.
// assets/paparazzi-flash.png: 3 cells: star flash, ring of light, fading sparks.
export const PAPARAZZI_ART={cell:[160,157],feet:152,body:112,flash:[150,145]};
export function paparazziFrame(e,t){
 if(e.dead)return 7;if(e.hurtTime>0)return 6;
 return e.state==='aim'?2:e.state==='charge'?3:e.state==='flash'?4:e.state==='recover'&&e.timer>1.6?5:Math.floor(t*2.2)%2;
}
function stripFrame(c,img,cell,frame,cx,feet,h,body,feetRow,flip){
 const k=h/body,[cw,ch]=cell;c.save();c.translate(Math.round(cx),Math.round(feet));if(flip)c.scale(-1,1);
 c.drawImage(img,frame*cw,0,cw,ch,-cw/2*k,-feetRow*k,cw*k,ch*k);c.restore();
}
// The camera on its roof, facing Uma; the lamp charges and flashes.
export function drawPaparazzi(c,a,e,t,drawMonster){
 const cx=e.x+e.w/2,feet=e.y+e.h,frame=paparazziFrame(e,t),flip=e.dir<0;
 if(a.paparazzi)stripFrame(c,a.paparazzi,PAPARAZZI_ART.cell,frame,cx,feet,e.h+30,PAPARAZZI_ART.body,PAPARAZZI_ART.feet,flip);
 else{c.save();c.filter='grayscale(.6) sepia(.4) brightness(.9)';drawMonster(c,a,'informant',e.x-20,feet-82,84,82,t,flip,{...e,state:e.state==='flash'?'casting':e.state==='charge'?'windup':'patrol'});c.restore();}
 // The lamp and the flash: painted strip when present, a white noise burst otherwise.
 const lamp={x:cx+(flip?-10:10),y:e.y+2};
 if(e.state==='charge'){const k=1-e.timer/.85;drawFlash(c,a,0,lamp.x,lamp.y,18+k*14,.35+.5*k*(.6+.4*Math.sin(t*30)));}
 if(e.state==='flash'){const k=1-e.timer/.3;drawFlash(c,a,Math.min(2,Math.floor(k*3)),lamp.x+(flip?-30:30),lamp.y+8,150+k*90,1-k*.6);}
}
function drawFlash(c,a,frame,x,y,w,alpha){
 if(a.paparazziFlash){const [cw,ch]=PAPARAZZI_ART.flash,k=w/cw;c.save();c.globalAlpha*=alpha;c.globalCompositeOperation='lighter';c.drawImage(a.paparazziFlash,frame*cw,0,cw,ch,Math.round(x-cw*k/2),Math.round(y-ch*k/2),Math.round(cw*k),Math.round(ch*k));c.restore();return;}
 c.save();c.filter='grayscale(1) brightness(1.8)';c.globalCompositeOperation='lighter';drawAttackFx(c,a,'burst',frame,x,y,w,{alpha});c.restore();
}
// Library and notebook portrait.
export function drawPaparazziPortrait(c,a,x,y,w,h,time,actor={},drawMonster){
 const e={x,y,w,h,dir:1,state:actor.state==='casting'?'flash':actor.state==='windup'?'charge':'patrol',timer:.15,hurtTime:actor.hurtTime||0};
 if(a.paparazzi){const frame=actor.moving&&!e.hurtTime?Math.floor((actor.walkTime||0)*7)%2:paparazziFrame(e,time);stripFrame(c,a.paparazzi,PAPARAZZI_ART.cell,frame,x+w/2,y+h-2,Math.min(h*.95,w),PAPARAZZI_ART.body,PAPARAZZI_ART.feet,false);return;}
 c.save();c.filter='grayscale(.6) sepia(.4) brightness(.9)';drawMonster(c,a,'informant',x,y,w,h,time,false,actor);c.restore();
}
// Blinded: the whole view washes out white and slowly comes back.
export function drawBlind(c,g,view){
 const b=g.player.blindTime||0;if(b<=0)return;c.save();c.globalAlpha=Math.min(.85,b/.9*.85);c.fillStyle='#fffdf2';c.fillRect(g.camera-20,-20,(view||768)+40,560);c.restore();
}

// ——— Прожектор ———
// assets/spotlighter.png: 6 cells of 130×190, the truss clamp at the top, lens facing right:
// 0–1 idle, 2 aim, 3 burning, 4 overheated, 5 hit. assets/spotlighter-beam.png: 3 cells of 150×240, apex at (75,8),
// base at y≈230 and ≈123 wide: faint, medium, full.
export const SPOT_ART={cell:[130,190],scale:.63,lens:[89,95],beam:[150,240],apex:[75,8],base:222,baseW:123};
export function spotFlip(e){return (e.beamX??e.x+e.w/2)<e.x+e.w/2-4;}
export function spotLens(e){const k=SPOT_ART.scale,cx=e.x+e.w/2,off=(SPOT_ART.lens[0]-SPOT_ART.cell[0]/2)*k;return {x:cx+(spotFlip(e)?-off:off),y:SPOT_ART.lens[1]*k};}
export function spotFrame(e,t){return e.hurtTime>0?5:e.state==='aim'?2:e.state==='burn'?3:e.state==='cool'?4:Math.floor(t*1.5)%2;}
export function drawSpotlighter(c,a,g,e,t,floor){
 const k=SPOT_ART.scale,[cw,ch]=SPOT_ART.cell,cx=e.x+e.w/2,flip=spotFlip(e),lens=spotLens(e);
 // The red beam goes first, so the lamp sits on top of it.
 if(['aim','burn','cool'].includes(e.state)&&a.spotlighterBeam){
  const tx=e.beamX,ty=floor,len=Math.hypot(tx-lens.x,ty-lens.y),ang=Math.atan2(tx-lens.x,ty-lens.y),[bw,bh]=SPOT_ART.beam;
  const frame=e.state==='burn'?(e.timer>.75?1:2):0,alpha=e.state==='aim'?.35+.25*Math.abs(Math.sin(t*10)):e.state==='cool'?Math.max(0,e.timer/1.2)*.5:1;
  const sx=64/SPOT_ART.baseW,sy=len/SPOT_ART.base;
  c.save();c.globalAlpha*=alpha;c.globalCompositeOperation='lighter';c.translate(lens.x,lens.y);c.rotate(-ang);c.scale(sx,sy);c.drawImage(a.spotlighterBeam,frame*bw,0,bw,bh,-SPOT_ART.apex[0],-SPOT_ART.apex[1],bw,bh);c.restore();
 }
 if(a.spotlighter){c.save();c.translate(Math.round(cx),0);if(flip)c.scale(-1,1);c.drawImage(a.spotlighter,spotFrame(e,t)*cw,0,cw,ch,-cw/2*k,0,cw*k,ch*k);c.restore();}
}
export function drawSpotlighterPortrait(c,a,x,y,w,h,time,actor={}){
 if(!a.spotlighter)return;const [cw,ch]=SPOT_ART.cell,k=Math.min(w/cw,h/ch),frame=actor.hurtTime>0?5:actor.state==='windup'?2:actor.state==='casting'?3:Math.floor((actor.moving?(actor.walkTime||0)*7:time*1.5))%2;
 c.drawImage(a.spotlighter,frame*cw,0,cw,ch,Math.round(x+w/2-cw*k/2),Math.round(y+h-ch*k),Math.round(cw*k),Math.round(ch*k));
}
// ——— Журавль ———
// assets/boom-body.png: 4 cells of 200×185, feet at y≈180, facing right: 0 boom up, 1 wind-up, 2 swing, 3 stunned
// (mic on the floor). The hands in the swing frame are at (82,120). assets/boom-head.png: 3 cells of 220×120 (mic
// centre at (130,55)): calm, listening, striking. assets/boom-pole.png: the telescopic pole, 628×29.
export const BOOM_ART={cell:[200,185],feet:180,scale:.5,hand:[82,120],head:[220,120],mic:[130,55],headScale:.42};
export function drawBoom(c,a,e,t,box){
 if(!a.boomBody)return false;const k=BOOM_ART.scale,[cw,ch]=BOOM_ART.cell,cx=e.x+e.w/2,feet=e.y+e.h,flip=e.dir<0;
 const frame=e.state==='stunned'||e.hurtTime>0?3:e.state==='windup'?1:e.state==='sweep'?2:0;
 c.save();c.translate(Math.round(cx),Math.round(feet));if(flip)c.scale(-1,1);
 if(frame===2){c.beginPath();c.rect(-cw/2*k,-BOOM_ART.feet*k,(BOOM_ART.hand[0]+6)*k,ch*k);c.clip();}
 c.drawImage(a.boomBody,frame*cw,0,cw,ch,-cw/2*k,-BOOM_ART.feet*k,cw*k,ch*k);c.restore();
 if(frame===2&&box){
  // The telescopic pole runs out at head height; the furry mic rides its tip.
  const handX=cx+(flip?-1:1)*(BOOM_ART.hand[0]-cw/2)*k,y=box.y+box.h/2,len=Math.abs(box.tip-handX);
  if(a.boomPole){const pk=8/29;c.save();c.translate(Math.round(handX),Math.round(y));if(flip)c.scale(-1,1);c.drawImage(a.boomPole,628-Math.min(628,len/pk),0,Math.min(628,len/pk),29,0,-4,Math.min(len,628*pk),8);c.restore();}
  if(a.boomHead){const hk=BOOM_ART.headScale,[hw,hh]=BOOM_ART.head,hf=e.timer>1.7?2:1;c.save();c.translate(Math.round(box.tip),Math.round(y));if(flip)c.scale(-1,1);c.drawImage(a.boomHead,hf*hw,0,hw,hh,-BOOM_ART.mic[0]*hk,-BOOM_ART.mic[1]*hk,hw*hk,hh*hk);c.restore();}
 }
 return true;
}
export function drawBoomPortrait(c,a,x,y,w,h,time,actor={}){
 if(!a.boomBody)return;const [cw,ch]=BOOM_ART.cell,k=Math.min(w/cw,h/ch),frame=actor.hurtTime>0?3:actor.state==='windup'?1:actor.state==='casting'?2:0;
 // Idle sway: every other step the operator bobs down a little.
 const bob=frame===0&&actor.moving&&Math.floor((actor.walkTime||0)*7)%2?3:0;
 c.drawImage(a.boomBody,frame*cw,0,cw,ch,Math.round(x+w/2-cw*k/2),Math.round(y+h-ch*k+bob),Math.round(cw*k),Math.round(ch*k));
}
