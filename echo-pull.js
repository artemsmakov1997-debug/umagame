const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const owner=(g,id)=>g.enemies.find(e=>e.id===id)||g.bolts.find(e=>e.id===id);
export function releaseEchoPull(g,grace=false){
 const e=g.echoPull&&owner(g,g.echoPull.ownerId);
 if(e&&!e.dead){e.state='recover';e.timer=2;e.warpCooldown=Math.max(e.warpCooldown||0,2);}
 g.echoPull=null;g.player.echoPulled=false;if(!g.tether)g.player.pulled=false;
 if(grace)g.player.echoGrace=1.8;
}
// Echo is a stationary trap. A contracting body warns before its suction starts.
export function stepEcho(g,e,dt){
 const p=g.player,dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+p.h/2-e.y-e.h/2,distance=Math.hypot(dx,dy);
 e.timer=(e.timer||0)-dt;e.moving=false;
 if(p.dash>0&&['windup','pulling'].includes(e.state)){if(g.echoPull?.ownerId===e.id)releaseEchoPull(g,true);else{e.state='recover';e.timer=2;p.echoGrace=1.8;}return;}
 if(e.state==='recover'){if(e.timer<=0)e.state='patrol';return;}
 const safe=p.inv>0||g.echoImmunity>0||p.echoGrace>0||e.warpCooldown>0,visible=e.x+e.w/2>=g.camera+16&&e.x+e.w/2<=g.camera+(g.viewWidth||768)-16;
 if(e.state==='patrol'&&!safe&&visible&&distance<245&&!g.echoPull){e.state='windup';e.timer=.65;g.emit('echoWarning',{x:e.x,y:e.y,enemyType:'echo'});}
 else if(e.state==='windup'){
  if(safe||distance>310){e.state='recover';e.timer=1;}
  else if(e.timer<=0&&!g.echoPull){e.state='pulling';e.timer=3;g.echoPull={ownerId:e.id};g.emit('echoPull',{x:e.x,y:e.y,enemyType:'echo'});}
 }else if(e.state==='pulling'&&(e.timer<=0||safe||distance>310))releaseEchoPull(g);
}
export function stepEchoPull(g,dt){
 const p=g.player;p.echoPulled=false;if(!g.echoPull)return;
 const e=owner(g,g.echoPull.ownerId);
 if(!e||e.dead||e.ttl<=0||e.phased||e.room!==g.room||e.state!=='pulling'||p.dash>0||p.inv>0||g.echoImmunity>0||p.echoGrace>0){releaseEchoPull(g,p.dash>0);return;}
 const dx=e.x+e.w/2-p.x-p.w/2,dy=e.y+e.h/2-p.y-p.h/2,distance=Math.hypot(dx,dy)||1;
 if(distance>310){releaseEchoPull(g);return;}
 p.echoPulled=true;p.pulled=true;p.sleeping=false;p.idleTime=0;p.slideTime=(p.slideTime||0)+dt;
 p.vx=clamp(p.vx+dx/distance*230,-280,280);p.vy=dy/distance*150-1080*dt;p.grounded=false;p.climbing=false;p.coyote=0;
}
