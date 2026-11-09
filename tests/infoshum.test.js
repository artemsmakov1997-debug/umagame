import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {stepBoss} from '../boss.js';
import {strikeInfoshum,exposeInfoshum,crackInfoshumScreen,stormInfoshum,beamRect,screenCenter,coreBox,figureBox,infoshumTargets,noiseDuration,facesFor,WAVE,STORM,SPLIT,INFOSHUM_HP,NOISE_TIME,HIGH_ISLANDS,revealHint} from '../infoshum-combat.js';
import {jumpTo} from './navigation.js';
function game(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.mode='playing';g.abilities={attack:true,dash:true,sneak:true};return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200,input={}){for(let i=0;i<max&&!cond();i++)g.step(1/60,input);return cond();}
function swing(g,box){const p=g.player;p.attack=.18;p.swing++;return strikeInfoshum(g,box);}
function place(g,id,dx=40){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0,climbing:false,sneaking:false});g.updateCamera();return s;}
const faces=n=>n.tvs.filter(t=>['face','charge','fire'].includes(t.state));
function smashAll(g){const n=g.boss.network;for(let k=0;k<10;k++){assert.ok(crackInfoshumScreen(g),'screen '+k);tick(g,25);}assert.ok(until(g,()=>n.stage==='noise',300));return g;}
function ghosts(testing=true){return smashAll(game(testing));}
function storm(testing=true){const g=game(testing);stormInfoshum(g);assert.equal(g.boss.network.stage,'storm');return g;}
test('«Телекомната»: ten screens — seven on the walls just above a platform, three standing on the floor',()=>{
 const g=game(),n=g.boss.network;assert.equal(g.boss.hp,INFOSHUM_HP);assert.equal(n.tvs.length,10);
 assert.equal(n.tvs.filter(t=>t.kind==='wall').length,7);assert.equal(n.tvs.filter(t=>t.kind==='floor').length,3);
 for(const t of n.tvs){const s=g.platforms.find(s=>s.room===8&&s.index===t.on);assert.ok(!s.bossHidden,'its platform is there');assert.ok(t.x>=s.x-4&&t.x+t.w<=s.x+s.w+4,'over its platform');
  if(t.kind==='floor')assert.equal(t.y+t.h,s.y);else assert.ok(t.y+t.h<=s.y&&t.y+t.h>=s.y-50,'a paw from the platform reaches it');}
});
test('a wave: static warns, his face shows in one screen (more as they break), it charges and fires a beam towards Uma, then a rest',()=>{
 const g=game(),n=g.boss.network;place(g,'8:1',20);
 assert.ok(until(g,()=>n.mode==='warn',200));assert.equal(n.tvs.filter(t=>t.role==='face').length,1);assert.ok(n.tvs.some(t=>t.state==='static'));
 assert.ok(until(g,()=>n.mode==='face',60));assert.equal(faces(g.boss.network).length,1);assert.equal(n.tvs.filter(t=>t.state==='static').length,0,'decoys go dark');
 assert.ok(until(g,()=>n.mode==='charge',120));assert.ok(until(g,()=>n.mode==='fire',80));const t=faces(n)[0],p=g.player;assert.equal(t.state,'fire');assert.equal(t.dir,Math.sign(p.x+p.w/2-screenCenter(t).x)||1);
 assert.ok(g.events.some(e=>e.type==='bossCast'&&e.ability==='tvBeam'));
 assert.ok(until(g,()=>n.mode==='rest',80));assert.equal(faces(n).length,0);
 assert.deepEqual([0,2,3,5,6,9].map(facesFor),[1,1,2,2,3,3]);
});
test('a wall beam hits a standing Uma and passes over a crouch; a floor beam passes under a jump',()=>{
 const g=game(false),n=g.boss.network,wall=n.tvs.find(t=>t.kind==='wall'&&t.on===1),floor=n.tvs.find(t=>t.kind==='floor'&&t.on===0);
 for(const t of[wall,floor]){t.dir=1;const r=beamRect(t),s=g.platforms.find(s=>s.room===8&&s.index===t.on),stand={x:t.x+t.w+60,y:s.y-48,w:34,h:48},crouch={...stand,y:s.y-26,h:26},jump={...stand,y:s.y-48-40};
  const hit=b=>b.x<r.x+r.w&&b.x+b.w>r.x&&b.y<r.y+r.h&&b.y+b.h>r.y;assert.ok(hit(stand),t.kind+' hits standing');
  if(t.kind==='wall')assert.ok(!hit(crouch),'a crouch ducks the wall beam');else assert.ok(!hit(jump),'a jump clears the floor beam');}
 place(g,'8:1',wall.x+wall.w+40-g.platforms.find(s=>s.id==='8:1').x);exposeInfoshum(g);for(const t of n.tvs)if(t!==wall&&t.role==='face'){t.role=null;t.state='off';}wall.role='face';wall.state='face';
 n.mode='charge';n.timer=0;const h=g.health;tick(g,10);assert.equal(wall.state,'fire');assert.equal(g.health,h-1,'standing in the beam hurts');
});
test('a paw on a screen with his face smashes it for good; a dark or static screen ignores the paw; smashing every face ends the wave early',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.mode==='warn',200));const decoy=n.tvs.find(t=>t.state==='static'&&t.role==='decoy'),dark=n.tvs.find(t=>t.state==='off');
 if(decoy)assert.equal(swing(g,decoy),false);assert.equal(swing(g,dark),false);assert.equal(g.boss.hp,INFOSHUM_HP);
 assert.ok(until(g,()=>n.mode==='face',60));const t=faces(n)[0];assert.ok(swing(g,t));assert.equal(t.state,'crack');assert.equal(n.broken,1);assert.ok(Math.abs(g.boss.hp-(INFOSHUM_HP-.6))<1e-9);
 tick(g,1);assert.equal(n.mode,'rest','no face left: a short breath');tick(g,30);assert.equal(t.state,'broken');assert.equal(swing(g,t),false,'a smashed screen stays smashed');
 assert.ok(until(g,()=>n.mode==='face',200));assert.ok(!faces(n).includes(t),'he never comes back to a smashed screen');
});
test('the tenth screen bursts: he tears out and «Белый шум» starts on the rebuilt arena with three figures',()=>{
 const g=game(),n=g.boss.network;for(let k=0;k<9;k++){crackInfoshumScreen(g);tick(g,25);}assert.equal(n.stage,'network');assert.ok(Math.abs(g.boss.hp-(INFOSHUM_HP-5.4))<1e-9);
 crackInfoshumScreen(g);assert.equal(n.stage,'rupture');assert.equal(g.boss.hp,12);assert.equal(g.boss.phase,2);
 assert.ok(until(g,()=>n.stage==='noise',200));assert.equal(n.figures.length,3);assert.equal(n.figures.filter(f=>f.real).length,1);
 assert.ok(g.platforms.filter(s=>s.room===8&&[6,7,8].includes(s.index)).every(s=>s.bossHidden));
});
test('each first-source from the Dimension keeps his face in the screens longer',()=>{const g=game(),n=g.boss.network;assert.equal(revealHint(g),0);g.originals=[{taken:true},{taken:true}];assert.ok(Math.abs(revealHint(g)-1.6)<1e-9);assert.ok(until(g,()=>n.mode==='face',300));assert.ok(n.timer>WAVE.face[0]+.4);});
test('«Белый шум»: interference rises; doubles burst on landing, the real one sticks and is marked',()=>{
 const g=ghosts(),n=g.boss.network;const stuck=[];for(let i=0;i<60*12&&!stuck.length;i++){g.step(1/60,{});for(const e of g.events)if(e.type==='infoshumStuck')stuck.push(e);g.events=[];}
 assert.equal(stuck.length,1);assert.ok(n.noise>0);assert.equal(infoshumTargets(g)[0].id,'figure');
});
test('a paw on a double pops it but feeds the noise; three hits on the real one raise the storm',()=>{
 const g=ghosts(),b=g.boss,n=b.network;const double=n.figures.find(f=>!f.real),before=n.noiseTime;assert.ok(swing(g,figureBox(double)));assert.equal(double.state,'burst');assert.ok(n.noiseTime>before+NOISE_TIME*.07);
 for(let k=0;k<3;k++){until(g,()=>n.figures.some(f=>f.real),200);exposeInfoshum(g);b.cooldown=0;assert.ok(swing(g,figureBox(n.figures.find(f=>f.real))),'hit '+k);if(k<2)tick(g,Math.round(60*SPLIT.reel)+2);}
 assert.equal(n.stage,'storm');assert.equal(b.phase,3);assert.equal(b.hp,6);assert.equal(b.phaseName,'Буря и ядро');
});
test('a dive is warned and can be dodged; standing in its landing spot hurts',()=>{
 for(const dodge of[false,true]){const g=ghosts(false),n=g.boss.network;place(g,'8:2',100);g.player.inv=0;assert.ok(until(g,()=>n.figures.some(f=>f.state==='warn'),240));const f=n.figures.find(f=>f.state==='warn');const h=g.health;
  for(let i=0;i<120&&!['stuck','burst'].includes(f.state);i++)g.step(1/60,dodge?{right:true}:{});assert.equal(g.health,dodge?h:h-1);}
});
test('100 percent interference costs one life; test protection buys time instead',()=>{
 for(const testing of[false,true]){const g=ghosts(testing),n=g.boss.network;const lives=g.lives;n.noiseTime=noiseDuration(g)-.001;stepBoss(g,1/60);if(testing){assert.equal(g.lives,lives);assert.ok(n.noise<.9);}else assert.equal(g.lives,lives-1);}
});
test('«Буря и ядро»: the room becomes islands; screens rain from the storm, warned on the landing spot, and hurt on impact',()=>{
 const g=storm(false),n=g.boss.network;const islands=g.platforms.filter(s=>s.room===8&&!s.bossHidden);assert.equal(islands.length,10);assert.ok(islands.every(s=>[0,1,2].includes(s.storm)));
 place(g,'8:2',120);assert.ok(until(g,()=>n.drops.length>0,60*4));const d=n.drops[0];assert.equal(d.state,'warn');
 Object.assign(d,{x:g.player.x+g.player.w/2,ty:g.player.y+g.player.h});g.player.inv=0;const h=g.health;assert.ok(until(g,()=>d.state!=='warn'&&d.state!=='fall',120));assert.equal(g.health,h-1);
});
test('the core charges over Uma, locks and fires a column; then sinks, spent, over the nearest high island',()=>{
 const g=storm(false),n=g.boss.network,s=n.storm;place(g,'8:2',150);g.player.inv=3;
 assert.ok(until(g,()=>s.mode==='charge',60*6));assert.ok(until(g,()=>s.beamX!==null,60));const px=g.player.x+g.player.w/2;assert.ok(Math.abs(s.beamX-px)<60,'aimed at Uma');
 g.player.inv=0;const h=g.health;assert.ok(until(g,()=>s.mode==='beam',60));tick(g,3);assert.equal(g.health,h-1,'the column hurts');
 assert.ok(until(g,()=>s.mode==='spent',120));const isl=HIGH_ISLANDS.map(i=>g.platforms.find(q=>q.id==='8:'+i));assert.ok(isl.some(q=>Math.abs(q.x+q.w/2-s.x)<1&&Math.abs(q.y-64-s.y)<5));
 assert.equal(infoshumTargets(g)[0].id,'core');assert.ok(until(g,()=>s.mode==='storm',60*5),'he rises back into the storm');
});
test('both high islands are reached with real jumps, and a paw from there reaches the spent core',()=>{
 for(const high of HIGH_ISLANDS){const g=storm(),n=g.boss.network,s=n.storm,b=g.boss;place(g,high===9?'8:0':'8:12',high===9?380:60);
  for(const step of high===9?[4,2,9]:[5,2,10])assert.ok(jumpTo(g,8,step,600),'island '+step);
  const isl=g.platforms.find(q=>q.id==='8:'+high);s.mode='spent';s.timer=9;s.sinkTo={x:isl.x+isl.w/2,y:isl.y-64};s.x=s.sinkTo.x;s.y=s.sinkTo.y;
  const p=g.player;Object.assign(p,{x:isl.x+isl.w/2-p.w-20,vx:0});p.dir=1;p.cooldown=0;tick(g,1);g.step(1/60,{attack:true});tick(g,3);assert.equal(b.hp,4,'hit from island '+high);}
});
test('the core takes hits only when spent; the third hit bursts it and the fight ends in the finale',()=>{
 const g=storm(),b=g.boss,n=b.network,s=n.storm;assert.equal(swing(g,coreBox(b)),false,'not in the storm');
 for(let k=0;k<3;k++){exposeInfoshum(g);assert.ok(swing(g,coreBox(b)),'hit '+k);if(k<2){assert.equal(s.mode,'hit');tick(g,Math.round(60*(STORM.hit+STORM.rise))+4);assert.equal(s.mode,'storm');}}
 assert.equal(s.mode,'burst');assert.ok(until(g,()=>g.mode==='bossDefeat',120));g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'ending');
});
test('a fall between the islands returns Uma to the last island and costs a heart',()=>{
 const g=storm(false),n=g.boss.network;place(g,'8:0',300);tick(g,2);const h=g.health;Object.assign(g.player,{x:g.platforms.find(s=>s.id==='8:0').x+470,y:520,grounded:false,supportId:null,vy:200});
 tick(g,2);assert.equal(g.health,h-1);assert.equal(g.player.supportId,'8:0');assert.equal(n.stage,'storm');
});
test('pause freezes every phase; retry rebuilds the room of screens',()=>{
 const g=storm(),n=g.boss.network;g.mode='paused';const before=JSON.stringify(n);tick(g,90);assert.equal(JSON.stringify(n),before);g.mode='playing';
 g.retryLocation();assert.equal(g.boss.network.stage,'network');assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.platforms.filter(s=>s.room===8).every(s=>!s.bossHidden&&s.storm===undefined));assert.ok(g.platforms.some(s=>s.id==='8:7'&&s.y===280));
});
