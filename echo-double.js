// Эхо (Измерение): Uma's dark double. It replays her own path a couple of seconds late, pose for pose.
// Standing still lets it catch up — its touch costs a heart. A paw hit scatters it for a while; three hits end it.
// Several doubles queue up on the same trail, each a little further behind.
export const ECHO_DELAY=2,ECHO_GAP=.7,ECHO_SCATTER=2.6,ECHO_FORM=.6,ECHO_ROOM=7,ECHO_KEEP=5;
export function recordEchoTrail(g){
 if(g.room!==ECHO_ROOM||g.mode!=='playing'){if(g.room!==ECHO_ROOM)g.echoTrail=[];return;}
 const p=g.player,trail=g.echoTrail??=[];
 trail.push({t:g.time,x:p.x,y:p.y,h:p.h,dir:p.dir,vx:p.vx,grounded:p.grounded||p.climbing,sneaking:p.sneaking,attack:p.attack});
 while(trail.length&&trail[0].t<g.time-ECHO_KEEP)trail.shift();
}
// The last recorded sample at or before `t`.
export function trailAt(g,t){
 const trail=g.echoTrail||[];if(!trail.length||trail[0].t>t)return null;
 let lo=0,hi=trail.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(trail[mid].t<=t)lo=mid;else hi=mid-1;}return trail[lo];
}
export function echoPose(s){return s.sneaking?'crouch':s.attack>0?'swat':!s.grounded?'air':Math.abs(s.vx)>1?'run':'stand';}
function place(e,s){e.x=s.x+17-e.w/2;e.y=s.y+s.h-e.h;e.dir=s.dir;e.pose=echoPose(s);e.moving=e.pose==='run';}
export function scatterEcho(g,e,time=ECHO_SCATTER){e.state='scatter';e.scatterTime=time;e.moving=false;g.emit('echoScatter',{x:e.x,y:e.y,enemyType:'echo'});}
export function stepEchoDouble(g,e,dt){
 e.scatterTime=Math.max(0,(e.scatterTime||0)-dt);e.formTime=Math.max(0,(e.formTime||0)-dt);
 if(e.state==='scatter'){if(e.scatterTime>0)return;e.state='idle';}
 if(!e.noticed)return;
 if(e.state!=='forming'&&e.state!=='chase'){
  // Join the queue behind any double already on the trail.
  const ahead=g.enemies.filter(o=>o!==e&&o.type==='echo'&&!o.dead&&o.room===e.room&&['forming','chase'].includes(o.state)).length;
  e.delay=ECHO_DELAY+ahead*ECHO_GAP;e.state='forming';e.formTime=ECHO_FORM;g.emit('echoForm',{x:e.x,y:e.y,enemyType:'echo'});
 }
 const s=trailAt(g,g.time-(e.delay||ECHO_DELAY));if(!s)return;
 const leap=e.state==='chase'&&Math.hypot(s.x+17-e.x-e.w/2,s.y+s.h-e.y-e.h)>110;
 place(e,s);
 if(leap){e.state='forming';e.formTime=.35;}
 if(e.state==='forming'&&e.formTime<=0)e.state='chase';
}
export function echoDoubleContact(g,e){
 const p=g.player;if(e.state!=='chase'||p.dash>0||p.inv>0||!g.overlap(p,e))return;
 const before=g.health;g.hurt(false,e.x);if(g.health<before)scatterEcho(g,e);
}
