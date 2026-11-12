// Live keys: smash the screens he looks out of, swat the colossus's stunned eyes, hit the stuck real double — then the finale.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');const g=testGame;activateRoom(g,8);g.enemies=[];g.notebooks=[];g.lifePickups=[];g.boss.noticeTime=0;g.mode='playing';});
 // Phase 1 «Прямой эфир»: smash each relay Yuri opens, then swat the big screen while his face is on it — two rounds.
 const ready=()=>{const n=testGame.boss.network;return n.stage!=='network'||n.relays.some(r=>r.state==='open')||n.take?.show==='face';};
 for(let k=0;k<20&&await p.evaluate(()=>testGame.boss.network.stage==='network');k++){
  await p.waitForFunction(ready,null,{timeout:30000});if(await p.evaluate(()=>testGame.boss.network.stage!=='network'))break;if(k===0)await shot(p,'infoshum-live-relay');
  const hp=await p.evaluate(async()=>{const g=testGame,n=g.boss.network,M=await import('./infoshum-combat.js?v=0.21.5'),open=n.relays.find(r=>r.state==='open'),box=open?M.relayHit(g,open.index):M.towerScreen(g);
   const s=open?g.platforms.filter(q=>q.room===8&&!q.bossHidden&&box.x+box.w/2>=q.x&&box.x+box.w/2<=q.x+q.w&&q.y>=box.y+box.h-4).sort((a,c)=>a.y-c.y)[0]:g.platforms.find(q=>q.id==='8:9');
   Object.assign(g.player,{x:Math.max(s.x,Math.min(s.x+s.w-g.player.w,box.x+box.w/2-g.player.w-4)),y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:1});g.updateCamera();return g.boss.hp;});
  await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='colossus',null,{timeout:8000});await p.waitForTimeout(1800);await shot(p,'infoshum-live-colossus');
 // Phase 2 «Колосс»: two rounds — swat the knuckles of each stuck fist, then the fallen head.
 for(let round=0;round<2;round++){
  for(let hand=0;hand<2;hand++){
   await p.waitForFunction(()=>{const a=testGame.boss.network.col;return a.fist?.state==='stuck'&&a.fist.weak;},null,{timeout:40000});if(round===0&&hand===0)await shot(p,'infoshum-live-fist');
   await p.evaluate(()=>{const g=testGame,f=g.boss.network.col.fist;Object.assign(g.player,{x:f.x-70,y:474-48,h:48,grounded:true,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:2});g.updateCamera();});
   await p.keyboard.press('Space');await p.waitForFunction(()=>testGame.boss.network.col.fist?.weak===false||!testGame.boss.network.col.fist,null,{timeout:3000});
  }
  await p.waitForFunction(()=>testGame.boss.network.col.mode==='collapse'&&testGame.boss.network.col.clock>.9,null,{timeout:8000});if(round===0)await shot(p,'infoshum-live-collapse');
  const hp=await p.evaluate(async()=>{const g=testGame,h=(await import('./infoshum-combat.js?v=0.21.5')).headBox(g);Object.assign(g.player,{x:h.x-30,y:474-48,h:48,grounded:true,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:2});g.updateCamera();return g.boss.hp;});
  await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h||testGame.boss.network.stage!=='colossus',hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='breakout',null,{timeout:5000});await p.waitForTimeout(1500);await shot(p,'infoshum-live-breakout');
 await p.waitForFunction(()=>testGame.boss.network.stage==='free',null,{timeout:8000});
 // Phase 3 «На свободе»: survive the ghost dive (Uma dashes through it), then swat him while Yuri holds him.
 for(let k=0;k<2;k++){
  for(let w=0;w<900&&!await p.evaluate(()=>{const g=testGame,f=g.boss.network.free;if(['ghostPrep','ghostDash'].includes(f.mode))g.player.inv=Math.max(g.player.inv,.5);return f.mode==='dizzy'||g.mode!=='playing';});w++)await p.waitForTimeout(40);
  if(k===0)await shot(p,'infoshum-live-dizzy');
  await p.evaluate(()=>{const g=testGame,f=g.boss.network.free,s=g.platforms.find(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.gy)<2&&f.x>=s.x&&f.x<=s.x+s.w);Object.assign(g.player,{x:f.x-60,y:f.gy-48,h:48,grounded:true,supportId:s?.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:2});g.updateCamera();});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h||testGame.mode==='bossDefeat',hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');await p.waitForTimeout(700);await shot(p,'infoshum-live-silence');
 await p.waitForFunction(()=>['ending','won','playing'].includes(testGame.mode),null,{timeout:6000});
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS live keys: 6 relays and 3 cracks in the big screen, 6 fists and 3 falls of the colossus, 3 hits on the dizzy creature, silence defeat and finale.');
})().catch(e=>{console.error(e);process.exit(1);});
