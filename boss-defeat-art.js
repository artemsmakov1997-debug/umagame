import {drawAgitatorPose,drawAgitatorDefeat} from './agitator-art.js?v=0.21.5';
import {drawManipulatorPose} from './manipulator-art.js?v=0.21.5';
import {drawInfoshumSprite} from './infoshum-sprites.js?v=0.21.5';
import {drawMonster} from './art.js?v=0.21.5';
import {projectileFrames} from './projectile-frames.js?v=0.21.5';
const cache=new WeakMap();
function body(a,id){let entries=cache.get(a);if(!entries){entries=new Map();cache.set(a,entries);}if(!entries.has(id)){const final=id==='infoshum',c=document.createElement('canvas');c.width=final?280:156;c.height=final?236:138;if(final)drawInfoshumSprite(c.getContext('2d'),a,'body',6,0,0,c.width,c.height);else if(id==='agitator')drawAgitatorPose(c.getContext('2d'),a,13,0,0,c.width,c.height);else if(id==='manipulator')drawManipulatorPose(c.getContext('2d'),a,5,1,0,0,c.width,c.height);else drawMonster(c.getContext('2d'),a,id,0,0,c.width,c.height,0,false,{hurtTime:.22,state:'recover',projection:true});entries.set(id,c);}return entries.get(id);}
export function drawBossDefeat(c,a,g){const d=g.defeat;if(!d||!['bossDefeat','paused'].includes(g.mode)||g.mode==='paused'&&g.pausedFrom!=='bossDefeat')return;if(d.boss==='agitator'){c.save();c.imageSmoothingEnabled=false;drawAgitatorDefeat(c,a,d);c.restore();return;}const t=d.time,p=Math.max(0,Math.min(1,(t-.22)/1.12)),final=d.boss==='infoshum',sprite=body(a,d.boss),x=d.x-(final?76:28),y=d.y-(final?100:62),cols=final?6:4,rows=final?4:3;
 c.save();c.imageSmoothingEnabled=false;if(t<.22){c.globalAlpha=Math.floor(t*30)%2?.45:1;c.drawImage(sprite,x,y);}
 else for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const i=row*cols+col,w=sprite.width/cols,h=sprite.height/rows,angle=i*2.399,spiral=final?Math.sin(p*4+i)*16:0,dx=Math.cos(angle)*p*(final?80:43)+spiral,dy=d.boss==='spreader'?-p*(28+i%4*12):d.boss==='agitator'?p*p*(18+i%5*8):d.boss==='manipulator'?Math.sin(i)*p*45+p*p*35:Math.sin(angle)*p*70;c.globalAlpha=Math.max(0,1-p*1.15);c.drawImage(sprite,col*w,row*h,w,h,x+col*w+dx,y+row*h+dy,w*(1-p*.15),h*(1-p*.15));}
 const type=d.boss==='spreader'?0:d.boss==='agitator'?1:d.boss==='manipulator'?5:6,frame=projectileFrames[type];if(t>.3&&t<1.45)for(let i=0;i<8;i++){const angle=i*2.39,travel=(t-.3)*(25+i*5);c.globalAlpha=Math.max(0,(1.45-t)/1.15);c.drawImage(a.projectiles,...frame,d.x+d.w/2+Math.cos(angle)*travel,d.y+d.h/2+Math.sin(angle)*travel-(d.boss==='spreader'?t*25:0),d.boss==='manipulator'?22:17,14);}
 c.restore();
}
