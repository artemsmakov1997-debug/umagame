// Live keys: smash the screens he looks out of, hit the stuck real double, hit the spent core — then the finale.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');const g=testGame;activateRoom(g,8);g.enemies=[];g.notebooks=[];g.lifePickups=[];g.boss.noticeTime=0;g.mode='playing';});
 // Phase 1 «Телекомната»: wait for his face in a screen, stand under it and swat it — ten screens.
 for(let k=0;k<10;k++){
  await p.waitForFunction(()=>testGame.boss.network.tvs.some(t=>['face','charge'].includes(t.state)),null,{timeout:20000});if(k===0)await shot(p,'infoshum-live-face');
  const hp=await p.evaluate(()=>{const g=testGame,n=g.boss.network,t=n.tvs.find(t=>['face','charge'].includes(t.state)),s=g.platforms.find(s=>s.room===8&&s.index===t.on);Object.assign(g.player,{x:t.x+t.w/2-g.player.w-4,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:1});g.updateCamera();return g.boss.hp;});
  await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='noise',null,{timeout:8000});await shot(p,'infoshum-live-ghosts');
 // Phase 2 «Белый шум»: wait for the real double to stick, step next to it and strike.
 for(let k=0;k<3;k++){
  await p.waitForFunction(()=>testGame.boss.network.figures.some(f=>f.real&&f.state==='stuck'),null,{timeout:25000});if(k===0)await shot(p,'infoshum-live-stuck');
  await p.evaluate(()=>{const g=testGame,f=g.boss.network.figures.find(f=>f.real),s=g.platforms.filter(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.ty)<2)[0];Object.assign(g.player,{x:f.x-60,y:f.ty-48,grounded:true,supportId:s?.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:1});});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='storm',null,{timeout:5000});
 // Phase 3 «Буря и ядро»: wait until the spent core sinks over a high island, stand there and strike.
 for(let k=0;k<3;k++){
  await p.waitForFunction(()=>testGame.boss.network.storm.mode==='spent',null,{timeout:20000});if(k===0)await shot(p,'infoshum-live-storm');
  await p.evaluate(()=>{const g=testGame,s=g.boss.network.storm,isl=g.platforms.filter(q=>q.room===8&&[9,10].includes(q.index)).sort((a,c)=>Math.abs(a.x+a.w/2-s.x)-Math.abs(c.x+c.w/2-s.x))[0];Object.assign(g.player,{x:s.x-g.player.w-20,y:isl.y-48,h:48,grounded:true,supportId:isl.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:2});g.updateCamera();});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');await p.waitForTimeout(700);await shot(p,'infoshum-live-silence');
 await p.waitForFunction(()=>['ending','won','playing'].includes(testGame.mode),null,{timeout:6000});
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS live keys: 10 screens smashed, 3 hits on the stuck real double, 3 hits on the spent core, silence defeat and finale.');
})().catch(e=>{console.error(e);process.exit(1);});
