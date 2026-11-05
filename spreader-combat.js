// Only the Spreader uses this encounter. Geometry and the other boss controllers stay intact.
export function spreaderDeck(g){return g.platforms.filter(s=>s.room===g.boss.room&&s.y<=200&&s.w>=200).sort((a,b)=>b.x-a.x)[0];}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function warning(g,ability,time){const b=g.boss;b.state='windup';b.ability=ability;b.timer=time;g.emit('bossWarning',{boss:b.id,ability,x:b.x,y:b.y});}
export function summonServants(g){
 const b=g.boss,s=spreaderDeck(g);if(!s||b.phase<2||b.state==='casting'&&b.ability==='swoop')return [];
 const alive=g.enemies.filter(e=>e.bossOwnerId==='spreader'&&!e.dead),made=[];
 for(const x of [s.x+8,s.x+s.w-42]){
  if(alive.length+made.length>=2)break;
  const y=s.y-90;if(Math.hypot(x-g.player.x,y-g.player.y)<82||alive.concat(made).some(e=>Math.hypot(x-e.x,y-e.y)<45))continue;
  const e={id:'servant-'+(++g.tacticalSerial),type:'servant',name:'Прислужник',room:b.room,bossOwnerId:'spreader',platformIndex:s.index,x,y,w:32,h:23,hp:1,maxHp:1,active:true,noticed:true,flying:true,dir:g.player.x<x?-1:1,state:'patrol',flank:x<s.x+s.w/2?-1:1,timer:.8,spawnTime:.55,arrivalDuration:.55,inv:0,hurtTime:0,lastSwing:-1,dead:false,deathTime:0,walkTime:0};
  g.enemies.push(e);made.push(e);g.emit('bossSummon',{boss:b.id,enemyType:e.type,x,y});
 }return made;
}
function bomb(g){const b=g.boss;for(const offset of [25,75])g.bolts.push({room:b.room,kind:'paper',visual:'spreader',x:b.x+offset,y:b.y+b.h*.65,w:17,h:16,vx:0,vy:205,ttl:2.5});}
export function stepSpreader(g,dt){
 const b=g.boss,s=spreaderDeck(g),p=g.player;if(!s)return;
 b.timer-=dt;
 if(b.phase===1&&p.grounded&&p.supportId===s.id){b.phase=2;b.phaseName='Рывок и Прислужники';b.state='phaseChange';b.timer=.7;b.ability=null;g.bolts=[];g.emit('bossPhase',{boss:b.id,phase:2,name:b.phaseName});}
 if(b.phase===2&&b.hp<=b.maxHp/3&&b.state!=='casting'&&b.state!=='recover'){b.phase=3;b.phaseName='Последний тираж';g.emit('bossPhase',{boss:b.id,phase:3,name:b.phaseName});}
 if(b.phase===1){
  if(b.state==='recover')b.state='idle';
  b.x+=(clamp(p.x+145,s.x-1100,s.x+s.w-b.w)-b.x)*Math.min(1,dt*2);b.y=Math.max(76,p.y-180);
  if(b.timer<=0){if(b.state==='windup'){bomb(g);b.state='casting';b.timer=1.6;g.emit('bossCast',{boss:b.id,ability:'scatter',x:b.x,y:b.y});}else warning(g,'scatter',.65);}return;
 }
 if(b.state==='phaseChange'&&b.timer>0)return;
 if(b.state==='retreat'){
  const dx=b.edge-b.x;b.x+=Math.sign(dx)*Math.min(Math.abs(dx),dt*320);b.y+=(s.y-b.h-b.y)*Math.min(1,dt*8);
  if(Math.abs(dx)<2&&Math.abs(b.y-(s.y-b.h))<2){b.x=b.edge;b.y=s.y-b.h;b.dir=b.x<s.x+s.w/2?1:-1;warning(g,'swoop',b.phase===3?.7:.8);}return;
 }
 if(b.state==='casting'&&b.ability==='swoop'){
  const t=clamp(1-b.timer/.48,0,1);b.x=b.rushFrom+(b.rushTo-b.rushFrom)*t;b.y=s.y-b.h;
  if(b.timer<=0){b.x=b.rushTo;b.state='recover';b.timer=b.phase===3?1.25:1.4;b.counterHit=false;b.recoveryPaper=false;if(b.phase===3)g.emit('bossWarning',{boss:b.id,ability:'scatter',x:b.x,y:b.y});}return;
 }
 if(b.phase===3&&b.state==='recover'&&b.timer<=.6&&!b.recoveryPaper){bomb(g);b.recoveryPaper=true;}
 if(b.timer>0)return;
 if(b.state==='windup'){
  if(b.ability==='swoop'){b.rushFrom=b.x;b.rushTo=b.x<s.x+s.w/2?s.x+s.w-b.w:s.x;b.dir=b.rushTo>b.x?1:-1;b.state='casting';b.timer=.48;g.emit('bossCast',{boss:b.id,ability:'swoop',x:b.x,y:b.y});}
  else{bomb(g);b.state='casting';b.timer=.6;}return;
 }
 if(b.state==='recover'){
  b.cycles=(b.cycles||0)+1;
 }
 // Summon in the quiet interval, never during a rush or on top of Uma.
 if(b.phase===3||!(b.cycles%2))summonServants(g);b.state='retreat';b.ability=null;b.edge=p.x<s.x+s.w/2?s.x+s.w-b.w:s.x;
}
export function stepServant(g,e,dt,paw){
 if(e.dead){e.deathTime=Math.max(0,e.deathTime-dt);return;}
 if(e.spawnTime>0){e.spawnTime=Math.max(0,e.spawnTime-dt);return;}
 e.inv=Math.max(0,e.inv-dt);e.timer-=dt;e.walkTime+=dt;
 const p=g.player,s=spreaderDeck(g),dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+12-e.y;
 if(e.state==='patrol'){
  e.dir=dx<0?-1:1;e.x+=clamp(dx+e.flank*70,-64,64)*dt;e.y+=clamp(p.y-38-e.y,-48,48)*dt;
  if(Math.abs(dx)<110&&Math.abs(dy)<65&&e.timer<=0){e.state='windup';e.timer=.5;e.aimX=p.x;e.aimY=p.y;}
 }else if(e.state==='windup'&&e.timer<=0){const len=Math.hypot(e.aimX-e.x,e.aimY-e.y)||1;e.vx=(e.aimX-e.x)/len*210;e.vy=(e.aimY-e.y)/len*210;e.state='lunge';e.timer=.28;}
 else if(e.state==='lunge'){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.timer<=0){e.state='recover';e.timer=1;}}
 else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.7;}
 if(s){e.x=clamp(e.x,s.x-80,s.x+s.w+45);e.y=clamp(e.y,s.y-145,s.y-28);}
 // During the boss rush, helpers rise clear of the ordinary jump corridor.
 if(g.boss.state==='casting'&&g.boss.ability==='swoop'){e.y=Math.min(e.y,s.y-135);e.state='recover';e.timer=.8;}
 if(p.attack>0&&e.lastSwing!==p.swing&&g.overlap(paw,e)){e.lastSwing=p.swing;g.hitEnemy(e);}
 if(!e.dead&&e.state==='lunge'&&g.overlap(p,e))g.hurt(false,e.x);
}
