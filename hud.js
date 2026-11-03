import {drawBossHud} from './boss-hud.js?v=0.20.0';
import {rect,heart} from './pixel.js?v=0.20.0';
import {creatures,sprite} from './assets.js?v=0.20.0';
import {MAX_HEALTH,START_LIVES} from './level.js?v=0.20.0';
export function catLife(c,x,y,on=true){
 const rows=['1100000000011','1110000000111','1111000001111','1111111111111','0111111111110','0111111111110','0111111111110','0011111111100','0001111111000'];
 rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')rect(c,x+i,y+j,1,1,on?'#a8a4a0':'#304254');}));
 rect(c,x+1,y+1,2,2,on?'#e7a4a0':'#304254');rect(c,x+10,y+1,2,2,on?'#e7a4a0':'#304254');
 if(on){rect(c,x+3,y+5,2,2,'#c9f15a');rect(c,x+8,y+5,2,2,'#c9f15a');rect(c,x+6,y+7,1,1,'#e8acaa');}
}
function drawCounters(c,assets,g,width,height){
 const compact=width<700||height<80,scale=compact?2:3,left=compact?10:20,top=compact?8:14;
 c.save();c.translate(left,top);c.scale(scale,scale);for(let i=0;i<MAX_HEALTH;i++)heart(c,i*10,0,i<g.health);c.restore();
 const fishY=compact?36:53;sprite(c,assets.noise,creatures.fish,left,fishY,compact?24:31,compact?15:19);
 c.save();c.font=`${compact?20:25}px UmaText,monospace`;c.textBaseline='top';c.fillStyle='#ffe5a4';c.fillText(String(g.fish).padStart(2,'0'),left+(compact?31:40),fishY);c.restore();
 const right=width-left-START_LIVES*17*scale;
 c.save();c.font=`${compact?14:18}px UmaText,monospace`;c.fillStyle='#9cd6e1';c.textBaseline='top';c.fillText('ЖИЗНИ',right,top-1);c.translate(right,top+(compact?20:27));c.scale(scale,scale);for(let i=0;i<START_LIVES;i++)catLife(c,i*17,0,i<g.lives);c.restore();
}
const cache=new WeakMap();
export function drawHud(c,assets,g,width,height=94){
 const background=c.createLinearGradient(0,0,0,height);background.addColorStop(0,'#142c44');background.addColorStop(1,'#07172b');c.fillStyle=background;c.fillRect(0,0,width,height);
 rect(c,0,0,width,2,'#4c7182');rect(c,0,height-4,width,2,'#c6a76a');rect(c,0,height-2,width,2,'#031020');
 const key=[width,height,g.health,g.lives,g.fish].join(':');let cached=cache.get(assets);
 if(cached?.key!==key){
  const content=document.createElement('canvas');content.width=width;content.height=height;const ctx=content.getContext('2d');ctx.imageSmoothingEnabled=false;drawCounters(ctx,assets,g,width,height);
  cached={key,layer:content};cache.set(assets,cached);
 }
 c.drawImage(cached.layer,0,0);
 if(g.testingInvulnerable){c.save();c.font='14px UmaText,monospace';c.fillStyle='#ffdc86';c.textAlign='center';c.fillText('ТЕСТ: ЗАЩИТА',g.boss.active?width<700?width/2:220:width/2,width<700?59:79);c.restore();}
 drawBossHud(c,assets,g,width,{y:width<700?61:8});
}
