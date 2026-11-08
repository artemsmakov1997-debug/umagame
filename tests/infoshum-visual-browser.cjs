// Browser regression: the production atlases and every state of «Найди источник», drawn by the real renderer.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']});const errors=[];
 for(const [width,height] of [[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});page.on('pageerror',e=>errors.push(e.message));
  await open(page,{story:false,testing:true});await begin(page,{intro:false});
  const r=await page.evaluate(async()=>{
   const {activateRoom}=await import('./room-transitions.js?v=0.21.5'),m=await import('./infoshum-combat.js?v=0.21.5');
   const g=testGame,real=Object.getPrototypeOf(g).step;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.mode='playing';g.storyEnabled=false;g.enemies=[];g.fishes=[];g.soups=[];g.notebooks=[];g.lifePickups=[];g.boss.noticeTime=0;g.step=()=>{};
   const a=testUI.assets,out={sheets:['infoshumScreens','infoshumCable','infoshumCore','infoshumPoses','infoshumSilence','infoshumBreakout','infoshumTransfer','sensationLauncher'].map(k=>[k,a[k]?.naturalWidth>0])},n=g.boss.network,shots={};
   const docks=[6,7,8].map(i=>g.platforms.find(s=>s.room===8&&s.index===i));out.clearScreens=docks.every((p,i)=>p.y>m.glassRect(n.monitors[i]).y+m.glassRect(n.monitors[i]).h);
   const draw=(k,t=2)=>{g.updateCamera();testRenderer.draw(g,0,t);shots[k]=document.getElementById('game').toDataURL();};
   n.activeIndex=1;draw('static');
   n.mode='shuffle';n.moves=1;n.transit={from:1,to:2,time:.4,duration:.9};n.decoys=[{from:0,to:1,time:.3,duration:.9}];draw('shuffle');
   n.transit=null;n.decoys=[];m.exposeInfoshum(g);g.player.x=n.monitors[1].x;draw('reveal');
   n.monitors[1].face=null;n.monitors[1].burst=.5;draw('fake');
   n.round=3;n.mode='hit';n.timer=0;n.lastMonitorIndex=1;real.call(g,1/60,{});for(let i=0;i<70;i++)real.call(g,1/60,{});draw('rupture');
   for(let i=0;i<120;i++)real.call(g,1/60,{});out.freed=n.stage;draw('free');
   const s=g.platforms.find(s=>s.id==='8:2');Object.assign(g.player,{x:s.x+60,y:s.y-48,grounded:true,supportId:s.id});m.exposeInfoshum(g);draw('cable');
   g.boss.hp=6;n.stage='noise';g.boss.phase=3;n.figures=[];n.noiseTime=20;m.exposeInfoshum(g);n.figures.filter(f=>!f.real).forEach(f=>f.state='hover');draw('noise');
   out.distinct=new Set(Object.values(shots)).size;out.count=Object.keys(shots).length;return out;
  });
  assert.ok(r.sheets.every(([,ok])=>ok),'all Infoshum sheets decode: '+JSON.stringify(r.sheets));
  assert.equal(r.clearScreens,true,'no platform crosses a screen');assert.equal(r.freed,'free');assert.equal(r.distinct,r.count,'every state looks different');
  await shot(page,'infoshum-noise-'+width);await page.close();
 }
 // Full-arena overview: three screens and the cable map at once.
 const o=await browser.newPage({viewport:{width:3072,height:1000}});o.on('pageerror',e=>errors.push(e.message));await open(o,{story:false,testing:true});await begin(o);
 await o.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5'),m=await import('./infoshum-combat.js?v=0.21.5');const g=testGame;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.step=()=>{};g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;m.exposeInfoshum(g);testRenderer.draw(g,0,1);});
 await shot(o,'infoshum-full-reveal');await o.close();
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS: Infoshum sheets decoded; shell game, decoys, reveal, fake burst, rupture, cable staircase and white-noise doubles drawn distinctly at 5 viewports and a full-arena reveal.');
})().catch(e=>{console.error(e);process.exit(1);});
