const{chromium,devices}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,fixture,shot}=require('./browser-helpers.cjs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 const cases=[
  {name:'native',width:390,height:780},
  {name:'hidden-touch',width:320,height:568,hide:true},
  {name:'hidden-touch-tall',width:390,height:844,hide:true},
  {name:'hidden-touch-landscape',width:844,height:390,hide:true},
  {name:'first-touch',width:390,height:844,hide:true,late:true},
  {name:'secondary-pointer',width:390,height:844,hide:true,secondary:true}
 ];
 for(const c of cases){
  const p=await b.newPage({viewport:{width:c.width,height:c.height},hasTouch:true,isMobile:true,userAgent:c.late||c.secondary?'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36':devices['iPhone 13'].userAgent});p.on('pageerror',e=>errors.push(e.message));
  if(c.hide)await p.addInitScript(secondary=>{Object.defineProperty(navigator,'maxTouchPoints',{get:()=>0});Object.defineProperty(navigator,'userAgentData',{get:()=>({mobile:false})});const media=window.matchMedia.bind(window);window.matchMedia=query=>{if(/\((?:any-)?pointer:\s*coarse\)/.test(query)){const m=media(query);Object.defineProperty(m,'matches',{value:secondary&&query==='(any-pointer:coarse)'});return m;}return media(query);};},!!c.secondary);
  await open(p);assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('has-touch')),!c.late);await begin(p,{intro:false});
  if(c.late){assert.equal(await p.evaluate(()=>testGame.touchEnabled),false);await p.tap('#dialogue');}
  const portrait=c.height>c.width;await p.waitForFunction(expected=>document.getElementById('app').dataset.layout===expected,portrait?'panel':'landscape');assert.equal(await p.evaluate(()=>testGame.touchEnabled),true);
  if(portrait){
   const m=await p.evaluate(()=>{const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();return{yuri:rect('novel-yuri'),uma:rect('novel-uma'),box:document.querySelector('.dialogue-panel').getBoundingClientRect().toJSON(),old:getComputedStyle(document.getElementById('narrator-portrait')).display};});assert.equal(m.old,'none');for(const r of[m.yuri,m.uma])assert.ok(r.width>100&&r.height>100&&r.top>=0&&r.right<=c.width+1&&r.bottom>=m.box.top&&r.bottom<m.box.top+40,JSON.stringify(m));
   await shot(p,'novel-restored-'+c.name);
   const page=await p.evaluate(()=>testGame.dialogue.page);await p.tap('#dialogue-text');assert.equal(await p.evaluate(()=>testGame.dialogue.page),page+1);
  }
  await p.keyboard.press('Escape');await p.locator('[data-pause-action=resume]').click();await p.waitForFunction(()=>testGame.mode==='dialogue');await p.locator('#dialogue-skip').click();await fixture(p,1,0,45);await p.waitForTimeout(80);
  if(portrait){const a=await p.evaluate(()=>{const rect=id=>document.getElementById(id).getBoundingClientRect().toJSON();return{field:rect('game'),panel:rect('touch-panel'),stick:rect('stick-pad'),actions:rect('touch-actions')};});assert.ok(a.panel.top>=a.field.bottom-1);for(const r of[a.stick,a.actions])assert.ok(r.top>=a.field.bottom-1&&r.bottom<=c.height+1,JSON.stringify(a));await shot(p,'phone-controls-restored-'+c.name);}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 // A narrow desktop with a mouse must keep the desktop interface until a real touch arrives.
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:false});p.on('pageerror',e=>errors.push(e.message));await open(p);await begin(p,{intro:false});assert.equal(await p.evaluate(()=>testGame.touchEnabled),false);assert.equal(await p.locator('#novel-yuri').isVisible(),false);await p.close();assert.deepEqual(errors,[]);await b.close();console.log('PASS: original phone novel and controls with native/hidden touch hints, phone identity, first real touch and secondary pointers; portrait/landscape, tap, pause, desktop fallback and no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
