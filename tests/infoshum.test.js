import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';
import {strikeInfoshum,exposeInfoshum,crackInfoshumScreen,smashWall,colossusInfoshum,breakHand,dropColossus,freeInfoshum,beamRect,screenCenter,realScreen,fistBox,headBox,sweepBox,ramBox,freeCoreBox,infoshumTargets,
 WAVE,COL,FREE,FLOOR,INFOSHUM_HP,REAL_SCREENS,WALL_ARENA,revealHint} from '../infoshum-combat.js';
import {jumpTo} from './navigation.js';
function game(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,8);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.mode='playing';g.abilities={attack:true,dash:true,sneak:true};return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200,input={}){for(let i=0;i<max&&!cond();i++)g.step(1/60,input);return cond();}
function swing(g,box){const p=g.player;p.attack=.18;p.swing++;return strikeInfoshum(g,box);}
function place(g,id,dx=40){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0,climbing:false,sneaking:false});g.updateCamera();return s;}
function colossus(testing=true){const g=game(testing);colossusInfoshum(g);assert.equal(g.boss.network.stage,'colossus');place(g,'8:0',400);return g;}
function free(testing=true){const g=game(testing);freeInfoshum(g);assert.equal(g.boss.network.stage,'free');return g;}
const attack=(g,i)=>{const a=g.boss.network.col;a.fist=null;a.sweep=null;a.beam=null;a.shocks=[];a.mode='idle';a.timer=0;a.step=i;tick(g,1);return a;};
test('«Море экранов»: twenty screens of four sizes stand on the tiers of the heap, the huge wall hangs over the middle',()=>{
 const g=game(),n=g.boss.network;tick(g,1);assert.equal(g.boss.hp,INFOSHUM_HP);assert.equal(n.tvs.length,21);
 const kinds=n.tvs.map(t=>t.kind);for(const k of ['tiny','small','med','large','huge'])assert.ok(kinds.includes(k),k);assert.equal(kinds.filter(k=>k==='huge').length,1);
 assert.deepEqual(g.platforms.filter(s=>s.room===8&&!s.bossHidden).map(s=>s.index).sort((a,b)=>a-b),Object.keys(WALL_ARENA).map(Number).sort((a,b)=>a-b));
 const regular=n.tvs.filter(t=>t.kind!=='huge');for(const t of regular){const s=g.platforms.find(s=>s.room===8&&s.index===t.on);assert.equal(t.y+t.h,s.y,'stands on its tier');assert.ok(t.x>=s.x-2&&t.x+t.w<=s.x+s.w+2,'within its tier '+t.index);}
 for(const a of regular)for(const b of regular)if(a.index<b.index&&a.on===b.on)assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x,'no two screens overlap');
});
test('every tier of the heap is reached with real jumps from the floor',()=>{
 const g=game();tick(g,1);place(g,'8:0',60);for(const i of [1,6,9])assert.ok(jumpTo(g,8,i,600),'left tier '+i);
 place(g,'8:0',460);for(const i of [4,2,16,7])assert.ok(jumpTo(g,8,i,600),'middle tier '+i);
 place(g,'8:0',1470);for(const i of [3,8,10])assert.ok(jumpTo(g,8,i,600),'right tier '+i);
});
test('a wave: the same face on many screens, one of them real; Yuri appears a moment later, points at it and only then it is marked',()=>{
 const g=game(),n=g.boss.network;place(g,'8:1',20);assert.ok(until(g,()=>n.mode==='warn',200));assert.ok(n.tvs.filter(t=>t.state==='static').length>=5);
 assert.ok(until(g,()=>n.mode==='face',60));const faces=n.tvs.filter(t=>t.state==='face');assert.ok(faces.length>=5);assert.equal(faces.filter(t=>t.role==='real').length,1);
 assert.equal(n.yuriOn,false);assert.equal(infoshumTargets(g).length,0,'nothing tells the real one yet');assert.ok(n.yuri.every(i=>n.tvs[i].state==='glitch'));
 assert.ok(until(g,()=>n.yuriOn,60));const real=realScreen(n);assert.equal(infoshumTargets(g)[0].id,'screen'+real.index);
 for(const i of n.yuri){const t=n.tvs[i];assert.equal(t.state,'yuri');assert.equal(t.point,screenCenter(real).x>=screenCenter(t).x?1:-1,'he points at the real screen');}
 assert.equal(n.yuri.length,2);assert.ok(g.events.some(e=>e.type==='yuriHint'));
});
test('a paw on a fake brings data rain and costs nothing; a paw on the real screen smashes it for good',()=>{
 const g=game(),n=g.boss.network;exposeInfoshum(g);const fake=n.tvs.find(t=>t.role==='fake'),real=realScreen(n);g.bolts=[];
 assert.ok(swing(g,fake));assert.equal(fake.role,null);assert.ok(g.bolts.length>=3);assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.events.some(e=>e.type==='infoshumFakeHit'));
 assert.ok(swing(g,real));assert.equal(real.state,'crack');assert.equal(n.broken,1);assert.ok(Math.abs(g.boss.hp-(INFOSHUM_HP-.5))<1e-6);
 tick(g,30);assert.equal(real.state,'broken');assert.equal(n.mode==='rest'||n.mode==='warn',true);assert.ok(until(g,()=>n.mode==='face',200));assert.notEqual(n.real,real.index,'he never returns to a smashed screen');
});
test('the real screen charges and fires a beam along its tier towards Uma; the fakes only flicker and go out',()=>{
 const g=game(false),n=g.boss.network;exposeInfoshum(g);const real=realScreen(n),s=g.platforms.find(s=>s.room===8&&s.index===real.on);
 Object.assign(g.player,{x:real.x+real.w+30,y:s.y-48,grounded:true,supportId:s.id,inv:0,vx:0,vy:0});n.hold=false;n.timer=0;tick(g,1);assert.equal(n.mode,'charge');assert.ok(n.tvs.filter(t=>t.state==='charge').length>=4);
 const h=g.health;n.timer=0;tick(g,3);assert.equal(real.state,'fire');assert.equal(real.dir,1);assert.equal(n.tvs.filter(t=>t.role==='fake').length,0);assert.equal(g.health,h-1,'standing in the beam hurts');
 const r=beamRect(real);assert.ok(r.y>=real.y&&r.y+r.h<=real.y+real.h);assert.ok(s.y-48-96+48<r.y,'a jump clears it');
});
test('every third wave Yuri holds him in the screen: no beam, the fakes vanish and the real one stays open to the paw',()=>{
 const g=game(false),n=g.boss.network;place(g,'8:0',700);for(let w=0;w<2;w++){assert.ok(until(g,()=>n.mode==='fire',900));assert.ok(until(g,()=>n.mode==='rest',200));}
 assert.ok(until(g,()=>n.mode==='held',600));const real=realScreen(n);assert.equal(real.state,'held');assert.equal(n.tvs.filter(t=>t.role==='fake').length,0);assert.ok(n.yuri.every(i=>n.tvs[i].state==='hold'));
 const h=g.health;tick(g,Math.round(60*WAVE.hold)-5);assert.equal(n.tvs.filter(t=>t.state==='fire').length,0);assert.equal(g.health,h);assert.ok(swing(g,real));assert.equal(n.broken,1);
});
test('after nine screens Yuri and he fight over the huge wall: the paw counts only while his face is on it; three paws start the assembly',()=>{
 const g=game(false),n=g.boss.network;let k=0;while(n.broken<REAL_SCREENS&&k++<30){crackInfoshumScreen(g);for(const t of n.tvs)if(t.state==='crack')t.state='broken';}assert.equal(n.broken,9);
 const huge=n.tvs.at(-1);n.mode='rest';n.timer=0;tick(g,1);assert.equal(n.real,huge.index);assert.equal(huge.state,'yuri','Yuri holds the wall first');assert.equal(swing(g,huge),false,'a paw on Yuri does nothing');
 place(g,'8:7',60);assert.ok(until(g,()=>n.mode==='charge',300));assert.ok(Math.abs(n.giantY-(g.player.y+24))<2);assert.equal(beamRect(huge,n).w,1536,'the whole tier');
 g.player.inv=0;const h=g.health;assert.ok(until(g,()=>n.mode==='fire',120));tick(g,3);assert.equal(g.health,h-1);assert.ok(until(g,()=>n.mode==='rest',120));assert.equal(huge.state,'yuri');
 for(let i=0;i<3;i++)assert.ok(crackInfoshumScreen(g),'paw '+i);assert.equal(n.stage,'assemble');assert.equal(g.boss.hp,12);assert.equal(g.boss.phase,2);assert.ok(until(g,()=>n.stage==='colossus',260));
});
test('each first-source from the Dimension keeps his face in the screens longer',()=>{const g=game(),n=g.boss.network;assert.equal(revealHint(g),0);g.originals=[{taken:true},{taken:true}];assert.ok(Math.abs(revealHint(g)-1.6)<1e-9);assert.ok(until(g,()=>n.mode==='face',300));assert.ok(n.timer>WAVE.face[0]+.4);});
test('«Колосс»: a fist follows Uma as a shadow, slams where she stood, sends a shockwave along the floor and sticks',()=>{
 const g=colossus(false),n=g.boss.network,a=attack(g,0),f=a.fist;assert.equal(f.state,'aim');assert.deepEqual(g.platforms.filter(s=>s.room===8&&!s.bossHidden).map(s=>s.index),[0]);
 tick(g,30,{right:true});const px=g.player.x+17;assert.ok(Math.abs(f.x-px)<40,'the shadow follows');assert.ok(until(g,()=>f.state==='lock',120));const x=f.x;g.player.inv=0;const h=g.health;
 assert.ok(until(g,()=>f.state==='stuck',60));assert.equal(f.x,x,'locked');assert.equal(g.health,h-1,'under the fist');assert.equal(a.shocks.length,2);assert.deepEqual(infoshumTargets(g).map(t=>t.id),['fist']);
 const q=colossus(false),b=attack(q,0);assert.ok(until(q,()=>b.fist.state==='lock',200));q.player.x=b.fist.x+150;q.player.inv=0;const h2=q.health;assert.ok(until(q,()=>b.fist.state==='stuck',60));assert.equal(q.health,h2,'stepped aside');
 tick(q,40);assert.equal(q.health,h2-1,'the shockwave reaches a cat on the floor');
});
test('a paw on the knuckles of the stuck fist breaks that hand; with both broken he collapses and the head screen takes the paw',()=>{
 const g=colossus(),b=g.boss,n=b.network,a=n.col;assert.equal(swing(g,headBox(g)),false,'the head is out of reach while he stands');
 exposeInfoshum(g);const f=a.fist;assert.equal(swing(g,{x:f.x-200,y:FLOOR-50,w:40,h:50}),false);assert.ok(swing(g,fistBox(f)));assert.equal(a.hands[f.side],false);assert.equal(b.hp,12,'a hand is not his health');
 assert.ok(until(g,()=>!a.fist,120));assert.notEqual(a.mode,'collapse');const other=attack(g,0).fist;assert.notEqual(other.side,f.side,'the other hand slams next');
 assert.ok(until(g,()=>other.state==='stuck',200));assert.ok(swing(g,fistBox(other)));assert.ok(until(g,()=>a.mode==='collapse',120));assert.deepEqual(infoshumTargets(g).map(t=>t.id),['head']);
 assert.ok(swing(g,headBox(g)));assert.equal(b.hp,10);assert.equal(a.mode,'rise');assert.deepEqual(a.hands,{L:true,R:true});assert.equal(a.round,1);
 const q=colossus(),c=q.boss.network.col;breakHand(q);breakHand(q);assert.equal(c.mode,'collapse');tick(q,Math.round(60*COL.collapse)+5);assert.equal(c.mode,'rise');assert.equal(q.boss.hp,12,'missed: he just gets up');assert.deepEqual(c.hands,{L:true,R:true});
});
test('an arm sweeps low (a jump clears it) or high (a crouch passes under it); the head beam crawls after a cat that stands still',()=>{
 for(const low of[true,false])for(const dodge of[false,true]){const g=colossus(false),a=attack(g,1),s=a.sweep;s.low=low;assert.equal(s.state,'warn');g.player.inv=0;const h=g.health;assert.ok(until(g,()=>s.state==='go',120));
  const px=()=>g.player.x+17;for(let i=0;i<200&&a.sweep;i++){const near=Math.abs(s.x-px())<170;g.step(1/60,dodge&&near?(low?{jump:true}:{down:true}):{});}
  assert.equal(g.health,dodge?h:h-1,(low?'low':'high')+(dodge?' dodged':' hit'));}
 const b=sweepBox({x:0,low:true}),t=sweepBox({x:0,low:false});assert.ok(b.y+b.h===FLOOR&&t.y+t.h<FLOOR-30);
 const g=colossus(false),a=attack(g,3),m=a.beam;assert.equal(m.state,'charge');g.player.inv=0;const h=g.health;assert.ok(until(g,()=>m.state==='fire',120));tick(g,30);assert.equal(g.health,h-1);
 const q=colossus(false),c=attack(q,3);q.player.inv=0;const h2=q.health;for(let i=0;i<400&&c.beam;i++)q.step(1/60,{right:true});assert.equal(q.health,h2,'a running cat outruns the beam');
});
test('the third fall cracks the head: he bursts out of it into the storm («На свободе»)',()=>{
 const g=colossus(),n=g.boss.network;for(let k=0;k<3;k++)assert.ok(dropColossus(g),'fall '+k);assert.equal(n.stage,'breakout');assert.equal(g.boss.hp,6);assert.equal(g.boss.phase,3);
 assert.ok(until(g,()=>n.stage==='free',260));assert.ok(g.platforms.filter(s=>s.room===8&&!s.bossHidden).every(s=>s.storm!==undefined));assert.equal(n.free.mode,'enter');
});
const freeAttack=(g,i)=>{const f=g.boss.network.free;f.tentacles=[];f.shards=[];f.mode='hover';f.timer=0;f.step=i;tick(g,1);return f;};
test('tentacles burst out of the ground where Uma stood, after a crack warns; shards fly at her height',()=>{
 for(const stay of[true,false]){const g=free(false),f=freeAttack(g,0);place(g,'8:2',120);g.player.inv=0;assert.ok(until(g,()=>f.tentacles.length>0,60));const t=f.tentacles[0];assert.equal(t.state,'warn');assert.ok(Math.abs(t.x-(g.player.x+17))<4);
  const h=g.health;if(!stay)g.player.x+=110;assert.ok(until(g,()=>t.state==='up',80));tick(g,3);assert.equal(g.health,stay?h-1:h,stay?'stood on the crack':'stepped away');}
 const g=free(false),f=freeAttack(g,1);place(g,'8:2',120);g.player.inv=0;const h=g.health;assert.equal(f.mode,'volley');assert.ok(until(g,()=>f.shards.length>0,120));const s=f.shards[0];assert.ok(Math.abs(s.y-(g.player.y+18))<30);assert.equal(Math.sign(s.vx),Math.sign(g.player.x-s.x));
 assert.ok(until(g,()=>g.health<h,200),'a shard hits a cat that stands still');
});
test('the ram: if it hits Uma he flies on; if she dodges it he crashes at the end of her island, dizzy — a paw tears a tentacle off',()=>{
 const g=free(false),b=g.boss,f=freeAttack(g,2),s=place(g,'8:2',200);g.player.inv=9;tick(g,1);assert.equal(f.mode,'ramPrep');assert.equal(f.gy,s.y);
 assert.ok(until(g,()=>f.mode==='ram',120));g.player.inv=0;const h=g.health;assert.ok(until(g,()=>f.mode!=='ram',120));assert.equal(g.health,h-1);assert.equal(f.mode,'bounce');assert.equal(infoshumTargets(g).length,0);
 const q=free(false),c=q.boss,e=freeAttack(q,2),isl=place(q,'8:2',200);assert.ok(until(q,()=>e.mode==='ram',120));const h2=q.health;
 for(let i=0;i<120&&e.mode==='ram';i++){Object.assign(q.player,{y:isl.y-48-130,vy:0,grounded:false});q.step(1/60,{});}assert.equal(q.health,h2);assert.equal(e.mode,'crash');
 assert.ok(until(q,()=>e.mode==='dizzy',60));assert.ok(e.x>isl.x&&e.x<isl.x+isl.w,'he lies on her island');assert.deepEqual(infoshumTargets(q).map(t=>t.id),['core']);assert.equal(e.yuri,false);
 assert.ok(ramBox(e).w>0);assert.ok(swing(q,freeCoreBox(e)));assert.equal(c.hp,4);assert.equal(e.hits,1);assert.equal(e.mode,'hit');assert.equal(swing(q,freeCoreBox(e)),false,'only while dizzy');
});
test('for the last blow Yuri holds him longer; the paw ends the fight in the finale',()=>{
 const g=free(),b=g.boss,f=b.network.free;b.hp=2;const e=freeAttack(g,2),isl=place(g,'8:2',200);assert.ok(until(g,()=>e.mode==='ram',120));
 for(let i=0;i<120&&e.mode==='ram';i++){Object.assign(g.player,{y:isl.y-48-130,vy:0,grounded:false});g.step(1/60,{});}assert.ok(until(g,()=>e.mode==='dizzy',60));
 assert.equal(e.yuri,true);assert.ok(e.timer>FREE.dizzy);assert.ok(g.events.some(v=>v.type==='yuriHold'&&v.last));
 assert.ok(swing(g,freeCoreBox(f)));assert.equal(g.mode,'bossDefeat');g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'ending');
});
test('a fall between the storm islands returns Uma to the last island and costs a heart',()=>{
 const g=free(false),n=g.boss.network;place(g,'8:0',300);g.player.inv=0;n.free.timer=99;tick(g,2);const h=g.health;Object.assign(g.player,{x:g.platforms.find(s=>s.id==='8:0').x+470,y:520,grounded:false,supportId:null,vy:200});
 tick(g,2);assert.equal(g.health,h-1);assert.equal(g.player.supportId,'8:0');assert.equal(n.stage,'free');
});
test('pause freezes the colossus; retry rebuilds the sea of screens',()=>{
 const g=colossus(),n=g.boss.network;attack(g,0);g.mode='paused';const before=JSON.stringify(n);tick(g,90);assert.equal(JSON.stringify(n),before);g.mode='playing';
 g.retryLocation();assert.equal(g.boss.network.stage,'network');assert.equal(g.boss.hp,INFOSHUM_HP);assert.ok(g.platforms.filter(s=>s.room===8).every(s=>!s.bossHidden));
 g.boss.active=true;g.mode='playing';g.notebooks=[];assert.ok(until(g,()=>g.platforms.some(s=>s.id==='8:7'&&s.y===300&&s.heap==='lying'),240),'the heap is built again');
});
