import {rect} from './pixel.js?v=0.21.5';
import {drawSoup} from './art.js?v=0.21.5';
// A health packet standing on a little pedestal on its platform. (x, y) is the packet's centre; the pedestal's
// foot is PACK.lift (24 px) lower, on the platform. Placeholder pedestal until the dedicated sheet arrives.
export function drawPack(c,a,pack,time){
 const x=Math.round(pack.x),foot=Math.round(pack.y+24),glow=.5+.5*Math.sin(time*3+pack.x*.01);
 c.save();c.globalAlpha=.18+.14*glow;c.fillStyle='#ffe39a';c.beginPath();c.ellipse(x,pack.y-2,20,24,0,0,Math.PI*2);c.fill();c.restore();
 rect(c,x-13,foot-4,26,4,'#2a1d3d');rect(c,x-11,foot-5,22,2,'#6f5a8c');
 rect(c,x-4,foot-13,8,9,'#4b3a66');rect(c,x-3,foot-13,2,9,'#7d68a0');
 rect(c,x-10,foot-16,20,4,'#2a1d3d');rect(c,x-9,foot-16,18,2,'#8d78b2');
 drawSoup(c,a,x,pack.y-6,26);
 for(let i=0;i<3;i++)rect(c,x-11+i*10,pack.y-24-((time*18+i*7)%10),2,2,'#ffde8a');
}
