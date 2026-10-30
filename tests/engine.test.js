import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,platforms,ladders,WIDTH,HEIGHT,WORLD,MAX_HEALTH} from '../engine.js';
import {enemy} from '../level.js';
import {abilities,planAttack,castAttack,stepBoss,damageBoss} from '../boss.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function stand(g,x=45,room=0,index=0){const s=platforms.find(s=>s.room===room&&s.index===index);Object.assign(g.player,{x,y:s.y-g.player.h,vy:0,vx:0,grounded:true});}
function bossGame(){const g=new Game();g.start();g.enemies=[];g.relays.forEach(r=>r.hp=0);g.checkpoint=2;stand(g,WIDTH*2+604,2,2);g.boss.active=true;g.boss.state='recover';g.boss.timer=2;return g;}
test('three connected rooms are traversable; both relay gates work and camera scrolls',()=>{
 const g=new Game();g.start();g.enemies=[];let jumped=false;
 for(let i=0;i<3000&&g.player.x<WORLD-200&&g.mode==='playing';i++){
  const p=g.player,s=platforms.find(s=>Math.abs(p.y+p.h-s.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);let jump=false;
  if(p.grounded&&s&&p.x>s.x+s.w-50&&(s.index===0||s.index===1)){jump=!jumped;jumped=true;}else if(!p.grounded)jumped=false;
  g.step(1/60,{right:true,jump,attack:true});
 }
 assert.ok(g.player.x>WORLD-205);assert.equal(g.relays.filter(r=>r.hp===0).length,2);assert.equal(g.checkpoint,2);assert.ok(g.camera>WIDTH);assert.ok(g.lives>0);
});
test('locked relay blocks every route into next room and opens after three separate hits',()=>{
 const g=new Game();g.start();g.enemies=[];stand(g,WIDTH-60,0,2);tick(g,80,{right:true});assert.ok(g.player.x+34<=WIDTH-12);
 stand(g,604,0,2);tick(g,65,{attack:true});assert.equal(g.relays[0].hp,0);stand(g,WIDTH-50,0,2);tick(g,50,{right:true});assert.equal(g.room,1);
});
test('lands, jumps, returns without drift and buffered jump works',()=>{const g=new Game();g.start();g.enemies=[];const x=g.player.x;g.step(1/60,{jump:true});assert.ok(g.player.vy<0);tick(g,65);assert.equal(g.player.y+48,303);assert.equal(g.player.x,x);g.player.y=253;g.player.vy=40;g.player.grounded=false;g.player.coyote=0;g.step(1/60,{jump:true});tick(g,4);assert.ok(g.player.vy<0);});
test('pause freezes every timer, windup, projectile and position',()=>{const g=bossGame();g.mode='paused';const before=JSON.stringify(g);tick(g,90,{right:true,dash:true});assert.equal(JSON.stringify(g),before);});
test('one swing cannot damage a multi-hit monster more than once',()=>{const g=new Game();g.start();g.enemies=[enemy('crawler',0,133,0,{speed:0})];stand(g,85);g.step(1/60,{attack:true});assert.equal(g.enemies[0].hp,1);tick(g,12);assert.equal(g.enemies[0].hp,1);tick(g,15);g.step(1/60,{attack:true});assert.equal(g.enemies[0].dead,true);assert.equal(g.kills,1);});
test('armor blocks frontal swats, stomp strips armor and bounces Uma',()=>{const g=new Game();g.start();const e=enemy('guard',0,133,0);g.enemies=[e];stand(g,85);g.step(1/60,{attack:true});assert.equal(e.hp,4);assert.equal(e.armor,true);Object.assign(g.player,{x:e.x,y:e.y-49,vy:150,attack:0});tick(g,2);assert.equal(e.armor,false);assert.equal(e.hp,3);assert.ok(g.player.vy<0);});
test('charger warns before a fast lunge and then recovers',()=>{const g=new Game();g.start();const e=enemy('charger',0,390,1);g.enemies=[e];stand(g,310,0,1);g.step(1/60);assert.equal(e.state,'windup');const x=e.x;tick(g,30);assert.equal(e.x,x);tick(g,18);assert.ok(e.x<x);tick(g,40);assert.ok(['recover','patrol','windup'].includes(e.state));});
test('flyer warns before firing an aimed projectile',()=>{const g=new Game();g.start();g.enemies=[enemy('flyer',0,470,1,{origin:420,end:570,timer:.1})];stand(g,330,0,1);tick(g,7);assert.equal(g.enemies[0].state,'windup');assert.equal(g.bolts.length,0);tick(g,38);assert.ok(g.bolts.length>0);assert.ok(g.bolts[0].vx<0);});
test('dash moves faster, protects from damage, and cannot bypass cooldown',()=>{const g=new Game();g.start();g.enemies=[];const x=g.player.x;g.step(1/60,{dash:true});g.hurt();assert.equal(g.lives,MAX_HEALTH);tick(g,9,{right:true});assert.ok(g.player.x-x>60);tick(g,8);const cooldown=g.player.dashCooldown;g.step(1/60,{dash:true});assert.equal(g.player.dash,0);assert.ok(g.player.dashCooldown<cooldown);});
test('fish collected once; eight fish heal once',()=>{const g=new Game();g.start();g.enemies=[];g.fish=7;g.lives=2;g.fishes=[{x:62,y:279,taken:false}];tick(g,1);assert.equal(g.fish,8);assert.equal(g.lives,3);tick(g,4);assert.equal(g.fish,8);assert.equal(g.lives,3);});
test('fall uses latest checkpoint and every ladder joins floor to desk',()=>{for(let room=0;room<3;room++){const g=new Game();g.start();g.enemies=[];g.relays.forEach(r=>r.hp=0);g.checkpoint=room;g.boss.hp=0;g.player.y=HEIGHT+50;tick(g,1);assert.equal(g.player.x,WIDTH*room+45);assert.equal(g.lives,3);g.boss.active=false;stand(g,ladders[room].x,room,6);tick(g,130,{up:true});assert.equal(g.player.y+48,275);tick(g,70,{down:true});assert.ok(g.player.y+48>355);}});
test('boss shield blocks melee, recovery allows one damage per swing',()=>{const g=bossGame();g.boss.state='windup';g.boss.timer=5;g.step(1/60,{attack:true});assert.equal(g.boss.hp,24);tick(g,25);g.boss.state='recover';g.boss.timer=2;g.step(1/60,{attack:true});assert.equal(g.boss.hp,23);tick(g,10);assert.equal(g.boss.hp,23);});
test('all four boss abilities create different attacks; summons capped at three',()=>{for(const ability of abilities){const g=bossGame();g.boss.ability=ability;g.boss.aim={x:g.player.x,y:g.player.y};g.boss.targets=[1900,2000,2100];castAttack(g);assert.equal(g.boss.state,'casting');if(ability==='summon'){assert.equal(g.enemies.length,2);castAttack(g);castAttack(g);assert.equal(g.enemies.length,3);}else if(ability==='volley'){assert.equal(g.bolts.length,3);assert.equal(g.bolts[0].kind,'paper');}else if(ability==='wave')assert.equal(g.bolts[0].kind,'wave');else{assert.equal(g.bolts.length,3);assert.ok(g.bolts.every(b=>b.kind==='rain'&&b.vy>0));}}});
test('half health activates faster phase; warning precedes every cast',()=>{const g=bossGame();g.boss.hp=12;stepBoss(g,1/60);assert.equal(g.boss.phase,2);planAttack(g);assert.equal(g.boss.state,'windup');assert.equal(g.boss.timer,.7);assert.equal(g.bolts.length,0);stepBoss(g,.71);assert.equal(g.boss.state,'casting');assert.equal(g.bolts.length,3);});
test('a paper projectile can be reflected into shielded boss for two damage',()=>{const g=bossGame();g.boss.state='windup';g.boss.timer=5;g.bolts=[{kind:'paper',x:g.player.x+40,y:246,w:16,h:13,vx:-100,vy:0,ttl:5}];g.step(1/60,{attack:true});assert.ok(g.events.some(e=>e.type==='parry'));tick(g,40);assert.equal(g.boss.hp,22);});
test('ground wave cannot be reflected by holding attack',()=>{const g=bossGame();g.boss.timer=5;g.bolts=[{kind:'wave',x:g.player.x+6,y:263,w:32,h:12,vx:-10,vy:0,ttl:5}];g.step(1/60,{attack:true});assert.equal(g.lives,3);assert.equal(g.bolts.length,0);});
test('standing beside boss and holding attack is not a winning strategy',()=>{for(const y of [227,156]){const g=bossGame();g.player.y=y;tick(g,7200,{attack:true});assert.equal(g.mode,'lost');assert.ok(g.boss.hp>0);}});
test('checkpoint retry restores health and resets encounter, retaining unlocked relays',()=>{const g=bossGame();g.lives=1;g.player.inv=0;g.hurt();assert.equal(g.mode,'lost');g.boss.hp=6;g.retry();assert.equal(g.mode,'playing');assert.equal(g.lives,4);assert.equal(g.boss.hp,24);assert.equal(g.boss.active,false);assert.equal(g.player.x,WIDTH*2+45);assert.ok(g.relays.every(r=>r.hp===0));});
test('defeated boss wins and freezes timer; timeout loses',()=>{const g=bossGame();g.boss.hp=1;assert.equal(damageBoss(g,1),true);assert.equal(g.mode,'won');const time=g.clock;tick(g,50);assert.equal(g.clock,time);g.start();g.clock=.01;tick(g,1);assert.equal(g.mode,'lost');});

test('relay shield cannot be bypassed before its marked guardian is defeated',()=>{const g=new Game();g.start();const guard=g.enemies.find(e=>e.guardian&&e.room===0);g.enemies=[guard];stand(g,604,0,2);tick(g,120,{attack:true});assert.equal(g.relays[0].hp,3);guard.dead=true;tick(g,80,{attack:true});assert.equal(g.relays[0].hp,0);});
test('rain, like the ground wave, requires dodging instead of reflection',()=>{const g=bossGame();g.bolts=[{kind:'rain',x:g.player.x+7,y:g.player.y+5,w:17,h:26,vx:0,vy:100,ttl:2}];g.step(1/60,{attack:true});assert.equal(g.lives,3);assert.ok(!g.events.some(e=>e.type==='parry'));});
test('timed jumps and movement can beat both boss phases without invulnerability',()=>{
 const g=new Game();g.start();g.enemies=[];g.relays.forEach(r=>r.hp=0);g.checkpoint=2;stand(g,WIDTH*2+604,2,2);
 let rainTarget=null,lastTurn=-1;const casts=new Set();
 for(let i=0;i<12000&&g.mode==='playing';i++){
  const p=g.player,b=g.boss;let target=WIDTH*2+(b.state==='recover'&&p.y+48<230?612:604),jump=false,dash=false;
  if(b.turn!==lastTurn){lastTurn=b.turn;rainTarget=b.ability==='rain'?Math.max(WIDTH*2+530,p.x-48):null;}
  if(b.ability==='rain'&&b.state!=='recover'&&rainTarget!==null)target=rainTarget;
  const wave=g.bolts.find(v=>v.kind==='wave'&&Math.abs(v.x-p.x)<95&&v.x>p.x-20);
  if(p.grounded&&(wave||(b.ability==='wave'&&b.state==='windup'&&b.timer<.18)||p.y+48>301))jump=true;
  const incoming=g.enemies.find(e=>!e.dead&&Math.abs(e.x-p.x)<65&&Math.abs(e.y-p.y)<55);
  if(incoming&&p.grounded)jump=true;
 if(incoming&&b.state!=='recover')target=p.x+(incoming.x<p.x?-9:9);
  if(g.bolts.some(v=>!v.friendly&&v.kind==='rain'&&Math.abs(v.x-p.x)<30&&v.y>p.y-50&&v.y<p.y+48)&&p.dashCooldown===0)dash=true;
  g.step(1/60,{right:p.x<target-2,left:p.x>target+2,jump,dash,attack:true});
  for(const e of g.events)if(e.type==='bossCast')casts.add(e.ability);g.events=[];
 }
 assert.equal(g.mode,'won');assert.ok(g.lives>0);assert.equal(g.boss.phase,2);assert.equal(casts.size,4);
});
