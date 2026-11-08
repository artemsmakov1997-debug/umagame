// «Найди источник»: the final fight, three phases of six health each.
// 1 «Погоня по мониторам»: three monitors hover over the stage, each riding its own path. He shows his face in
//   one of them and fires packets and data rain at Uma, then dives into a cable and jumps to another monitor.
//   Landing on top of the monitor he is in cracks its glass (and bounces Uma up); he flees at once.
//   Three cracks and he tears out of the screen. Faster every round, no guessing.
// 2 «Кабели»: after the breakout his cable slams a platform and stays as a staircase up to the core.
//   Climb it and hit the core before the cable is pulled back. Headlines circle the core.
// 3 «Белый шум»: interference rises; he splits into doubles with purple eyes. Each dives at Uma;
//   the real one gets stuck in the floor for a moment.
import {rooms} from './level.js?v=0.21.5';
import {originalsFound} from './dimension-systems.js?v=0.21.5';
import {summonBossTroops} from './boss-abilities.js?v=0.21.5';
// Each «первоисточник» from the Dimension: the real screen glows longer at the reveal, interference rises slower.
export const SOURCE_NOISE_BONUS=12,SOURCE_CORE_BONUS=0,SOURCE_HINT=.8;
export const NOISE_TIME=60,INFOSHUM_HP=18,HIT_DAMAGE=2;
export const noiseDuration=g=>NOISE_TIME+SOURCE_NOISE_BONUS*originalsFound(g);
export const coreDamage=()=>HIT_DAMAGE;
export const revealHint=g=>Math.min(2.4,SOURCE_HINT*originalsFound(g));
export const SHELL={static:.8,gap:.25,move:[.95,.8,.66],moves:[2,3,4],decoys:[0,1,2],window:[6.8,6.3,5.8],volley:1.3,hit:1.1};
// The chase: how long he stays in a monitor, how fast he jumps, how often he fires, by round.
export const CHASE={hold:[3.4,2.9,2.4],hop:[.6,.5,.42],volley:[1.2,1,.85],rainAt:1.1,hit:.55,bounce:-380};
// Hover paths of the three monitors (room-local): the centre x, the top surface y, the axis, amplitude, period, phase.
export const MONITOR_PATHS=[{cx:250,top:285,axis:'y',amp:52,period:5,phase:0},{cx:790,top:236,axis:'x',amp:130,period:6.4,phase:.8},{cx:1275,top:290,axis:'y',amp:48,period:4.4,phase:Math.PI}];
export const MONITOR_W=150,PAD_W=128;
export const CABLE={drift:1.2,aim:1,slam:.3,anchored:3.4,retractWarn:.6,retract:.35,reel:.9,ring:1.6,ringR:96};
export const SPLIT={split:1.1,gap:1.1,warn:.8,speed:620,stuck:2.3,reel:.8};
export const STEP_SLOTS=[6,7,8,13,14,15,16,17];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const STAGE_ROOM=8;
export function createInfoshumNetwork(room=STAGE_ROOM){
 const base=rooms[room].x;
 const layouts=MONITOR_PATHS.map(m=>({x:m.cx-MONITOR_W/2,y:monitorYForTop(m.top),w:MONITOR_W,h:MONITOR_W*.7}));
 return {
  stage:'network',mode:'static',timer:1.35,round:0,activeIndex:1,moves:0,
  transit:null,decoys:[],volley:SHELL.volley,hintTime:0,revealed:false,
  monitors:layouts.map((m,index)=>({...m,x:base+m.x,index,face:null,cracks:0,pulse:null,burst:0,lastSwing:-1})),
  lastMonitorIndex:1,transitionProgress:0,target:null,extraTargets:[],cable:null,ring:0,figures:[],order:[],lastSwing:-1,noise:0,noiseTime:0,cycle:0
 };
}
// A monitor's y such that its frame's top edge (monitorRect) sits at `top`.
export function monitorYForTop(top,w=MONITOR_W){return top+w*351/366/2+35-w*271/319/2;}
// The hover pads Uma lands on: one moving platform on top of each monitor (world-platforms moves and carries them).
export function ensureMonitorPads(g,room=g.room){
 if(g.platforms.some(s=>s.infoshumPad!==undefined&&s.room===room))return;const base=rooms[room].x;
 // The old monitor stands (6–8) are gone: the monitors hover now.
 for(const s of g.platforms)if(s.room===room&&[6,7,8].includes(s.index))s.bossHidden=true;
 MONITOR_PATHS.forEach((m,i)=>{const x=base+m.cx-PAD_W/2,y=m.top;g.platforms.push({id:room+':pad'+i,room,index:200+i,x,y,w:PAD_W,baseX:x,baseY:y,prevX:x,prevY:y,dx:0,dy:0,fragile:false,roof:null,studio:null,dim:null,cuttable:false,motion:{axis:m.axis,amplitude:m.amp,period:m.period,phase:m.phase},infoshumPad:i});});
}
export function removeMonitorPads(g){g.platforms=g.platforms.filter(s=>s.infoshumPad===undefined);}
export const monitorPad=(g,i)=>g.platforms.find(s=>s.infoshumPad===i&&s.room===g.room);
function syncMonitors(g){const n=g.boss.network;for(const m of n.monitors){const s=monitorPad(g,m.index);if(!s)continue;m.x=s.x+s.w/2-m.w/2;m.y=monitorYForTop(s.y-2,m.w);}}
export function currentInfoshumMonitor(b){const n=b.network;return n?.monitors[n.activeIndex]||null;}
// The glass of a monitor (drawn over the old CRT frame position) — the phase-one target.
export function monitorRect(m){const w=m.w,h=w*351/366,cy=m.y-35+m.w*271/319/2;return {x:m.x,y:cy-h/2,w,h};}
export function glassRect(m){const r=monitorRect(m);return {x:r.x+r.w*.14,y:r.y+r.h*.13,w:r.w*.72,h:r.h*.7};}
function syncToMonitor(b){const m=currentInfoshumMonitor(b);if(!m)return;b.x=m.x+(m.w-b.w)/2;b.y=m.y+(m.h-b.h)/2;b.dir=1;}
function targetSurface(g){
 const p=g.player;
 const support=g.platforms.find(s=>s.id===p.supportId&&!s.bossHidden&&s.room===g.room&&!s.infoshumStep);
 const surfaces=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&!s.infoshumStep&&p.x+p.w>s.x&&p.x<s.x+s.w);
 const below=surfaces.filter(s=>s.y>=p.y+p.h-6).sort((a,b)=>a.y-b.y)[0];
 const s=support||below||surfaces.sort((a,b)=>Math.abs(a.y-p.y-p.h)-Math.abs(b.y-p.y-p.h))[0];
 return {x:clamp(p.x+p.w/2,s?.x+32||rooms[g.room].x+32,s?.x+s?.w-32||rooms[g.room].end-32),y:s?.y||474,platformId:s?.id,left:s?.x??rooms[g.room].x,right:s?s.x+s.w:rooms[g.room].end};
}
function createWave(g,t){
 const r=rooms[g.room],fromLeft=t.x<r.x+r.width/2,x=fromLeft?r.x+12:r.end-48,dir=fromLeft?1:-1;
 g.bolts.push({room:g.room,kind:'wave',x,y:t.y-13,w:52,h:18,infoshumAttack:'wave',vx:dir*225,vy:0,ttl:5.5,fixedY:true,visual:'infoshum'});
 g.emit('bossCast',{boss:'infoshum',ability:'wave',x,y:t.y});
}
function createRain(g,t){for(const dx of[-38,-12,14,40])g.bolts.push({room:g.room,kind:'dataRain',infoshumAttack:'rain',visual:'infoshum',x:t.x+dx-6,y:Math.max(12,t.y-190),w:12,h:34,vx:0,vy:320,ttl:1.5,stopY:t.y+4});g.emit('bossCast',{boss:'infoshum',ability:'rain',x:t.x,y:t.y});}
function createPacket(g,m){const p=g.player,x=m.x+m.w/2,y=m.y+m.h/2,dx=p.x+p.w/2-x,dy=p.y+p.h/2-y,len=Math.hypot(dx,dy)||1;g.bolts.push({room:g.room,kind:'packet',visual:'infoshum',x,y,w:18,h:16,vx:dx/len*170,vy:dy/len*170,ttl:5});g.emit('bossCast',{boss:'infoshum',ability:'packet',x,y});}
// ——— Phase 1 «Погоня по мониторам» (the old shell-game helpers below are kept for the debug tools) ———
function startShuffle(g){const n=g.boss.network;n.mode='shuffle';n.moves=SHELL.moves[n.round];n.timer=.2;n.transit=null;n.decoys=[];for(const m of n.monitors){m.face=null;}g.emit('infoshumShuffle',{round:n.round});}
function startMove(g){
 const n=g.boss.network,r=n.round,others=n.monitors.filter(m=>m.index!==n.activeIndex),to=others[Math.floor(Math.random()*others.length)].index,duration=SHELL.move[r];
 n.transit={from:n.activeIndex,to,time:0,duration};
 const pairs=[];for(const a of n.monitors)for(const b of n.monitors)if(a.index!==b.index&&!(a.index===n.activeIndex&&b.index===to))pairs.push([a.index,b.index]);
 n.decoys=[];for(let i=0;i<SHELL.decoys[r]&&pairs.length;i++){const k=Math.floor(Math.random()*pairs.length),[from,dest]=pairs.splice(k,1)[0];n.decoys.push({from,to:dest,time:0,duration:duration*(.9+.2*Math.random())});}
 g.emit('infoshumTransfer',{from:n.activeIndex,to,x:n.monitors[n.activeIndex].x+111,y:n.monitors[n.activeIndex].y+80,decoys:n.decoys.length});
}
function startReveal(g){
 const n=g.boss.network,fakes=[1,2,3].sort(()=>Math.random()-.5);let k=0;
 for(const m of n.monitors)m.face=m.index===n.activeIndex?0:fakes[k++];
 n.mode='reveal';n.timer=SHELL.window[n.round];n.volley=SHELL.volley*.7;n.hintTime=revealHint(g);
 g.emit('infoshumReveal',{index:n.activeIndex,first:!n.revealed});n.revealed=true;
}
function startHold(g){
 // Each «первоисточник» from the Dimension keeps his face on the screen a little longer.
 const n=g.boss.network,r=Math.min(2,n.round);n.mode='hold';n.timer=CHASE.hold[r]+revealHint(g)*.5;n.volley=.55;n.rained=false;n.transit=null;
 for(const m of n.monitors)m.face=m.index===n.activeIndex?0:null;
 g.emit('infoshumReveal',{index:n.activeIndex,first:!n.revealed});n.revealed=true;
}
function startHop(g){
 const n=g.boss.network,p=g.player,r=Math.min(2,n.round),others=n.monitors.filter(m=>m.index!==n.activeIndex);
 // He prefers the monitor farther from Uma, but not always.
 others.sort((a,b)=>Math.abs(b.x-p.x)-Math.abs(a.x-p.x));const to=(Math.random()<.7?others[0]:others[others.length-1]).index;
 n.transit={from:n.activeIndex,to,time:0,duration:CHASE.hop[r]};n.mode='hop';for(const m of n.monitors)m.face=null;
 g.emit('infoshumTransfer',{from:n.activeIndex,to,x:n.monitors[n.activeIndex].x+n.monitors[n.activeIndex].w/2,y:n.monitors[n.activeIndex].y,decoys:0});
}
// Landing on top of the monitor he is in: a crack, a bounce, and he flees.
function stompMonitor(g){
 const b=g.boss,n=b.network,p=g.player,pad=monitorPad(g,n.activeIndex),on=!!pad&&p.grounded&&p.supportId===pad.id;
 const landed=on&&!n.wasOn;n.wasOn=on;if(!landed||n.mode!=='hold')return false;
 const m=n.monitors[n.activeIndex];m.cracks++;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;n.round++;n.lastMonitorIndex=m.index;n.mode='hit';n.timer=CHASE.hit;
 for(const o of n.monitors)if(o!==m)o.face=null;g.bolts=g.bolts.filter(v=>v.kind!=='packet'&&v.kind!=='dataRain');
 Object.assign(p,{vy:CHASE.bounce,grounded:false,supportId:null});n.wasOn=false;
 g.emit('bossHit',{boss:'infoshum',x:m.x+m.w/2,y:m.y+m.h/2});g.emit('infoshumScreenCrack',{index:m.index,round:n.round,x:m.x+m.w/2,y:m.y+m.h/2});
 return true;
}
function stepShells(g,dt){
 const b=g.boss,n=b.network;ensureMonitorPads(g);syncMonitors(g);syncToMonitor(b);b.state=n.mode==='hold'?'recover':'network';
 for(const m of n.monitors){m.burst=Math.max(0,m.burst-dt);if(m.pulse){m.pulse.time-=dt;if(m.pulse.time<=0)m.pulse=null;}}
 if(stompMonitor(g))return;
 const r=Math.min(2,n.round);
 if(n.mode==='hop'){n.transit.time+=dt;if(n.transit.time>=n.transit.duration){n.activeIndex=n.transit.to;n.monitors[n.activeIndex].pulse={kind:'real',time:.5};g.emit('infoshumArrive',{index:n.activeIndex});startHold(g);}return;}
 if(n.mode==='hit'){n.timer-=dt;if(n.timer>0)return;if(n.round>=3){beginRupture(g);return;}startHop(g);return;}
 if(n.mode==='hold'){
  n.timer-=dt;n.volley-=dt;
  if(n.volley<=0){n.volley=CHASE.volley[r];createPacket(g,n.monitors[n.activeIndex]);}
  if(!n.rained&&n.timer<CHASE.hold[r]-CHASE.rainAt){n.rained=true;createRain(g,targetSurface(g));}
  if(n.timer<=0)startHop(g);
  return;
 }
 // The opening stillness, then he shows himself.
 n.timer-=dt;if(n.timer<=0)startHold(g);
}
// In the chase the glass is cracked from above (stompMonitor); a paw on the screen does nothing.
function strikeScreens(g,paw){return false;}
// ——— Rupture: the third crack tears the screen open ———
const ruptureMonitorIndex=n=>n.lastMonitorIndex;
export const ARRIVE=1.6;
function beginRupture(g){
 const b=g.boss,n=b.network;
 n.stage='rupture';n.mode='rupture';n.timer=2.25;n.transitionProgress=0;
 b.phase=2;b.phaseName='Кабели';b.state='phaseChange';b.timer=2.25;
 g.bolts=[];g.cuts=[];g.inks=[];g.enemies=g.enemies.filter(e=>e.bossOwnerId!=='infoshum');
 g.player.inv=Math.max(g.player.inv,2.9);
 g.emit('bossPhase',{boss:'infoshum',phase:2,name:'Кабели'});removeMonitorPads(g);
 const m=n.monitors[ruptureMonitorIndex(n)];g.emit('infoshumRupture',{x:m.x+m.w/2,y:m.y+m.h/2});
}
function rebuildArena(g){
 const r=rooms[g.room];
 const shapes={0:[0,474,460],1:[92,366,296],2:[617,332,300],3:[1131,366,296],4:[411,413,165],5:[965,413,165],9:[464,272,145],10:[961,272,145],11:[520,474,530],12:[1110,474,426]};
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;p.infoshumStep=STEP_SLOTS.includes(p.index);
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;}
 }
 // The rebuild is a safe cinematic transition, not an unavoidable fall.
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===2);
 p.x=landing.x+45;p.y=landing.y-p.h;p.vx=0;p.vy=0;p.grounded=true;p.supportId=landing.id;p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];g.updateCamera();
}
function beginFreed(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 rebuildArena(g);n.stage='free';n.mode='arrive';n.timer=ARRIVE;n.target=null;n.cable=null;n.cycle=0;
 b.phase=2;b.state='recover';b.dir=-1;b.cooldown=0;n.homeX=r.x+r.width/2-b.w/2;n.driftTime=0;
 // He glides out of the broken monitor to the middle of the stage instead of jumping there.
 const m=n.monitors[ruptureMonitorIndex(n)]||n.monitors[1];n.arriveFrom={x:m.x+m.w/2-b.w/2,y:m.y+m.h/2-b.h/2};b.x=n.arriveFrom.x;b.y=n.arriveFrom.y;
 g.emit('infoshumFreed',{x:b.x+b.w/2,y:b.y+b.h/2});
}
// ——— Phase 2 «Кабели» ———
export function corePoint(b){return {x:b.x+b.w/2,y:b.y+b.h/2+8};}
export function coreBox(b){const c=corePoint(b);return {x:c.x-34,y:c.y-34,w:68,h:68};}
export function headlineBoxes(n,b){const c=corePoint(b);return [0,1,2].map(i=>{const a=n.ring+i*Math.PI/2;return {x:c.x+Math.cos(a)*CABLE.ringR-20,y:c.y+Math.sin(a)*CABLE.ringR*.8-15,w:40,h:30,angle:a,i};});}
function cableSteps(g){return g.platforms.filter(s=>s.room===g.room&&STEP_SLOTS.includes(s.index));}
function layCable(g){
 const b=g.boss,n=b.network,t=n.target,c=corePoint(b),dir=Math.sign(c.x-t.x)||1,end={x:c.x-dir*26,y:c.y+52},rise=t.y-end.y;
 const run=Math.abs(end.x-t.x),count=clamp(Math.max(Math.ceil(rise/44),Math.ceil(run/90)),1,STEP_SLOTS.length),width=clamp(Math.round(run/count)-26,46,84),steps=cableSteps(g);
 n.cable={from:{x:t.x,y:t.y},to:end,dir,steps:count};
 steps.forEach((s,i)=>{if(i<count){const k=(i+1)/count;Object.assign(s,{x:Math.round(t.x+(end.x-t.x)*k-width/2),y:Math.round(t.y-rise*k),w:width,bossHidden:false,motion:null,dx:0,dy:0});s.baseX=s.x;s.baseY=s.y;s.prevX=s.x;s.prevY=s.y;}else s.bossHidden=true;});
}
function pullCable(g){const n=g.boss.network;n.cable=null;for(const s of cableSteps(g))s.bossHidden=true;}
function stepCables(g,dt,paw){
 const b=g.boss,n=b.network,p=g.player;n.ring+=CABLE.ring*dt;
 // He drifts while no cable is anchored.
 if(['drift','aim','volley'].includes(n.mode)){n.driftTime+=dt;b.x=n.homeX+Math.sin(n.driftTime*.6)*260;}
 b.state=['anchored','retractWarn'].includes(n.mode)?'recover':'windup';
 if(n.mode==='arrive'){n.timer-=dt;const k=Math.min(1,1-n.timer/ARRIVE),e=k*k*(3-2*k),f=n.arriveFrom;b.x=f.x+(n.homeX-f.x)*e;b.y=f.y+(92-f.y)*e-Math.sin(k*Math.PI)*70;b.state='phaseChange';if(n.timer<=0){b.x=n.homeX;b.y=92;n.mode='drift';n.timer=1;n.driftTime=0;}return;}

 n.timer-=dt;if(n.timer>0)return;
 if(n.mode==='drift'){n.mode='aim';n.timer=CABLE.aim;n.target=targetSurface(g);g.emit('infoshumWarning',{x:n.target.x,y:n.target.y,attack:'cable'});}
 else if(n.mode==='aim'){n.mode='slam';n.timer=CABLE.slam;const t=n.target;if(overlap(p,{x:t.x-38,y:t.y-66,w:76,h:66}))g.hurt(false,t.x);layCable(g);g.emit('infoshumSlam',{x:t.x,y:t.y});}
 else if(n.mode==='slam'){n.mode='anchored';n.timer=CABLE.anchored;g.emit('infoshumWeak',{x:n.target.x,y:n.target.y-40});}
 else if(n.mode==='anchored'){n.mode='retractWarn';n.timer=CABLE.retractWarn;g.emit('infoshumRetractWarning',{});}
 else if(n.mode==='retractWarn'){n.mode='retract';n.timer=CABLE.retract;pullCable(g);}
 else if(n.mode==='retract'||n.mode==='reel'){n.mode='volley';n.timer=1.4;n.cycle++;const t=targetSurface(g);if(n.cycle%2)createRain(g,t);else createWave(g,t);}
 else{n.mode='drift';n.timer=CABLE.drift;}
}
function strikeCore(g,paw){
 const b=g.boss,n=b.network,p=g.player;if(!['anchored','retractWarn'].includes(n.mode)||n.lastSwing===p.swing||!overlap(paw,coreBox(b)))return false;
 n.lastSwing=p.swing;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;const c=corePoint(b);
 g.emit('bossHit',{boss:'infoshum',x:c.x,y:c.y});g.emit('infoshumCoreHit',{x:c.x,y:c.y});
 if(b.hp<=INFOSHUM_HP-2*6)beginSplit(g);else{n.mode='reel';n.timer=CABLE.reel;pullCable(g);}
 return true;
}
// ——— Phase 3 «Белый шум» ———
function beginSplit(g){
 const b=g.boss,n=b.network;n.splitFrom=corePoint(b);n.splitTime=0;pullCable(g);n.stage='noise';n.noise=n.noise||0;n.noiseTime=n.noiseTime||0;b.phase=3;b.phaseName='Белый шум';b.state='phaseChange';g.bolts=[];
 g.player.inv=Math.max(g.player.inv,1.5);g.emit('bossPhase',{boss:'infoshum',phase:3,name:'Белый шум'});newFigures(g);g.emit('infoshumSplit',{x:b.x+b.w/2,y:b.y+b.h/2});
}
function newFigures(g){
 const b=g.boss,n=b.network,r=rooms[g.room],slots=[.22,.5,.78].sort(()=>Math.random()-.5),real=Math.floor(Math.random()*3);
 const from=n.splitFrom||{x:b.x+b.w/2,y:b.y+b.h/2};n.figures=slots.map((k,i)=>({id:i,real:i===real,x:from.x,y:from.y,sx:from.x,sy:from.y,homeX:r.x+r.width*k,state:'split',time:0,lastSwing:-1}));
 n.order=[0,1,2].sort(()=>Math.random()-.5);n.mode='split';n.timer=SPLIT.split;syncFigure(b);
}
function syncFigure(b){const f=b.network.figures.find(f=>f.real);if(f){b.x=f.x-b.w/2;b.y=f.y-b.h/2;}}
export function figureBox(f){return f.state==='stuck'?{x:f.x-44,y:f.y-50,w:88,h:52}:{x:f.x-40,y:f.y-40,w:80,h:80};}
function stepNoise(g,dt){
 const b=g.boss,n=b.network,p=g.player;
 n.noiseTime+=dt;n.noise=Math.min(1,n.noiseTime/noiseDuration(g));
 if(n.noise>=1){g.emit('interferenceLost');g.loseLife('interference');if(g.testingInvulnerable){n.noiseTime=noiseDuration(g)*.82;n.noise=.82;}return;}
 for(const f of n.figures){f.time+=dt;
  if(f.state==='split'||f.state==='hover'){const hx=f.homeX+Math.sin((g.time||0)*1.3+f.homeX)*24,hy=120+Math.sin((g.time||0)*2+f.homeX*.01)*10;if(f.state==='split'&&f.sx!==undefined){const k=Math.min(1,f.time/SPLIT.split),e=k*k*(3-2*k);f.x=f.sx+(hx-f.sx)*e;f.y=f.sy+(hy-f.sy)*e-Math.sin(k*Math.PI)*40;}else{f.x=hx;f.y=hy;}if(f.state==='split'&&f.time>=SPLIT.split){f.state='hover';f.time=0;}}
  else if(f.state==='warn'&&f.time>=SPLIT.warn){f.state='dive';f.time=0;g.emit('infoshumDive',{x:f.x,y:f.y,real:f.real});}
  else if(f.state==='dive'){const dx=f.tx-f.x,dy=f.ty-f.y,len=Math.hypot(dx,dy),step=SPLIT.speed*dt;
   if(len<=step){f.x=f.tx;f.y=f.ty;const hit=Math.abs(p.x+p.w/2-f.x)<44&&Math.abs(p.y+p.h-f.ty)<50&&p.dash===0;if(hit)g.hurt(false,f.x);
    if(f.real){f.state='stuck';f.time=0;g.emit('infoshumStuck',{x:f.x,y:f.y});}else{f.state='burst';f.time=0;g.emit('boltImpact',{x:f.x,y:f.y,kind:'double'});}}
   else{f.x+=dx/len*step;f.y+=dy/len*step;}}
  else if(f.state==='stuck'&&f.time>=SPLIT.stuck){f.state='rise';f.time=0;}
  else if(f.state==='rise'){f.y-=360*dt;if(f.y<=120){f.y=120;f.state='hover';f.time=0;}}
 }
 n.figures=n.figures.filter(f=>!(f.state==='burst'&&f.time>.45));syncFigure(b);
 const real=n.figures.find(f=>f.real);b.state=real?.state==='stuck'?'recover':'windup';
 n.timer-=dt;if(n.timer>0)return;
 if(n.mode==='split'){n.mode='dives';n.timer=.4;return;}
 if(n.mode==='reel'){newFigures(g);return;}
 if(n.mode==='dives'){
  if(n.figures.some(f=>['warn','dive','stuck','rise'].includes(f.state))){n.timer=.1;return;}
  const next=n.order.map(id=>n.figures.find(f=>f.id===id)).find(f=>f&&f.state==='hover'&&!f.dived);
  if(!next){newFigures(g);return;}
  const t=targetSurface(g);next.state='warn';next.time=0;next.dived=true;next.tx=t.x;next.ty=t.y;g.emit('infoshumWarning',{x:t.x,y:t.y,attack:'dive'});n.timer=SPLIT.gap;
 }
}
function strikeFigure(g,paw){
 const b=g.boss,n=b.network,p=g.player,f=n.figures.find(f=>f.real&&f.state==='stuck');if(!f||n.lastSwing===p.swing||!overlap(paw,figureBox(f)))return false;
 n.lastSwing=p.swing;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;g.emit('bossHit',{boss:'infoshum',x:f.x,y:f.y-24});g.emit('infoshumCoreHit',{x:f.x,y:f.y-24});
 if(b.hp===0){b.x=f.x-b.w/2;b.y=f.y-b.h+10;g.bossDefeated();return true;}
 n.figures=n.figures.filter(o=>o===f);f.state='rise';f.time=0;n.mode='reel';n.timer=SPLIT.reel;return true;
}
export function stepInfoshum(g,dt,paw=null){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 if(n.stage==='network'){stepShells(g,dt);return;}
 if(n.stage==='rupture'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/2.25;if(n.timer===0)beginFreed(g);return;}
 if(n.stage==='free'){stepCables(g,dt,paw);return;}
 if(n.stage==='noise')stepNoise(g,dt);
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;if(!b.active||!n||p.attack<=0||b.hp<=0||g.mode!=='playing')return false;
 if(n.stage==='network')return strikeScreens(g,paw);
 if(n.stage==='free')return strikeCore(g,paw);
 if(n.stage==='noise'){const popped=stepNoiseSwats(g,paw);return strikeFigure(g,paw)||popped;}
 return false;
}
function stepNoiseSwats(g,paw){const n=g.boss.network,p=g.player;let popped=false;for(const f of n.figures)if(!f.real&&['hover','warn','dive','split'].includes(f.state)&&f.lastSwing!==p.swing&&overlap(paw,figureBox(f))){f.lastSwing=p.swing;f.state='burst';f.time=0;n.noiseTime=Math.min(noiseDuration(g)*.98,n.noiseTime+noiseDuration(g)*.08);popped=true;g.emit('infoshumFakeHit',{x:f.x,y:f.y,double:true});}return popped;}
// Test and debugging helpers.
export function exposeInfoshum(g){const b=g.boss,n=b.network;b.cooldown=0;
 if(n.stage==='network'){startHold(g);}
 else if(n.stage==='free'){n.target=targetSurface(g);layCable(g);n.mode='anchored';n.timer=CABLE.anchored;}
 else if(n.stage==='noise'){if(!n.figures.some(f=>f.real))newFigures(g);const f=n.figures.find(f=>f.real);const t=targetSurface(g);Object.assign(f,{state:'stuck',time:0,x:t.x,y:t.y});}
}
// Test helper: one crack of the chase through the real mechanics — Uma lands on the monitor he is in.
export function crackInfoshumScreen(g){const n=g.boss.network;if(n.stage!=='network')return false;ensureMonitorPads(g);if(n.mode!=='hold')startHold(g);const pad=monitorPad(g,n.activeIndex);Object.assign(g.player,{x:pad.x+pad.w/2-17,y:pad.y-48,h:48,vy:0,grounded:true,supportId:pad.id});n.wasOn=false;return stompMonitor(g);}
// Test helper: the final blow through the real mechanics (a stuck real figure under Uma, one paw strike).
export function finishInfoshum(g){const b=g.boss,n=b.network;b.hp=Math.min(b.hp,HIT_DAMAGE);b.cooldown=0;if(n.stage!=='noise'){n.stage='noise';b.phase=3;n.figures=[];}exposeInfoshum(g);const f=n.figures.find(f=>f.real);g.player.attack=.18;g.player.swing++;return strikeInfoshum(g,figureBox(f));}
export function infoshumTargets(g){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return [];
 if(n.stage==='free'&&['anchored','retractWarn'].includes(n.mode))return [{id:'core',...coreBox(b)}];
 if(n.stage==='noise'){const f=n.figures.find(f=>f.real&&f.state==='stuck');if(f)return [{id:'figure',...figureBox(f)}];}
 return [];
}
