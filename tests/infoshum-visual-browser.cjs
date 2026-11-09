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
   const a=testUI.assets,out={sheets:['infoshumWallTv','infoshumFloorTv','infoshumGlass','infoshumTvBeam','infoshumStormCore','infoshumStormPlatforms','infoshumFallingTv','infoshumStorm','infoshumPoses','infoshumSilence','infoshumBreakout'].map(k=>[k,a[k]?.naturalWidth>0])},n=g.boss.network,shots={};
   const draw=(k,t=2)=>{g.updateCamera();testRenderer.draw(g,0,t);shots[k]=document.getElementById('game').toDataURL();};
   draw('dark');
   m.exposeInfoshum(g);const t=n.tvs.find(t=>t.state==='face');g.player.x=t.x-160;draw('face');
   n.mode='face';n.timer=0;real.call(g,1/60,{});draw('charge');
   n.timer=0;real.call(g,1/60,{});draw('fire');
   m.crackInfoshumScreen(g);draw('smash');
   for(let k=0;k<10&&n.stage==='network';k++){for(let i=0;i<25;i++)real.call(g,1/60,{});m.crackInfoshumScreen(g);}for(let i=0;i<60;i++)real.call(g,1/60,{});out.rupture=n.stage;draw('rupture');
   for(let i=0;i<120;i++)real.call(g,1/60,{});out.ghosts=n.stage;n.noiseTime=20;m.exposeInfoshum(g);n.figures.filter(f=>!f.real).forEach(f=>f.state='hover');draw('noise');
   m.stormInfoshum(g);for(let i=0;i<150;i++)real.call(g,1/60,{});out.storm=n.stage;draw('storm');
   n.storm.mode='storm';n.storm.timer=0;for(let i=0;i<40;i++)real.call(g,1/60,{});draw('column');
   m.exposeInfoshum(g);draw('spent');
   out.distinct=new Set(Object.values(shots)).size;out.count=Object.keys(shots).length;return out;
  });
  assert.ok(r.sheets.every(([,ok])=>ok),'all Infoshum sheets decode: '+JSON.stringify(r.sheets));
  assert.equal(r.rupture,'rupture');assert.equal(r.ghosts,'noise');assert.equal(r.storm,'storm');assert.equal(r.distinct,r.count,'every state looks different');
  await shot(page,'infoshum-noise-'+width);await page.close();
 }
 // Full-arena overview: all ten screens at once.
 const o=await browser.newPage({viewport:{width:3072,height:1000}});o.on('pageerror',e=>errors.push(e.message));await open(o,{story:false,testing:true});await begin(o);
 await o.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5'),m=await import('./infoshum-combat.js?v=0.21.5');const g=testGame;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.step=()=>{};g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;m.exposeInfoshum(g);testRenderer.draw(g,0,1);});
 await shot(o,'infoshum-full-reveal');await o.close();
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS: Infoshum sheets decoded; dark screens, face, charge, beam, smash, rupture, doubles, storm, column and the spent core drawn distinctly at 5 viewports and a full-arena view.');
})().catch(e=>{console.error(e);process.exit(1);});
