import {tapeBridge} from './studio-systems.js?v=0.22.0';
import {emitGust} from './wind-systems.js?v=0.22.0';
import {rooms} from './level.js?v=0.22.0';
import {addTemporarySurface} from './world-geometry.js?v=0.22.0';
export function stepArenaSystems(g,dt){const b=g.boss,r=rooms[g.room];if(!r.arena||!r.multiStorey||!b.active)return;
 const a=g.arenaState??={boss:b.id,phase:1,time:0,exposure:0,cycle:-1};if(a.phase!==b.phase){a.phase=b.phase;a.time=0;a.exposure=2;g.temporarySurfaces=[];}a.time+=dt;a.exposure=Math.max(0,a.exposure-dt);const cycle=Math.floor(a.time/7),beat=a.time%7;if(cycle!==a.cycle){a.cycle=cycle;a.exposure=b.phase===3?2.4:0;}
 if(b.id==='spreader'){for(const s of g.platforms)if(s.room===g.room&&[5,6,7].includes(s.index)){const jam=g.devices.some(d=>d.room===g.room&&d.jammed>0);s.belt=b.phase===1||jam?0:(b.phase===3&&cycle%2?-1:1)*(s.index%2?-36:36);}}
 if(b.id==='agitator'&&b.phase>=2&&Math.floor(a.time/3)!==a.windCycle){a.windCycle=Math.floor(a.time/3);const d=g.devices.find(d=>d.room===g.room&&d.jammed<=0);if(d)emitGust(g,{id:d.id,room:g.room,x:d.x,y:d.y,dir:a.windCycle%2?1:-1},{vertical:a.windCycle%2===0,duration:1.8});}
 if(b.id==='manipulator'&&b.phase>=2&&Math.floor(a.time/8)!==a.bridgeCycle){a.bridgeCycle=Math.floor(a.time/8);tapeBridge(g,{...b,id:'boss:'+b.id});}
 b.environmentGuard=b.phase===3&&a.exposure<=0;if(b.environmentGuard)b.guardFlash=Math.max(0,b.guardFlash||0);
}
