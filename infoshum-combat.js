// The final boss owns its network. It does not reuse antenna damage or other bosses' attack schedules.
import {rooms} from './level.js?v=0.21.5';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STAGE_ROOM=8;
const MONITOR_DAMAGE=2;
const CORE_DAMAGE=4;
const EXPOSE_SECONDS=5.4;
// Final phase pressure: interference fills the screen; at 100 % Uma loses a life (test protection buys time).
export const NOISE_TIME=60;

export function createInfoshumNetwork(room=STAGE_ROOM){
 const base=rooms[room].x;
 const layouts=[
  {x:125,y:145,w:222,h:156,terminalX:233,terminalY:305},
  {x:658,y:89,w:222,h:174,terminalX:766,terminalY:251},
  {x:1173,y:145,w:222,h:156,terminalX:1277,terminalY:305}
 ];
 return {
  stage:'network',mode:'recover',timer:1.35,turn:0,cycle:0,activeIndex:0,
  fromIndex:0,toIndex:1,transitTime:0,transitDuration:.9,
  monitors:layouts.map((m,index)=>({
   ...m,x:base+m.x,terminalX:base+m.terminalX,index,
   state:'idle',openTime:0,lastSwing:-1,charge:0,armor:2,shieldTime:0,guardFlash:0
  })),
  lastMonitorIndex:0,scanX:0,volley:0,extraTargets:[],target:null,lastSwing:-1,attackKind:'tentacle',hitDelivered:false,
  defeatedMonitors:0,transitionProgress:0
 };
}
export function currentInfoshumMonitor(b){
 const n=b.network;return n?.monitors[n.activeIndex]||null;
}
function syncBoss(b){
 const m=currentInfoshumMonitor(b);if(!m)return;
 b.x=m.x+(m.w-b.w)/2;b.y=m.y+(m.h-b.h)/2;
 b.dir=1;b.state='network';
}
function targetSurface(g){
 const p=g.player;
 const support=g.platforms.find(s=>s.id===p.supportId&&!s.bossHidden&&s.room===g.room);
 const surfaces=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&p.x+p.w>s.x&&p.x<s.x+s.w);
 const below=surfaces.filter(s=>s.y>=p.y+p.h-6).sort((a,b)=>a.y-b.y)[0];
 const s=support||below||surfaces.sort((a,b)=>Math.abs(a.y-p.y-p.h)-Math.abs(b.y-p.y-p.h))[0];
 return {x:clamp(p.x+p.w/2,s?.x+32||rooms[g.room].x+32,s?.x+s?.w-32||rooms[g.room].end-32),y:s?.y||474,platformId:s?.id,left:s?.x??rooms[g.room].x,right:s?s.x+s.w:rooms[g.room].end};
}
function nextMonitor(n){
 // Always travel to a living, different screen. The trail shows the destination.
 const available=n.monitors.filter(m=>m.state!=='broken'&&m.index!==n.activeIndex);
 return available[n.turn%Math.max(1,available.length)]?.index??n.activeIndex;
}
function chooseAttack(g){
 const n=g.boss.network;
 n.target=targetSurface(g);
 n.attackKind=['rain','wave','platformPulse','packet'][(n.turn+n.volley)%4];
 n.extraTargets=neighborTargets(g,n.target);
 n.mode='charge';n.timer=1.12;
 g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:n.attackKind});
}
function neighborTargets(g,primary){return g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&s.id!==primary.platformId&&Math.abs(s.x+s.w/2-primary.x)>110&&s.y<430&&s.w>=100).sort((a,b)=>Math.hypot(a.x+a.w/2-primary.x,a.y-primary.y)-Math.hypot(b.x+b.w/2-primary.x,b.y-primary.y)).slice(0,1).map(s=>({x:s.x+s.w/2,y:s.y,platformId:s.id,left:s.x,right:s.x+s.w}));}
function platformPulse(g,n){for(const t of[n.target,...(n.extraTargets||[])])g.bolts.push({room:g.room,kind:'platformPulse',infoshumAttack:'pulse',visual:'infoshum',x:t.x-38,y:t.y-66,w:76,h:66,vx:0,vy:0,ttl:.3});g.emit('bossCast',{boss:'infoshum',ability:'platformPulse',x:n.target.x,y:n.target.y});}
function createWave(g,n){
 const r=rooms[g.room],t=n.target;
 const fromLeft=t.x<r.x+r.width/2,x=fromLeft?r.x+12:r.end-48,dir=fromLeft?1:-1;
 g.bolts.push({room:g.room,kind:'wave',x,y:t.y-13,w:52,h:18,infoshumAttack:'wave',vx:dir*225,vy:0,ttl:5.5,fixedY:true,visual:'infoshum'});
 g.emit('bossCast',{boss:'infoshum',ability:'wave',x,y:t.y});
}
function createRain(g,n){for(const t of[n.target,...(n.extraTargets||[])])for(const dx of[-38,-12,14,40])g.bolts.push({room:g.room,kind:'dataRain',infoshumAttack:'rain',visual:'infoshum',x:t.x+dx-6,y:Math.max(12,t.y-190),w:12,h:34,vx:0,vy:320,ttl:1.5,stopY:t.y+4});g.emit('bossCast',{boss:'infoshum',ability:'rain',x:n.target.x,y:n.target.y});}
function createPacket(g,n){const m=currentInfoshumMonitor(g.boss),x=m.x+m.w/2,y=m.y+m.h/2,dx=n.target.x-x,dy=n.target.y-24-y,len=Math.hypot(dx,dy)||1;g.bolts.push({room:g.room,kind:'packet',visual:'infoshum',x,y,w:18,h:16,vx:dx/len*180,vy:dy/len*180,ttl:5});}
function strikeSurface(g,n){
 const t=n.target,p=g.player;
 // The warning is fixed before impact; jumping or stepping away always works.
 if(g.overlap(p,{x:t.x-38,y:t.y-66,w:76,h:66}))g.hurt(false,t.x);
 g.emit('infoshumSlam',{x:t.x,y:t.y});
}
function beginDeparture(g){
 const b=g.boss,n=b.network,source=n.monitors[n.activeIndex];
 n.fromIndex=n.activeIndex;n.toIndex=nextMonitor(n);
 if(n.toIndex===n.fromIndex){if(source.shieldTime>0){n.mode='recover';n.timer=.7;return;}source.state='open';source.openTime=EXPOSE_SECONDS;source.charge=1;n.mode='isolated';n.timer=EXPOSE_SECONDS;g.emit('infoshumTerminalOpen',{index:source.index,x:source.terminalX,y:source.terminalY});return;}
 for(const m of n.monitors)if(m.state==='open'){m.state='idle';m.openTime=0;}
 n.mode='transit';n.transitTime=0;n.timer=n.transitDuration;
 source.state='open';source.openTime=EXPOSE_SECONDS;source.charge=1;
 g.emit('infoshumTransfer',{from:n.fromIndex,to:n.toIndex,x:source.x+source.w/2,y:source.y+source.h/2});
}
function moveToNewScreen(g){
 const b=g.boss,n=b.network;n.activeIndex=n.toIndex;
 n.turn++;
 const dest=n.monitors[n.activeIndex];dest.state='occupied';
 syncBoss(b);n.mode='recover';n.timer=.65;n.volley=0;
 g.emit('infoshumArrive',{index:n.activeIndex,x:dest.x+dest.w/2,y:dest.y+dest.h/2});
}
function beginRupture(g){
 const b=g.boss,n=b.network;
 n.stage='rupture';n.mode='rupture';n.timer=2.25;n.transitionProgress=0;
 n.monitors.forEach(m=>{m.openTime=0;if(m.state!=='broken')m.state='rupturing';});
 b.phase=2;b.phaseName='Освобождение';b.state='phaseChange';b.timer=2.25;
 b.hp=Math.max(1,b.hp);
 g.bolts=[];g.cuts=[];g.inks=[];
 g.player.inv=Math.max(g.player.inv,2.9);
 g.emit('bossPhase',{boss:'infoshum',phase:2,name:'Освобождение'});
 g.emit('infoshumRupture',{x:b.x+b.w/2,y:b.y+b.h/2});
}
function rebuildArena(g){
 const r=rooms[g.room];
 const shapes={
  0:[0,474,460],1:[92,366,296],2:[617,332,300],
  3:[1131,366,296],4:[411,413,165],5:[965,413,165],
  9:[464,272,145],10:[961,272,145],
  11:[520,474,530],12:[1110,474,426]
 };
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;}
 }
 // The rebuild is a safe cinematic transition, not an unavoidable fall.
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===2);
 p.x=landing.x+45;p.y=landing.y-p.h;p.vx=0;p.vy=0;
 p.grounded=true;p.supportId=landing.id;p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];
 g.updateCamera();
}
function beginFreed(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 rebuildArena(g);n.stage='free';n.mode='rest';n.timer=1;n.noise=0;n.noiseTime=0;
 n.target=null;n.extraTargets=[];n.cycle=0;n.hitDelivered=false;
 b.phase=2;b.state='recover';b.x=r.x+r.width/2-b.w/2;b.y=92;
 b.dir=-1;b.cooldown=0;
 g.emit('infoshumFreed',{x:b.x+b.w/2,y:b.y+b.h/2});
}
function beginFinalAttack(g){
 const n=g.boss.network;n.target=targetSurface(g);
 n.extraTargets=neighborTargets(g,n.target);
 n.mode=['slamWarning','waveWarning','rainWarning','beamWarning','platformWarning'][n.cycle%5];
 n.timer=n.mode==='waveWarning'?.9:1.05;
 g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:n.mode});
}
export function stepInfoshum(g,dt){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 for(const m of n.monitors){m.destroyTime=Math.max(0,(m.destroyTime||0)-dt);m.shieldTime=Math.max(0,(m.shieldTime||0)-dt);m.guardFlash=Math.max(0,(m.guardFlash||0)-dt);if(m.state==='open'){
  m.openTime=Math.max(0,m.openTime-dt);
  m.charge=m.openTime/EXPOSE_SECONDS;
  if(!m.openTime)m.state=m.index===n.activeIndex?'occupied':'idle';
 }}
 if(n.stage==='rupture'){
  n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/2.25;
  if(n.timer===0)beginFreed(g);
  return;
 }
 if(n.stage==='network'){
  syncBoss(b);
  if(n.mode==='transit'){
   n.timer-=dt;n.transitTime=Math.min(n.transitDuration,n.transitTime+dt);
   if(n.timer<=0)moveToNewScreen(g);
   return;
  }
  n.timer-=dt;if(n.timer>0)return;
  if(n.mode==='charge'){
   if(n.attackKind==='wave')createWave(g,n);
   else if(n.attackKind==='rain')createRain(g,n);else if(n.attackKind==='platformPulse')platformPulse(g,n);else createPacket(g,n);
   n.mode='attack';n.timer=.37;b.state='network';
  }else if(n.mode==='attack'){n.volley++;if(n.volley<2){chooseAttack(g);}else{n.mode='rest';n.timer=.7;}}
  else if(n.mode==='rest'){n.mode='transferWarning';n.timer=.8;n.toIndex=nextMonitor(n);
   g.emit('infoshumTransferWarning',{from:n.activeIndex,to:n.toIndex});
  }else if(n.mode==='transferWarning')beginDeparture(g);
  else if(n.mode==='recover'||n.mode==='isolated')chooseAttack(g);
  else chooseAttack(g);
  return;
 }
 // Freed form: five telegraphed attacks, each followed by a reachable exposed node, while interference rises.
 n.noiseTime=(n.noiseTime||0)+dt;n.noise=Math.min(1,n.noiseTime/NOISE_TIME);
 if(n.noise>=1){g.emit('interferenceLost');g.loseLife('interference');if(g.testingInvulnerable){n.noiseTime=NOISE_TIME*.82;n.noise=.82;}return;}
 b.state=n.mode==='weak'?'recover':'windup';
 if(n.mode==='scan'){n.scanX=clamp(n.target.x-95+(1.25-n.timer)/1.25*190,n.target.left+12,n.target.right-12);if(g.overlap(g.player,{x:n.scanX-7,y:20,w:14,h:n.target.y-20}))g.hurt(false,n.scanX);}
 n.timer-=dt;if(n.timer>0)return;
 if(n.mode==='rest'){beginFinalAttack(g);}
 else if(n.mode==='platformWarning'){platformPulse(g,n);n.mode='platformPulse';n.timer=.4;}
 else if(n.mode==='rainWarning'){createRain(g,n);n.mode='rain';n.timer=1;}
 else if(n.mode==='beamWarning'){if(n.extraTargets?.length)createRain(g,{...n,target:n.extraTargets[0],extraTargets:[]});n.mode='scan';n.timer=1.25;n.scanX=n.target.x-95;g.emit('bossCast',{boss:'infoshum',ability:'scan',x:n.scanX,y:n.target.y});}
 else if(n.mode==='rain'||n.mode==='scan'||n.mode==='platformPulse'){if(n.mode==='scan')n.target.x=n.scanX;n.mode='weak';n.timer=2.25;}
 else if(n.mode==='waveWarning'){
  createWave(g,n);if(n.extraTargets?.length)createWave(g,{...n,target:n.extraTargets[0]});n.mode='slamWarning';n.timer=1.05;n.target=targetSurface(g);n.extraTargets=neighborTargets(g,n.target);
  g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:'tentacle'});
 }else if(n.mode==='slamWarning'){
  strikeSurface(g,n);for(const t of n.extraTargets||[])strikeSurface(g,{...n,target:t});n.mode='slam';n.timer=.34;
 }else if(n.mode==='slam'){n.mode='weak';n.timer=2.25;
  g.emit('infoshumWeak',{x:n.target.x,y:n.target.y-40});
 }else if(n.mode==='weak'){n.cycle++;n.mode='rest';n.timer=.55;}
 else{n.mode='rest';n.timer=.7;}
}
function overloadMonitor(g,m){
 const b=g.boss,n=b.network;m.armor=Math.max(0,(m.armor??2)-1);m.openTime=0;m.charge=0;b.hp=Math.max(0,b.hp-MONITOR_DAMAGE);b.hurtTime=.35;
 if(m.armor>0){m.state='idle';m.shieldTime=6;m.guardFlash=.5;g.emit('infoshumArmorHit',{index:m.index,x:m.terminalX,y:m.terminalY});return;}
 m.state='broken';m.destroyTime=.9;n.lastMonitorIndex=m.index;n.defeatedMonitors++;
 g.emit('bossHit',{boss:'infoshum',x:m.x+m.w/2,y:m.y+m.h/2});g.emit('infoshumMonitorDestroyed',{index:m.index,x:m.x+m.w/2,y:m.y+m.h/2});
 if(n.defeatedMonitors===3)beginRupture(g);
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;
 if(!b.active||!n||p.attack<=0||b.hp<=0)return false;
 if(n.stage==='network'){
  for(const m of n.monitors){
   if(m.state!=='open'||m.shieldTime>0||m.lastSwing===p.swing)continue;
   const target={x:m.terminalX-23,y:m.terminalY-8,w:46,h:35};
   if(!g.overlap(paw,target))continue;
   m.lastSwing=p.swing;overloadMonitor(g,m);return true;
  }
  return false;
 }
 if(n.stage!=='free'||n.mode!=='weak'||n.lastSwing===p.swing||!n.target)return false;
 const target={x:n.target.x-30,y:n.target.y-56,w:60,h:54};
 if(!g.overlap(paw,target))return false;
 n.lastSwing=p.swing;b.hp=Math.max(0,b.hp-CORE_DAMAGE);b.hurtTime=.35;b.cooldown=.24;
 g.emit('bossHit',{boss:'infoshum',x:n.target.x,y:n.target.y-32});
 g.emit('infoshumCoreHit',{x:n.target.x,y:n.target.y-32});
 if(b.hp===0)g.bossDefeated();
 else{n.cycle++;n.mode='rest';n.timer=.65;n.target=null;}
 return true;
}
