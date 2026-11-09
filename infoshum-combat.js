// «Найди источник»: the final fight, three phases of six health each.
// 1 «Стена эфира»: a mountain of monitors. In waves he looks out of one, two or three of the screens sitting on the heap
//   (decoys only show static), charges and fires a beam along the screen's tier — jump over it. A paw on a screen with
//   his face smashes it (a large one needs two). When the heap is dark he moves into the huge video wall: its beam
//   sweeps a whole tier; three paws on the wall shatter it.
// 2 «Колосс»: he pulls every broken monitor into a colossus. A wave of white noise rises, debris drifts down past
//   the colossus and Uma climbs it. He sweeps a tier with the beam of his head screen and throws monitors; one of
//   his three eye relays flies in, aims, fires along the tier and then hangs stunned — the moment to swat it.
// 3 «На свободе»: the third eye bursts, the head screen cracks and he tears out — into the storm, as doubles with
//   purple eyes. Each dives at Uma; the real one gets stuck for a moment.
import {rooms} from './level.js?v=0.21.5';
import {originalsFound} from './dimension-systems.js?v=0.21.5';
import {pitFall} from './pit-falls.js?v=0.21.5';
// Each «первоисточник» from the Dimension: his face stays longer in a screen, interference rises slower.
export const SOURCE_NOISE_BONUS=12,SOURCE_CORE_BONUS=0,SOURCE_HINT=.8;
export const NOISE_TIME=60,INFOSHUM_HP=18,HIT_DAMAGE=2,PHASE_HP=6;
export const noiseDuration=g=>NOISE_TIME+SOURCE_NOISE_BONUS*originalsFound(g);
export const coreDamage=()=>HIT_DAMAGE;
export const revealHint=g=>Math.min(2.4,SOURCE_HINT*originalsFound(g));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const STAGE_ROOM=8;
// ——— Phase 1: the wall of monitors ———
// The heap (room-local x, y, w, look): tops of lying monitors; every other platform of the room hides.
export const WALL_ARENA={0:[0,474,1536,'floor'],1:[40,404,220,'lying'],6:[130,326,180,'side'],9:[340,256,150,'lying'],4:[400,430,130,'side'],16:[490,345,90,'side'],2:[560,390,416,'lying'],
 7:[600,300,336,'lying'],17:[956,345,90,'side'],5:[1006,430,130,'side'],10:[1046,256,150,'lying'],8:[1226,326,180,'side'],3:[1276,404,220,'lying']};
// Screen sizes: the casing (infoshum-atlas.js), its width in the world and how many paws it takes.
export const SCREEN_KINDS={tiny:{casing:'tiny1',w:52,hits:1},small:{casing:'small',w:68,hits:1},med:{casing:'med1',w:92,hits:1},large:{casing:'large1',w:120,hits:2},huge:{casing:'huge',w:600,hits:3}};
const CASING_H={tiny1:77/93,small:108/122,med1:146/178,large1:180/228,huge:209/674};
// The screens on the heap: size, the platform it sits on, the centre x; and the huge wall over the middle.
export const SCREEN_LAYOUT=[
 {kind:'tiny',on:1,cx:80},{kind:'small',on:6,cx:190},{kind:'med',on:9,cx:400},{kind:'large',on:0,cx:330},{kind:'small',on:4,cx:440},{kind:'tiny',on:2,cx:700},
 {kind:'tiny',on:2,cx:836},{kind:'small',on:5,cx:1096},{kind:'med',on:10,cx:1136},{kind:'large',on:0,cx:1206},{kind:'small',on:8,cx:1346},{kind:'med',on:3,cx:1450},
 {kind:'huge',cx:768,top:76}
];
export const WAVE={opening:1.3,warn:.7,face:[1.05,.95,.85],charge:.9,fire:.7,rest:.8,early:.45,beam:520,giantFace:1.6,giantCharge:1.1,giantFire:.8,giantRest:1.1,giantHalf:18,decoys:2};
export const facesFor=broken=>broken<3?1:broken<7?2:3;
export const ARRIVE=1.6,ASSEMBLE=3.2,BREAKOUT=2.4;
export const SPLIT={split:1.1,gap:1.1,warn:.8,speed:620,stuck:2.3,reel:.8};
// ——— Phase 2: the colossus ———
export const ASCENT={intro:1.6,start:396,speed:[30,38,46],spacing:62,count:10,minX:430,maxX:1106,waveTop:452,bounce:-640,sweepEvery:6.5,aim:1.2,sweep:.8,sweepHalf:16,throwEvery:3.4,warn:.8,fall:700,wreck:1.1,eyeFirst:3.5,eyeEvery:7.5,
 eyeFly:.9,eyeAim:1,eyeFire:.35,eyeStun:2.8,eyeLeave:.6,eyeBeam:320,eyeHalf:10,eyeHead:48};
export const DEBRIS={small:70,medium:96,wide:150,monitor:120,girder:130};
// ——— Phase 3: the storm islands for the doubles ———
export const STORM_ISLANDS={0:[0,474,460,0],11:[520,474,530,0],12:[1110,474,426,0],1:[92,366,296,1],3:[1131,366,296,1],4:[411,413,165,0],5:[965,413,165,0],2:[617,332,300,1],9:[464,272,145,2],10:[961,272,145,2]};
function screenSize(kind){const k=SCREEN_KINDS[kind];return {w:k.w,h:Math.round(k.w*CASING_H[k.casing])};}
export function createScreens(room=STAGE_ROOM){
 const base=rooms[room].x;
 return SCREEN_LAYOUT.map((t,i)=>{const {w,h}=screenSize(t.kind),y=t.kind==='huge'?t.top:(WALL_ARENA[t.on]?.[1]??474)-h;
  return {index:i,kind:t.kind,on:t.on,x:base+t.cx-w/2,y,w,h,hp:SCREEN_KINDS[t.kind].hits,state:'off',timer:0,dir:1,shards:0,role:null,cracked:false};});
}
export function createInfoshumNetwork(room=STAGE_ROOM){
 const tvs=createScreens(room);
 return {
  stage:'network',mode:'opening',timer:WAVE.opening,wave:0,broken:0,units:0,tvs,monitors:tvs,lastMonitorIndex:tvs.length-1,faces:[],built:false,
  transitionProgress:0,figures:[],order:[],lastSwing:-1,noise:0,noiseTime:0,ascent:null,drops:[],giantY:null
 };
}
export const screenUnits=n=>n.tvs.reduce((s,t)=>s+SCREEN_KINDS[t.kind].hits,0);
export const screenCenter=t=>({x:t.x+t.w/2,y:t.y+t.h/2});
const beamHalf=t=>Math.max(7,Math.round(t.h*.16));
// The beam of a firing screen runs along its tier towards Uma; the huge wall's beam sweeps a whole tier of the room.
export function beamRect(t,n=null){
 if(t.kind==='huge'){const r=rooms[STAGE_ROOM],y=n?.giantY??300;return {x:r.x,y:y-WAVE.giantHalf,w:r.width,h:WAVE.giantHalf*2};}
 const c=screenCenter(t),h=beamHalf(t),x0=t.dir>0?t.x+t.w-4:t.x+4;return {x:t.dir>0?x0:x0-WAVE.beam,y:c.y-h,w:WAVE.beam,h:h*2};
}
export function monitorRect(m){return {x:m.x,y:m.y,w:m.w,h:m.h};}
export function glassRect(m){return {x:m.x+m.w*.2,y:m.y+m.h*.2,w:m.w*.6,h:m.h*.55};}
const liveFaces=n=>n.tvs.filter(t=>t.role==='face'&&['face','charge','fire'].includes(t.state));
const isOut=t=>t.state==='broken'||t.state==='crack';
// The room is rearranged per phase: shapes of [x, y, w, look]; every other platform of the room hides.
function reshape(g,shapes,key){
 const r=rooms[g.room];
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;p.infoshumStep=false;p.storm=undefined;p.heap=undefined;p.debris=undefined;p.drift=0;
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;if(key)p[key]=shape[3];}
 }
}
export function buildWall(g){const n=g.boss.network;if(n.built)return;n.built=true;reshape(g,WALL_ARENA,'heap');}
function startWave(g){
 const n=g.boss.network,p=g.player,regular=n.tvs.filter(t=>t.kind!=='huge'&&!isOut(t)),huge=n.tvs.find(t=>t.kind==='huge');
 let faces;
 if(!regular.length){if(isOut(huge))return;faces=[huge];n.giantY=null;}
 else{
  const px=p.x+p.w/2,near=[...regular].sort((a,b)=>Math.abs(screenCenter(a).x-px)-Math.abs(screenCenter(b).x-px));
  const count=Math.min(regular.length,facesFor(n.broken));faces=[near[Math.floor(Math.random()*Math.min(3,near.length))]];
  const rest=regular.filter(t=>!faces.includes(t)).sort(()=>Math.random()-.5);while(faces.length<count&&rest.length)faces.push(rest.shift());
  var decoys=rest.slice(0,WAVE.decoys);
 }
 for(const t of n.tvs){t.role=faces.includes(t)?'face':decoys?.includes(t)?'decoy':null;if(!isOut(t))t.state=t.role?'static':'off';}
 // The huge wall flickers with static now and then while the heap still burns.
 if(regular.length&&!isOut(huge)&&n.wave%3===2){huge.state='static';huge.role='decoy';}
 n.mode='warn';n.timer=WAVE.warn;n.wave++;n.faces=faces.map(t=>t.index);
 g.emit('infoshumWave',{wave:n.wave,faces:faces.length,giant:!regular.length});
}
function setFaces(n,state){for(const t of n.tvs)if(t.role==='face'&&!isOut(t))t.state=state;}
function fireScreens(g){
 const n=g.boss.network,p=g.player;
 for(const t of liveFaces(n)){t.state='fire';t.dir=p.x+p.w/2>=screenCenter(t).x?1:-1;const c=screenCenter(t);g.emit('bossCast',{boss:'infoshum',ability:t.kind==='huge'?'giantBeam':'tvBeam',x:c.x,y:c.y,kind:t.kind});}
}
function beamHits(g){
 const n=g.boss.network,p=g.player;if(p.inv>0||p.dash>0)return;
 for(const t of n.tvs)if(t.state==='fire'&&overlap(p,beamRect(t,n))){g.hurt(false,screenCenter(t).x);return;}
}
function createRain(g){
 const p=g.player,x=p.x+p.w/2,s=g.platforms.find(s=>s.id===p.supportId),y=s?.y??474;
 for(const dx of[-38,-12,14,40])g.bolts.push({room:g.room,kind:'dataRain',infoshumAttack:'rain',visual:'infoshum',x:x+dx-6,y:Math.max(12,y-190),w:12,h:34,vx:0,vy:320,ttl:1.5,stopY:y+4});
 g.emit('bossCast',{boss:'infoshum',ability:'rain',x,y});
}
function syncBossToScreens(b){const n=b.network,t=n.tvs[n.faces[0]]||n.tvs[n.lastMonitorIndex];if(!t)return;const c=screenCenter(t);b.x=c.x-b.w/2;b.y=c.y-b.h/2;b.dir=1;}
function stepScreens(g,dt){
 const b=g.boss,n=b.network,p=g.player;buildWall(g);b.state=['face','charge'].includes(n.mode)?'recover':'network';
 for(const t of n.tvs){t.shards=Math.max(0,t.shards-dt);if(t.state==='crack'){t.timer-=dt;if(t.timer<=0)t.state='broken';}}
 beamHits(g);syncBossToScreens(b);
 n.timer-=dt;
 // Every face smashed (or driven off) before the beam: a short breath, then the next wave.
 if(['face','charge','fire'].includes(n.mode)&&!liveFaces(n).length){n.mode='rest';n.timer=Math.min(n.timer,WAVE.early);for(const t of n.tvs)if(!isOut(t)){t.state='off';t.role=null;}}
 if(n.timer>0)return;
 const giant=n.tvs.find(t=>t.role==='face')?.kind==='huge',r=Math.min(2,Math.floor(n.broken/4));
 if(n.mode==='opening'||n.mode==='rest'){startWave(g);}
 else if(n.mode==='warn'){n.mode='face';n.timer=giant?WAVE.giantFace:WAVE.face[r]+revealHint(g)*.3;for(const t of n.tvs)if(t.role==='decoy'&&!isOut(t)){t.state='off';t.role=null;}setFaces(n,'face');g.emit('infoshumReveal',{index:n.faces[0],first:n.wave===1,giant});if(!giant&&n.broken>=4)createRain(g);}
 else if(n.mode==='face'){n.mode='charge';n.timer=giant?WAVE.giantCharge:WAVE.charge;setFaces(n,'charge');if(giant)n.giantY=p.y+p.h/2;g.emit('infoshumWarning',{attack:giant?'giantBeam':'tvBeam'});}
 else if(n.mode==='charge'){n.mode='fire';n.timer=giant?WAVE.giantFire:WAVE.fire;fireScreens(g);}
 else if(n.mode==='fire'){n.mode='rest';n.timer=giant?WAVE.giantRest:WAVE.rest;for(const t of n.tvs)if(!isOut(t)){t.state='off';t.role=null;}}
}
// A paw on a screen while his face is in it (looking, charging or firing). A large screen cracks first and he flees it;
// the huge wall takes three paws, one per wave.
function hitScreen(g,t){
 const b=g.boss,n=b.network,c=screenCenter(t);t.hp--;n.units++;n.lastMonitorIndex=t.index;
 b.hp=Math.max(INFOSHUM_HP-PHASE_HP,+(INFOSHUM_HP-PHASE_HP*n.units/screenUnits(n)).toFixed(3));b.hurtTime=.35;t.shards=.45;
 g.emit('bossHit',{boss:'infoshum',x:c.x,y:c.y});
 if(t.hp>0){t.cracked=true;t.state='off';t.role=null;g.emit('infoshumScreenCrack',{index:t.index,cracked:true,x:c.x,y:c.y});return true;}
 t.state='crack';t.timer=.3;t.role=null;n.broken++;g.emit('infoshumScreenCrack',{index:t.index,broken:n.broken,x:c.x,y:c.y});
 if(t.kind==='huge')beginAssembly(g);
 return true;
}
function strikeScreens(g,paw){
 const n=g.boss.network,p=g.player;if(n.lastSwing===p.swing)return false;
 const t=n.tvs.find(t=>['face','charge','fire'].includes(t.state)&&t.role==='face'&&overlap(paw,t));if(!t)return false;
 n.lastSwing=p.swing;return hitScreen(g,t);
}
// ——— The assembly: every broken monitor flies to the middle and snaps into the colossus ———
function beginAssembly(g){
 const b=g.boss,n=b.network;
 n.stage='assemble';n.mode='assemble';n.timer=ASSEMBLE;n.transitionProgress=0;
 b.phase=2;b.phaseName='Колосс';b.state='phaseChange';b.hp=INFOSHUM_HP-PHASE_HP;
 g.bolts=[];g.cuts=[];g.inks=[];g.enemies=g.enemies.filter(e=>e.bossOwnerId!=='infoshum');
 for(const t of n.tvs)t.state='broken';
 g.player.inv=Math.max(g.player.inv,ASSEMBLE+1);
 g.emit('bossPhase',{boss:'infoshum',phase:2,name:'Колосс'});g.emit('infoshumAssemble',{x:rooms[g.room].x+768,y:200});
}
// ——— Phase 2 «Колосс»: the ascent ———
const debrisKinds=['wide','medium','monitor','girder','small','medium','wide','monitor','small','girder'];
function placeDebris(p,cx,y,kind){const r=rooms[STAGE_ROOM],w=DEBRIS[kind];p.debris=kind;p.w=w;p.x=r.x+clamp(cx,ASCENT.minX,ASCENT.maxX)-w/2;p.y=y;p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.dx=0;p.dy=0;p.bossHidden=false;p.motion=null;}
function nextCenter(prevCenter,prevW,w){
 const r=rooms[STAGE_ROOM],local=prevCenter-r.x,dist=(prevW+w)/2+10+Math.random()*50;
 let sign=Math.random()<.5?-1:1;if(local+sign*dist>ASCENT.maxX)sign=-1;if(local+sign*dist<ASCENT.minX)sign=1;
 return local+sign*dist;
}
export const debrisPieces=g=>g.platforms.filter(s=>s.room===g.room&&s.debris&&!s.bossHidden);
function beginAscent(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 for(const p of g.platforms)if(p.room===g.room){p.bossHidden=true;p.heap=undefined;p.storm=undefined;p.debris=undefined;p.drift=0;}
 const pieces=g.platforms.filter(p=>p.room===g.room).sort((a,c)=>a.index-c.index).slice(0,ASCENT.count);
 let cx=768,pw=0;
 pieces.forEach((p,i)=>{const kind=i===0?'wide':debrisKinds[i%debrisKinds.length],w=DEBRIS[kind];if(i)cx=nextCenter(r.x+cx,pw,w);placeDebris(p,cx,ASCENT.start-ASCENT.spacing*i,kind);pw=w;});
 n.stage='colossus';n.ascent={mode:'intro',timer:ASCENT.intro,speed:0,climbed:0,eyes:0,sweep:ASCENT.sweepEvery*.6,throwT:ASCENT.throwEvery,eyeT:ASCENT.eyeFirst,beamY:null,beamMode:null,beamTimer:0,eye:null,head:1,headTime:1.2,flash:0};
 n.drops=[];b.state='windup';
 // The pickups of the old room would hang in the sky of the climb.
 for(const key of ['fishes','soups','lifePickups'])if(Array.isArray(g[key]))g[key]=g[key].filter(o=>o.room!==g.room);
 const p=g.player,start=pieces[0];Object.assign(p,{x:start.x+start.w/2-p.w/2,y:start.y-p.h,vx:0,vy:0,grounded:true,supportId:start.id,climbing:false});p.inv=Math.max(p.inv,1.5);
 g.safeTrail=[{platformId:start.id,x:p.x,y:p.y}];g.updateCamera();
 g.emit('infoshumColossus',{x:r.x+768,y:120});
}
function recycleDebris(g){
 const pieces=debrisPieces(g);if(!pieces.length)return;
 for(const p of pieces)if(p.y>500){
  const top=pieces.filter(q=>q!==p).sort((a,c)=>a.y-c.y)[0],kind=debrisKinds[Math.floor(Math.random()*debrisKinds.length)],w=DEBRIS[kind];
  const cx=nextCenter(top.x+top.w/2,top.w,w);placeDebris(p,cx,top.y-ASCENT.spacing,kind);p.drift=top.drift;
 }
}
function supportUnder(g,x){const p=g.player;return debrisPieces(g).filter(s=>x>=s.x&&x<=s.x+s.w&&s.y>=p.y+p.h-4).sort((a,c)=>a.y-c.y)[0]||null;}
function spawnThrow(g){
 const n=g.boss.network,p=g.player,x=p.x+p.w/2+(Math.random()*2-1)*90,s=supportUnder(g,x)||g.platforms.find(q=>q.id===p.supportId);
 if(!s)return;n.drops.push({x:clamp(x,s.x+12,s.x+s.w-12),localX:clamp(x,s.x+12,s.x+s.w-12)-s.x,platformId:s.id,y:-60,ty:s.y,state:'warn',time:0});g.emit('bossCast',{boss:'infoshum',ability:'throw',x,y:s.y});
}
function stepDrops(g,dt){
 const n=g.boss.network,p=g.player;
 for(const d of n.drops){d.time+=dt;const s=g.platforms.find(q=>q.id===d.platformId);if(s&&!s.bossHidden&&s.debris){d.ty=s.y;d.x=s.x+d.localX;}else if(d.state!=='wreck')d.state='gone';
  if(d.state==='warn'&&d.time>=ASCENT.warn){d.state='fall';d.time=0;}
  else if(d.state==='fall'){d.y+=ASCENT.fall*dt;if(d.y>=d.ty){d.y=d.ty;d.state='impact';d.time=0;g.emit('boltImpact',{x:d.x,y:d.ty,kind:'screen'});
   if(p.inv<=0&&p.dash===0&&Math.abs(p.x+p.w/2-d.x)<38&&p.y+p.h>d.ty-60&&p.y<d.ty+4)g.hurt(false,d.x);}}
  else if(d.state==='impact'&&d.time>=.25){d.state='wreck';d.time=0;}
  else if(d.state==='wreck')d.y=d.ty;
 }
 n.drops=n.drops.filter(d=>d.state!=='gone'&&!(d.state==='wreck'&&d.time>ASCENT.wreck));
}
// An eye relay hovers just off the edge of Uma's debris, its head level with her, and rides the debris down.
export function eyeHead(e){return {x:e.x-ASCENT.eyeHead/2,y:e.y-ASCENT.eyeHead/2,w:ASCENT.eyeHead,h:ASCENT.eyeHead};}
function spawnEye(g){
 const n=g.boss.network,a=n.ascent,p=g.player,own=g.platforms.find(q=>q.id===p.supportId&&q.debris)||supportUnder(g,p.x+p.w/2);
 // Low debris would sink into the wave before the eye is spent: then it picks the nearest piece above Uma.
 const s=own&&own.y<=320?own:debrisPieces(g).filter(q=>q.y>=130&&q.y<=320).sort((x,y)=>Math.abs(x.y-(own?.y??300))-Math.abs(y.y-(own?.y??300)))[0];if(!s)return false;
 const r=rooms[g.room],side=s.x+s.w+70<r.x+ASCENT.maxX+120&&(p.x+p.w/2>s.x+s.w/2||s.x-70<r.x+ASCENT.minX-120)?1:-1;
 const hx=side>0?s.x+s.w+30:s.x-30,hy=s.y-34;
 a.eye={platformId:s.id,dx:hx-s.x,dy:hy-s.y,side,x:side>0?g.camera+1000:g.camera-60,y:hy-80,fromX:side>0?g.camera+1000:g.camera-60,fromY:hy-80,state:'fly',timer:ASCENT.eyeFly,dir:-side,lastSwing:-1};
 g.emit('infoshumEye',{x:hx,y:hy});return true;
}
function stepEye(g,dt){
 const n=g.boss.network,a=n.ascent,e=a.eye,p=g.player;if(!e)return;
 const s=g.platforms.find(q=>q.id===e.platformId);
 const hx=s?s.x+e.dx:e.x,hy=s?s.y+e.dy:e.y;e.timer-=dt;
 if(e.state==='fly'){const k=1-Math.max(0,e.timer)/ASCENT.eyeFly,ease=k*k*(3-2*k);e.x=e.fromX+(hx-e.fromX)*ease;e.y=e.fromY+(hy-e.fromY)*ease;if(e.timer<=0){e.state='aim';e.timer=ASCENT.eyeAim;}return;}
 if(['aim','fire','stunned','cracked'].includes(e.state)){e.x=hx;e.y=hy;}
 if(s&&(s.bossHidden||!s.debris||s.y>ASCENT.waveTop-20)&&['aim','fire','stunned'].includes(e.state)){e.state='leave';e.timer=ASCENT.eyeLeave;e.leaveFrom={x:e.x,y:e.y};}
 if(e.state==='aim'){e.dir=p.x+p.w/2>=e.x?1:-1;if(e.timer<=0){e.state='fire';e.timer=ASCENT.eyeFire;g.emit('bossCast',{boss:'infoshum',ability:'eyeBeam',x:e.x,y:e.y});}}
 else if(e.state==='fire'){if(p.inv<=0&&p.dash===0&&overlap(p,eyeBeamRect(e)))g.hurt(false,e.x);if(e.timer<=0){e.state='stunned';e.timer=ASCENT.eyeStun;g.emit('infoshumWeak',{x:e.x,y:e.y});}}
 else if(e.state==='stunned'){if(e.timer<=0){e.state='leave';e.timer=ASCENT.eyeLeave;e.leaveFrom={x:e.x,y:e.y};}}
 else if(e.state==='leave'){const k=1-Math.max(0,e.timer)/ASCENT.eyeLeave;e.x=e.leaveFrom.x+e.side*700*k*k;e.y=e.leaveFrom.y-160*k;if(e.timer<=0){a.eye=null;a.eyeT=ASCENT.eyeEvery*.6;}}
 else if(e.state==='cracked'){if(e.timer<=0){e.state='boom';e.timer=.5;}}
 else if(e.state==='boom'){if(e.timer<=0){a.eye=null;a.eyeT=ASCENT.eyeEvery;if(a.eyes>=3)beginBreakout(g);}}
}
export function eyeBeamRect(e){const x0=e.dir>0?e.x+ASCENT.eyeHead/2-4:e.x-ASCENT.eyeHead/2+4;return {x:e.dir>0?x0:x0-ASCENT.eyeBeam,y:e.y-ASCENT.eyeHalf,w:ASCENT.eyeBeam,h:ASCENT.eyeHalf*2};}
export function sweepRect(a){const r=rooms[STAGE_ROOM];return {x:r.x,y:(a.beamY??300)-ASCENT.sweepHalf,w:r.width,h:ASCENT.sweepHalf*2};}
function stepColossus(g,dt){
 const b=g.boss,n=b.network,a=n.ascent,p=g.player,r=rooms[g.room];
 a.flash=Math.max(0,a.flash-dt);a.headTime=Math.max(0,a.headTime-dt);if(a.headTime<=0&&a.head!==2)a.head=0;
 b.x=r.x+768-b.w/2;b.y=40;
 if(a.mode==='intro'){a.timer-=dt;b.state='phaseChange';if(a.timer<=0){a.mode='climb';}a.speed=0;}
 else a.speed=ASCENT.speed[Math.min(2,a.eyes)];
 for(const s of debrisPieces(g))s.drift=a.speed;
 a.climbed+=a.speed*dt;recycleDebris(g);stepDrops(g,dt);
 // The rising wave: a touch costs a heart and throws Uma back up.
 if(p.y+p.h>ASCENT.waveTop+4){if(p.inv<=0)g.hurt(false,p.x+p.w/2);Object.assign(p,{vy:ASCENT.bounce,grounded:false,supportId:null,climbing:false});p.y=Math.min(p.y,ASCENT.waveTop+4-p.h);g.emit('infoshumWave',{bounce:true,x:p.x,y:p.y});}
 if(a.mode==='intro')return;
 b.state=a.eye?.state==='stunned'?'recover':'windup';
 // The sweep from the head screen: the tier is picked when he starts to charge.
 if(a.beamMode==='aim'){a.beamTimer-=dt;if(a.beamTimer<=0){a.beamMode='sweep';a.beamTimer=ASCENT.sweep;a.head=1;a.headTime=ASCENT.sweep;a.flash=.25;g.emit('bossCast',{boss:'infoshum',ability:'giantBeam',x:b.x+b.w/2,y:a.beamY});}}
 else if(a.beamMode==='sweep'){a.beamTimer-=dt;if(p.inv<=0&&p.dash===0&&overlap(p,sweepRect(a)))g.hurt(false,b.x+b.w/2);if(a.beamTimer<=0){a.beamMode=null;a.beamY=null;a.head=0;}}
 else{a.sweep-=dt;if(a.sweep<=0&&!(a.eye&&['aim','fire'].includes(a.eye.state))){a.sweep=ASCENT.sweepEvery;a.beamMode='aim';a.beamTimer=ASCENT.aim;a.beamY=p.y+p.h/2;a.head=2;a.headTime=9;g.emit('infoshumWarning',{attack:'sweep',y:a.beamY});}}
 a.throwT-=dt;if(a.throwT<=0){a.throwT=ASCENT.throwEvery;if(a.beamMode!=='sweep')spawnThrow(g);}
 if(a.eye)stepEye(g,dt);else{a.eyeT-=dt;if(a.eyeT<=0&&!a.beamMode){if(!spawnEye(g))a.eyeT=.5;}}
}
function strikeEye(g,paw){
 const b=g.boss,n=b.network,a=n.ascent,e=a?.eye,p=g.player;if(!e||e.state!=='stunned'||e.lastSwing===p.swing||!overlap(paw,eyeHead(e)))return false;
 e.lastSwing=p.swing;e.state='cracked';e.timer=.3;a.eyes++;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;a.head=3;a.headTime=.9;a.flash=.3;
 g.emit('bossHit',{boss:'infoshum',x:e.x,y:e.y});g.emit('infoshumCoreHit',{x:e.x,y:e.y});return true;
}
// ——— The breakout: the head screen cracks and he tears out into the storm ———
function beginBreakout(g){
 const b=g.boss,n=b.network,a=n.ascent;
 n.stage='breakout';n.mode='breakout';n.timer=BREAKOUT;n.transitionProgress=0;a.head=4;a.headTime=99;a.beamMode=null;a.eye=null;n.drops=[];g.bolts=[];
 b.phase=3;b.phaseName='На свободе';b.state='phaseChange';b.hp=PHASE_HP;g.player.inv=Math.max(g.player.inv,BREAKOUT+1);
 g.emit('bossPhase',{boss:'infoshum',phase:3,name:'На свободе'});g.emit('infoshumRupture',{x:rooms[g.room].x+768,y:120});
}
function landSafely(g,index,dx=45){
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===index);
 Object.assign(p,{x:landing.x+dx,y:landing.y-p.h,vx:0,vy:0,grounded:true,supportId:landing.id,climbing:false});p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];g.updateCamera();
}
function beginGhosts(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 reshape(g,STORM_ISLANDS,'storm');landSafely(g,2,100);
 n.splitFrom={x:r.x+768,y:130};n.stage='noise';n.noise=0;n.noiseTime=0;b.phase=3;b.phaseName='На свободе';b.state='phaseChange';g.bolts=[];
 newFigures(g);g.emit('infoshumSplit',{x:n.splitFrom.x,y:n.splitFrom.y});g.emit('infoshumFreed',{x:n.splitFrom.x,y:n.splitFrom.y});
}
// ——— Phase 3 «На свободе»: the doubles ———
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
 if(b.hp===0){b.x=f.x-b.w/2;b.y=f.y-b.h+10;g.bossDefeated();return true;}
 n.figures=n.figures.filter(o=>o===f);f.state='rise';f.time=0;n.mode='reel';n.timer=SPLIT.reel;return true;
}
function stepNoiseSwats(g,paw){const n=g.boss.network,p=g.player;let popped=false;for(const f of n.figures)if(!f.real&&['hover','warn','dive','split'].includes(f.state)&&f.lastSwing!==p.swing&&overlap(paw,figureBox(f))){f.lastSwing=p.swing;f.state='burst';f.time=0;n.noiseTime=Math.min(noiseDuration(g)*.98,n.noiseTime+noiseDuration(g)*.08);popped=true;g.emit('infoshumFakeHit',{x:f.x,y:f.y,double:true});}return popped;}
export function corePoint(b){return {x:b.x+b.w/2,y:b.y+b.h/2+8};}
export function coreBox(b){const c=corePoint(b);return {x:c.x-34,y:c.y-34,w:68,h:68};}
export function headlineBoxes(){return [];}
// A fall between the storm islands returns Uma to the last island she stood on (and costs a heart).
export function infoshumFall(g){const n=g.boss?.network;if(g.room!==STAGE_ROOM||n?.stage!=='noise')return false;return pitFall(g,STAGE_ROOM,s=>!s.bossHidden);}
export function stepInfoshum(g,dt,paw=null){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 if(n.stage==='network'){stepScreens(g,dt);return;}
 if(n.stage==='assemble'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/ASSEMBLE;if(n.timer===0)beginAscent(g);return;}
 if(n.stage==='colossus'){stepColossus(g,dt);return;}
 if(n.stage==='breakout'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/BREAKOUT;n.ascent.flash=Math.max(0,(n.ascent.flash||0)-dt);for(const s of debrisPieces(g))s.drift=0;if(n.timer===0)beginGhosts(g);return;}
 if(n.stage==='noise')stepNoise(g,dt);
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;if(!b.active||!n||p.attack<=0||b.hp<=0||g.mode!=='playing')return false;
 if(n.stage==='network')return strikeScreens(g,paw);
 if(n.stage==='colossus')return strikeEye(g,paw);
 if(n.stage==='noise'){const popped=stepNoiseSwats(g,paw);return strikeFigure(g,paw)||popped;}
 return false;
}
// Test and debugging helpers.
export function exposeInfoshum(g){const b=g.boss,n=b.network;b.cooldown=0;
 if(n.stage==='network'){buildWall(g);if(!liveFaces(n).length||!['face','charge','fire'].includes(n.mode))startWave(g);n.mode='face';n.timer=9;for(const t of n.tvs)if(t.role==='decoy'&&!isOut(t)){t.state='off';t.role=null;}setFaces(n,'face');}
 else if(n.stage==='colossus'){const a=n.ascent;a.mode='climb';if(a.eye&&['cracked','boom'].includes(a.eye.state)){a.eye=null;if(a.eyes>=3){beginBreakout(g);return;}}if(!a.eye)spawnEye(g);const e=a.eye;if(e){const s=g.platforms.find(q=>q.id===e.platformId);e.x=s.x+e.dx;e.y=s.y+e.dy;e.state='stunned';e.timer=ASCENT.eyeStun;}}
 else if(n.stage==='noise'){if(!n.figures.some(f=>f.real))newFigures(g);const f=n.figures.find(f=>f.real);const t=targetSurface(g);Object.assign(f,{state:'stuck',time:0,x:t.x,y:t.y});}
}
// Test helper: smash one face screen through the real mechanics (Uma beside it on its tier, one paw strike).
export function crackInfoshumScreen(g){
 const b=g.boss,n=b.network;if(n.stage!=='network')return false;exposeInfoshum(g);const t=liveFaces(n)[0];if(!t)return false;
 const p=g.player,s=t.kind==='huge'?g.platforms.find(s=>s.room===g.room&&s.index===9):g.platforms.find(s=>s.room===g.room&&s.index===t.on);
 const x=t.kind==='huge'?s.x+s.w-p.w-2:t.x+t.w/2-p.w-4;Object.assign(p,{x,y:s.y-48,h:48,vy:0,vx:0,grounded:true,supportId:s.id,dir:1});
 p.attack=.18;p.swing++;const paw={x:p.x+16,y:p.y-2,w:54,h:p.h+6};return strikeInfoshum(g,paw);
}
// Test helper: smash the whole wall (every screen, then the huge one) — the colossus starts assembling.
export function smashWall(g){const n=g.boss.network;let k=0;while(n.stage==='network'&&k++<60){crackInfoshumScreen(g);for(const t of n.tvs)if(t.state==='crack')t.state='broken';}return n.stage;}
// Test helper: jump straight into the colossus climb.
export function colossusInfoshum(g){const n=g.boss.network;if(n.stage==='network')smashWall(g);if(n.stage==='assemble'){n.timer=0;stepInfoshum(g,0);}if(n.stage==='colossus')n.ascent.mode='climb';return n.stage;}
// Test helper: swat one stunned eye relay through the real mechanics.
export function swatEye(g){const n=g.boss.network;if(n.stage!=='colossus')return false;exposeInfoshum(g);const e=n.ascent.eye;if(!e)return false;const p=g.player,s=g.platforms.find(q=>q.id===e.platformId);
 Object.assign(p,{x:e.side>0?s.x+s.w-p.w-2:s.x+2,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,dir:e.side});p.attack=.18;p.swing++;const paw={x:e.side>0?p.x+16:p.x-54+18,y:p.y-2,w:54,h:p.h+6};return strikeInfoshum(g,paw);}
// Test helper: drive the fight to the doubles in the storm (phase three).
export function freeInfoshum(g){const n=g.boss.network;colossusInfoshum(g);for(let k=0;k<3&&n.stage==='colossus';k++){swatEye(g);n.ascent.eye.timer=0;stepEye(g,0);n.ascent.eye&&(n.ascent.eye.timer=0,stepEye(g,0));}if(n.stage==='breakout'){n.timer=0;stepInfoshum(g,0);}return n.stage;}
// Test helper: the final blow through the real mechanics (a stuck real figure under Uma, one paw strike).
export function finishInfoshum(g){const b=g.boss,n=b.network;if(n.stage!=='noise')freeInfoshum(g);b.hp=Math.min(b.hp,HIT_DAMAGE);b.cooldown=0;exposeInfoshum(g);const f=n.figures.find(f=>f.real);g.player.attack=.18;g.player.swing++;return strikeInfoshum(g,figureBox(f));}
export function infoshumTargets(g){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return [];
 if(n.stage==='network')return n.tvs.filter(t=>t.role==='face'&&['face','charge','fire'].includes(t.state)).map(t=>({id:'screen'+t.index,x:t.x,y:t.y,w:t.w,h:t.h}));
 if(n.stage==='colossus'&&n.ascent.eye?.state==='stunned')return [{id:'eye',...eyeHead(n.ascent.eye)}];
 if(n.stage==='noise'){const f=n.figures.find(f=>f.real&&f.state==='stuck');if(f)return [{id:'figure',...figureBox(f)}];}
 return [];
}
