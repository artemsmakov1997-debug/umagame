import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {stepBoss} from '../boss.js';import {rooms} from '../level.js';
import {strikeInfoshum,exposeInfoshum,glassRect,coreBox,figureBox,corePoint,headlineBoxes,infoshumTargets,revealHint,noiseDuration,SHELL,CABLE,SPLIT,INFOSHUM_HP,STEP_SLOTS,NOISE_TIME} from '../infoshum-combat.js';
import {jumpTo} from './navigation.js';
function game(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.mode='playing';return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200){for(let i=0;i<max&&!cond();i++)g.step(1/60,{});return cond();}
function swing(g,box){const p=g.player;p.attack=.18;p.swing++;return strikeInfoshum(g,box);}
function place(g,id,dx=40){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0,climbing:false});g.updateCamera();return s;}
function crackReal(g){const n=g.boss.network;assert.ok(until(g,()=>n.mode==='reveal',900),'a reveal comes');const m=n.monitors.find(m=>m.face===0);assert.ok(swing(g,glassRect(m)));return m;}
function freed(testing=true){const g=game(testing),n=g.boss.network;for(let i=0;i<3;i++){crackReal(g);}assert.ok(until(g,()=>n.stage==='free',400));return g;}
test('«Напёрстки»: one real pulse and its decoys travel the cables; the reveal shows the real face only where the real pulse arrived',()=>{
 const g=game(),n=g.boss.network;assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(until(g,()=>n.mode==='shuffle'));
 let arrivals=[];for(let i=0;i<900&&n.mode!=='reveal';i++){g.step(1/60,{});for(const e of g.events)if(e.type==='infoshumArrive')arrivals.push(e.index);g.events=[];}
 assert.equal(arrivals.length,SHELL.moves[0]);assert.equal(n.monitors.find(m=>m.face===0).index,arrivals.at(-1));
 assert.deepEqual(n.monitors.map(m=>m.face).sort(),n.monitors.map(m=>m.face).sort());assert.equal(new Set(n.monitors.map(m=>m.face)).size,3,'two different fakes');assert.ok(n.monitors.every(m=>m.face!==null));
 // Round 3 adds two decoy pulses.
 n.round=2;n.mode='hit';n.timer=0;assert.ok(until(g,()=>n.mode==='shuffle'&&n.transit));assert.equal(n.decoys.length,SHELL.decoys[2]);assert.ok(n.decoys.every(d=>!(d.from===n.transit.from&&d.to===n.transit.to)));
});
test('a jump strike on the real glass cracks it; a fake bursts into a Помеха and does not hurt him',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.mode==='reveal',900));const fake=n.monitors.find(m=>m.face>0);assert.ok(swing(g,glassRect(fake)));
 assert.equal(g.boss.hp,INFOSHUM_HP);assert.equal(fake.face,null);assert.ok(fake.burst>0);assert.equal(g.enemies.filter(e=>e.type==='static').length,1);
 const real=n.monitors.find(m=>m.face===0);assert.ok(swing(g,glassRect(real)));assert.equal(g.boss.hp,INFOSHUM_HP-2);assert.equal(real.cracks,1);assert.equal(n.mode,'hit');
 assert.equal(swing(g,glassRect(real)),false,'no second hit in the same reveal');
});
test('the real glass is reached with an ordinary jump strike from the platform under each monitor',()=>{
 for(const [index,id] of[[0,'8:6'],[1,'8:7'],[2,'8:8']]){const g=game(),n=g.boss.network,m=n.monitors[index];n.activeIndex=index;exposeInfoshum(g);const s=place(g,id,Math.max(0,m.x+m.w/2-17-g.platforms.find(s=>s.id===id).x));
  g.step(1/60,{jump:true});let hit=false;for(let i=0;i<40&&!hit;i++){const p=g.player;if(p.vy>-80){p.dir=1;g.step(1/60,{attack:true});hit=m.cracks>0;break;}g.step(1/60,{jump:true});}
  for(let i=0;i<20&&!hit;i++){g.step(1/60,{});hit=m.cracks>0;}assert.ok(hit,'monitor '+index);}
});
test('a missed window hides the faces and shuffles again; every packet in the reveal is aimed at Uma',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.mode==='reveal',900));let packets=0;for(let i=0;i<60*SHELL.window[0]+10;i++){g.step(1/60,{});packets+=g.events.filter(e=>e.type==='bossCast'&&e.ability==='packet').length;g.events=[];}
 assert.ok(packets>=3);assert.equal(n.mode,'static');assert.ok(n.monitors.every(m=>m.face===null));assert.ok(until(g,()=>n.mode==='shuffle',120));
});
test('each first-source from the Dimension lights the real screen longer at the reveal',()=>{const g=game();assert.equal(revealHint(g),0);g.originals=[{taken:true},{taken:true}];assert.ok(Math.abs(revealHint(g)-1.6)<1e-9);});
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
test('the headline ring hurts on contact; its gap lets Uma through',()=>{
 const g=freed(false),b=g.boss,n=b.network;n.mode='anchored';n.timer=9;const h=headlineBoxes(n,b)[0];Object.assign(g.player,{x:h.x+3,y:h.y-10,inv:0,dash:0,grounded:false});const hp=g.health;stepBoss(g,1/60);assert.equal(g.health,hp-1);
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
test('pause freezes every phase; retry rebuilds the monitor platforms and starts a fresh shell game',()=>{
 const g=freed(),n=g.boss.network;g.mode='paused';const before=JSON.stringify(n);tick(g,90);assert.equal(JSON.stringify(n),before);g.mode='playing';
 g.retryLocation();assert.equal(g.boss.network.stage,'network');assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.platforms.filter(s=>s.room===8).every(s=>!s.bossHidden));assert.ok(g.platforms.some(s=>s.id==='8:7'&&s.y===280));
});
