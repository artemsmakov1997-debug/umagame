import {drawBossHud} from './boss-hud.js?v=0.21.5';
import {rect,heart} from './pixel.js?v=0.21.5';
import {creatures,sprite} from './assets.js?v=0.21.5';
import {MAX_HEALTH,START_LIVES} from './level.js?v=0.21.5';
export function catLife(c,x,y,on=true){
 const rows=['1100000000011','1110000000111','1111000001111','1111111111111','0111111111110','0111111111110','0111111111110','0011111111100','0001111111000'];
 rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')rect(c,x+i,y+j,1,1,on?'#a8a4a0':'#304254');}));
 rect(c,x+1,y+1,2,2,on?'#e7a4a0':'#304254');rect(c,x+10,y+1,2,2,on?'#e7a4a0':'#304254');
 if(on){rect(c,x+3,y+5,2,2,'#c9f15a');rect(c,x+8,y+5,2,2,'#c9f15a');rect(c,x+6,y+7,1,1,'#e8acaa');}
}
function drawCounters(c,assets,g,width,height){
 const compact=width<700||height<80,scale=compact?2:3,left=compact?10:20,top=compact?8:14;
 const icons=assets.hudIcons?.naturalWidth;
 if(!icons){c.save();c.translate(left,top);c.scale(scale,scale);for(let i=0;i<MAX_HEALTH;i++)heart(c,i*10,0,i<g.health);c.restore();}
 const fishY=compact?36:53;sprite(c,assets.noise,creatures.fish,left,fishY,compact?24:31,compact?15:19);
 c.save();c.font=`${compact?20:25}px UmaText,monospace`;c.textBaseline='top';c.fillStyle='#ffe5a4';c.fillText(String(g.fish).padStart(2,'0'),left+(compact?31:40),fishY);c.restore();
 const right=width-left-START_LIVES*17*scale;
 c.save();if(!icons){c.font=`${compact?14:18}px UmaText,monospace`;c.fillStyle='#9cd6e1';c.textBaseline='top';c.fillText('ЖИЗНИ',right,top-1);}if(!icons){c.translate(right,top+(compact?20:27));c.scale(scale,scale);for(let i=0;i<START_LIVES;i++)catLife(c,i*17,0,i<g.lives);}c.restore();
}
// Hearts and Uma's faces (assets/hud-icons.png, 6×2 cells of 180×150, the icon standing on 95% of the cell height):
// hearts — full, pulse, cracking, broken, empty, refilled; faces — calm, blink, sad, gone, happy, dazed.
// They are drawn every frame on top of the cached counters so they can animate: the last heart pulses, a lost heart
// cracks and breaks, a regained one sparkles; faces blink, a lost life looks sad and dazed, a new one beams.
const ICON=[180,150],memo=new WeakMap();
function iconFrames(g,t){
 let m=memo.get(g);if(!m){m={health:g.health,lives:g.lives,hPrev:g.health,lPrev:g.lives,hAt:-9,lAt:-9};memo.set(g,m);}
 if(g.health!==m.health){m.hPrev=m.health;m.health=g.health;m.hAt=t;}if(g.lives!==m.lives){m.lPrev=m.lives;m.lives=g.lives;m.lAt=t;}
 const ha=t-m.hAt,la=t-m.lAt;
 const hearts=Array.from({length:MAX_HEALTH},(_,i)=>{
  if(i<g.health){if(m.hPrev<g.health&&i>=m.hPrev&&ha<.7)return 5;return g.health===1&&t%.9<.3?1:0;}
  if(m.hPrev>g.health&&i<m.hPrev&&ha<.6)return ha<.25?2:3;return 4;});
 const faces=Array.from({length:START_LIVES},(_,i)=>{
  if(i<g.lives){if(m.lPrev<g.lives&&i>=m.lPrev&&la<1)return 10;return (t+i*1.37)%4.3<.14?7:6;}
  if(m.lPrev>g.lives&&i<m.lPrev&&la<1.4)return la<.7?8:11;return 9;});
 return {hearts,faces};
}
function drawIcons(c,img,g,width,height){
 const compact=width<700||height<80,scale=compact?2:3,left=compact?10:20,top=compact?8:14,t=(globalThis.performance?.now?.()??Date.now())/1000,f=iconFrames(g,t);
 const put=(frame,cx,bottom,w)=>{const h=w*ICON[1]/ICON[0],col=frame%6,row=Math.floor(frame/6);c.drawImage(img,col*ICON[0],row*ICON[1],ICON[0],ICON[1],Math.round(cx-w/2),Math.round(bottom-h*.95),Math.round(w),Math.round(h));};
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 // Hearts sit where the old pixel hearts were (7×6 cells of `scale`, 10 apart).
 f.hearts.forEach((frame,i)=>put(frame,left+i*10*scale+3.5*scale,top+6*scale+scale*1.2,scale*8*ICON[0]/115));
 // Faces: no «ЖИЗНИ» label any more; they are bigger and centred in the bar's height at its right end.
 const face=compact?36:56,gap=compact?6:10,faceH=face*112/133,base=Math.round((height-4)/2+faceH/2),x0=width-left-START_LIVES*face-(START_LIVES-1)*gap;
 f.faces.forEach((frame,i)=>put(frame,x0+i*(face+gap)+face/2,base,face*ICON[0]/133));
 c.restore();
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
 if(assets.hudIcons?.naturalWidth)drawIcons(c,assets.hudIcons,g,width,height);
 if(g.testingInvulnerable){c.save();c.font='14px UmaText,monospace';c.fillStyle='#ffdc86';c.textAlign='center';c.fillText('ТЕСТ: ЗАЩИТА',g.boss.active?width<700?width/2:220:width/2,width<700?59:79);c.restore();}
 drawBossHud(c,assets,g,width,{y:width<700?61:8});
}
