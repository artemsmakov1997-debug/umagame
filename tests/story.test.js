import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,WORLD,LAST_ROOM,FINAL_X,rooms,platforms} from '../engine.js';
import {enemy,createEnemies} from '../level.js';
import {scenes} from '../story.js';
import {damageBoss,castAttack,stepBoss} from '../boss.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function stand(g,room,index=2,x=604){const s=platforms.find(p=>p.room===room&&p.index===index);Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,vx:0,vy:0,grounded:true});g.room=room;}
function ready(){const g=new Game();g.start();g.advanceDialogue(true);g.enemies=[];return g;}
test('five distinct chapters introduce the approved monsters in order',()=>{
 assert.equal(rooms.length,5);assert.equal(new Set(rooms.map(r=>r.theme)).size,5);
 const enemies=createEnemies();for(const [type,first]of [['infonoise',0],['clickbait',1],['headline',2],['panicker',3]])assert.equal(Math.min(...enemies.filter(e=>e.type===type).map(e=>e.room)),first);
 assert.ok(enemies.filter(e=>e.room===0).every(e=>e.type==='infonoise'));
 assert.equal(WORLD,WIDTH*5);assert.notDeepEqual(platforms.filter(p=>p.room===0).map(p=>p.y),platforms.filter(p=>p.room===1).map(p=>p.y));
});
test('opening is mandatory on a fresh game and fully freezes simulation',()=>{
 const g=new Game();g.start();assert.equal(g.mode,'dialogue');assert.equal(g.dialogue.id,'intro');assert.equal(scenes.intro.pages.length,4);
 const before=JSON.stringify(g);tick(g,120,{right:true,jump:true,attack:true,dash:true});assert.equal(JSON.stringify(g),before);
 for(let i=0;i<3;i++){g.advanceDialogue();assert.equal(g.mode,'dialogue');assert.equal(g.dialogue.page,i+1);}g.advanceDialogue();assert.equal(g.mode,'playing');assert.equal(g.dialogue,null);assert.equal(g.clock,900);assert.equal(g.player.x,45);
});
test('unknown monsters stay dormant until Yuri introduces them; each introduction occurs once',()=>{
 const g=new Game();g.start();g.advanceDialogue(true);const e=g.enemies[0],timer=e.timer;tick(g,150);assert.equal(e.timer,timer);assert.equal(g.bolts.length,0);
 Object.assign(g.player,{x:90,y:255,inv:0});const clock=g.clock;tick(g,1);assert.equal(g.dialogue.id,'infonoise');assert.equal(g.clock,clock);tick(g,100);assert.equal(g.bolts.length,0);
 g.advanceDialogue(true);tick(g,3);assert.equal(g.dialogue,null);assert.ok(e.timer<timer);assert.ok(g.seenScenes.has('infonoise'));
});
test('later chapters are frozen while Uma is elsewhere',()=>{
 const g=new Game({story:false});g.start();const later=g.enemies.filter(e=>e.room>0).map(e=>[e.id,e.x,e.timer,e.state]);tick(g,20);assert.deepEqual(g.enemies.filter(e=>e.room>0).map(e=>[e.id,e.x,e.timer,e.state]),later);
});
test('a first encounter interrupts play safely before Clickbait can swallow Uma',()=>{
 const g=ready();g.relays[0].hp=0;stand(g,1,1,310);g.seenScenes.add('arrival1');g.enemies=[enemy('clickbait',1,365,1)];tick(g,1);assert.equal(g.dialogue.id,'clickbait');assert.equal(g.swallow,null);assert.equal(g.enemies[0].state,'lure');g.advanceDialogue(true);tick(g,1);assert.equal(g.enemies[0].state,'windup');
});
test('breaking the newsroom relay finds the notebook and starts the clue scene',()=>{
 const g=ready();stand(g,0);g.relays[0].hp=1;g.step(1/60,{attack:true});assert.equal(g.relays[0].hp,0);assert.equal(g.clueFound,true);assert.equal(g.dialogue.id,'chapter0');assert.equal(g.people.filter(p=>p.rescued).length,0);
});
test('a rescued journalist, completed scenes and open gates survive checkpoint retry',()=>{
 const g=ready();g.relays[0].hp=0;g.checkpoint=1;stand(g,1);g.seenScenes.add('arrival1');g.relays[1].hp=1;g.step(1/60,{attack:true});assert.equal(g.dialogue.id,'chapter1');assert.equal(g.people.find(p=>p.id==='reporter').rescued,true);
 g.advanceDialogue(true);g.lives=1;g.player.inv=0;g.hurt();assert.equal(g.mode,'lost');g.retry();assert.equal(g.mode,'playing');assert.equal(g.dialogue,null);assert.equal(g.relays[1].hp,0);assert.ok(g.people.find(p=>p.id==='reporter').rescued);assert.ok(g.seenScenes.has('intro')&&g.seenScenes.has('chapter1'));
});
test('chapter arrival is delivered once and takes no gameplay time',()=>{
 const g=ready();g.relays[0].hp=0;stand(g,1,0,45);const clock=g.clock;tick(g,1);assert.equal(g.dialogue.id,'arrival1');assert.equal(g.clock,clock);g.advanceDialogue(true);tick(g,1);assert.equal(g.dialogue,null);assert.equal(g.mode,'playing');
});
test('soup explanation freezes its own buff instead of spending it while reading',()=>{
 const g=ready();stand(g,0,0,45);g.lives=2;g.soups=[{x:62,y:279,taken:false}];tick(g,1);assert.equal(g.dialogue.id,'soup');assert.equal(g.lives,3);assert.equal(g.player.powerTime,10);tick(g,180);assert.equal(g.player.powerTime,10);g.advanceDialogue(true);tick(g,60);assert.ok(Math.abs(g.player.powerTime-9)<.01);
});
test('printing-house belts move Uma and preserve jump control',()=>{
 const g=ready();g.relays.slice(0,2).forEach(r=>r.hp=0);g.seenScenes.add('arrival2');stand(g,2,1,325);const x=g.player.x;tick(g,30);assert.ok(g.player.x>x+9&&g.player.x<x+11);g.step(1/60,{jump:true});assert.ok(g.player.vy<0);
});
test('saved colleagues provide real, distinct boss assistance',()=>{
 const g=ready();g.relays.forEach(r=>r.hp=0);g.people.forEach(p=>p.rescued=p.id!=='yuri');g.boss.active=true;g.boss.ability='summon';castAttack(g);assert.equal(g.enemies.length,1);assert.ok(g.events.some(e=>e.type==='bossAssist'&&e.who==='reporter'));
 g.boss.state='casting';g.boss.timer=0;stepBoss(g,1/60);assert.equal(g.boss.state,'recover');assert.ok(g.boss.timer>1.7);g.lives=2;g.boss.hp=12;stepBoss(g,1/60);assert.equal(g.lives,3);stepBoss(g,1/60);assert.equal(g.lives,3);assert.ok(g.events.some(e=>e.type==='bossAssist'&&e.who==='crew'));
});
test('Source is introduced at the final tower, then victory returns to the newsroom',()=>{
 const g=ready();g.relays.forEach(r=>r.hp=0);g.seenScenes.add('arrival4');stand(g,LAST_ROOM);g.step(1/60);assert.equal(g.boss.active,true);assert.equal(g.dialogue.id,'source');g.advanceDialogue(true);
 g.boss.hp=1;g.boss.cooldown=0;g.boss.state='recover';assert.equal(damageBoss(g,1),true);assert.equal(g.dialogue.id,'ending');assert.equal(g.mode,'dialogue');assert.ok(g.people.find(p=>p.id==='yuri').rescued);const clock=g.clock;tick(g,100);assert.equal(g.clock,clock);
 for(let i=0;i<scenes.ending.pages.length;i++)g.advanceDialogue();assert.equal(g.mode,'won');assert.equal(g.dialogue,null);assert.ok(g.events.some(e=>e.type==='won'));g.start();assert.equal(g.dialogue.id,'intro');assert.ok(!g.people.some(p=>p.rescued));
});
test('skipping ending still completes the story; it cannot reopen the boss fight',()=>{
 const g=ready();g.boss.hp=1;g.boss.active=true;g.boss.state='recover';damageBoss(g,1);g.advanceDialogue(true);assert.equal(g.mode,'won');tick(g,90,{right:true,attack:true});assert.equal(g.boss.hp,0);
});
test('the entire five-chapter route, rescues and notebook are reachable through normal input',()=>{
 const g=new Game();g.start();g.enemies=[];let jumped=false;
 for(let i=0;i<5000&&g.player.x<FINAL_X+380&&g.mode!=='lost';i++){
  if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}
  const p=g.player,s=platforms.find(s=>Math.abs(p.y+p.h-s.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);let jump=false;
  if(p.grounded&&s&&p.x>s.x+s.w-50&&(s.index===0||s.index===1)){jump=!jumped;jumped=true;}else if(!p.grounded)jumped=false;
  g.step(1/60,{right:true,jump,attack:true});
 }
 assert.ok(g.player.x>FINAL_X+375);assert.equal(g.relays.filter(r=>r.hp===0).length,4);assert.equal(g.clueFound,true);assert.equal(g.people.filter(p=>p.rescued).length,3);assert.equal(g.checkpoint,LAST_ROOM);assert.ok(g.lives>0);
 for(const key of ['intro','chapter0','chapter1','chapter2','chapter3','arrival1','arrival2','arrival3','arrival4'])assert.ok(g.seenScenes.has(key),key);
});
