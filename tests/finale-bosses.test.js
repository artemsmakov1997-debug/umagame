import test from 'node:test';import assert from 'node:assert/strict';
import{Game,rooms}from'../engine.js';import{enemy,createEnemies}from'../level.js';
import{activateRoom}from'../room-transitions.js';import{endingSlides,scoreBreakdown}from'../finale.js';
import{bossPatterns,castAttack,planAttack,stepBoss,damageBoss,stepProjectiles,bossContact,bossTroops}from'../boss.js';
import{summonBossTroops}from'../boss-abilities.js';import{stepTether}from'../campaign-enemies.js';
import{stepPortals}from'../enemies.js';import{cleanCopies}from'../tactical-enemies.js';
import{canActivateEnemy,SPECIES_GAP,FIRST_ENCOUNTER_GRACE,introductionOrder,introductionDistance}from'../encounters.js';
import{musicScores,sceneMusic}from'../music-scores.js';import{exitMarker}from'../navigation-art.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function game(room=1){const g=new Game({story:false});g.start();g.tutorial.complete=true;activateRoom(g,room);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.player.inv=0;g.boss.noticeTime=0;return g;}
function prepare(g,ability){const b=g.boss;b.ability=ability;b.aim={x:g.player.x+17,y:g.player.y+24};b.targets=[g.player.x+100];b.nextDock=0;return b;}
test('all actions are available at the first frame, after a lost life and after a complete restart',()=>{
 const g=new Game({story:false});g.start();assert.deepEqual(g.abilities,{attack:true,dash:true,sneak:true});g.step(1/60,{attack:true,dash:true});assert.equal(g.player.swing,1);assert.equal(g.player.dash,.2);tick(g,20);g.step(1/60,{down:true});assert.equal(g.player.sneaking,true);g.loseLife();tick(g,70);assert.ok(Object.values(g.abilities).every(Boolean));g.start();assert.ok(Object.values(g.abilities).every(Boolean));
});
test('victory shows the full rewind and embrace before the closing text; score stays fixed',()=>{
 const g=game(8);g.fish=7;g.kills=3;g.relays.forEach(d=>d.hp=1);g.relays.slice(0,2).forEach(d=>d.hp=0);g.bossesDefeated=new Set(['infoshum']);g.finish();assert.equal(g.mode,'ending');assert.equal(g.finalScore.total,1420);assert.equal(endingSlides.length,11);assert.match(endingSlides.at(-1).text,/обнимает/);const frozen=JSON.stringify(g);tick(g,180,{attack:true,right:true});assert.equal(JSON.stringify(g),frozen);assert.equal(g.advanceEnding(-1),false);while(g.mode==='ending')g.advanceEnding();assert.equal(g.mode,'conclusion');g.advanceConclusion(true);assert.equal(g.mode,'won');assert.equal(g.events.filter(e=>e.type==='won').length,1);assert.equal(g.finish(),false);g.start();assert.equal(g.ending,null);assert.equal(g.finalScore,null);
});
test('pause preserves the selected slide and the result waits for the closing screen',()=>{
 const g=game(8);g.finish();g.advanceEnding();g.pausedFrom='ending';g.mode='paused';const before=JSON.stringify(g);tick(g,90);assert.equal(JSON.stringify(g),before);assert.equal(g.advanceEnding(),false);g.mode='ending';delete g.pausedFrom;assert.equal(g.ending.index,1);while(g.mode==='ending')g.advanceEnding();assert.equal(g.mode,'conclusion');g.advanceConclusion(true);assert.equal(g.mode,'won');
});
test('score counts fish, actual kills, destroyed dishes and defeated bosses without introducing a timer',()=>{
 const g=game();assert.equal(scoreBreakdown(g).total,0);g.fish=4;g.kills=2;g.relays[0].hp=0;g.bossesDefeated.add('spreader');assert.equal(scoreBreakdown(g).total,1240);g.time=999999;assert.equal(scoreBreakdown(g).total,1240);
});
test('every boss cycles through its own three species in small waves, with safe delayed arrivals and a cap',()=>{
 for(const room of[2,4,6,8]){const g=game(room);const seen=new Set();for(let i=0;i<7;i++){summonBossTroops(g).forEach(e=>seen.add(e.type));assert.ok(g.enemies.filter(e=>!e.dead).length<=2);g.enemies.forEach(e=>e.dead=true);}g.enemies=[];assert.equal(summonBossTroops(g).length,0);assert.equal(g.boss.summonRemaining,0);g.boss.summonRemaining=2;summonBossTroops(g);const helpers=g.enemies.filter(e=>e.bossOwnerId===g.boss.id&&!e.dead);assert.equal(helpers.length,2,g.boss.id);assert.deepEqual(seen,new Set(bossTroops[g.boss.id]));assert.ok(helpers.every(e=>e.spawnTime>=.5&&!g.overlap(e,g.player)));assert.ok(helpers.every(e=>e.room===room));}
});
test('Spreader inherits ink and copying; his printed copies persist while he lives and vanish with him',()=>{
 const g=game(2);prepare(g,'ink');castAttack(g);assert.equal(g.inks.length,2);prepare(g,'copy');castAttack(g);assert.equal(g.enemies.filter(e=>e.copyOwnerId==='boss:spreader').length,1);cleanCopies(g);assert.ok(g.enemies.every(e=>!e.dead));g.relays.forEach(d=>d.hp=0);g.boss.cooldown=0;g.boss.state='recover';g.boss.ability='swoop';assert.equal(damageBoss(g,1),true,'recovery after a dive is vulnerable');g.boss.cooldown=0;assert.equal(damageBoss(g,99),true);assert.ok(g.enemies.every(e=>e.dead));assert.equal(g.inks.length,0);
});
test('Agitator inherits the Panicker portal, releasing one actual Fakenews',()=>{
 const g=game(4);prepare(g,'alarm');castAttack(g);assert.equal(g.portals.length,1);for(let i=0;i<150;i++)stepPortals(g,1/60);assert.equal(g.enemies.filter(e=>e.portalOwnerId==='boss:agitator').length,1);assert.ok(g.enemies.every(e=>e.type==='fakenews'));assert.ok(g.enemies.every(e=>Math.abs(e.x-g.player.x)>=60));
 const silent=game(4);silent.player.sneaking=true;prepare(silent,'alarm');castAttack(silent);assert.equal(silent.portals.length,0);
});
test('Agitator armour blocks front paws, opens at the rear, and reflected packets break the shield',()=>{
 const g=game(4),b=g.boss;g.relays.forEach(d=>d.hp=0);b.state='casting';b.ability='broadcast';b.dir=1;const center=b.x+b.w/2;assert.equal(damageBoss(g,1,false,center+90),false);assert.equal(damageBoss(g,1,false,center-90),true);b.cooldown=0;assert.equal(damageBoss(g,2,true,center+90),true);assert.ok(b.shieldBroken>0);
});
test('Agitator phases out, relocates, phases in and then emits two packets with no damage during transit',()=>{
 const g=game(4),b=prepare(g,'telecast'),x=b.x;castAttack(g);for(let i=0;i<10;i++)stepBoss(g,1/60);assert.equal(b.phased,true);assert.equal(b.x,x);g.relays.forEach(d=>d.hp=0);assert.equal(damageBoss(g,2,true),false);for(let i=0;i<52;i++)stepBoss(g,1/60);assert.notEqual(b.x,x);assert.equal(b.phased,false);assert.equal(g.bolts.filter(b=>b.kind==='packet').length,2);
});
test('Agitator aborts a warned teleport when Uma moves into its landing rectangle',()=>{
 const g=game(4),b=prepare(g,'telecast');castAttack(g);const x=b.x,d=b.docks[0];Object.assign(g.player,{x:d.x+20,y:d.y+20});for(let i=0;i<33;i++)stepBoss(g,1/60);assert.equal(b.x,x);assert.ok(g.events.some(e=>e.type==='teleportAbort'));
});
test('Agitator forward pressure pushes only its own line and respects a protected dash',()=>{
 for(const dash of[0,.2]){const g=game(4),b=prepare(g,'pressure');b.dir=1;castAttack(g);Object.assign(g.player,{x:b.x+b.w+20,y:b.y+b.h-48,dash,inv:0});stepBoss(g,1/60);assert.equal(g.player.knock>0,!dash);if(!dash)assert.equal(g.player.vx,640);}
});
test('Manipulator combines real cuts with a five-second pull; Shift and hitting the reel break its tape',()=>{
 const g=game(6),b=g.boss;b.phase=2;b.hp=9;b.turn=0;planAttack(g);assert.ok(g.cuts.length);assert.ok(g.cuts.every(c=>c.ownerId==='boss:manipulator'&&c.phase==='warning'));
 prepare(g,'splice');castAttack(g);assert.equal(g.tether.remaining,5);Object.assign(g.player,{x:b.x-120,y:b.y+b.h-48});stepTether(g,1/60);assert.equal(g.player.pulled,true);g.player.dash=.2;stepTether(g,1/60);assert.equal(g.tether,null);assert.equal(b.state,'recover');
 g.player.dash=0;prepare(g,'splice');castAttack(g);g.relays.forEach(d=>d.hp=0);b.cooldown=0;assert.equal(damageBoss(g,1),true);assert.equal(g.tether,null);
});
test('Manipulator ticker bursts and physical hops differ from the other bosses',()=>{
 const g=game(6),b=prepare(g,'ticker');castAttack(g);for(let i=0;i<60;i++)stepBoss(g,1/60);assert.equal(g.bolts.filter(b=>b.kind==='ticker').length,3);b.state='shift';b.timer=1.15;b.shiftFrom={x:b.x,y:b.y};b.nextDock=0;const y=b.y;for(let i=0;i<30;i++)stepBoss(g,1/60);assert.ok(Math.abs(b.y-y)>15);assert.notEqual(b.x,b.docks[0].x);
});
test('Infoshum Echo attack warps Uma back without draining hearts; dash protects her',()=>{
 for(const dash of[0,.2]){const g=game(8);g.echoImmunity=0;g.player.dash=dash;g.bolts=[{kind:'echoOrb',type:'echo',room:8,state:'pulling',timer:2,x:g.player.x,y:g.player.y,w:28,h:28,vx:0,vy:0,ttl:2}];stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.equal(g.mode,dash?'playing':'echoWarp');assert.equal(g.health,4);}
});
test('Infoshum Static attack pushes down, and its Clickbait remains immortal and unique',()=>{
 const g=game(8),b=g.boss;b.state='casting';b.ability='staticRush';Object.assign(g.player,{x:b.x+10,y:b.y+30});bossContact(g);assert.equal(g.health,3);assert.equal(g.player.vy,150);for(let i=0;i<4;i++){prepare(g,'lure');castAttack(g);}const traps=g.enemies.filter(e=>e.type==='clickbait');assert.equal(traps.length,1);assert.equal(g.hitEnemy(traps[0],false,99),false);
});
test('new species appear in order, separated by distance and time, with a solo grace period',()=>{
 for(const room of[1,3,5,7]){const g=game(room),order=introductionOrder[room],first=enemy(order[0],room,150,0),second=enemy(order[1],room,160,0);g.player.x=rooms[room].x+2200;assert.equal(canActivateEnemy(g,second),false);assert.equal(canActivateEnemy(g,first),true);assert.equal(canActivateEnemy(g,{...first,id:'another'}),false);g.time+=FIRST_ENCOUNTER_GRACE;assert.equal(canActivateEnemy(g,{...first,id:'another'}),true);assert.equal(canActivateEnemy(g,second),false);g.time=SPECIES_GAP;assert.equal(canActivateEnemy(g,second),true);const third=enemy(order[2],room,170,0);assert.equal(canActivateEnemy(g,third),false);g.time+=SPECIES_GAP;assert.equal(canActivateEnemy(g,third),true);}
});
test('species pacing survives checkpoint recovery, while a full restart begins introductions anew',()=>{
 const g=game(1),e=enemy('fakenews',1,150,0);g.player.x=rooms[1].x+160;assert.equal(canActivateEnemy(g,e),true);g.loseLife();tick(g,70);assert.ok(g.encounters[1].types.fakenews);g.start();assert.deepEqual(g.encounters,{});
});
test('open transitions show an arrow; closed gates and the final arena do not',()=>{
 const g=game(1);assert.equal(exitMarker(g),null);g.relays.filter(d=>d.room===1).forEach(d=>d.hp=0);assert.ok(exitMarker(g).x>rooms[1].end-100);activateRoom(g,2);g.relays.filter(d=>d.room===2).forEach(d=>d.hp=0);assert.equal(exitMarker(g),null);g.bossesDefeated.add('spreader');assert.ok(exitMarker(g));activateRoom(g,8);g.relays.forEach(d=>d.hp=0);assert.equal(exitMarker(g),null);
});
test('all five locations and four boss fights select different original musical scores',()=>{
 const g=game(),themes=[];for(const r of rooms){activateRoom(g,r.index);themes.push(sceneMusic('game',g,rooms));}assert.equal(new Set(themes).size,9);assert.equal(sceneMusic('menu',g,rooms),'menu');g.finish();assert.equal(sceneMusic('game',g,rooms),'ending');assert.equal(Object.keys(musicScores).length,11);assert.equal(new Set(Object.values(musicScores).map(s=>JSON.stringify([s.melody,s.bass,s.drums]))).size,11);for(const s of Object.values(musicScores)){assert.ok(s.melody.length>=16);assert.equal(s.chords.length,4);assert.ok(s.bpm>60&&s.bpm<180);}
});
