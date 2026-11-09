// «Найди источник»: the final fight, three phases of six health each.
// 1 «Телекомната»: ten screens hang on the walls and stand on the floor. In waves he looks out of one, two or three
//   of them (decoys only show static), charges and fires a beam along the screen's line: a wall beam goes over a crouch,
//   a floor beam under a jump. A paw on a screen while his face is in it smashes it for good. The tenth screen bursts
//   and he tears out of it.
// 2 «Белый шум»: interference rises; he splits into doubles with purple eyes. Each dives at Uma;
//   the real one gets stuck in the floor for a moment.
// 3 «Буря и ядро»: the room is torn into floating islands and he folds into a core in a cage of tentacles. Screens rain
//   from the storm; the core aims and fires a column of noise down at Uma, then sinks, spent, over a high island —
//   that is the moment to hit it.
import {rooms} from './level.js?v=0.21.5';
import {originalsFound} from './dimension-systems.js?v=0.21.5';
import {pitFall} from './pit-falls.js?v=0.21.5';
// Each «первоисточник» from the Dimension: his face stays longer in a screen, interference rises slower.
export const SOURCE_NOISE_BONUS=12,SOURCE_CORE_BONUS=0,SOURCE_HINT=.8;
export const NOISE_TIME=60,INFOSHUM_HP=18,HIT_DAMAGE=2,PHASE_HP=6;
export const noiseDuration=g=>NOISE_TIME+SOURCE_NOISE_BONUS*originalsFound(g);
export const coreDamage=()=>HIT_DAMAGE;
export const revealHint=g=>Math.min(2.4,SOURCE_HINT*originalsFound(g));
// ——— Phase 1: the screens ———
// Wall screens: the platform under it and the centre x (room-local); floor screens: the surface and the centre x.
export const TV_LAYOUT=[
 {kind:'wall',on:1,cx:330},{kind:'wall',on:6,cx:220},{kind:'wall',on:9,cx:540},{kind:'wall',on:7,cx:772},{kind:'wall',on:10,cx:1045},
 {kind:'wall',on:8,cx:1290},{kind:'wall',on:3,cx:1195},{kind:'floor',on:0,cx:630},{kind:'floor',on:0,cx:895},{kind:'floor',on:2,cx:895}
];
export const TV_SIZE={wall:{w:76,h:70,lift:4},floor:{w:60,h:55,lift:0}};
// Seconds per wave stage; faces per wave grow with the number of smashed screens.
export const WAVE={opening:1.3,warn:.7,face:[1.05,.95,.85],charge:.9,fire:.75,rest:.8,early:.45,beam:560,beamHalf:8,decoys:2};
export const facesFor=broken=>broken<3?1:broken<6?2:3;
export const SPLIT={split:1.1,gap:1.1,warn:.8,speed:620,stuck:2.3,reel:.8};
export const ARRIVE=1.6;
// ——— Phase 3: the storm ———
export const STORM={intro:2.2,drift:95,storm:[3.4,2.8,2.2],drop:[1.05,.85,.65],warn:.75,fall:760,wreck:1.3,charge:1.1,lock:.55,beam:.9,beamHalf:34,sink:.8,spent:2.8,hit:.55,rise:.9,burst:1.1,hover:100};
// Room-local storm islands: [x, y, w, look]; look 0 = whole slab, 1 = cracked, 2 = slab with a terminal.
export const STORM_ISLANDS={0:[0,474,460,0],11:[520,474,530,0],12:[1110,474,426,0],1:[92,366,296,1],3:[1131,366,296,1],4:[411,413,165,0],5:[965,413,165,0],2:[617,332,300,1],9:[464,272,145,2],10:[961,272,145,2]};
export const HIGH_ISLANDS=[9,10];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const STAGE_ROOM=8;
export function createScreens(room=STAGE_ROOM,surfaces=null){
 const base=rooms[room].x;
 return TV_LAYOUT.map((t,i)=>{const size=TV_SIZE[t.kind],s=surfaces?.find(s=>s.room===room&&s.index===t.on),y=(s?.y??474)-size.lift-size.h;
  return {index:i,kind:t.kind,on:t.on,x:base+t.cx-size.w/2,y,w:size.w,h:size.h,state:'off',timer:0,dir:1,shards:0,role:null};});
}
export function createInfoshumNetwork(room=STAGE_ROOM,surfaces=null){
 const tvs=createScreens(room,surfaces);
 return {
  stage:'network',mode:'opening',timer:WAVE.opening,wave:0,broken:0,tvs,monitors:tvs,lastMonitorIndex:0,faces:[],
  transitionProgress:0,figures:[],order:[],lastSwing:-1,noise:0,noiseTime:0,cycle:0,storm:null,drops:[]
 };
}
export const screenCenter=t=>({x:t.x+t.w/2,y:t.y+t.h/2});
// The beam line of a firing screen: a wall beam at the screen's middle, a floor beam low over the floor.
export function beamRect(t){const c=screenCenter(t),y=t.kind==='wall'?c.y:t.y+t.h-18,x0=t.dir>0?t.x+t.w-6:t.x+6;return {x:t.dir>0?x0:x0-WAVE.beam,y:y-WAVE.beamHalf,w:WAVE.beam,h:WAVE.beamHalf*2};}
// Kept for older callers: a screen's frame and glass.
export function monitorRect(m){return {x:m.x,y:m.y,w:m.w,h:m.h};}
export function glassRect(m){return {x:m.x+m.w*.12,y:m.y+m.h*.14,w:m.w*.76,h:m.h*.66};}
const liveFaces=n=>n.tvs.filter(t=>t.role==='face'&&t.state!=='broken'&&t.state!=='crack');
function syncPositions(g){const n=g.boss.network;for(const t of n.tvs){const s=g.platforms.find(s=>s.room===g.room&&s.index===t.on);if(s){t.y=s.y-TV_SIZE[t.kind].lift-t.h;}}}
function startWave(g){
 const n=g.boss.network,p=g.player,intact=n.tvs.filter(t=>t.state!=='broken');if(!intact.length)return;
 const px=p.x+p.w/2,near=[...intact].sort((a,b)=>Math.abs(screenCenter(a).x-px)-Math.abs(screenCenter(b).x-px));
 const count=Math.min(intact.length,facesFor(n.broken)),faces=[near[Math.floor(Math.random()*Math.min(3,near.length))]];
 const rest=intact.filter(t=>!faces.includes(t)).sort(()=>Math.random()-.5);while(faces.length<count&&rest.length)faces.push(rest.shift());
 const decoys=rest.slice(0,WAVE.decoys);
 for(const t of n.tvs){t.role=faces.includes(t)?'face':decoys.includes(t)?'decoy':null;if(t.state!=='broken')t.state=t.role?'static':'off';}
 n.mode='warn';n.timer=WAVE.warn;n.wave++;n.faces=faces.map(t=>t.index);
 g.emit('infoshumWave',{wave:n.wave,faces:faces.length});
}
function setFaces(n,state){for(const t of liveFaces(n))t.state=state;}
function fireScreens(g){
 const n=g.boss.network,p=g.player;
 for(const t of liveFaces(n)){t.state='fire';t.dir=p.x+p.w/2>=screenCenter(t).x?1:-1;const c=screenCenter(t);g.emit('bossCast',{boss:'infoshum',ability:'tvBeam',x:c.x,y:c.y,kind:t.kind});}
}
function beamHits(g){
 const n=g.boss.network,p=g.player;if(p.inv>0||p.dash>0)return;
 for(const t of n.tvs)if(t.state==='fire'&&overlap(p,beamRect(t))){g.hurt(false,screenCenter(t).x);return;}
}
function createRain(g){
 const p=g.player,x=p.x+p.w/2,s=g.platforms.find(s=>s.id===p.supportId),y=s?.y??474;
 for(const dx of[-38,-12,14,40])g.bolts.push({room:g.room,kind:'dataRain',infoshumAttack:'rain',visual:'infoshum',x:x+dx-6,y:Math.max(12,y-190),w:12,h:34,vx:0,vy:320,ttl:1.5,stopY:y+4});
 g.emit('bossCast',{boss:'infoshum',ability:'rain',x,y});
}
function syncBossToScreens(b){const n=b.network,t=n.tvs[n.faces[0]]||n.tvs[n.lastMonitorIndex];if(!t)return;const c=screenCenter(t);b.x=c.x-b.w/2;b.y=c.y-b.h/2;b.dir=1;}
function stepScreens(g,dt){
 const b=g.boss,n=b.network;syncPositions(g);b.state=['face','charge'].includes(n.mode)?'recover':'network';
 for(const t of n.tvs){t.shards=Math.max(0,t.shards-dt);if(t.state==='crack'){t.timer-=dt;if(t.timer<=0)t.state='broken';}}
 beamHits(g);syncBossToScreens(b);
 n.timer-=dt;
 // Every face smashed before the beam: a short breath, then the next wave.
 if(['face','charge','fire'].includes(n.mode)&&!liveFaces(n).length&&n.mode!=='rest'){n.mode='rest';n.timer=Math.min(n.timer,WAVE.early);for(const t of n.tvs)if(t.state!=='broken'&&t.state!=='crack'){t.state='off';t.role=null;}}
 if(n.timer>0)return;
 const r=Math.min(2,Math.floor(n.broken/4));
 if(n.mode==='opening'||n.mode==='rest'){if(n.broken>=n.tvs.length)return;startWave(g);}
 else if(n.mode==='warn'){n.mode='face';n.timer=WAVE.face[r]+revealHint(g)*.3;for(const t of n.tvs)if(t.role==='decoy'&&t.state!=='broken'){t.state='off';t.role=null;}setFaces(n,'face');g.emit('infoshumReveal',{index:n.faces[0],first:n.wave===1});if(n.broken>=4)createRain(g);}
 else if(n.mode==='face'){n.mode='charge';n.timer=WAVE.charge;setFaces(n,'charge');g.emit('infoshumWarning',{attack:'tvBeam'});}
 else if(n.mode==='charge'){n.mode='fire';n.timer=WAVE.fire;fireScreens(g);}
 else if(n.mode==='fire'){n.mode='rest';n.timer=WAVE.rest;for(const t of n.tvs)if(t.state!=='broken'&&t.state!=='crack'){t.state='off';t.role=null;}}
}
// A paw on a screen while his face is in it (looking, charging or firing) smashes it.
function smashScreen(g,t){
 const b=g.boss,n=b.network,c=screenCenter(t);t.state='crack';t.timer=.3;t.role=null;t.shards=.45;n.broken++;n.lastMonitorIndex=t.index;
 b.hp=Math.max(INFOSHUM_HP-PHASE_HP,+(INFOSHUM_HP-PHASE_HP*n.broken/n.tvs.length).toFixed(2));b.hurtTime=.35;
 g.emit('bossHit',{boss:'infoshum',x:c.x,y:c.y});g.emit('infoshumScreenCrack',{index:t.index,broken:n.broken,x:c.x,y:c.y});
 if(n.broken>=n.tvs.length)beginRupture(g);
 return true;
}
function strikeScreens(g,paw){
 const n=g.boss.network,p=g.player;if(n.lastSwing===p.swing)return false;
 const t=n.tvs.find(t=>['face','charge','fire'].includes(t.state)&&overlap(paw,t));if(!t)return false;
 n.lastSwing=p.swing;return smashScreen(g,t);
}
// ——— Rupture: the last screen bursts and he tears out of it ———
function beginRupture(g){
 const b=g.boss,n=b.network;
 n.stage='rupture';n.mode='rupture';n.timer=2.25;n.transitionProgress=0;
 b.phase=2;b.phaseName='Белый шум';b.state='phaseChange';b.timer=2.25;b.hp=INFOSHUM_HP-PHASE_HP;
 g.bolts=[];g.cuts=[];g.inks=[];g.enemies=g.enemies.filter(e=>e.bossOwnerId!=='infoshum');
 for(const t of n.tvs)if(t.state!=='broken')t.state='broken';
 g.player.inv=Math.max(g.player.inv,2.9);
 g.emit('bossPhase',{boss:'infoshum',phase:2,name:'Белый шум'});
 const t=n.tvs[n.lastMonitorIndex],c=screenCenter(t);g.emit('infoshumRupture',{x:c.x,y:c.y});
}
// The shapes of the ghost and storm arenas (room-local x, y, w); every other platform hides.
const GHOST_ARENA={0:[0,474,460],1:[92,366,296],2:[617,332,300],3:[1131,366,296],4:[411,413,165],5:[965,413,165],9:[464,272,145],10:[961,272,145],11:[520,474,530],12:[1110,474,426]};
function reshape(g,shapes,look){
 const r=rooms[g.room];
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;p.infoshumStep=false;p.storm=look&&shape?shape[3]:undefined;
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;}
 }
}
function landSafely(g,index,dx=45){
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===index);
 p.x=landing.x+dx;p.y=landing.y-p.h;p.vx=0;p.vy=0;p.grounded=true;p.supportId=landing.id;p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];g.updateCamera();
}
function beginGhosts(g){
 const b=g.boss,n=b.network,t=n.tvs[n.lastMonitorIndex],c=screenCenter(t);
 reshape(g,GHOST_ARENA,false);landSafely(g,2);
 for(const tv of n.tvs){const s=g.platforms.find(s=>s.room===g.room&&s.index===tv.on&&!s.bossHidden);if(tv.kind==='floor'&&s)tv.y=s.y-tv.h;}
 n.splitFrom={x:c.x,y:c.y};n.stage='noise';n.noise=0;n.noiseTime=0;b.phase=2;b.phaseName='Белый шум';b.state='phaseChange';g.bolts=[];
 newFigures(g);g.emit('infoshumSplit',{x:c.x,y:c.y});g.emit('infoshumFreed',{x:c.x,y:c.y});
}
// ——— Phase 2 «Белый шум» ———
function targetSurface(g){
 const p=g.player;
 const support=g.platforms.find(s=>s.id===p.supportId&&!s.bossHidden&&s.room===g.room);
 const surfaces=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&p.x+p.w>s.x&&p.x<s.x+s.w);
 const below=surfaces.filter(s=>s.y>=p.y+p.h-6).sort((a,b)=>a.y-b.y)[0];
 const s=support||below||surfaces.sort((a,b)=>Math.abs(a.y-p.y-p.h)-Math.abs(b.y-p.y-p.h))[0];
 return {x:clamp(p.x+p.w/2,s?.x+32||rooms[g.room].x+32,s?.x+s?.w-32||rooms[g.room].end-32),y:s?.y||474,platformId:s?.id,left:s?.x??rooms[g.room].x,right:s?s.x+s.w:rooms[g.room].end};
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
 if(b.hp<=PHASE_HP){beginStorm(g,f);return true;}
 n.figures=n.figures.filter(o=>o===f);f.state='rise';f.time=0;n.mode='reel';n.timer=SPLIT.reel;return true;
}
function stepNoiseSwats(g,paw){const n=g.boss.network,p=g.player;let popped=false;for(const f of n.figures)if(!f.real&&['hover','warn','dive','split'].includes(f.state)&&f.lastSwing!==p.swing&&overlap(paw,figureBox(f))){f.lastSwing=p.swing;f.state='burst';f.time=0;n.noiseTime=Math.min(noiseDuration(g)*.98,n.noiseTime+noiseDuration(g)*.08);popped=true;g.emit('infoshumFakeHit',{x:f.x,y:f.y,double:true});}return popped;}
// ——— Phase 3 «Буря и ядро» ———
export function coreCenter(n){return {x:n.storm.x,y:n.storm.y};}
export function corePoint(b){const n=b.network;return n?.storm?coreCenter(n):{x:b.x+b.w/2,y:b.y+b.h/2+8};}
export function coreBox(b){const c=corePoint(b);return {x:c.x-42,y:c.y-42,w:84,h:84};}
export function headlineBoxes(){return [];}
function beginStorm(g,from){
 const b=g.boss,n=b.network,r=rooms[g.room];
 b.hp=PHASE_HP;n.stage='storm';n.figures=[];n.noise=0;n.noiseTime=0;b.phase=3;b.phaseName='Буря и ядро';b.state='phaseChange';g.bolts=[];
 n.storm={mode:'intro',timer:STORM.intro,x:from?.x??r.x+r.width/2,y:from?.y??200,fromX:from?.x??r.x+r.width/2,fromY:from?.y??200,hits:0,beamX:null,sinkTo:null,round:0,drop:STORM.drop[0],flash:0};
 n.drops=[];reshape(g,STORM_ISLANDS,true);landSafely(g,2,100);g.player.inv=Math.max(g.player.inv,2.4);
 g.emit('bossPhase',{boss:'infoshum',phase:3,name:'Буря и ядро'});g.emit('infoshumStorm',{x:n.storm.x,y:n.storm.y});
}
const stormRound=s=>Math.min(2,s.hits);
function spawnDrop(g){
 const n=g.boss.network,p=g.player,r=rooms[g.room];
 const x=clamp(p.x+p.w/2+(Math.random()*2-1)*170+(p.vx||0)*.35,r.x+40,r.end-40);
 const s=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&x>=s.x&&x<=s.x+s.w).sort((a,b)=>a.y-b.y).find(s=>s.y>=p.y+p.h-4)||null;
 n.drops.push({x,y:-60,ty:s?s.y:520,state:'warn',time:0});
}
function stepDrops(g,dt){
 const n=g.boss.network,p=g.player;
 for(const d of n.drops){d.time+=dt;
  if(d.state==='warn'&&d.time>=STORM.warn){d.state='fall';d.time=0;}
  else if(d.state==='fall'){d.y+=STORM.fall*dt;if(d.y>=d.ty){d.y=d.ty;d.state='impact';d.time=0;g.emit('boltImpact',{x:d.x,y:d.ty,kind:'screen'});
   if(p.inv<=0&&p.dash===0&&Math.abs(p.x+p.w/2-d.x)<38&&p.y+p.h>d.ty-60&&p.y<d.ty+4)g.hurt(false,d.x);}}
  else if(d.state==='impact'&&d.time>=.25){d.state='wreck';d.time=0;}
 }
 n.drops=n.drops.filter(d=>!(d.state==='wreck'&&d.time>STORM.wreck));
}
function stepStorm(g,dt){
 const b=g.boss,n=b.network,s=n.storm,p=g.player,r=rooms[g.room];
 s.flash=Math.max(0,s.flash-dt);stepDrops(g,dt);s.timer-=dt;
 const px=p.x+p.w/2;b.x=s.x-b.w/2;b.y=s.y-b.h/2;
 if(s.mode==='intro'){const k=1-Math.max(0,s.timer)/STORM.intro,e=k*k*(3-2*k);s.x=s.fromX+(r.x+r.width/2-s.fromX)*e;s.y=s.fromY+(STORM.hover-s.fromY)*e;b.state='phaseChange';if(s.timer<=0){s.mode='storm';s.timer=STORM.storm[0];s.drop=.6;}return;}
 if(s.mode==='storm'){b.state='windup';s.x+=clamp(px-s.x,-STORM.drift*dt,STORM.drift*dt);s.y+=(STORM.hover+Math.sin(g.time*2)*8-s.y)*Math.min(1,dt*3);
  s.drop-=dt;if(s.drop<=0){s.drop=STORM.drop[stormRound(s)];spawnDrop(g);}
  if(s.timer<=0){s.mode='charge';s.timer=STORM.charge;g.emit('infoshumWarning',{x:s.x,y:474,attack:'column'});}return;}
 if(s.mode==='charge'){b.state='casting';
  // He follows Uma for the first part of the charge, then the column is locked.
  if(s.timer>STORM.charge-STORM.lock)s.x+=clamp(px-s.x,-420*dt,420*dt);else if(s.beamX===null)s.beamX=s.x;
  if(s.timer<=0){if(s.beamX===null)s.beamX=s.x;s.mode='beam';s.timer=STORM.beam;s.flash=.3;g.emit('bossCast',{boss:'infoshum',ability:'column',x:s.beamX,y:s.y});}return;}
 if(s.mode==='beam'){b.state='casting';if(p.inv<=0&&p.dash===0&&Math.abs(px-s.beamX)<STORM.beamHalf+p.w/2-6&&p.y+p.h>s.y)g.hurt(false,s.beamX);
  if(s.timer<=0){s.mode='sink';s.timer=STORM.sink;const isl=HIGH_ISLANDS.map(i=>g.platforms.find(q=>q.room===g.room&&q.index===i)).filter(Boolean).sort((a,c)=>Math.abs(a.x+a.w/2-s.beamX)-Math.abs(c.x+c.w/2-s.beamX))[0];
   s.sinkFrom={x:s.x,y:s.y};s.sinkTo={x:isl.x+isl.w/2,y:isl.y-64};s.beamX=null;g.emit('infoshumWeak',{x:s.sinkTo.x,y:s.sinkTo.y});}return;}
 if(s.mode==='sink'){b.state='recover';const k=1-Math.max(0,s.timer)/STORM.sink,e=k*k*(3-2*k);s.x=s.sinkFrom.x+(s.sinkTo.x-s.sinkFrom.x)*e;s.y=s.sinkFrom.y+(s.sinkTo.y-s.sinkFrom.y)*e;if(s.timer<=0){s.mode='spent';s.timer=STORM.spent;}return;}
 if(s.mode==='spent'){b.state='recover';s.y=s.sinkTo.y+Math.sin(g.time*3)*3;if(s.timer<=0){s.mode='rise';s.timer=STORM.rise;s.riseFrom={x:s.x,y:s.y};}return;}
 if(s.mode==='hit'){b.state='recover';if(s.timer<=0){s.mode='rise';s.timer=STORM.rise;s.riseFrom={x:s.x,y:s.y};}return;}
 if(s.mode==='rise'){b.state='windup';const k=1-Math.max(0,s.timer)/STORM.rise;s.y=s.riseFrom.y+(STORM.hover-s.riseFrom.y)*k;if(s.timer<=0){s.mode='storm';s.timer=STORM.storm[stormRound(s)];s.drop=.4;}return;}
 if(s.mode==='burst'){b.state='recover';if(s.timer<=0){b.x=s.x-b.w/2;b.y=s.y-b.h/2;g.bossDefeated();}}
}
function strikeCore(g,paw){
 const b=g.boss,n=b.network,s=n.storm,p=g.player;if(!['sink','spent'].includes(s.mode)||n.lastSwing===p.swing||!overlap(paw,coreBox(b)))return false;
 n.lastSwing=p.swing;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;s.hits++;const c=coreCenter(n);
 g.emit('bossHit',{boss:'infoshum',x:c.x,y:c.y});g.emit('infoshumCoreHit',{x:c.x,y:c.y});
 if(b.hp<=0){s.mode='burst';s.timer=STORM.burst;n.drops=[];g.bolts=[];b.hp=0.001;return true;}
 s.mode='hit';s.timer=STORM.hit;s.flash=.2;return true;
}
// A fall between the islands returns Uma to the last island she stood on (and costs a heart).
export function infoshumFall(g){const n=g.boss?.network;if(g.room!==STAGE_ROOM||n?.stage!=='storm')return false;return pitFall(g,STAGE_ROOM,s=>!s.bossHidden);}
export function stepInfoshum(g,dt,paw=null){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 if(n.stage==='network'){stepScreens(g,dt);return;}
 if(n.stage==='rupture'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/2.25;if(n.timer===0)beginGhosts(g);return;}
 if(n.stage==='noise'){stepNoise(g,dt);return;}
 if(n.stage==='storm')stepStorm(g,dt);
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;if(!b.active||!n||p.attack<=0||b.hp<=0||g.mode!=='playing')return false;
 if(n.stage==='network')return strikeScreens(g,paw);
 if(n.stage==='noise'){const popped=stepNoiseSwats(g,paw);return strikeFigure(g,paw)||popped;}
 if(n.stage==='storm')return strikeCore(g,paw);
 return false;
}
// Test and debugging helpers.
export function exposeInfoshum(g){const b=g.boss,n=b.network;b.cooldown=0;
 if(n.stage==='network'){if(!liveFaces(n).length||!['face','charge','fire'].includes(n.mode))startWave(g);n.mode='face';n.timer=9;setFaces(n,'face');}
 else if(n.stage==='noise'){if(!n.figures.some(f=>f.real))newFigures(g);const f=n.figures.find(f=>f.real);const t=targetSurface(g);Object.assign(f,{state:'stuck',time:0,x:t.x,y:t.y});}
 else if(n.stage==='storm'){const s=n.storm,isl=g.platforms.find(q=>q.room===g.room&&q.index===HIGH_ISLANDS[0]);s.mode='spent';s.timer=STORM.spent;s.sinkTo={x:isl.x+isl.w/2,y:isl.y-64};s.x=s.sinkTo.x;s.y=s.sinkTo.y;b.x=s.x-b.w/2;b.y=s.y-b.h/2;}
}
// Test helper: smash one screen with his face in it through the real mechanics (Uma under it, one paw strike).
export function crackInfoshumScreen(g){
 const b=g.boss,n=b.network;if(n.stage!=='network')return false;exposeInfoshum(g);const t=liveFaces(n)[0];if(!t)return false;
 const s=g.platforms.find(s=>s.room===g.room&&s.index===t.on),p=g.player;Object.assign(p,{x:t.x+t.w/2-p.w-4,y:s.y-48,h:48,vy:0,vx:0,grounded:true,supportId:s.id,dir:1});
 p.attack=.18;p.swing++;const paw={x:p.x+16,y:p.y-2,w:54,h:p.h+6};return strikeInfoshum(g,paw);
}
// Test helper: drive the fight to the storm (phase three).
export function stormInfoshum(g){const b=g.boss,n=b.network;n.stage='noise';n.figures=[];b.hp=PHASE_HP+HIT_DAMAGE;exposeInfoshum(g);const f=n.figures.find(f=>f.real);b.cooldown=0;g.player.attack=.18;g.player.swing++;return strikeInfoshum(g,figureBox(f));}
// Test helper: the final blow through the real mechanics (a spent core, one paw strike), then the burst plays out.
export function finishInfoshum(g){const b=g.boss,n=b.network;if(n.stage!=='storm')stormInfoshum(g);b.hp=Math.min(b.hp,HIT_DAMAGE);exposeInfoshum(g);g.player.attack=.18;g.player.swing++;const ok=strikeInfoshum(g,coreBox(b));if(ok&&n.storm.mode==='burst'){n.storm.timer=0;stepStorm(g,0);}return ok;}
export function infoshumTargets(g){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return [];
 if(n.stage==='network')return n.tvs.filter(t=>['face','charge','fire'].includes(t.state)).map(t=>({id:'screen'+t.index,x:t.x,y:t.y,w:t.w,h:t.h}));
 if(n.stage==='noise'){const f=n.figures.find(f=>f.real&&f.state==='stuck');if(f)return [{id:'figure',...figureBox(f)}];}
 if(n.stage==='storm'&&['sink','spent'].includes(n.storm.mode))return [{id:'core',...coreBox(b)}];
 return [];
}
