const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const [width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const atlas=await p.evaluate(async()=>{
   const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{drawManipulatorPose}=await import('./manipulator-art.js?v=0.21.5');activateRoom(g,6);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.hintsEnabled=false;g.boss.noticeTime=0;g.step=()=>{};
   const image=testUI.assets.manipulator,c=document.createElement('canvas');c.width=c.height=140;const ctx=c.getContext('2d'),frames=[];
   for(let row=0;row<6;row++)for(let col=0;col<4;col++){ctx.clearRect(0,0,140,140);drawManipulatorPose(ctx,testUI.assets,row,col,0,0,140,130);frames.push(c.toDataURL());}
   const s=g.platforms.find(s=>s.id==='6:1');Object.assign(g.player,{x:s.x+15,y:s.y-48,grounded:true,supportId:s.id});g.updateCamera();
   return {size:[image.naturalWidth,image.naturalHeight],count:new Set(frames).size};
  });assert.deepEqual(atlas.size,[1024,1536]);assert.equal(atlas.count,24);
  for(const mode of['rest','rewrite','charge','beam','recover','relocate']){
   await p.evaluate(async mode=>{const g=testGame,b=g.boss,n=b.studio,{stepBoss}=await import('./boss.js?v=0.21.5'),{beginStudioRelocation}=await import('./manipulator-combat.js?v=0.21.5');
    if(mode==='relocate')beginStudioRelocation(g);else{b.phased=false;n.mode='rewrite';n.timer=0;stepBoss(g,1/60);n.mode=mode;n.timer=mode==='charge'?.25:.5;}
    if(mode==='beam'){const s=g.platforms.find(s=>s.id==='6:7');s.studioPhase='gap';const q=g.platforms.find(s=>s.id==='6:9');q.studioPhase='warning';}
    testRenderer.draw(g,0,2.1);
   },mode);await shot(p,'studio-'+mode+'-'+width);
  }
  for(const [from,to]of[[2,3],[4,5],[6,7]]){
   await p.evaluate(({from,to})=>{testGame.loading={from,to,duration:1.8,time:.8,transferred:false};testGame.mode='loading';testGame.boss.active=false;testRenderer.draw(testGame,0,2);},{from,to});
   await shot(p,'route-'+from+'-'+to+'-'+width);await p.keyboard.press('Escape');const before=await p.evaluate(()=>JSON.stringify(testGame.loading));await p.waitForTimeout(60);assert.equal(await p.evaluate(()=>JSON.stringify(testGame.loading)),before);await p.keyboard.press('Escape');
  }
  const portraits=await p.evaluate(async()=>{
   const {activateRoom}=await import('./room-transitions.js?v=0.21.5'),{drawBossHud}=await import('./boss-hud.js?v=0.21.5'),g=testGame,c=document.createElement('canvas');c.width=800;c.height=80;const ctx=c.getContext('2d'),out=[];
   g.loading=null;g.mode='playing';for(const room of[2,4,6,8]){activateRoom(g,room);ctx.clearRect(0,0,800,80);drawBossHud(ctx,testUI.assets,g,800);const data=ctx.getImageData(175,3,62,62).data;let alpha=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)alpha++;out.push(alpha);}return out;
  });for(const amount of portraits){assert.ok(amount>100);assert.ok(amount<62*62*.9,'head must have transparent silhouette, not a filled square');}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 // Actual keyboard attacks use the same collision and cooldown paths as play.
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');activateRoom(testGame,6);testGame.enemies=[];testGame.notebooks=[];testGame.boss.noticeTime=0;});
 for(let i=0;i<6;i++){
  await p.waitForFunction(()=>testGame.boss.studio.mode==='recover'||testGame.boss.studio.mode==='rest');
  const hp=await p.evaluate(()=>{const g=testGame,b=g.boss,s=g.platforms.find(s=>s.room===6&&s.index===b.platformIndex);Object.assign(g.player,{x:b.x-30,y:s.y-48,grounded:true,supportId:s.id,dir:1,cooldown:0,attack:0,vx:0,vy:0});g.updateCamera();return b.hp;});
  await p.keyboard.down('Space');await p.waitForFunction(hp=>testGame.boss.hp<hp,hp);await p.keyboard.up('Space');if(i<5)assert.equal(await p.evaluate(()=>testGame.boss.studio.mode),'relocate');
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');assert.equal(await p.evaluate(()=>testGame.boss.studio.relocations),5);assert.equal(await p.evaluate(()=>testGame.bolts.length),0);await shot(p,'studio-defeat-live');await p.evaluate(()=>{testGame.storyEnabled=true;testGame.skipBossDefeat();});await p.waitForFunction(()=>testGame.mode==='interlude');assert.equal(await p.evaluate(()=>testGame.interlude.boss),'manipulator');
 await p.close();await browser.close();assert.deepEqual(errors,[]);console.log('PASS studio: 24 animation cells, 6 fight states, 3 map transitions and transparent boss faces at 5 viewports; six actual keyboard counters, relocations, defeat and preserved story.');
})().catch(e=>{console.error(e);process.exit(1);});
