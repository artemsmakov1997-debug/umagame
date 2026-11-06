export const BROADCAST_TIME=75;
export const AGITATOR_DOCKS=[1,8,10,3,6,8,1,7,9,2,5,7];
export function createBroadcastFight(){return {stage:'shield',mode:'rest',timer:1.2,turn:0,fill:0,elapsed:0,route:0,wave:null,antennas:[2,3].map((platformIndex,index)=>({index,platformIndex,hits:0,locked:false,lockTime:0,flash:0,turnTime:0,lastSwing:-1}))};}
export function antennaStation(g,a){const s=g.platforms.find(s=>s.room===4&&s.index===a.platformIndex);return {platform:s,x:s.x+s.w/2+(a.index?-15:15),y:s.y};}
function settle(g,index){const b=g.boss,s=g.platforms.find(s=>s.room===4&&s.index===index);b.x=s.x+(s.w-b.w)/2;b.y=s.y-b.h;b.platformIndex=index;b.dir=g.player.x<b.x?-1:1;}
function headline(g){
 const b=g.boss,n=b.broadcast,source={x:b.x+b.w/2,y:b.y+b.h*.4},p=g.player,dx=p.x+17-source.x,dy=p.y+24-source.y,len=Math.hypot(dx,dy)||1;
 g.bolts.push({room:4,kind:'headline',visual:'agitator',x:source.x-38,y:source.y-12,w:76,h:25,vx:dx/len*205,vy:dy/len*205,ttl:6});
 n.mode='headline';n.timer=.8;g.emit('bossCast',{boss:b.id,ability:'headline',x:source.x,y:source.y});
}
function sonic(g){const b=g.boss,n=b.broadcast;n.wave={x:b.x+b.w/2,y:b.y+b.h*.55,radius:10,age:0,hit:false};n.mode='sonic';n.timer=.8;g.emit('bossCast',{boss:b.id,ability:'sonic',x:b.x,y:b.y});}
function startHop(g){
 const b=g.boss,n=b.broadcast;n.route=(n.route+1)%AGITATOR_DOCKS.length;
 const s=g.platforms.find(s=>s.room===4&&s.index===AGITATOR_DOCKS[n.route]);
 n.from={x:b.x,y:b.y};n.to={x:s.x+(s.w-b.w)/2,y:s.y-b.h,platformIndex:s.index};n.mode='hop';n.timer=1;n.hopDuration=1;
 b.state='shift';g.emit('bossShift',{boss:b.id,x:n.to.x,y:n.to.y});
}
export function stepAgitator(g,dt){
 const b=g.boss,n=b.broadcast;if(!n||b.hp<=0)return;
 for(const a of n.antennas){a.lockTime=Math.max(0,a.lockTime-dt);a.flash=Math.max(0,a.flash-dt);a.turnTime=Math.max(0,a.turnTime-dt);}
 if(n.wave){const w=n.wave;w.age+=dt;w.radius+=310*dt;
  const p=g.player,distance=Math.hypot(p.x+17-w.x,p.y+p.h/2-w.y);
  if(!w.hit&&Math.abs(distance-w.radius)<35){w.hit=true;if(!p.dash){g.push(p.x+17<w.x?-1:1,w.x);g.emit('broadcastPush',{x:p.x,y:p.y});}}
  if(w.age>2.5)n.wave=null;
 }
 if(n.stage==='break'){
  n.timer-=dt;b.state='phaseChange';if(n.timer<=0){n.stage='chase';n.mode='hold';n.timer=2.5;b.phase=2;b.state='recover';n.elapsed=0;n.fill=0;}return;
 }
 if(n.stage==='shield'){
  settle(g,1);b.state=n.mode==='warning'?'windup':n.mode==='rest'?'recover':'casting';
  n.timer-=dt;if(n.timer>0)return;
  if(n.mode==='warning'){if(n.turn%2)headline(g);else sonic(g);n.turn++;}
  else{n.mode='warning';n.timer=1;g.emit('bossWarning',{boss:b.id,ability:n.turn%2?'headline':'sonic',x:b.x,y:b.y});}return;
 }
 n.elapsed+=dt;n.fill=Math.min(1,n.elapsed/BROADCAST_TIME);
 if(n.fill>=1){g.emit('broadcastLost');g.loseLife('interference');if(g.testingInvulnerable){n.elapsed=BROADCAST_TIME*.82;n.fill=.82;}return;}
 if(n.mode==='hop'){
  n.timer=Math.max(0,n.timer-dt);const t=1-n.timer/n.hopDuration;
  b.x=n.from.x+(n.to.x-n.from.x)*t;b.y=n.from.y+(n.to.y-n.from.y)*t-Math.sin(t*Math.PI)*80;b.dir=n.to.x>n.from.x?1:-1;b.state='shift';
  if(n.timer===0){Object.assign(b,n.to);n.mode='hold';n.timer=2.6;b.state='recover';}return;
 }
 b.state='recover';b.dir=g.player.x<b.x?-1:1;n.timer-=dt;
 if(n.timer<=0)startHop(g);
}
export function strikeAgitator(g,paw){
 const b=g.boss,n=b.broadcast,p=g.player;if(!n||n.stage!=='shield'||p.attack<=0||g.mode!=='playing')return false;
 for(const a of n.antennas){
  const at=antennaStation(g,a);if(a.hits>=3||a.lastSwing===p.swing||!g.overlap(paw,{x:at.x-29,y:at.y-43,w:58,h:44}))continue;
  a.lastSwing=p.swing;
  if(a.lockTime>0||a.locked&&n.antennas.some(other=>other!==a&&other.hits<3)){a.flash=.2;g.emit('blocked',{x:at.x,y:at.y-25});return false;}
  a.hits++;a.turnTime=.65;a.flash=.4;a.locked=true;a.lockTime=1.1;
  for(const other of n.antennas)if(other!==a)other.locked=false;
  const relay=g.relays.find(d=>d.room===4&&d.ordinal===a.index);if(relay)relay.hp=3-a.hits;
  g.emit('antennaHit',{index:a.index,hits:a.hits,x:at.x,y:at.y-30});
  if(n.antennas.every(other=>other.hits===3)){
   n.stage='break';n.mode='break';n.timer=1.6;n.wave=null;g.bolts=[];b.phase=2;b.state='phaseChange';g.player.inv=Math.max(g.player.inv,2);
   g.emit('broadcastShieldBreak',{x:b.x+b.w/2,y:b.y+b.h/2});
  }return true;
 }return false;
}
export function damageAgitator(g,amount){
 const b=g.boss,n=b.broadcast;if(!b.active||!n||b.hp<=0||b.cooldown>0||g.mode!=='playing')return false;if(n.stage!=='chase'){b.guardFlash=.24;g.emit('blocked',{x:b.x+b.w/2,y:b.y});return false;}
 const damage=Math.max(2,amount);b.hp=Math.max(0,b.hp-damage);b.cooldown=.4;b.hurtTime=.32;
 g.emit('bossHit',{boss:b.id,x:b.x+b.w/2,y:b.y+b.h/2});
 if(!b.hp)g.bossDefeated();else startHop(g);return true;
}
