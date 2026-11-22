const{chromium}=require('playwright'),assert=require('node:assert/strict');
const{url,shot}=require('./browser-helpers.cjs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await b.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),pending=[];
  p.on('pageerror',e=>errors.push(e.message));
  // Hold the actual artwork requests so the real boot callback can be observed in stages.
  await p.route('**/assets/**',r=>{const name=new URL(r.request().url()).pathname;if(/\.(?:webp|png|jpg|jpeg)$/.test(name)&&!/(?:loading-walk|loading-shum-bar|game-heading)\./.test(name))pending.push(r);else return r.continue();});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.getElementById('loading')&&!document.getElementById('loading').hidden);
  for(let i=0;i<100&&pending.length<180;i++)await p.waitForTimeout(30);assert.ok(pending.length>=180,'real assets are held');
  const measure=()=>p.evaluate(()=>{const e=document.getElementById('loading'),track=e.querySelector('.shum-track').getBoundingClientRect(),walk=e.querySelector('.shum-walk').getBoundingClientRect(),bar=e.querySelector('.shum-bar').getBoundingClientRect(),fill=document.getElementById('loading-fill').getBoundingClientRect();return{progress:+getComputedStyle(e).getPropertyValue('--loading-progress'),offset:walk.x-track.x,travel:track.width-walk.width,fill:fill.width,bar:bar.width,inside:walk.x>=0&&walk.right<=innerWidth&&walk.y>=0,frame:getComputedStyle(e.querySelector('.shum-walk')).backgroundPositionX,menuHidden:getComputedStyle(document.getElementById('start-game')).visibility==='hidden'};});
  let previous=await measure();assert.equal(previous.progress,0);assert.ok(previous.menuHidden);assert.ok(previous.inside);
  const count=pending.length,batch=Math.floor(count/4);
  for(let stage=1;stage<=3;stage++){
   await Promise.all(pending.splice(0,batch).map(r=>r.continue()));
   const settled=await p.waitForFunction(({before,min})=>{const e=document.getElementById('loading'),progress=+getComputedStyle(e).getPropertyValue('--loading-progress'),track=e.querySelector('.shum-track').getBoundingClientRect(),walk=e.querySelector('.shum-walk').getBoundingClientRect(),bar=e.querySelector('.shum-bar').getBoundingClientRect(),fill=document.getElementById('loading-fill').getBoundingClientRect();const now={progress,offset:walk.x-track.x,travel:track.width-walk.width,fill:fill.width,bar:bar.width,inside:walk.x>=0&&walk.right<=innerWidth&&walk.y>=0,frame:getComputedStyle(e.querySelector('.shum-walk')).backgroundPositionX,menuHidden:getComputedStyle(document.getElementById('start-game')).visibility==='hidden'};return progress>before&&progress>=min&&Math.abs(now.offset-now.travel*progress)<.5&&Math.abs(now.fill-now.bar*.9*progress)<.5?now:false;},{before:previous.progress,min:stage*.18});const now=await settled.jsonValue();assert.ok(now.progress>previous.progress&&now.offset>previous.offset,'walk advances with decoded assets');assert.ok(Math.abs(now.offset-now.travel*now.progress)<1,'walk follows progress '+JSON.stringify(now));assert.ok(Math.abs(now.fill-now.bar*.9*now.progress)<1,'fill follows the same progress '+JSON.stringify(now));assert.ok(now.inside&&now.menuHidden,'loader fits and menu stays hidden');
   if(stage===2){await shot(p,'loading-half-'+width);let moved=false;for(let i=0;i<5;i++){await p.waitForTimeout(70);if((await measure()).frame!==now.frame)moved=true;}assert.ok(moved,'hauling animation still plays');}previous=now;
  }
  await Promise.all(pending.splice(0).map(r=>r.continue()));
  await p.waitForFunction(()=>document.getElementById('loading').hidden);await p.locator('#start-game:not([disabled])').waitFor();assert.equal(await p.evaluate(()=>+getComputedStyle(document.getElementById('loading')).getPropertyValue('--loading-progress')),1);assert.ok(await p.evaluate(()=>document.documentElement.classList.contains('booted')&&document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 const failed=await b.newPage();failed.on('pageerror',e=>errors.push(e.message));await failed.route('**/assets/campaign-monsters*',r=>r.abort());await failed.goto(url);await failed.getByRole('button',{name:'Повторить загрузку'}).waitFor();
 assert.deepEqual(errors,[]);await b.close();console.log('PASS: actual boot decoding moves Infoshum and fill together at five viewport sizes; hauling animation, viewport bounds, menu reveal and asset-error retry remain intact.');
})().catch(e=>{console.error(e);process.exit(1);});
