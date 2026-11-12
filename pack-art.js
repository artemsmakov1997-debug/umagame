import {sprite} from './assets.js?v=0.21.5';
// assets/health-pack.png: 8 cells of 272×440, the pedestal centred in each cell with its foot on y=436.
// 0–3 idle (bob and a glint running over the foil), 4 pop up with a heart, 5 sparkle ring, 6 fading sparkles,
// 7 the empty pedestal, which stays where the packet was. (x, y) is the packet's centre; the foot is 24 px lower.
export const PACK_CELL=[272,440],PACK_FOOT=436,PACK_SCALE=.16,PACK_FPS=6,PACK_TAKE=[.12,.27,.45];
export function packFrame(pack,gameTime,time){
 if(!pack.taken)return Math.floor(time*PACK_FPS+pack.x*.013)%4;
 const e=gameTime-(pack.takenAt??-9);let i=0;while(i<PACK_TAKE.length&&e>=PACK_TAKE[i])i++;return 4+i;
}
export function drawPack(c,a,pack,frame){
 const img=a.healthPack;if(!img)return;const [w,h]=PACK_CELL,s=PACK_SCALE;
 sprite(c,img,[frame*w,0,w,h],Math.round(pack.x-w*s/2),Math.round(pack.y+24-PACK_FOOT*s),w*s,h*s);
}
