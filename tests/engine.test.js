import {rooms as campaignRooms} from '../level.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,WORLD,HEIGHT,MAX_HEALTH,LAST_ROOM,FINAL_X,platforms,ladders,rooms} from '../engine.js';
import {enemy as makeEnemy,createEnemies} from '../level.js';
import {alertNearby,stepPortals} from '../enemies.js';
import {abilities,castAttack,stepBoss,damageBoss,stepProjectiles} from '../boss.js';
import {strikeInfoshum} from '../infoshum-combat.js';
import {monsters} from '../catalog.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const enemy=(type,room,x,index=0,extra={})=>makeEnemy(type,room,x,index,{active:true,noticed:true,...extra});
function stand(g,room=1,index=0,x=45){const s=platforms.find(p=>p.room===room&&p.index===index);Object.assign(g.player,{x:campaignRooms[room].x+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,sneaking:false,climbing:false,inv:0,attack:0,cooldown:0,knock:0,dash:0});g.room=room;g.checkpoint=room;g.updateCamera();}
function isolated(room=1,index=0,x=45){const g=new Game({story:false});g.start();g.abilities={attack:true,dash:true,sneak:true};g.tutorial.complete=true;g.enemies=[];g.fishes=[];g.soups=[];g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);stand(g,room,index,x);return g;}
function bossGame(){const g=isolated(LAST_ROOM,2,633);g.relays.forEach(r=>r.hp=0);g.boss.active=true;g.boss.state='recover';g.boss.timer=2;return g;}
function breakScreen(g,index){const m=g.boss.network.monitors[index],p=g.player;for(let hit=0;hit<2;hit++){if(hit)for(let i=0;i<370;i++)stepBoss(g,1/60);m.state='open';m.openTime=5;Object.assign(p,{x:m.terminalX-34,y:m.terminalY-46,dir:1,attack:.18,swing:p.swing+1});if(!strikeInfoshum(g,{x:p.x+16,y:p.y-2,w:54,h:p.h+6}))return false;}return true;}
test('catalogue has four equal groups of three regular enemies and one boss',()=>{
 assert.equal(monsters.length,16);for(let chapter=0;chapter<4;chapter++){const group=monsters.filter(m=>m.chapter===chapter);assert.equal(group.length,4);assert.equal(group.filter(m=>m.boss).length,1);}assert.deepEqual(new Set(createEnemies().map(e=>e.type)),new Set(monsters.filter(m=>!m.boss).map(m=>m.id)));for(const m of monsters){assert.ok(m.description.length>20);assert.equal(m.abilities.length,2);assert.ok(m.tip);}assert.throws(()=>enemy('infonoise',1,100));assert.throws(()=>enemy('headline',1,100));
});
test('training is physically separate, has no enemies, relays, soup or time pressure',()=>{
 const g=new Game({story:false});g.start();assert.equal(g.room,0);assert.equal(rooms[0].tutorial,true);assert.ok(g.enemies.every(e=>e.room>0&&!e.active));assert.ok(g.relays.every(r=>r.room>0));assert.ok(g.soups.every(s=>s.x>=WIDTH));tick(g,120);assert.equal('clock'in g,false);assert.equal(g.health,4);assert.equal(g.bolts.length,0);
});
test('quiet-room exit is free even without completing training',()=>{
 const g=new Game({story:false});g.start();g.player.x=WIDTH-45;g.player.y=426;tick(g,100,{right:true});assert.equal(g.room,1);assert.equal(g.tutorial.complete,false);assert.equal(g.health,4);
});
test('a buffered jump lands on the same highlighted collision surface',()=>{
 const g=isolated();const before=g.player.y;g.step(1/60,{jump:true});assert.ok(g.player.y<before&&g.player.vy<0);tick(g,70);assert.equal(g.player.y,platforms.find(s=>s.room===1&&s.index===0).y-48);assert.equal(g.player.grounded,true);
});
test('down crouches with feet fixed and reduces both height and movement speed',()=>{
 const g=isolated(),feet=g.player.y+48,x=g.player.x;tick(g,30,{right:true,down:true});assert.equal(g.player.sneaking,true);assert.equal(g.player.h,26);assert.equal(g.player.y+g.player.h,feet);assert.ok(Math.abs(g.player.x-x-31)<.001);g.step(1/60,{});assert.equal(g.player.h,48);assert.equal(g.player.y+g.player.h,feet);
});
test('jump, paw and dash break stealth instead of silently attacking',()=>{
 for(const action of ['jump','attack','dash']){const g=isolated(1,2,340);g.step(1/60,{down:true});g.step(1/60,{down:true,[action]:true});assert.equal(g.player.sneaking,false,action);assert.equal(g.player.h,48,action);}
});
test('Uma can creep through an unalarmed Panicker without contact damage or a portal',()=>{
 const g=isolated(5,0,45),e=enemy('panicker',5,125,0,{noticed:false,dir:1,speed:9});g.enemies=[e];tick(g,155,{down:true,right:true});assert.ok(g.player.x>e.x+e.w);assert.equal(g.health,4);assert.equal(e.noticed,false);assert.equal(e.state,'patrol');assert.equal(g.portals.length,0);assert.equal(g.enemies.length,1);
});
test('ordinary movement triggers Panicker and a visible delayed portal with one Fakenews',()=>{
 const g=isolated(5,0,20),e=enemy('panicker',5,125);g.enemies=[e];tick(g,40);assert.equal(e.state,'alarm');assert.equal(g.portals.length,1);assert.equal(g.enemies.length,1);tick(g,120);assert.equal(g.enemies.filter(e=>e.portalMinion).length,1);assert.ok(g.enemies.filter(e=>e.portalMinion).every(e=>e.type==='fakenews'&&e.active));
});
test('crouching before the bell rings cancels its preparation',()=>{
 const g=isolated(5,0,20),e=enemy('panicker',5,125,0,{state:'windup',timer:.3});g.enemies=[e];tick(g,50,{down:true});assert.equal(e.state,'patrol');assert.equal(g.portals.length,0);
});
test('hitting or killing the portal owner closes the portal before new enemies appear',()=>{
 for(const lethal of [false,true]){const g=isolated(5,0,20),e=enemy('panicker',5,125,0,{hp:3});g.enemies=[e];alertNearby(g,e);assert.equal(g.portals.length,1);g.hitEnemy(e,false,lethal?9:1);tick(g,70);assert.equal(g.enemies.length,1);assert.equal(g.portals.length,0);}
});
test('portal minions are capped, spawn inside their platform and do not spawn inside Uma',()=>{
 const g=isolated(5,0,20),e=enemy('panicker',5,125);g.enemies=[e];for(let i=0;i<6;i++){alertNearby(g,e);for(let n=0;n<180;n++)stepPortals(g,1/60);}const spawned=g.enemies.filter(e=>e.portalMinion);assert.equal(spawned.length,2);for(const m of spawned){assert.ok(m.x>=m.origin&&m.x<=m.end);assert.ok(Math.abs(m.x-g.player.x)>=60);}
});
test('Panicker alerts only active nearby enemies and does not redirect a prepared wave',()=>{
 const g=isolated(5,0,20),caller=enemy('panicker',5,125),fake=enemy('fakenews',5,400,1),wave=enemy('inflator',5,420,4,{state:'windup',dir:1}),far=enemy('fakenews',6,125),hidden=enemy('informant',5,440,4,{active:false});g.enemies=[caller,fake,wave,far,hidden];alertNearby(g,caller);assert.ok(fake.alert>0);assert.equal(wave.dir,1);assert.equal(far.alert,0);assert.equal(hidden.alert,0);
});
test('a Fakenews folds, lunges in its locked direction and exposes a recovery window',()=>{
 const g=isolated(1,0,20),e=enemy('fakenews',1,125,0,{timer:0,hp:3,maxHp:3});g.enemies=[e];tick(g,1);assert.equal(e.state,'windup');const direction=e.dir,x=e.x;tick(g,31);assert.equal(e.state,'lunge');assert.equal(e.dir,direction);tick(g,21);assert.equal(e.state,'recover');assert.ok(e.x<x);assert.equal(g.bolts.length,0);
});
test('the first Fakenews is weak; one swing cannot damage a tougher one repeatedly',()=>{
 const g=isolated(1,0,45),weak=enemy('fakenews',1,100),tough=enemy('fakenews',1,100,0,{hp:4,maxHp:4});g.enemies=[weak];g.step(1/60,{attack:true});assert.equal(weak.dead,true);g.enemies=[tough];g.player.cooldown=0;tick(g,12,{attack:true});assert.equal(tough.hp,3);
});
test('a revealed Clickbait stays visible, patrols, turns at the edge and never becomes a lure again',()=>{
 const g=isolated(2,1,350),e=enemy('clickbait',2,365,1);g.enemies=[e];tick(g,1);assert.equal(e.revealed,true);assert.equal(e.state,'emerge');g.player.x=campaignRooms[2].x+10;g.player.y=282;tick(g,165);assert.equal(e.state,'patrol');const x=e.x;tick(g,30);assert.notEqual(e.x,x);assert.ok(e.x>=e.origin&&e.x<=e.end);tick(g,300);assert.notEqual(e.state,'lure');assert.equal(e.revealed,true);
});
test('Clickbait swallowing locks control, freezes in the menu and loses one whole life',()=>{
 const g=isolated(1,0,70),e=enemy('clickbait',1,125,0,{state:'snap',timer:.4,revealed:true});g.enemies=[e];tick(g,1);assert.ok(g.swallow);const x=g.player.x;tick(g,10,{right:true,jump:true,attack:true});assert.equal(g.player.x,x);g.mode='paused';const time=g.swallow.timer;tick(g,120);assert.equal(g.swallow.timer,time);g.mode='playing';tick(g,55);assert.equal(g.swallow,null);assert.equal(g.mode,'respawning');assert.equal(g.lives,2);assert.equal(g.health,0);assert.equal(e.revealed,true);
});
test('Clickbait ignores an early paw; a protected dash avoids ingestion',()=>{
 for(const action of ['attack','dash']){const g=isolated(1,0,70),e=enemy('clickbait',1,125,0,{state:'snap',timer:.3,revealed:true});g.enemies=[e];tick(g,1,{[action]:true});assert.equal(!!g.swallow,action==='attack');assert.equal(e.hp,e.maxHp);assert.equal(e.dead,false);assert.equal(g.health,4);}
});
test('Inflator gives a shorter readable telegraph and a stronger push without direct damage',()=>{
 const g=isolated(1,0,20),e=enemy('inflator',1,125);g.enemies=[e];tick(g,1);assert.equal(e.state,'windup');tick(g,28);assert.equal(e.state,'windup');const x=g.player.x;tick(g,7);assert.equal(e.state,'blast');assert.ok(g.player.x<x);assert.ok(Math.abs(g.player.vx)>=600);assert.equal(g.health,4);
});
test('Uma behind the Inflator is safe; jumping or dashing avoids the wave',()=>{
 for(const avoid of ['behind','jump','dash']){const g=isolated(1,0,20),e=enemy('inflator',1,125,0,{state:'blast',timer:.3,dir:-1});g.enemies=[e];if(avoid==='behind')g.player.x=WIDTH+185;else if(avoid==='jump'){g.player.y-=90;g.player.grounded=false;}else g.player.dash=.2;const x=g.player.x;tick(g,1);assert.equal(g.player.knock,0,avoid);if(avoid!=='dash')assert.equal(g.player.x,x,avoid);}
});
test('an Inflator wave temporarily strengthens nearby Fakenews and expires normally',()=>{
 const g=isolated(3,0,20),e=enemy('inflator',3,125,0,{state:'windup',timer:.01}),fake=enemy('fakenews',3,365,1,{timer:99}),far=enemy('fakenews',4,400,1);g.enemies=[e,fake,far];tick(g,1);assert.ok(fake.pressureTime>3.9);assert.equal(far.pressureTime,0);g.enemies=[fake];fake.speed=0;fake.timer=999;stand(g,3,0,20);tick(g,250);assert.equal(fake.pressureTime,0);
});
test('Informer locks its aim, emits two real long-range packets and opens a recovery window',()=>{
 const g=isolated(4,0,20),e=enemy('informant',4,150,0,{timer:0});g.enemies=[e];tick(g,1);assert.equal(e.state,'windup');const aim={...e.aim};g.player.x=campaignRooms[4].x;tick(g,20);assert.deepEqual(e.aim,aim);tick(g,53);assert.equal(g.events.filter(e=>e.type==='enemyShot').length,2);assert.equal(e.state,'recover');assert.ok(g.bolts.every(b=>b.kind==='packet'&&b.sourceId===e.id));
});
test('crouching after an Informer fixes a standing aim lets its packets pass overhead',()=>{
 const g=isolated(4,0,20),e=enemy('informant',4,150,0,{timer:0});g.enemies=[e];tick(g,1);assert.equal(e.state,'windup');tick(g,145,{down:true});assert.equal(g.health,4);assert.equal(g.player.sneaking,true);assert.ok(g.events.some(e=>e.type==='enemyShot'));
});
test('Informer shields preparation; a reflected packet breaks the shield and deals real damage',()=>{
 const g=isolated(4,0,20),e=enemy('informant',4,150,0,{state:'windup',timer:.8});g.enemies=[e];assert.equal(g.hitEnemy(e),false);assert.equal(e.hp,3);assert.equal(g.hitEnemy(e,false,2,{reflected:true}),true);assert.equal(e.hp,1);assert.equal(e.shieldBroken,3);assert.equal(e.state,'recover');
});
test('a packet can be parried into its owner even when the final boss is active',()=>{
 const g=isolated(4,0,45),e=enemy('informant',4,150,0,{state:'windup',timer:1});g.enemies=[e];g.boss.active=true;g.player.attack=.18;g.bolts=[{kind:'packet',sourceId:e.id,x:campaignRooms[4].x+90,y:270,w:16,h:12,vx:-100,vy:0,ttl:3}];const paw={x:campaignRooms[4].x+60,y:250,w:60,h:65};stepProjectiles(g,1/60,paw);assert.equal(g.bolts[0].friendly,true);assert.ok(g.bolts[0].vx>0);for(let i=0;i<40;i++)stepProjectiles(g,1/60,paw);assert.equal(e.hp,1);assert.ok(e.shieldBroken>0);
});
test('dash protects Uma and cannot restart during its cooldown',()=>{
 const g=isolated();g.step(1/60,{dash:true});const lives=g.health;g.hurt();assert.equal(g.health,lives);tick(g,20,{dash:true});assert.equal(g.player.dash,0);assert.ok(g.player.dashCooldown>0);
});
test('soup heals once, strengthens range and damage for ten seconds, and pauses correctly',()=>{
 const g=isolated();g.health=2;g.soups=[{x:g.player.x+17,y:g.player.y+24,taken:false}];tick(g,1);assert.equal(g.health,3);assert.equal(g.player.powerTime,10);g.mode='paused';tick(g,120);assert.equal(g.player.powerTime,10);g.mode='playing';const e=enemy('fakenews',1,160,0,{hp:3,maxHp:3});g.enemies=[e];g.hitEnemy(e);assert.equal(e.hp,1);g.enemies=[];tick(g,610);assert.equal(g.player.powerTime,0);assert.equal(g.health,3);
});
test('eight fish heal once and a collected packet cannot be collected again',()=>{
 const g=isolated();g.health=2;g.fish=7;g.fishes=[{x:g.player.x+17,y:g.player.y+24,taken:false}];tick(g,5);assert.equal(g.fish,8);assert.equal(g.health,3);assert.equal(g.fishes[0].taken,true);
});
test('all gameplay timers, warnings, portal growth, buffs and transitions freeze in the menu',()=>{
 const g=isolated(5);g.enemies=[enemy('panicker',5,125)];alertNearby(g,g.enemies[0]);g.player.powerTime=7;g.transition={from:4,to:5,time:.2,duration:.85};g.mode='paused';const snapshot=JSON.stringify(g);tick(g,150,{right:true,attack:true});assert.equal(JSON.stringify(g),snapshot);
});
test('one paw destroys a satellite dish and opens its gate even while a defender is alive',()=>{
 const g=isolated(1,6,572),r=g.relays[0],e=enemy('fakenews',1,640,6,{hp:3,guardian:true});g.enemies=[e];g.step(1/60,{right:true,attack:true});assert.equal(r.hp,0);assert.equal(g.evidence.length,0);assert.equal(g.relays.filter(d=>d.room===1&&d.hp>0).length,2);assert.equal(e.dead,false);assert.ok(r.breakTime>0);tick(g,20,{attack:true});assert.equal(g.evidence.length,0);
});

test('checkpoint retry preserves records, open gates and collections but resets local enemies and portals',()=>{
 const g=isolated(3);g.completeChapter(2);g.relays[0].hp=0;g.fish=7;g.health=1;g.hurt();assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.mode,'playing');assert.equal(g.room,3);assert.equal(g.health,MAX_HEALTH);assert.equal(g.evidence.length,1);assert.equal(g.relays[0].hp,0);assert.equal(g.fish,7);assert.equal(g.portals.length,0);assert.ok(g.enemies.some(e=>e.room===3&&!e.active));
});
test('death has its own pose timer and taking another protected hit does not restart it',()=>{
 const g=isolated();g.hurt();assert.equal(g.player.hurtTime,.5);tick(g,10);const time=g.player.hurtTime;g.hurt();assert.equal(g.player.hurtTime,time);g.player.inv=0;g.health=1;g.lives=1;g.hurt();assert.equal(g.mode,'lost');assert.equal(g.player.hurtTime,.5);
});
test('camera eases through normal rooms and the separate arena is hidden before the portal',()=>{
 const g=isolated();g.viewWidth=300;g.camera=0;g.player.x=WIDTH+600;g.updateCamera(1/60);assert.ok(g.camera>0&&g.camera<g.player.x-120);const first=g.camera;tick(g,15);assert.ok(g.camera>first);g.room=7;g.player.x=FINAL_X-40;g.updateCamera();assert.equal(g.camera,FINAL_X-300);g.room=LAST_ROOM;g.player.x=WORLD-50;g.updateCamera();assert.equal(g.camera,WORLD-300);
});

test('Infoshum is invulnerable in a live screen and its exposed console takes one hit per paw swing',()=>{
 const g=bossGame(),n=g.boss.network;assert.equal(damageBoss(g,2,true),false);
 assert.equal(g.boss.hp,32);assert.equal(n.monitors[0].state,'idle');
 assert.equal(breakScreen(g,0),true);assert.equal(g.boss.hp,28);
 assert.equal(strikeInfoshum(g,{x:g.player.x+16,y:g.player.y-2,w:54,h:54}),false);
 assert.equal(n.defeatedMonitors,1);assert.equal(n.monitors[0].state,'broken');
});
test('Infoshum uses three distinct monitor stations instead of summoning helpers',()=>{
 const g=bossGame(),n=g.boss.network;assert.equal(n.monitors.length,3);
 assert.equal(n.stage,'network');assert.ok(n.monitors.every(m=>m.terminalY>250));
 assert.equal(g.boss.maxHp,32);assert.equal(damageBoss(g,99,true),false);
 assert.equal(n.monitors.filter(m=>m.state==='broken').length,0);
});
test('destroying all three monitors releases Infoshum after the last screen ruptures',()=>{
 const g=bossGame(),n=g.boss.network;
 assert.equal(breakScreen(g,0),true);assert.equal(g.boss.hp,28);assert.equal(g.boss.phase,1);
 assert.equal(breakScreen(g,1),true);assert.equal(g.boss.hp,24);assert.equal(n.stage,'network');assert.equal(breakScreen(g,2),true);assert.equal(g.boss.hp,20);assert.equal(n.stage,'rupture');
 assert.equal(n.monitors.filter(m=>m.state==='broken').length,3);
 for(let i=0;i<160;i++)stepBoss(g,1/60);
 assert.equal(n.stage,'free');assert.equal(g.boss.phase,2);
 assert.equal(n.monitors.filter(m=>m.state==='broken').length,3);
 assert.ok(g.platforms.some(s=>s.room===8&&s.bossHidden));
});
test('five final core hits end the boss fight and preserve the existing finale flow',()=>{
 const g=bossGame(),n=g.boss.network;
 breakScreen(g,0);breakScreen(g,1);breakScreen(g,2);for(let i=0;i<160;i++)stepBoss(g,1/60);
 for(let i=0;i<5;i++){
  n.mode='weak';n.target={x:g.player.x+25,y:g.player.y+g.player.h};
  g.player.attack=.18;g.player.swing++;
  const paw={x:g.player.x,y:g.player.y-2,w:60,h:g.player.h+6};
  assert.equal(strikeInfoshum(g,paw),true);
 }
 assert.equal(g.boss.hp,0);assert.equal(g.mode,'bossDefeat');
 g.skipBossDefeat();assert.equal(g.mode,'ending');
 while(g.mode==='ending')g.advanceEnding();g.advanceConclusion(true);
 assert.equal(g.mode,'won');const time=g.time;tick(g,120,{attack:true,right:true});assert.equal(g.time,time);
 const t=isolated();t.time=99999;tick(t,1);assert.equal(t.mode,'playing');assert.equal('clock'in t,false);
});
test('Infoshum moves visibly between all three monitors after telegraphed attacks',()=>{
 const g=bossGame(),n=g.boss.network,visited=new Set([n.activeIndex]),warnings=new Set();
 for(let i=0;i<2500;i++){
  stepBoss(g,1/60);visited.add(n.activeIndex);
  for(const e of g.events)if(e.type==='infoshumWarning')warnings.add(e.attack);
  g.events=[];
 }
 assert.equal(visited.size,3);assert.ok(warnings.has('packet'));assert.ok(warnings.has('rain'));
 assert.ok(warnings.has('wave'));assert.equal(g.boss.hp,32);
 assert.equal(n.monitors.filter(m=>m.state==='broken').length,0);
});
