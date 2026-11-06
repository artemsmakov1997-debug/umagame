import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
// Newsroom block identity: the print shop gets a stamping press over the conveyor,
// the server room gets rows of racks. Coordinates are local to the newsroom (room 1).
export const PRESS={x:1028,w:110,rest:360,strike:418,section:1};
const racks=[];for(let x=1572;x<2300;x+=64)racks.push(x);

// Static machinery, cached once and drawn in world space so it stays locked to the platforms
// (the backdrop itself scrolls with parallax).
function paintScenery(c){
 // Print shop: overhead pipe run and the press frame behind the paper dip.
 rect(c,768,64,768,10,'#16233a');rect(c,768,66,768,3,'#31465c');
 for(const x of [840,1210,1420]){rect(c,x,74,10,120,'#16233a');rect(c,x+2,74,3,120,'#31465c');}
 const fx=PRESS.x-24,fw=PRESS.w+48;
 for(const x of [fx,fx+fw-18]){rect(c,x,112,18,362,'#141f33');rect(c,x+3,112,4,362,'#3a4f66');rect(c,x+12,112,3,362,'#0b1424');}
 rect(c,fx-8,92,fw+16,40,'#1a2740');rect(c,fx-8,92,fw+16,4,'#4d6379');
 for(let x=fx-4;x<fx+fw+6;x+=20){rect(c,x,112,10,14,'#d6a43e');rect(c,x+10,112,10,14,'#18120c');}
 rect(c,PRESS.x+PRESS.w/2-14,70,28,22,'#26344b');rect(c,PRESS.x+PRESS.w/2-8,74,16,10,'#5a1c22');
 rect(c,PRESS.x+PRESS.w/2-4,132,8,PRESS.rest-132,'#2b3b52');rect(c,PRESS.x+PRESS.w/2-2,132,2,PRESS.rest-132,'#6b8296');
 // Conveyor legs and rollers under the belt.
 for(let x=896;x<1260;x+=46){rect(c,x,443,8,31,'#121c2e');rect(c,x+2,443,2,31,'#3e5468');}
 // Server room: racks with dark faces, slots and cable trays.
 c.save();c.globalAlpha=.92;
 for(const [i,x] of racks.entries()){
  const top=110+(i%3)*18;rect(c,x,top,52,474-top,'#0c1626');rect(c,x+2,top+2,48,474-top-2,'#14223a');rect(c,x,top,52,3,'#3b5570');
  for(let y=top+14;y<466;y+=17){rect(c,x+6,y,40,10,'#0a1220');rect(c,x+6,y,40,1,'#2c4258');rect(c,x+38,y+4,3,2,'#1d3a35');}
 }
 c.restore();
 for(const y of [92,98]){rect(c,1536,y,768,3,'#20354a');}
 for(let x=1560;x<2300;x+=96){rect(c,x,95,2,26,'#20354a');}
}

let cache=null;
export function drawNewsroomScenery(c,g){
 if(g.room!==1||typeof document==='undefined')return;
 if(!cache){cache=document.createElement('canvas');cache.width=rooms[1].width;cache.height=480;const k=cache.getContext('2d');k.imageSmoothingEnabled=false;paintScenery(k);}
 c.drawImage(cache,rooms[1].x,0);
}

function pressPhase(g,t){
 const control=g.mapProps?.find(d=>d.room===1&&d.section===PRESS.section);
 if(!control?.hp)return{active:false,drop:0,warn:false};
 const phase=(t+PRESS.section*.8)%5;
 const warn=phase<1.2,strike=phase>=1.2&&phase<=2.2;
 const drop=strike?Math.min(1,(phase-1.2)/.12):phase>2.2&&phase<2.7?1-(phase-2.2)/.5:0;
 return{active:true,drop,warn,phase};
}

// Animated parts, drawn in world space over the platforms.
export function drawNewsroomMachines(c,g,t){
 if(g.room!==1)return;
 const r=rooms[1],cam=g.camera,vw=g.viewWidth||768;
 const px=r.x+PRESS.x;
 if(px+PRESS.w>cam-60&&px<cam+vw+60){
  const s=pressPhase(g,t),y=Math.round(PRESS.rest+(PRESS.strike-PRESS.rest)*s.drop),shake=s.warn?Math.round(Math.sin(t*40)):0;
  rect(c,px+PRESS.w/2-4+shake,PRESS.rest,8,y-PRESS.rest,'#2b3b52');
  rect(c,px+shake-2,y-2,PRESS.w+4,24,'#070d18');rect(c,px+shake,y,PRESS.w,20,'#4b5e74');rect(c,px+shake,y,PRESS.w,3,'#9db3c4');
  for(let x=0;x<PRESS.w;x+=14){rect(c,px+shake+x,y+8,7,8,s.active?'#e0ac40':'#6d6250');rect(c,px+shake+x+7,y+8,7,8,'#1b140c');}
  const lamp=s.active&&(s.warn?Math.floor(t*8)%2===0:s.drop>0);
  rect(c,px+PRESS.w/2-6,76,12,6,lamp?'#ff4a4a':s.active?'#5a1c22':'#22303f');
  if(lamp){c.save();c.globalAlpha=.25;rect(c,px+PRESS.w/2-18,70,36,18,'#ff4a4a');c.restore();}
  if(s.drop===1){c.save();c.globalAlpha=.6;for(let k=0;k<6;k++)rect(c,px+8+k*18,y+22+(k%2)*3,6,2,'#f2e6c8');c.restore();}
 }
 // Server LEDs blink; they dim once the server controller is broken.
 const server=g.mapProps?.find(d=>d.room===1&&d.section===2),on=!!server?.hp;
 for(const [i,lx] of racks.entries()){
  const x=r.x+lx;if(x<cam-60||x>cam+vw+60)continue;const top=110+(i%3)*18;
  for(let y=top+18,k=0;y<466;y+=17,k++){
   const blink=(Math.floor(t*(2+(i+k)%3))+i*7+k*3)%5;
   rect(c,x+38,y,3,2,on?(blink===0?'#ff6a5a':blink<3?'#5ef2a1':'#1d3a35'):(k%4===0?'#2d6b5a':'#14302b'));
   if(on&&blink===1)rect(c,x+32,y,3,2,'#6fd8e8');
  }
 }
}
