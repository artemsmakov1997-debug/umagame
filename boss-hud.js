import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {HUD_SPRITES} from './hud-sprites.js?v=0.21.5';
export const bossStyles={
 spreader:{name:'Распространитель',edge:'#dcb87b',fill:'#f0d7a7',dark:'#47384a',portrait:'#17273b',kind:'paper'},
 agitator:{name:'Агитатор',edge:'#e69258',fill:'#f06361',dark:'#4b2237',portrait:'#281f35',kind:'broadcast'},
 manipulator:{name:'Манипулятор',edge:'#ba9ee9',fill:'#bc7de5',dark:'#32244e',portrait:'#1b1935',kind:'film'},
 infoshum:{name:'Инфошум',edge:'#70dfe8',fill:'#ef5197',dark:'#31274e',portrait:'#09192f',kind:'static'}
};
const portraits=new WeakMap();
function portrait(assets,id){
 let map=portraits.get(assets);if(!map){map=new Map();portraits.set(assets,map);}
 if(!map.has(id)){
  const c=document.createElement('canvas');c.width=100;c.height=100;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  if(id==='infoshum')drawInfoshumSprite(ctx,assets,'body',0,0,0,100,100);
  else {const box=id==='spreader'?[50,25,140,140]:id==='agitator'?[44,56,126,112]:[13,14,156,148],image=id==='spreader'?assets.spreaderAir:id==='agitator'?assets.agitatorBoss:id==='manipulator'?assets.manipulator:assets.minibosses,scale=Math.min(100/box[2],100/box[3]),w=box[2]*scale,h=box[3]*scale;ctx.drawImage(image,...box,(100-w)/2,(100-h)/2,w,h);}
  map.set(id,c);
 }return map.get(id);
}
const hits=new WeakMap();
const fit=(box,w,h)=>Math.min(w/box[2],h/box[3]);
// Draws [x,y,w,h] of the atlas into a destination rectangle.
const put=(c,img,box,x,y,w,h)=>c.drawImage(img,box[0],box[1],box[2],box[3],x,y,w,h);
export function bossHudLayout(id,width,y=8){
 const S=HUD_SPRITES[id],[,,cw,ch]=S.casing,H=width<700?66:84,icon=Math.round(H/3.3),avail=Math.min(width<700?width-20:width-410,560)-icon-8;
 const natural=H*cw/ch,destW=Math.min(avail,natural*1.4),k=destW<natural?destW/natural:1,h=H*k,scale=h/ch;
 const total=destW+icon+8,x=Math.round((width-total)/2),top=Math.round(y-(width<700?2:4)+(H-h)/2);
 // Three slices: the left end (portrait), a middle stretched along the channel, the right end.
 const L=S.channel[0]+S.channel[2]*.12,R=S.channel[0]+S.channel[2]*.88,mid=destW-(L+cw-R)*scale;
 const X=rx=>rx<=L?x+rx*scale:rx>=R?x+destW-(cw-rx)*scale:x+L*scale+(rx-L)/(R-L)*mid,Y=ry=>top+ry*scale;
 const box=b=>({x:X(b[0]),y:Y(b[1]),w:X(b[0]+b[2])-X(b[0]),h:b[3]*scale});
 return {S,x,top,w:destW,h,scale,L,R,mid,X,Y,window:box(S.window),channel:box(S.channel),plate:box(S.plate),icons:{x:x+destW+8,size:icon,top:top+h/2-icon*1.5}};
}
export function drawBossHud(c,a,g,width,{y=8}={}){
 const b=g.boss;if(b.room!==g.room||(!b.active||b.hp<=0)&&g.mode!=='bossDefeat'&&g.pausedFrom!=='bossDefeat')return;
 const style=bossStyles[b.id],img=a['hud'+b.id[0].toUpperCase()+b.id.slice(1)];if(!style||!img?.naturalWidth)return;
 const l=bossHudLayout(b.id,width,y),S=l.S,[cx,cy,cw,ch]=S.casing,frac=Math.max(0,Math.min(1,b.hp/b.maxHp));
 c.save();c.imageSmoothingEnabled=false;
 // Portrait behind the casing's window.
 const win=l.window;c.fillStyle=style.portrait;c.fillRect(win.x,win.y,win.w,win.h);c.drawImage(portrait(a,b.id),win.x+win.w*.04,win.y+win.h*.04,win.w*.92,win.h*.92);
 put(c,img,[cx,cy,l.L,ch],l.x,l.top,l.L*l.scale,l.h);
 put(c,img,[cx+l.L,cy,l.R-l.L,ch],l.x+l.L*l.scale,l.top,l.mid,l.h);
 put(c,img,[cx+l.R,cy,cw-l.R,ch],l.x+l.w-(cw-l.R)*l.scale,l.top,(cw-l.R)*l.scale,l.h);
 // Health: the empty track, then the full one cut at the current fraction.
 const ch2=l.channel,inset=Math.max(1,ch2.h*.06),bar={x:ch2.x+inset,y:ch2.y+inset,w:ch2.w-2*inset,h:ch2.h-2*inset};
 const strip=(set)=>{const [Lb,M0,Rb]=set,t=Math.round(M0[2]*.06),Mb=[M0[0]+t,M0[1],M0[2]-2*t,M0[3]],lw=Lb[2]*bar.h/Lb[3],rw=Rb[2]*bar.h/Rb[3],mw=Mb[2]*bar.h/Mb[3];
  for(let xx=bar.x+lw-1;xx<bar.x+bar.w-rw+1;xx+=mw){c.save();c.beginPath();c.rect(bar.x+lw-1,bar.y,bar.w-lw-rw+2,bar.h);c.clip();put(c,img,Mb,xx,bar.y,mw,bar.h);c.restore();}
  put(c,img,Lb,bar.x,bar.y,lw,bar.h);put(c,img,Rb,bar.x+bar.w-rw,bar.y,rw,bar.h);};
 strip(S.empty);const cut=bar.x+bar.w*frac;
 if(frac>0){c.save();c.beginPath();c.rect(bar.x,bar.y-2,cut-bar.x,bar.h+4);c.clip();strip(S.fill);c.restore();}
 // A fresh hit: a fading ghost of the lost chunk and the boss's own damage burst.
 let m=hits.get(b);if(!m||b.hp>m.hp){m={hp:b.hp,at:-9,from:frac};hits.set(b,m);}
 if(b.hp<m.hp){m.from=m.hp/b.maxHp;m.hp=b.hp;m.at=g.time;}
 const age=g.time-m.at;
 if(age>=0&&age<.6){const k=1-age/.6,from=bar.x+bar.w*Math.min(1,m.from);c.save();c.globalAlpha=.7*k;c.fillStyle='#fff3dc';c.fillRect(cut,bar.y,from-cut,bar.h);c.restore();
  const d=S.damage,dh=bar.h*(2.2+age*1.4),dw=dh*d[2]/d[3];c.save();c.globalAlpha=k;put(c,img,d,cut-dw/2,bar.y+bar.h/2-dh/2,dw,dh);c.restore();}
 // Phase dividers.
 for(const f of [1/3,2/3]){const x=bar.x+bar.w*f,d=S.divider;
  if(b.id==='infoshum'){const len=bar.h*1.7,th=len*d[3]/d[2];c.save();c.translate(x,bar.y+bar.h/2);c.rotate(Math.PI/2);put(c,img,d,-len/2,-th/2,len,th);c.restore();}
  else{const dh=bar.h*1.55,dw=dh*d[2]/d[3];put(c,img,d,x-dw/2,bar.y+bar.h/2-dh/2,dw,dh);}}
 // The name on the casing's plate.
 const plate=l.plate,size=Math.max(11,Math.min(20,Math.round(plate.h*.78)));c.font=`${size}px UmaText, monospace`;c.fillStyle='#2b1631';c.textAlign='center';c.textBaseline='middle';c.fillText(style.name,plate.x+plate.w/2,plate.y+plate.h/2+1,plate.w-6);
 // Three phase badges: ahead, current (glowing), done.
 const phase=Math.max(1,Math.min(3,b.phase||1));
 for(let i=0;i<3;i++){const state=i+1<phase?2:i+1===phase?1:0,box=S.icons[i*3+state],k=fit(box,l.icons.size,l.icons.size)*(state===1?1.15:1),w=box[2]*k,h=box[3]*k,cy2=l.icons.top+l.icons.size*(i+.5);
  c.save();if(state===0)c.globalAlpha=.75;put(c,img,box,l.icons.x+l.icons.size/2-w/2,cy2-h/2,w,h);c.restore();}
 c.restore();
 const sx=b.x+b.w/2-g.camera,world=g.viewWidth||768;if(sx<24||sx>world-24){const right=sx>world-24,px=right?l.x+l.w-10:l.x+7,py=l.top+l.h-12;for(let i=0;i<4;i++)rect(c,px+(right?i:-i),py+i,1,8-i*2,style.edge);}
}
