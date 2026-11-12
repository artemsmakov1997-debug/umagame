import {rect} from './pixel.js?v=0.21.5';
export function sourcePosition(g,e){
 const s=e.source,p=s&&g.platforms.find(p=>p.room===e.room&&p.index===s.platformIndex);
 return p?{x:p.x+s.localX,y:p.y-(s.kind==='rift'?81:0)}:null;
}
const sourceCells={bin:0,papers:1,receiver:2,printer:3,reel:4,screen:5,rift:6,portal:7,print:8};
export function drawEnemySources(c,g,time,assets){
 if(!assets?.sources)return;
 const art=assets.sources,sw=art.width/3,sh=art.height/3;
 for(const e of g.enemies){
  if(e.room!==g.room||!e.source||e.source.transient&&e.dead||e.source.kind==='belt')continue;
  const pos=sourcePosition(g,e);if(!pos||pos.x<g.camera-80||pos.x>g.camera+(g.viewWidth||768)+80)continue;
  const index=sourceCells[e.source.kind]??3,opening=e.spawnTime>0,shake=opening?Math.sin(time*65)*1.5:0,w=['rift','portal','print'].includes(e.source.kind)?58:49,h=49;
  c.save();c.translate(Math.round(pos.x+shake),Math.round(pos.y));c.drawImage(art,index%3*sw,Math.floor(index/3)*sh,sw,sh,-w/2,-h,w,h);
  if(opening)for(let i=0;i<5;i++){const d=(time*45+i*11)%42;rect(c,-20+i*10,-25-d,3,5,i%2?'#8ce8f0':'#ffe4b2');}c.restore();
 }
}

// Newsroom: the newspaper on the belt bulges, tears open and the monster climbs out (assets/newsroom-paper-burst.png).
export function drawBeltEmergence(c,a,e){
 const img=a.newsroomPaperBurst;if(!img||e.source?.kind!=='belt'||!(e.spawnTime>0))return;const k=1-e.spawnTime/(e.arrivalDuration||.8),frame=Math.min(5,Math.floor(k*6)),w=96,h=w*85/135;
 c.drawImage(img,frame*135,0,135,85,Math.round(e.x+e.w/2-w/2),Math.round(e.y+e.h-h+6),w,h);
}
export function drawEchoVortex(c,e,time){
 if(!['windup','pulling'].includes(e.state))return;
 const pulling=e.state==='pulling',cx=e.x+e.w/2,cy=e.y+e.h/2;
 c.save();c.globalAlpha=pulling?.85:.45;
 // Inward-moving paper fragments describe suction, never a projectile's future path.
 for(let i=0;i<26;i++){const phase=(time*(pulling?1.2:.4)+i/26)%1,r=18+(1-phase)*(pulling?210:45),a=i*2.4+phase*3;rect(c,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.7,2+i%3,3,i%3?'#aa8bea':'#78e5fa');}
 c.restore();
}

// «Измерение»: an Эхо unfolds out of a ripple of shredded messages (fragments spiral in, a cyan ring closes on it);
// a Помеха condenses out of a block of TV snow that shrinks onto it. k runs 0→1 over the arrival.
export const DIM_ARRIVAL=.95;
export function drawDimensionArrival(c,e,k,time){
 const cx=e.x+e.w/2,cy=e.y+e.h/2;c.save();
 if(e.type==='echo'){
  const r=10+(1-k)*70;c.globalAlpha=Math.min(1,k*3)*(1-k*.6);c.strokeStyle='#78e5fa';c.lineWidth=2;c.beginPath();c.ellipse(cx,cy,r,r*.7,0,0,Math.PI*2);c.stroke();
  c.globalAlpha=.9*(1-k*.5);for(let i=0;i<22;i++){const ph=(i/22+k*.9)%1,rr=12+(1-k)*(40+ph*60),ang=i*2.4+k*7;rect(c,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.7,2+i%3,3,i%3?'#aa8bea':'#78e5fa');}
 }else{
  const w=e.w+40*(1-k),h=e.h+30*(1-k),x0=cx-w/2,y0=cy-h/2,cell=3,seed=Math.floor(time*24);c.globalAlpha=(1-k)*.95;
  for(let y=0;y<h;y+=cell)for(let x=0;x<w;x+=cell){const v=((x*73856093)^(y*19349663)^(seed*83492791))>>>0;if(v%3)continue;rect(c,x0+x,y0+y,cell,cell,v%7<3?'#e8f4ff':v%7<5?'#9fb4d8':'#5b6a8c');}
  c.globalAlpha=(1-k)*.6;for(let i=0;i<3;i++)rect(c,x0,y0+((time*90+i*h/3)%h),w,2,'#ffffff');
 }
 c.restore();
}
