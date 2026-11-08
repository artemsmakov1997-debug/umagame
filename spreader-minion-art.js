// assets/spreader-servants.png: 8 cells of 128×104, centred, facing right.
// 0 unfolding, 1 wings up, 2 wings down, 3 wind-up, 4 lunge, 5 hurt, 6 crumple, 7 shred.
const W=128,H=104,SCALE=.36;
export function servantFrame(e,time){
 if(e.dead)return e.deathTime>.15?6:7;if(e.spawnTime>0)return 0;if(e.hurtTime>0)return 5;
 return e.state==='lunge'?4:e.state==='windup'?3:1+Math.floor(time*8)%2;
}
export function drawServant(c,a,e,time){
 const image=a.spreaderServants;if(!image)return;const i=servantFrame(e,time),w=W*SCALE,h=H*SCALE;
 c.save();c.translate(Math.round(e.x+e.w/2),Math.round(e.y+e.h/2));if(e.dir<0)c.scale(-1,1);
 c.drawImage(image,i*W,0,W,H,-w/2,-h/2,w,h);c.restore();
}
