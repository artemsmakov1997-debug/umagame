import {rooms} from './level.js?v=0.21.6';
const clamp=v=>Math.max(0,Math.min(1,v));
// Six drawn 512×512 cells in a 3×2 atlas. Register the eyes, not the changing wing/tail bounds.
export const COLLECT_FLIGHT_SCALE=.36;
export const COLLECT_FLIGHT_EYES=[[325,305],[323,262.5],[332,249],[345,234],[319,242],[305,254]];
export function collectFlightPose(b){
 const f=b.fight;if(f?.mode!=='collect')return null;
 const r=rooms[b.room],goal=r.x+r.width/2-b.w/2,progress=f.from&&f.dur>0?clamp(f.elapsed/f.dur):0;
 return{frame:Math.min(5,Math.floor(progress*6)),flip:goal<(f.from?.x??b.x),alpha:progress<1?1:clamp(1-(f.elapsed-f.dur)/.12)};
}
export function drawCollectFlight(c,a,b,pose){
 const image=a.spreaderCollectFlight;if(!image?.complete||!image.naturalWidth||!pose||pose.alpha<=0)return false;
 const [ex,ey]=COLLECT_FLIGHT_EYES[pose.frame],k=COLLECT_FLIGHT_SCALE;
 // Match the eyes of the existing collection cell (111.5,89.5 in its 192×184 source, scaled .78).
 c.save();c.globalAlpha*=pose.alpha;c.translate(b.x+b.w/2+(pose.flip?-1:1)*12.09,b.y+b.h/2-1.95);if(pose.flip)c.scale(-1,1);
 c.drawImage(image,pose.frame%3*512,Math.floor(pose.frame/3)*512,512,512,-ex*k,-ey*k,512*k,512*k);c.restore();return true;
}
