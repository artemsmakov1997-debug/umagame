// The final boss owns its network. It does not reuse antenna damage or other bosses' attack schedules.
import {rooms} from './level.js?v=0.21.5';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STAGE_ROOM=8;
const MONITOR_DAMAGE=8;
const CORE_DAMAGE=4;
const EXPOSE_SECONDS=5.4;

export function createInfoshumNetwork(room=STAGE_ROOM){
 const base=rooms[room].x;
 const layouts=[
  {x:140,y:159,w:212,h:154,terminalX:220,terminalY:351},
  {x:656,y:99,w:224,h:166,terminalX:742,terminalY:303},
  {x:1188,y:159,w:212,h:154,terminalX:1266,terminalY:351}
 ];
 return {
  stage:'network',mode:'charge',timer:1.35,turn:0,cycle:0,activeIndex:0,
  fromIndex:0,toIndex:1,transitTime:0,transitDuration:.9,
  monitors:layouts.map((m,index)=>({
   ...m,x:base+m.x,terminalX:base+m.terminalX,index,
   state:'idle',openTime:0,lastSwing:-1,charge:0
  })),
  target:null,lastSwing:-1,attackKind:'tentacle',hitDelivered:false,
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
 return {x:clamp(p.x+p.w/2,s?.x+32||rooms[g.room].x+32,s?.x+s?.w-32||rooms[g.room].end-32),y:s?.y||474};
}
function nextMonitor(n){
 // Always travel to a living, different screen. The trail shows the destination.
 const available=n.monitors.filter(m=>m.state!=='broken'&&m.index!==n.activeIndex);
 return available[n.turn%Math.max(1,available.length)]?.index??n.activeIndex;
}
function chooseAttack(g){
 const n=g.boss.network;
 n.target=targetSurface(g);
 n.attackKind=n.turn%3===2?'wave':'tentacle';
 n.mode='charge';n.timer=1.12;
 g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:n.attackKind});
}
function createWave(g,n){
 const r=rooms[g.room],t=n.target;
 const fromLeft=t.x<r.x+r.width/2,x=fromLeft?r.x+12:r.end-48,dir=fromLeft?1:-1;
 g.bolts.push({room:g.room,kind:'wave',x,y:t.y-13,w:36,h:13,vx:dir*225,vy:0,ttl:5.5,fixedY:true,visual:'infoshum'});
 g.emit('bossCast',{boss:'infoshum',ability:'wave',x,y:t.y});
}
function strikeSurface(g,n){
 const t=n.target,p=g.player;
 // The warning is fixed before impact; jumping or stepping away always works.
 if(g.overlap(p,{x:t.x-38,y:t.y-66,w:76,h:66}))g.hurt(false,t.x);
 g.emit('infoshumSlam',{x:t.x,y:t.y});
}
function beginDeparture(g){
 const b=g.boss,n=b.network,source=n.monitors[n.activeIndex];
 n.fromIndex=n.activeIndex;n.toIndex=nextMonitor(n);
 if(n.toIndex===n.fromIndex)return;
 n.mode='transit';n.transitTime=0;n.timer=n.transitDuration;
 source.state='open';source.openTime=EXPOSE_SECONDS;source.charge=1;
 g.emit('infoshumTransfer',{from:n.fromIndex,to:n.toIndex,x:source.x+source.w/2,y:source.y+source.h/2});
}
function moveToNewScreen(g){
 const b=g.boss,n=b.network;n.activeIndex=n.toIndex;
 n.turn++;
 const dest=n.monitors[n.activeIndex];dest.state='occupied';
 syncBoss(b);n.mode='recover';n.timer=.65;
 g.emit('infoshumArrive',{index:n.activeIndex,x:dest.x+dest.w/2,y:dest.y+dest.h/2});
}
function beginRupture(g){
 const b=g.boss,n=b.network;
 n.stage='rupture';n.mode='rupture';n.timer=2.25;n.transitionProgress=0;
 n.monitors.forEach(m=>{m.openTime=0;if(m.state!=='broken')m.state='rupturing';});
 b.phase=3;b.phaseName='Освобождение';b.state='phaseChange';b.timer=2.25;
 b.hp=Math.max(16,b.hp);
 g.bolts=[];g.cuts=[];g.inks=[];
 g.player.inv=Math.max(g.player.inv,2.9);
 g.emit('bossPhase',{boss:'infoshum',phase:3,name:'Освобождение'});
 g.emit('infoshumRupture',{x:b.x+b.w/2,y:b.y+b.h/2});
}
function rebuildArena(g){
 const r=rooms[g.room];
 const shapes={
  0:[0,474,1536],1:[92,361,296],2:[617,328,300],
  3:[1131,361,296],4:[411,413,165],5:[965,413,165],
  9:[464,264,145],10:[961,264,145]
 };
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;}
 }
 // The rebuild is a safe cinematic transition, not an unavoidable fall.
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===1);
 p.x=landing.x+45;p.y=landing.y-p.h;p.vx=0;p.vy=0;
 p.grounded=true;p.supportId=landing.id;p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];
 g.updateCamera();
}
function beginFreed(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 rebuildArena(g);n.stage='free';n.mode='rest';n.timer=1;
 n.target=null;n.cycle=0;n.hitDelivered=false;
 b.phase=3;b.state='recover';b.x=r.x+r.width/2-b.w/2;b.y=92;
 b.dir=-1;b.cooldown=0;
 g.emit('infoshumFreed',{x:b.x+b.w/2,y:b.y+b.h/2});
}
function beginFinalAttack(g){
 const n=g.boss.network;n.target=targetSurface(g);
 n.mode=n.cycle%2===1?'waveWarning':'slamWarning';
 n.timer=n.mode==='waveWarning'?.75:1.05;
 g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:n.mode});
}
export function stepInfoshum(g,dt){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 for(const m of n.monitors)if(m.state==='open'){
  m.openTime=Math.max(0,m.openTime-dt);
  m.charge=m.openTime/EXPOSE_SECONDS;
  if(!m.openTime)m.state='idle';
 }
 b.hurtTime=Math.max(0,b.hurtTime-dt);
 b.cooldown=Math.max(0,b.cooldown-dt);
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
   else strikeSurface(g,n);
   n.mode='attack';n.timer=.37;b.state='network';
  }else if(n.mode==='attack'){n.mode='rest';n.timer=.7;}
  else if(n.mode==='rest'){n.mode='transferWarning';n.timer=.8;n.toIndex=nextMonitor(n);
   g.emit('infoshumTransferWarning',{from:n.activeIndex,to:n.toIndex});
  }else if(n.mode==='transferWarning')beginDeparture(g);
  else if(n.mode==='recover')chooseAttack(g);
  else chooseAttack(g);
  return;
 }
 // Freed form: a readable wave (every other cycle), marked tentacle slam, exposed node.
 b.state=n.mode==='weak'?'recover':'windup';
 n.timer-=dt;if(n.timer>0)return;
 if(n.mode==='rest'){beginFinalAttack(g);}
 else if(n.mode==='waveWarning'){
  createWave(g,n);n.mode='slamWarning';n.timer=1.05;n.target=targetSurface(g);
  g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:'tentacle'});
 }else if(n.mode==='slamWarning'){
  strikeSurface(g,n);n.mode='slam';n.timer=.34;
 }else if(n.mode==='slam'){n.mode='weak';n.timer=2.25;
  g.emit('infoshumWeak',{x:n.target.x,y:n.target.y-40});
 }else if(n.mode==='weak'){n.cycle++;n.mode='rest';n.timer=.55;}
 else{n.mode='rest';n.timer=.7;}
}
function overloadMonitor(g,m){
 const b=g.boss,n=b.network;
 m.state='broken';m.openTime=0;m.charge=0;
 n.defeatedMonitors++;b.hp=Math.max(0,b.hp-MONITOR_DAMAGE);
 b.hurtTime=.35;
 g.emit('bossHit',{boss:'infoshum',x:m.x+m.w/2,y:m.y+m.h/2});
 g.emit('infoshumMonitorDestroyed',{index:m.index,x:m.x+m.w/2,y:m.y+m.h/2});
 if(n.defeatedMonitors===2)beginRupture(g);
 else b.phase=2;
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;
 if(!b.active||!n||p.attack<=0||b.hp<=0)return false;
 if(n.stage==='network'){
  for(const m of n.monitors){
   if(m.state!=='open'||m.lastSwing===p.swing)continue;
   const target={x:m.terminalX-23,y:m.terminalY,w:46,h:35};
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
