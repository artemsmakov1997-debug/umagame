// Browser regression: actual game assets and both visual states, not just boss logic.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']});
 const errors=[];
 for(const [width,height] of [[1536,864],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});
  page.on('pageerror',e=>errors.push(e.message));
  await open(page,{story:false});await begin(page,{intro:false});
  const result=await page.evaluate(async()=>{
   const {activateRoom}=await import('./room-transitions.js?v=0.21.5');
   const g=testGame;activateRoom(g,8);g.mode='playing';g.storyEnabled=false;g.enemies=[];g.fishes=[];g.soups=[];g.notebooks=[];g.boss.active=true;g.boss.noticeTime=0;
   g.step=()=>{};g.updateCamera();
   const a=testUI.assets;
   const sizes={crt:[1536,240],body:[1920,280],terminal:[320,60],network:[1536,512],freed:[1536,512],platform:[64,42]};
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
   n.monitors[0].state='broken';n.monitors[1].state='broken';
   n.defeatedMonitors=2;n.stage='rupture';n.mode='rupture';n.timer=.01;n.transitionProgress=.9;g.boss.hp=16;
   testRenderer.draw(g,0,4);
   out.ruptureScene=document.getElementById('game').toDataURL();
   const {stepBoss}=await import('./boss.js?v=0.21.5');stepBoss(g,.04);
   testRenderer.draw(g,0,5);
   out.freedScene=document.getElementById('game').toDataURL();
   out.stage=n.stage;out.hidden=g.platforms.filter(p=>p.room===8&&p.bossHidden).length;
   return out;
  });
  for(const [name,[w,h]] of Object.entries({crt:[1536,240],body:[1920,280],terminal:[320,60],network:[1536,512],freed:[1536,512],platform:[64,42]})){
   assert.deepEqual([result[name].width,result[name].height],[w,h],name+' full atlas is decoded');
   assert.ok(result[name].complete,name+' is ready');
  }
  assert.equal(result.clearScreens,true,'glass must never be crossed by a platform');
  assert.notEqual(result.fullScene,result.openScene,'opening a monitor visibly changes game canvas');
  assert.notEqual(result.openScene,result.ruptureScene,'rupture visibly changes the game');
  assert.notEqual(result.ruptureScene,result.freedScene,'freed form has a distinct illustrated arena');
  assert.equal(result.stage,'free');assert.ok(result.hidden>0);
  await shot(page,'infoshum-approved-freed-'+width);
  await page.evaluate(async()=>{const {activateRoom}=await import('./room-transitions.js?v=0.21.5');activateRoom(testGame,8);testGame.mode='playing';testGame.boss.active=true;testGame.boss.network.activeIndex=1;testGame.boss.network.mode='recover';testRenderer.draw(testGame,0,8);});
  await shot(page,'infoshum-approved-network-'+width);
  await page.close();
 }
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: 6 genuine SVG asset atlases decoded; three CRTs unobstructed; visible screen, rupture and freed scene changes; desktop and phone screenshots.');
})().catch(e=>{console.error(e);process.exit(1);});
