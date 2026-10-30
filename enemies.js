// Enemy telegraphs and attacks are independent of rendering and audio.
export function alertNearby(g,caller){
 const targets=g.enemies.filter(e=>!e.dead&&e!==caller&&e.type!=='clickbait'&&e.type!=='panicker'&&Math.abs(e.x-caller.x)<420).sort((a,b)=>Math.abs(a.x-caller.x)-Math.abs(b.x-caller.x)).slice(0,4);
 for(const e of targets){e.alert=6;if(e.state==='patrol'||e.state==='recover')e.dir=g.player.x<e.x?-1:1;if(e.state==='patrol')e.timer=Math.min(e.timer,.3);}
 g.emit('alarm',{x:caller.x+24,y:caller.y,attracted:targets.length});
}
export function stepEnemies(g,dt,paw,prevBottom){
 const p=g.player;
 for(const e of g.enemies){
  if(e.dead)continue;e.inv=Math.max(0,e.inv-dt);e.timer-=dt;e.alert=Math.max(0,e.alert-dt);
  const dx=p.x-e.x,dy=p.y+p.h-(e.y+e.h),near=Math.abs(dx)<380&&Math.abs(dy)<190;
  if(e.type==='infonoise'){
   if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.6;}
   if(e.state==='patrol'){
    if(e.alert>0)e.dir=dx<0?-1:1;
    e.x+=e.dir*e.speed*(e.alert>0?1.4:1)*dt;
    if(near&&e.timer<=0){e.state='windup';e.dir=dx<0?-1:1;e.timer=.5;}
   }else if(e.state==='windup'&&e.timer<=0){
    const tx=p.x+p.w/2-(e.x+24),ty=p.y+24-(e.y+12),len=Math.hypot(tx,ty)||1;
    g.bolts.push({kind:'paper',x:e.x+24,y:e.y+12,w:16,h:13,vx:tx/len*155,vy:ty/len*155,ttl:4,sourceId:e.id});
    e.state='patrol';e.timer=e.alert>0?1.1:2.1;g.emit('enemyShot',{x:e.x,y:e.y});
   }
  }else if(e.type==='headline'){
   if(e.state==='patrol'&&Math.abs(dx)<330&&Math.abs(dy)<85){e.dir=dx<0?-1:1;e.state='windup';e.timer=.8;e.blastHit=false;}
   else if(e.state==='windup'&&e.timer<=0){e.state='blast';e.timer=.35;g.emit('blast',{x:e.x,y:e.y});}
   else if(e.state==='blast'&&e.timer<=0){e.state='recover';e.timer=2;}
   else if(e.state==='recover'&&e.timer<=0)e.state='patrol';
   if(e.state==='blast'&&!e.blastHit){
    const beam={x:e.dir>0?e.x+40:e.x-300,y:e.y-6,w:300,h:42};
    if(g.overlap(p,beam)){e.blastHit=true;if(p.dash===0)g.push(e.dir,e.x);}
   }
  }else if(e.type==='panicker'){
   if(e.state==='patrol'&&Math.abs(dx)<215&&Math.abs(dy)<110){e.state='windup';e.timer=.45;}
   else if(e.state==='windup'&&e.timer<=0){e.state='alarm';e.timer=1.25;alertNearby(g,e);}
   else if(e.state==='alarm'&&e.timer<=0){e.state='recover';e.timer=3;}
   else if(e.state==='recover'&&e.timer<=0)e.state='patrol';
  }else if(e.type==='clickbait'){
   if(e.state==='lure'&&Math.abs(dx)<95&&Math.abs(dy)<75){e.dir=dx<0?-1:1;e.state='windup';e.timer=.6;g.emit('baitReveal',{x:e.x,y:e.y});}
   else if(e.state==='windup'&&e.timer<=0){e.state='snap';e.timer=.45;}
   else if(e.state==='snap'&&e.timer<=0){e.state='recover';e.timer=2;}
   else if(e.state==='recover'&&e.timer<=0)e.state='lure';
  }
  if(e.x<e.origin||e.x>e.end){e.dir*=-1;e.x=Math.max(e.origin,Math.min(e.end,e.x));}
  if(p.attack>0&&e.lastSwing!==p.swing&&g.overlap(paw,e)){
   e.lastSwing=p.swing;if(e.type==='clickbait'&&e.state==='lure'){e.state='windup';e.timer=.6;e.dir=dx<0?-1:1;}
   g.hitEnemy(e);
  }
  if(e.dead)continue;
  if(e.type==='clickbait'){
   const mouth={x:e.dir>0?e.x+2:e.x-40,y:e.y-30,w:88,h:72};
   if(e.state==='snap'&&g.overlap(p,mouth)&&p.dash>0){e.state='recover';e.timer=2;}
   else if(e.state==='snap'&&p.inv===0&&g.overlap(p,mouth)){
    g.swallow={x:p.x,y:p.y,targetX:e.x+12,targetY:e.y-14,timer:.8,total:.8};p.attack=0;p.vx=0;p.vy=0;
    e.state='recover';e.timer=2;g.emit('swallow',{x:e.x,y:e.y});return;
   }
  }else if(g.overlap(p,e)){
   if(p.vy>0&&prevBottom<e.y+12){g.hitEnemy(e,true);p.vy=-330;}
   else g.hurt(false,e.x);
  }
 }
}
