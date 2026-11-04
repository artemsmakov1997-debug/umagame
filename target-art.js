import {sprite} from './assets.js?v=0.22.0';

// Cache a silhouette at gameplay resolution, so the contour follows the artwork.
const outlines=new WeakMap();
function outline(image,frame,w,h){
 let frames=outlines.get(image);if(!frames){frames=new Map();outlines.set(image,frames);}
 const key=[...frame,w,h].join(':');if(frames.has(key))return frames.get(key);
 const pad=5,mask=document.createElement('canvas');mask.width=Math.ceil(w)+pad*2;mask.height=Math.ceil(h)+pad*2;
 const ink=mask.getContext('2d');ink.imageSmoothingEnabled=false;ink.drawImage(image,...frame,pad,pad,w,h);ink.globalCompositeOperation='source-in';ink.fillStyle='#fff1a0';ink.fillRect(0,0,mask.width,mask.height);
 const layer=document.createElement('canvas');layer.width=mask.width;layer.height=mask.height;const c=layer.getContext('2d');
 for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2],[-2,-1],[2,1],[-1,2],[1,-2]])c.drawImage(mask,dx,dy);
 c.globalCompositeOperation='destination-out';c.drawImage(mask,0,0);frames.set(key,layer);return layer;
}
export function drawTargetSprite(c,image,frame,x,y,w,h,time=0,intact=true){
 if(intact){c.save();c.globalAlpha*=.88+.12*Math.sin(time*3);c.shadowColor='#ffcd58';c.shadowBlur=5;c.drawImage(outline(image,frame,w,h),Math.round(x)-5,Math.round(y)-5);c.restore();}
 sprite(c,image,frame,x,y,w,h);
}
