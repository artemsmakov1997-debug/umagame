// Source-space corners of the cleaned glass. Only the eyes are animated over the original shading.
export const MENU_GLASS=[[1386,527],[1496,516],[1496,674],[1386,674]];
export function monitorPoint(u,v,quad=MENU_GLASS){
 const top=[quad[0][0]*(1-u)+quad[1][0]*u,quad[0][1]*(1-u)+quad[1][1]*u];
 const bottom=[quad[3][0]*(1-u)+quad[2][0]*u,quad[3][1]*(1-u)+quad[2][1]*u];
 return [top[0]*(1-v)+bottom[0]*v,top[1]*(1-v)+bottom[1]*v];
}
const eye=[[.2,.39],[.25,.39],[.25,.43],[.3,.43],[.3,.46],[.36,.46],[.36,.49],[.42,.49],[.42,.58],[.36,.58],[.36,.55],[.3,.55],[.3,.52],[.25,.52],[.25,.49],[.22,.49],[.22,.45],[.2,.45]];
export function drawMonitorEyes(c,time,quad=MENU_GLASS){
 const tick=Math.floor(time*14),blink=tick%71>=68;if(tick%37===32)return;
 c.save();c.globalAlpha*=.88+Math.sin(time*7)*.08;c.fillStyle=blink?'#dd3145':'#ff3148';c.shadowColor='#ee2442';c.shadowBlur=4;
 for(const mirror of [false,true]){
  c.beginPath();const vertices=blink?[[.23,.49],[.42,.53],[.42,.55],[.23,.51]]:eye;
  vertices.forEach(([u,v],i)=>{const [x,y]=monitorPoint(mirror?1-u:u,v,quad),xx=Math.round(x/2)*2,yy=Math.round(y/2)*2;if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);});c.closePath();c.fill();
 }
 c.restore();
}
export function drawPortraitMonitor(c,assets,time,height){
 // Reuse the painted bezel on narrow screens, preserving its real proportions and shading.
 c.save();c.translate(610,height*.54);c.scale(.56,.56);c.translate(-1318,-466);
 c.beginPath();c.moveTo(1320,516);c.lineTo(1344,496);c.lineTo(1536,466);c.lineTo(1536,761);c.lineTo(1320,768);c.closePath();c.clip();
 c.drawImage(assets.menu,0,0);drawMonitorEyes(c,time);c.restore();
}
