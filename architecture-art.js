import {rooms,platforms} from './level.js?v=0.22.0';
import {designFor} from './world-design.js?v=0.22.0';
import {rect,text} from './pixel.js?v=0.22.0';
import {cats,sprite} from './assets.js?v=0.22.0';
import {drawTargetSprite} from './target-art.js?v=0.22.0';
export function architecturalLayer(c,a,r){const d=designFor(r.index);if(!d)return false;const cellW=a.interiors.width/2,cellH=a.interiors.height/2;
 if(r.theme==='newsroom'||r.theme==='studio'){for(let floor=0;floor<2;floor++){const cell=r.theme==='newsroom'?floor:floor+2;for(let x=0;x<r.width;x+=768)c.drawImage(a.interiors,cell%2*cellW,Math.floor(cell/2)*cellH,cellW,cellH,x,floor*512,768,512);}}
 else if(r.theme==='roofs'&&a.roofArchitecture){const scale=r.height/a.roofArchitecture.height;for(let x=0;x<r.width;x+=a.roofArchitecture.width*scale)c.drawImage(a.roofArchitecture,x,0,a.roofArchitecture.width*scale,r.height);}
 else{const col=r.theme==='roofs'?1:3,sw=a.backdrops.width/2,sh=a.backdrops.height/2;for(let y=0;y<r.height;y+=512)for(let x=0;x<r.width;x+=768)c.drawImage(a.backdrops,col%2*sw,Math.floor(col/2)*sh,sw,sh,x,y,768,512);}
 if(r.theme==='roofs'&&a.roofArchitecture)for(const s of platforms.filter(s=>s.room===r.index&&s.building)){const x=s.x-r.x;c.save();c.beginPath();c.rect(x,s.y+10,s.w,r.height-s.y);c.clip();for(let yy=s.y+10;yy<r.height;yy+=256)for(let xx=x;xx<x+s.w;xx+=128)c.drawImage(a.roofArchitecture,280,400,128,256,xx,yy,128,256);c.fillStyle='#03112555';c.fillRect(x,s.y+10,s.w,r.height-s.y);c.restore();}
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
 for(const wind of g.gusts){if(wind.room!==g.room)continue;c.save();c.globalAlpha=Math.min(.65,wind.time*2);const frame=a.projectiles,sw=frame.width/4,sh=frame.height/2;for(let i=0;i<4;i++){const x=wind.vertical?wind.x+20+i%2*35:wind.x+20+(i*80+t*170)%Math.max(50,wind.w-50),y=wind.vertical?wind.y+((i*130-t*240)%wind.h+wind.h)%wind.h:wind.y+20;c.save();c.translate(x,y);if(wind.vertical)c.rotate(-Math.PI/2);c.drawImage(frame,3*sw,sh,sw,sh,-16,-13,32,26);c.restore();}c.restore();}
 for(const d of g.decoys){const cat=cats[0];c.save();c.globalAlpha=Math.min(.75,d.time);c.filter='sepia(1) saturate(.5)';sprite(c,a.uma,cat.box,d.x-12,d.y-12,60,60);c.restore();rect(c,d.x+5,d.y+48,27,2,'#ead6a3');}
 for(const e of g.enemies)if(e.room===g.room&&e.active&&!e.dead&&e.sensation>1){text(c,'!',e.x+e.w/2,e.y-45,'#ffbc68',1.5);for(let i=0;i<3;i++)rect(c,e.x+9+i*12,e.y-8-Math.sin(t*6+i)*3,3,2,'#ffd287');}
 const ev=g.chapterEvent;if(ev?.type==='newsroom'&&ev.room===g.room){const sw=a.sources.width/3,sh=a.sources.height/3;for(let i=0;i<4;i++)c.drawImage(a.sources,sw,0,sw,sh,ev.chaserX-58+i%2*40,800+Math.floor(i/2)*65,72,72);}
}

export function drawTemporaryPlatform(c,a,s,t){c.save();c.globalAlpha=Math.min(1,s.time/.7);const sw=a.projectiles.width/4,sh=a.projectiles.height/2,col=s.kind==='ticker'?3:1,row=s.kind==='ticker'?0:1;c.beginPath();c.rect(s.x,s.y-4,s.w,20);c.clip();for(let x=s.x;x<s.x+s.w;x+=54)c.drawImage(a.projectiles,col*sw,row*sh,sw,sh,x,s.y-4,58,20);rect(c,s.x,s.y-4,s.w,2,s.kind==='ticker'?'#9bfff0':'#ffe4a2');if(s.time<1.2)for(let x=s.x;x<s.x+s.w;x+=18)rect(c,x,s.y+10,5,2,'#ffc48c');c.restore();}
export function drawStudioPartitions(c,a,g,t){for(const w of g.partitions){if(w.room!==g.room)continue;const sw=a.barriers.width/4,sh=a.barriers.height/2;if(!w.open){c.drawImage(a.barriers,2*sw+sw*.35,sh*.08,sw*.3,sh*.85,w.x-6,w.y,w.w+12,w.h);const warning=g.cuts.some(c=>c.partitionId===w.id&&c.phase==='warning');if(warning){for(let y=w.y;y<w.y+w.h;y+=12)rect(c,w.x-8,y,w.w+16,3,Math.floor(t*8)%2?'#ffa08c':'#e6cb8b');}}else{rect(c,w.x-5,w.y+w.h-8,w.w+10,8,'#3e4f65');rect(c,w.x,w.y+w.h-11,9,4,'#c6a78b');}}
 for(const e of g.enemies)if(e.room===g.room&&e.boundTime>0){const owner=g.enemies.find(o=>o.id===e.boundBy);if(!owner)continue;const x=Math.min(owner.x,e.x),w=Math.abs(owner.x-e.x);for(let xx=x;xx<x+w;xx+=8)rect(c,xx,e.y+15+(xx%16?1:0),7,3,'#ceb5ed');}}
