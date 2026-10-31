const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const artifacts=process.env.UMA_ARTIFACTS||'/tmp/uma-browser';fs.mkdirSync(artifacts,{recursive:true});
const url=process.env.GAME_URL||'http://127.0.0.1:8000';
async function observe(page){
 await page.evaluate(async()=>{
  const {Renderer}=await import('./render.js?v=0.6.0');const draw=Renderer.prototype.draw;
  Renderer.prototype.draw=function(g,dt,time){window.storyGame=g;window.storyRenderer=this;return draw.call(this,g,dt,time);};
 });
}
async function skip(page){await page.locator('#dialogue:not([hidden])').waitFor();await page.click('#dialogue-skip');}
async function at(page,room,index=2,x=604){
 await page.evaluate(async({room,index,x})=>{
  const {WIDTH,platforms}=await import('./level.js?v=0.6.0');const g=storyGame,s=platforms.find(p=>p.room===room&&p.index===index);
  Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,vx:0,vy:0,grounded:true,inv:0,knock:0,dash:0,attack:0,cooldown:0});
 },{room,index,x});
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,headless:true,args:['--no-sandbox']});const errors=[];
 const page=await browser.newPage({viewport:{width:1536,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#start-game:not([disabled])').waitFor();await page.evaluate(()=>document.fonts.ready);await observe(page);
 await page.click('#start-game');await page.waitForFunction(()=>window.storyGame);
 assert.equal(await page.evaluate(()=>storyGame.dialogue.id),'intro');assert.equal(await page.locator('#dialogue').isVisible(),true);
 assert.ok(await page.locator('#narrator-portrait').evaluate(e=>e.complete&&e.naturalWidth>1000&&e.src.includes('yuri-shmakov.png')));
 assert.ok((await page.locator('#dialogue-speaker').textContent()).includes('ЮРИЙ ШМАКОВ'));
 const opening=await page.evaluate(()=>({clock:storyGame.clock,x:storyGame.player.x,y:storyGame.player.y,enemy:storyGame.enemies[0].timer}));
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(140);await page.keyboard.up('ArrowRight');
 assert.deepEqual(await page.evaluate(()=>({clock:storyGame.clock,x:storyGame.player.x,y:storyGame.player.y,enemy:storyGame.enemies[0].timer})),opening);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogue-skip');
 await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogue-next');
 await page.locator('.cabinet').screenshot({path:path.join(artifacts,'story-opening.png')});
 for(let i=1;i<4;i++){await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>storyGame.dialogue.page),i);}
 await page.keyboard.press('Space');assert.equal(await page.locator('#dialogue').isHidden(),true);assert.equal(await page.evaluate(()=>storyGame.player.swing),0);
 await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>storyGame.dialogue?.id==='infonoise');await page.keyboard.up('ArrowRight');
 assert.equal(await page.locator('#dialogue-scene').textContent(),'ИНФОШУМ');const firstClock=await page.evaluate(()=>storyGame.clock);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>storyGame.clock),firstClock);await skip(page);
 await page.evaluate(()=>{storyGame.enemies=[];storyGame.relays[0].hp=1;});await at(page,0);await page.keyboard.press('Space');
 await page.waitForFunction(()=>storyGame.dialogue?.id==='chapter0');assert.equal(await page.evaluate(()=>storyGame.clueFound),true);await skip(page);
 // Five real render layers differ, rather than reusing a recolored office.
 assert.equal(await page.evaluate(()=>new Set(storyRenderer.layers.map(c=>c.toDataURL())).size),5);
 for(let room=1;room<=3;room++){
  await at(page,room,0,45);await page.waitForFunction(r=>storyGame.dialogue?.id==='arrival'+r,room);await skip(page);
  await at(page,room);await page.evaluate(r=>storyGame.relays[r].hp=1,room);await page.keyboard.press('Space');
  await page.waitForFunction(r=>storyGame.dialogue?.id==='chapter'+r,room);assert.equal(await page.evaluate(()=>storyGame.people.filter(p=>p.rescued).length),room);
  await skip(page);
 }
 await at(page,4,0,45);await page.waitForFunction(()=>storyGame.dialogue?.id==='arrival4');await skip(page);
 await at(page,4);await page.waitForFunction(()=>storyGame.dialogue?.id==='source');assert.equal(await page.evaluate(()=>storyGame.boss.active),true);await skip(page);
 await page.evaluate(async()=>{const {damageBoss}=await import('./boss.js?v=0.6.0');storyGame.boss.hp=1;storyGame.boss.cooldown=0;storyGame.boss.state='recover';damageBoss(storyGame,1);});
 await page.waitForFunction(()=>storyGame.dialogue?.id==='ending');assert.equal(await page.evaluate(()=>storyGame.people.filter(p=>p.rescued).length),4);await page.locator('.cabinet').screenshot({path:path.join(artifacts,'story-ending.png')});
 await skip(page);await page.waitForFunction(()=>storyGame.mode==='won');await page.locator('#overlay:not([hidden])').waitFor();assert.ok((await page.locator('#result-title').textContent()).includes('РЕДАКЦИЯ'));
 await page.click('#play');assert.equal(await page.evaluate(()=>storyGame.dialogue.id),'intro');assert.equal(await page.evaluate(()=>storyGame.people.some(p=>p.rescued)),false);
 await page.click('#dialogue-menu');assert.equal(await page.locator('#menu-screen').isVisible(),true);assert.equal(await page.locator('#dialogue').isHidden(),true);
 // Telephones: long passages remain readable, buttons are usable, all time is frozen.
 for(const width of [320,390]){
  const p=await browser.newPage({viewport:{width,height:844},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.locator('#start-game:not([disabled])').waitFor();await observe(p);await p.tap('#start-game');await p.waitForFunction(()=>window.storyGame);
  await p.tap('#dialogue-next');assert.equal(await p.evaluate(()=>storyGame.dialogue.page),1);await p.evaluate(()=>document.fonts.ready);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await p.locator('#dialogue-next').evaluate(e=>e.getBoundingClientRect().height>=44));
  const text=await p.locator('#dialogue-text').boundingBox(),panel=await p.locator('.dialogue-panel').boundingBox();assert.ok(text.x>=panel.x&&text.x+text.width<=panel.x+panel.width);
  const clock=await p.evaluate(()=>storyGame.clock);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>storyGame.clock),clock);
  await p.screenshot({path:path.join(artifacts,`story-mobile-${width}.png`),fullPage:true});
  await p.tap('#dialogue-skip');await p.waitForFunction(()=>document.getElementById('dialogue').hidden);assert.equal(await p.evaluate(()=>storyGame.mode),'playing');await p.tap('[data-control="dash"]');await p.waitForFunction(()=>storyGame.player.dashCooldown>0);await p.close();
 }
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: Yuri portrait; four-page intro; frozen input/time; keyboard focus; safe monster introduction; notebook; five distinct locations; all rescues; final boss introduction; newsroom epilogue; replay; menu exit; 320/390 touch dialogue.');
})().catch(e=>{console.error(e);process.exit(1);});
