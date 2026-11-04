const {chromium}=require('playwright');const assert=require('node:assert/strict');const {open,begin,fixture,shot}=require('./browser-helpers.cjs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']}),errors=[],timings=[];
for(const [width,height]of [[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.stack));await open(p,{story:false,testing:true});await begin(p);
 for(const room of [1,2,3,4,5,6,7,8]){
  await p.evaluate(async room=>{const{activateRoom}=await import('./room-transitions.js?v=0.22.0');const g=testGame;activateRoom(g,room);g.notebooks=[];g.chapterEvent=null;g.player.inv=999;},room);
  await p.waitForTimeout(60);await shot(p,`world-${room}-upper-${width}`);
  await p.evaluate(()=>{const g=testGame,s=g.platforms.find(s=>s.room===g.room&&s.index===5);Object.assign(g.player,{x:s.x+70,y:s.y-48,grounded:true,supportId:s.id});g.updateCamera();});await p.waitForTimeout(250);await shot(p,`world-${room}-lower-${width}`);
  const view=await p.evaluate(()=>({x:testGame.camera,y:testGame.cameraY,vy:testGame.viewHeight,inv:testGame.testingInvulnerable,overflow:document.documentElement.scrollWidth>innerWidth}));assert.ok(view.y>0&&Number.isFinite(view.x));assert.equal(view.inv,true);assert.equal(view.overflow,false);
 }
 // Real keyboard input climbs a permanent staircase; camera follows its vertical movement.
 await fixture(p,1);await p.evaluate(async()=>{const{ladders}=await import('./level.js?v=0.22.0');const l=ladders.find(l=>l.room===1),g=testGame;Object.assign(g.player,{x:l.x+8,y:952,grounded:true,supportId:'1:6'});g.updateCamera();});
 const y=await p.evaluate(()=>testGame.player.y);await p.keyboard.down('ArrowUp');await p.waitForTimeout(750);await p.keyboard.up('ArrowUp');assert.ok(await p.evaluate(y=>testGame.player.y<y-55&&testGame.player.climbTime>0,y));await shot(p,`stair-climbing-${width}`);
 if(width===1366){
  await fixture(p,1);await p.evaluate(async()=>{const{createInteractiveWorld}=await import('./world-interactions.js?v=0.22.0');createInteractiveWorld(testGame);const d=testGame.generators.find(d=>d.room===1),g=testGame;Object.assign(g.player,{x:d.x-35,y:d.y+d.h-48,dir:1,grounded:true,supportId:'1:'+d.platformIndex,cooldown:0});g.updateCamera();});await p.keyboard.press('KeyX');await p.waitForFunction(()=>testGame.generators.find(d=>d.room===1).hp===0);await shot(p,'printer-disabled');
  // Record real renderer/model cost in warmed Chromium, including new effects.
  timings.push(await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.22.0');const{createEchoTrace,stepDimension}=await import('./dimension-systems.js?v=0.22.0');activateRoom(testGame,8);const g=testGame;g.notebooks=[];g.boss.hp=7;g.relays.filter(d=>d.room===8).forEach(d=>d.hp=0);for(let n=0;n<120;n++)g.step(1/60,{});g.boss.state='recover';g.boss.timer=999;g.bolts=Array.from({length:24},(_,i)=>({room:8,kind:i%2?'paper':'packet',x:g.camera+100+i%12*35,y:g.cameraY+80+Math.floor(i/12)*40,w:17,h:16,vx:0,vy:0,ttl:120,fixedY:true}));const samples=[];for(let i=0;i<240;i++){const t=performance.now();g.step(1/60,{});testRenderer.draw(g,1/60,g.time);if(i>40)samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);return {median:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)],projectiles:g.bolts.length,temporary:g.temporarySurfaces.length,enemies:g.enemies.filter(e=>e.active&&!e.dead&&e.room===8).length};}));
 }
 await p.close();
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: eight distinct multistorey maps/arenas × five required viewports; upper/lower camera, physical keyboard stair climbing, real paw disables printer, test protection retained, no horizontal overflow or JavaScript errors.');console.log('Warm Chromium model + render milliseconds:',JSON.stringify(timings));
})().catch(e=>{console.error(e);process.exit(1);});
