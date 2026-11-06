import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {bossTargets} from '../target-highlight.js';
import {antennaStation} from '../agitator-combat.js';
function arena(room){const g=new Game({story:false,cinematic:true});g.start();activateRoom(g,room);g.mode='playing';g.enemies=[];g.boss.active=true;g.boss.noticeTime=0;return g;}
test('Agitator: only consoles that can be hit now are marked, exactly over their hit zone; the boss is marked while he holds in the chase',()=>{
 const g=arena(4),n=g.boss.broadcast;let marks=bossTargets(g);assert.equal(marks.length,2);
 const at=antennaStation(g,n.antennas[0]);assert.deepEqual(marks.find(m=>m.id==='antenna-0'),{id:'antenna-0',x:at.x-29,y:at.y-43,w:58,h:44,color:marks[0].color});
 n.antennas[0].hits=1;n.antennas[0].locked=true;marks=bossTargets(g);assert.deepEqual(marks.map(m=>m.id),['antenna-1'],'the locked console is not marked: alternate');
 n.antennas.forEach(a=>{a.hits=3;a.locked=false;});assert.equal(bossTargets(g).length,0);
 n.stage='chase';n.mode='hold';assert.deepEqual(bossTargets(g).map(m=>m.id),['agitator']);n.mode='hop';assert.equal(bossTargets(g).length,0);
});
test('Infoshum: open unshielded terminals and the lowered core are marked; nothing else',()=>{
 const g=arena(8),n=g.boss.network;assert.equal(bossTargets(g).length,0);
 const m=n.monitors[0];m.state='open';m.shieldTime=0;assert.deepEqual(bossTargets(g).map(x=>x.id),['terminal-'+m.index]);
 m.shieldTime=3;assert.equal(bossTargets(g).length,0,'a shielded terminal is not a target');
 n.stage='free';n.mode='weak';n.target={x:500,y:300};assert.deepEqual(bossTargets(g).map(x=>[x.id,x.x,x.y,x.w,x.h]),[['core',470,244,60,54]]);
 n.mode='rest';assert.equal(bossTargets(g).length,0);
});
