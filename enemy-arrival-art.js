import {rect} from './pixel.js?v=0.16.0';
export function sourcePosition(g,e){
 const s=e.source,p=s&&g.platforms.find(p=>p.room===e.room&&p.index===s.platformIndex);
 return p?{x:p.x+s.localX,y:p.y-(s.kind==='rift'?81:0)}:null;
}
export function drawEnemySources(c,g,time){
 for(const e of g.enemies){
  if(e.room!==g.room||!e.source||e.source.transient&&e.dead)continue;
  const pos=sourcePosition(g,e);if(!pos||pos.x<g.camera-70||pos.x>g.camera+(g.viewWidth||768)+70)continue;
  const {x,y}=pos,kind=e.source.kind,opening=e.spawnTime>0,shake=opening?Math.round(Math.sin(time*65)*2):0;
  c.save();c.translate(Math.round(x+shake),Math.round(y));
  if(['rift','portal','print'].includes(kind)){
   const r=kind==='rift'?24:20;rect(c,-r,-r*2,r*2,r*2,'#100e2d');
   for(let i=0;i<16;i++){const angle=i*Math.PI/8+time*(opening?4:.6);rect(c,Math.cos(angle)*r,Math.sin(angle)*r-r,3,3,kind==='print'?'#ffe2a1':'#ad91ee');}
   if(kind==='print')for(let i=0;i<3;i++)rect(c,-13+i*9,-24-i*4,7,10,'#e3d6b7');
  }else if(kind==='bin'||kind==='papers'){
   for(let i=0;i<5;i++){rect(c,-29+i*10,-12-(i%3)*5,15,11,'#dbcfaf');rect(c,-27+i*10,-9-(i%3)*5,10,2,'#697581');}
   if(kind==='bin'){
    rect(c,-18,-31,36,30,'#0b1524');rect(c,-16,-28,32,26,'#385360');
    for(let i=0;i<4;i++)rect(c,-12+i*7,-23,2,20,'#73939b');
    rect(c,-21,-35-(opening?7:0),42,4,'#a4c3bf');rect(c,-13,-32,26,5,'#050c19');
   }
  }else{
   const tv=kind==='screen',w=tv?50:42,h=tv?58:38;
   rect(c,-w/2-2,-h-2,w+4,h+4,'#030a18');rect(c,-w/2,-h,w,h,'#3b536b');rect(c,-w/2+4,-h+4,w-8,h-11,'#071528');
   if(tv){
    rect(c,-19,-h+8,38,31,'#213b57');for(let i=0;i<7;i++)rect(c,-17+((i*11+Math.floor(time*(opening?35:3)))%28),-h+10+i*4,8,2,i%2?'#9bc6ce':'#677aa1');
    rect(c,-14,-1,4,7,'#536b80');rect(c,10,-1,4,7,'#536b80');
   }else if(kind==='receiver'){
    rect(c,-2,-62,3,24,'#c0d5cf');rect(c,-12,-58,26,3,'#6bb0c3');
    for(let i=0;i<3;i++)rect(c,-14,-29+i*7,21,2,'#457587');
   }else if(kind==='reel'){
    for(const x of [-11,11]){rect(c,x-7,-32,14,14,'#b7a4c3');rect(c,x-3,-28,6,6,'#182239');}rect(c,-16,-13,32,3,'#ddc8a5');
   }else{rect(c,-15,-32,30,4,'#d9c9a9');rect(c,-13,-24,26,9,'#030c19');rect(c,-10,-20,20,4,opening?'#80eee0':'#607789');}
   rect(c,12,-9,3,3,opening?'#ffdc87':'#6a98a8');
  }
  if(opening)for(let i=0;i<5;i++){const d=(time*45+i*11)%42;rect(c,-20+i*10,-25-d,3,5,i%2?'#8ce8f0':'#ffe4b2');}
  c.restore();
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
