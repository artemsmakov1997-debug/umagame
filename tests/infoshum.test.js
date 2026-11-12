import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';
import {strikeInfoshum,exposeInfoshum,crackInfoshumScreen,smashWall,colossusInfoshum,breakHand,dropColossus,freeInfoshum,fistBox,headBox,sweepBox,ramBox,freeCoreBox,infoshumTargets,
 relayHit,relayRect,towerScreen,beamFloor,buildWall,WAVE,COL,FREE,FLOOR,INFOSHUM_HP,HALL,ROUND_PAIRS} from '../infoshum-combat.js';
import {jumpTo} from './navigation.js';
function game(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.mode='playing';g.abilities={attack:true,dash:true,sneak:true};buildWall(g);return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200,input={}){for(let i=0;i<max&&!cond();i++)g.step(1/60,input);return cond();}
function swing(g,box){const p=g.player;p.attack=.18;p.swing++;return strikeInfoshum(g,box);}
function place(g,id,dx=40){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0,climbing:false,sneaking:false});g.updateCamera();return s;}
function colossus(testing=true){const g=game(testing);colossusInfoshum(g);assert.equal(g.boss.network.stage,'colossus');place(g,'8:0',400);return g;}
function free(testing=true){const g=game(testing);freeInfoshum(g);assert.equal(g.boss.network.stage,'free');return g;}
const attack=(g,i)=>{const a=g.boss.network.col;a.fist=null;a.sweep=null;a.beam=null;a.shocks=[];a.mode='idle';a.timer=0;a.step=i;tick(g,1);return a;};
const tower=(g,i)=>{const n=g.boss.network;n.scans=[];n.whips=[];n.tvs=[];n.puddles=[];n.attack=null;n.step=i;n.mode='rest';n.timer=0;tick(g,1);return n;};
test('the second fall cracks the head: he bursts out of it into the storm («На свободе»)',()=>{
 const g=colossus(),n=g.boss.network;for(let k=0;k<2;k++)assert.ok(dropColossus(g),'fall '+k);assert.equal(n.stage,'breakout');assert.equal(g.boss.hp,4);assert.equal(g.boss.phase,3);
 assert.ok(until(g,()=>n.stage==='free',260));assert.ok(g.platforms.filter(s=>s.room===8&&!s.bossHidden).every(s=>s.storm!==undefined));assert.equal(n.free.mode,'enter');
});
const freeAttack=(g,i)=>{const f=g.boss.network.free;f.tentacles=[];f.shards=[];f.mode='hover';f.timer=0;f.step=i;tick(g,1);return f;};
test('tentacles burst out of the ground where Uma stood, after a crack warns; shards fly at her height',()=>{
 for(const stay of[true,false]){const g=free(false),f=freeAttack(g,0);place(g,'8:2',120);g.player.inv=0;assert.ok(until(g,()=>f.tentacles.length>0,60));const t=f.tentacles[0];assert.equal(t.state,'warn');assert.ok(Math.abs(t.x-(g.player.x+17))<4);
  const h=g.health;if(!stay)g.player.x+=110;assert.ok(until(g,()=>t.state==='up',80));tick(g,3);assert.equal(g.health,stay?h-1:h,stay?'stood on the crack':'stepped away');}
 const g=free(false),f=freeAttack(g,1);place(g,'8:2',120);g.player.inv=0;const h=g.health;assert.equal(f.mode,'volley');assert.ok(until(g,()=>f.shards.length>0,120));const s=f.shards[0];assert.ok(Math.abs(s.y-(g.player.y+18))<30);assert.equal(Math.sign(s.vx),Math.sign(g.player.x-s.x));
 assert.ok(until(g,()=>g.health<h,200),'a shard hits a cat that stands still');
});
test('«Двойники»: two ghost copies dive through Uma\'s spot from high on either side; then Yuri drags the real one down for the paw',()=>{
 const g=free(false),b=g.boss,f=freeAttack(g,2),s=place(g,'8:2',200);g.player.inv=9;tick(g,1);assert.equal(f.mode,'ghostPrep');assert.equal(f.ghosts.length,2);
 const px=g.player.x+g.player.w/2;assert.ok(f.ghosts.every(gh=>gh.y0<120),'they start high');assert.ok(f.ghosts.some(gh=>gh.x0<px)&&f.ghosts.some(gh=>gh.x0>px),'one on each side');
 assert.ok(until(g,()=>f.mode==='ghostDash',120));g.player.inv=0;const h=g.health;assert.ok(until(g,()=>f.mode!=='ghostDash',60));assert.equal(g.health,h-1,'standing still, a ghost hits');
 assert.equal(f.mode,'pulled');assert.equal(f.yuri,true);assert.ok(g.events.some(v=>v.type==='yuriHold'));assert.ok(until(g,()=>f.mode==='dizzy',60));
 assert.deepEqual(infoshumTargets(g).map(t=>t.id),['core']);assert.ok(swing(g,freeCoreBox(f)));assert.equal(b.hp,2);assert.equal(f.hits,1);assert.equal(f.mode,'hit');assert.equal(swing(g,freeCoreBox(f)),false,'only while held');
 // Out of the dive lines (a dash) the ghosts miss.
 const q=free(false),e=freeAttack(q,2);place(q,'8:2',200);assert.ok(until(q,()=>e.mode==='ghostDash',120));const h2=q.health;q.player.dash=.3;q.player.inv=0;
 for(let i=0;i<40&&e.mode==='ghostDash';i++){q.player.dash=.3;q.step(1/60,{});}assert.equal(q.health,h2);
});
test('a shard swatted with the paw flies back gold and bursts on Infoshum, clearing some static',()=>{
 const g=free(false),f=freeAttack(g,1),n=g.boss.network;place(g,'8:2',120);g.player.inv=99;assert.ok(until(g,()=>f.shards.length>0,120));const s=f.shards[0];
 for(let i=0;i<120&&!s.back;i++){const dir=Math.sign(s.x-(g.player.x+17));g.player.dir=dir||1;tick(g,1,{attack:Math.abs(s.x-(g.player.x+17))<60&&g.player.cooldown===0});}
 assert.equal(s.back,true,'swatted');assert.equal(Math.sign(s.vx),Math.sign(f.x-s.x));n.noiseTime=10;const before=n.noiseTime;assert.ok(until(g,()=>!f.shards.includes(s),200));assert.ok(n.noiseTime<before||s.life<=0);
});
test('for the last blow Yuri holds him longer; the paw ends the fight in the finale',()=>{
 const g=free(),b=g.boss,f=b.network.free;b.hp=2;const e=freeAttack(g,2);place(g,'8:2',200);assert.ok(until(g,()=>e.mode==='dizzy',300));
 assert.equal(e.yuri,true);assert.ok(e.timer>FREE.dizzy);assert.ok(g.events.some(v=>v.type==='yuriHold'&&v.last));
 assert.ok(swing(g,freeCoreBox(f)));assert.equal(g.mode,'bossDefeat');g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'ending');
});
test('a fall between the storm islands returns Uma to the last island and costs a heart',()=>{
 const g=free(false),n=g.boss.network;place(g,'8:0',300);g.player.inv=0;n.free.timer=99;tick(g,2);const h=g.health;Object.assign(g.player,{x:g.platforms.find(s=>s.id==='8:0').x+470,y:520,grounded:false,supportId:null,vy:200});
 tick(g,2);assert.equal(g.health,h-1);assert.equal(g.player.supportId,'8:0');assert.equal(n.stage,'free');
});
test('pause freezes the colossus; retry rebuilds the hall at once',()=>{
 const g=colossus(),n=g.boss.network;attack(g,0);g.mode='paused';const before=JSON.stringify(n);tick(g,90);assert.equal(JSON.stringify(n),before);g.mode='playing';
 g.retryLocation();assert.equal(g.boss.network.stage,'network');assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.platforms.some(s=>s.id==='8:9'&&s.y===262)&&g.platforms.find(s=>s.id==='8:7').bossHidden,'the hall is ready at once — no stray platforms flash at the start');
 g.boss.active=true;g.mode='playing';g.notebooks=[];assert.ok(until(g,()=>g.platforms.some(s=>s.id==='8:9'&&s.y===262)&&g.platforms.find(s=>s.id==='8:7').bossHidden,240),'the hall is built again');
});
