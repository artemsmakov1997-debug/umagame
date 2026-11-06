import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';
import {stepBoss,damageBoss,stepProjectiles,bossShielded} from '../boss.js';
import {strikeAgitator,antennaStation,WAVE_PERIOD,WAVE_WARNING,HOP_DURATION,HOLD_TIME} from '../agitator-combat.js';
import {jumpTo} from './navigation.js';
function ready(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,4);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function consoleHit(g,index){const at=antennaStation(g,g.boss.broadcast.antennas[index]);Object.assign(g.player,{x:at.x-32,y:at.y-48,grounded:true,supportId:at.platform.id,vx:0,vy:0,knock:0,attack:0,cooldown:0,dir:1});g.step(1/60,{attack:true});}
function chase(g){for(const i of[0,1,0,1,0,1]){consoleHit(g,i);tick(g,75);}while(g.boss.broadcast.stage==='break')g.step(1/60);return g.boss.broadcast;}
test('both antennas and all chase decks are reachable with ordinary jumps',()=>{const g=ready();g.boss.active=false;for(const i of[13,9,2,14,2,5,7,1,8,6,3,10,6,12,1])assert.ok(jumpTo(g,4,i),'rooftop deck '+i);assert.ok(g.platforms.filter(s=>s.room===4).every(s=>!s.motion));});
test('two three-hit consoles require alternating real paw attacks; the boss cannot be damaged under its main shield',()=>{
 const g=ready(),n=g.boss.broadcast;assert.ok(bossShielded(g));assert.equal(damageBoss(g,99,true),false);
 consoleHit(g,0);assert.equal(n.antennas[0].hits,1);tick(g,180);consoleHit(g,0);assert.equal(n.antennas[0].hits,1,'waiting alone cannot bypass the alternating shield');
 for(const i of[1,0,1,0,1]){consoleHit(g,i);tick(g,75);}while(n.stage==='break')g.step(1/60);
 assert.deepEqual(n.antennas.map(a=>a.hits),[3,3]);assert.equal(n.stage,'chase');assert.equal(g.boss.phase,2);assert.equal(bossShielded(g),false);assert.ok(g.relays.filter(d=>d.room===4).every(d=>d.hp===0));
});
test('repulsion is a real expanding wave, pushes only once and respects Shift',()=>{for(const dash of[0,.2]){const g=ready(),n=g.boss.broadcast,p=g.player;n.mode='rest';n.timer=9;p.dash=dash;p.knock=0;n.wave={x:p.x+17+100,y:p.y+24,radius:90,age:0,hit:false};stepBoss(g,1/60);assert.equal(p.knock>0,!dash);assert.ok(n.wave.hit);const x=p.vx;stepBoss(g,1/60);assert.equal(p.vx,x);}});
test('headlines are actual damaging and reflectable newspaper projectiles',()=>{const g=ready(false),n=g.boss.broadcast;for(let i=0;i<350;i++)stepBoss(g,1/60);assert.ok(g.bolts.some(b=>b.kind==='headline'&&Math.hypot(b.vx,b.vy)>200));g.bolts=[{room:4,kind:'headline',visual:'agitator',x:g.player.x,y:g.player.y,w:76,h:25,vx:0,vy:0,ttl:2}];g.player.inv=0;stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.equal(g.health,3);g.player.attack=.18;g.bolts=[{room:4,kind:'headline',visual:'agitator',x:g.player.x,y:g.player.y,w:76,h:25,vx:0,vy:0,ttl:2}];stepProjectiles(g,1/60,{x:g.player.x,y:g.player.y,w:54,h:54});assert.ok(g.bolts[0].friendly);});
test('eight real counters finish the chase and preserve the original interlude',()=>{const g=ready(),n=chase(g),positions=new Set();for(let i=0;i<8;i++){for(let f=0;f<90&&n.mode!=='hold';f++)g.step(1/60);positions.add(g.boss.platformIndex);const b=g.boss,s=g.platforms.find(s=>s.room===4&&s.index===b.platformIndex);Object.assign(g.player,{x:b.x-30,y:s.y-48,grounded:true,supportId:s.id,vx:0,vy:0,knock:0,cooldown:0,attack:0,dir:1});g.step(1/60,{attack:true});}assert.ok(positions.size>3);assert.equal(g.mode,'bossDefeat');assert.equal(g.bolts.length,0);g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'interlude');assert.equal(g.interlude.boss,'agitator');});


test('revisiting a completed arena preserves overloaded consoles and earned score',async()=>{const g=ready(),{scoreBreakdown}=await import('../finale.js');g.bossesDefeated.add('agitator');g.relays.filter(d=>d.room===4).forEach(d=>d.hp=0);const points=scoreBreakdown(g).total;activateRoom(g,4);assert.equal(g.boss.active,false);assert.ok(g.boss.broadcast.antennas.every(a=>a.hits===3));assert.equal(scoreBreakdown(g).total,points);});

test('the repulsion wave belongs to phase two: none under the shield, warned waves on a faster rhythm in the chase',()=>{
 const g=ready(),n=g.boss.broadcast,casts=[];for(let i=0;i<60*10;i++){stepBoss(g,1/60);for(const e of g.events)if(e.type==='bossCast')casts.push(e.ability);g.events=[];}
 assert.ok(!casts.includes('sonic'),'no wave in phase one');assert.equal(n.wave,null);
 chase(g);const times=[],warnings=[];g.player.inv=999;for(let i=0;i<60*12;i++){g.step(1/60);for(const e of g.events){if(e.type==='bossCast'&&e.ability==='sonic')times.push(g.time);if(e.type==='bossWarning'&&e.ability==='sonic')warnings.push(g.time);}g.events=[];}
 assert.ok(times.length>=3,'regular waves during the chase');for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-WAVE_PERIOD)<.05);
 assert.ok(WAVE_PERIOD<3.6,'more often than the old shield rhythm of 3.6 s');assert.ok(warnings.length>=times.length&&WAVE_WARNING>=.5,'each wave is warned');
});
test('the Agitator escapes faster: quicker hops and shorter holds',()=>{
 assert.ok(HOP_DURATION<1&&HOLD_TIME<2.6);const g=ready(),n=chase(g);g.player.inv=999;let hopStart=null,hop=0,holds=[],holdStart=null;
 for(let i=0;i<60*12;i++){const before=n.mode;g.step(1/60);if(before!=='hop'&&n.mode==='hop'){hopStart=g.time;if(holdStart!==null)holds.push(g.time-holdStart);}if(before==='hop'&&n.mode==='hold'){hop=g.time-hopStart;holdStart=g.time;}}
 assert.ok(Math.abs(hop-HOP_DURATION)<.05);assert.ok(holds.length&&holds.every(h=>Math.abs(h-HOLD_TIME)<.06));
});
test('the chase has no interference meter; pause freezes both phases and retry clears consoles and hits',()=>{
 const c=ready(),n0=chase(c);assert.equal('fill'in n0,false);assert.equal('elapsed'in n0,false);c.player.inv=999;tick(c,60*90);assert.equal(c.lives,3,'outlasting the chase costs nothing');
 for(const stage of['shield','chase']){const g=ready(),n=g.boss.broadcast;n.stage=stage;n.antennas[0].hits=1;n.antennas[0].locked=true;g.mode='paused';const before=JSON.stringify(g);tick(g,100,{attack:true});assert.equal(JSON.stringify(g),before);g.retryLocation();assert.equal(g.boss.broadcast.stage,'shield');assert.ok(g.boss.broadcast.antennas.every(a=>a.hits===0&&!a.locked));}
});
