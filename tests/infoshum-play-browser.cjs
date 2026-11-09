// Live keys: smash the screens he looks out of, swat the colossus's stunned eyes, hit the stuck real double — then the finale.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');const g=testGame;activateRoom(g,8);g.enemies=[];g.notebooks=[];g.lifePickups=[];g.boss.noticeTime=0;g.mode='playing';});
 // Phase 1 «Стена эфира»: wait for his face in a screen, stand beside it on its tier and swat — the heap, then the huge wall.
 for(let k=0;k<30&&await p.evaluate(()=>testGame.boss.network.stage==='network');k++){
  await p.waitForFunction(()=>testGame.boss.network.stage!=='network'||testGame.boss.network.tvs.some(t=>t.role==='face'&&['face','charge'].includes(t.state)),null,{timeout:20000});
  if(await p.evaluate(()=>testGame.boss.network.stage!=='network'))break;if(k===0)await shot(p,'infoshum-live-face');
  const hp=await p.evaluate(()=>{const g=testGame,n=g.boss.network,t=n.tvs.find(t=>t.role==='face'&&['face','charge'].includes(t.state)),huge=t.kind==='huge',s=g.platforms.find(s=>s.room===8&&s.index===(huge?9:t.on));Object.assign(g.player,{x:huge?s.x+s.w-g.player.w-2:t.x+t.w/2-g.player.w-4,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:1});g.updateCamera();return g.boss.hp;});
  await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='colossus',null,{timeout:8000});await p.waitForTimeout(1800);await shot(p,'infoshum-live-colossus');
 // Phase 2 «Колосс»: wait for an eye relay to hang stunned, stand on the edge of its debris and swat it — three eyes.
 for(let k=0;k<3;k++){
  // Uma keeps riding a debris piece in the middle of the climb while she waits for the next eye (as a player would).
  for(let w=0;w<60&&!await p.evaluate(()=>testGame.boss.network.ascent?.eye?.state==='stunned');w++){
   await p.evaluate(()=>{const g=testGame,pl=g.player,cur=g.platforms.find(s=>s.id===pl.supportId&&s.debris);if(cur&&cur.y<380&&cur.y>140)return;const s=g.platforms.filter(s=>s.room===8&&s.debris&&!s.bossHidden&&s.y>160&&s.y<300).sort((a,b)=>Math.abs(a.y-240)-Math.abs(b.y-240))[0];if(s)Object.assign(pl,{x:s.x+s.w/2-pl.w/2,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0});});
   await p.waitForTimeout(500);
  }
  await p.waitForFunction(()=>testGame.boss.network.ascent?.eye?.state==='stunned',null,{timeout:5000});if(k===0)await shot(p,'infoshum-live-eye');
  const hp=await p.evaluate(()=>{const g=testGame,e=g.boss.network.ascent.eye,s=g.platforms.find(q=>q.id===e.platformId),pl=g.player;Object.assign(pl,{x:e.side>0?s.x+s.w-pl.w-2:s.x+2,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,dir:e.side,attack:0,cooldown:0,inv:2});return g.boss.hp;});
  await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='noise',null,{timeout:8000});await shot(p,'infoshum-live-free');
 // Phase 3 «На свободе»: wait for the real double to stick, step next to it and strike.
 for(let k=0;k<3;k++){
  await p.waitForFunction(()=>testGame.boss.network.figures.some(f=>f.real&&f.state==='stuck'),null,{timeout:25000});if(k===0)await shot(p,'infoshum-live-stuck');
  await p.evaluate(()=>{const g=testGame,f=g.boss.network.figures.find(f=>f.real),s=g.platforms.filter(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.ty)<2)[0];Object.assign(g.player,{x:f.x-60,y:f.ty-48,grounded:true,supportId:s?.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:1});});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');await p.waitForTimeout(700);await shot(p,'infoshum-live-silence');
 await p.waitForFunction(()=>['ending','won','playing'].includes(testGame.mode),null,{timeout:6000});
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS live keys: the wall of screens smashed, 3 stunned eyes of the colossus swatted, 3 hits on the stuck real double, silence defeat and finale.');
})().catch(e=>{console.error(e);process.exit(1);});
