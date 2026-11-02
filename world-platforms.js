import {platforms} from './level.js?v=0.15.1';
export function createWorldPlatforms(){return platforms.map(s=>({...s,baseX:s.x,baseY:s.y,prevX:s.x,prevY:s.y,dx:0,dy:0}));}
export function alignEnemyToPlatform(g,e){
 const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex),base=platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);if(!s||!base)return e;
 const dx=s.x-base.x,dy=s.y-base.y;e.x+=dx;e.y+=dy;e.origin+=dx;e.end+=dx;return e;
}
export function stepWorldPlatforms(g,dt){
 g.platformClocks[g.room]=(g.platformClocks[g.room]||0)+dt;
 for(const s of g.platforms){
  s.prevX=s.x;s.prevY=s.y;s.dx=0;s.dy=0;
  if(s.room===g.room&&s.motion){const offset=Math.sin(g.platformClocks[g.room]*Math.PI*2/s.motion.period)*s.motion.amplitude;if(s.motion.axis==='x')s.x=s.baseX+offset;else s.y=s.baseY+offset;s.dx=s.x-s.prevX;s.dy=s.y-s.prevY;}
 }
 const p=g.player,feet=p.y+p.h;
 const support=p.grounded&&!p.climbing?g.platforms.find(s=>s.room===g.room&&Math.abs(feet-s.prevY)<2&&p.x+p.w>s.prevX+1&&p.x<s.prevX+s.w-1&&(s.id===p.supportId||!p.supportId))||g.platforms.find(s=>s.room===g.room&&Math.abs(feet-s.prevY)<1&&p.x+p.w>s.prevX+1&&p.x<s.prevX+s.w-1):null;
 if(support){p.x+=support.dx;p.y+=support.dy;p.supportId=support.id;}
 for(const e of g.enemies){
  if(e.room!==g.room||e.dead)continue;
  const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);
  if(s&&!e.flying&&e.jumpPhase!=='air'&&!e.terrainFall){e.x+=s.dx;e.y+=s.dy;e.origin+=s.dx;e.end+=s.dx;}
  if(e.teleport)for(const key of ['source','target']){
   const mark=e.teleport[key],surface=g.platforms.find(s=>s.room===e.room&&s.index===(mark.index??e.platformIndex));if(!surface)continue;
   mark.localX??=mark.x-surface.prevX;mark.x=surface.x+mark.localX;mark.y=surface.y-e.h;
   if(key==='target'){mark.origin=surface.x+8;mark.end=surface.x+surface.w-e.w-8;}
  }
 }
 for(const portal of g.portals){const s=g.platforms.find(s=>s.room===portal.room&&s.index===portal.platformIndex);if(s){portal.x+=s.dx;portal.y+=s.dy;}}
 for(const item of [...g.relays,...g.lifePickups,...g.notebooks]){
  const s=g.platforms.find(s=>s.room===item.room&&s.index===(item.platformIndex??item.index));if(s){item.x+=s.dx;item.y+=s.dy;}
 }
}
