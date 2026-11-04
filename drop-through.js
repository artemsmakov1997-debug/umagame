import {solidSurfaces} from './terrain.js?v=0.22.0';
export function tryDrop(g,input,dt){
 const p=g.player,requested=!!(input.down&&(input.jump||input.attack||input.drop)),pressed=requested&&!p.dropHeld;p.dropHeld=requested;p.dropTime=Math.max(0,(p.dropTime||0)-dt);
 if(!pressed||!p.grounded||p.climbing||p.dash>0)return false;
 const surfaces=solidSurfaces(g),source=surfaces.find(s=>s.id===p.supportId),lower=source&&surfaces.some(s=>s.room===g.room&&s.y>source.y+8&&p.x+p.w>s.x+2&&p.x<s.x+s.w-2);
 if(!lower)return false;
 p.dropId=source.id;p.dropTime=.24;p.y+=4;p.vy=90;p.grounded=false;p.climbing=false;p.coyote=0;p.jumpBuffer=0;p.attack=0;p.sneaking=false;g.emit('dropThrough');return true;
}
