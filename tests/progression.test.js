import {rooms as campaignRooms} from '../level.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,platforms} from '../engine.js';
import {enemy,createNotebooks} from '../level.js';
import {chooseFakeLanding} from '../enemy-traversal.js';
import {locomotionFrame} from '../monster-animation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(story=true){const g=new Game({story});g.start();if(story){g.finishWakeup();g.advanceDialogue(true);}g.enemies=[];g.fishes=[];g.soups=[];g.tutorial.complete=true;return g;}
function stand(g,room,index=0,x=45){const s=platforms.find(s=>s.room===room&&s.index===index);Object.assign(g.player,{x:campaignRooms[room].x+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,inv:0,attack:0,cooldown:0,dash:0,sneaking:false});g.room=room;g.checkpoint=room;g.unlockForRoom(room);g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);}
test('Clickbait takes one stock at every heart count and stays revealed after checkpoint recovery',()=>{
 for(const health of [1,2,3,4]){const g=ready(false);stand(g,7,12,1510);g.health=health;g.enemies=[enemy('clickbait',7,1510,12,{active:true,noticed:true})];tick(g,45);assert.equal(g.mode,'respawning');assert.equal(g.lives,2);assert.equal(g.health,0);assert.equal(g.events.filter(e=>e.type==='lifeLost').length,1);tick(g,75);assert.equal(g.mode,'playing');assert.equal(g.health,4);const bait=g.enemies.find(e=>e.type==='clickbait'&&e.platformIndex===12);assert.equal(bait.revealed,true);assert.equal(bait.state,'patrol');}
});
test('the last full-life Clickbait capture ends the game even with all four hearts',()=>{
 const g=ready(false);stand(g,5,1,350);g.lives=1;g.enemies=[enemy('clickbait',5,350,1,{active:true,noticed:true})];tick(g,45);assert.equal(g.mode,'lost');assert.equal(g.lives,0);assert.equal(g.health,0);tick(g,100);assert.equal(g.events.filter(e=>e.type==='lost').length,1);
});
test('paw, dash and stealth work in the initial quiet room with keyboard and joystick input',()=>{
 const g=ready(false);assert.deepEqual(g.abilities,{attack:true,dash:true,sneak:true});g.step(1/60,{attack:true,dash:true});assert.equal(g.player.swing,1);assert.ok(g.player.dash>0);tick(g,40);g.step(1/60,{down:true,axisX:.5});assert.equal(g.player.sneaking,true);assert.equal(g.player.h,26);
});
test('all abilities remain available when every optional notebook is skipped',()=>{
 const g=ready(false);for(const room of[0,1,3,5,7]){stand(g,room,0,160);tick(g,1);assert.deepEqual(g.abilities,{attack:true,dash:true,sneak:true});}assert.equal(g.notebooks.find(n=>n.id==='paw').taken,false);
});
test('new skills and read notebooks survive a lost life; restart keeps all actions available',()=>{
 const g=ready();stand(g,3,0,70);tick(g,1);assert.equal(g.dialogue.id,'notebook:roofs');assert.equal(g.abilities.sneak,true);g.advanceDialogue(true);g.unlockForRoom(5);g.loseLife();tick(g,70);assert.equal(g.abilities.sneak,true);assert.equal(g.notebooks.find(n=>n.id==='roofs').taken,true);g.start();assert.deepEqual(g.abilities,{attack:true,dash:true,sneak:true});assert.ok(g.notebooks.every(n=>!n.taken));
});
test('every intermediate Yuri comment waits for its notebook; entering a chapter stays silent',()=>{
 const g=ready();for(const room of [1,3,5,7]){stand(g,room,0,215);tick(g,1);assert.equal(g.dialogue,null);}assert.ok(!g.seenScenes.has('informant'));const note=g.notebooks.find(n=>n.id==='dimension');stand(g,7,0,85);tick(g,1);assert.equal(note.taken,true);assert.equal(g.dialogue.id,'notebook:dimension');const snapshot=JSON.stringify(g);tick(g,90,{right:true});assert.equal(JSON.stringify(g),snapshot);g.advanceDialogue(true);tick(g,1);assert.equal(g.dialogue,null);
});
test('boss records wait half a second, stay optional, and are collected exactly once',()=>{
 const g=ready();stand(g,2,4,760);g.completeChapter(2);assert.equal(g.dialogue,null);const note=g.notebooks.find(n=>n.id==='record1');assert.equal(note.readyAt,.5);g.soups=[{x:g.player.x+17,y:g.player.y+24,taken:false}];tick(g,10);assert.equal(g.dialogue,null);assert.equal(g.soups[0].taken,true);tick(g,25);assert.equal(g.dialogue.id,'notebook:record1');g.advanceDialogue(true);tick(g,50);assert.equal(g.dialogue,null);assert.equal(g.events.filter(e=>e.type==='notebook'&&e.id==='record1').length,1);
});
test('notebooks lie on real accessible platforms, and optional records cannot unlock before their boss is defeated',()=>{
 const notes=createNotebooks();assert.equal(notes.length,14);assert.equal(new Set(notes.map(n=>n.id)).size,notes.length);for(const n of notes){const s=platforms.find(s=>s.room===n.room&&s.index===n.index);assert.ok(n.x>=s.x&&n.x<=s.x+s.w);assert.equal(n.y,s.y-23);if(n.bossRecord)assert.equal(n.readyAt,Infinity);}
});
test('Fakenews actually jumps the gap onto another platform, then updates its patrol bounds',()=>{
 const g=ready(false);stand(g,1,1,300);const e=enemy('fakenews',1,135,0,{active:true,noticed:true,jumpCooldown:0,timer:99});g.enemies=[e];const target=chooseFakeLanding(g,e);assert.equal(target.platform.index,1);tick(g,1);assert.equal(e.jumpPhase,'prepare');tick(g,12);assert.equal(e.jumpPhase,'air');assert.ok(e.vy<0);const y=e.y;tick(g,15);assert.ok(e.y<y);for(let i=0;i<100&&e.jumpPhase!=='land';i++)tick(g,1);assert.equal(e.jumpPhase,'land');assert.equal(e.platformIndex,1);assert.equal(e.y+e.h,345);assert.equal(e.origin,campaignRooms[1].x+268);assert.equal(e.end,campaignRooms[1].x+324);assert.ok(e.x>=e.origin&&e.x<=e.end);assert.ok(g.events.some(e=>e.type==='fakeLand'));
});
test('jumping Fakenews freezes in the pause menu, has rise/fall poses and still lands after a nonlethal hit',()=>{
 const g=ready(false);stand(g,1,1,300);const e=enemy('fakenews',1,135,0,{active:true,noticed:true,jumpCooldown:0,hp:4,maxHp:4,timer:99});g.enemies=[e];tick(g,15);assert.equal(e.jumpPhase,'air');const rise=locomotionFrame(e.type,g.time,e);assert.equal(rise.index,4);g.mode='paused';const snapshot=JSON.stringify(g);tick(g,120);assert.equal(JSON.stringify(g),snapshot);g.mode='playing';g.hitEnemy(e);tick(g,36);assert.equal(locomotionFrame(e.type,g.time,e).index,5);for(let i=0;i<100&&e.jumpPhase!=='land';i++)tick(g,1);assert.equal(e.platformIndex,1);assert.equal(e.y+e.h,345);assert.equal(e.hp,3);
});
test('Fakenews rejects platforms outside its physical reach rather than teleporting to the player',()=>{
 const g=ready(false);stand(g,1,6,1900);const e=enemy('fakenews',1,20,0,{active:true,noticed:true,jumpCooldown:0});const target=chooseFakeLanding(g,e);if(target){assert.ok(target.walkTarget!==undefined||Math.abs(target.vx)<=250);assert.ok(target.platform.y-(e.y+e.h)>=-110);if(target.walkTarget===undefined)assert.ok(Math.abs(target.x-e.x)<=280);}assert.notEqual(target?.platform.index,6);
});
test('all four walking monsters use distinct articulated gait frames; hurt and stationary states keep their own art',()=>{
 for(const id of ['fakenews','inflator','informant','panicker']){const frames=[0,.15,.3,.45].map(walkTime=>locomotionFrame(id,0,{moving:true,state:'patrol',walkTime}));assert.equal(new Set(frames.map(f=>f.box.join())).size,4,id);assert.ok(frames.every(f=>f.asset==='gaits'));assert.equal(locomotionFrame(id,0,{moving:false,state:'patrol'}),null);assert.equal(locomotionFrame(id,0,{moving:true,state:'patrol',hurtTime:.1}),null);assert.equal(locomotionFrame(id,0,{moving:true,state:'windup'}),null);}
});
