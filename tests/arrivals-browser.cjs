const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {open,begin,fixture,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}),errors=[];
 for(const [width,height]of [[1280,800],[320,844],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false});await begin(p);await fixture(p,1,0,95);
  const difference=await p.evaluate(async()=>{
   const {enemy}=await import('./level.js?v=0.19.0'),g=testGame,r=testRenderer;g.step=()=>{};g.time=2;const e=enemy('fakenews',1,150,0,{trigger:90});g.enemies=[e];r.draw(g,0,g.time);const before=r.c.getImageData(0,0,r.c.canvas.width,480).data;e.source=null;r.draw(g,0,g.time);const after=r.c.getImageData(0,0,r.c.canvas.width,480).data;let changed=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++;g.enemies=[enemy('fakenews',1,150,0,{trigger:90})];r.draw(g,0,g.time);return changed;
  });assert.ok(difference>250,'bin must be visible before activation');await shot(p,'arrival-bin-idle-'+width);
  const frames=[];for(const phase of [0,.27,.54]){
   frames.push(await p.evaluate(phase=>{const g=testGame,e=g.enemies[0];e.active=true;e.spawnTime=.55-phase;g.time=2+phase;testRenderer.draw(g,0,g.time);return testRenderer.c.canvas.toDataURL();},phase));await shot(p,'arrival-bin-'+Math.round(phase*100)+'-'+width);
  }assert.equal(new Set(frames).size,3);
  for(const [type,room]of [['informant',3],['injection',5],['static',7]]){await fixture(p,room,0,95);await p.evaluate(async({type,room})=>{const{enemy}=await import('./level.js?v=0.19.0');testGame.enemies=[enemy(type,room,150,0)];testRenderer.draw(testGame,0,testGame.time);},{type,room});await shot(p,'arrival-source-'+type+'-'+width);}
  await fixture(p,7,0,70);await p.evaluate(async()=>{const{enemy}=await import('./level.js?v=0.19.0'),g=testGame;g.echoImmunity=0;g.player.inv=0;g.enemies=[enemy('echo',7,Math.min(185,g.viewWidth-50),0,{active:true,noticed:true})];for(let i=0;i<30;i++)Object.getPrototypeOf(g).step.call(g,1/60,{});});assert.equal(await p.evaluate(()=>testGame.enemies[0].state),'windup');await shot(p,'echo-contract-'+width);
  await p.evaluate(()=>{for(let i=0;i<17;i++)Object.getPrototypeOf(testGame).step.call(testGame,1/60,{});});assert.ok(await p.evaluate(()=>!!testGame.echoPull));await shot(p,'echo-pulling-'+width);
  await p.evaluate(()=>Object.getPrototypeOf(testGame).step.call(testGame,1/60,{dash:true}));assert.equal(await p.evaluate(()=>testGame.echoPull),null);assert.ok(await p.evaluate(()=>testGame.player.echoGrace>0));await shot(p,'echo-dash-escape-'+width);
  await p.evaluate(async()=>{const{handleFlyingContact}=await import('./campaign-enemies.js?v=0.19.0'),g=testGame,e=g.enemies[0];Object.assign(g.player,{dash:0,inv:0});g.echoImmunity=0;Object.assign(e,{x:g.player.x,y:g.player.y,warpCooldown:0});handleFlyingContact(g,e);for(let i=0;i<35;i++)Object.getPrototypeOf(g).step.call(g,1/60,{});});assert.equal(await p.evaluate(()=>testGame.lives),2);await p.waitForTimeout(30);assert.match(await p.locator('#hud-status').textContent(),/Жизни: 2/);await shot(p,'echo-return-one-stock-'+width);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: visible arrival sources before activation, animated emergence, receiver/printer/TV, Echo contraction/suction/dash escape/stock loss on desktop and two mobile layouts.');
})().catch(e=>{console.error(e);process.exit(1);});
