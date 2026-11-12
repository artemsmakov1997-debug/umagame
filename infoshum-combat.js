// «Найди источник»: the final fight, three phases of six health each.
// 1 «Прямой эфир»: a huge square monitor stands in the middle of the hall behind a dome of static, fed by four relays.
//   It scans the floor with a vertical beam (hide under a ledge), whips a cable across Uma's ledge (jump) and spits small
//   TVs that leave puddles of noise. Yuri breaks into the relays one by one and opens a junction box — a paw smashes it.
//   With both relays of the round dead the dome falls and Yuri bursts into the big screen: he and Infoshum alternate,
//   and a paw counts while Infoshum is on it. Three cracks — the colossus gathers around the monitor, its new head.
// 2 «Колосс»: a fist slams the floor beside the body (a shockwave runs along the floor — jump) and sticks: the monitor
//   on its knuckles is the weak spot. An arm sweeps low (jump) or high (crouch); the head's beam crawls after Uma.
//   With both hands broken he collapses and the head screen lies on the floor: a paw there takes two health.
// 3 «На свободе»: he bursts out of the head screen into the storm. Tentacles break out of the ground, shards of
//   headlines fly at Uma, he rams along her island; dodge the ram and he crashes, dizzy — a paw tears a tentacle off.
import {rooms} from './level.js?v=0.21.5';
import {originalsFound} from './dimension-systems.js?v=0.21.5';
import {pitFall} from './pit-falls.js?v=0.21.5';
// Each «первоисточник» from the Dimension: his face stays longer in the screens.
export const SOURCE_NOISE_BONUS=12,SOURCE_CORE_BONUS=0,SOURCE_HINT=.8;
export const NOISE_CLEAR=.3,NOISE_TIME=60,INFOSHUM_HP=12,HIT_DAMAGE=2,PHASE_HP=4;
export const noiseDuration=g=>NOISE_TIME+SOURCE_NOISE_BONUS*originalsFound(g);
export const coreDamage=()=>HIT_DAMAGE;
export const revealHint=g=>Math.min(2.4,SOURCE_HINT*originalsFound(g));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const STAGE_ROOM=8;
export const FLOOR=474;
// ——— Phase 1: the broadcast tower ———
// The hall (room-local x, y, w): the floor and ledges between the relays; every other platform of the room hides.
export const HALL={0:[0,474,1536],1:[130,392,190],6:[250,300,240],4:[560,410,110],2:[620,330,296],9:[690,262,156],5:[866,410,110],3:[1216,392,190],8:[1046,300,240]};
// The huge square monitor in the middle (the future head) and the four relays that feed it.
export const TOWER={cx:768,base:474,w:340,h:392};
export const RELAYS=[{cx:105,base:474,w:150},{cx:330,base:300,w:170},{cx:1206,base:300,w:170},{cx:1431,base:474,w:150}];
export const RELAY_H=246/174;
export const ROUND_PAIRS=[[0,3],[1,2],[0,2]];
export const WAVE={opening:1.4,gap:[1.05,.9,.75],plan:['scan','whip','volley','whip'],scanWarn:.75,scanSpeed:390,scanSpan:860,scanHalf:22,whipWarn:.85,whipHit:.35,whipHalf:220,volley:3,volleyGap:.28,flight:.8,puddle:3,puddleHalf:34,
 yuriDelay:1.1,yuriPoint:.9,hitFlash:.3,reboot:.8,takeover:12,yuriFace:1.05,face:1.1,flip:.22,relayUnit:.5,screenUnit:1};
export const ARRIVE=1.6,ASSEMBLE=3.6,BREAKOUT=3;
export const COL={reach:110,windup:.55,intro:2,gap:[1.1,.85,.6],aim:[1.1,.95,.8],lock:.35,fall:.12,stuck:[2.8,2.6,2.4],lift:.45,fistHalf:58,track:340,shockSpeed:430,shockRange:520,
 sweepWarn:.85,sweepSpeed:1500,sweepSpan:760,beamCharge:1,beamTime:2.2,beamSpeed:118,beamHalf:30,collapse:4.6,rise:1.2,fallTime:.8,plan:['slam','sweep','channels','slam','beam']};
// «Каналы» (assets/infoshum-channels.png, drawn in infoshum-attacks-art.js): he drops televisions from the sky at
//   random spots on the floor, facing the nearer wall. They stay until Uma smashes one with a paw; each warms up,
//   overheats and fires a beam along the floor to the wall (jump over it), then goes dark until its next shot.
//   At most `max` sets stand at once; a new drop keeps clear of the colossus, the other sets and Uma.
export const CHANNELS={drop:.5,warm:.7,heat:.6,fire:.8,first:[1,1.8],every:[2.6,3.6],count:2,max:4,apart:150,body:190,wall:70,uma:90,wreck:.6,beamH:26,tvW:92,tvH:72};
export const FREE={enter:1.2,gap:[1,.8,.6],hoverY:120,tentWarn:.75,tentUp:.5,tentGap:.7,tentHalf:30,volleyMove:.7,volleyGap:.42,shardSpeed:420,ramPrep:.95,ramSpeed:780,crash:.35,dizzy:2.8,dizzyYuri:4.2,hit:.7,bounce:.7,
 ghostRise:.45,ghostSplit:.65,ghostAim:.45,ghostDash:.4,ghostSpread:260,ghostOver:140,pull:.35,reflect:1.25,plan:['tentacle','volley','ghosts']};
// «Двойники»: he rises above Uma and splits into three — two ghostly copies slide out of him to either side. Then
// they attack one after another: each one aims at where Uma is now (its line blinks), then dives through that spot;
// the real one goes last, straight down. Where he lands Yuri lassoes him: the opening.
export const ghostPrep=()=>FREE.ghostRise+FREE.ghostSplit;
export function ghostPos(gh,k){return {x:gh.x0+(gh.x1-gh.x0)*k,y:gh.y0+(gh.y1-gh.y0)*k};}
export function ghostBox(p){return {x:p.x-34,y:p.y-26,w:68,h:52};}
export const STORM_ISLANDS={0:[0,474,460,0],11:[520,474,530,0],12:[1110,474,426,0],1:[92,366,296,1],3:[1131,366,296,1],4:[411,413,165,0],5:[965,413,165,0],2:[617,332,300,1],9:[464,272,145,2],10:[961,272,145,2]};
export const towerTop=()=>TOWER.base-TOWER.h;
export function towerScreen(g){const x=rooms[g.room].x+TOWER.cx;return {x:x-102,y:towerTop()+51,w:204,h:146};}
export function relayRect(g,i){const r=RELAYS[i],h=r.w*RELAY_H,x=rooms[g.room].x+r.cx;return {x:x-r.w/2,y:r.base-h,w:r.w,h};}
// The part of a relay a paw can reach: its lower half, where Yuri opens the junction box.
export function relayHit(g,i){const r=relayRect(g,i);return {x:r.x+r.w*.05,y:r.y+r.h*.45,w:r.w*.9,h:r.h*.55};}
export function createInfoshumNetwork(room=STAGE_ROOM){
 return {stage:'network',mode:'opening',timer:WAVE.opening,round:0,cracks:0,units:0,built:false,
  relays:RELAYS.map((r,i)=>({index:i,state:'live',timer:0})),shield:true,face:'dark',faceTime:0,attack:null,step:0,scans:[],whips:[],tvs:[],puddles:[],
  take:null,yuriQueue:[],yuriTimer:0,transitionProgress:0,lastSwing:-1,noise:0,noiseTime:0,col:null,free:null,
  monitors:RELAYS.map(r=>({x:rooms[room].x+r.cx-r.w/2,y:r.base-r.w*RELAY_H,w:r.w,h:r.w*RELAY_H}))};
}
export const screenCenter=t=>({x:t.x+t.w/2,y:t.y+t.h/2});
export const realScreen=n=>n.take&&n.take.show==='face'?n:null;
function setFace(n,face,time=0){n.face=face;n.faceTime=time;}
// The room is rearranged per phase: shapes of [x, y, w, look]; every other platform of the room hides.
function reshape(g,shapes,key){
 const r=rooms[g.room];
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;p.infoshumStep=false;p.storm=undefined;p.heap=undefined;
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;if(key&&shape[3]!==undefined)p[key]=shape[3];}
 }
}
export function buildWall(g){const n=g.boss.network;if(n.built)return;n.built=true;reshape(g,HALL);}
const surfaces=g=>g.platforms.filter(s=>s.room===g.room&&!s.bossHidden);
// The first surface a beam from above meets at x (the floor if nothing else).
export function beamFloor(g,x){let y=FLOOR;for(const s of surfaces(g))if(x>=s.x&&x<=s.x+s.w&&s.y<y)y=s.y;return y;}
function supportOf(g){const p=g.player,own=surfaces(g).find(s=>s.id===p.supportId);if(own)return own;const x=p.x+p.w/2;return surfaces(g).filter(s=>x>=s.x&&x<=s.x+s.w&&s.y>=p.y+p.h-6).sort((a,b)=>a.y-b.y)[0]||surfaces(g).find(s=>s.index===0);}
const hurtable=p=>p.inv<=0&&p.dash===0;
// ——— Yuri and the relays ———
function startRound(g){
 const n=g.boss.network,pair=ROUND_PAIRS[n.round];n.shield=true;n.take=null;
 for(const i of pair)if(n.relays[i].state==='dead'){n.relays[i].state='reboot';n.relays[i].timer=WAVE.reboot;}
 const p=g.player,px=p.x+p.w/2,dist=i=>Math.abs(relayRect(g,i).x+relayRect(g,i).w/2-px);
 n.yuriQueue=[...pair].sort((a,b)=>dist(a)-dist(b));n.yuriTimer=WAVE.yuriDelay;
 g.emit('infoshumWave',{round:n.round});
}
function stepRelays(g,dt){
 const n=g.boss.network;
 for(const r of n.relays){r.timer=Math.max(0,r.timer-dt);
  if(r.state==='reboot'&&r.timer<=0)r.state='live';
  else if(r.state==='yuri'&&r.timer<=0){r.state='open';const h=relayHit(g,r.index);g.emit('infoshumWeak',{x:h.x+h.w/2,y:h.y});}
  else if(r.state==='hit'&&r.timer<=0)r.state='dead';}
 if(!n.shield)return;
 const busy=n.relays.some(r=>['yuri','open','hit','reboot'].includes(r.state));
 if(!busy&&n.yuriQueue.length){n.yuriTimer-=dt;if(n.yuriTimer<=0){const i=n.yuriQueue.shift(),r=n.relays[i];r.state='yuri';r.timer=WAVE.yuriPoint;const h=relayRect(g,i);g.emit('yuriHint',{x:h.x+h.w/2,y:h.y});n.yuriTimer=.8;}}
 const pair=ROUND_PAIRS[n.round];
 if(pair.every(i=>n.relays[i].state==='dead'))dropShield(g);
}
function dropShield(g){const n=g.boss.network;n.shield=false;n.attack=null;n.take={show:'yuri',timer:WAVE.yuriFace,left:WAVE.takeover,flip:0};setFace(n,'yuri');const sc=towerScreen(g);g.emit('yuriHold',{x:sc.x+sc.w/2,y:sc.y});g.emit('infoshumReveal',{first:n.round===0,takeover:true});}
// Yuri and Infoshum fight for the big screen: the paw counts only while his face is on it.
function stepTakeover(g,dt){
 const n=g.boss.network,t=n.take;t.timer-=dt;t.left-=dt;
 if(t.left<=0){startRound(g);n.mode='rest';n.timer=WAVE.gap[n.round];setFace(n,'roar',.8);g.emit('infoshumWarning',{attack:'shield'});return;}
 if(t.timer>0)return;
 if(t.show==='half'){t.show=t.next;t.timer=t.show==='face'?WAVE.face:WAVE.yuriFace;setFace(n,t.show==='face'?faceFor(n):'yuri');}
 else{t.next=t.show==='face'?'yuri':'face';t.show='half';t.timer=WAVE.flip;setFace(n,'half');}
}
const SCREEN_HITS=2,faceFor=n=>['face','crack2','crack3'][Math.min(2,n.cracks)];
// ——— The tower's attacks ———
function towerAttack(g){
 const n=g.boss.network,p=g.player,px=p.x+p.w/2,r=rooms[g.room],kind=WAVE.plan[n.step++%WAVE.plan.length];
 if(kind==='scan'){const dir=px<r.x+768?1:-1,x=clamp(px-dir*WAVE.scanSpan/2,r.x+20,r.end-20);n.scans.push({x,dir,state:'warn',timer:WAVE.scanWarn,travel:0});setFace(n,'charge',WAVE.scanWarn);g.emit('infoshumWarning',{attack:'scan',x});}
 else if(kind==='whip'){const s=supportOf(g),x0=Math.max(s.x,px-WAVE.whipHalf),x1=Math.min(s.x+s.w,px+WAVE.whipHalf);n.whips.push({x0,x1,y:s.y,platformId:s.id,from:px<r.x+768?-1:1,state:'warn',timer:WAVE.whipWarn});g.emit('infoshumWarning',{attack:'whip',x:px,y:s.y});}
 else{setFace(n,'roar',1.1);const sc=towerScreen(g);for(let i=0;i<WAVE.volley;i++){const tx=clamp(px+(i-1)*130,r.x+30,r.end-30);n.tvs.push({fx:sc.x+sc.w/2,fy:sc.y+sc.h/2,tx,ty:beamFloor(g,tx),t:-i*WAVE.volleyGap,state:'fly'});}g.emit('bossCast',{boss:'infoshum',ability:'volley',x:sc.x+sc.w/2,y:sc.y});}
 n.attack=kind;
}
function stepAttacks(g,dt){
 const n=g.boss.network,p=g.player,px=p.x+p.w/2;
 for(const s of n.scans){s.timer-=dt;if(s.state==='warn'){if(s.timer<=0){s.state='go';g.emit('bossCast',{boss:'infoshum',ability:'scan',x:s.x,y:0});}continue;}
  const v=WAVE.scanSpeed*dt;s.x+=s.dir*v;s.travel+=v;s.bottom=beamFloor(g,s.x);
  if(hurtable(p)&&Math.abs(px-s.x)<WAVE.scanHalf+p.w/2-6&&p.y+p.h<=s.bottom+4)g.hurt(false,s.x);}
 n.scans=n.scans.filter(s=>s.travel<WAVE.scanSpan);
 for(const w of n.whips){w.timer-=dt;if(w.state==='warn'){if(w.timer<=0){w.state='hit';w.timer=WAVE.whipHit;g.emit('bossCast',{boss:'infoshum',ability:'whip',x:(w.x0+w.x1)/2,y:w.y});}continue;}
  if(hurtable(p)&&p.grounded&&p.supportId===w.platformId&&px>w.x0-8&&px<w.x1+8)g.hurt(false,px);}
 n.whips=n.whips.filter(w=>!(w.state==='hit'&&w.timer<=-.35));
 for(const t of n.tvs){t.t+=dt;if(t.state==='fly'&&t.t>=WAVE.flight){t.state='hit';t.t=0;g.emit('boltImpact',{x:t.tx,y:t.ty,kind:'screen'});
   if(hurtable(p)&&Math.abs(px-t.tx)<38&&p.y+p.h>t.ty-60&&p.y<t.ty+4)g.hurt(false,t.tx);n.puddles.push({x:t.tx,y:t.ty,time:0});}}
 n.tvs=n.tvs.filter(t=>!(t.state==='hit'&&t.t>.3));
 for(const q of n.puddles){q.time+=dt;if(q.time>.2&&q.time<WAVE.puddle-.3&&hurtable(p)&&p.grounded&&Math.abs(px-q.x)<WAVE.puddleHalf&&Math.abs(p.y+p.h-q.y)<4)g.hurt(false,q.x);}
 n.puddles=n.puddles.filter(q=>q.time<WAVE.puddle);
}
const attacksBusy=n=>n.scans.length||n.whips.length||n.tvs.length;
const MOODS=[['roar',.55],['static',.25],['charge',.3]];
export const EMOTIONS=['grin','laugh','roar','sneer','glare','scream','tongue','glitch'];
const pick=l=>l[Math.floor(Math.random()*l.length)];
function emote(o,name=pick(EMOTIONS),t=.9+Math.random()*.7){o.emo={name,t,max:t};}
function stepEmo(o,dt){if(o.emo){o.emo.t-=dt;if(o.emo.t<=0)o.emo=null;}}
function stepScreens(g,dt){
 const b=g.boss,n=b.network;buildWall(g);n.faceTime=Math.max(0,n.faceTime-dt);
 const sc=towerScreen(g);b.x=sc.x+sc.w/2-b.w/2;b.y=sc.y+sc.h/2-b.h/2;b.dir=1;
 stepRelays(g,dt);stepAttacks(g,dt);
 if(n.mode==='opening'){n.timer-=dt;b.state='network';if(n.timer<1.0&&n.face==='dark')setFace(n,'static');if(n.timer<=0){setFace(n,'face');startRound(g);n.mode='rest';n.timer=.4;}return;}
 if(!n.shield){b.state='recover';stepTakeover(g,dt);return;}
 b.state=n.faceTime>0&&n.face==='charge'?'casting':'windup';
 if(n.faceTime<=0&&!['face','crack1','crack2'].includes(n.face))setFace(n,faceFor(n));
 // Between attacks his face is never still: he snarls, glitches with static, glares with a charging glow.
 stepEmo(n,dt);if(attacksBusy(n)||n.faceTime>0)n.emo=null;
 n.mood=(n.mood??1.6)-dt;if(n.mood<=0&&n.faceTime<=0&&!attacksBusy(n)){if(Math.random()<.2){const m=pick(MOODS);setFace(n,m[0],m[1]);}else emote(n);n.mood=1.5+Math.random()*1.4;}
 if(attacksBusy(n))return;n.timer-=dt;if(n.timer<=0){towerAttack(g);n.timer=WAVE.gap[n.round];}
}
function addUnits(g,u,x,y){const b=g.boss,n=b.network;n.units+=u;b.hp=Math.max(INFOSHUM_HP-PHASE_HP,+(INFOSHUM_HP-n.units).toFixed(3));b.hurtTime=.35;g.emit('bossHit',{boss:'infoshum',x,y});}
function strikeScreens(g,paw){
 const n=g.boss.network,p=g.player;if(n.lastSwing===p.swing)return false;
 if(n.shield){const r=n.relays.find(r=>r.state==='open'&&overlap(paw,relayHit(g,r.index)));if(!r)return false;
  n.lastSwing=p.swing;r.state='hit';r.timer=WAVE.hitFlash;const h=relayHit(g,r.index);addUnits(g,WAVE.relayUnit,h.x+h.w/2,h.y);g.emit('infoshumScreenCrack',{relay:r.index,x:h.x+h.w/2,y:h.y});return true;}
 const sc=towerScreen(g);if(n.take?.show!=='face'||!overlap(paw,sc))return false;
 n.lastSwing=p.swing;n.cracks++;addUnits(g,WAVE.screenUnit,sc.x+sc.w/2,sc.y+sc.h/2);g.emit('infoshumScreenCrack',{cracks:n.cracks,x:sc.x+sc.w/2,y:sc.y+sc.h/2});
 if(n.cracks>=SCREEN_HITS){setFace(n,'crack3');beginAssembly(g);return true;}
 n.round++;n.scans=[];n.whips=[];n.tvs=[];startRound(g);setFace(n,'roar',1);n.mode='rest';n.timer=WAVE.gap[n.round]+.6;return true;
}
// ——— The assembly: every monitor flies to the middle and snaps into the colossus ———
function beginAssembly(g){
 const b=g.boss,n=b.network;
 n.stage='assemble';n.mode='assemble';n.timer=ASSEMBLE;n.transitionProgress=0;n.scans=[];n.whips=[];n.tvs=[];n.puddles=[];n.take=null;
 b.phase=2;b.phaseName='Колосс';b.state='phaseChange';b.hp=INFOSHUM_HP-PHASE_HP;
 g.bolts=[];g.cuts=[];g.inks=[];g.enemies=g.enemies.filter(e=>e.bossOwnerId!=='infoshum');
 g.player.inv=Math.max(g.player.inv,ASSEMBLE+1);
 g.emit('bossPhase',{boss:'infoshum',phase:2,name:'Колосс'});g.emit('infoshumAssemble',{x:rooms[g.room].x+768,y:200});
}
function landSafely(g,index,dx=45){
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===index);
 Object.assign(p,{x:landing.x+dx,y:landing.y-p.h,vx:0,vy:0,grounded:true,supportId:landing.id,climbing:false});p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];g.updateCamera();
}
// ——— Phase 2 «Колосс» ———
const centre=g=>rooms[g.room].x+768;
function beginColossus(g){
 const b=g.boss,n=b.network;
 reshape(g,{0:[0,FLOOR,1536,'floor']},'heap');
 for(const key of ['fishes'])if(Array.isArray(g[key]))g[key]=g[key].filter(o=>o.room!==g.room);
 {const p=g.player;Object.assign(p,{y:FLOOR-p.h,vx:0,vy:0,grounded:true,supportId:g.room+':0'});portalOut(g);}
 n.stage='colossus';n.col={clock:0,hurt:0,mode:'intro',timer:COL.intro,round:0,hands:{L:true,R:true},side:'R',step:0,fist:null,sweep:null,beam:null,shocks:[],dust:null,head:1,headTime:1.3,flash:0,lastSwing:-1};
 b.state='phaseChange';landSafely(g,0,440);g.emit('infoshumColossus',{x:centre(g),y:120});
}
const roundOf=a=>Math.min(2,a.round);
export function fistBox(f){return {x:f.x-48,y:FLOOR-122,w:96,h:112};}
export function headBox(g){const x=centre(g)-30;return {x:x-75,y:FLOOR-110,w:150,h:104};}
export function sweepBox(s){return {x:s.x-80,y:s.low?FLOOR-38:FLOOR-84,w:160,h:s.low?38:44};}
function idle(a){a.mode='idle';a.timer=COL.gap[roundOf(a)];}
function collapse(g){const a=g.boss.network.col;a.mode='collapse';a.clock=0;a.timer=COL.collapse;a.fist=null;a.sweep=null;a.beam=null;a.shocks=[];clearAttacks(g);a.flash=.3;a.head=3;const h=headBox(g);g.emit('infoshumCollapse',{x:h.x+h.w/2,y:h.y});g.emit('infoshumWeak',{x:h.x+h.w/2,y:h.y});}
function clearAttacks(g){const a=g.boss.network.col;a.channels=null;}
function rise(a){a.mode='rise';a.clock=0;a.timer=COL.rise;a.hands={L:true,R:true};a.head=1;a.headTime=COL.rise;a.flash=.3;}
function nextAttack(g){
 const n=g.boss.network,a=n.col,p=g.player,px=p.x+p.w/2,kind=COL.plan[a.step++%COL.plan.length];a.mode='attack';
 // A fist lands at a fixed spot beside the body, on Uma's side (the other hand if that one is broken).
 if(kind==='slam'){let side=px<centre(g)?'L':'R';if(!a.hands[side])side=side==='R'?'L':'R';const x=centre(g)+(side==='L'?-1:1)*COL.reach;a.fist={side,x,y:-240,state:'aim',timer:COL.aim[roundOf(a)]+COL.windup,weak:false,lastSwing:-1,age:0};g.emit('infoshumWarning',{attack:'slam',x,y:FLOOR});}
 else if(kind==='sweep'){const dir=px<centre(g)?-1:1;a.sweep={dir,low:Math.random()<.5,x:centre(g)-dir*COL.sweepSpan/2,state:'warn',timer:COL.sweepWarn,travel:0,age:0};g.emit('infoshumWarning',{attack:'sweep'});}
 else if(kind==='channels'){dropTvs(g);a.channels={timer:CHANNELS.drop+.35};g.emit('infoshumWarning',{attack:'channels'});}
 else{a.beam={state:'charge',timer:COL.beamCharge,x:px};a.head=2;a.headTime=9;g.emit('infoshumWarning',{attack:'beam'});}
}
export function tvBox(t){return {x:t.x-CHANNELS.tvW/2,y:FLOOR-CHANNELS.tvH,w:CHANNELS.tvW,h:CHANNELS.tvH};}
export function tvBeam(g,t){const r=rooms[g.room],x0=t.x+t.dir*CHANNELS.tvW/2,x1=t.dir<0?r.x:r.end;return {x:Math.min(x0,x1),y:FLOOR-8-CHANNELS.beamH,w:Math.abs(x1-x0),h:CHANNELS.beamH};}
const between=([lo,hi])=>lo+Math.random()*(hi-lo);
// Random free spots: away from the walls, the colossus's body, the sets already standing and Uma herself.
function dropTvs(g){
 const a=g.boss.network.col,r=rooms[g.room],c=centre(g),p=g.player,ux=p.x+p.w/2,C=CHANNELS;a.tvs=a.tvs||[];
 const alive=a.tvs.filter(t=>!['broken','wreck'].includes(t.state)).length,n=Math.min(C.count,C.max-alive);
 for(let i=0;i<n;i++)for(let k=0;k<30;k++){
  const x=r.x+C.wall+Math.random()*(r.end-r.x-2*C.wall);
  if(Math.abs(x-c)<C.body||Math.abs(x-ux)<C.uma||a.tvs.some(t=>t.state!=='wreck'&&Math.abs(t.x-x)<C.apart))continue;
  a.tvs.push({x,dir:x<c?-1:1,state:'drop',t:0,y:-80,wait:between(C.first)+i*.5});break;}
}
function stepChannels(g,dt){const ch=g.boss.network.col.channels;ch.timer-=dt;if(ch.timer<=0){g.boss.network.col.channels=null;idle(g.boss.network.col);}}
// The televisions live on their own, whatever attack the colossus is busy with.
function stepTvs(g,dt,paw){
 const a=g.boss.network.col,p=g.player,C=CHANNELS;if(!a.tvs?.length)return;
 for(const t of a.tvs){t.t+=dt;if(t.dust>0)t.dust-=dt;
  if(t.state==='drop'){const k=Math.min(1,t.t/C.drop);t.y=-80+(FLOOR+80)*k*k;if(k>=1){t.state='off';t.t=0;t.dust=.4;g.emit('boltImpact',{x:t.x,y:FLOOR,kind:'crash'});}continue;}
  if(t.state==='off'&&t.t>=t.wait){t.state='on';t.t=0;g.emit('infoshumWarning',{attack:'channel',x:t.x,y:FLOOR-40});}
  else if(t.state==='on'&&t.t>=C.warm){t.state='heat';t.t=0;}
  else if(t.state==='heat'&&t.t>=C.heat){t.state='fire';t.t=0;t.hit=false;g.emit('bossCast',{boss:'infoshum',ability:'channel',x:t.x,y:FLOOR-20});}
  else if(t.state==='fire'){if(!t.hit&&hurtable(p)&&overlap(p,tvBeam(g,t))){g.hurt(false,t.x);t.hit=true;}if(t.t>=C.fire){t.state='off';t.t=0;t.wait=between(C.every);}}
  else if(t.state==='broken'&&t.t>=C.wreck){t.state='wreck';t.t=0;}
  if(['off','on','heat','fire'].includes(t.state)&&paw&&p.attack>0&&overlap(paw,tvBox(t))){t.state='broken';t.t=0;g.emit('enemyHit',{x:t.x,y:FLOOR-40,enemyType:'channel'});}}
 a.tvs=a.tvs.filter(t=>!(t.state==='wreck'&&t.t>=.4));
}
function stepFist(g,dt){
 const b=g.boss,a=b.network.col,f=a.fist,p=g.player,px=p.x+p.w/2;f.timer-=dt;f.age+=dt;
 if(f.state==='aim'){if(f.timer<=0){f.state='lock';f.timer=COL.lock;}}
 else if(f.state==='lock'){if(f.timer<=0){f.state='fall';f.timer=COL.fall;}}
 else if(f.state==='fall'){f.y=-240*Math.max(0,f.timer)/COL.fall;if(f.timer<=0){
  f.y=0;f.state='stuck';f.timer=COL.stuck[roundOf(a)];f.weak=a.hands[f.side];a.dust={x:f.x,time:0};a.flash=.12;
  if(hurtable(p)&&Math.abs(px-f.x)<COL.fistHalf+p.w/2-8&&p.y+p.h>FLOOR-170)g.hurt(false,f.x);
  a.shocks.push({x:f.x-44,dir:-1,travel:0},{x:f.x+44,dir:1,travel:0});
  g.emit('boltImpact',{x:f.x,y:FLOOR,kind:'fist'});g.emit('bossCast',{boss:'infoshum',ability:'slam',x:f.x,y:FLOOR});if(f.weak)g.emit('infoshumWeak',{x:f.x,y:FLOOR-40});}}
 else if(f.state==='stuck'||f.state==='broken'){b.state='recover';if(f.timer<=0){f.state='lift';f.timer=COL.lift;}}
 else if(f.state==='lift'){f.y=-260*(1-Math.max(0,f.timer)/COL.lift);if(f.timer<=0){a.fist=null;if(!a.hands.L&&!a.hands.R)collapse(g);else idle(a);}}
}
function stepSweep(g,dt){
 const a=g.boss.network.col,s=a.sweep,p=g.player;s.timer-=dt;
 if(s.state==='warn'){if(s.timer<=0){s.state='go';g.emit('bossCast',{boss:'infoshum',ability:'sweep',x:s.x,y:FLOOR-40});}return;}
 const v=COL.sweepSpeed*dt;s.x+=s.dir*v;s.travel+=v;if(p.inv<=0&&p.dash===0&&overlap(p,sweepBox(s)))g.hurt(false,s.x);
 if(s.travel>=COL.sweepSpan){a.sweep=null;idle(a);}
}
function stepBeam(g,dt){
 const a=g.boss.network.col,m=a.beam,p=g.player,px=p.x+p.w/2;m.timer-=dt;
 if(m.state==='charge'){if(m.timer>.3)m.x=px;if(m.timer<=0){m.state='fire';m.timer=COL.beamTime;a.head=1;a.headTime=COL.beamTime;a.flash=.2;g.emit('bossCast',{boss:'infoshum',ability:'giantBeam',x:m.x,y:FLOOR});}return;}
 m.x+=clamp(px-m.x,-COL.beamSpeed*dt,COL.beamSpeed*dt);
 if(p.inv<=0&&p.dash===0&&Math.abs(px-m.x)<COL.beamHalf+p.w/2-6&&p.y+p.h>FLOOR-120)g.hurt(false,m.x);
 if(m.timer<=0){a.beam=null;a.head=0;idle(a);}
}
function stepColossus(g,dt,paw=null){
 const b=g.boss,n=b.network,a=n.col,p=g.player;a.clock=(a.clock||0)+dt;if(a.hurt>0)a.hurt-=dt;if(a.roar>0)a.roar-=dt;
 stepEmo(a,dt);if(a.mode!=='idle'||a.hurt>0||a.fist||a.sweep||a.beam||a.channels)a.emo=null;
 if(a.mode==='idle'&&!(a.fist||a.sweep||a.beam||a.channels)){a.moodT=(a.moodT??1.2)-dt;if(a.moodT<=0){if(Math.random()<.3)a.roar=.7;else emote(a,undefined,1+Math.random()*.6);a.moodT=2+Math.random()*1.6;}}
 a.flash=Math.max(0,a.flash-dt);a.headTime=Math.max(0,a.headTime-dt);if(a.headTime<=0&&a.mode!=='collapse')a.head=0;
 if(a.dust){a.dust.time+=dt;if(a.dust.time>.45)a.dust=null;}
 b.x=centre(g)-b.w/2;b.y=120;
 for(const s of a.shocks){const v=COL.shockSpeed*dt;s.x+=s.dir*v;s.travel+=v;if(p.inv<=0&&p.dash===0&&overlap(p,{x:s.x-16,y:FLOOR-26,w:32,h:26}))g.hurt(false,s.x);}
 a.shocks=a.shocks.filter(s=>s.travel<COL.shockRange);stepTvs(g,dt,paw);
 a.timer-=dt;
 if(a.mode==='intro'){b.state='phaseChange';if(a.timer<=0)idle(a);return;}
 if(a.mode==='collapse'){b.state='recover';if(a.timer<=0)rise(a);return;}
 if(a.mode==='rise'){b.state='windup';if(a.timer<=0)idle(a);return;}
 b.state='windup';
 if(a.fist)stepFist(g,dt);else if(a.sweep)stepSweep(g,dt);else if(a.beam)stepBeam(g,dt);else if(a.channels)stepChannels(g,dt);
 else if(a.mode==='idle'&&a.timer<=0)nextAttack(g);
}
function strikeColossus(g,paw){
 const b=g.boss,n=b.network,a=n.col,p=g.player,f=a.fist;if(a.lastSwing===p.swing)return false;
 if(f&&f.state==='stuck'&&f.weak&&overlap(paw,fistBox(f))){
  a.lastSwing=p.swing;a.hands[f.side]=false;a.hurtSide=f.side;f.weak=false;f.state='broken';f.timer=.5;a.hurt=1.1;b.hurtTime=.35;a.head=3;a.headTime=.7;a.flash=.2;
  g.emit('bossHit',{boss:'infoshum',x:f.x,y:FLOOR-40});g.emit('infoshumHandBroken',{side:f.side,x:f.x,y:FLOOR-40});return true;}
 if(a.mode==='collapse'&&a.clock>COL.fallTime&&overlap(paw,headBox(g))){
  a.lastSwing=p.swing;const h=headBox(g);b.hp=Math.max(PHASE_HP,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;a.round++;
  g.emit('bossHit',{boss:'infoshum',x:h.x+h.w/2,y:h.y+h.h/2});g.emit('infoshumCoreHit',{x:h.x+h.w/2,y:h.y+h.h/2});
  if(b.hp<=PHASE_HP)beginBreakout(g);else rise(a);return true;}
 return false;
}
// ——— The breakout: he bursts out of the head screen ———
function beginBreakout(g){
 const b=g.boss,n=b.network,a=n.col;
 n.stage='breakout';n.mode='breakout';n.timer=BREAKOUT;n.transitionProgress=0;a.mode='collapse';a.fist=null;a.sweep=null;a.beam=null;a.shocks=[];clearAttacks(g);a.tvs=[];g.bolts=[];
 b.phase=3;b.phaseName='На свободе';b.state='phaseChange';b.hp=PHASE_HP;g.player.inv=Math.max(g.player.inv,BREAKOUT+1);
 const h=headBox(g);g.emit('bossPhase',{boss:'infoshum',phase:3,name:'На свободе'});g.emit('infoshumRupture',{x:h.x+h.w/2,y:h.y});
}
// ——— Phase 3 «На свободе» ———
function beginFree(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 reshape(g,STORM_ISLANDS,'storm');landSafely(g,2,100);portalOut(g);n.noise=0;n.noiseTime=0;
 n.stage='free';n.free={mode:'enter',timer:FREE.enter,x:r.x+768,y:210,gy:FLOOR,hits:0,step:0,count:0,sub:0,tentacles:[],shards:[],yuri:false,flash:0,dir:1,rammed:false,lastSwing:-1};
 b.state='phaseChange';g.bolts=[];g.emit('infoshumFreed',{x:r.x+768,y:150});
}
function targetSurface(g){
 const p=g.player;
 const support=g.platforms.find(s=>s.id===p.supportId&&!s.bossHidden&&s.room===g.room);
 const surfaces=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&p.x+p.w>s.x&&p.x<s.x+s.w);
 const below=surfaces.filter(s=>s.y>=p.y+p.h-6).sort((a,b)=>a.y-b.y)[0];
 const s=support||below||surfaces.sort((a,b)=>Math.abs(a.y-p.y-p.h)-Math.abs(b.y-p.y-p.h))[0]||g.platforms.find(s=>s.room===g.room&&!s.bossHidden);
 return {x:clamp(p.x+p.w/2,s.x+32,s.x+s.w-32),y:s.y,platformId:s.id,left:s.x,right:s.x+s.w};
}
const r0=g=>rooms[g.room].x;
export function ramBox(f){return {x:f.x-46,y:f.y-34,w:92,h:68};}
export function freeCoreBox(f){return {x:f.x-42,y:f.gy-64,w:84,h:64};}
function hover(f,gap){f.mode='hover';f.timer=gap;}
function nextFree(g){
 const b=g.boss,f=b.network.free,p=g.player,r=rooms[g.room],px=p.x+p.w/2,py=p.y+p.h/2,kind=FREE.plan[f.step++%FREE.plan.length];
 if(kind==='tentacle'){f.mode='tentacle';f.count=2+Math.min(2,f.hits);f.sub=0;}
 else if(kind==='volley'){const side=px-r.x<768?1:-1;f.mode='volley';f.timer=FREE.volleyMove;f.count=3;f.sub=0;f.from={x:f.x,y:f.y};f.tx=clamp(px+side*340,r.x+60,r.end-60);f.ty=clamp(py-6,70,440);f.dir=-side;}
 else{const s=targetSurface(g);f.mode='ghostPrep';f.timer=ghostPrep();f.from={x:f.x,y:f.y};f.tx=clamp(px,r.x+120,r.end-120);f.ty=40;f.gy=s.y;f.rammed=false;f.seq=0;f.phase=null;
  f.ghosts=[-1,1].map(side=>({side,x0:clamp(f.tx+side*FREE.ghostSpread,r.x+30,r.end-30),y0:60,x1:0,y1:0,state:'wait',k:0}));
  f.dive={x:f.tx,y0:40,y1:s.y-34};g.emit('infoshumWarning',{attack:'ghosts',x:px,y:s.y});}
}
// Aim the next attacker (0, 1 — the copies; 2 — Infoshum himself) at where Uma is now.
function aimGhost(g,f){
 const p=g.player,px=p.x+p.w/2,s=targetSurface(g),feet=s.y-20;f.phase='aim';f.timer=FREE.ghostAim;
 if(f.seq<2){const gh=f.ghosts[f.seq],dx=px-gh.x0,dy=feet-gh.y0,len=Math.hypot(dx,dy)||1;gh.state='aim';gh.x1=px+dx/len*FREE.ghostOver;gh.y1=feet+dy/len*FREE.ghostOver;}
 else{f.gy=s.y;f.dive={x:clamp(px,rooms[g.room].x+60,rooms[g.room].end-60),y0:f.y,y1:s.y-34};}
 g.emit('infoshumWarning',{attack:'ghostDive',x:px,y:feet});
}
function stepFree(g,dt,paw=null){
 const b=g.boss,n=b.network,f=n.free,p=g.player,px=p.x+p.w/2,py=p.y+p.h/2,gap=FREE.gap[Math.min(2,f.hits)];
 f.flash=Math.max(0,f.flash-dt);
 // «Помехи»: free, Infoshum floods the broadcast with static; full noise costs a life. Each blow clears some.
 if(f.mode!=='enter'&&!f.yuri&&!n.portal){const dur=noiseDuration(g);n.noiseTime+=dt;n.noise=Math.min(1,n.noiseTime/dur);
  if(n.noise>=1){g.emit('interferenceLost');n.noiseTime=dur*(g.testingInvulnerable?.82:.5);n.noise=n.noiseTime/dur;g.loseLife('interference');return;}}
 for(const t of f.tentacles){t.time+=dt;if(t.state==='warn'&&t.time>=FREE.tentWarn){t.state='up';t.time=0;g.emit('boltImpact',{x:t.x,y:t.y,kind:'tentacle'});}
  if(t.state==='up'&&t.time<.3&&p.inv<=0&&p.dash===0&&Math.abs(px-t.x)<FREE.tentHalf+p.w/2-8&&p.y+p.h>t.y-90&&p.y<t.y+6)g.hurt(false,t.x);}
 f.tentacles=f.tentacles.filter(t=>!(t.state==='up'&&t.time>FREE.tentUp));
 for(const s of f.shards){s.x+=s.vx*dt;s.life-=dt;const box={x:s.x-22,y:s.y-9,w:44,h:18};
  // A swat sends the shard back; a returned shard never hurts Uma and bursts on Infoshum.
  if(!s.back&&paw&&p.attack>0&&overlap(paw,box)){s.back=true;s.vx=-s.vx*FREE.reflect;s.life=Math.max(s.life,1.6);g.emit('enemyHit',{x:s.x,y:s.y,enemyType:'shard'});continue;}
  if(s.back){if(Math.abs(s.x-f.x)<56&&Math.abs(s.y-f.y)<56){s.life=0;f.flash=.18;n.noiseTime=Math.max(0,n.noiseTime-noiseDuration(g)*NOISE_CLEAR*.5);n.noise=n.noiseTime/noiseDuration(g);g.emit('boltImpact',{x:s.x,y:s.y,kind:'reflect'});}continue;}
  if(p.inv<=0&&p.dash===0&&overlap(p,box))g.hurt(false,s.x);}
 f.shards=f.shards.filter(s=>s.life>0);
 f.timer-=dt;const follow=()=>{f.x+=clamp(px-f.x,-140*dt,140*dt);f.y+=(FREE.hoverY+Math.sin(g.time*2)*8-f.y)*Math.min(1,dt*3);};
 const glide=total=>{const k=1-Math.max(0,f.timer)/total,e=k*k*(3-2*k);f.x=f.from.x+(f.tx-f.from.x)*e;f.y=f.from.y+(f.ty-f.from.y)*e;};
 if(f.mode==='enter'){b.state='phaseChange';f.y+=(FREE.hoverY-f.y)*Math.min(1,dt*2);if(f.timer<=0)hover(f,gap);}
 else if(f.mode==='hover'||f.mode==='hit'||f.mode==='bounce'){b.state='windup';follow();if(f.timer<=0){if(f.mode==='hover')nextFree(g);else hover(f,gap);}}
 else if(f.mode==='tentacle'){b.state='casting';follow();f.sub-=dt;
  if(f.sub<=0&&f.count>0){const s=targetSurface(g);f.tentacles.push({x:s.x,y:s.y,state:'warn',time:0});f.count--;f.sub=FREE.tentGap;g.emit('infoshumWarning',{attack:'tentacle',x:s.x,y:s.y});}
  if(f.count===0&&!f.tentacles.length)hover(f,gap);}
 else if(f.mode==='volley'){b.state='casting';
  if(f.timer>0)glide(FREE.volleyMove);else{f.x=f.tx;f.sub-=dt;f.y+=(clamp(py-6,70,440)-f.y)*Math.min(1,dt*4);
   if(f.sub<=0&&f.count>0){f.shards.push({x:f.x+f.dir*40,y:f.y,vx:f.dir*FREE.shardSpeed,life:2.4});f.count--;f.sub=FREE.volleyGap;g.emit('bossCast',{boss:'infoshum',ability:'shards',x:f.x,y:f.y});}
   if(f.count===0&&f.sub<=-.3)hover(f,gap);}}
 else if(f.mode==='ghostPrep'){b.state='windup';const rise=f.timer-FREE.ghostSplit;if(rise>0){const k=1-rise/FREE.ghostRise,e=k*k*(3-2*k);f.x=f.from.x+(f.tx-f.from.x)*e;f.y=f.from.y+(f.ty-f.from.y)*e;}else{f.x=f.tx;f.y=f.ty;}
  if(f.timer<=0){f.x=f.tx;f.y=f.ty;f.mode='ghostDash';aimGhost(g,f);g.emit('bossCast',{boss:'infoshum',ability:'ghosts',x:f.x,y:f.y});}}
 else if(f.mode==='ghostDash'){b.state='casting';const k=1-Math.max(0,f.timer)/FREE.ghostDash,hit=box=>{if(!f.rammed&&p.inv<=0&&p.dash===0&&overlap(p,box)){g.hurt(false,box.x+box.w/2);f.rammed=true;}};
  if(f.seq===2&&f.phase==='aim')f.x+=clamp(f.dive.x-f.x,-420*dt,420*dt);
  if(f.phase==='aim'){if(f.timer<=0){f.phase='dive';f.timer=FREE.ghostDash;f.rammed=false;if(f.seq<2)f.ghosts[f.seq].state='dive';else{f.x=f.dive.x;f.dive.y0=f.y;}}}
  else if(f.seq<2){const gh=f.ghosts[f.seq];gh.k=k*k;hit(ghostBox(ghostPos(gh,gh.k)));if(f.timer<=0){gh.state='gone';f.seq++;aimGhost(g,f);}}
  else{const e=k*k;f.y=f.dive.y0+(f.dive.y1-f.dive.y0)*e;hit(ramBox(f));
   // He lands where she stood; Yuri lassoes him right there.
   if(f.timer<=0){f.y=f.dive.y1;f.flash=.15;g.emit('boltImpact',{x:f.x,y:f.gy,kind:'crash'});f.from={x:f.x,y:f.y};f.tx=f.x;f.ty=f.gy-34;f.mode='pulled';f.timer=FREE.pull;f.yuri=true;g.emit('yuriHold',{x:f.tx,y:f.gy-40,last:b.hp<=HIT_DAMAGE});}}}
 else if(f.mode==='pulled'){b.state='recover';glide(FREE.pull);if(f.timer<=0){f.x=f.tx;f.ghosts=null;f.mode='dizzy';f.timer=FREE.dizzyYuri;g.emit('infoshumWeak',{x:f.x,y:f.gy-40});}}
 else if(f.mode==='ramPrep'){b.state='windup';glide(FREE.ramPrep);if(f.timer<=0){f.x=f.tx;f.y=f.ty;f.mode='ram';g.emit('bossCast',{boss:'infoshum',ability:'ram',x:f.x,y:f.y});}}
 else if(f.mode==='ram'){b.state='casting';f.x+=f.dir*FREE.ramSpeed*dt;
  if(!f.rammed&&p.inv<=0&&p.dash===0&&overlap(p,ramBox(f))){g.hurt(false,f.x);f.rammed=true;}
  if(f.dir>0?f.x>=f.ex:f.x<=f.ex){f.x=f.ex;if(f.rammed){f.mode='bounce';f.timer=FREE.bounce;}else{f.mode='crash';f.timer=FREE.crash;f.flash=.15;g.emit('boltImpact',{x:f.x,y:f.gy,kind:'crash'});}}}
 else if(f.mode==='crash'){b.state='recover';f.y=f.gy-34;if(f.timer<=0){f.mode='dizzy';f.yuri=b.hp<=HIT_DAMAGE;f.timer=f.yuri?FREE.dizzyYuri:FREE.dizzy;g.emit('infoshumWeak',{x:f.x,y:f.gy-40});if(f.yuri)g.emit('yuriHold',{x:f.x,y:f.gy-40,last:true});}}
 else if(f.mode==='dizzy'){b.state='recover';f.y=f.gy-34;if(f.timer<=0){f.yuri=false;hover(f,gap);}}
 b.x=f.x-b.w/2;b.y=f.y-b.h/2;
}
function strikeCore(g,paw){
 const b=g.boss,n=b.network,f=n.free,p=g.player;if(f.mode!=='dizzy'||f.lastSwing===p.swing||!overlap(paw,freeCoreBox(f)))return false;
 f.lastSwing=p.swing;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;f.hits++;f.yuri=false;n.noiseTime=Math.max(0,n.noiseTime-noiseDuration(g)*NOISE_CLEAR);n.noise=n.noiseTime/noiseDuration(g);
 g.emit('bossHit',{boss:'infoshum',x:f.x,y:f.gy-34});g.emit('infoshumCoreHit',{x:f.x,y:f.gy-34});
 if(b.hp===0){b.x=f.x-b.w/2;b.y=f.gy-b.h+10;f.tentacles=[];f.shards=[];g.bossDefeated();return true;}
 f.mode='hit';f.timer=FREE.hit;f.flash=.2;return true;
}
export function corePoint(b){return {x:b.x+b.w/2,y:b.y+b.h/2+8};}
export function coreBox(b){const c=corePoint(b);return {x:c.x-34,y:c.y-34,w:68,h:68};}
export function headlineBoxes(){return [];}
// A fall between the storm islands returns Uma to the last island she stood on (and costs a heart).
export function infoshumFall(g){const n=g.boss?.network;if(g.room!==STAGE_ROOM||n?.stage!=='free')return false;return pitFall(g,STAGE_ROOM,s=>!s.bossHidden);}
// ——— The portal between phases (drawn from assets/infoshum-portal.png) ———
// Near the end of each transition a portal opens behind Uma and pulls her in; the next phase begins with her
// tumbling out of a closing portal. Positions are driven here so physics cannot fight the pull.
export const PORTAL={pull:.62,out:.9};
function portalIn(g,k){
 const n=g.boss.network,p=g.player;if(k<PORTAL.pull)return;
 if(!n.portal||n.portal.mode!=='in'){n.portal={mode:'in',x:p.x+p.w/2,y:p.y+p.h/2-8,fx:p.x,fy:p.y,q:0};g.emit('infoshumPortal',{x:p.x+p.w/2,y:p.y});}
 const o=n.portal,q=(k-PORTAL.pull)/(1-PORTAL.pull),e=Math.min(1,Math.max(0,(q-.2)/.55))**2;o.q=q;
 Object.assign(p,{vx:0,vy:0,attack:0,dash:0,x:o.fx+(o.x-p.w/2-o.fx)*e,y:o.fy+(o.y-p.h/2-o.fy)*e});p.warpScale=Math.max(0,1-e);
}
function portalOut(g){const p=g.player;g.boss.network.portal={mode:'out',x:p.x+p.w/2,y:p.y+p.h/2-8,t:0};p.warpScale=0;}
function stepPortalOut(g,dt){const n=g.boss.network,o=n.portal,p=g.player;if(o?.mode!=='out')return;o.t+=dt;o.x=p.x+p.w/2;o.y=p.y+p.h/2-8;p.warpScale=Math.min(1,o.t/.55);if(o.t>=PORTAL.out){n.portal=null;delete p.warpScale;}}
export function stepInfoshum(g,dt,paw=null){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 if(n.stage==='network'){if(g.player.warpScale!==undefined&&!g.arenaEntry)delete g.player.warpScale;stepScreens(g,dt);return;}
 if(n.stage==='assemble'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/ASSEMBLE;portalIn(g,n.transitionProgress);if(n.timer===0)beginColossus(g);return;}
 if(n.stage==='colossus'){stepPortalOut(g,dt);stepColossus(g,dt,paw);return;}
 if(n.stage==='breakout'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/BREAKOUT;n.col.flash=Math.max(0,n.col.flash-dt);portalIn(g,n.transitionProgress);if(n.timer===0)beginFree(g);return;}
 if(n.stage==='free'){stepPortalOut(g,dt);stepFree(g,dt,paw);}
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;if(!b.active||!n||p.attack<=0||b.hp<=0||g.mode!=='playing')return false;
 if(n.stage==='network')return strikeScreens(g,paw);
 if(n.stage==='colossus')return strikeColossus(g,paw);
 if(n.stage==='free')return strikeCore(g,paw);
 return false;
}
export function infoshumTargets(g){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return [];
 if(n.stage==='network'){if(n.shield)return n.relays.filter(r=>r.state==='open').map(r=>({id:'relay'+r.index,...relayHit(g,r.index)}));return n.take?.show==='face'?[{id:'screen',...towerScreen(g)}]:[];}
 if(n.stage==='colossus'){const a=n.col;if(a.fist?.state==='stuck'&&a.fist.weak)return [{id:'fist',...fistBox(a.fist)}];if(a.mode==='collapse'&&a.clock>COL.fallTime)return [{id:'head',...headBox(g)}];}
 if(n.stage==='free'&&n.free?.mode==='dizzy')return [{id:'core',...freeCoreBox(n.free)}];
 return [];
}
// ——— Test and debugging helpers ———
const paws=g=>{const p=g.player;p.attack=.18;p.swing++;};
export function exposeInfoshum(g){const b=g.boss,n=b.network,p=g.player;b.cooldown=0;
 if(n.stage==='network'){buildWall(g);if(n.mode==='opening'){setFace(n,'face');startRound(g);n.mode='rest';n.timer=9;}
  if(n.shield){const pair=ROUND_PAIRS[n.round];if(!n.relays.some(r=>r.state==='open')){const i=pair.find(i=>n.relays[i].state!=='dead');if(i===undefined){dropShield(g);}else{n.relays[i].state='open';n.yuriQueue=n.yuriQueue.filter(q=>q!==i);}}}
  if(!n.shield){n.take.show='face';n.take.timer=9;n.take.left=20;setFace(n,faceFor(n));}}
 else if(n.stage==='colossus'){const a=n.col;if(a.mode==='collapse'){a.clock=COL.fallTime+.1;return;}a.sweep=null;a.beam=null;a.shocks=[];if(!a.hands.L&&!a.hands.R){collapse(g);a.clock=COL.fallTime+.1;return;}
  const side=a.hands.R?'R':'L';a.mode='attack';a.fist={side,x:centre(g)+(side==='L'?-1:1)*COL.reach,y:0,state:'stuck',timer:COL.stuck[0],weak:true,lastSwing:-1,age:1};}
 else if(n.stage==='free'){const f=n.free,t=targetSurface(g);Object.assign(f,{mode:'dizzy',timer:FREE.dizzy,x:t.x,gy:t.y,y:t.y-34,yuri:b.hp<=HIT_DAMAGE});f.tentacles=[];f.shards=[];}
}
// One paw through the real mechanics: the open relay while the shield is up, the big screen while his face is on it.
export function crackInfoshumScreen(g){
 const b=g.boss,n=b.network;if(n.stage!=='network')return false;exposeInfoshum(g);const p=g.player;
 let box,s;if(n.shield){const r=n.relays.find(r=>r.state==='open');box=relayHit(g,r.index);s=surfaces(g).filter(q=>q.y>=box.y+box.h-4&&box.x+box.w/2>=q.x&&box.x+box.w/2<=q.x+q.w).sort((a,c)=>a.y-c.y)[0];}
 else{box=towerScreen(g);s=surfaces(g).find(q=>q.index===9);}
 Object.assign(p,{x:clamp(box.x+box.w/2-p.w-4,s.x,s.x+s.w-p.w),y:s.y-48,h:48,vy:0,vx:0,grounded:true,supportId:s.id,dir:1});
 paws(g);return strikeInfoshum(g,{x:p.x+16,y:p.y-2,w:54,h:p.h+6});
}
// Smash the whole wall (nine real screens, then the huge one) — the colossus starts assembling.
export function smashWall(g){const n=g.boss.network;let k=0;while(n.stage==='network'&&k++<60){crackInfoshumScreen(g);for(const r of n.relays)if(r.state==='hit')r.state='dead';}return n.stage;}
export function colossusInfoshum(g){const n=g.boss.network;if(n.stage==='network')smashWall(g);if(n.stage==='assemble'){n.timer=0;stepInfoshum(g,0);}if(n.stage==='colossus'&&n.col.mode==='intro')idle(n.col);return n.stage;}
// Break one hand: a stuck fist beside Uma, one paw on its knuckles.
export function breakHand(g){const n=g.boss.network;if(n.stage!=='colossus'||n.col.mode==='collapse')return false;exposeInfoshum(g);const a=n.col,f=a.fist;if(!f)return false;
 Object.assign(g.player,{x:f.x-70,y:FLOOR-48,h:48,vx:0,vy:0,grounded:true,dir:1});paws(g);const ok=strikeInfoshum(g,fistBox(f));a.fist=null;if(!a.hands.L&&!a.hands.R)collapse(g);else idle(a);return ok;}
// One whole round: both hands, the collapse, a paw on the head screen.
export function dropColossus(g){const n=g.boss.network;if(n.stage!=='colossus')return false;if(n.col.mode==='rise')idle(n.col);breakHand(g);breakHand(g);if(n.col.mode!=='collapse')return false;n.col.clock=COL.fallTime+.1;paws(g);return strikeInfoshum(g,headBox(g));}
// Drive the fight to the last phase.
export function freeInfoshum(g){const n=g.boss.network;colossusInfoshum(g);for(let k=0;k<3&&n.stage==='colossus';k++)dropColossus(g);if(n.stage==='breakout'){n.timer=0;stepInfoshum(g,0);}if(n.stage==='free'&&n.free.mode==='enter')hover(n.free,FREE.gap[0]);return n.stage;}
// The final blow through the real mechanics (he lies dizzy on Uma's island, one paw strike).
export function finishInfoshum(g){const b=g.boss,n=b.network;if(n.stage!=='free')freeInfoshum(g);b.hp=Math.min(b.hp,HIT_DAMAGE);exposeInfoshum(g);paws(g);return strikeInfoshum(g,freeCoreBox(n.free));}
