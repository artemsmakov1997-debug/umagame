const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const [width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const route=await p.evaluate(async()=>{
   const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.6'),{crossStudio,studioLib}=await import('./tests/navigation.js');
   g.step=Object.getPrototypeOf(g).step.bind(g);activateRoom(g,5);g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.enemies=[];
   const crossed=crossStudio(g,await studioLib());g.step=()=>{};g.hintsEnabled=false;g.updateCamera();
   return {crossed,support:g.player.supportId,hp:g.health,removed:!g.platforms.some(s=>s.id==='5:13'),blue:g.platforms.some(s=>s.id==='5:10'&&s.studio.color==='blue')};
  });assert.deepEqual(route,{crossed:true,support:'5:14',hp:4,removed:true,blue:true});
  // Render in the BLUE interval too: the deleted take and its lamp must stay absent.
  await p.evaluate(async()=>{const g=testGame,{updateStudioPlatforms}=await import('./studio-systems.js?v=0.21.6'),{TAKES}=await import('./studio-map.js?v=0.21.6');g.time=TAKES.beat+.1;updateStudioPlatforms(g);testRenderer.draw(g,0);});await shot(p,'studio-door-no-blue-'+width);
  const spawned=await p.evaluate(async()=>{
   const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.6'),{rooms,createEnemies}=await import('./level.js?v=0.21.6');activateRoom(g,5);g.enemies=createEnemies();const farm=g.enemies.find(e=>e.type==='botfarm');g.enemies=[farm];Object.assign(farm,{active:true,noticed:true,spawnTime:0,noticeTime:0,timer:0});
   window.flowTick=n=>{for(let i=0;i<n;i++)Object.getPrototypeOf(g).step.call(g,1/60,{});};
   const s=g.platforms.find(s=>s.id==='5:11');Object.assign(g.player,{x:rooms[5].x+2020,y:s.y-48,grounded:true,supportId:s.id,vx:0,vy:0,inv:99,attack:0,dash:0});
   for(let i=0;i<200&&!g.enemies.some(e=>e.type==='bot');i++)flowTick(1);window.flowBot=g.enemies.find(e=>e.type==='bot');farm.timer=999;
   flowTick(55);g.updateCamera();testRenderer.draw(g,0);return {spawned:!!flowBot,dir:flowBot?.dir,left:flowBot?.x<farm.x};
  });assert.deepEqual(spawned,{spawned:true,dir:-1,left:true});await shot(p,'studio-bot-left-'+width);
  const traversal=await p.evaluate(async()=>{
   const g=testGame,{rooms}=await import('./level.js?v=0.21.6'),b=flowBot;let previous=b.x,reverse=false;const visited=new Set();
   for(let i=0;i<1200&&!b.dead;i++){
    // Place Uma on alternating sides. Neither her position nor landing on a flat may turn a bot around.
    Object.assign(g.player,{x:rooms[5].x+(i%120<60?2200:80),y:100,vy:0,inv:99});flowTick(1);
    if(b.x>previous+.001||b.dir!==-1||(b.vx||0)>0)reverse=true;if(!b.jumpPhase)visited.add(b.platformIndex);previous=b.x;
   }
   const exit=g.events.some(e=>e.type==='botExit'&&e.id===b.id),atEdge=b.x<=rooms[5].x+4;flowTick(30);
   return {reverse,exit,atEdge,dead:b.dead,fade:b.deathTime,visited:[...visited],mode:g.mode};
  });assert.ok(!traversal.reverse&&traversal.exit&&traversal.atEdge&&traversal.dead,JSON.stringify(traversal));assert.equal(traversal.fade,0);assert.ok([8,3,0].every(i=>traversal.visited.includes(i)));assert.equal(traversal.mode,'playing');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 await browser.close();assert.deepEqual(errors,[]);console.log('PASS: full ordinary-jump Studio route, deleted final blue take, retained earlier blue take, real farm spawn and one-way hops to left-edge dissolution at five viewport sizes; no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
