import {rect} from './pixel.js?v=0.21.5';
// Readability layer: gameplay surfaces must never melt into the painted backdrops.
// 1. A dark veil calms each location's backdrop (stronger where the painting is busy).
// 2. Every solid surface gets a cast shadow below and a bright rim exactly on its collision top,
//    with end caps so its width reads at a glance. Moving surfaces use a cyan rim.
export const BACKDROP_VEIL={1:.1,2:.16,3:.16,4:.3,5:.18,6:.2,7:.18,8:.2};
export const RIM={1:'#ffe7a8',2:'#ffe7a8',3:'#ffd58f',4:'#ffe08a',5:'#ffd58f',6:'#ffd36e',7:'#9ff3ff',8:'#9ff7ff'};
const MOVING_RIM='#7ff3ff';

export function drawBackdropVeil(c,g,cam,vw){
 const alpha=BACKDROP_VEIL[g.room];if(!alpha)return;
 c.save();c.globalAlpha=alpha;c.fillStyle='#020716';c.fillRect(cam-40,0,vw+80,480);c.restore();
}
export function drawPlatformShadow(c,g,p){
 if(!RIM[g.room])return;
 c.save();c.globalAlpha=.5;rect(c,p.x+4,p.y+12,p.w-4,10,'#00030b');c.globalAlpha=.25;rect(c,p.x+8,p.y+22,p.w-12,6,'#00030b');c.restore();
}
export function drawPlatformRim(c,g,p,t){
 const color=p.motion?MOVING_RIM:RIM[g.room];if(!color)return;
 const x=Math.round(p.x),y=Math.round(p.y),w=Math.round(p.w);
 rect(c,x-2,y-4,w+4,2,'#01040b');           // dark line separates the rim from bright skies
 c.save();c.globalAlpha=.22;rect(c,x,y-7,w,3,color);c.restore(); // soft glow above the walkable edge
 rect(c,x,y-2,w,2,color);                   // the walkable edge itself
 rect(c,x-2,y-2,2,8,color);rect(c,x+w,y-2,2,8,color);rect(c,x-2,y+6,2,2,'#01040b');rect(c,x+w,y+6,2,2,'#01040b');
}
