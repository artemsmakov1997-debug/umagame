import {rect,text,heart} from './pixel.js?v=0.9.0';
import {creatures,sprite} from './assets.js?v=0.9.0';
import {MAX_HEALTH,START_LIVES} from './level.js?v=0.9.0';
export function catLife(c,x,y,on=true){
 const rows=['1100000000011','1110000000111','1111000001111','1111111111111','0111111111110','0111111111110','0111111111110','0011111111100','0001111111000'];
 rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')rect(c,x+i,y+j,1,1,on?'#a8a4a0':'#304254');}));
 rect(c,x+1,y+1,2,2,on?'#e7a4a0':'#304254');rect(c,x+10,y+1,2,2,on?'#e7a4a0':'#304254');
 if(on){rect(c,x+3,y+5,2,2,'#c9f15a');rect(c,x+8,y+5,2,2,'#c9f15a');rect(c,x+6,y+7,1,1,'#e8acaa');}
}
export function drawHud(c,assets,g,width){
 rect(c,0,0,width,47,'#030a1eea');
 c.save();c.scale(2,2);for(let i=0;i<MAX_HEALTH;i++)heart(c,4+i*10,4,i<g.health);c.restore();
 sprite(c,assets.noise,creatures.fish,8,28,21,13);text(c,String(g.fish).padStart(2,'0'),35,31,'#ffe5a4',1);
 c.save();c.scale(2,2);for(let i=0;i<START_LIVES;i++)catLife(c,width/2-53+i*17,4,i<g.lives);c.restore();
 if(g.boss.active&&g.boss.hp>0){const w=Math.min(width-36,270),x=(width-w)/2;rect(c,x,51,w,5,'#243247');rect(c,x,51,w*g.boss.hp/g.boss.maxHp,5,'#ff7183');}
}
