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
// The newsroom conveyor is stopped in this sandbox so generic mechanics can be measured on its floor.
function isolated(room=1,index=0,x=45){const g=new Game({story:false});g.start();g.platforms.find(s=>s.id==='1:0').belt=0;g.abilities={attack:true,dash:true,sneak:true};g.tutorial.complete=true;g.enemies=[];g.fishes=[];g.soups=[];g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);stand(g,room,index,x);return g;}
function bossGame(){const g=isolated(LAST_ROOM,2,633);g.relays.forEach(r=>r.hp=0);g.boss.active=true;g.boss.state='recover';g.boss.timer=2;return g;}
function breakScreen(g,index){const m=g.boss.network.monitors[index],p=g.player;for(let hit=0;hit<2;hit++){if(hit)for(let i=0;i<370;i++)stepBoss(g,1/60);m.state='open';m.openTime=5;Object.assign(p,{x:m.terminalX-34,y:m.terminalY-46,dir:1,attack:.18,swing:p.swing+1});if(!strikeInfoshum(g,{x:p.x+16,y:p.y-2,w:54,h:p.h+6}))return false;}return true;}
test('catalogue has four equal groups of three regular enemies and one boss',()=>{
 assert.equal(monsters.length,16);for(let chapter=0;chapter<4;chapter++){const group=monsters.filter(m=>m.chapter===chapter);assert.equal(group.length,4);assert.equal(group.filter(m=>m.boss).length,1);}// The Censor grows out of the newsroom conveyor and Сенсации fly in flocks over the roofs (roofs-systems.js); neither is a roster enemy.
 assert.deepEqual(new Set([...createEnemies().map(e=>e.type),'censor','sensation']),new Set(monsters.filter(m=>!m.boss).map(m=>m.id)));for(const m of monsters){assert.ok(m.description.length>20);assert.equal(m.abilities.length,2);assert.ok(m.tip);}assert.throws(()=>enemy('infonoise',1,100));assert.throws(()=>enemy('headline',1,100));
});
test('training is physically separate, has no enemies, relays, soup or time pressure',()=>{
 const g=new Game({story:false});g.start();assert.equal(g.room,0);assert.equal(rooms[0].tutorial,true);assert.ok(g.enemies.every(e=>e.room>0&&!e.active));assert.ok(g.relays.every(r=>r.room>0));assert.ok(g.soups.every(s=>s.x>=WIDTH));tick(g,120);assert.equal('clock'in g,false);assert.equal(g.health,4);assert.equal(g.bolts.length,0);
});
test('the quiet-room door stays shut until a paw breaks the infected monitor',()=>{
 const g=new Game({story:false});g.start();const x0=rooms[0].x,floor=g.platforms.find(s=>s.id==='0:2');Object.assign(g.player,{x:x0+1300,y:floor.y-48,vx:0,grounded:true,supportId:floor.id});
 tick(g,120,{right:true});assert.equal(g.room,0);assert.ok(g.player.x+g.player.w<=x0+1408+24);assert.equal(g.tutorial.doorOpen,false);
 Object.assign(g.player,{x:x0+1135,dir:1,cooldown:0});tick(g,1,{attack:true});tick(g,2);assert.equal(g.tutorial.monitorBroken,true);assert.equal(g.tutorial.doorOpen,true);
 tick(g,200,{right:true});while(g.mode==='loading')tick(g,1);assert.equal(g.room,1);assert.equal(g.health,4);
});
test('the «помехи» barrier stops a walking Uma and shatters only to a dash',()=>{
 const g=new Game({story:false});g.start();const x0=rooms[0].x,floor=g.platforms.find(s=>s.id==='0:1');Object.assign(g.player,{x:x0+650,y:floor.y-48,vx:0,grounded:true,supportId:floor.id});
 tick(g,90,{right:true});assert.equal(g.tutorial.barrierBroken,false);assert.ok(g.player.x+g.player.w<=x0+735+1);assert.ok(g.events.some(e=>e.type==='tutorialBump'));
 tick(g,1,{right:true,dash:true});tick(g,20,{right:true});assert.equal(g.tutorial.barrierBroken,true);assert.ok(g.player.x>x0+735);
});
test('the bench is a low ceiling: standing Uma stops, crawling Uma passes, a fish waits beneath',()=>{
 const g=new Game({story:false});g.start();const x0=rooms[0].x,floor=g.platforms.find(s=>s.id==='0:1'),bench=g.platforms.find(s=>s.id==='0:4');assert.equal(bench.shelter,bench.y+11);
 Object.assign(g.player,{x:bench.x-50,y:floor.y-48,vx:0,grounded:true,supportId:floor.id});tick(g,60,{right:true});assert.ok(g.player.x+g.player.w<=bench.x+5);
 const fish=g.fishes.find(f=>f.room===0&&f.x>bench.x&&f.x<bench.x+bench.w);assert.ok(fish);for(let i=0;i<400&&g.player.x<bench.x+bench.w;i++)tick(g,1,{right:true,down:true});assert.ok(g.player.x>=bench.x+bench.w);assert.equal(fish.taken,true);assert.equal(g.player.h,26);
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
test('a revealed Clickbait bites once where the bait was, then crumbles to pixels and is gone for good',()=>{
 const g=isolated(2,1,350),e=enemy('clickbait',2,365,1);g.enemies=[e];tick(g,1);assert.equal(e.revealed,true);assert.equal(e.state,'emerge');g.player.x=campaignRooms[2].x+10;g.player.y=282;const x=e.x;
 const seen=new Set();for(let i=0;i<120&&!e.dead;i++){tick(g,1);seen.add(e.state);}assert.deepEqual([...seen].filter(s=>['wait','snap','vanish'].includes(s)),['wait','snap','vanish']);assert.equal(e.dead,true);assert.equal(e.gone,true);assert.equal(e.x,x,'it never walks');assert.equal(g.kills,0,'no kill credit');tick(g,120);assert.notEqual(e.state,'lure');
});
test('Clickbait swallowing locks control, freezes in the menu and costs two hearts',()=>{
 const g=isolated(1,0,70),e=enemy('clickbait',1,125,0,{state:'snap',timer:.4,revealed:true});g.enemies=[e];tick(g,1);assert.ok(g.swallow);const x=g.player.x;tick(g,10,{right:true,jump:true,attack:true});assert.equal(g.player.x,x);g.mode='paused';const time=g.swallow.timer;tick(g,120);assert.equal(g.swallow.timer,time);g.mode='playing';tick(g,55);assert.equal(g.swallow,null);assert.equal(g.mode,'playing');assert.equal(g.lives,3);assert.equal(g.health,2);assert.ok(g.player.inv>0);assert.ok(g.events.some(v=>v.type==='clickbaitSpit'));assert.equal(e.revealed,true);
});
test('Clickbait ignores an early paw; a protected dash avoids ingestion',()=>{
 for(const action of ['attack','dash']){const g=isolated(1,0,70),e=enemy('clickbait',1,125,0,{state:'snap',timer:.3,revealed:true});g.enemies=[e];tick(g,1,{[action]:true});assert.equal(!!g.swallow,action==='attack');assert.equal(e.hp,e.maxHp);assert.equal(e.dead,false);assert.equal(g.health,4);}
});
test('Inflator gives a shorter readable telegraph and a stronger push without direct damage',()=>{
 const g=isolated(1,0,20),e=enemy('inflator',1,125);g.enemies=[e];tick(g,1);assert.equal(e.state,'windup');tick(g,28);assert.equal(e.state,'windup');const x=g.player.x;tick(g,7);assert.equal(e.state,'blast');assert.ok(g.player.x<x);assert.ok(Math.abs(g.player.vx)>=600);assert.equal(g.health,4);
});
test('Uma behind the Inflator is safe; jumping or dashing avoids the wave',()=>{
 for(const avoid of ['behind','jump','dash']){const g=isolated(1,0,20),e=enemy('inflator',1,125,0,{state:'blast',timer:.3,dir:-1});g.enemies=[e];if(avoid==='behind')g.player.x=campaignRooms[1].x+185;else if(avoid==='jump'){g.player.y-=90;g.player.grounded=false;}else g.player.dash=.2;const x=g.player.x;tick(g,1);assert.equal(g.player.knock,0,avoid);if(avoid!=='dash')assert.equal(g.player.x,x,avoid);}
});
test('a roof Нагнетатель hangs out of reach: a paw cannot break it and no shield flashes',()=>{
 const g=isolated(3,2,40),e=enemy('inflator',3,120,2,{active:true,noticed:true,dir:1});g.enemies=[e];assert.equal(g.hitEnemy(e),false);assert.equal(e.dead,false);assert.ok(!g.events.some(v=>v.type==='blocked'));assert.ok(!(e.guardFlash>0));
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
test('there are no transmitters on any map, so every gate is open',()=>{
 const g=isolated(3);assert.equal(g.relays.length,0);for(const room of [1,3,5,7])assert.equal(g.relays.filter(d=>d.room===room&&d.hp>0).length,0);
});

test('checkpoint retry preserves records, open gates and collections but resets local enemies and portals',()=>{
 const g=isolated(3);g.completeChapter(2);g.fish=7;g.health=1;g.hurt();assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.mode,'playing');assert.equal(g.room,3);assert.equal(g.health,MAX_HEALTH);assert.equal(g.evidence.length,1);assert.equal(g.fish,7);assert.equal(g.portals.length,0);assert.ok(g.enemies.some(e=>e.room===3&&!e.active));
});
test('death has its own pose timer and taking another protected hit does not restart it',()=>{
 const g=isolated();g.hurt();assert.equal(g.player.hurtTime,.5);tick(g,10);const time=g.player.hurtTime;g.hurt();assert.equal(g.player.hurtTime,time);g.player.inv=0;g.health=1;g.lives=1;g.hurt();assert.equal(g.mode,'lost');assert.equal(g.player.hurtTime,.5);
});
test('camera eases through normal rooms and the separate arena is hidden before the portal',()=>{
 const g=isolated();g.viewWidth=300;g.camera=0;g.player.x=WIDTH+600;g.updateCamera(1/60);assert.ok(g.camera>0&&g.camera<g.player.x-120);const first=g.camera;tick(g,15);assert.ok(g.camera>first);g.room=7;g.player.x=FINAL_X-40;g.updateCamera();assert.equal(g.camera,FINAL_X-300);g.room=LAST_ROOM;g.player.x=WORLD-50;g.updateCamera();assert.equal(g.camera,WORLD-300);
});
