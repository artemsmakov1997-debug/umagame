const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const artifacts=process.env.UMA_ARTIFACTS||'/tmp/uma-browser';fs.mkdirSync(artifacts,{recursive:true});
const url=process.env.GAME_URL||'http://127.0.0.1:8000';
async function observe(page){
 await page.evaluate(async()=>{
  const {Renderer}=await import('./render.js?v=0.7.0');const draw=Renderer.prototype.draw;
  Renderer.prototype.draw=function(g,dt,time){window.storyGame=g;window.storyRenderer=this;return draw.call(this,g,dt,time);};
 });
}
async function load(page){await page.goto(url);await page.locator('#start-game:not([disabled])').waitFor();await page.evaluate(()=>document.fonts.ready);await observe(page);}
async function skip(page){await page.locator('#dialogue:not([hidden])').waitFor();await page.click('#dialogue-skip');}
async function at(page,room,index=2,x=604){
 await page.evaluate(async({room,index,x})=>{
  const {WIDTH,platforms}=await import('./level.js?v=0.7.0');const g=storyGame,s=platforms.find(p=>p.room===room&&p.index===index);
  Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,vx:0,vy:0,grounded:true,inv:0,knock:0,dash:0,attack:0,cooldown:0});
 },{room,index,x});
}
async function layout(page){
 return page.evaluate(()=>{
  const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
  const text=document.getElementById('dialogue-text');return {panel:document.querySelector('.dialogue-panel').getBoundingClientRect().toJSON(),text:box('dialogue-text'),title:box('dialogue-scene'),name:box('dialogue-speaker'),role:document.querySelector('.narrator-role').getBoundingClientRect().toJSON(),next:box('dialogue-next'),hint:document.querySelector('.dialogue-hint').getBoundingClientRect().toJSON(),fit:text.scrollHeight<=text.clientHeight+1,overflow:document.documentElement.scrollWidth>innerWidth};
 });
}
async function checkAllPages(page,label){
 const scenes=await page.evaluate(async()=>Object.entries((await import('./story.js?v=0.7.0')).scenes));let baseline;
 for(const [id,scene]of scenes)for(const [index,text]of scene.pages.entries()){
  await page.evaluate(({id,index})=>{storyGame.mode='dialogue';storyGame.dialogue={id,page:index,after:'playing'};},{id,index});
  await page.waitForFunction(t=>document.getElementById('dialogue-text').textContent===t,text);
  const m=await layout(page);baseline??={height:m.panel.height,y:m.next.y};
  assert.equal(m.panel.height,baseline.height,`${label} ${id} fixed window height`);assert.ok(Math.abs(m.next.y-baseline.y)<1,`${label} ${id} fixed controls`);
  assert.ok(m.fit,`${label} ${id} text fits without internal scrolling`);assert.ok(!m.overflow,`${label} ${id} page overflow`);
  assert.ok(m.role.bottom<=m.title.y+1,`${label} narrator header overlaps scene title`);assert.ok(m.text.bottom<=m.next.y+1,`${label} text overlaps actions`);
  assert.ok(m.next.right<=m.panel.right,`${label} clipped buttons`);assert.ok(m.next.h>=34);
 }
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,headless:true,args:['--no-sandbox']});const errors=[];
 const page=await browser.newPage({viewport:{width:1536,height:1100}});page.on('pageerror',e=>errors.push(e.message));await load(page);
 // Title Exit ends this game session and provides a way back without closing the browser.
 await page.click('[data-menu=exit]');assert.equal(await page.locator('#exit-screen').isVisible(),true);await page.click('#exit-screen button');
 await page.click('#start-game');await page.waitForFunction(()=>window.storyGame?.mode==='waking');
 assert.equal(await page.locator('#wake-caption').isVisible(),true);assert.equal(await page.locator('#dialogue').isHidden(),true);
 await page.screenshot({path:path.join(artifacts,'wake-sleep.png'),fullPage:true});
 await page.keyboard.press('Escape');const wake=await page.evaluate(()=>storyGame.wakeTime);await page.waitForTimeout(140);assert.equal(await page.evaluate(()=>storyGame.wakeTime),wake);
 assert.deepEqual(await page.locator('[data-pause-action]').allTextContents(),['Вернуться','Рестарт','Управление','Библиотека','МЕДИА.СТРАЖ','Выход']);
 const buttons=await page.locator('[data-pause-action]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));for(let i=1;i<buttons.length;i++)assert.ok(buttons[i].top>=buttons[i-1].bottom,'vertical menu');
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>storyGame.mode),'waking');await page.click('#wake-skip');
 await page.waitForFunction(()=>storyGame.dialogue?.id==='intro');assert.equal(await page.locator('#dialogue').isVisible(),true);
 assert.ok(await page.locator('#narrator-portrait').evaluate(e=>e.complete&&e.naturalWidth>1000&&e.src.includes('yuri-shmakov.png')));
 const opening=await page.evaluate(()=>({clock:storyGame.clock,x:storyGame.player.x,y:storyGame.player.y,enemy:storyGame.enemies[0].timer}));
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);await page.keyboard.up('ArrowRight');assert.deepEqual(await page.evaluate(()=>({clock:storyGame.clock,x:storyGame.player.x,y:storyGame.player.y,enemy:storyGame.enemies[0].timer})),opening);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogue-skip');await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogue-next');
 const openingLayout=await layout(page);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>storyGame.dialogue.page),1);assert.equal((await layout(page)).next.y,openingLayout.next.y);
 // Esc pauses a dialogue instead of skipping it; library and controls return to this same menu.
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>storyGame.dialogue.page),1);assert.equal(await page.locator('#dialogue').isHidden(),true);
 await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.locator('#controls-panel').isVisible(),true);await page.keyboard.press('Escape');
 await page.click('[data-pause-action=library]');assert.equal(await page.locator('#library-screen').isVisible(),true);await page.getByRole('button',{name:'Кликбейт',exact:true}).click();const clock=await page.evaluate(()=>storyGame.clock);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>storyGame.clock),clock);await page.keyboard.press('Escape');assert.equal(await page.locator('#pause-root').isVisible(),true);
 await page.screenshot({path:path.join(artifacts,'pause-menu.png'),fullPage:true});await page.click('[data-pause-action=resume]');assert.equal(await page.evaluate(()=>storyGame.dialogue.page),1);assert.equal(await page.locator('#dialogue').isVisible(),true);
 await page.screenshot({path:path.join(artifacts,'story-opening.png'),fullPage:true});await page.keyboard.press('Space');assert.equal(await page.locator('#dialogue').isHidden(),true);assert.equal(await page.evaluate(()=>storyGame.player.swing),0);
 await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>storyGame.dialogue?.id==='infonoise');await page.keyboard.up('ArrowRight');assert.equal(await page.locator('#dialogue-scene').textContent(),'ИНФОШУМ');await skip(page);
 // Each chapter gives an evidence record, not a rescued journalist.
 await page.evaluate(()=>{storyGame.enemies=[];storyGame.relays[0].hp=1;});await at(page,0);await page.keyboard.press('Space');await page.waitForFunction(()=>storyGame.dialogue?.id==='chapter0');assert.equal(await page.evaluate(()=>storyGame.evidence[0].id),'autopublish');await skip(page);
 assert.equal(await page.evaluate(()=>new Set(storyRenderer.layers.map(c=>c.toDataURL())).size),5);
 for(let room=1;room<=3;room++){
  await at(page,room,0,45);await page.waitForFunction(r=>storyGame.dialogue?.id==='arrival'+r,room);await skip(page);await at(page,room);await page.evaluate(r=>storyGame.relays[r].hp=1,room);await page.keyboard.press('Space');
  await page.waitForFunction(r=>storyGame.dialogue?.id==='chapter'+r,room);assert.equal(await page.evaluate(()=>storyGame.evidence.length),room+1);await skip(page);
 }
 await at(page,4,0,45);await page.waitForFunction(()=>storyGame.dialogue?.id==='arrival4');assert.match(await page.locator('#dialogue-text').textContent(),/не знаю, где нахожусь/);await skip(page);await at(page,4);await page.waitForFunction(()=>storyGame.dialogue?.id==='source');await skip(page);
 await page.evaluate(async()=>{const {damageBoss}=await import('./boss.js?v=0.7.0');storyGame.boss.hp=1;storyGame.boss.cooldown=0;storyGame.boss.state='recover';damageBoss(storyGame,1);});
 await page.waitForFunction(()=>storyGame.dialogue?.id==='truth');assert.equal(await page.evaluate(()=>storyGame.truthFound),true);await page.click('#dialogue-next');assert.match(await page.locator('#dialogue-text').textContent(),/халатности/);await page.screenshot({path:path.join(artifacts,'story-truth.png'),fullPage:true});await skip(page);
 await page.waitForFunction(()=>storyGame.dialogue?.id==='ending');await page.screenshot({path:path.join(artifacts,'story-ending.png'),fullPage:true});await skip(page);await page.waitForFunction(()=>storyGame.mode==='won');await page.locator('#overlay:not([hidden])').waitFor();assert.match(await page.locator('#result-title').textContent(),/ШУМ ОСТАНОВЛЕН/);
 await page.keyboard.press('Escape');await page.click('[data-pause-action=resume]');assert.equal(await page.locator('#overlay').isVisible(),true);await page.click('#play');assert.equal(await page.evaluate(()=>storyGame.mode),'waking');assert.equal(await page.evaluate(()=>storyGame.evidence.length),0);
 await page.click('#wake-skip');await checkAllPages(page,'desktop');await page.click('#dialogue-menu');assert.equal(await page.locator('#menu-screen').isVisible(),true);
 // Real multi-touch via Chromium: moving one thumb, attacking/jumping with the other, cancellation and field gestures.
 for(const [width,height]of [[320,844],[390,844],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));await load(p);await p.tap('#start-game');await p.waitForFunction(()=>window.storyGame?.mode==='waking');await p.tap('#wake-skip');await checkAllPages(p,`${width}x${height}`);
  await p.screenshot({path:path.join(artifacts,`dialogue-final-${width}.png`),fullPage:true});await p.tap('#dialogue-skip');await p.waitForFunction(()=>storyGame.mode==='playing');await p.evaluate(()=>{storyGame.enemies=[];storyGame.fishes=[];storyGame.soups=[];});await at(p,0,0,45);
  await p.waitForTimeout(40);const field=await p.locator('#game').boundingBox(),pad=await p.locator('#stick-pad').boundingBox(),paw=await p.locator('[data-touch-action=attack]').boundingBox(),jump=await p.locator('[data-touch-action=jump]').boundingBox();
  assert.ok(paw.y+paw.height<=field.y+field.height+1);assert.ok(pad.y+pad.height<=field.y+field.height+1);assert.equal(await p.locator('#controls-art').isVisible(),false);
  const ratio=await p.evaluate(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();return Math.abs(c.width/c.height-r.width/r.height);});assert.ok(ratio<.004,'canvas preserves square pixels');
  const cdp=await p.context().newCDPSession(p),point=(id,x,y)=>({id,x,y,radiusX:3,radiusY:3});let points=[point(1,pad.x+pad.width*.3,pad.y+pad.height*.65)];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});points[0].x+=40;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});const x=await p.evaluate(()=>storyGame.player.x);await p.waitForTimeout(110);assert.ok(await p.evaluate(x=>storyGame.player.x>x+5,x),'joystick moves Uma');
  points.push(point(2,paw.x+paw.width/2,paw.y+paw.height/2));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await p.waitForFunction(()=>storyGame.player.swing>0);points.pop();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points});
  points.push(point(3,jump.x+jump.width/2,jump.y+jump.height/2));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await p.waitForFunction(()=>storyGame.player.vy<0);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(40);assert.equal(await p.evaluate(()=>storyGame.player.vx),0);assert.equal(await p.locator('#stick-pad').evaluate(e=>e.classList.contains('engaged')),false);
  await at(p,0,0,45);const cx=field.x+field.width*.7,cy=field.y+field.height*.35,swing=await p.evaluate(()=>storyGame.player.swing);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(4,cx,cy)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(s=>storyGame.player.swing>s,swing);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(5,cx,cy)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(5,cx,cy-40)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>storyGame.player.vy<0);
  await p.tap('[data-touch-action=dash]');await p.waitForFunction(()=>storyGame.player.dashCooldown>0);await p.screenshot({path:path.join(artifacts,`touch-game-${width}.png`),fullPage:true});
  await p.tap('#pause');const t=await p.evaluate(()=>storyGame.clock);await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>storyGame.clock),t);await p.tap('[data-pause-action=controls]');assert.equal(await p.locator('#controls-panel').isVisible(),true);await p.tap('#controls-back');await p.tap('[data-pause-action=library]');await p.tap('#library-screen [data-back]');assert.equal(await p.locator('#pause-root').isVisible(),true);await p.tap('[data-pause-action=restart]');assert.equal(await p.evaluate(()=>storyGame.mode),'waking');
  await p.tap('#pause');await p.tap('[data-pause-action=exit]');assert.equal(await p.locator('#exit-screen').isVisible(),true);await p.close();
 }
 // New animation assets participate in the same retry path as all other art.
 const failed=await browser.newPage();failed.on('pageerror',e=>errors.push(e.message));await failed.route('**/assets/uma-emotions.png*',r=>r.abort());await failed.goto(url);await failed.getByRole('button',{name:'Повторить загрузку'}).waitFor();
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: wake-up and infection; two-page intro; exact scene restoration through Esc/library/controls; vertical six-item menu and exit; four evidence records; human-negligence reveal; ending/replay; every dialogue page at desktop/320/390/844; actual multi-touch joystick + attack/jump, cancellation, field gestures and on-field layout; asset failure retry; no browser errors.');
})().catch(e=>{console.error(e);process.exit(1);});
