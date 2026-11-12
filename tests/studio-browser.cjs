const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 const until=(p,target,extra=0)=>p.evaluate(([target,extra])=>{const n=testGame.boss.studio,m=()=>n.phase+':'+n.mode;for(let i=0;i<60*40&&m()!==target;i++)advanceMontage(1);advanceMontage(extra);testGame.updateCamera();return m();},[target,extra]);
 const place=(p,index,dx=20)=>p.evaluate(([index,dx])=>{const g=testGame,s=g.platforms.find(s=>s.id==='6:'+index);Object.assign(g.player,{x:s.x+dx,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,inv:0});g.updateCamera();},[index,dx]);
 for(const [width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const atlas=await p.evaluate(async()=>{
   const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{stepBoss}=await import('./boss.js?v=0.21.5'),{stepStudioPlatforms}=await import('./manipulator-combat.js?v=0.21.5');activateRoom(g,6);g.mode='playing';g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.hintsEnabled=false;g.boss.noticeTime=0;g.step=()=>{};g.testingInvulnerable=true;
   window.advanceMontage=n=>{for(let i=0;i<n;i++){g.time+=1/60;stepBoss(g,1/60);stepStudioPlatforms(g,1/60);}};
   return ['manipulator','manipulatorCrane','manipulatorProjector','manipulatorFilm','manipulatorFx'].map(k=>[testUI.assets[k].naturalWidth,testUI.assets[k].naturalHeight]);
  });assert.deepEqual(atlas,[[724,543],[768,512],[768,512],[768,512],[768,512]]);
  await place(p,4,200);
  assert.equal(await until(p,'1:aim',30),'1:aim');await shot(p,'montage-aim-'+width);
  assert.equal(await until(p,'1:pan',120),'1:pan');assert.ok(await p.evaluate(()=>!!testGame.boss.studio.beam));await shot(p,'montage-pan-'+width);
  assert.equal(await until(p,'1:overheat',20),'1:overheat');assert.ok(await p.evaluate(async()=>{const{bossTargets}=await import('./target-highlight.js?v=0.21.5');return bossTargets(testGame).length===1;}));await shot(p,'montage-overheat-'+width);
  await p.evaluate(async()=>{const{damageBoss}=await import('./boss.js?v=0.21.5');damageBoss(testGame,1);testGame.boss.studio.hitThisWindow=false;testGame.boss.studio.timer=1;damageBoss(testGame,1);});
  await place(p,14,30);
  assert.equal(await until(p,'2:frame',50),'2:frame');await shot(p,'montage-viewfinder-'+width);
  assert.equal(await until(p,'2:snap',2),'2:snap');await shot(p,'montage-snap-'+width);
  await p.evaluate(()=>{const n=testGame.boss.studio;n.scissorsClock=0;advanceMontage(30);testGame.updateCamera();});await shot(p,'montage-scissors-'+width);
  assert.equal(await until(p,'2:develop',30),'2:develop');await shot(p,'montage-develop-'+width);
  await p.evaluate(async()=>{const{damageBoss}=await import('./boss.js?v=0.21.5');testGame.boss.hp=9;damageBoss(testGame,1);});
  await place(p,4,200);
  assert.equal(await until(p,'3:project',30),'3:project');assert.ok(await p.evaluate(()=>testGame.boss.studio.fakes.length>=3));await shot(p,'montage-projector-'+width);
  assert.equal(await until(p,'3:beam',4),'3:beam');await shot(p,'montage-laser-'+width);
  assert.equal(await until(p,'3:dark',10),'3:dark');await shot(p,'montage-dark-'+width);
  await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>JSON.stringify(testGame.boss.studio));await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>JSON.stringify(testGame.boss.studio)),frozen);await p.keyboard.press('Escape');
  const portrait=await p.evaluate(async()=>{const {drawBossHud}=await import('./boss-hud.js?v=0.21.5'),c=document.createElement('canvas');c.width=800;c.height=80;const ctx=c.getContext('2d');drawBossHud(ctx,testUI.assets,testGame,800);const data=ctx.getImageData(175,3,62,62).data;let alpha=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)alpha++;return alpha;});
  assert.ok(portrait>100&&portrait<62*62*.9,String(portrait));
  await p.evaluate(async()=>{const{damageBoss}=await import('./boss.js?v=0.21.5');testGame.storyEnabled=true;damageBoss(testGame,99,true);});await p.waitForFunction(()=>testGame.mode==='bossDefeat');
  if(width===1366){await p.evaluate(()=>{testGame.defeat.time=.5;});await p.waitForTimeout(60);await shot(p,'montage-defeat-'+width);}
  await p.evaluate(()=>testGame.skipBossDefeat());await p.waitForFunction(()=>testGame.mode==='interlude');assert.equal(await p.evaluate(()=>testGame.interlude.boss),'manipulator');
  for(const [from,to]of[[2,3],[4,5],[6,7]]){
   await p.evaluate(({from,to})=>{testGame.interlude=null;testGame.loading={from,to,duration:1.8,time:.8,transferred:false};testGame.mode='loading';testGame.boss.active=false;testRenderer.draw(testGame,0,2);},{from,to});
   await shot(p,'route-'+from+'-'+to+'-'+width);
  }
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 // Real keyboard paw strikes on the smoking camera.
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{exposeManipulator}=await import('./manipulator-combat.js?v=0.21.5');activateRoom(testGame,6);testGame.enemies=[];testGame.notebooks=[];testGame.boss.noticeTime=0;testGame.testingInvulnerable=true;window.exposeManipulator=exposeManipulator;});
 for(let i=0;i<6;i++){
  const hp=await p.evaluate(()=>{const g=testGame,b=g.boss;exposeManipulator(g);const s=g.platforms.find(s=>s.room===6&&s.index===b.platformIndex);Object.assign(g.player,{x:b.x-30,y:s.y-48,grounded:true,supportId:s.id,dir:1,cooldown:0,attack:0,vx:0,vy:0,inv:0});g.updateCamera();return b.hp;});
  await p.keyboard.down('Space');await p.waitForFunction(hp=>testGame.boss.hp<hp,hp);await p.keyboard.up('Space');await p.waitForTimeout(700);
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');assert.equal(await p.evaluate(()=>testGame.bolts.length),0);await p.evaluate(()=>{testGame.storyEnabled=true;testGame.skipBossDefeat();});await p.waitForFunction(()=>testGame.mode==='interlude');
 await p.close();await browser.close();assert.deepEqual(errors,[]);console.log('PASS studio «Монтаж»: crane pan, overheat, viewfinder and stop-frame, scissors, reel-less opening, projector illusions, laser, dark opening and defeat at 5 viewports; six real keyboard strikes; 3 map transitions.');
})().catch(e=>{console.error(e);process.exit(1);});
