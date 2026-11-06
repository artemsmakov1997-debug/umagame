import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {rooms} from '../level.js';
import {stepBoss,damageBoss} from '../boss.js';
import {SPREADER_HP,WINDUP,STUN,FLOOR_Y,DASH_HITBOX,summonServants,stepServant,spreaderExposed} from '../spreader-combat.js';
import {bossTargets} from '../target-highlight.js';
import {jumpTo} from './navigation.js';
function ready(){const g=new Game({story:false,cinematic:true});g.start();g.mode='playing';activateRoom(g,2);g.testingInvulnerable=true;g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;return g;}
const ticks=(g,n)=>{for(let i=0;i<n;i++)stepBoss(g,1/60);};
const mode=g=>`${g.boss.fight.phase}:${g.boss.fight.mode}`;
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

test('two repeating phases: two bombing passes, then landing and two dashes with pauses before and after',()=>{
 const g=ready(),seen=[];let last='';
 for(let i=0;i<60*60&&seen.filter(s=>s==='air:enter').length<2;i++){stepBoss(g,1/60);const m=mode(g);if(m!==last){seen.push(m);last=m;}}
 assert.deepEqual(seen,['air:enter','air:bombing','air:turn','air:bombing','air:dive','ground:landed','ground:windup','ground:dash','ground:skid','ground:stunned','ground:windup','ground:dash','ground:skid','ground:stunned','ground:takeoff','air:enter']);
 assert.equal(g.boss.y,86);
});

test('carpet bombing: crouched under a shelter Uma is safe, in the open she is hit, Shift protects',()=>{
 for(const [spot,dash,expected] of [['under',0,0],['open',0,1],['open',.3,0]]){
  const g=ready();g.testingInvulnerable=false;until(g,'air:bombing');const t=table(g);
  if(spot==='under')floorAt(g,t.x+80,26),g.player.forcedCrouch=true;
  else floorAt(g,g.boss.x+g.boss.w/2-17);
  const f=g.boss.fight;f.leaflets=[{x:g.player.x+17,y:g.player.y-60,vy:250,sway:0,frame:0,landed:0,hit:false}];g.player.dash=dash;
  const h=g.health;for(let i=0;i<30;i++){g.player.dash=dash;ticks(g,1);}
  assert.equal(h-g.health,expected,spot+dash);
 }
});

test('leaflets come to rest on shelter tops and on the floor',()=>{
 const g=ready();until(g,'air:bombing');const t=table(g),f=g.boss.fight;g.boss.active=true;
 const mine=[{x:t.x+60,y:200,vy:250,sway:0,frame:0,landed:0,hit:false},{x:rooms[2].x+430,y:200,vy:250,sway:0,frame:0,landed:0,hit:false}];f.leaflets=[...mine];
 floorAt(g,rooms[2].x+10);for(let i=0;i<66;i++){f.timer=9;ticks(g,1);}
 assert.equal(mine[0].y,t.y);assert.equal(mine[1].y,FLOOR_Y);assert.ok(mine.every(l=>l.landed>0));
});

test('the boss takes exactly one paw hit per pause and none while flying or dashing',()=>{
 const g=ready();assert.equal(g.boss.hp,SPREADER_HP);until(g,'air:bombing');assert.equal(damageBoss(g,1),false);assert.equal(bossTargets(g).length,0);
 until(g,'ground:windup');assert.ok(spreaderExposed(g.boss));assert.deepEqual(bossTargets(g).map(t=>t.id),['spreader']);
 assert.equal(damageBoss(g,1),true);assert.equal(g.boss.hp,SPREADER_HP-1);assert.equal(damageBoss(g,1),false);assert.equal(bossTargets(g).length,0);
 until(g,'ground:dash');assert.equal(damageBoss(g,1),false);until(g,'ground:stunned');assert.equal(damageBoss(g,1),true);assert.equal(g.boss.hp,SPREADER_HP-2);
 assert.ok(WINDUP>=1.2&&STUN>=1.8);
});

test('a real paw swing lands during the stun',()=>{
 const g=ready();until(g,'ground:stunned');const b=g.boss;floorAt(g,b.x+b.w+4);g.player.dir=-1;g.player.cooldown=0;
 const hp=b.hp;g.step(1/60,{attack:true});assert.equal(b.hp,hp-1);
});

test('the dash hurts Uma on the floor and standing on a table; jumping from the table clears it',()=>{
 for(const [where,jump,dash,expected] of [['floor',false,0,1],['table',false,0,1],['table',true,0,0],['floor',false,.4,0]]){
  const g=ready();g.testingInvulnerable=false;until(g,'ground:windup');const b=g.boss,t=table(g,b.fight.dashDir>0?2:1);
  if(where==='floor')floorAt(g,t.x+t.w/2);else Object.assign(g.player,{x:t.x+t.w/2,y:t.y-48,h:48,grounded:true,supportId:t.id,inv:0});
  const h=g.health;let jumped=false;
  for(let i=0;i<60*4&&b.fight.mode!=='skid';i++){const input={};
   if(dash)g.player.dash=dash;
   if(jump&&!jumped&&b.fight.mode==='dash'&&Math.abs(b.x+b.w/2-(g.player.x+17))<150){input.jump=true;jumped=true;}
   g.step(1/60,input);if(g.mode!=='playing')break;}
  assert.equal(h-g.health,expected,where+jump+dash);
 }
 assert.ok(FLOOR_Y-DASH_HITBOX.h<364,'standing on a tabletop is inside the dash lane');
});

test('servants: two harass the air phase, one joins on landing, they wait out a sheltered Uma, die to a paw',()=>{
 const g=ready();ticks(g,2);assert.equal(g.enemies.filter(e=>e.type==='servant').length,2);
 g.enemies.forEach(e=>{e.dead=true;});until(g,'ground:landed');assert.equal(g.enemies.filter(e=>!e.dead).length,1);
 const h=ready(),t=table(h);floorAt(h,t.x+80,26);h.player.forcedCrouch=true;summonServants(h,1);const e=h.enemies[0];Object.assign(e,{spawnTime:0,timer:0,x:h.player.x+60,y:h.player.y-20});
 for(let i=0;i<120;i++)stepServant(h,e,1/60,{x:0,y:0,w:0,h:0});assert.equal(e.state,'patrol');assert.ok(e.y<h.player.y-40);
 h.player.forcedCrouch=false;for(let i=0;i<120&&e.state==='patrol';i++)stepServant(h,e,1/60,{x:0,y:0,w:0,h:0});assert.notEqual(e.state,'patrol');
 h.hitEnemy(e);assert.ok(e.dead);
});

test('on average two cycles: four hits defeat the boss, clearing servants and leaflets before the story',()=>{
 const g=ready();assert.equal(SPREADER_HP,4);ticks(g,2);
 for(let k=0;k<SPREADER_HP;k++){until(g,k%2?'ground:stunned':'ground:windup');damageBoss(g,1);}
 assert.equal(g.mode,'bossDefeat');assert.ok(g.enemies.every(e=>e.dead));assert.equal(g.boss.fight.leaflets.length,0);
 g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'interlude');
});

test('pause freezes the fight; a checkpoint retry restarts it from the air phase at full health',()=>{
 const g=ready();until(g,'ground:windup');g.mode='paused';const frozen=JSON.stringify(g);g.step(1/60,{dash:true});assert.equal(JSON.stringify(g),frozen);
 g.mode='playing';damageBoss(g,1);g.retryLocation();g.boss.noticeTime=0;ticks(g,2);assert.equal(g.boss.hp,SPREADER_HP);assert.equal(mode(g),'air:enter');
});
