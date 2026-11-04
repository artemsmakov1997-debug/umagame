const{chromium}=require('playwright');
const assert=require('node:assert/strict');
const{open,shot,fixture}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1865,930],[2865,1390],[1280,960],[320,844],[390,844],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p);
  assert.ok(await p.evaluate(()=>testUI.assets.menu.src.includes('menu-compact.png')));
  await p.evaluate(()=>window.testTime=1.3);await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>testUI.idleAction),'lick');
  assert.ok(await p.locator('.menu-options').evaluate(e=>[...e.children].every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})));
  await shot(p,'new-menu-pile-'+width);
  await p.click('#start-game');await p.waitForFunction(()=>window.testGame?.mode==='prologue');
  for(let i=0;i<4;i++){
   await p.waitForTimeout(25);assert.equal(await p.locator('#ending-title').textContent(),'');assert.equal(await p.locator('#ending-count').textContent(),'');assert.equal(await p.locator('.ending-panel header').isVisible(),false);
   assert.ok((await p.locator('#ending-caption').textContent()).length>20);const next=await p.locator('#ending-next').boundingBox();assert.ok(next.y+next.height<=height+1,JSON.stringify({width,height,next}));
   if(i===0)await shot(p,'unlabelled-opening-'+width);await p.click('#ending-next');
  }
  await p.waitForFunction(()=>testGame.mode==='waking');await p.evaluate(()=>{testGame.step=()=>{};testGame.wakeTime=.2;});await p.waitForTimeout(70);
  const boxes=await p.evaluate(()=>{const box=id=>document.getElementById(id).getBoundingClientRect().toJSON();return{hud:box('game-hud'),field:box('game')};});
  assert.ok(boxes.hud.height>=60&&Math.abs(boxes.hud.bottom-boxes.field.top)<1,JSON.stringify(boxes));assert.ok(Math.abs(boxes.field.bottom-height)<1);assert.equal(boxes.hud.width,width);
  if(width>=1000){
   assert.equal(await p.evaluate(()=>testGame.camera),0);assert.equal(await p.evaluate(()=>testGame.viewWidth),768);
   const full=await p.evaluate(()=>{const g=testGame,c=testRenderer.c,vw=c.canvas.width,s=Math.min(vw/768,480/512);return{left:(vw-768*s)/2,right:(vw+768*s)/2,top:(480-512*s)/2,bottom:(480+512*s)/2,width:vw,sourceWidth:testRenderer.backdrops[0].width};});
   assert.ok(full.left>=0&&full.right<=full.width+.01&&full.top>=0&&full.bottom<=480.01);assert.equal(full.sourceWidth,768,'quiet room contains one complete painted room, without mirrored copies');
  }
  await shot(p,'complete-room-separated-hud-'+width);
  await fixture(p,2);await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.0');activateRoom(testGame,2);testGame.enemies=[];testGame.notebooks=[];testGame.boss.noticeTime=999;testGame.step=()=>{};});await p.waitForTimeout(90);
  const boss=await p.evaluate(()=>{const h=document.getElementById('hud'),d=h.getContext('2d').getImageData(0,0,h.width,h.height).data;let phase=0,name=0,lastY=0;for(let i=0;i<d.length;i+=4){if(d[i]===121&&d[i+1]===230&&d[i+2]===255){phase++;lastY=Math.max(lastY,Math.floor(i/4/h.width));}if(d[i]===255&&d[i+1]===228&&d[i+2]===177)name++;}return{phase,name,lastY,height:h.height,hud:h.getBoundingClientRect().bottom,field:document.getElementById('game').getBoundingClientRect().top};});
  assert.ok(boss.phase===0&&boss.name>10,JSON.stringify(boss));assert.ok(boss.hud<=boss.field+1);await shot(p,'separate-boss-panel-'+width);
  const contour=await p.evaluate(async()=>{const{drawTargetSprite}=await import('./target-art.js?v=0.21.0'),a=testUI.assets,frame=[0,0,a.destructibles.width/4,a.destructibles.height/3],images=[];for(const intact of[false,true]){const c=document.createElement('canvas');c.width=112;c.height=102;drawTargetSprite(c.getContext('2d'),a.destructibles,frame,11,11,90,80,0,intact);images.push(c.getContext('2d').getImageData(0,0,112,102).data);}let added=0;for(let i=3;i<images[0].length;i+=4)if(images[0][i]<10&&images[1][i]>100)added++;return added;});assert.ok(contour>100,'bright contour follows the intact device silhouette');
  await p.evaluate(()=>{const g=testGame;g.storyEnabled=false;g.mode='playing';g.lives=1;g.loseLife();});await p.locator('#overlay:not([hidden])').waitFor();await p.waitForTimeout(70);
  assert.equal(await p.locator('#result-title').textContent(),'Инфошум победил');assert.equal(await p.locator('#defeat-art').isVisible(),true);
  assert.deepEqual(await p.locator('.result-actions button:visible').allTextContents(),['Повторить локацию','Начать заново','Библиотека','Главное меню']);
  const fit=await p.locator('.result-panel').evaluate(e=>{const r=e.getBoundingClientRect();return{panel:r.toJSON(),last:e.querySelector('#return-menu').getBoundingClientRect().toJSON(),viewport:innerHeight};});assert.ok(fit.panel.top>=0&&fit.last.bottom<=height+1,JSON.stringify(fit));await shot(p,'infoshum-won-'+width);
  await p.click('#result-library');await p.locator('#library-screen:not([hidden])').waitFor();await p.click('#library-screen [data-back]');assert.equal(await p.locator('#defeat-art').isVisible(),true);
  await p.click('#retry-location');assert.equal(await p.evaluate(()=>testGame.lives),3);assert.equal(await p.locator('#overlay').isVisible(),false);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: existing licking Uma on a painted minion pile; heading-free opening; complete PC room without mirrored edges; separate counters and central boss HUD; silhouette contours; illustrated defeat, four actions, library return and retry at 7 sizes.');
})().catch(e=>{console.error(e);process.exit(1);});
