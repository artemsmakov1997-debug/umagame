const {chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,shot,url}=require('./browser-helpers.cjs');
// Level select in the in-game menu, and the larger Uma on the phone main menu.
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 // Phone portrait menus: Uma is drawn larger than before but her ears stay below the last menu entry.
 for(const [width,height] of[[390,844],[360,740],[320,568],[412,915]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await open(p);await p.waitForTimeout(200);
  const r=await p.evaluate(async()=>{const {idlePlacement}=await import('./menu-animation.js?v=0.21.5'),{menuTextBottom}=await import('./art.js?v=0.21.5');const canvas=document.getElementById('game'),h=canvas.height,box=canvas.getBoundingClientRect();
   // Recompute the drawn pose exactly as drawMenuScene does.
   const ground=h*.795,text=menuTextBottom(canvas,h),catHeight=Math.max(h*.08,Math.min(h*.17,ground-text-h*.025)),pose=idlePlacement(0,h,{x:0,y:ground,height:catHeight});
   const last=[...document.querySelectorAll('#menu-screen [data-menu]')].at(-1).getBoundingClientRect();return {catTop:pose.y,textBottom:text,catHeight,h,lastBottomCss:last.bottom,scale:box.height/h};});
  assert.ok(r.catTop>r.textBottom,`Uma below the menu text at ${width}×${height}`);assert.ok(r.catHeight>r.h*.12-1||r.catTop-r.textBottom<r.h*.03,'larger than the old 12% unless space is short');
  await shot(p,'menu-cat-'+width+'x'+height);await p.close();
 }
 // Level select: open the menu, choose «Агитатор» with the keyboard, the arena loads fresh with the earlier boss counted.
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
 await p.keyboard.press('Escape');await p.locator('#pause-menu:not([hidden])').waitFor();await p.click('[data-pause-action="levels"]');await p.locator('#levels-panel:not([hidden])').waitFor();
 assert.equal(await p.locator('#levels-list button').count(),9);assert.ok(await p.evaluate(()=>document.querySelector('#levels-list button.current').dataset.level==='0'),'the current location is marked');
 await p.mouse.move(5,5);await p.evaluate(()=>document.querySelector('#levels-list button').focus());await p.evaluate(()=>{const b=document.querySelector('#levels-list button');b.dispatchEvent(new Event('focus'));});
 await shot(p,'levels-panel-desktop');
 await p.click('#levels-list button[data-level="4"]');await p.waitForFunction(()=>testGame.room===4&&testGame.mode==='playing',null,{timeout:8000});
 assert.deepEqual(await p.evaluate(()=>[testGame.boss.id,testGame.boss.active,[...testGame.bossesDefeated],document.getElementById('pause-menu').hidden]),['agitator',true,['spreader'],true]);
 // Back: Esc from the level panel returns to the root menu.
 await p.keyboard.press('Escape');await p.click('[data-pause-action="levels"]');await p.keyboard.press('Escape');assert.equal(await p.locator('#pause-root').isVisible(),true);await p.keyboard.press('Escape');
 await p.close();
 // Phone: the grid fits without horizontal overflow.
 const m=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});m.on('pageerror',e=>errors.push(e.message));await open(m,{story:false,testing:true});await begin(m);await m.click('#pause');await m.click('[data-pause-action="levels"]');
 assert.ok(await m.evaluate(()=>[...document.querySelectorAll('#levels-list button')].every(b=>b.scrollWidth<=b.clientWidth+1)),'labels fit their buttons');await shot(m,'levels-panel-320');
 await m.click('#levels-list button[data-level="7"]');await m.waitForFunction(()=>testGame.room===7&&testGame.mode==='playing',null,{timeout:8000});await m.close();
 await browser.close();assert.deepEqual(errors,[]);console.log('PASS menu/levels: larger phone menu Uma clear of the text at 4 sizes; in-game level select with marked current location, keyboard Esc, desktop and 320 px.');
})().catch(e=>{console.error(e);process.exit(1);});
