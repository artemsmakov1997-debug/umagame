import {rooms} from './level.js?v=0.22.0';
export function emitGust(g,e,{vertical=e.windAxis==='y',duration=vertical?1.5:.35,dir=e.dir||1}={}){if(g.gusts.filter(w=>w.ownerId===e.id).length||g.gusts.length>=4)return null;const wind={ownerId:e.id,room:e.room,x:vertical?e.x-35:dir>0?e.x+35:e.x-360,y:vertical?e.y-550:e.y-14,w:vertical?124:360,h:vertical?590:74,vx:vertical?0:dir*230,vy:vertical?-460:0,vertical,time:duration};g.gusts.push(wind);return wind;}
export function stepWinds(g,dt){const p=g.player;for(const w of g.gusts){if(w.room!==g.room){w.time=0;continue;}w.time-=dt;if(g.overlap(p,w)&&p.dash===0){if(w.vertical){p.vy=Math.min(p.vy,-460);p.grounded=false;p.climbing=false;p.windLift=.15;}else if(!p.knock)p.vx=Math.max(-400,Math.min(400,p.vx+w.vx*dt*2));}
 for(const bolt of g.bolts)if(bolt.kind!=='echoOrb'&&g.overlap(bolt,w)){bolt.vx+=w.vx*dt*.6;bolt.vy+=w.vy*dt*.25;}
 for(const e of g.enemies)if(e.room===g.room&&!e.dead&&e.type==='fakenews'&&g.overlap(e,w))e.pressureTime=Math.max(e.pressureTime,2);
 }g.gusts=g.gusts.filter(w=>w.time>0);p.windLift=Math.max(0,(p.windLift||0)-dt);}
