import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {stepBoss} from '../boss.js';import {rooms} from '../level.js';
import {strikeInfoshum,exposeInfoshum,glassRect,monitorPad,CHASE,MONITOR_PATHS,coreBox,figureBox,corePoint,headlineBoxes,infoshumTargets,revealHint,noiseDuration,SHELL,CABLE,SPLIT,INFOSHUM_HP,STEP_SLOTS,NOISE_TIME} from '../infoshum-combat.js';
import {jumpTo} from './navigation.js';
function game(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.mode='playing';return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200){for(let i=0;i<max&&!cond();i++)g.step(1/60,{});return cond();}
function swing(g,box){const p=g.player;p.attack=.18;p.swing++;return strikeInfoshum(g,box);}
function place(g,id,dx=40){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0,climbing:false});g.updateCamera();return s;}
// Drop Uma onto the monitor he is showing himself in (the crack is made from above).
function dropOn(g,i){const pad=monitorPad(g,i);Object.assign(g.player,{x:pad.x+pad.w/2-17,y:pad.y-48-24,h:48,vx:0,vy:60,grounded:false,supportId:null,climbing:false});}
function crackReal(g){const n=g.boss.network;assert.ok(until(g,()=>n.mode==='hold',900),'he shows himself');const m=n.monitors[n.activeIndex],round=n.round;dropOn(g,m.index);assert.ok(until(g,()=>n.round>round,60),'landing on his monitor cracks it');return m;}
function freed(testing=true){const g=game(testing),n=g.boss.network;for(let i=0;i<3;i++){crackReal(g);}assert.ok(until(g,()=>n.stage==='free',400));return g;}
test('«Погоня по мониторам»: three monitors hover on their own paths; he shows himself in one, fires, then jumps along a cable to another',()=>{
 const g=game(),n=g.boss.network;assert.equal(g.boss.hp,INFOSHUM_HP);tick(g,2);
 const pads=[0,1,2].map(i=>monitorPad(g,i));assert.ok(pads.every(Boolean));const y0=pads.map(s=>[s.x,s.y]);tick(g,60);assert.ok(pads.some((s,i)=>Math.abs(s.x-y0[i][0])+Math.abs(s.y-y0[i][1])>5),'the monitors move');
 for(const m of n.monitors){const s=monitorPad(g,m.index);assert.ok(Math.abs(m.x+m.w/2-(s.x+s.w/2))<1,'each monitor rides its pad');}
 assert.ok(until(g,()=>n.mode==='hold',300));assert.equal(n.monitors.filter(m=>m.face===0).length,1);assert.ok(n.monitors.filter(m=>m.face===null).length===2);
 let packets=0,rain=0;const from=n.activeIndex;for(let i=0;i<60*4&&n.mode==='hold';i++){g.step(1/60,{});packets+=g.events.filter(e=>e.type==='bossCast'&&e.ability==='packet').length;rain+=g.events.filter(e=>e.type==='bossCast'&&e.ability==='rain').length;g.events=[];}
 assert.ok(packets>=2,'packets');assert.equal(rain,1,'one data rain per stay');assert.equal(n.mode,'hop');assert.notEqual(n.transit.to,from);
 assert.ok(until(g,()=>n.mode==='hold',90));assert.equal(n.monitors[n.activeIndex].face,0);
});
test('landing on top of his monitor cracks it, bounces Uma up and he flees; a paw on the glass or landing on an empty monitor does nothing',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.mode==='hold',300));const other=n.monitors.find(m=>m.index!==n.activeIndex);
 assert.equal(swing(g,glassRect(n.monitors[n.activeIndex])),false);dropOn(g,other.index);tick(g,20);assert.equal(g.boss.hp,INFOSHUM_HP,'an empty monitor is just a platform');
 const m=crackReal(g);assert.equal(g.boss.hp,INFOSHUM_HP-2);assert.equal(m.cracks,1);assert.equal(n.mode,'hit');assert.ok(g.player.vy<0,'bounced');
 assert.ok(until(g,()=>n.mode==='hop',60));assert.notEqual(n.transit.to,m.index,'he flees to another monitor');
});
test('every monitor\'s top is reached with an ordinary jump from the stage below',()=>{
 for(const [index,id] of[[0,'8:1'],[1,'8:9'],[2,'8:13']]){const g=game(),n=g.boss.network;tick(g,1);n.activeIndex=index;exposeInfoshum(g);place(g,id,20);
  let ok=false;for(let k=0;k<4&&!ok;k++){ok=jumpTo(g,8,200+index,500)&&g.player.supportId===monitorPad(g,index)?.id||n.monitors[index].cracks>0;if(!ok){n.mode='hold';n.timer=9;}}
  assert.ok(ok,'monitor '+index);}
});
test('if Uma does not reach him he jumps on; every packet is aimed at Uma; the stays shorten from round to round',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.mode==='hold',300));const t0=n.timer;assert.ok(until(g,()=>n.mode==='hop',60*5));
 const aims=g.bolts.filter(b=>b.kind==='packet');const p=g.player;assert.ok(aims.every(b=>Math.sign(b.vx)===Math.sign(p.x+p.w/2-b.x)||Math.abs(p.x-b.x)<40));
 assert.ok(CHASE.hold[2]<CHASE.hold[0]&&CHASE.hop[2]<CHASE.hop[0]);
});
test('each first-source from the Dimension keeps his face on the screen longer',()=>{const g=game(),n=g.boss.network;assert.equal(revealHint(g),0);g.originals=[{taken:true},{taken:true}];assert.ok(Math.abs(revealHint(g)-1.6)<1e-9);assert.ok(until(g,()=>n.mode==='hold',300));assert.ok(n.timer>CHASE.hold[0]+.7);});
test('the third crack tears the screen open and «Кабели» starts on the rebuilt arena',()=>{
 const g=game(),n=g.boss.network;for(let i=0;i<3;i++)crackReal(g);assert.equal(g.boss.hp,12);assert.ok(until(g,()=>n.stage==='rupture',90));assert.ok(until(g,()=>n.stage==='free',200));
 assert.equal(g.boss.phase,2);assert.ok(g.platforms.filter(s=>s.room===8&&STEP_SLOTS.includes(s.index)).every(s=>s.bossHidden));
});
test('«Кабели»: the slam is warned, lays a staircase from Uma’s platform to the core, and is pulled back after the window',()=>{
 const g=freed(false),n=g.boss.network;place(g,'8:2',100);g.player.inv=0;assert.ok(until(g,()=>n.mode==='aim',200));const t=n.target;assert.equal(t.platformId,'8:2');
 const h=g.health;assert.ok(until(g,()=>n.mode==='anchored',120));assert.equal(g.health,h-1,'standing under the slam hurts');
 const steps=g.platforms.filter(s=>s.room===8&&s.infoshumStep&&!s.bossHidden).sort((a,b)=>b.y-a.y);assert.ok(steps.length>=2);
 for(let i=1;i<steps.length;i++){assert.ok(steps[i-1].y-steps[i].y<=46,'climbable rise');assert.ok(Math.abs(steps[i].x-steps[i-1].x)-steps[i-1].w<=40,'small gaps');}
 assert.ok(Math.abs(steps.at(-1).y-(corePoint(g.boss).y+52))<2);
 assert.ok(until(g,()=>n.mode==='retract',60*(CABLE.anchored+CABLE.retractWarn)+5));assert.ok(steps.every(s=>s.bossHidden));
});
test('climbing the cable with real jumps reaches the core; the core only takes hits while the cable is anchored',()=>{
 const g=freed(),b=g.boss,n=b.network;place(g,'8:2',100);assert.ok(swing(g,coreBox(b))===false,'not exposed yet');
 assert.ok(until(g,()=>n.mode==='anchored',300));const steps=g.platforms.filter(s=>s.room===8&&s.infoshumStep&&!s.bossHidden).sort((a,b)=>b.y-a.y);
 for(const s of steps)assert.ok(jumpTo(g,8,s.index,240),'step '+s.index);
 const p=g.player,c=coreBox(b);p.dir=c.x+c.w/2>p.x+17?1:-1;p.cooldown=0;g.step(1/60,{attack:true});tick(g,3);
 assert.equal(b.hp,10,'a paw from the top step reaches the core');assert.equal(n.mode,'reel');
});
test('«Белый шум»: interference rises only in the last phase; three figures, only one real; doubles burst on landing, the real one sticks',()=>{
 const g=freed(),b=g.boss,n=b.network;assert.equal(n.noise,0);tick(g,120);assert.equal(n.noise,0,'no interference in the cable phase');
 for(let i=0;i<3;i++){exposeInfoshum(g);b.cooldown=0;assert.ok(swing(g,coreBox(b)));if(n.stage==='free')tick(g,60);}
 assert.equal(n.stage,'noise');assert.equal(b.phase,3);assert.equal(n.figures.length,3);assert.equal(n.figures.filter(f=>f.real).length,1);
 const stuck=[],bursts=[];for(let i=0;i<60*12&&!stuck.length;i++){g.step(1/60,{});for(const e of g.events){if(e.type==='infoshumStuck')stuck.push(e);if(e.type==='boltImpact'&&e.kind==='double')bursts.push(e);}g.events=[];}
 assert.equal(stuck.length,1);assert.ok(n.noise>0);assert.ok(infoshumTargets(g)[0].id==='figure');
});
test('a paw on a double pops it but feeds the noise; the stuck real one takes the hit; three hits end the fight into the finale',()=>{
 const g=freed(),b=g.boss,n=b.network;for(let i=0;i<3;i++){exposeInfoshum(g);b.cooldown=0;swing(g,coreBox(b));if(n.stage==='free')tick(g,60);}
 const double=n.figures.find(f=>!f.real),before=n.noiseTime;assert.ok(swing(g,figureBox(double)));assert.equal(double.state,'burst');assert.ok(n.noiseTime>before+NOISE_TIME*.07);
 for(let k=0;k<3;k++){until(g,()=>n.figures.some(f=>f.real),200);exposeInfoshum(g);assert.ok(swing(g,figureBox(n.figures.find(f=>f.real))),'hit '+k);if(k<2)tick(g,Math.round(60*SPLIT.reel)+2);}
 assert.equal(g.mode,'bossDefeat');g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'ending');
});
test('a dive is warned and can be dodged; standing in its landing spot hurts',()=>{
 for(const dodge of[false,true]){const g=freed(false),b=g.boss,n=b.network;for(let i=0;i<3;i++){exposeInfoshum(g);b.cooldown=0;swing(g,coreBox(b));if(n.stage==='free')tick(g,60);}
  place(g,'8:2',100);g.player.inv=0;assert.ok(until(g,()=>n.figures.some(f=>f.state==='warn'),240));const f=n.figures.find(f=>f.state==='warn');const h=g.health;
  for(let i=0;i<120&&!['stuck','burst'].includes(f.state);i++)g.step(1/60,dodge?{right:true}:{});assert.equal(g.health,dodge?h:h-1);}
});
test('100 percent interference costs one life; test protection buys time instead',()=>{
 for(const testing of[false,true]){const g=freed(testing),b=g.boss,n=b.network;for(let i=0;i<3;i++){exposeInfoshum(g);b.cooldown=0;swing(g,coreBox(b));if(n.stage==='free')tick(g,60);}
  const lives=g.lives;n.noiseTime=noiseDuration(g)-.001;stepBoss(g,1/60);if(testing){assert.equal(g.lives,lives);assert.ok(n.noise<.9);}else assert.equal(g.lives,lives-1);}
});
test('pause freezes every phase; retry rebuilds the stage and starts a fresh chase',()=>{
 const g=freed(),n=g.boss.network;g.mode='paused';const before=JSON.stringify(n);tick(g,90);assert.equal(JSON.stringify(n),before);g.mode='playing';
 g.retryLocation();assert.equal(g.boss.network.stage,'network');assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.platforms.filter(s=>s.room===8).every(s=>!s.bossHidden));assert.ok(g.platforms.some(s=>s.id==='8:7'&&s.y===280));
});
