import {rect} from './pixel.js?v=0.21.6';
import {sprite} from './assets.js?v=0.21.6';
import {portraitFrame} from './yuri-portrait.js?v=0.21.6';
import {rooms} from './level.js?v=0.21.6';
import {CHECKPOINTS} from './newsroom-systems.js?v=0.21.6';
import {ROOF_CHECKPOINTS} from './roofs-map.js?v=0.21.6';
import {STUDIO_CHECKPOINTS} from './studio-map.js?v=0.21.6';
import {DIM_CHECKPOINTS} from './dimension-map.js?v=0.21.6';
// The beacons mark the existing safe respawn surfaces, never a moving or disappearing platform.
export function checkpointMarkers(g){
 const room=g.room,rank=room===1?g.newsroomCheckpoint??-1:({3:g.roofs,5:g.studio,7:g.dimension}[room]?.checkpoint??0);
 const points=room===1?CHECKPOINTS.map(index=>({index})):({3:ROOF_CHECKPOINTS,5:STUDIO_CHECKPOINTS,7:DIM_CHECKPOINTS}[room]||[]);
 return points.flatMap((point,i)=>{
  if(room!==1&&i===0)return [];
  const s=g.platforms.find(s=>s.id===room+':'+point.index);if(!s)return [];
  const x=room===1?s.x+(s.w<110?21:s.w/2):rooms[room].x+point.x+17,left=Math.max(s.x+32,x-42);
  // Keep the screen beside the returning cat, with its feet safely on the same existing surface.
  const terminalX=x-left>=24?left:Math.min(s.x+s.w-32,x+64);
  return [{room,rank:i,index:point.index,x,terminalX,y:s.y,active:i<=rank,current:i===rank}];
 });
}
// Approved option A: eight registered pieces (four locations, idle/connected).
// All source coordinates are in the original 1536×1024 sheet; assets.js restores the half-size WebP.
export const TERMINAL_SCALE=.22,TERMINAL_SKINS={
 1:{col:0,top:145,feet:[477,473],anchor:198,glass:[[149,194,135,108],[149,193,135,108]]},
 3:{col:1,top:36,feet:[477,473],anchor:198,glass:[[138,196,140,112],[138,194,140,112]]},
 5:{col:2,top:94,feet:[477,474],anchor:194,glass:[[130,196,145,112],[130,195,145,112]]},
 7:{col:3,top:96,feet:[477,475],anchor:179,glass:[[104,196,157,112],[104,195,157,112]]}
};
export function checkpointVisual(marker){
 const skin=TERMINAL_SKINS[marker.room];if(!skin)return null;
 const row=marker.active?1:0,k=TERMINAL_SCALE,x=(marker.terminalX??marker.x)-skin.anchor*k,y=marker.y-skin.feet[row]*k,[gx,gy,gw,gh]=skin.glass[row];
 return {box:[skin.col*384,row*512,384,512],x,y,w:384*k,h:512*k,top:y+skin.top*k,screen:{x:x+gx*k,y:y+gy*k,w:gw*k,h:gh*k}};
}
function drawTerminalScreen(c,a,screen,active,time){
 const {x,y,w,h}=screen;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();rect(c,x,y,w,h,'#04172c');
 if(active&&a.yuriEmotions){
  // Crop the established portrait sheet to the head/collar; never generate another Yuri face.
  const {box}=portraitFrame(a.yuriEmotions,0,time,true),source=[box[0]+box[2]*.1,box[1]+box[3]*.02,box[2]*.8,box[3]*.76],k=Math.min(w/source[2],h/source[3]);
  sprite(c,a.yuriEmotions,source,x+(w-source[2]*k)/2,y,source[2]*k,source[3]*k);
  c.globalAlpha=.12;rect(c,x,y,w,h,'#66dfff');c.globalAlpha=1;
 }else for(let line=0;line<h;line+=3)rect(c,x,y+line,w,1,'#173452');
 rect(c,x,y+(time*7)%h,w,1,active?'#8deaff40':'#35556e50');c.restore();
}
export function drawCheckpointMarkers(c,g,a){
 if(!a?.checkpointTerminals)return;
 for(const marker of checkpointMarkers(g)){
  const visual=checkpointVisual(marker),{x,y,w,h,box,screen}=visual;
  sprite(c,a.checkpointTerminals,box,x,y,w,h);
  drawTerminalScreen(c,a,screen,marker.active,g.time);
 }
}
