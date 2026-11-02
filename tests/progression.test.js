import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,platforms} from '../engine.js';
import {enemy,createNotebooks} from '../level.js';
import {chooseFakeLanding} from '../enemy-traversal.js';
import {locomotionFrame} from '../monster-animation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(story=true){const g=new Game({story});g.start();if(story){g.finishWakeup();g.advanceDialogue(true);}g.enemies=[];g.fishes=[];g.soups=[];g.tutorial.complete=true;return g;}
function stand(g,room,index=0,x=45){const s=platforms.find(s=>s.room===room&&s.index===index);Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,inv:0,attack:0,cooldown:0,dash:0,sneaking:false});g.room=room;g.checkpoint=room;g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);}
test('Clickbait takes exactly one entire life at every initial heart count, with one death event',()=>{
 for(const health of [1,2,3,4]){const g=ready(false);stand(g,2,1,350);g.health=health;const e=enemy('clickbait',2,350,1,{active:true,noticed:true});g.enemies=[e];tick(g,45);assert.equal(g.mode,'respawning');assert.equal(g.lives,2);assert.equal(g.health,0);assert.equal(g.events.filter(e=>e.type==='lifeLost').length,1);tick(g,75);assert.equal(g.mode,'playing');assert.equal(g.lives,2);assert.equal(g.health,4);assert.equal(g.swallow,null);const bait=g.enemies.find(e=>e.type==='clickbait');assert.equal(bait.revealed,true);assert.equal(bait.state,'patrol');}
});
test('the last full-life Clickbait capture ends the game even with all four hearts',()=>{
 const g=ready(false);stand(g,2,1,350);g.lives=1;g.enemies=[enemy('clickbait',2,350,1,{active:true,noticed:true})];tick(g,45);assert.equal(g.mode,'lost');assert.equal(g.lives,0);assert.equal(g.health,0);tick(g,100);assert.equal(g.events.filter(e=>e.type==='lost').length,1);
});
test('locked paw, dash and stealth cannot be activated from keyboard, joystick or gesture input',()=>{
 const g=ready(false),x=g.player.x;assert.deepEqual(g.abilities,{attack:false,dash:false,sneak:false});tick(g,10,{attack:true,dash:true,down:true,axisX:.5});assert.equal(g.player.swing,0);assert.equal(g.player.dashCooldown,0);assert.equal(g.player.sneaking,false);assert.equal(g.player.h,48);assert.ok(g.player.x-x<15);
});
test('abilities unlock by progress in order and cannot be missed by jumping over an optional notebook',()=>{
 const g=ready(false);stand(g,1,0,160);tick(g,1);assert.deepEqual(g.abilities,{attack:true,dash:false,sneak:false});assert.equal(g.notebooks.find(n=>n.id==='paw').taken,false);stand(g,2,0,160);tick(g,1);assert.deepEqual(g.abilities,{attack:true,dash:true,sneak:false});stand(g,4,0,160);tick(g,1);assert.equal(g.abilities.sneak,false);stand(g,5,0,160);tick(g,1);assert.equal(g.abilities.sneak,true);assert.equal(g.events.filter(e=>e.type==='ability').length,3);
});
test('new skills and read notebooks survive a lost life; restart locks them again',()=>{
 const g=ready();stand(g,5,0,70);tick(g,1);assert.equal(g.dialogue.id,'notebook:stealth');assert.equal(g.abilities.sneak,true);g.advanceDialogue(true);g.unlockForRoom(5);g.loseLife();tick(g,70);assert.equal(g.abilities.sneak,true);assert.equal(g.notebooks.find(n=>n.id==='stealth').taken,true);g.start();assert.deepEqual(g.abilities,{attack:false,dash:false,sneak:false});assert.ok(g.notebooks.every(n=>!n.taken));
});
test('every intermediate Yuri comment requires collecting a notebook; crossing rooms or seeing foes is silent',()=>{
 const g=ready();for(const room of [1,2,3,4,5,6]){stand(g,room,0,215);g.enemies=[enemy(room===1?'fakenews':'informant',room,365,1,{active:true,noticed:true,timer:99})];tick(g,1);assert.equal(g.dialogue,null);}assert.ok(!g.seenScenes.has('infoshum'));assert.ok(!g.seenScenes.has('informant'));
 const note=g.notebooks.find(n=>n.id==='tower');stand(g,6,0,85);tick(g,1);assert.equal(note.taken,true);assert.equal(g.dialogue.id,'notebook:tower');assert.equal(g.dialogue.pages.length,3);const snapshot=JSON.stringify(g);tick(g,90,{right:true});assert.equal(JSON.stringify(g),snapshot);g.advanceDialogue(true);tick(g,1);assert.equal(g.dialogue,null);
});
test('relay and soup events do not open narration; the dropped notebook waits half a second and is collected once',()=>{
 const g=ready();stand(g,2,8,513);g.relays[1].hp=0;g.completeChapter(2);assert.equal(g.dialogue,null);const note=g.notebooks.find(n=>n.id==='record2');assert.equal(note.readyAt,.5);g.soups=[{x:g.player.x+17,y:g.player.y+24,taken:false}];tick(g,10);assert.equal(g.dialogue,null);assert.equal(g.soups[0].taken,true);tick(g,25);assert.equal(g.dialogue.id,'notebook:record2');assert.equal(note.taken,true);g.advanceDialogue(true);tick(g,50);assert.equal(g.dialogue,null);assert.equal(g.events.filter(e=>e.type==='notebook'&&e.id==='record2').length,1);
});
test('notebooks lie on real accessible platforms, and optional records cannot unlock before their relay is cleared',()=>{
 const notes=createNotebooks();assert.equal(notes.length,15);assert.equal(new Set(notes.map(n=>n.id)).size,notes.length);for(const n of notes){const s=platforms.find(s=>s.room===n.room&&s.index===n.index);assert.ok(n.x>=s.x&&n.x<=s.x+s.w);assert.equal(n.y,s.y-23);if(n.relay)assert.equal(n.readyAt,Infinity);}
});
test('Fakenews actually jumps the gap onto another platform, then updates its patrol bounds',()=>{
 const g=ready(false);stand(g,1,1,340);const e=enemy('fakenews',1,135,0,{active:true,noticed:true,jumpCooldown:0,timer:99});g.enemies=[e];const target=chooseFakeLanding(g,e);assert.equal(target.platform.index,1);tick(g,1);assert.equal(e.jumpPhase,'prepare');tick(g,12);assert.equal(e.jumpPhase,'air');assert.ok(e.vy<0);const y=e.y;tick(g,15);assert.ok(e.y<y);for(let i=0;i<100&&e.jumpPhase!=='land';i++)tick(g,1);assert.equal(e.jumpPhase,'land');assert.equal(e.platformIndex,1);assert.equal(e.y+e.h,300);assert.equal(e.origin,WIDTH+313);assert.equal(e.end,WIDTH+429);assert.ok(e.x>=e.origin&&e.x<=e.end);assert.ok(g.events.some(e=>e.type==='fakeLand'));
});
test('jumping Fakenews freezes in the pause menu, has rise/fall poses and still lands after a nonlethal hit',()=>{
 const g=ready(false);stand(g,1,1,340);const e=enemy('fakenews',1,135,0,{active:true,noticed:true,jumpCooldown:0,hp:4,maxHp:4,timer:99});g.enemies=[e];tick(g,15);assert.equal(e.jumpPhase,'air');const rise=locomotionFrame(e.type,g.time,e);assert.equal(rise.index,4);g.mode='paused';const snapshot=JSON.stringify(g);tick(g,120);assert.equal(JSON.stringify(g),snapshot);g.mode='playing';g.hitEnemy(e);tick(g,36);assert.equal(locomotionFrame(e.type,g.time,e).index,5);for(let i=0;i<100&&e.jumpPhase!=='land';i++)tick(g,1);assert.equal(e.platformIndex,1);assert.equal(e.y+e.h,300);assert.equal(e.hp,3);
});
test('Fakenews rejects platforms outside its physical reach rather than teleporting to the player',()=>{
 const g=ready(false);stand(g,1,8,580);const e=enemy('fakenews',1,20,0,{active:true,noticed:true,jumpCooldown:0});const target=chooseFakeLanding(g,e);if(target){assert.ok(Math.abs(target.vx)<=250);assert.ok(target.platform.y-(e.y+e.h)>=-110);assert.ok(Math.abs(target.x-e.x)<=280);}assert.notEqual(target?.platform.index,8);
});
test('all four walking monsters use distinct articulated gait frames; hurt and stationary states keep their own art',()=>{
 for(const id of ['fakenews','inflator','informant','panicker']){const frames=[0,.15,.3,.45].map(walkTime=>locomotionFrame(id,0,{moving:true,state:'patrol',walkTime}));assert.equal(new Set(frames.map(f=>f.box.join())).size,4,id);assert.ok(frames.every(f=>f.asset==='gaits'));assert.equal(locomotionFrame(id,0,{moving:false,state:'patrol'}),null);assert.equal(locomotionFrame(id,0,{moving:true,state:'patrol',hurtTime:.1}),null);assert.equal(locomotionFrame(id,0,{moving:true,state:'windup'}),null);}
});
