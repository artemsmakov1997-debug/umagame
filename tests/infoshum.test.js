import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';
import {strikeInfoshum,exposeInfoshum,crackInfoshumScreen,smashWall,colossusInfoshum,breakHand,dropColossus,freeInfoshum,fistBox,headBox,sweepBox,ramBox,freeCoreBox,infoshumTargets,
 relayHit,relayRect,towerScreen,beamFloor,buildWall,WAVE,COL,FREE,LIVE,liveReach,FLOOR,INFOSHUM_HP,HALL,ROUND_PAIRS} from '../infoshum-combat.js';
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
test('«Прямой эфир»: the hall of ledges, the big square monitor in the middle behind a dome of static, four relays around it',()=>{
 const g=game(),n=g.boss.network;tick(g,1);assert.equal(g.boss.hp,INFOSHUM_HP);assert.equal(n.relays.length,4);assert.equal(n.shield,true);
 assert.deepEqual(g.platforms.filter(s=>s.room===8&&!s.bossHidden).map(s=>s.index).sort((a,b)=>a-b),Object.keys(HALL).map(Number).sort((a,b)=>a-b));
 const sc=towerScreen(g),top=g.platforms.find(s=>s.id==='8:9');assert.ok(top.y-50<sc.y+sc.h&&top.x<sc.x+sc.w&&top.x+top.w>sc.x,'a paw from the top ledge reaches the big screen');
 for(let i=0;i<4;i++){const h=relayHit(g,i),s=g.platforms.filter(q=>q.room===8&&!q.bossHidden&&h.x+h.w/2>=q.x&&h.x+h.w/2<=q.x+q.w&&q.y>=h.y+h.h-4).sort((a,b)=>a.y-b.y)[0];assert.ok(s&&s.y-50<h.y+h.h,'relay '+i+' is reached from a ledge');}
});
test('every ledge of the hall is reached with real jumps from the floor',()=>{
 const g=game();tick(g,1);place(g,'8:0',60);for(const i of [1,6])assert.ok(jumpTo(g,8,i,600),'left '+i);
 place(g,'8:0',520);for(const i of [4,2,9])assert.ok(jumpTo(g,8,i,600),'middle '+i);
 place(g,'8:0',1470);for(const i of [3,8])assert.ok(jumpTo(g,8,i,600),'right '+i);
});
test('Yuri opens the relays of the round one by one; a paw on the open junction box smashes it; two dead relays drop the dome',()=>{
 const g=game(),n=g.boss.network;assert.ok(until(g,()=>n.relays.some(r=>r.state==='yuri'),400));const r=n.relays.find(r=>r.state==='yuri');assert.ok(ROUND_PAIRS[0].includes(r.index));assert.equal(infoshumTargets(g).length,0,'not before the box is open');
 assert.equal(swing(g,relayHit(g,r.index)),false);assert.ok(until(g,()=>r.state==='open',80));assert.equal(infoshumTargets(g)[0].id,'relay'+r.index);
 assert.ok(swing(g,relayHit(g,r.index)));assert.equal(r.state,'hit');assert.ok(Math.abs(g.boss.hp-(INFOSHUM_HP-.5))<1e-6);tick(g,25);assert.equal(r.state,'dead');assert.equal(n.shield,true);
 const other=n.relays[ROUND_PAIRS[0].find(i=>i!==r.index)];assert.ok(until(g,()=>other.state==='open',300));assert.ok(swing(g,relayHit(g,other.index)));tick(g,25);assert.equal(n.shield,false);assert.ok(n.take);
});
test('with the dome down Yuri and Infoshum alternate on the big screen; the paw counts only on his face and cracks it; the next round reboots another pair',()=>{
 const g=game(),n=g.boss.network;crackInfoshumScreen(g);tick(g,25);crackInfoshumScreen(g);tick(g,25);assert.equal(n.shield,false);assert.equal(n.take.show,'yuri');
 const sc=towerScreen(g);assert.equal(swing(g,sc),false,'a paw on Yuri does nothing');assert.ok(until(g,()=>n.take?.show==='face',200));assert.ok(swing(g,sc));assert.equal(n.cracks,1);assert.equal(g.boss.hp,INFOSHUM_HP-2);
 assert.equal(n.round,1);assert.equal(n.shield,true);assert.ok(ROUND_PAIRS[1].every(i=>['live','reboot'].includes(n.relays[i].state)));
 const q=game(),m=q.boss.network;crackInfoshumScreen(q);tick(q,25);crackInfoshumScreen(q);tick(q,25);tick(q,Math.round(60*WAVE.takeover)+5);assert.equal(m.shield,true,'missed the screen: the dome is back');assert.equal(m.round,0);
});
test('the scan beam sweeps the hall from above: it burns a cat on the open floor and passes over one hiding under a ledge',()=>{
 const g=game(false),n=g.boss.network;place(g,'8:0',520);g.player.inv=0;const t=tower(g,0),s=t.scans[0];assert.ok(s);assert.equal(s.state,'warn');const h=g.health;
 for(let i=0;i<400&&t.scans.length;i++)g.step(1/60,{});assert.equal(g.health,h-1,'hit on the open floor');
 const q=game(false),m=q.boss.network,low=q.platforms.find(s=>s.id==='8:1');place(q,'8:0',0);Object.assign(q.player,{x:low.x+low.w/2-17,y:FLOOR-48});q.player.inv=0;tower(q,0);const h2=q.health;
 assert.ok(beamFloor(q,low.x+low.w/2)===low.y);for(let i=0;i<400&&m.scans.length;i++)q.step(1/60,{});assert.equal(q.health,h2,'safe under the ledge');
});
test('the cable whip warns along Uma\'s ledge and slams it: a jump clears it; a tiny TV leaves a puddle of noise where it lands',()=>{
 for(const jump of[false,true]){const g=game(false),n=g.boss.network;place(g,'8:2',140);g.player.inv=0;const t=tower(g,1),w=t.whips[0];assert.equal(w.state,'warn');assert.equal(w.platformId,'8:2');const h=g.health;
  for(let i=0;i<120&&t.whips.length;i++)g.step(1/60,jump&&w.timer<.25&&w.state==='warn'&&g.player.grounded?{jump:true}:{});assert.equal(g.health,jump?h:h-1,jump?'jumped':'hit');}
 const g=game(false),n=g.boss.network;place(g,'8:0',300);g.player.inv=9;tower(g,2);assert.equal(n.tvs.length,3);assert.ok(until(g,()=>n.puddles.length===3,200));const q=n.puddles[1];
 Object.assign(g.player,{x:q.x-17,y:q.y-48,grounded:true,supportId:'8:0',vx:0,vy:0});g.player.inv=0;const h=g.health;tick(g,10);assert.equal(g.health,h-1,'the puddle hurts');tick(g,Math.round(60*WAVE.puddle));assert.equal(n.puddles.length,0);
});
test('two cracks: the relays fly into the tower and the colossus rises around it',()=>{
 const g=game(),n=g.boss.network;assert.equal(smashWall(g),'assemble');assert.equal(n.cracks,2);assert.equal(g.boss.hp,8);assert.equal(g.boss.phase,2);assert.ok(until(g,()=>n.stage==='colossus',300));assert.equal(n.col.mode,'intro');
});
test('«Колосс»: a fist winds up and slams the floor beside the body on Uma\'s side, sends a shockwave along the floor and sticks',()=>{
 const g=colossus(false),n=g.boss.network,a=attack(g,0),f=a.fist;assert.equal(f.state,'aim');assert.deepEqual(g.platforms.filter(s=>s.room===8&&!s.bossHidden).map(s=>s.index),[0]);
 const cx=16128+768;assert.equal(f.side,g.player.x+17<cx?'L':'R');assert.equal(Math.abs(f.x-cx),COL.reach);
 Object.assign(g.player,{x:f.x-17});g.player.inv=0;const h=g.health;assert.ok(until(g,()=>f.state==='stuck',200));assert.equal(g.health,h-1,'under the fist');assert.equal(a.shocks.length,2);assert.deepEqual(infoshumTargets(g).map(t=>t.id),['fist']);
 const q=colossus(false),b=attack(q,0);q.player.x=b.fist.x+(b.fist.side==='L'?-260:260);q.player.inv=0;const h2=q.health;assert.ok(until(q,()=>b.fist.state==='stuck',200));assert.equal(q.health,h2,'stepped aside');
 tick(q,40);assert.equal(q.health,h2-1,'the shockwave reaches a cat on the floor');
});
test('a paw on the knuckles of the stuck fist breaks that hand; with both broken he collapses and the head screen takes the paw',()=>{
 const g=colossus(),b=g.boss,n=b.network,a=n.col;assert.equal(swing(g,headBox(g)),false,'the head is out of reach while he stands');
 exposeInfoshum(g);const f=a.fist;assert.equal(swing(g,{x:f.x-200,y:FLOOR-50,w:40,h:50}),false);assert.ok(swing(g,fistBox(f)));assert.equal(a.hands[f.side],false);assert.equal(b.hp,8,'a hand is not his health');
 assert.ok(until(g,()=>!a.fist,120));assert.notEqual(a.mode,'collapse');const other=attack(g,0).fist;assert.notEqual(other.side,f.side,'the other hand slams next');
 assert.ok(until(g,()=>other.state==='stuck',200));assert.ok(swing(g,fistBox(other)));assert.ok(until(g,()=>a.mode==='collapse',120));assert.equal(swing(g,headBox(g)),false,'not while he is still falling');assert.ok(until(g,()=>a.clock>COL.fallTime,80));assert.deepEqual(infoshumTargets(g).map(t=>t.id),['head']);
 assert.ok(swing(g,headBox(g)));assert.equal(b.hp,6);assert.equal(a.mode,'rise');assert.deepEqual(a.hands,{L:true,R:true});assert.equal(a.round,1);
 const q=colossus(),c=q.boss.network.col;breakHand(q);breakHand(q);assert.equal(c.mode,'collapse');tick(q,Math.round(60*COL.collapse)+5);assert.equal(c.mode,'rise');assert.equal(q.boss.hp,8,'missed: he just gets up');assert.deepEqual(c.hands,{L:true,R:true});
});
test('an arm sweeps low (a jump clears it) or high (a crouch passes under it); the head beam crawls after a cat that stands still',()=>{
 for(const low of[true,false])for(const dodge of[false,true]){const g=colossus(false),a=attack(g,1),s=a.sweep;s.low=low;assert.equal(s.state,'warn');g.player.inv=0;const h=g.health;assert.ok(until(g,()=>s.state==='go',120));
  for(let i=0;i<200&&a.sweep;i++){const now=s.state==='go'||s.timer<.1;g.step(1/60,dodge&&now?(low?{jump:g.player.grounded&&s.travel<COL.sweepSpan*.6}:{down:true}):{});}
  assert.equal(g.health,dodge?h:h-1,(low?'low':'high')+(dodge?' dodged':' hit'));}
 const b=sweepBox({x:0,low:true}),t=sweepBox({x:0,low:false});assert.ok(b.y+b.h===FLOOR&&t.y+t.h<FLOOR-30);
 const g=colossus(false),a=attack(g,COL.plan.indexOf('beam')),m=a.beam;assert.equal(m.state,'charge');g.player.inv=0;const h=g.health;assert.ok(until(g,()=>m.state==='fire',120));tick(g,30);assert.equal(g.health,h-1);
 const q=colossus(false),c=attack(q,COL.plan.indexOf('beam'));assert.ok(c.beam);q.player.inv=0;const h2=q.health;for(let i=0;i<400&&c.beam;i++)q.step(1/60,{right:true});assert.equal(q.health,h2,'a running cat outruns the beam');
});
test('«Прямой эфир»: the chest opens, wreckage drops on either side, the beam sweeps the floor; behind a block Uma is safe',()=>{
 const g=colossus(false),a=attack(g,COL.plan.indexOf('live')),l=a.live;assert.equal(l.state,'open');assert.equal(l.shelters.length,2);const c=16128+768;
 assert.ok(l.shelters.some(s=>s.x<c)&&l.shelters.some(s=>s.x>c),'one block on each side');
 g.player.inv=0;const h=g.health;assert.ok(until(g,()=>l.state==='fire',200));Object.assign(g.player,{x:c-130-17,inv:0});assert.ok(l.shelters.every(s=>s.landed));tick(g,30);assert.equal(g.health,h-1,'in the open the beam hits');
 const q=colossus(false),b=attack(q,COL.plan.indexOf('live')),m=b.live;assert.ok(until(q,()=>m.shelters.every(s=>s.landed),200));const left=m.shelters.find(s=>s.x<c);
 Object.assign(q.player,{x:left.x-LIVE.shelterW/2-40,inv:0});const h2=q.health;assert.ok(liveReach(q,-1)>q.player.x+q.player.w);assert.ok(until(q,()=>m.state==='close',200));assert.equal(q.health,h2,'behind the block');
 assert.ok(until(q,()=>!b.live,60));assert.equal(b.mode,'idle');
});
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
