import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {enemy,rooms} from '../level.js';
import {umaReaction} from '../uma-reactions.js';
import {spotlightSlow} from '../studio-monsters.js';
import {PAPARAZZI,stepPaparazzi} from '../paparazzi.js';
import {FREEZE_TIME} from '../botfarm.js';
import {botFrame,botfarmFrame} from '../botfarm-art.js';
const ticks=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(room=5){const g=new Game({story:false});g.start();activateRoom(g,room);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.player.inv=0;return g;}
function place(g,index,x){const s=g.platforms.find(s=>s.room===g.room&&s.index===index);Object.assign(g.player,{x:rooms[g.room].x+x,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,knock:0,attack:0,cooldown:0,dir:1});}
test('test protection is off by default and remains optional',()=>{const g=ready(1);assert.ok(!g.testingInvulnerable);g.hurt();assert.equal(g.health,3);g.testingInvulnerable=true;g.player.inv=0;g.hurt();assert.equal(g.health,3);});
test('three real ordinary paw swings break the farm; airborne bots freeze in place, then dissolve without contact damage',()=>{
 const g=ready(),farm=enemy('botfarm',5,1925,11,{active:true,noticed:true,timer:999});g.enemies=[farm];place(g,11,1895);g.player.inv=99;
 for(let k=0;k<2;k++){g.step(1/60,{attack:true});assert.equal(farm.hp,2-k);ticks(g,23);}
 const bot=enemy('bot',5,1830,11,{active:true,noticed:true,ownerId:farm.id,w:28,h:28,jumpPhase:'air',vx:112,vy:-200});bot.y=150;g.enemies.push(bot);
 g.step(1/60,{attack:true});assert.ok(farm.dead);assert.equal(farm.deathTime,1.1);assert.equal(botFrame(bot),6);assert.ok(bot.frozen);const xy=[bot.x,bot.y];assert.equal(bot.y,150,'no snap to the platform');
 const frozen=JSON.stringify(g);g.mode='paused';const paused=JSON.stringify(g);ticks(g,90);assert.equal(JSON.stringify(g),paused);g.mode='playing';assert.ok(frozen.length>0);
 ticks(g,Math.floor(FREEZE_TIME*60)-2);assert.deepEqual([bot.x,bot.y],xy);assert.ok(!bot.dead);assert.equal(botfarmFrame(farm),5);ticks(g,5);assert.ok(bot.dead);assert.equal(botFrame(bot),7);assert.equal(g.health,4);assert.equal(g.kills,1,'shutdown bots are not extra kills');ticks(g,70);assert.equal(farm.deathTime,0);assert.equal(bot.deathTime,0);
});
test('the red cone slows walking by exactly 45 percent, restores it outside and leaves Shift unchanged',()=>{
 const g=ready();place(g,3,610);const e=enemy('spotlight',5,600,4,{active:true,noticed:true,state:'burn',timer:99});e.beamX=g.player.x+17;e.x=e.beamX-e.w/2;g.enemies=[e];const x=g.player.x;
 ticks(g,6,{right:true});assert.ok(Math.abs(g.player.x-x-155*.55*.1)<.001);assert.equal(umaReaction(g.player,g).kind,'slow');assert.equal(spotlightSlow(g),.55);assert.ok(g.player.slowWalkTime>0);assert.equal(g.cuts.length,0);
 g.step(1/60,{right:true,dash:true});assert.equal(g.player.vx,430);assert.equal(umaReaction(g.player,g),null);
 place(g,3,700);g.player.dash=0;ticks(g,1,{right:true});assert.equal(g.player.vx,155);assert.equal(umaReaction(g.player,g),null);
});
test('wind uses the original bracing/tucked frames, and ends immediately with the gust',()=>{
 const g=ready(3),p=g.player;g.roofs.gust=true;g.roofs.wind.dir=-1;p.grounded=true;assert.deepEqual(umaReaction(p,g),{kind:'brace',frame:4,face:1});p.grounded=false;assert.equal(umaReaction(p,g).kind,'tuck');g.roofs.gust=false;assert.equal(umaReaction(p,g),null);p.dash=.2;g.roofs.gust=true;assert.equal(umaReaction(p,g),null);
});
test('a real camera flash plays recoil, closed eyes, reopening and ready using the approved hit sheet; pause and retry are clean',()=>{
 const g=ready(3),p=g.player;place(g,0,80);const e=enemy('paparazzi',3,200,0,{active:true,state:'charge',timer:0});stepPaparazzi(g,e,1/60,e.x-p.x,0);assert.equal(p.blindTime,PAPARAZZI.blind);assert.equal(umaReaction(p,g).frame,0);
 const frames=[];for(let i=0;i<70;i++){frames.push(umaReaction(p,g)?.frame);g.step(1/60);}
 assert.ok([0,3,4,5].every(f=>frames.includes(f)));assert.equal(p.flashReaction,0);p.flashReaction=.6;p.blindTime=.5;g.mode='paused';ticks(g,90);assert.equal(p.flashReaction,.6);g.retryLocation();assert.equal(p.flashReaction,0);assert.equal(p.blindTime,0);
});
