const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {open,begin,at,fixture,shot}=require('./browser-helpers.cjs');
const names=['Фейкньюс','Кликбейт','Раздуватель','Цензор','Информатор','Копир','Паникёр','Монтажёр','Инфошум'];
async function cardShape(page){return page.evaluate(()=>{
 const card=document.querySelector('#monster-card'),base=card.getBoundingClientRect();
 return ['#monster-title','.portrait-stage','#monster-description','#monster-abilities','.tactic'].map(selector=>{const e=card.querySelector(selector),r=e.getBoundingClientRect();return {y:Math.round((r.y-base.y)*10)/10,h:Math.round(r.height*10)/10,w:Math.round(r.width*10)/10};});
});}
async function checkLibrary(page){
 await page.click('[data-menu=library]');assert.equal(await page.locator('.monster-option').count(),9);let shape;
 for(const name of names){
  await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.locator('#monster-title').textContent(),name);assert.equal(await page.locator('#monster-abilities>div').count(),2);
  const next=await cardShape(page);if(shape)assert.deepEqual(next,shape,'fixed card regions: '+name);else shape=next;
  assert.ok(await page.evaluate(()=>{const card=document.querySelector('#monster-card'),r=card.getBoundingClientRect();return [...card.querySelectorAll('h3,p,dt,dd')].every(e=>{const box=e.getBoundingClientRect();return e.scrollWidth<=e.clientWidth+2&&box.left>=r.left-1&&box.right<=r.right+1;});}),'no clipped text: '+name);
  const overflow=await page.evaluate(()=>['#monster-description','#monster-abilities','.tactic'].map(selector=>{const e=document.querySelector(selector);return {selector,height:e.clientHeight,content:e.scrollHeight};}).filter(e=>e.content>e.height+2));
  if(overflow.length)await shot(page,'library-overflow-'+page.viewportSize().width);
  assert.deepEqual(overflow,[],'all text visible without inner scrolling: '+name);
 }
 assert.ok(await page.evaluate(()=>{const rows=[...document.querySelectorAll('.monster-option')].map(e=>Math.round(e.getBoundingClientRect().height));return new Set(rows).size===1;}));
 await page.getByRole('button',{name:'Монтажёр',exact:true}).click();await shot(page,'library-montager-uniform');
 await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#monster-title').textContent(),'Инфошум');assert.ok(await page.evaluate(()=>{const e=document.querySelector('.monster-option.selected').getBoundingClientRect(),r=document.querySelector('#monster-list').getBoundingClientRect();return e.top>=r.top&&e.bottom<=r.bottom;}));
 await page.keyboard.press('Escape');
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']});
 const errors=[],p=await browser.newPage({viewport:{width:1280,height:960}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false});
 await p.evaluate(async()=>{const {GameAudio}=await import('./audio.js?v=0.13.0');const original=GameAudio.prototype.setScene;GameAudio.prototype.setScene=function(...args){window.testAudio=this;return original.apply(this,args);};});
 await checkLibrary(p);await begin(p);await fixture(p,2,1,300);
 await p.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0');testGame.player.dir=1;testGame.enemies=[enemy('clickbait',2,365,1,{active:true,noticed:true,revealed:true,state:'recover',timer:999})];});
 await p.keyboard.press('Space');await p.waitForTimeout(90);assert.equal(await p.evaluate(()=>testGame.enemies[0].hp),2);assert.equal(await p.evaluate(()=>testGame.enemies[0].dead),false);
 await p.evaluate(()=>{const g=testGame,e=g.enemies[0];g.player.x=e.x-45;g.player.dir=1;g.player.dashCooldown=0;e.state='snap';e.timer=.45;});
 const beforeDash=await p.evaluate(()=>testGame.player.x);await p.keyboard.press('Shift');await p.waitForFunction(x=>testGame.player.x>x+45,beforeDash);assert.equal(await p.evaluate(()=>testGame.swallow),null);assert.equal(await p.evaluate(()=>testGame.lives),3);await shot(p,'clickbait-dash-immortal');
 await fixture(p,2,1,295);await p.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0');testGame.enemies=[enemy('clickbait',2,365,1,{active:true,noticed:true})];});await shot(p,'clickbait-clear-hook');
 await fixture(p,3,1,365);await p.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0');testGame.player.dir=1;testGame.enemies=[enemy('inflator',3,430,1,{active:true,noticed:true,state:'recover',timer:999,dir:-1})];});
 await p.keyboard.press('Space');await p.waitForTimeout(70);assert.equal(await p.evaluate(()=>testGame.enemies[0].hp),3);
 await p.evaluate(()=>{const g=testGame,e=g.enemies[0];Object.assign(g.player,{x:e.x+e.w+5,dir:-1,cooldown:0,attack:0});});await p.keyboard.press('Space');await p.waitForFunction(()=>testGame.enemies[0].hp===2);await shot(p,'inflator-rear-weakness');
 await fixture(p,3,3,110);await p.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0');testGame.enemies=[enemy('censor',3,180,3,{active:true,noticed:true,timer:0,speed:0})];});await p.waitForFunction(()=>testGame.inks.length>0);await p.keyboard.down('ArrowRight');await p.waitForFunction(()=>testGame.player.slipping);await p.waitForTimeout(70);await p.keyboard.up('ArrowRight');const releaseX=await p.evaluate(()=>testGame.player.x);await p.waitForTimeout(75);assert.ok(await p.evaluate(x=>testGame.player.x>x+1,releaseX));assert.equal(await p.evaluate(()=>testGame.player.slipping),true);await shot(p,'uma-ink-skid');
 await fixture(p,4,0,100);await p.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0');testGame.enemies=[enemy('copier',4,420,1,{active:true,noticed:true,timer:0,speed:0,scanStart:18,scanW:145}),enemy('fakenews',4,340,1,{active:true,noticed:true,speed:0,timer:999,jumpCooldown:999})];});await p.waitForFunction(()=>testGame.enemies.some(e=>e.copyOwnerId));await shot(p,'copier-scanner-and-copy');
 await at(p,4,1,480);await p.evaluate(()=>{testGame.player.dir=-1;testGame.player.inv=2;testGame.enemies[0].state='recover';testGame.enemies[0].timer=1.5;});await p.keyboard.down('Space');await p.waitForFunction(()=>testGame.enemies.find(e=>e.type==='copier').dead);await p.keyboard.up('Space');assert.ok(await p.evaluate(()=>testGame.enemies.filter(e=>e.copyOwnerId).every(e=>e.dead)));await shot(p,'copier-copies-dissolved');
 await fixture(p,5,1,365);await p.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0');testGame.player.inv=999;testGame.enemies=[enemy('montager',5,655,2,{active:true,noticed:true,timer:0,speed:0}),enemy('fakenews',5,365,1,{active:true,noticed:true,timer:999,speed:0,jumpCooldown:999})];});await p.waitForFunction(()=>testGame.cuts.some(c=>c.phase==='warning'));await shot(p,'montager-platform-warning');await p.waitForFunction(()=>testGame.cuts.some(c=>c.phase==='gap'));await shot(p,'montager-real-gap');await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>JSON.stringify(testGame));await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>JSON.stringify(testGame)),frozen);await p.keyboard.press('Escape');await p.waitForFunction(()=>testGame.cuts.length===0);
 await fixture(p,1,0,45);await p.evaluate(()=>testGame.player.idleTime=29.99);await p.waitForFunction(()=>testGame.player.sleeping&&testGame.player.sleepTime>.7);await shot(p,'uma-curled-after-idle');const x=await p.evaluate(()=>testGame.player.x);await p.keyboard.down('ArrowRight');await p.waitForFunction(x=>testGame.player.x>x+10,x);await p.keyboard.up('ArrowRight');assert.equal(await p.evaluate(()=>testGame.player.sleeping),false);
 // Audio must produce real samples, start after a user gesture, stop in pause, and resume once.
 await p.waitForFunction(()=>testAudio.context?.state==='running'&&[...testAudio.voices].some(v=>v.group==='music'));
 assert.ok(await p.evaluate(()=>{const data=new Float32Array(testAudio.analyser.fftSize);testAudio.analyser.getFloatTimeDomainData(data);return data.some(v=>Math.abs(v)>.0001);}));
 await p.keyboard.press('Escape');await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>[...testAudio.voices].filter(v=>v.group==='music').length),0);await p.click('#pause-sound');assert.equal(await p.locator('#pause-sound').getAttribute('aria-pressed'),'false');assert.equal(await p.evaluate(()=>testAudio.voices.size),0);await p.click('#pause-sound');assert.equal(await p.locator('#pause-sound').getAttribute('aria-pressed'),'true');await p.keyboard.press('Escape');await p.waitForFunction(()=>[...testAudio.voices].some(v=>v.group==='music'));
 const samples=await p.evaluate(async()=>{
  const {GameAudio}=await import('./audio.js?v=0.13.0');const types=['inkStamp','copyScan','platformCut','fakeLunge','baitReveal','blast','enemyShot','alarm'],results=[];
  for(const type of types){const ctx=new OfflineAudioContext(2,44100,44100),audio=new GameAudio({context:ctx,enabled:true});audio.play({type});const buffer=await ctx.startRendering(),data=buffer.getChannelData(0);let power=0,signature=0;for(let i=0;i<data.length;i++){power+=data[i]*data[i];if(i%53===0)signature+=Math.round(data[i]*100000)*(i%97+1);}results.push({type,rms:Math.sqrt(power/data.length),signature});}
  const silent=new OfflineAudioContext(2,11025,44100),muted=new GameAudio({context:silent,enabled:false});muted.play({type:'blast'});const data=(await silent.startRendering()).getChannelData(0);return {results,silent:data.every(v=>v===0)};
 });assert.ok(samples.results.every(s=>s.rms>.0005),JSON.stringify(samples));assert.equal(new Set(samples.results.map(s=>s.signature)).size,8);assert.equal(samples.silent,true);
 for(const size of [{width:320,height:844},{width:390,height:844},{width:844,height:390}]){
  const mobile=await browser.newPage({viewport:size,hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await open(mobile,{story:false});await checkLibrary(mobile);await begin(mobile);await fixture(mobile,3,3,110);await mobile.evaluate(async()=>{const {enemy}=await import('./level.js?v=0.13.0'),{stampInk}=await import('./tactical-enemies.js?v=0.13.0');stampInk(testGame,enemy('censor',3,125,3));testGame.enemies=[enemy('censor',3,180,3,{active:true,noticed:true,timer:99})];});await shot(mobile,'tactical-mobile-'+size.width);assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: nine identical library cards on desktop/320/390/844; immortal Clickbait and clear hook; rear-only Inflator; Censor ink/skid; real Copier printing and dissolution; warned temporary moving-platform cuts/pause/restoration; idle curl and immediate wake; audible original music, eight distinct monster sounds, mute/pause/resume; no errors.');
})().catch(error=>{console.error(error);process.exit(1);});
