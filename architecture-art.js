import {rooms} from './level.js?v=0.22.0';
import {designFor} from './world-design.js?v=0.22.0';
import {rect,text} from './pixel.js?v=0.22.0';
import {cats,sprite} from './assets.js?v=0.22.0';
import {drawTargetSprite} from './target-art.js?v=0.22.0';
export function architecturalLayer(c,a,r){const d=designFor(r.index);if(!d)return false;const cellW=a.interiors.width/2,cellH=a.interiors.height/2;
 if(r.theme==='newsroom'||r.theme==='studio'){for(let floor=0;floor<2;floor++){const cell=r.theme==='newsroom'?floor:floor+2;for(let x=0;x<r.width;x+=768)c.drawImage(a.interiors,cell%2*cellW,Math.floor(cell/2)*cellH,cellW,cellH,x,floor*512,768,512);}}
 else{const col=r.theme==='roofs'?1:3,sw=a.backdrops.width/2,sh=a.backdrops.height/2;for(let y=0;y<r.height;y+=512)for(let x=0;x<r.width;x+=768)c.drawImage(a.backdrops,col%2*sw,Math.floor(col/2)*sh,sw,sh,x,y,768,512);}
 // Load-bearing columns, floor joists and door headers connect the rooms to actual colliders.
 if(r.theme==='newsroom'||r.theme==='studio')for(let x=0;x<=r.width;x+=768)for(const top of[0,512]){rect(c,x-14,top,28,340,'#071321');for(let y=top+8;y<top+338;y+=12){rect(c,x-11,y,22,2,'#48556b');rect(c,x+5,y+3,2,7,'#26394a');}rect(c,x-23,top+330,46,12,'#59616c');rect(c,x-21,top+332,42,3,'#af9973');}
 c.fillStyle='#020b1b20';c.fillRect(0,0,r.width,r.height);return true;
}
const sourceCells={printer:3,receiver:2,reel:4,rift:6};
export function drawInteractiveWorld(c,a,g,t){
 for(const d of [...g.generators,...g.devices]){if(d.room!==g.room||d.x<g.camera-100||d.x>g.camera+g.viewWidth+100)continue;
  if(d.budget){const sw=a.sources.width/3,sh=a.sources.height/3,i=sourceCells[d.kind];c.save();c.globalAlpha=d.hp?1:.4;drawTargetSprite(c,a.sources,[i%3*sw,Math.floor(i/3)*sh,sw,sh],d.x-8,d.y-4,d.w+16,d.h+4,t,!!d.hp);c.restore();for(let i=0;i<d.budget;i++)rect(c,d.x+12+i*10,d.y+d.h+3,5,3,i<d.budget-d.emitted&&d.hp?'#9cebd5':'#304257');}
  else{const col={press:0,transmitter:1,console:2,anchor:3}[d.kind],sw=a.destructibles.width/4,sh=a.destructibles.height/3;drawTargetSprite(c,a.destructibles,[col*sw,(d.jammed>0?2:0)*sh,sw,sh],d.x-16,d.y-10,80,76,t,d.jammed<=0);if(d.jammed>0)text(c,'✓',d.x+17,d.y-12,'#9ff7ce');}
  if(d.blocked>0){rect(c,d.x,d.y+d.h*.4,d.w,8,'#211133');for(let i=0;i<5;i++)rect(c,d.x+i*10,d.y+d.h*.4-3,7,12,'#693389');}
 }
 for(const gate of g.inkGates){rect(c,gate.x,gate.y,gate.w,gate.h,'#29143899');for(let y=gate.y;y<gate.y+gate.h;y+=10)rect(c,gate.x-3,y,gate.w+6,5,'#9048ad');}
 for(const d of g.decoys){const cat=cats[0];c.save();c.globalAlpha=Math.min(.75,d.time);c.filter='sepia(1) saturate(.5)';sprite(c,a.uma,cat.box,d.x-12,d.y-12,60,60);c.restore();rect(c,d.x+5,d.y+48,27,2,'#ead6a3');}
 for(const e of g.enemies)if(e.room===g.room&&e.active&&!e.dead&&e.sensation>1){text(c,'!',e.x+e.w/2,e.y-45,'#ffbc68',1.5);for(let i=0;i<3;i++)rect(c,e.x+9+i*12,e.y-8-Math.sin(t*6+i)*3,3,2,'#ffd287');}
 const ev=g.chapterEvent;if(ev?.type==='newsroom'&&ev.room===g.room){const sw=a.sources.width/3,sh=a.sources.height/3;for(let i=0;i<4;i++)c.drawImage(a.sources,sw,0,sw,sh,ev.chaserX-58+i%2*40,800+Math.floor(i/2)*65,72,72);}
}
