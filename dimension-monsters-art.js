// Dimension monsters (second redesign): the Кликбейт trap and the Помеха jellyfish.
// assets/clickbait-trap.png: 11 cells of 96×145, the speech bubble's bottom at y 141, centre x 48. Facing right.
//  0–2 a glitch rift tears the bubble open and the mouth climbs out, 3 the bite, 4 mouth shut on its prey,
//  5 spitting out, 6–7 crumbling to pixels; 8–10 jaws ajar, waiting for the bite.
export const TRAP={cell:[96,145],cx:48,bottom:141,scale:1.15};
export function trapFrame(e,t){
 switch(e.state){
  case 'emerge':return Math.min(2,Math.floor((1-Math.max(0,e.timer)/.2)*3));
  case 'wait':return 8+Math.floor(t*10)%3;
  case 'snap':return 3;
  case 'recover':return 4;
  case 'spit':return 5;
  case 'vanish':return e.timer>.28?6:7;
  default:return 8+Math.floor(t*4)%3;
 }
}
export function drawClickbaitTrap(c,a,e,t,frame=trapFrame(e,t)){
 const img=a.clickbaitTrap;if(!img)return false;const [cw,ch]=TRAP.cell,k=TRAP.scale,cx=e.x+e.w/2,bottom=e.y+e.h;
 c.save();c.translate(Math.round(cx),Math.round(bottom));if(e.dir<0)c.scale(-1,1);c.drawImage(img,frame*cw,0,cw,ch,-TRAP.cx*k,-TRAP.bottom*k,cw*k,ch*k);c.restore();return true;
}
export function drawClickbaitPortrait(c,a,x,y,w,h,time,actor={}){
 const img=a.clickbaitTrap;if(!img)return false;const [cw,ch]=TRAP.cell,k=Math.min(w/cw,h/ch)*1.05;
 const frame=actor.hurtTime>0?6:actor.state==='emerge'?Math.min(2,Math.floor((actor.revealTime||0)/.07)):actor.state==='snap'||actor.state==='casting'?3:actor.state==='recover'?(actor.captureTime!=null&&actor.captureTime<1?4:5):actor.state==='windup'?10:actor.moving?[8,9][Math.floor((actor.walkTime||0)*7)%2]:8+Math.floor(time*4)%3;
 c.drawImage(img,frame*cw,0,cw,ch,Math.round(x+w/2-cw*k/2),Math.round(y+h-ch*k),Math.round(cw*k),Math.round(ch*k));return true;
}
// assets/static-jelly.png: 8 cells of 96×175, dome centre at (48,72): 0–1 hovering, 2 catching the signal,
// 3 charged, 4 FIRE (the column starts at the bottom), 5 overheated, 6 hit, 7 shattered.
// assets/static-beam.png: 3 cells of 70×155 (a vertical column of static, seamless top to bottom).
// assets/static-patch.png: 3 cells of 130×56 (a glitch stripe on the floor, centre at y 28).
export const JELLY={cell:[96,175],cx:48,cy:72,scale:.95};
export function jellyFrame(e,t){
 if(e.dead)return 7;if(e.hurtTime>0)return 6;
 return e.state==='signal'?2:e.state==='charge'?3:e.state==='fire'?4:e.state==='overheat'?5:Math.floor(t*3+e.x*.01)%2;
}
export function drawStaticJelly(c,a,g,e,t,beamFloor){
 const img=a.staticJelly;if(!img)return false;const [cw,ch]=JELLY.cell,k=JELLY.scale,cx=e.x+e.w/2,cy=e.y+e.h/2+Math.sin(t*2.2+e.x*.02)*2;
 if(e.state==='fire'&&a.staticBeam&&beamFloor!==undefined){const top=cy+52,len=Math.max(0,beamFloor-top),f=Math.floor(t*14)%3;c.save();c.globalCompositeOperation='lighter';c.drawImage(a.staticBeam,f*70,0,70,155,Math.round(cx-17),Math.round(top),34,Math.round(len));c.restore();}
 c.save();c.translate(Math.round(cx),Math.round(cy));if(e.dir<0)c.scale(-1,1);c.drawImage(img,jellyFrame(e,t)*cw,0,cw,ch,-JELLY.cx*k,-JELLY.cy*k,cw*k,ch*k);c.restore();return true;
}
export function drawStaticPortrait(c,a,x,y,w,h,time,actor={}){
 const img=a.staticJelly;if(!img)return false;const [cw,ch]=JELLY.cell,k=Math.min(w/cw,h/ch)*1.1;
 const frame=actor.hurtTime>0?6:actor.state==='windup'?3:actor.state==='casting'?4:actor.moving?[0,1,2,1][Math.floor((actor.walkTime||0)*7)%4]:Math.floor(time*3)%2;
 c.drawImage(img,frame*cw,0,cw,ch,Math.round(x+w/2-cw*k/2),Math.round(y+h-ch*k*.9),Math.round(cw*k),Math.round(ch*k));return true;
}
// The glitch stripe a Помеха's column leaves on the floor: slippery while it flickers.
export function drawGlitchPatch(c,a,ink,s,t){
 if(!a.staticPatch)return false;const f=ink.time<.5?2:Math.floor(t*8)%2,w=ink.w*1.25,h=w*56/130;
 c.save();c.globalAlpha=Math.min(1,ink.time/.5);c.drawImage(a.staticPatch,f*130,0,130,56,Math.round(s.x+ink.localX+ink.w/2-w/2),Math.round(s.y-h/2),Math.round(w),Math.round(h));c.restore();return true;
}
