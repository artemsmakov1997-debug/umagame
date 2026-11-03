import {rect} from './pixel.js?v=0.20.0';
export function drawNotebook(c,n,time){
 const x=Math.round(n.x),y=Math.round(n.y+Math.sin(time*3+n.x)*2-18*Math.pow(Math.max(0,Math.min(1,(n.readyAt-time)/.5)),2));
 c.save();c.translate(x,y);c.shadowColor='#54dded';c.shadowBlur=8;
 rect(c,-10,-13,21,27,'#030c20');rect(c,-9,-12,19,24,'#ffe3a2');c.shadowBlur=0;
 rect(c,-7,-10,15,20,'#177eaa');rect(c,-5,-8,11,16,'#0b395b');rect(c,8,-10,3,21,'#c79850');
 for(let i=0;i<4;i++){rect(c,-12,-9+i*6,6,2,'#031224');rect(c,-12,-10+i*6,5,2,'#b5eeec');}
 rect(c,-2,-3,4,5,'#ffdc7e');rect(c,-4,-6,2,3,'#ffdc7e');rect(c,2,-6,2,3,'#ffdc7e');rect(c,-3,5,7,1,'#4eabbd');
 for(let i=0;i<3;i++){const yy=-22+i*18+Math.sin(time*3+i)*3;rect(c,(i%2?17:-17),yy,2,2,i===1?'#ffe4a2':'#7be9ee');}
 c.restore();
}
