// Browser regression: actual game assets and both visual states, not just boss logic.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']});
 const errors=[];
 for(const [width,height] of [[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});
  page.on('pageerror',e=>errors.push(e.message));
  await open(page,{story:false});await begin(page,{intro:false});
  const result=await page.evaluate(async()=>{
   const {activateRoom}=await import('./room-transitions.js?v=0.21.5');
   const g=testGame;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.mode='playing';g.storyEnabled=false;g.enemies=[];g.fishes=[];g.soups=[];g.notebooks=[];g.boss.active=true;g.boss.noticeTime=0;
   g.step=()=>{};g.updateCamera();
   const a=testUI.assets;
   const sizes={crt:[2172,724],body:[1774,887],terminal:[2172,724],network:[2172,724],freed:[2172,724],platform:[2172,724]};
   const imgs={crt:a.infoshumCRT,body:a.infoshumBody,terminal:a.infoshumTerminal,network:a.infoshumArenaNetwork,freed:a.infoshumArenaFree,platform:a.infoshumPlatform};
   const out={};
   for(const [key,img] of Object.entries(imgs)){out[key]={width:img?.naturalWidth||0,height:img?.naturalHeight||0,complete:img?.complete||false};}
   const n=g.boss.network;
   const docks=[6,7,8].map(i=>g.platforms.find(s=>s.room===8&&s.index===i));
   out.clearScreens=docks.every((p,i)=>p.y>n.monitors[i].y+n.monitors[i].h+8);
   // Render two states of the same three screens.
   testRenderer.draw(g,0,2);
   out.fullScene=document.getElementById('game').toDataURL();
   n.monitors[0].state='open';n.monitors[0].openTime=3;n.activeIndex=1;
   testRenderer.draw(g,0,3);
   out.openScene=document.getElementById('game').toDataURL();
   n.monitors[0].state='broken';n.monitors[1].state='broken';n.monitors[2].state='broken';n.lastMonitorIndex=2;
   n.defeatedMonitors=3;n.stage='rupture';n.mode='rupture';n.timer=.01;n.transitionProgress=.9;g.boss.hp=16;
   testRenderer.draw(g,0,4);
   out.ruptureScene=document.getElementById('game').toDataURL();
   const {stepBoss}=await import('./boss.js?v=0.21.5');stepBoss(g,.04);
   testRenderer.draw(g,0,5);
   out.freedScene=document.getElementById('game').toDataURL();
   out.stage=n.stage;out.hidden=g.platforms.filter(p=>p.room===8&&p.bossHidden).length;
   return out;
  });
  for(const [name,[w,h]] of Object.entries({crt:[2172,724],body:[1774,887],terminal:[2172,724],network:[2172,724],freed:[2172,724],platform:[2172,724]})){
   assert.deepEqual([result[name].width,result[name].height],[w,h],name+' full atlas is decoded');
   assert.ok(result[name].complete,name+' is ready');
  }
  assert.equal(result.clearScreens,true,'glass must never be crossed by a platform');
  assert.notEqual(result.fullScene,result.openScene,'opening a monitor visibly changes game canvas');
  assert.notEqual(result.openScene,result.ruptureScene,'rupture visibly changes the game');
  assert.notEqual(result.ruptureScene,result.freedScene,'freed form has a distinct illustrated arena');
  assert.equal(result.stage,'free');assert.ok(result.hidden>0);
  await shot(page,'infoshum-approved-freed-'+width);
  await page.evaluate(async()=>{const {activateRoom}=await import('./room-transitions.js?v=0.21.5');activateRoom(testGame,8);testGame.mode='playing';testGame.boss.active=true;testGame.boss.network.activeIndex=1;testGame.boss.network.mode='recover';testGame.notice=null;testRenderer.draw(testGame,0,8);});
  await shot(page,'infoshum-approved-network-'+width);
  await page.close();
 }
 // Review all attacks through the production controller and renderer, on a full-arena viewport.
 const overview=await browser.newPage({viewport:{width:3072,height:1000}});
 overview.on('pageerror',e=>errors.push(e.message));await open(overview,{story:false,testing:true});await begin(overview);
 await overview.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');const g=testGame;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.step=()=>{};g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notice=null;g.boss.noticeTime=0;g.boss.active=true;g.boss.network.activeIndex=1;testRenderer.draw(g,0,1);});
 await shot(overview,'infoshum-approved-full-network');
 await overview.evaluate(async()=>{const g=testGame,n=g.boss.network,{stepBoss}=await import('./boss.js?v=0.21.5');n.monitors.forEach(m=>m.state='broken');n.defeatedMonitors=3;n.lastMonitorIndex=2;n.stage='rupture';n.mode='rupture';n.timer=.001;g.boss.hp=20;stepBoss(g,1/60);g.notice=null;testRenderer.draw(g,0,1);});
 await shot(overview,'infoshum-approved-full-free');
 const modes=['slamWarning','slam','weak','waveWarning','rain','scan'];
 for(const mode of modes){
  const state=await overview.evaluate(async mode=>{const g=testGame,n=g.boss.network,{stepBoss,stepProjectiles}=await import('./boss.js?v=0.21.5');for(let i=0;i<2400&&n.mode!==mode;i++){stepBoss(g,1/60);stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});g.time+=1/60;}if(n.mode!==mode)throw Error('Attack never occurred: '+mode);if(mode==='rain')for(let i=0;i<14;i++){stepBoss(g,1/60);stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});g.time+=1/60;}g.notice=null;testRenderer.draw(g,0,g.time);return{stage:n.stage,mode:n.mode,bolts:g.bolts.map(b=>b.infoshumAttack)};},mode);
  assert.equal(state.stage,'free');assert.equal(state.mode,mode);if(mode==='rain')assert.ok(state.bolts.includes('rain'));
  await shot(overview,'infoshum-approved-attack-'+mode);
 }
 const renderTime=await overview.evaluate(()=>{const samples=[];for(let i=0;i<60;i++){const start=performance.now();testRenderer.draw(testGame,0,testGame.time);samples.push(performance.now()-start);}return samples.sort((a,b)=>a-b)[30];});
 assert.ok(Number.isFinite(renderTime));console.log('Full-arena render median (software Chromium): '+renderTime.toFixed(2)+' ms');await overview.close();
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: production pixel atlases decoded; three CRTs unobstructed; visible screen, rupture and freed scene changes; desktop and phone screenshots.');
})().catch(e=>{console.error(e);process.exit(1);});
