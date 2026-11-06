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
 const g=game(8);g.fish=7;g.kills=3;g.relays.forEach(d=>d.hp=1);g.relays.filter(d=>d.room===3).slice(0,2).forEach(d=>d.hp=0);g.bossesDefeated=new Set(['infoshum']);g.finish();assert.equal(g.mode,'ending');assert.equal(g.finalScore.total,1420);assert.equal(endingSlides.length,11);assert.match(endingSlides.at(-1).text,/обнимает/);const frozen=JSON.stringify(g);tick(g,180,{attack:true,right:true});assert.equal(JSON.stringify(g),frozen);assert.equal(g.advanceEnding(-1),false);while(g.mode==='ending')g.advanceEnding();assert.equal(g.mode,'conclusion');g.advanceConclusion(true);assert.equal(g.mode,'won');assert.equal(g.events.filter(e=>e.type==='won').length,1);assert.equal(g.finish(),false);g.start();assert.equal(g.ending,null);assert.equal(g.finalScore,null);
});
test('pause preserves the selected slide and the result waits for the closing screen',()=>{
 const g=game(8);g.finish();g.advanceEnding();g.pausedFrom='ending';g.mode='paused';const before=JSON.stringify(g);tick(g,90);assert.equal(JSON.stringify(g),before);assert.equal(g.advanceEnding(),false);g.mode='ending';delete g.pausedFrom;assert.equal(g.ending.index,1);while(g.mode==='ending')g.advanceEnding();assert.equal(g.mode,'conclusion');g.advanceConclusion(true);assert.equal(g.mode,'won');
});
test('score counts fish, actual kills, destroyed dishes and defeated bosses without introducing a timer',()=>{
 const g=game();assert.equal(scoreBreakdown(g).total,0);g.fish=4;g.kills=2;g.relays.find(d=>d.room===3).hp=0;g.bossesDefeated.add('spreader');assert.equal(scoreBreakdown(g).total,1240);g.time=999999;assert.equal(scoreBreakdown(g).total,1240);
});
test('other bosses cycle through their own three species in small waves, with safe delayed arrivals and a cap',()=>{
 for(const room of[4,6,8]){const g=game(room);const seen=new Set();for(let i=0;i<7;i++){summonBossTroops(g).forEach(e=>seen.add(e.type));assert.ok(g.enemies.filter(e=>!e.dead).length<=2);g.enemies.forEach(e=>e.dead=true);}g.enemies=[];summonBossTroops(g);const helpers=g.enemies.filter(e=>e.bossOwnerId===g.boss.id&&!e.dead);assert.equal(helpers.length,2,g.boss.id);assert.deepEqual(seen,new Set(bossTroops[g.boss.id]));assert.ok(helpers.every(e=>e.spawnTime>=.5&&!g.overlap(e,g.player)));assert.ok(helpers.every(e=>e.room===room));}
});
test('Agitator inherits the Panicker portal, releasing one actual Fakenews',()=>{
 const g=game(4);prepare(g,'alarm');castAttack(g);assert.equal(g.portals.length,1);for(let i=0;i<150;i++)stepPortals(g,1/60);assert.equal(g.enemies.filter(e=>e.portalOwnerId==='boss:agitator').length,1);assert.ok(g.enemies.every(e=>e.type==='fakenews'));assert.ok(g.enemies.every(e=>Math.abs(e.x-g.player.x)>=60));
 const silent=game(4);silent.player.sneaking=true;prepare(silent,'alarm');castAttack(silent);assert.equal(silent.portals.length,0);
});
test('Agitator blocks body hits from both sides until the console shield is removed',()=>{const g=game(4),b=g.boss;assert.equal(damageBoss(g,2,true,b.x-100),false);assert.equal(damageBoss(g,2,true,b.x+200),false);b.broadcast.stage='chase';assert.ok(damageBoss(g,1,false,b.x+200));assert.equal(b.hp,b.maxHp-2);});
test('Agitator chase uses real platform hops and leaves a landing window',()=>{const g=game(4),b=g.boss,n=b.broadcast;n.stage='chase';n.mode='hold';n.timer=0;const x=b.x;stepBoss(g,1/60);assert.equal(n.mode,'hop');for(let i=0;i<10;i++)stepBoss(g,1/60);assert.notEqual(b.x,x);assert.ok(!b.phased);for(let i=0;i<60;i++)stepBoss(g,1/60);assert.equal(n.mode,'hold');const s=g.platforms.find(s=>s.room===4&&s.index===b.platformIndex);assert.equal(b.y+b.h,s.y);});
test('headline velocity is fixed when the robot fires and cannot track Uma afterwards',()=>{const g=game(4),n=g.boss.broadcast;n.mode='warning';n.turn=1;n.timer=0;stepBoss(g,1/60);const shot=g.bolts.find(b=>b.kind==='headline');assert.ok(shot);const velocity=[shot.vx,shot.vy];g.player.x+=200;for(let i=0;i<15;i++)stepBoss(g,1/60);assert.deepEqual([shot.vx,shot.vy],velocity);});
test('sonic repulsion reaches the distant consoles and respects Shift',()=>{for(const dash of[0,.2]){const g=game(4),b=g.boss,n=b.broadcast;n.mode='rest';n.timer=10;g.player.dash=dash;g.player.knock=0;n.wave={x:g.player.x+17+600,y:g.player.y+24,radius:10,age:0,hit:false};for(let i=0;i<135;i++)stepBoss(g,1/60);assert.equal(g.player.knock>0,!dash);}});
test('Manipulator fires a warned beam, recovers and relocates after a successful hit',()=>{const g=game(6),b=g.boss;g.relays.forEach(d=>d.hp=0);const modes=new Set();for(let i=0;i<480;i++){stepBoss(g,1/60);modes.add(b.studio.mode);}for(const mode of['rewrite','charge','beam','recover'])assert.ok(modes.has(mode));b.state='recover';b.cooldown=0;const dock=b.dock;assert.ok(damageBoss(g,1));assert.equal(b.studio.mode,'relocate');assert.equal(b.phased,true);for(let i=0;i<60;i++)stepBoss(g,1/60);assert.notEqual(b.dock,dock);assert.equal(b.phased,false);assert.equal(g.tether,null);assert.equal(g.cuts.length,0);});
test('Infoshum Echo attack warps Uma back without draining hearts; dash protects her',()=>{
 for(const dash of[0,.2]){const g=game(8);g.echoImmunity=0;g.player.dash=dash;g.bolts=[{kind:'echoOrb',type:'echo',room:8,state:'pulling',timer:2,x:g.player.x,y:g.player.y,w:28,h:28,vx:0,vy:0,ttl:2}];stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.equal(g.mode,dash?'playing':'echoWarp');assert.equal(g.health,4);}
});
test('Infoshum Static attack pushes down, and its Clickbait remains immortal and unique',()=>{
 const g=game(8),b=g.boss;b.state='casting';b.ability='staticRush';Object.assign(g.player,{x:b.x+10,y:b.y+30});bossContact(g);assert.equal(g.health,3);assert.equal(g.player.vy,150);for(let i=0;i<4;i++){prepare(g,'lure');castAttack(g);}const traps=g.enemies.filter(e=>e.type==='clickbait');assert.equal(traps.length,1);assert.equal(g.hitEnemy(traps[0],false,99),false);
});
test('new species appear in order, separated by distance and time, with a solo grace period',()=>{
 for(const room of[1,3,5,7]){const g=game(room),order=introductionOrder[room],first=enemy(order[0],room,150,0),second=enemy(order[1],room,160,0);g.player.x=rooms[room].x+2200;assert.equal(canActivateEnemy(g,second),false);assert.equal(canActivateEnemy(g,first),true);assert.equal(canActivateEnemy(g,{...first,id:'another'}),false);g.time+=FIRST_ENCOUNTER_GRACE;assert.equal(canActivateEnemy(g,{...first,id:'another'}),true);assert.equal(canActivateEnemy(g,second),false);g.time=SPECIES_GAP;assert.equal(canActivateEnemy(g,second),true);if(order[2]){const third=enemy(order[2],room,170,0);assert.equal(canActivateEnemy(g,third),false);g.time+=SPECIES_GAP;assert.equal(canActivateEnemy(g,third),true);}}
});
test('species pacing survives checkpoint recovery, while a full restart begins introductions anew',()=>{
 const g=game(1),e=enemy('fakenews',1,150,0);g.player.x=rooms[1].x+160;assert.equal(canActivateEnemy(g,e),true);g.loseLife();tick(g,70);assert.ok(g.encounters[1].types.fakenews);g.start();assert.deepEqual(g.encounters,{});
});
test('open transitions show an arrow; closed gates and the final arena do not',()=>{
 const g=game(1);assert.ok(exitMarker(g).x>rooms[1].end-100,'the conveyor exit is open from the start');activateRoom(g,2);g.relays.filter(d=>d.room===2).forEach(d=>d.hp=0);assert.equal(exitMarker(g),null);g.bossesDefeated.add('spreader');assert.ok(exitMarker(g));activateRoom(g,8);g.relays.forEach(d=>d.hp=0);assert.equal(exitMarker(g),null);
});
test('all five locations and four boss fights select different original musical scores',()=>{
 const g=game(),themes=[];for(const r of rooms){activateRoom(g,r.index);themes.push(sceneMusic('game',g,rooms));}assert.equal(new Set(themes).size,9);assert.equal(sceneMusic('menu',g,rooms),'menu');g.finish();assert.equal(sceneMusic('game',g,rooms),'ending');assert.equal(Object.keys(musicScores).length,11);assert.equal(new Set(Object.values(musicScores).map(s=>JSON.stringify([s.melody,s.bass,s.drums]))).size,11);for(const s of Object.values(musicScores)){assert.ok(s.melody.length>=16);assert.equal(s.chords.length,4);assert.ok(s.bpm>60&&s.bpm<180);}
});
