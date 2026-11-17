import {drawHit,drawRun} from './cat-animation.js?v=0.21.5';
// Reuse Uma's approved, unmodified sprites. Her face/nose are never regenerated.
export function umaReaction(p,g){
 if(g.swallow||p.dash>0||p.attack>0||p.climbing)return null;
 if(p.flashReaction>0){const age=1.15-p.flashReaction;return {kind:'flash',frame:age<.12?0:age<.74?3:age<.93?4:5};}
 if(g.room===3&&g.roofs?.gust)return {kind:p.grounded?'brace':'tuck',frame:p.grounded?4:2+Math.floor(g.time*5)%2,face:-g.roofs.wind.dir};
 if(p.spotSlowed&&p.grounded&&Math.abs(p.vx)>1)return {kind:'slow',frame:null};
 return null;
}
export function drawUmaReaction(c,a,p,g){
 const pose=umaReaction(p,g);if(!pose)return false;const x=p.x+p.w/2,y=p.y+p.h,flip=(pose.face??p.dir)<0;
 if(pose.kind==='flash'){drawHit(c,a,pose.frame,x,y,flip);}
 else if(pose.kind==='brace'){
  // Feet stay planted; a subtle lean is the force of the wind, not a replacement drawing.
  c.save();c.translate(x,y);c.transform(1,0,g.roofs.wind.dir*(.025+Math.sin(g.time*14)*.005),1,0,0);drawHit(c,a,4,0,0,flip);c.restore();
 }else if(pose.kind==='tuck')drawRun(c,a,pose.frame,x,y,flip);
 else{const frames=[1,2,3,4,5,6],frame=frames[Math.floor((p.slowWalkTime||0)*10)%frames.length];drawRun(c,a,frame,x,y,flip);}
 return true;
}
