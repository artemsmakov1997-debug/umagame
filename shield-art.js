import {rect} from './pixel.js?v=0.22.0';
export function drawPixelBarrier(c,cx,cy,rx,ry,{half=0,alpha=1,flash=0,time=0,color='#81e5f0'}={}){
 c.save();c.globalAlpha=alpha;for(let yy=-ry;yy<=ry;yy+=3){const edge=Math.round(Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)))*rx),nextY=Math.min(ry,yy+3),next=Math.round(Math.sqrt(Math.max(0,1-nextY*nextY/(ry*ry)))*rx),near=Math.min(edge,next),far=Math.max(edge,next),left=half===1?0:-edge,right=half===-1?0:edge;
  rect(c,cx+left,cy+yy,Math.max(1,right-left),3,flash>0?'#b8f3ff45':'#397dbd20');
  if(half!==1){rect(c,cx-far-3,cy+yy,far-near+4,3,'#143a70b0');rect(c,cx-far-1,cy+yy,far-near+2,3,flash>0?'#efffff':color);}
  if(half!==-1){rect(c,cx+near,cy+yy,far-near+4,3,'#15375fbb');rect(c,cx+near,cy+yy,far-near+2,3,flash>0?'#efffff':color);}
  if(Math.abs(yy+ry*.35)<6){const x=half===-1?-edge*.65:edge*.65;rect(c,cx+x,cy+yy,3,2,'#ddfcff88');}
 }const sweep=(-ry+(time*20)%(ry*2));rect(c,cx+(half===-1?-rx*.5:half===1?rx*.2:-rx*.3),cy+sweep,Math.max(3,rx*.25),2,'#95dfee66');c.restore();
}
function beam(c,x1,y1,x2,y2,t){const len=Math.hypot(x2-x1,y2-y1),steps=Math.max(1,Math.ceil(len/5));c.save();c.globalAlpha=.4;let px=x1,py=y1;for(let i=0;i<=steps;i++){const x=x1+(x2-x1)*i/steps,y=y1+(y2-y1)*i/steps,w=Math.abs(x-px),h=Math.abs(y-py),left=Math.min(x,px),top=Math.min(y,py);rect(c,left-2,top-2,w+5,h+5,'#144b78');rect(c,left,top,w+2,h+2,(i+Math.floor(t*10))%9===0?'#a0e5ed':'#52b8d0');px=x;py=y;}c.restore();}
export function drawBossBarrier(c,g,t){const b=g.boss,live=[...g.relays.filter(d=>d.room===b.room&&d.hp>0),...(b.environmentGuard?(g.devices||[]).filter(d=>d.room===b.room&&d.hp&&d.jammed<=0):[])],fade=b.shieldDissolve||0;if(!live.length&&!fade)return;const big=b.id==='infoshum',cx=b.x+b.w/2,cy=b.y+b.h/2-22,rx=big?150:94,ry=big?134:85;
 if(live.length)for(const d of live)beam(c,d.x+d.w/2,d.y+25,cx,cy,t);
 drawPixelBarrier(c,cx,cy,rx,ry,{alpha:live.length?.85:fade/.45,flash:b.guardFlash,time:t,color:b.id==='manipulator'?'#b6a0f1':'#83dfe9'});
 if(fade&&!live.length)for(let i=0;i<10;i++){const angle=i*Math.PI/5,r=1+(1-fade/.45)*.25;rect(c,cx+Math.cos(angle)*rx*r,cy+Math.sin(angle)*ry*r,3,4,'#97e7ee');}
}
