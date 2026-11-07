// Помеха: assets/static-motion.png, 4×3 cells of 384×341. Flight ×4; notices, winds up, lunges, lands the punch;
// dazed after the lunge, hit, scatters, gathers.
const FRAMES=[[51,54,284,231],[426,50,293,229],[821,54,282,231],[1208,54,285,219],[38,366,296,268],[407,387,297,231],
 [768,410,374,196],[1172,396,345,228],[55,720,280,251],[396,739,343,213],[803,734,307,234],[1206,730,281,241]];
// Horizontal anchor inside each frame (share of the width): the cloud's middle, not the trail or the flash.
const ANCHOR=[.5,.5,.5,.5,.5,.5,.64,.4,.5,.5,.5,.5];
export function staticFrame(e={},time=0){
 if(e.dead)return 10;if(e.spawnTime>0)return 11;if(e.hurtTime>0)return 9;
 if(e.state==='lunge')return e.strikeHit||e.attackFlash>0?7:6;if(e.state==='casting')return 6;
 if(e.state==='windup')return 5;if(e.noticeTime>0)return 4;if(e.state==='recover')return 8;
 return Math.floor(((e.moving?e.walkTime:undefined)??time)*8)%4;
}
export function drawStaticPortrait(c,a,x,y,w,h,time=0,flip=false,actor={}){
 const img=a.staticMotion;if(!img)return false;const f=staticFrame(actor,time),box=FRAMES[f],k=h/236,dw=box[2]*k,dh=box[3]*k;
 const bob=f<4?Math.sin(time*5)*2:0,cx=x+w/2,ax=dw*ANCHOR[f];
 c.save();c.translate(Math.round(cx),0);if(flip)c.scale(-1,1);
 c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(-ax),Math.round(y+h-dh+bob),Math.round(dw),Math.round(dh));c.restore();return true;
}
