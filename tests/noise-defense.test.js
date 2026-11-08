import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';
import {stepBoss} from '../boss.js';import {strikeInfoshum,exposeInfoshum,glassRect,coreBox,NOISE_TIME} from '../infoshum-combat.js';
// «Помехи» rise only in Infoshum's last phase, «Белый шум».
function swing(g,box){g.player.attack=.18;g.player.swing++;return strikeInfoshum(g,box);}
function noisePhase(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.boss.noticeTime=0;g.mode='playing';const b=g.boss,n=b.network;
 for(let i=0;i<3;i++){exposeInfoshum(g);swing(g,glassRect(n.monitors.find(m=>m.face===0)));for(let k=0;k<80&&n.stage==='network';k++)stepBoss(g,1/60);}
 for(let k=0;k<200&&n.stage!=='free';k++)stepBoss(g,1/60);for(let i=0;i<3;i++){exposeInfoshum(g);b.cooldown=0;swing(g,coreBox(b));for(let k=0;k<60&&n.stage==='free';k++)stepBoss(g,1/60);}return g;}
test('interference does not exist during the shell game and the cables, and rises steadily in «Белый шум»',()=>{
 const g=new Game({story:false,testingInvulnerable:true});g.start();activateRoom(g,8);g.boss.noticeTime=0;for(let i=0;i<600;i++)stepBoss(g,1/60);assert.ok(!g.boss.network.noise);
 const f=noisePhase(),n=f.boss.network;assert.equal(n.stage,'noise');const start=n.noise;for(let i=0;i<120;i++)stepBoss(f,1/60);assert.ok(Math.abs(n.noise-start-2/NOISE_TIME)<.002);
});
test('pause freezes the interference meter',()=>{const g=noisePhase(),n=g.boss.network;for(let i=0;i<60;i++)g.step(1/60);const level=n.noise;g.mode='paused';for(let i=0;i<120;i++)g.step(1/60);assert.equal(n.noise,level);});
