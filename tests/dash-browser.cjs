const{chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,fixture,shot}=require('./browser-helpers.cjs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);await fixture(p,1,0,80);
  await p.evaluate(()=>{const g=testGame,c=testRenderer.c,draw=c.drawImage;g.hintsEnabled=false;window.realDashStep=g.step;window.umaDraw=null;c.drawImage=function(...a){let sheet=a[0]===testUI.assets.moods?'moods':a[0]===testUI.assets.umaRun8?'run':a[0]===testUI.assets.uma?'uma':null;if(sheet)window.umaDraw={sheet,box:a.slice(1,5),size:a.slice(-2),flip:this.getTransform().a<0};return draw.apply(this,a);};});
  for(const dir of[1,-1]){
   const key=dir===1?'ArrowRight':'ArrowLeft';await p.keyboard.down(key);await p.waitForFunction(dir=>testGame.player.vx*dir>0&&umaDraw?.sheet==='run',dir);await shot(p,'before-shift-'+dir+'-'+width);
   await p.evaluate(()=>testGame.player.dashCooldown=0);await p.keyboard.down('Shift');
   await p.waitForFunction(()=>{if(testGame.player.dash>0&&umaDraw?.sheet==='moods'&&testRenderer.trail.some(t=>t.dash)){testGame.step=()=>{};return true;}return false;},null,{timeout:5000});await p.keyboard.up('Shift');
   const dash=await p.evaluate(()=>({draw:umaDraw,k:testUI.assets.moods.k,trail:testRenderer.trail.some(t=>t.dash),vx:testGame.player.vx}));
   assert.deepEqual(dash.draw.box,[693,337,377,146].map(n=>n*dash.k),'the original stretched pose, not the run cycle');assert.ok(Math.abs(dash.draw.size[0]-377*.27)<.01);assert.ok(Math.abs(dash.draw.size[1]-146*.27)<.01);assert.equal(dash.draw.flip,dir<0);assert.equal(dash.vx,dir*430);assert.ok(dash.trail);await shot(p,'shift-pose-'+dir+'-'+width);
   await p.evaluate(()=>testGame.step=realDashStep);await p.waitForFunction(()=>testGame.player.dash===0&&umaDraw?.sheet==='run');await p.keyboard.up(key);await shot(p,'after-shift-'+dir+'-'+width);
  }
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();console.log('PASS Shift '+width+'x'+height+': real keyboard, original pose, uniform larger scale, both directions, trail and return to run.');
 }await browser.close();assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exit(1);});
