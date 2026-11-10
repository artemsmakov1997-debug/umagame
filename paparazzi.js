import {ROOF_BUILDINGS,ROOF_PROPS} from './roofs-map.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
// Папарацци (Крыши): a camera on a tripod that stays on its roof. It turns to Uma, aims, charges the lamp and flashes.
// If Uma is looking at it at that moment and nothing (a chimney, a tank, a taller house) stands between them,
// the flash blinds her: she freezes for a moment. Turning away or hiding behind cover beats it; two paw hits break it.
export const PAPARAZZI={reach:400,height:220,aim:.4,charge:.7,flash:.3,rest:1.1,blind:1};
const segmentHitsRect=(x1,y1,x2,y2,r)=>{
 // Sampled test is plenty at these sizes (the line is at most a screen long).
 for(let i=1;i<24;i++){const t=i/24,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h)return true;}return false;
};
// Cover between the camera's lens and Uma's eyes.
export function flashCovered(g,e){
 const p=g.player,x0=rooms[e.room].x,lx=e.x+e.w/2,ly=e.y+6,ex=p.x+p.w/2,ey=p.y+(p.sneaking?8:12);
 const covers=[...ROOF_PROPS.map(c=>({x:x0+c.x,y:c.y,w:c.w,h:c.base-c.y})),...ROOF_BUILDINGS.map(b=>({x:x0+b.x,y:b.y,w:b.w,h:480-b.y}))];
 return covers.some(r=>segmentHitsRect(lx,ly,ex,ey,r));
}
export const lookingAt=(p,e)=>Math.sign(e.x+e.w/2-p.x-p.w/2)===p.dir;
export function stepPaparazzi(g,e,dt,dx,dy){
 const p=g.player,near=Math.abs(dx)<PAPARAZZI.reach&&Math.abs(dy)<PAPARAZZI.height;
 if(e.state!=='flash')e.dir=dx<0?-1:1;
 if(e.state==='patrol'){if(near&&e.timer<=0){e.state='aim';e.timer=PAPARAZZI.aim;g.emit('paparazziAim',{x:e.x,y:e.y,enemyType:e.type});}}
 else if(e.state==='aim'&&e.timer<=0){e.state='charge';e.timer=PAPARAZZI.charge;g.emit('flashWarning',{x:e.x,y:e.y,enemyType:e.type});}
 else if(e.state==='charge'&&e.timer<=0){
  e.state='flash';e.timer=PAPARAZZI.flash;e.attackFlash=PAPARAZZI.flash;
  // The flash always blinds a cat within reach (a dash through it is the only way past).
  const seen=near&&p.inv===0&&p.dash===0;
  if(seen){p.blindTime=PAPARAZZI.blind;p.vx=0;g.emit('flashBlind',{x:p.x,y:p.y});}
  g.emit('cameraFlash',{x:e.x+e.w/2,y:e.y,seen,enemyType:e.type});
 }
 else if(e.state==='flash'&&e.timer<=0){e.state='recover';e.timer=PAPARAZZI.rest;}
 else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.2;}
}
