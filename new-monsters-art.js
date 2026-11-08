import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
// New monsters of the second redesign: Папарацци (Крыши), Прожекторщик and Журавль (Студия).
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
 if(a.paparazzi){const frame=paparazziFrame(e,time);stripFrame(c,a.paparazzi,PAPARAZZI_ART.cell,frame,x+w/2,y+h-2,Math.min(h*.95,w),PAPARAZZI_ART.body,PAPARAZZI_ART.feet,false);return;}
 c.save();c.filter='grayscale(.6) sepia(.4) brightness(.9)';drawMonster(c,a,'informant',x,y,w,h,time,false,actor);c.restore();
}
// Blinded: the whole view washes out white and slowly comes back.
export function drawBlind(c,g,view){
 const b=g.player.blindTime||0;if(b<=0)return;c.save();c.globalAlpha=Math.min(.85,b/.9*.85);c.fillStyle='#fffdf2';c.fillRect(g.camera-20,-20,(view||768)+40,560);c.restore();
}
