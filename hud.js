import {rect,text,heart} from './pixel.js?v=0.12.0';
import {creatures,sprite} from './assets.js?v=0.12.0';
import {MAX_HEALTH,START_LIVES} from './level.js?v=0.12.0';
export function catLife(c,x,y,on=true){
 const rows=['1100000000011','1110000000111','1111000001111','1111111111111','0111111111110','0111111111110','0111111111110','0011111111100','0001111111000'];
 rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')rect(c,x+i,y+j,1,1,on?'#a8a4a0':'#304254');}));
 rect(c,x+1,y+1,2,2,on?'#e7a4a0':'#304254');rect(c,x+10,y+1,2,2,on?'#e7a4a0':'#304254');
 if(on){rect(c,x+3,y+5,2,2,'#c9f15a');rect(c,x+8,y+5,2,2,'#c9f15a');rect(c,x+6,y+7,1,1,'#e8acaa');}
}
function drawCounters(c,assets,g,width){
 c.save();c.scale(2,2);for(let i=0;i<MAX_HEALTH;i++)heart(c,5+i*10,5,i<g.health);c.restore();
 sprite(c,assets.noise,creatures.fish,10,29,21,13);text(c,String(g.fish).padStart(2,'0'),37,32,'#ffe5a4',1);
 c.save();c.scale(2,2);for(let i=0;i<START_LIVES;i++)catLife(c,width/2-53+i*17,5,i<g.lives);c.restore();
}
const cache=new WeakMap();
export function drawHud(c,assets,g,width){
 // Cache the transparent counters. One shared shadow avoids blurring hundreds of tiny pixels every frame.
 const key=[width,g.health,g.lives,g.fish].join(':');let cached=cache.get(assets);
 if(cached?.key!==key){
  const content=document.createElement('canvas');content.width=width;content.height=47;const ctx=content.getContext('2d');ctx.imageSmoothingEnabled=false;drawCounters(ctx,assets,g,width);
  const layer=document.createElement('canvas');layer.width=width;layer.height=47;const ink=layer.getContext('2d');ink.filter='drop-shadow(0px 2px 1px #020817)';ink.drawImage(content,0,0);cached={key,layer};cache.set(assets,cached);
 }
 c.drawImage(cached.layer,0,0);
 if(g.boss.active&&g.boss.hp>0){const w=Math.min(width-36,270),x=(width-w)/2;rect(c,x,51,w,5,'#243247');rect(c,x,51,w*g.boss.hp/g.boss.maxHp,5,'#ff7183');const sx=g.boss.x+g.boss.w/2-g.camera;if(sx<24||sx>width-24){const right=sx>width-24,px=right?width-16:8;for(let i=0;i<5;i++)rect(c,px+(right?i:-i)*2,74+i*2,2,10-i*2,'#dda6ff');}}
}
