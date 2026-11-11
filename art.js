import {drawClickbaitPortrait,drawStaticPortrait as drawJellyPortrait} from './dimension-monsters-art.js?v=0.21.5';
import {drawPaparazziPortrait,drawSpotlighterPortrait,drawBoomPortrait} from './new-monsters-art.js?v=0.21.5';
import {drawAgitatorPose} from './agitator-art.js?v=0.21.5';
import {drawCensorPortrait} from './censor-art.js?v=0.21.5';
import {drawSensationPortrait} from './roofs-art.js?v=0.21.5';
import {drawBotfarmPortrait,drawBotPortrait} from './botfarm-art.js?v=0.21.5';
import {drawEchoDoublePortrait} from './echo-double-art.js?v=0.21.5';
import {drawStaticPortrait} from './static-art.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {drawManipulatorPose} from './manipulator-art.js?v=0.21.5';
import {creatures,newCreatures,sprite} from './assets.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {idlePlacement} from './menu-animation.js?v=0.21.5';
import {drawMonitorEyes} from './menu-monitor.js?v=0.21.5';
import {motion,monsterFrame,monsterReaction,previewActor,clickbaitAppearanceFrame,baitEmergenceFrames,locomotionFrame} from './monster-animation.js?v=0.21.5';
export function drawCrt(c,x,y,w,h,time=0){
 rect(c,x,y,w,h,'#080f22');rect(c,x+2,y+2,w-4,h-5,'#8792ab');rect(c,x+5,y+5,w-10,h-15,'#303f61');rect(c,x+9,y+9,w-18,h-23,'#062c51');
 for(let i=0;i<9;i++){const yy=y+12+i*(h-30)/9;rect(c,x+12,yy,w-24,2,'#0b658b');for(let j=0;j<6;j++)if((i*3+j+Math.floor(time*7))%4===0)rect(c,x+13+j*(w-28)/6,yy,Math.max(2,w/14),2,'#77ecff');}
 for(let i=0;i<4;i++)rect(c,x+w-27+i*5,y+h-9,2,3,'#253551');rect(c,x+w*.43,y+h,w*.14,5,'#66728c');rect(c,x+w*.23,y+h+5,w*.54,3,'#384563');
}
export function drawMonster(c,a,id,x,y,w,h,time=0,flip=false,actor={}){
 if(id==='censor')return drawCensorPortrait(c,a,x,y,w,h,time,actor);
 if(id==='sensation')return drawSensationPortrait(c,a,x,y,w,h,time,actor);
 if(id==='echo'&&!actor.orb)return drawEchoDoublePortrait(c,a,x,y,w,h,time,flip,actor);
 if(id==='static'&&drawJellyPortrait(c,a,x,y,w,h,time,actor))return;
 if(id==='static'&&a.staticMotion)return drawStaticPortrait(c,a,x,y,w,h,time,flip,actor);
 if(id==='botfarm')return drawBotfarmPortrait(c,a,x,y,w,h,time,actor);
 if(id==='bot')return drawBotPortrait(c,a,x,y,w,h,time,actor);
 if(id==='clickbait'&&drawClickbaitPortrait(c,a,x,y,w,h,time,actor))return;
 if(id==='paparazzi')return drawPaparazziPortrait(c,a,x,y,w,h,time,actor,drawMonster);
 if(id==='spotlight')return drawSpotlighterPortrait(c,a,x,y,w,h,time,actor);
 if(id==='boom')return drawBoomPortrait(c,a,x,y,w,h,time,actor);
 // The Нагнетатель is the bolted roof machine.
 if(id==='inflator'&&a.inflatorMachine){const st=actor.hurtTime>0?'hit':actor.state==='windup'?'windup':['casting','blast'].includes(actor.state)?'blast':'patrol',e={state:st,hurtTime:actor.hurtTime||0,dir:flip?-1:1};const f=st==='hit'?7:st==='windup'?2:st==='blast'?4:Math.floor((actor.moving?actor.walkTime??time:time)*7)%2;const k=Math.min(w/192,h/155);c.save();c.translate(Math.round(x+w/2),Math.round(y+h/2));if(flip)c.scale(-1,1);c.drawImage(a.inflatorMachine,f*192,0,192,155,-96*k,-77*k,192*k,155*k);c.restore();return;}
 // Spreader and Infoshum are drawn exactly as in their fights.
 if(id==='spreader'&&a.spreaderAir){const frame=actor.hurtTime>0?7:actor.state==='casting'?3:actor.state==='windup'?5:Math.floor((actor.moving?actor.walkTime??time:time)*7)%2,s=Math.min(w/192,h/184);c.save();c.translate(Math.round(x+w/2),Math.round(y+h/2));if(flip)c.scale(-1,1);c.drawImage(a.spreaderAir,frame*192,0,192,184,-96*s,-92*s,192*s,184*s);c.restore();return;}
 if(id==='infoshum'&&a.infoshumBody&&!actor.projection){const frame=actor.hurtTime>0?5:actor.state==='casting'?3:actor.state==='windup'?1:[0,2][Math.floor((actor.moving?actor.walkTime??time:time)*7)%2];drawInfoshumSprite(c,a,'body',frame,x,y,w,h);return;}
 if(id==='agitator'&&a.agitatorBoss){const cycle=Math.floor(time*1.2)%4,frame=actor.hurtTime>0?12:actor.state==='windup'?1:actor.state==='casting'?[11,10,2,1][cycle]:actor.moving?[0,3][Math.floor((actor.walkTime??time)*8)%2]:Math.floor(time*.8)%5===4?8:0;drawAgitatorPose(c,a,frame,x,y,w,h,flip);return;}
 if(id==='manipulator'&&a.manipulator){const row=actor.hurtTime>0?5:actor.state==='windup'?2:actor.state==='shift'?4:actor.state==='casting'?3:0;drawManipulatorPose(c,a,row,actor.moving?Math.floor((actor.walkTime??time)*8)%4:Math.floor(time*6)%4,x,y,w,h,flip);return;}
 const atlas=motion[id];if(!atlas)return;
 const index=monsterFrame(id,time,actor),appearance=id==='clickbait'?clickbaitAppearanceFrame(actor):null,gait=locomotionFrame(id,time,actor),reaction=appearance===null?(gait||monsterReaction(id,time,actor)):null,frame=appearance===null?(reaction||atlas.frames[index]):baitEmergenceFrames[appearance],{box,pivot}=frame;
 if(id==='infoshum'&&!actor.projection)drawCrt(c,x+w*.35,y+h*.18,w*.54,h*.73,time);
 const scale=Math.min(w/(appearance===null?(reaction?.width||atlas.width):512),h/(appearance===null?(reaction?.height||atlas.height):480)),cx=x+w/2,feet=y+h;
 c.save();c.translate(Math.round(cx),Math.round(feet));if(flip!==(appearance===null&&!reaction&&id==='clickbait'&&index===3))c.scale(-1,1);
 sprite(c,a[appearance===null?(reaction?.asset||atlas.asset):'baitMotion'],box,(box[0]-pivot[0])*scale,(box[1]-pivot[1])*scale,box[2]*scale,box[3]*scale);c.restore();
}
// The bait: a neon-pink fish on a hook under a mouse cursor and a «!» — nothing like the golden reward fish.
// assets/clickbait-lure.png: 4 cells of 110×150 (bob, glint, twitch, jerk); the fish's centre at (60,106).
export function drawLure(c,a,x,y,time,frame=null){
 if(a.clickbaitLure){const k=.42,f=frame??[0,1,0,2][Math.floor(time*4)%4],yy=Math.round(y+Math.sin(time*3)*2);c.drawImage(a.clickbaitLure,f*110,0,110,150,Math.round(x-60*k),Math.round(yy-106*k),Math.round(110*k),Math.round(150*k));return;}
 const yy=Math.round(y+Math.sin(time*3)*2);sprite(c,a.noise,creatures.fish,x-13,yy-8,26,16);
 rect(c,x+6,yy-26,4,19,'#010817');rect(c,x+6,yy-12,12,5,'#010817');rect(c,x+14,yy-18,4,9,'#010817');
 rect(c,x+7,yy-25,2,15,'#a8e8f8');rect(c,x+9,yy-11,6,2,'#e7eff3');rect(c,x+14,yy-16,2,6,'#f8e5ad');rect(c,x+12,yy-17,4,2,'#ffe4a3');
 rect(c,x+7,yy-28,2,3,'#5899bd');
}
export function drawSoup(c,a,x,y,h=30){const b=newCreatures.soup,w=h*b[2]/b[3];sprite(c,a.monsters,b,x-w/2,y-h/2,w,h);}
// Canvas-pixel y of the bottom of the last visible main-menu entry (0 when the menu is not laid out).
export function menuTextBottom(canvas,height){
 if(typeof document==='undefined')return 0;const items=[...document.querySelectorAll('#menu-screen [data-menu]')].filter(e=>e.getClientRects().length);if(!items.length)return 0;
 const box=canvas.getBoundingClientRect();if(!box.height)return 0;return Math.max(...items.map(e=>e.getBoundingClientRect().bottom-box.top))*height/box.height;
}
// The menu canvas is only 768 px wide and stretched to the screen, so Uma drawn into it was shrunk with
// nearest-neighbour sampling and then blown up again — jagged and blurry. She is painted instead on an overlay
// canvas at the screen's real pixel density, scaled smoothly from her full-size sheet.
export function drawMenuCat(c,a,pose){
 const o=typeof document!=='undefined'&&document.getElementById('menu-cat'),canvas=c.canvas;
 if(!o||!canvas.getBoundingClientRect){sprite(c,a.idle,pose.box,pose.x,pose.y,pose.w,pose.h);return;}
 const r=canvas.getBoundingClientRect(),dpr=Math.min(3,globalThis.devicePixelRatio||1),W=Math.max(1,Math.round(r.width*dpr)),H=Math.max(1,Math.round(r.height*dpr));
 if(o.width!==W)o.width=W;if(o.height!==H)o.height=H;
 const st=o.style,left=canvas.offsetLeft+'px',top=canvas.offsetTop+'px',w=r.width+'px',h=r.height+'px';
 if(st.left!==left)st.left=left;if(st.top!==top)st.top=top;if(st.width!==w)st.width=w;if(st.height!==h)st.height=h;
 const g=o.getContext('2d'),kx=W/canvas.width,ky=H/canvas.height;g.clearRect(0,0,W,H);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 const b=pose.box;g.drawImage(a.idle,b[0],b[1],b[2],b[3],pose.x*kx,pose.y*ky,pose.w*kx,pose.h*ky);
}
export function clearMenuCat(){const o=typeof document!=='undefined'&&document.getElementById('menu-cat');if(o&&o.width)o.getContext('2d').clearRect(0,0,o.width,o.height);}
export function drawMenuScene(c,a,time,cat=true){
 if(!cat)clearMenuCat();
 const height=c.canvas.height,width=c.canvas.width;
 if(cat&&a.menuPortrait&&c.canvas.getBoundingClientRect().width<=700&&width/height<.75){
  const bg=a.menuPortrait,scale=height/bg.height,w=bg.width*scale,x=(width-w)/2;
  c.imageSmoothingEnabled=false;c.clearRect(0,0,width,height);c.drawImage(bg,x,0,w,height);
  // Extend only the painted edge strips on wider phones; keep the full hero visible.
  if(x>0){c.save();c.translate(x,0);c.scale(-1,1);c.drawImage(bg,0,0,x/scale,bg.height,0,0,x,height);c.restore();c.save();c.translate(width,0);c.scale(-1,1);c.drawImage(bg,bg.width-x/scale,0,x/scale,bg.height,0,0,x,height);c.restore();}
  // A larger Uma on phones, but her ears always stay below the last menu entry.
  const ground=height*.795,textBottom=menuTextBottom(c.canvas,height),catHeight=Math.max(height*.08,Math.min(height*.17,ground-textBottom-height*.025));
  const pose=idlePlacement(time,height,{x:x+bg.width*.62*scale,y:ground,height:catHeight});drawMenuCat(c,a,pose);return;
 }
 const tall=height>700,scale=Math.max(width/a.menu.width,height/a.menu.height),x=tall?width*.82-1260*scale:(width-a.menu.width*scale)/2,y=height-a.menu.height*scale+(tall?0:Math.max(0,Math.min(30,(440-height)*.5)));
 c.imageSmoothingEnabled=false;c.clearRect(0,0,width,height);c.drawImage(a.menu,x,y,a.menu.width*scale,a.menu.height*scale);
 if(cat){const pose=idlePlacement(time,height,{x:x+1260*scale,y:y+765*scale,height:tall?260:Math.min(160,height*.47)});drawMenuCat(c,a,pose);}
}

export function drawPortrait(canvas,a,id,time=0){
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);
 const big=canvas.width>200,pad=big?8:3,actor=previewActor(time),cast=actor.state==='casting';
 if(cast){actor.state=id==='inflator'?'blast':id==='panicker'?'alarm':id==='clickbait'?'snap':'casting';actor.attackFlash=1;}
 drawMonster(c,a,id,pad,pad,canvas.width-pad*2,canvas.height-pad*2,time,false,actor);
}

export function drawHauntedMonitor(c,a,x,y,w,h,time=0,portal=false){
 const cycle=time%6,index=portal?5:cycle>5.6?2:cycle>5.4?1:Math.floor(time*2)%9===7?3:0;
 const left=index%3*512+85,top=Math.floor(index/3)*512+91;
 sprite(c,a.monitors,[left,top,342,341],x,y,w,h);
}
