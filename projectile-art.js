import {projectileFrames} from './projectile-frames.js?v=0.22.0';
import {rect} from './pixel.js?v=0.22.0';
export function projectileStyle(g,b){if(b.kind==='packet')return 2;if(b.kind==='ticker')return 3;if(b.kind==='frame')return 4;if(b.kind==='wave')return 7;const owner=b.visual||g.boss?.id;return owner==='agitator'?1:owner==='manipulator'?5:owner==='infoshum'?6:0;}
export function drawProjectile(c,a,g,b,t){
 const i=projectileStyle(g,b),frame=projectileFrames[i],w=b.w,h=b.h;c.save();c.imageSmoothingEnabled=false;
 // The complete painted body occupies exactly the collision box, not an oversized halo.
 if(b.friendly){c.fillStyle='#a9ffe8';c.fillRect(Math.round(b.x-1),Math.round(b.y+h/2),1,3);c.fillRect(Math.round(b.x+w),Math.round(b.y+h/2),1,3);}
 c.drawImage(a.projectiles,...frame,Math.round(b.x),Math.round(b.y),w,h);
 const sign=Math.sign(b.vx)||1;if(['packet','ticker'].includes(b.kind))for(let n=1;n<=2;n++){c.globalAlpha=.32/n;rect(c,b.x-sign*n*4,b.y+h*.55,3,1,b.friendly?'#a9ffe8':'#72dce7');}
 c.globalAlpha=.45;const shine=Math.floor(t*9)%Math.max(2,w-2);rect(c,b.x+shine,b.y+2,2,1,b.friendly?'#d9fff0':'#effaff');c.restore();
}
export function drawCombatEffects(c,a,effects,dt){for(const e of effects){e.time+=dt;const t=e.time/.32;if(t>=1)continue;c.save();c.globalAlpha=1-t;const color=e.kind==='parry'?'#9cfde1':e.kind==='blocked'?'#b2e9fa':'#e6d7b4';for(let i=0;i<4;i++){const angle=i*Math.PI/2+.5,spread=3+t*12;rect(c,e.x+Math.cos(angle)*spread,e.y+Math.sin(angle)*spread,3,2,color);}if(e.kind==='boltImpact'){const frame=projectileFrames[e.frame||0];c.drawImage(a.projectiles,...frame,e.x-4+t*4,e.y-4-t*6,8,8);}c.restore();}}
