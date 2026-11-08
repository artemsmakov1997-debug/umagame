import {rect} from './pixel.js?v=0.21.5';
import {agitatorTargets} from './agitator-combat.js?v=0.21.5';
import {infoshumTargets} from './infoshum-combat.js?v=0.21.5';
import {spreaderExposed} from './spreader-combat.js?v=0.21.5';
// Boss targets: a soft pulsing glow on exactly the area a paw swing must touch, plus a small
// bobbing chevron above it. Only targets that can be hit right now are marked.
export const TARGET_GOLD='#ffd36e',TARGET_PINK='#ff7fd8';

export function bossTargets(g){
 const b=g.boss,out=[];if(!b?.active||b.hp<=0||g.mode!=='playing'&&g.mode!=='paused')return out;
 if(g.room===2&&b.id==='spreader'&&spreaderExposed(b))out.push({id:'spreader',x:b.x-4,y:b.y+6,w:b.w+8,h:b.h-6,color:TARGET_GOLD});
 const n=b.broadcast;
 // Agitator: the robot is marked only while he is open (overheated megaphone, back turned on «УРА!», on his tower).
 if(g.room===4&&n)for(const box of agitatorTargets(g))out.push({...box,color:TARGET_GOLD});
 // Infoshum: the core while his cable is anchored, the real figure stuck in the floor. The real screen is never marked.
 if(g.room===8&&b.network)for(const box of infoshumTargets(g))out.push({...box,color:TARGET_PINK});
 return out;
}

export function drawTargetHighlights(c,g,t){for(const box of bossTargets(g))drawTargetGlow(c,box,t);}
export function drawTargetGlow(c,box,t){
 {
  const pulse=.5+.5*Math.sin(t*5),cx=box.x+box.w/2;
  c.save();
  // Layered glow: wide and faint, then tighter and brighter.
  for(const [grow,alpha] of [[14,.08],[8,.12],[3,.16]]){c.globalAlpha=alpha*(.6+.4*pulse);rect(c,box.x-grow,box.y-grow,box.w+grow*2,box.h+grow*2,box.color);}
  // Corner brackets frame the exact hit area.
  c.globalAlpha=.55+.35*pulse;const L=8,x0=box.x-4,y0=box.y-4,x1=box.x+box.w+4,y1=box.y+box.h+4;
  for(const [x,y,dx,dy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]){rect(c,dx>0?x:x-L,y-(dy>0?0:2),L,2,box.color);rect(c,x-(dx>0?0:2),dy>0?y:y-L,2,L,box.color);}
  // Bobbing chevron above.
  const ay=box.y-18-Math.round(Math.abs(Math.sin(t*4))*5);c.globalAlpha=.85;
  for(let i=0;i<4;i++)rect(c,cx-7+i*2,ay+i*2,14-i*4,2,box.color);
  c.restore();
 }
}
