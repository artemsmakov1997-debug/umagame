import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {rooms} from '../level.js';
import {stepBoss,damageBoss} from '../boss.js';
import {SPREADER_HP,WINDUP,STUN,STUCK,HEAVY,FLOOR_Y,FLY_Y,DASH_HITBOX,BURST_RADIUS,summonServants,stepServant,spreaderExposed,exposeSpreader,spreaderPhase} from '../spreader-combat.js';
import {bossTargets} from '../target-highlight.js';
import {jumpTo} from './navigation.js';
function ready(){const g=new Game({story:false,cinematic:true});g.start();g.mode='playing';activateRoom(g,2);g.testingInvulnerable=true;g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;return g;}
const ticks=(g,n)=>{for(let i=0;i<n;i++)stepBoss(g,1/60);};
const mode=g=>`${g.boss.fight.phase}:${g.boss.fight.mode}`;
function next(g,target){for(let i=0;i<60*20&&mode(g)===target;i++)stepBoss(g,1/60);return until(g,target);}
function until(g,target,max=60*40){for(let i=0;i<max&&!(g.boss.fight&&mode(g)===target);i++)stepBoss(g,1/60);return mode(g);}
const table=(g,index=1)=>g.platforms.find(s=>s.id==='2:'+index);
const floorAt=(g,x,h=48)=>Object.assign(g.player,{x,y:FLOOR_Y-h,h,vx:0,vy:0,grounded:true,supportId:'2:0',inv:0,dash:0,knock:0,sneaking:h<48});

test('arena: floor, two crouch-height shelters and two side ledges reachable from the tables',()=>{
 const g=ready();assert.equal(rooms[2].width,864);const s=g.platforms.filter(s=>s.room===2);assert.equal(s.length,5);
 assert.deepEqual(s.filter(p=>p.shelter).map(p=>p.index),[1,2]);for(const t of s.filter(p=>p.shelter)){assert.equal(t.shelter,t.y+16);assert.ok(FLOOR_Y-t.shelter>26&&FLOOR_Y-t.shelter<48);}
 // A standing Uma hops onto a table from its edge (she cannot walk under it), then on to the side ledge.
 for(const [index,ledge,dir] of [[1,3,1],[2,4,-1]]){const h=ready();h.boss.active=false;const t=table(h,index);floorAt(h,dir>0?t.x-60:t.x+t.w+26);
  for(let i=0;i<70&&h.player.supportId!==t.id;i++)h.step(1/60,{right:dir>0,left:dir<0,jump:i<2});assert.equal(h.player.supportId,t.id);
  assert.ok(jumpTo(h,2,ledge),String(ledge));}
});

test('standing Uma stops at a shelter, crouched she passes and stays crouched beneath it',()=>{
 const g=ready();g.boss.active=false;const t=table(g);floorAt(g,t.x-40);
 for(let i=0;i<60;i++)g.step(1/60,{right:true});assert.ok(Math.abs(g.player.x+g.player.w-(t.x+4))<1);assert.equal(g.player.h,48);
 for(let i=0;i<60;i++)g.step(1/60,{right:true,down:true});assert.ok(g.player.x>t.x+4);assert.equal(g.player.h,26);
 for(let i=0;i<10;i++)g.step(1/60,{right:true});assert.equal(g.player.h,26);assert.ok(g.player.sneaking);
});

function flow(g,stop,max=60*90){const seen=[];let last='';for(let i=0;i<max&&!stop(seen);i++){stepBoss(g,1/60);const m=mode(g);if(m!==last){seen.push(m);last=m;}}return seen;}
const hurtCount=(g,run)=>{let n=0;const off=g.on?.('hurt',()=>n++);const h=g.health;run();return h-g.health;};

test('air phase: two bombing passes, collecting the print run, then he sinks beside Uma and is open',()=>{
 const g=ready();floorAt(g,rooms[2].x+430);
 const seen=flow(g,s=>s.includes('air:heavy'));
 assert.deepEqual(seen,['air:enter','air:bombing','air:turn','air:bombing','air:collect','air:sink','air:heavy']);
 const b=g.boss;assert.ok(spreaderExposed(b));assert.deepEqual(bossTargets(g).map(t=>t.id),['spreader']);
 const gap=Math.abs(b.x+b.w/2-(g.player.x+g.player.w/2));assert.ok(gap>40&&gap<200,String(gap));
 assert.ok(Math.abs(b.y+b.h-6-FLOOR_Y)<1,'rests on the floor Uma stands on');assert.ok(HEAVY>=2.2);
 // Without a hit he rises and bombs again.
 const more=flow(g,s=>s.includes('air:bombing'));assert.deepEqual(more,['air:heavy','air:rise','air:enter','air:bombing']);assert.ok(Math.abs(b.y-FLY_Y)<8);
});

test('bundles: a tabletop catches them, the floor burst hurts nearby, crouching under a table or Shift protects',()=>{
 for(const [spot,dash,expected] of [['under',0,0],['open',0,1],['open',.3,0],['far',0,0]]){
  const g=ready();g.testingInvulnerable=false;until(g,'air:bombing');const t=table(g),f=g.boss.fight;
  if(spot==='under'){floorAt(g,t.x+80,26);g.player.forcedCrouch=true;}else floorAt(g,rooms[2].x+430);
  const x=spot==='under'?t.x+t.w+20:spot==='far'?g.player.x+17+BURST_RADIUS+40:g.player.x+17+20;
  f.bundles=[{x,y:FLOOR_Y-6,vy:300}];
  const h=g.health;for(let i=0;i<10;i++){g.player.dash=dash;f.timer=9;ticks(g,1);}
  assert.equal(h-g.health,expected,spot+dash);
 }
 const g=ready();until(g,'air:bombing');const t=table(g),f=g.boss.fight;floorAt(g,rooms[2].x+10);f.bundles=[{x:t.x+60,y:t.y-20,vy:300}];
 const mine=f.bundles[0];for(let i=0;i<20;i++){f.timer=9;ticks(g,1);}assert.ok(mine.done);assert.ok(f.bursts.some(s=>s.table&&Math.abs(s.x-mine.x)<1));assert.equal(f.litter[t.index],true);
});

test('a direct bundle hits Uma even on a tabletop',()=>{
 const g=ready();g.testingInvulnerable=false;until(g,'air:bombing');const t=table(g),f=g.boss.fight;
 Object.assign(g.player,{x:t.x+80,y:t.y-48,h:48,grounded:true,supportId:t.id,inv:0,dash:0});f.bundles=[{x:t.x+97,y:t.y-90,vy:300}];
 const h=g.health;for(let i=0;i<20;i++){f.timer=9;ticks(g,1);}assert.equal(h-g.health,1);
});

test('collecting: leaflet streams fly from the floor to the boss and hurt on the way',()=>{
 const g=ready();g.testingInvulnerable=false;floorAt(g,rooms[2].x+430);until(g,'air:collect');const f=g.boss.fight;ticks(g,20);
 assert.ok(f.streams.length>=5);const b=g.boss;assert.ok(f.streams.every(s=>s.vy<0),'they rise to him');
 // Standing on a source she is hit.
 floorAt(g,rooms[2].x+432-17);const h=g.health;for(let i=0;i<40;i++)ticks(g,1);assert.ok(h-g.health>=1);
});

test('ground phase: dash from the far edge, stop just past Uma, crash, lie dizzy within reach',()=>{
 const g=ready();g.boss.hp=4;floorAt(g,rooms[2].x+300);const seen=flow(g,s=>s.filter(m=>m==='ground:stunned').length>=2);
 assert.deepEqual(seen,['ground:enter','ground:bombing','ground:dive','ground:landed','ground:windup','ground:dash','ground:crash','ground:stunned','ground:windup','ground:dash','ground:crash','ground:stunned']);
 const b=g.boss,gap=Math.abs(b.x+b.w/2-(g.player.x+17));assert.ok(gap<240,String(gap));assert.ok(spreaderExposed(b));assert.ok(WINDUP>=1.1&&STUN>=1.8);
});

test('the dash hurts on the floor and on a table; jumping off the table or Shift clears it',()=>{
 for(const [where,jump,dash,expected] of [['floor',false,0,1],['table',false,0,1],['table',true,0,0],['floor',false,.4,0]]){
  const g=ready();g.testingInvulnerable=false;g.boss.hp=4;until(g,'ground:windup');const b=g.boss,t=table(g,b.fight.dashDir>0?2:1);
  if(where==='floor')floorAt(g,t.x+t.w/2);else Object.assign(g.player,{x:t.x+t.w/2,y:t.y-48,h:48,grounded:true,supportId:t.id,inv:0});
  const h=g.health;let jumped=false;
  for(let i=0;i<60*4&&b.fight.mode!=='crash';i++){const input={};if(dash)g.player.dash=dash;
   if(jump&&!jumped&&b.fight.mode==='dash'&&Math.abs(b.x+b.w/2-(g.player.x+17))<150){input.jump=true;jumped=true;}
   g.step(1/60,input);if(g.mode!=='playing')break;}
  assert.equal(h-g.health,expected,where+jump+dash);
 }
 assert.ok(FLOOR_Y-DASH_HITBOX.h<364,'standing on a tabletop is inside the dash lane');
});

test('spear phase: aim at Uma, dive, stick in the surface with a shockwave, three dives then a bombing pass',()=>{
 const g=ready();g.boss.hp=2;floorAt(g,rooms[2].x+430);const seen=flow(g,s=>s.filter(m=>m==='spear:enter').length>=2);
 assert.deepEqual(seen.slice(0,8),['spear:enter','spear:bombing','spear:aim','spear:spear','spear:stuck','spear:pull','spear:aim','spear:spear']);
 assert.equal(seen.filter(m=>m==='spear:stuck').length,3);assert.ok(STUCK>=1.6);
 const h=ready();h.testingInvulnerable=false;h.boss.hp=2;floorAt(h,rooms[2].x+430);until(h,'spear:spear');const f=h.boss.fight;floorAt(h,f.aimX-17);
 const hp=h.health;for(let i=0;i<60&&f.mode!=='stuck';i++)ticks(h,1);assert.equal(f.mode,'stuck');assert.equal(hp-h.health,1,'standing still under the spear hurts');
 assert.equal(f.shocks.length,2);assert.ok(Math.abs(h.boss.y+h.boss.h-FLOOR_Y)<1);
});

test('a table catches the spear: he sticks in the tabletop',()=>{
 const g=ready();g.boss.hp=2;const t=table(g);Object.assign(g.player,{x:t.x+80,y:t.y-48,h:48,grounded:true,supportId:t.id,inv:0});
 until(g,'spear:stuck');assert.ok(Math.abs(g.boss.y+g.boss.h-t.y)<1);
});

test('one paw hit per opening, none in flight or during the dash; three phases of two hits',()=>{
 const g=ready();assert.equal(SPREADER_HP,6);floorAt(g,rooms[2].x+430);until(g,'air:bombing');assert.equal(damageBoss(g,1),false);assert.equal(bossTargets(g).length,0);
 until(g,'air:heavy');assert.equal(damageBoss(g,1),true);assert.equal(damageBoss(g,1),false);assert.equal(bossTargets(g).length,0);assert.equal(g.boss.hp,5);
 next(g,'air:heavy');assert.equal(damageBoss(g,1),true);assert.equal(spreaderPhase(g.boss),'ground');
 until(g,'ground:dash');assert.equal(damageBoss(g,1),false);until(g,'ground:stunned');assert.equal(damageBoss(g,2),true);assert.equal(g.boss.hp,2);assert.equal(spreaderPhase(g.boss),'spear');
 until(g,'spear:spear');assert.equal(damageBoss(g,1),false);next(g,'spear:stuck');assert.equal(damageBoss(g,1),true);assert.equal(g.boss.hp,1);
});

test('a real paw swing lands on the dizzy tube',()=>{
 const g=ready();g.boss.hp=4;until(g,'ground:stunned');const b=g.boss;floorAt(g,b.x+b.w+4);g.player.dir=-1;g.player.cooldown=0;
 const hp=b.hp;g.step(1/60,{attack:true});assert.equal(b.hp,hp-1);
});

test('exposeSpreader opens the current phase for scripted scenes',()=>{
 for(const [hp,m] of [[6,'air:heavy'],[4,'ground:stunned'],[2,'spear:stuck']]){const g=ready();g.boss.hp=hp;ticks(g,1);exposeSpreader(g);assert.equal(mode(g),m);assert.ok(spreaderExposed(g.boss));}
 const g=ready();ticks(g,1);exposeSpreader(g);assert.equal(damageBoss(g,99,true),true);assert.equal(g.mode,'bossDefeat');
});

test('servants: two harass the air phase, they wait out a sheltered Uma, die to a paw',()=>{
 const g=ready();ticks(g,2);assert.equal(g.enemies.filter(e=>e.type==='servant').length,2);
 const h=ready(),t=table(h);floorAt(h,t.x+80,26);h.player.forcedCrouch=true;summonServants(h,1);const e=h.enemies[0];Object.assign(e,{spawnTime:0,timer:0,x:h.player.x+60,y:h.player.y-20});
 for(let i=0;i<120;i++)stepServant(h,e,1/60,{x:0,y:0,w:0,h:0});assert.equal(e.state,'patrol');assert.ok(e.y<h.player.y-40);
 h.player.forcedCrouch=false;for(let i=0;i<120&&e.state==='patrol';i++)stepServant(h,e,1/60,{x:0,y:0,w:0,h:0});assert.notEqual(e.state,'patrol');
 h.hitEnemy(e);assert.ok(e.dead);
});

test('six hits through the three openings defeat the boss, clearing servants and bundles before the story',()=>{
 const g=ready();ticks(g,2);floorAt(g,rooms[2].x+430);
 for(const target of ['air:heavy','air:heavy','ground:stunned','ground:stunned','spear:stuck','spear:stuck']){assert.equal(next(g,target),target);assert.equal(damageBoss(g,1),true);}
 assert.equal(g.mode,'bossDefeat');assert.ok(g.enemies.every(e=>e.dead));assert.equal(g.boss.fight.bundles.length,0);
 g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'interlude');
});

test('pause freezes the fight; a checkpoint retry restarts it from the air phase at full health',()=>{
 const g=ready();until(g,'air:collect');g.mode='paused';const frozen=JSON.stringify(g);g.step(1/60,{dash:true});assert.equal(JSON.stringify(g),frozen);
 g.mode='playing';exposeSpreader(g);damageBoss(g,1);g.retryLocation();g.boss.noticeTime=0;ticks(g,2);assert.equal(g.boss.hp,SPREADER_HP);assert.equal(mode(g),'air:enter');
});
