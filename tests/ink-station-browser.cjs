const{chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await b.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const result=await p.evaluate(async()=>{
   const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.6'),{createEnemies,rooms}=await import('./level.js?v=0.21.6'),{PRESSES}=await import('./newsroom-systems.js?v=0.21.6');activateRoom(g,1);g.mode='playing';g.enemies=createEnemies().filter(e=>e.inkStation);g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');g.step=()=>{};
   const s=g.platforms.find(s=>s.id==='1:3');Object.assign(g.player,{x:s.x+20,y:s.y-48,grounded:true,supportId:s.id,inv:99,vx:0,vy:0});
   window.advanceInk=n=>{for(let i=0;i<n;i++)Object.getPrototypeOf(g).step.call(g,1/60,{});};advanceInk(180);const first=g.inks[0],start=first.localX;advanceInk(22*60);
   const e=g.enemies[0];return{presses:PRESSES.length,removed:!PRESSES.some(p=>p.x===2010),count:g.inks.length,kept:g.inks.includes(first),time:first.time,moved:start-first.localX,stationary:e.x===rooms[1].x+2048,landsOnBelt:g.inks.every(i=>i.platformId==='1:0'&&i.persistent),art:testUI.assets.newsroomInkStation.complete&&testUI.assets.newsroomInkStation.naturalWidth===1086};
  });assert.equal(result.presses,3);assert.ok(result.removed&&result.kept&&result.stationary&&result.landsOnBelt&&result.art);assert.ok(result.count>8&&result.count<35);assert.equal(result.time,9);assert.ok(result.moved>950);
  await p.evaluate(()=>{const g=testGame,s=g.platforms.find(s=>s.id==='1:6');Object.assign(g.player,{x:s.x+20,y:s.y-48,vx:0,vy:0,grounded:true,supportId:s.id});for(let i=0;i<180&&g.enemies[0].state!=='stamping';i++)advanceInk(1);g.updateCamera();});await shot(p,'ink-station-'+width);
  await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>JSON.stringify(testGame));await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>JSON.stringify(testGame)),frozen);await p.keyboard.press('Escape');
  const stopped=await p.evaluate(()=>{const g=testGame,e=g.enemies[0];e.inv=0;g.hitEnemy(e);e.inv=0;g.hitEnemy(e);const count=g.inks.length,serial=g.tacticalSerial;advanceInk(60);return{dead:e.dead,kept:g.inks.length===count,stopped:g.tacticalSerial===serial};});assert.deepEqual(stopped,{dead:true,kept:true,stopped:true});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 assert.deepEqual(errors,[]);await b.close();console.log('PASS: three presses, drawn grounded station, continuous distant casting, persistent moving belt ink beyond nine seconds/eight blots, bounded accumulation, pause and defeated source at five viewport sizes; no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
