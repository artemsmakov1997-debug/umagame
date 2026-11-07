export function tryDrop(g,input,dt){
 const p=g.player,requested=!!(input.down&&(input.jump||input.attack||input.drop)),pressed=requested&&!p.dropHeld;p.dropHeld=requested;if(!requested)p.dropConsumed=false;p.dropTime=Math.max(0,(p.dropTime||0)-dt);
 if(!pressed||!p.grounded||p.climbing||p.dash>0)return false;
 // ↓ + attack next to a monster or a transmitter is a low swat, not a drop.
 if(input.attack&&!input.jump&&!input.drop&&targetInReach(g))return false;
 const source=g.platforms.find(s=>s.id===p.supportId),lower=source&&g.platforms.some(s=>s.room===g.room&&s.y>source.y+8&&p.x+p.w>s.x+2&&p.x<s.x+s.w-2);
 if(!lower)return false;
 p.dropConsumed=true;p.dropId=source.id;p.dropTime=.24;p.y+=4;p.vy=90;p.grounded=false;p.climbing=false;p.coyote=0;p.jumpBuffer=0;p.attack=0;p.sneaking=false;g.emit('dropThrough');return true;
}
function targetInReach(g){
 const p=g.player,reach=p.powerTime>0?81:54,paw={x:p.dir>0?p.x+16:p.x-reach+18,y:p.y-30,w:reach,h:p.h+36};
 const hit=o=>o.x<paw.x+paw.w&&o.x+o.w>paw.x&&o.y<paw.y+paw.h&&o.y+o.h>paw.y;
 return g.enemies.some(e=>e.room===g.room&&e.active&&!e.dead&&hit(e))||g.relays.some(r=>r.room===g.room&&r.hp>0&&!r.scripted&&hit(r));
}
