import {rect,text} from './pixel.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
import {TUTORIAL_FLOOR as FLOOR,BENCH,BARRIER,GAP,MONITOR,DOOR,STATIONS} from './tutorial.js?v=0.21.5';
import {drawTargetGlow,TARGET_PINK} from './target-highlight.js?v=0.21.5';
// assets/tutorial-props.png (1536×1024, transparent): source boxes of each prop.
const PROPS={
 bench:[26,117,570,129],barrier:[649,10,396,269],barrierBroken:[1114,11,398,268],
 monitor:[64,302,277,284],monitorBroken:[397,302,282,284],edgeLeft:[766,380,287,201],edgeRight:[1224,380,290,201],
 door:[35,616,312,364],doorOpen:[401,616,313,364],plaque:[763,728,407,162],sign:[1229,683,283,291]
};
const draw=(c,a,key,x,y,scale,alpha=1)=>{const [sx,sy,sw,sh]=PROPS[key];c.save();c.globalAlpha*=alpha;c.drawImage(a.tutorialProps,sx,sy,sw,sh,Math.round(x),Math.round(y),Math.round(sw*scale),Math.round(sh*scale));c.restore();return{w:sw*scale,h:sh*scale};};
const keysFor=g=>g.touchEnabled
 ?{run:['ДЖОЙСТИК','БЕГ'],crouch:['ДЖОЙСТИК ↓','ПРИГНУТЬСЯ'],dash:['РЫВОК','ПРОБИТЬ'],jump:['↑','ПРЫЖОК'],attack:['ЛАПА','АТАКА'],exit:['ВЫХОД →','']}
 :{run:['← →','БЕГ'],crouch:['↓','ПРИГНУТЬСЯ'],dash:['SHIFT','РЫВОК'],jump:['↑','ПРЫЖОК'],attack:['X / ПРОБЕЛ','АТАКА'],exit:['ВЫХОД →','']};
// Plaque centres (local x) above each station; the run plaque hangs by the start sign.
const PLAQUE_X={run:244,crouch:534,dash:782,jump:980,attack:1214,exit:1468},PLAQUE_W=140,PLAQUE_Y=244;

// Floors are drawn as warm floorboards so the course reads against the painted room.
export function drawTutorialSurface(c,a,g,s){
 if(s.room!==0)return false;const x0=rooms[0].x;
 if(s.index===0)return true; // the painted cat bed is the surface
 if(s.index===4)return true; // the bench sprite carries the seat (drawn with the props)
 const pit=s.index===3,y=s.y,x=Math.round(s.x),w=Math.round(s.w);
 if(pit){rect(c,x,y-29,w,29,'#07030a');rect(c,x,y,w,14,'#3a2414');rect(c,x,y,w,2,'#9a6233');for(let xx=x+9;xx<x+w;xx+=24)rect(c,xx,y+3,2,10,'#24150c');return true;}
 rect(c,x,y,w,16,'#5a3520');rect(c,x,y+16,w,8,'#24130b');rect(c,x,y,w,2,'#f0b56a');rect(c,x,y+2,w,1,'#a86c38');
 for(let xx=x+((x0-x)%46+46)%46;xx<x+w;xx+=46)rect(c,xx,y+3,2,12,'#2c180d');
 for(let xx=x+20;xx<x+w;xx+=92)rect(c,xx,y+8,26,1,'#7b4a29');
 return true;
}

export function drawTutorialProps(c,a,g,t){
 if(g.room!==0||!a.tutorialProps)return;const q=g.tutorial,x0=rooms[0].x;
 // Start sign at the foot of the bed.
 const sign=draw(c,a,'sign',x0+212,FLOOR-66,.227);text(c,"СТАРТ",x0+219,FLOOR-57,"#fff1c4",1,1);
 // Broken floorboards frame the gap.
 const edge=.3;draw(c,a,'edgeLeft',x0+GAP.x-287*edge+6,FLOOR-8*edge-1,edge);draw(c,a,'edgeRight',x0+GAP.x+GAP.w-6,FLOOR-8*edge-1,edge);
 // Bench: the seat is a real platform; only a crouched Uma fits underneath.
 draw(c,a,'bench',x0+BENCH.x,BENCH.top-8,.33);
 // Barrier of «помехи»: flickers until a dash shatters it, then dissolves.
 const bs=BARRIER.w/396,by=FLOOR-269*bs;
 if(!q.barrierBroken){const flicker=.82+.18*Math.sin(t*23)*Math.sin(t*7);draw(c,a,'barrier',x0+BARRIER.x,by,bs,flicker);}
 else{// The pillars stay; the torn field drifts apart and fades.
  for(const [sx,sw] of [[649,86],[962,83]])c.drawImage(a.tutorialProps,sx,10,sw,269,Math.round(x0+BARRIER.x+(sx-649)*bs),Math.round(by),Math.round(sw*bs),Math.round(269*bs));
  const fade=Math.max(0,1-q.barrierTime/.9);if(fade>0){c.save();c.globalAlpha=fade;c.drawImage(a.tutorialProps,1114+90,11,398-180,268,Math.round(x0+BARRIER.x+98*bs+q.barrierTime*30),Math.round(by),Math.round(218*bs),Math.round(268*bs));c.restore();}}
 // Infected monitor; after the paw hit the broken frame stays with fading sparks.
 const ms=MONITOR.h/284,mx=x0+MONITOR.x;
 if(!q.monitorBroken){const shake=Math.sin(t*31)>.92?1:0;draw(c,a,'monitor',mx+shake,FLOOR-MONITOR.h,ms);
  if(STATIONS[q.step]==='attack'||q.step>=3)drawTargetGlow(c,{x:mx+8,y:FLOOR-MONITOR.h+6,w:MONITOR.w-16,h:MONITOR.h-12,color:TARGET_PINK},t);}
 else{draw(c,a,'monitorBroken',mx-2,FLOOR-MONITOR.h,ms);if(q.monitorTime<.8)for(let i=0;i<6;i++){const k=q.monitorTime/.8,ang=i*1.05+1;rect(c,mx+34+Math.cos(ang)*k*40,FLOOR-48-Math.sin(ang)*k*30+k*k*30,2,2,i%2?'#ffd36e':'#d78bff');}}
 // Door: closed until the monitor falls, then swings open.
 const ds=DOOR.h/364;draw(c,a,q.doorOpen&&q.doorTime>.4?'doorOpen':'door',x0+DOOR.x,FLOOR-DOOR.h+4,ds);
 // Plaques with the control for each station; the current one glows.
 const keys=keysFor(g);
 for(const [i,station] of STATIONS.entries()){
  const cx=x0+PLAQUE_X[station],ps=PLAQUE_W/407,ph=162*ps,y=station==='run'?FLOOR-66-ph-6:PLAQUE_Y,current=q.step===i,done=q.step>i;
  c.save();c.globalAlpha=done?.5:1;
  if(current){c.globalAlpha=.2+.12*Math.sin(t*4);rect(c,cx-PLAQUE_W/2-6,y-5,PLAQUE_W+12,ph+10,'#ffd36e');c.globalAlpha=1;}
  draw(c,a,'plaque',cx-PLAQUE_W/2,y,ps);
  const [key,label]=keys[station],big=key.length<=7?2:1,kw=key.length*6*big,lw=label.length*6;
  text(c,key,cx-kw/2+big,y+(label?(big===2?11:15):(ph-7*big)/2),current?'#fff3be':'#e9c98b',big);
  if(label)text(c,label,cx-lw/2+1,y+ph-17,current?"#ffe08f":"#c9a873",1,1);
  c.restore();
 }
}

// Yuri curates from the old monitor: after the opening, its screen shows him rather than the Infoshum projection.
export function tutorialMonitorScreen(){return {x:214,y:154,w:135,h:104};}
