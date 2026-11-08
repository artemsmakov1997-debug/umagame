import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {bossTargets} from '../target-highlight.js';
import {exposeAgitator,agitatorHitbox} from '../agitator-combat.js';import {exposeInfoshum} from '../infoshum-combat.js';
function arena(room){const g=new Game({story:false,cinematic:true});g.start();activateRoom(g,room);g.mode='playing';g.enemies=[];g.boss.active=true;g.boss.noticeTime=0;return g;}
test('Agitator: the robot is marked only in his openings — overheated body, turned back, screen on the tower',()=>{
 const g=arena(4),b=g.boss,n=b.broadcast;assert.equal(bossTargets(g).length,0,'a cool megaphone is not a target');
 n.mode='overheat';assert.deepEqual(bossTargets(g).map(m=>[m.id,m.x,m.y,m.w,m.h]),[['agitator',...Object.values(agitatorHitbox(b))]]);
 n.mode='volley';assert.equal(bossTargets(g).length,0);
 n.stage='rally';n.mode='walk';assert.equal(bossTargets(g).length,0);n.mode='ura';b.dir=1;const back=bossTargets(g)[0];assert.equal(back.id,'agitator-back');assert.ok(back.x+back.w<=b.x+b.w/2+1,'only the back half');
 n.stage='air';n.mode='idle';assert.equal(bossTargets(g)[0].id,'agitator-screen');n.mode='jump';assert.equal(bossTargets(g).length,0);
});
test('Infoshum: the real screen is never marked; the anchored core and the stuck real figure are',()=>{
 const g=arena(8),n=g.boss.network;assert.equal(bossTargets(g).length,0);exposeInfoshum(g);assert.equal(bossTargets(g).length,0,'finding the real screen is the puzzle');
 n.stage='free';n.mode='drift';assert.equal(bossTargets(g).length,0);exposeInfoshum(g);assert.deepEqual(bossTargets(g).map(m=>m.id),['core']);
 n.stage='noise';n.figures=[];exposeInfoshum(g);assert.deepEqual(bossTargets(g).map(m=>m.id),['figure']);
});
