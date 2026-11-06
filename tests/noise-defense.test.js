import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';
import {stepBoss,stepProjectiles} from '../boss.js';import {strikeInfoshum,NOISE_TIME} from '../infoshum-combat.js';
function ready(){const g=new Game({story:false,testingInvulnerable:true});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.boss.noticeTime=0;return g;}
function hit(g,m){Object.assign(g.player,{x:m.terminalX-34,y:m.terminalY-46,attack:.18,swing:g.player.swing+1});return strikeInfoshum(g,{x:g.player.x+16,y:g.player.y-2,w:54,h:54});}
test('one monitor needs two windows; repeated swipes cannot bypass its six-second protection',()=>{const g=ready(),m=g.boss.network.monitors[0];m.state='open';m.openTime=5;assert.ok(hit(g,m));assert.equal(m.armor,1);assert.equal(g.boss.hp,30);assert.equal(g.boss.network.defeatedMonitors,0);m.state='open';assert.equal(hit(g,m),false);assert.equal(m.armor,1);for(let i=0;i<370;i++)stepBoss(g,1/60);m.state='open';m.openTime=5;assert.ok(hit(g,m));assert.equal(m.armor,0);assert.equal(m.state,'broken');assert.equal(g.boss.hp,28);});
test('network attacks twice before travelling and marks a different neighboring platform',()=>{const g=ready(),n=g.boss.network;let attacks=0,sawTwoZones=false;for(let i=0;i<1200;i++){stepBoss(g,1/60);if(n.extraTargets.length)sawTwoZones ||= n.extraTargets[0].platformId!==n.target.platformId;attacks+=g.events.filter(e=>e.type==='bossCast'&&e.boss==='infoshum').length;g.events=[];if(n.mode==='transit')break;}assert.ok(attacks>=2);assert.ok(sawTwoZones);assert.ok(new Set(g.bolts.filter(b=>b.kind==='dataRain').map(b=>b.stopY)).size>=2);});
test('the fifth freed attack erupts through two platforms; its warning leaves jumping and Shift safe',()=>{for(const evade of['none','jump','dash']){const g=ready(),n=g.boss.network;g.testingInvulnerable=false;g.player.inv=0;n.stage='free';n.mode='rest';n.timer=0;n.cycle=4;stepBoss(g,1/60);assert.equal(n.mode,'platformWarning');assert.equal(g.health,4);const target={...n.target};if(evade==='dash')g.player.dash=.2;if(evade==='jump')g.player.y-=90;n.timer=0;stepBoss(g,1/60);assert.equal(g.bolts.filter(b=>b.kind==='platformPulse').length,2);stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.equal(g.health,evade==='none'?3:4);n.timer=0;stepBoss(g,1/60);assert.equal(n.mode,'weak');assert.equal(n.timer,2.25);assert.equal(n.target.x,target.x);}});

// «Помехи» moved here from the Agitator chase: they rise only in Infoshum's final phase.
function freed(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.boss.noticeTime=0;const n=g.boss.network;for(const m of n.monitors){m.state='open';m.openTime=5;m.armor=1;hit(g,m);}for(let i=0;i<60*3&&n.stage!=='free';i++)stepBoss(g,1/60);return g;}
test('interference does not exist while the monitors stand and rises through the final phase',()=>{
 const g=ready(),n=g.boss.network;for(let i=0;i<600;i++)stepBoss(g,1/60);assert.equal(n.stage,'network');assert.ok(!n.noise);
 const f=freed(),m=f.boss.network;assert.equal(m.stage,'free');assert.equal(m.noise,0);for(let i=0;i<120;i++)stepBoss(f,1/60);assert.ok(Math.abs(m.noise-2/NOISE_TIME)<.01);
});
test('100 percent interference in the final phase costs one life; test protection buys more time instead',()=>{
 for(const testing of[false,true]){const g=freed(testing),n=g.boss.network;g.mode='playing';n.noiseTime=NOISE_TIME-.001;stepBoss(g,1/60);
  assert.equal(g.lives,testing?3:2);assert.equal(g.mode,testing?'playing':'respawning');assert.ok(g.events.some(e=>e.type==='interferenceLost'));if(testing)assert.ok(n.noise<1);}
});
test('pause freezes the interference meter',()=>{const g=freed(),n=g.boss.network;g.mode='playing';for(let i=0;i<60;i++)g.step(1/60);const level=n.noise;g.mode='paused';for(let i=0;i<120;i++)g.step(1/60);assert.equal(n.noise,level);});
