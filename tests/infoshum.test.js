import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {stepBoss} from '../boss.js';
import {strikeInfoshum,exposeInfoshum,crackInfoshumScreen,smashWall,colossusInfoshum,swatEye,freeInfoshum,beamRect,screenCenter,figureBox,eyeHead,eyeBeamRect,sweepRect,debrisPieces,infoshumTargets,noiseDuration,facesFor,screenUnits,
 WAVE,ASCENT,SPLIT,INFOSHUM_HP,NOISE_TIME,WALL_ARENA,revealHint} from '../infoshum-combat.js';
import {jumpTo} from './navigation.js';
function game(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.mode='playing';g.abilities={attack:true,dash:true,sneak:true};return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200,input={}){for(let i=0;i<max&&!cond();i++)g.step(1/60,input);return cond();}
function swing(g,box){const p=g.player;p.attack=.18;p.swing++;return strikeInfoshum(g,box);}
function place(g,id,dx=40){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0,climbing:false,sneaking:false});g.updateCamera();return s;}
const faces=n=>n.tvs.filter(t=>t.role==='face'&&['face','charge','fire'].includes(t.state));
function climb(testing=true){const g=game(testing);colossusInfoshum(g);assert.equal(g.boss.network.stage,'colossus');return g;}
function ghosts(testing=true){const g=game(testing);freeInfoshum(g);assert.equal(g.boss.network.stage,'noise');return g;}
test('«Стена эфира»: the heap of monitors; twelve screens of four sizes sit on its tiers, the huge wall hangs over the middle',()=>{
 const g=game(),n=g.boss.network;tick(g,1);assert.equal(g.boss.hp,INFOSHUM_HP);assert.equal(n.tvs.length,13);
 const kinds=n.tvs.map(t=>t.kind);for(const k of ['tiny','small','med','large','huge'])assert.ok(kinds.includes(k),k);assert.equal(kinds.filter(k=>k==='huge').length,1);
 assert.deepEqual(g.platforms.filter(s=>s.room===8&&!s.bossHidden).map(s=>s.index).sort((a,b)=>a-b),Object.keys(WALL_ARENA).map(Number).sort((a,b)=>a-b));
 for(const t of n.tvs.filter(t=>t.kind!=='huge')){const s=g.platforms.find(s=>s.room===8&&s.index===t.on);assert.equal(t.y+t.h,s.y,'sits on its tier');assert.ok(t.x>=s.x-2&&t.x+t.w<=s.x+s.w+2);}
 const huge=n.tvs.find(t=>t.kind==='huge');for(const id of['8:9','8:10','8:7']){const s=g.platforms.find(s=>s.id===id);assert.ok(s.y-50<huge.y+huge.h&&s.x<huge.x+huge.w&&s.x+s.w>huge.x,'a paw from '+id+' reaches the wall');}
});
test('every tier of the heap is reached with real jumps from the floor',()=>{
 const g=game();tick(g,1);place(g,'8:0',60);for(const i of [1,6,9]){assert.ok(jumpTo(g,8,i,600),'left tier '+i);}
 place(g,'8:0',460);for(const i of [4,2,16,7]){assert.ok(jumpTo(g,8,i,600),'middle tier '+i);}
 place(g,'8:0',1470);for(const i of [3,8,10]){assert.ok(jumpTo(g,8,i,600),'right tier '+i);}
});
test('a wave: static warns, his face shows in the heap\'s screens (more as they break), they charge and fire along their tier towards Uma',()=>{
 const g=game(),n=g.boss.network;place(g,'8:1',20);
 assert.ok(until(g,()=>n.mode==='warn',200));assert.equal(n.tvs.filter(t=>t.role==='face').length,1);assert.ok(n.tvs.find(t=>t.role==='face').kind!=='huge','the wall waits');
 assert.ok(until(g,()=>n.mode==='face',60));assert.equal(faces(n).length,1);
 assert.ok(until(g,()=>n.mode==='fire',200));const t=faces(n)[0],p=g.player;assert.equal(t.dir,Math.sign(p.x+p.w/2-screenCenter(t).x)||1);
 const r=beamRect(t);assert.ok(r.y>=t.y&&r.y+r.h<=t.y+t.h,'the beam runs at the screen\'s height');
 assert.ok(until(g,()=>n.mode==='rest',80));assert.deepEqual([0,2,3,6,7,11].map(facesFor),[1,1,2,2,3,3]);
});
test('a beam along a tier hits a standing Uma and is cleared with a jump',()=>{
 const g=game(false),n=g.boss.network;tick(g,1);
 for(const t of n.tvs.filter(t=>t.kind!=='huge')){t.dir=1;const r=beamRect(t),s=g.platforms.find(s=>s.room===8&&s.index===t.on),stand={x:t.x+t.w+40,y:s.y-48,w:34,h:48},jump={...stand,y:s.y-48-96};
  const hit=b=>b.x<r.x+r.w&&b.x+b.w>r.x&&b.y<r.y+r.h&&b.y+b.h>r.y;assert.ok(hit(stand),t.kind+' hits standing');assert.ok(!hit(jump),t.kind+' cleared by a jump');}
 const t=n.tvs.find(t=>t.kind==='small'&&t.on===6),s=place(g,'8:6',0);g.player.x=t.x+t.w+10;exposeInfoshum(g);for(const o of n.tvs)if(o!==t&&o.role==='face'){o.role=null;o.state='off';}t.role='face';t.state='face';
 n.mode='charge';n.timer=0;const h=g.health;tick(g,6);assert.equal(t.state,'fire');assert.equal(g.health,h-1);
});
test('a paw smashes a screen with his face; a large one cracks first and he flees it; dark or static screens ignore the paw',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.mode==='warn',200));const dark=n.tvs.find(t=>t.state==='off'&&t.kind!=='huge');assert.equal(swing(g,dark),false);
 assert.ok(until(g,()=>n.mode==='face',60));const t=faces(n)[0];assert.ok(swing(g,t));if(t.kind!=='large')assert.equal(t.state,'crack');tick(g,1);assert.equal(n.mode,'rest','no face left — a short breath');
 const large=n.tvs.find(t=>t.kind==='large'&&t.hp===2);exposeInfoshum(g);for(const o of n.tvs)if(o.role==='face'){o.role=null;o.state='off';}large.role='face';large.state='face';
 assert.ok(swing(g,large));assert.equal(large.hp,1);assert.equal(large.state,'off');assert.equal(large.cracked,true);
 large.role='face';large.state='face';assert.ok(swing(g,large));assert.equal(large.state,'crack');
 assert.ok(Math.abs(g.boss.hp-(INFOSHUM_HP-6*n.units/screenUnits(n)))<1e-3);
});
test('with the heap dark he moves into the huge wall: its beam sweeps Uma\'s tier, three paws shatter it and the colossus assembles',()=>{
 const g=game(false),n=g.boss.network;let k=0;while(n.tvs.some(t=>t.kind!=='huge'&&t.state!=='broken')&&k++<40){crackInfoshumScreen(g);for(const t of n.tvs)if(t.state==='crack')t.state='broken';}
 const huge=n.tvs.find(t=>t.kind==='huge');n.mode='rest';n.timer=0;tick(g,1);assert.deepEqual(n.faces,[huge.index]);
 place(g,'8:7',60);assert.ok(until(g,()=>n.mode==='charge',200));assert.ok(Math.abs(n.giantY-(g.player.y+24))<2);const r=beamRect(huge,n);assert.equal(r.w,1536,'the whole tier');
 g.player.inv=0;const h=g.health;assert.ok(until(g,()=>n.mode==='fire',120));tick(g,3);assert.equal(g.health,h-1);
 for(let i=0;i<3;i++){assert.ok(crackInfoshumScreen(g),'paw '+i);if(i<2)assert.equal(huge.hp,2-i);}
 assert.equal(n.stage,'assemble');assert.equal(g.boss.hp,12);assert.equal(g.boss.phase,2);assert.ok(until(g,()=>n.stage==='colossus',260));
});
test('each first-source from the Dimension keeps his face in the screens longer',()=>{const g=game(),n=g.boss.network;assert.equal(revealHint(g),0);g.originals=[{taken:true},{taken:true}];assert.ok(Math.abs(revealHint(g)-1.6)<1e-9);assert.ok(until(g,()=>n.mode==='face',300));assert.ok(n.timer>WAVE.face[0]+.4);});
test('«Колосс»: debris drifts down past him in a climbable chain and is recycled at the top; the noise wave throws Uma back up',()=>{
 const g=climb(false),n=g.boss.network,a=n.ascent;let pieces=debrisPieces(g).sort((x,y)=>y.y-x.y);assert.equal(pieces.length,ASCENT.count);
 for(let i=1;i<pieces.length;i++){const lo=pieces[i-1],hi=pieces[i];assert.ok(Math.abs(lo.y-hi.y-ASCENT.spacing)<1,'even rise');const gap=Math.max(hi.x-(lo.x+lo.w),lo.x-(hi.x+hi.w));assert.ok(gap<=70,'a short gap');}
 const y0=pieces[3].y;g.player.inv=99;a.eyeT=999;a.sweep=999;a.throwT=999;tick(g,60);assert.ok(pieces[3].y>y0+20,'drifts down');tick(g,60*14);assert.ok(debrisPieces(g).every(s=>s.y<=505),'recycled');assert.ok(a.climbed>300);
 const f=climb(false),p=f.player;Object.assign(p,{y:ASCENT.waveTop+10-48,vy:100,grounded:false,supportId:null,inv:0});const h=f.health;tick(f,1);assert.equal(f.health,h-1);assert.ok(p.vy<0,'thrown up');
});
test('the climb goes on with real jumps from debris to debris',()=>{
 const g=climb(),n=g.boss.network;n.ascent.sweep=999;n.ascent.eyeT=999;n.ascent.throwT=999;let ups=0;
 for(let k=0;k<6;k++){const p=g.player,cur=g.platforms.find(s=>s.id===p.supportId),next=debrisPieces(g).filter(s=>s.y<cur.y-30).sort((a,b)=>b.y-a.y)[0];assert.ok(jumpTo(g,8,next.index,400),'debris '+k);ups++;}
 assert.equal(ups,6);
});
test('the head sweeps Uma\'s tier after a warning; thrown monitors are warned on her debris and hurt on impact',()=>{
 const g=climb(false),n=g.boss.network,a=n.ascent;a.eyeT=999;a.throwT=999;a.sweep=0;tick(g,1);assert.equal(a.beamMode,'aim');const y=g.player.y+g.player.h/2;assert.ok(Math.abs(a.beamY-y)<3);
 g.player.inv=0;const h=g.health;assert.ok(until(g,()=>a.beamMode==='sweep',100));tick(g,2);assert.equal(g.health,h-1);assert.equal(sweepRect(a).w,1536);
 g.player.inv=3;tick(g,60);const mid=debrisPieces(g).filter(s=>s.y<330&&s.y>150).sort((x,y)=>y.y-x.y)[0];place(g,mid.id,mid.w/2-17);g.player.inv=3;a.throwT=0;tick(g,1);const d=n.drops[0];assert.ok(d);assert.equal(d.state,'warn');d.localX=g.player.x+g.player.w/2-g.platforms.find(s=>s.id===d.platformId).x;
 const s=g.platforms.find(s=>s.id===d.platformId);Object.assign(g.player,{supportId:s.id,y:s.y-48,grounded:true});g.player.inv=0;const h2=g.health;assert.ok(until(g,()=>['impact','wreck'].includes(d.state),120));assert.equal(g.health,h2-1);
});
test('an eye relay flies to the edge of Uma\'s debris, aims, fires along the tier and hangs stunned — only then a paw bursts it',()=>{
 const g=climb(false),n=g.boss.network,a=n.ascent;a.sweep=999;a.throwT=999;const high=debrisPieces(g).filter(s=>s.y<260&&s.y>120).sort((x,y)=>y.y-x.y)[0];place(g,high.id,high.w/2-17);a.eyeT=0;tick(g,1);const e=a.eye;assert.ok(e);assert.equal(e.state,'fly');
 assert.ok(until(g,()=>e.state==='aim',80));const s=g.platforms.find(q=>q.id===e.platformId);assert.ok(Math.abs(e.y-(s.y-34))<2);assert.equal(infoshumTargets(g).length,0);assert.equal(swing(g,eyeHead(e)),false,'not while aiming');
 const p=g.player;Object.assign(p,{supportId:s.id,y:s.y-48,x:e.side>0?s.x+s.w-p.w-2:s.x+2,grounded:true,inv:0});const h=g.health;assert.ok(until(g,()=>e.state==='stunned',90));assert.equal(g.health,h-1,'the eye beam hurts on its tier');
 assert.ok(eyeBeamRect(e).w>0);assert.equal(infoshumTargets(g)[0].id,'eye');
 p.inv=1;Object.assign(p,{supportId:s.id,y:s.y-48,x:e.side>0?s.x+s.w-p.w-2:s.x+2,grounded:true,vx:0,vy:0});p.dir=e.side;p.cooldown=0;tick(g,1);g.step(1/60,{attack:true});tick(g,3);
 assert.equal(a.eyes,1,'a paw from the edge reaches the stunned eye');assert.equal(g.boss.hp,10);
});
test('the third eye cracks his head: he tears out into the storm as doubles («На свободе»)',()=>{
 const g=climb(),n=g.boss.network;for(let k=0;k<3;k++){assert.ok(swatEye(g),'eye '+k);tick(g,60);}assert.equal(n.stage,'breakout');assert.equal(g.boss.hp,6);assert.equal(g.boss.phase,3);
 assert.ok(until(g,()=>n.stage==='noise',200));assert.equal(n.figures.length,3);assert.equal(n.figures.filter(f=>f.real).length,1);assert.ok(g.platforms.filter(s=>s.room===8&&!s.bossHidden).every(s=>s.storm!==undefined));
});
test('«На свободе»: interference rises; doubles burst on landing, the real one sticks and is marked',()=>{
 const g=ghosts(),n=g.boss.network;const stuck=[];for(let i=0;i<60*12&&!stuck.length;i++){g.step(1/60,{});for(const e of g.events)if(e.type==='infoshumStuck')stuck.push(e);g.events=[];}
 assert.equal(stuck.length,1);assert.ok(n.noise>0);assert.equal(infoshumTargets(g)[0].id,'figure');
});
test('a paw on a double pops it but feeds the noise; three hits on the real one end the fight in the finale',()=>{
 const g=ghosts(),b=g.boss,n=b.network;const double=n.figures.find(f=>!f.real),before=n.noiseTime;assert.ok(swing(g,figureBox(double)));assert.equal(double.state,'burst');assert.ok(n.noiseTime>before+NOISE_TIME*.07);
 for(let k=0;k<3;k++){until(g,()=>n.figures.some(f=>f.real),200);exposeInfoshum(g);b.cooldown=0;assert.ok(swing(g,figureBox(n.figures.find(f=>f.real))),'hit '+k);if(k<2)tick(g,Math.round(60*SPLIT.reel)+2);}
 assert.equal(g.mode,'bossDefeat');g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'ending');
});
test('a dive is warned and can be dodged; standing in its landing spot hurts',()=>{
 for(const dodge of[false,true]){const g=ghosts(false),n=g.boss.network;place(g,'8:2',100);g.player.inv=0;assert.ok(until(g,()=>n.figures.some(f=>f.state==='warn'),240));const f=n.figures.find(f=>f.state==='warn');const h=g.health;
  for(let i=0;i<120&&!['stuck','burst'].includes(f.state);i++)g.step(1/60,dodge?{right:true}:{});assert.equal(g.health,dodge?h:h-1);}
});
test('100 percent interference costs one life; test protection buys time instead',()=>{
 for(const testing of[false,true]){const g=ghosts(testing),n=g.boss.network;const lives=g.lives;n.noiseTime=noiseDuration(g)-.001;stepBoss(g,1/60);if(testing){assert.equal(g.lives,lives);assert.ok(n.noise<.9);}else assert.equal(g.lives,lives-1);}
});
test('a fall between the storm islands returns Uma to the last island and costs a heart',()=>{
 const g=ghosts(false),n=g.boss.network;place(g,'8:0',300);tick(g,2);const h=g.health;Object.assign(g.player,{x:g.platforms.find(s=>s.id==='8:0').x+470,y:520,grounded:false,supportId:null,vy:200});
 tick(g,2);assert.equal(g.health,h-1);assert.equal(g.player.supportId,'8:0');assert.equal(n.stage,'noise');
});
test('pause freezes the climb; retry rebuilds the wall of monitors',()=>{
 const g=climb(),n=g.boss.network;g.mode='paused';const before=JSON.stringify(n),ys=debrisPieces(g).map(s=>s.y);tick(g,90);assert.equal(JSON.stringify(n),before);assert.deepEqual(debrisPieces(g).map(s=>s.y),ys);g.mode='playing';
 g.retryLocation();assert.equal(g.boss.network.stage,'network');assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.platforms.filter(s=>s.room===8).every(s=>!s.bossHidden&&!s.debris&&!s.drift));
 g.boss.active=true;g.mode='playing';g.notebooks=[];assert.ok(until(g,()=>g.platforms.some(s=>s.id==='8:7'&&s.y===300&&s.heap==='lying'),240),'the heap is built again');
});
