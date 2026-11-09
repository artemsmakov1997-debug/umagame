import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {bossTargets} from '../target-highlight.js';
import {exposeAgitator,agitatorHitbox} from '../agitator-combat.js';import {exposeInfoshum,stormInfoshum} from '../infoshum-combat.js';
function arena(room){const g=new Game({story:false,cinematic:true});g.start();activateRoom(g,room);g.mode='playing';g.enemies=[];g.boss.active=true;g.boss.noticeTime=0;return g;}
test('Agitator: the robot is marked only in his openings — overheated body, turned back, screen on the tower',()=>{
 const g=arena(4),b=g.boss,n=b.broadcast;assert.equal(bossTargets(g).length,0,'a cool megaphone is not a target');
 n.mode='overheat';assert.deepEqual(bossTargets(g).map(m=>[m.id,m.x,m.y,m.w,m.h]),[['agitator',...Object.values(agitatorHitbox(b))]]);
 n.mode='volley';assert.equal(bossTargets(g).length,0);
 n.stage='rally';n.mode='walk';assert.equal(bossTargets(g).length,0);n.mode='ura';b.dir=1;const back=bossTargets(g)[0];assert.equal(back.id,'agitator-back');assert.ok(back.x+back.w<=b.x+b.w/2+1,'only the back half');
 n.stage='air';n.mode='idle';assert.equal(bossTargets(g)[0].id,'agitator-screen');n.mode='jump';assert.equal(bossTargets(g).length,0);
});
test('Infoshum: the screens his face is in, the stuck real figure and the spent core are marked',()=>{
 const g=arena(8),n=g.boss.network;assert.equal(bossTargets(g).length,0);exposeInfoshum(g);const ids=bossTargets(g).map(m=>m.id);assert.ok(ids.length>=1&&ids.every(id=>id.startsWith('screen')),'face screens');
 n.stage='noise';n.figures=[];exposeInfoshum(g);assert.deepEqual(bossTargets(g).map(m=>m.id),['figure']);
 stormInfoshum(g);assert.equal(n.stage,'storm');assert.equal(bossTargets(g).length,0,'not while he is high in the storm');exposeInfoshum(g);assert.deepEqual(bossTargets(g).map(m=>m.id),['core']);
});
