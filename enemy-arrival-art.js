import {rect} from './pixel.js?v=0.18.1';
export function sourcePosition(g,e){
 const s=e.source,p=s&&g.platforms.find(p=>p.room===e.room&&p.index===s.platformIndex);
 return p?{x:p.x+s.localX,y:p.y-(s.kind==='rift'?81:0)}:null;
}
const sourceCells={bin:0,papers:1,receiver:2,printer:3,reel:4,screen:5,rift:6,portal:7,print:8};
export function drawEnemySources(c,g,time,assets){
 if(!assets?.sources)return;
 const art=assets.sources,sw=art.width/3,sh=art.height/3;
 for(const e of g.enemies){
  if(e.room!==g.room||!e.source||e.source.transient&&e.dead)continue;
  const pos=sourcePosition(g,e);if(!pos||pos.x<g.camera-80||pos.x>g.camera+(g.viewWidth||768)+80)continue;
  const index=sourceCells[e.source.kind]??3,opening=e.spawnTime>0,shake=opening?Math.sin(time*65)*1.5:0,w=['rift','portal','print'].includes(e.source.kind)?86:76,h=76;
  c.save();c.translate(Math.round(pos.x+shake),Math.round(pos.y));c.drawImage(art,index%3*sw,Math.floor(index/3)*sh,sw,sh,-w/2,-h,w,h);
  if(opening)for(let i=0;i<5;i++){const d=(time*45+i*11)%42;rect(c,-20+i*10,-25-d,3,5,i%2?'#8ce8f0':'#ffe4b2');}c.restore();
 }
}

export function drawEchoVortex(c,e,time){
 if(!['windup','pulling'].includes(e.state))return;
 const pulling=e.state==='pulling',cx=e.x+e.w/2,cy=e.y+e.h/2;
 c.save();c.globalAlpha=pulling?.85:.45;
 // Inward-moving paper fragments describe suction, never a projectile's future path.
 for(let i=0;i<26;i++){const phase=(time*(pulling?1.2:.4)+i/26)%1,r=18+(1-phase)*(pulling?210:45),a=i*2.4+phase*3;rect(c,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.7,2+i%3,3,i%3?'#aa8bea':'#78e5fa');}
 c.restore();
}
