const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {open,begin,fixture,legacyFixture,shot}=require('./browser-helpers.cjs');
async function setupTeleport(page){
 await legacyFixture(page,2,604);
 await page.evaluate(async()=>{
  const {enemy}=await import('./level.js?v=0.21.5'),g=testGame;g.enemies=[enemy('informant',7,365,1,{active:true,noticed:true,teleportCooldown:0})];
  const step=g.step.bind(g);g.haltAt='charge';g.haltDelay=.18;
  g.step=(dt,input)=>{step(dt,input);const t=g.enemies[0]?.teleport;if(g.haltAt==='done'&&!t||t&&t.phase===g.haltAt&&t.elapsed>=g.haltDelay){g.mode='paused';g.haltAt=null;}};
 });await page.waitForFunction(()=>testGame.mode==='paused'&&testGame.enemies[0].teleport?.phase==='charge');await page.waitForTimeout(35);
}
async function nextPhase(page,phase,delay){
 await page.evaluate(({phase,delay})=>{testGame.haltAt=phase;testGame.haltDelay=delay;testGame.mode='playing';},{phase,delay});
 await page.waitForFunction(phase=>testGame.mode==='paused'&&(phase==='done'?!testGame.enemies[0].teleport:testGame.enemies[0].teleport?.phase===phase),phase);await page.waitForTimeout(40);
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']});
 const errors=[],p=await browser.newPage({viewport:{width:1280,height:960}});p.on('pageerror',e=>errors.push(e.message));await open(p);await p.evaluate(()=>window.testTime=.5);await p.waitForTimeout(60);
 assert.ok(await p.evaluate(()=>testUI.assets.menu.src.includes('menu-compact.png')));await shot(p,'menu-pile-before-teleport');
 await begin(p);await setupTeleport(p);const from=await p.evaluate(()=>testGame.enemies[0].x),images=[];
 for(const [phase,delay]of [['charge',.18],['out',.14],['blink',0],['in',.16],['done',0]]){
  if(phase!=='charge')await nextPhase(p,phase,delay);const state=await p.evaluate(()=>({phase:testGame.enemies[0].teleport?.phase,x:testGame.enemies[0].x,index:testGame.enemies[0].platformIndex,health:testGame.health,bolts:testGame.bolts.length,phased:testGame.enemies[0].phased}));
  assert.equal(state.health,4);assert.equal(state.bolts,0);if(['charge','out','blink'].includes(phase))assert.equal(state.x,from);else{assert.ok(state.x>from);assert.equal(state.index,2);}if(phase==='blink'||phase==='in')assert.equal(state.phased,true);
  images.push(await p.locator('#game').evaluate(c=>c.toDataURL()));await shot(p,'informant-'+phase);
 }
 assert.equal(new Set(images).size,5);await p.evaluate(()=>{testGame.mode='playing';testGame.step=Object.getPrototypeOf(testGame).step;});await p.waitForFunction(()=>testGame.bolts.some(b=>b.kind==='packet'));assert.equal(await p.evaluate(()=>testGame.enemies[0].platformIndex),2);
 for(const [width,height]of [[320,844],[390,844],[844,390]]){
  const m=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});m.on('pageerror',e=>errors.push(e.message));await open(m);await m.evaluate(()=>window.testTime=.5);await m.waitForTimeout(60);await shot(m,'clean-monitor-menu-'+width);await begin(m);await setupTeleport(m);assert.ok(await m.evaluate(()=>testGame.enemies[0].teleport.target.x>testGame.camera&&testGame.enemies[0].teleport.target.x<testGame.camera+testGame.viewWidth));await shot(m,'teleport-warning-'+width);await nextPhase(m,'in',.16);await shot(m,'teleport-appearance-'+width);await nextPhase(m,'done',0);assert.equal(await m.evaluate(()=>testGame.enemies[0].platformIndex),2);assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await m.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: painted monster-pile menu; source charge, pixel disappearance, transit, destination appearance, recovery and real ranged attacks; safe on-platform landing; phone warning/appearance at 320/390/844; no page errors.');
})().catch(e=>{console.error(e);process.exit(1);});
