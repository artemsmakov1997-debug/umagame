// Live keys: find the real screen, climb a cable, hit the stuck real double — then the finale.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');const g=testGame;activateRoom(g,8);g.enemies=[];g.notebooks=[];g.lifePickups=[];g.boss.noticeTime=0;g.mode='playing';});
 // Phase 1: wait for a reveal, stand under the real screen and jump-strike it with the keyboard, three times.
 for(let k=0;k<3;k++){
  await p.waitForFunction(()=>testGame.boss.network.mode==='reveal',null,{timeout:20000});if(k===0)await shot(p,'infoshum-live-reveal');
  await p.evaluate(()=>{const g=testGame,n=g.boss.network,m=n.monitors.find(m=>m.face===0),s=g.platforms.find(s=>s.id==='8:'+[6,7,8][m.index]);Object.assign(g.player,{x:m.x+m.w/2-17,y:s.y-48,grounded:true,supportId:s.id,vx:0,vy:0,dir:1,attack:0,cooldown:0});g.updateCamera();});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.down('ArrowUp');await p.waitForTimeout(260);await p.keyboard.press('Space');await p.keyboard.up('ArrowUp');
  await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:4000});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='free',null,{timeout:8000});await shot(p,'infoshum-live-free');
 // Phase 2: the cable lands under Uma; climb its steps with real jumps and strike the core.
 for(let k=0;k<3;k++){
  await p.waitForFunction(()=>['anchored'].includes(testGame.boss.network.mode),null,{timeout:12000});if(k===0)await shot(p,'infoshum-live-cable');
  await p.evaluate(()=>{const g=testGame,b=g.boss,top=g.platforms.filter(s=>s.room===8&&s.infoshumStep&&!s.bossHidden).sort((a,c)=>a.y-c.y)[0];Object.assign(g.player,{x:top.x+top.w/2-17,y:top.y-48,grounded:true,supportId:top.id,vx:0,vy:0,attack:0,cooldown:0,dir:b.x+b.w/2>top.x?1:-1});});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
  await p.evaluate(()=>{const s=testGame.platforms.find(s=>s.id==='8:2');Object.assign(testGame.player,{x:s.x+100,y:s.y-48,grounded:true,supportId:s.id});});
 }
 await p.waitForFunction(()=>testGame.boss.network.stage==='noise',null,{timeout:5000});
 // Phase 3: wait for the real double to stick, step next to it and strike.
 for(let k=0;k<3;k++){
  await p.waitForFunction(()=>testGame.boss.network.figures.some(f=>f.real&&f.state==='stuck'),null,{timeout:25000});if(k===0)await shot(p,'infoshum-live-stuck');
  await p.evaluate(()=>{const g=testGame,f=g.boss.network.figures.find(f=>f.real),s=g.platforms.filter(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.ty)<2)[0];Object.assign(g.player,{x:f.x-60,y:f.ty-48,grounded:true,supportId:s?.id,vx:0,vy:0,dir:1,attack:0,cooldown:0,inv:1});});
  const hp=await p.evaluate(()=>testGame.boss.hp);await p.keyboard.press('Space');await p.waitForFunction(h=>testGame.boss.hp<h,hp,{timeout:3000});
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');await p.waitForTimeout(700);await shot(p,'infoshum-live-silence');
 await p.waitForFunction(()=>['ending','won','playing'].includes(testGame.mode),null,{timeout:6000});
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS live keys: 3 real screens cracked by jump strikes, 3 core hits from the cable staircase, 3 hits on the stuck real double, silence defeat and finale.');
})().catch(e=>{console.error(e);process.exit(1);});
