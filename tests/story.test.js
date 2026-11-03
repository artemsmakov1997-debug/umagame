import {rooms as campaignRooms} from '../level.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,WORLD,FINAL_X,LAST_ROOM,rooms,platforms,ladders} from '../engine.js';
import {enemy,createEnemies} from '../level.js';
import {scenes,evidence} from '../story.js';
import {damageBoss} from '../boss.js';
import {wakePose,hurtPose,traversalPose,emotionFrames,traversalFrames} from '../cat-animation.js';
import {monsterFrame,monsterReaction,motion} from '../monster-animation.js';
import {idleFrame,idlePlacement} from '../menu-animation.js';
import {stickVector} from '../touch-controls.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(){const g=new Game();g.start();g.finishWakeup();g.advanceDialogue(true);return g;}
function at(g,room,index=2,x=604){const s=platforms.find(p=>p.room===room&&p.index===index);Object.assign(g.player,{x:campaignRooms[room].x+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,climbing:false,knock:0,dash:0,inv:0});g.room=room;g.unlockForRoom(room);g.tutorial.complete=true;g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);}
function training(g){
 for(let i=0;i<300&&g.player.x<165;i++)g.step(1/60,{right:true});g.step(1/60,{right:true,jump:true});for(let i=0;i<150&&g.player.x<420;i++)g.step(1/60,{right:true});for(let i=0;i<130&&!g.tutorial.complete;i++)g.step(1/60,{up:true});
}
test('each chapter introduces its assigned species before its own miniboss arena',()=>{
 assert.equal(rooms.length,9);const roster=createEnemies();for(const [type,first]of [['fakenews',1],['copier',1],['censor',1],['informant',3],['inflator',3],['panicker',3],['cutter',5],['splicer',5],['injection',5],['echo',7],['clickbait',7],['static',7]])assert.equal(Math.min(...roster.filter(e=>e.type===type).map(e=>e.room)),first);assert.equal(WORLD,16128);
});
test('wake-up uses separate sleep, yawn and surprise frames without moving Uma or starting combat',()=>{
 const g=new Game();g.start();const x=g.player.x,y=g.player.y;assert.equal(wakePose(.2).name,'sleep');assert.equal(wakePose(2.5).name,'yawn');assert.equal(wakePose(3.5).name,'surprise');assert.equal(emotionFrames.length,8);tick(g,340,{right:true,attack:true});assert.equal(g.mode,'dialogue');assert.equal(g.dialogue.id,'intro');assert.equal(g.player.x,x);assert.equal(g.player.y,y);assert.ok(g.enemies.every(e=>!e.active));assert.equal('clock'in g,false);
});
test('intro remains two short pages; Yuri does not know where he is or what happened',()=>{
 const g=ready();assert.equal(scenes.intro.pages.length,2);assert.match(scenes.intro.pages[1],/не знаю/);for(const scene of Object.values(scenes))for(const text of scene.pages)assert.ok(text.length<=130,text);assert.equal(g.mode,'playing');assert.equal(g.room,0);assert.equal(g.player.swing,0);assert.ok(!('people'in g));
});
test('the tutorial teaches real walking, a gap jump and an actual ladder ascent in order',()=>{
 const g=ready();training(g);assert.equal(g.tutorial.complete,true);assert.equal(g.tutorial.step,3);assert.ok(g.tutorial.distance>=65);assert.ok(g.tutorial.jumped);assert.ok(g.tutorial.climbed>=65);assert.equal(g.player.y+g.player.h,ladders[0].y);assert.equal(g.health,4);assert.equal('clock'in g,false);assert.deepEqual(g.events.filter(e=>e.type==='lesson').map(e=>e.step),[1,2,3]);
});
test('down at a ladder descends instead of crouching, including a safe stop on the bottom rung',()=>{
 const g=ready();g.storyEnabled=false;training(g);const y=g.player.y;tick(g,20,{down:true});assert.equal(g.player.sneaking,false);assert.equal(g.player.climbing,true);assert.ok(g.player.y>y);tick(g,120,{down:true});assert.equal(g.player.y+g.player.h,ladders[0].y+ladders[0].h);assert.equal(g.health,4);
});
test('climbing alternates real paw frames by travelled distance and freezes on a rung',()=>{
 const g=ready();g.storyEnabled=false;g.player.x=420;g.player.y=317;g.player.grounded=true;tick(g,1,{up:true});const first=traversalPose(g.player);tick(g,12,{up:true});const next=traversalPose(g.player);assert.notEqual(first,next);tick(g,1,{});const pose=traversalPose(g.player),time=g.player.climbTime;tick(g,30,{});assert.equal(g.player.climbTime,time);assert.equal(traversalPose(g.player),pose);assert.equal(traversalFrames.length,8);
});
test('creeping selects different low walking poses; damage has its own reaction',()=>{
 const g=ready();g.abilities.sneak=true;tick(g,1,{down:true});assert.equal(traversalPose(g.player),0);tick(g,8,{down:true,right:true});assert.ok([1,2].includes(traversalPose(g.player)));const pose=traversalPose(g.player);tick(g,15,{down:true,right:true});assert.notEqual(traversalPose(g.player),pose);assert.equal(hurtPose(.5),6);assert.equal(hurtPose(.1),7);
});
test('no enemy activates during training; later enemies wait for their own trigger and warning',()=>{
 const g=ready();training(g);assert.ok(g.enemies.every(e=>!e.active));at(g,1,0,45);tick(g,1);assert.equal(g.dialogue,null);assert.ok(g.enemies.filter(e=>e.room===1).every(e=>!e.active));g.player.x=WIDTH+85;tick(g,1);assert.equal(g.dialogue.id,'notebook:paw');assert.ok(g.notebooks.find(n=>n.id==='paw').taken);assert.equal(g.enemies[0].active,false);g.advanceDialogue(true);g.player.x=WIDTH+95;tick(g,1);assert.equal(g.enemies[0].active,true);assert.ok(g.enemies[0].spawnTime>0);assert.equal(g.enemies[1].active,false);tick(g,35);assert.ok(g.enemies[0].noticed);assert.equal(g.dialogue,null);
});
test('dialogues freeze physics, enemies, camera transitions and all game time',()=>{
 const g=new Game();g.start();g.finishWakeup();g.transition={from:0,to:1,time:.2,duration:.85};const before=JSON.stringify(g);tick(g,150,{right:true,jump:true,attack:true});assert.equal(JSON.stringify(g),before);g.advanceDialogue();assert.equal(g.dialogue.page,1);g.advanceDialogue();assert.equal(g.mode,'playing');
});
test('entering a chapter is silent; only picking up its notebook opens Yuri commentary',()=>{
 const g=ready();at(g,1,0,45);tick(g,1);assert.equal(g.dialogue,null);g.player.x=WIDTH+85;const time=g.time;tick(g,1);assert.equal(g.dialogue.id,'notebook:paw');assert.equal(g.time,time);g.advanceDialogue(true);tick(g,1);assert.equal(g.dialogue,null);assert.equal(g.mode,'playing');
});
test('a defeated miniboss yields one record and an optional notebook that survive life loss',()=>{
 const g=ready();g.enemies=[];at(g,2,4,1400);g.checkpoint=2;g.completeChapter(2);assert.equal(g.dialogue,null);assert.equal(g.evidence[0].id,'autopublish');tick(g,40);assert.equal(g.dialogue.id,'notebook:record1');g.completeChapter(2);assert.equal(g.evidence.length,1);g.advanceDialogue(true);g.health=1;g.player.inv=0;g.hurt();tick(g,70);assert.equal(g.evidence.length,1);assert.ok(g.seenScenes.has('chapter1'));
});

test('printing belts and all other chapters are frozen until Uma enters them',()=>{
 const g=ready(),later=g.enemies.map(e=>[e.x,e.timer,e.active]);tick(g,120);assert.deepEqual(g.enemies.map(e=>[e.x,e.timer,e.active]),later);g.enemies=[];at(g,1,13,840);g.seenScenes.add('arrival1');const x=g.player.x;tick(g,30);assert.ok(g.player.x>x+9&&g.player.x<x+11);g.step(1/60,{jump:true});assert.ok(g.player.vy<0);
});
test('all monster archetypes use separate motion and damage states',()=>{
 for(const id of ['fakenews','informant']){assert.ok(motion[id]);assert.notEqual(monsterFrame(id,0,{moving:true,walkTime:0}),monsterFrame(id,0,{moving:true,walkTime:.2}));assert.equal(monsterFrame(id,0,{state:'windup'}),3);assert.equal(monsterFrame(id,0,{state:'casting'}),4);assert.equal(monsterFrame(id,0,{hurtTime:.2}),5);}
 for(const id of ['clickbait','inflator','panicker','infoshum']){assert.equal(monsterReaction(id,0,{noticeTime:.2}).kind,'notice');assert.equal(monsterReaction(id,0,{hurtTime:.2}).kind,'hit');assert.notDeepEqual(monsterReaction(id,0,{state:'patrol',moving:true,walkTime:0}).box,monsterReaction(id,0,{state:'patrol',moving:true,walkTime:.1}).box);}
});
test('menu idle cat still blinks, licks and grooms at a fixed ground registration',()=>{
 assert.equal(idleFrame(3.07).action,'blink');assert.equal(idleFrame(6.1).action,'lick');assert.equal(idleFrame(9.8).action,'groom');const base=idlePlacement(0,480);assert.deepEqual(idlePlacement(1.5,480),base);for(const time of [3.07,6.1,9.8,10.4]){const pose=idlePlacement(time,480);assert.equal(pose.groundX,base.groundX);assert.equal(pose.groundY,base.groundY);assert.equal(pose.scale,base.scale);}
});
test('joystick dead zone, diagonal clamp and proportional movement remain valid',()=>{
 assert.deepEqual(stickVector(3,2),{x:0,y:0});assert.deepEqual(stickVector(100,0),{x:1,y:0});assert.ok(Math.abs(Math.hypot(...Object.values(stickVector(100,100)))-1)<1e-8);assert.ok(Math.abs(stickVector(28.8,0).x-.5)<1e-8);
});
test('skipping every notebook never blocks the quiet-room tutorial exit',()=>{
 const g=ready();training(g);assert.equal(g.notebooks.some(n=>n.taken),false);for(let i=0;i<230&&g.room===0;i++)g.step(1/60,{right:true});while(g.mode==='loading')g.step(1/60);assert.equal(g.room,1);assert.equal(g.mode,'playing');assert.equal(g.notebooks.some(n=>n.taken),false);assert.equal(g.dialogue,null);
});

test('the five-slide finale reveals the source of noise and ends in Yuri embracing Uma',async()=>{
 const {endingSlides}=await import('../finale.js');const g=ready();g.enemies=[];at(g,LAST_ROOM,2,640);g.relays.forEach(r=>r.hp=0);g.boss.active=true;g.boss.hp=1;g.boss.cooldown=0;g.boss.state='recover';damageBoss(g,1);assert.equal(g.mode,'ending');assert.equal(g.truthFound,true);assert.match(endingSlides[0].text,/Инфошум распадается/);assert.match(endingSlides[3].text,/обнимает/);const time=g.time;tick(g,200);assert.equal(g.time,time);for(let i=0;i<5;i++)g.advanceEnding();assert.equal(g.mode,'won');g.start();assert.equal(g.mode,'waking');assert.equal(g.evidence.length,0);assert.equal(g.tutorial.complete,false);
});
