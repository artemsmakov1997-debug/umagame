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
   const a=testUI.assets,out={sheets:['infoshumCasings','infoshumScreenStates','infoshumWallBg','infoshumGlass','infoshumTvBeam','infoshumGiantBeam','infoshumColossus','infoshumEyeRelay','infoshumDebris','infoshumNoiseWave','infoshumAscent','infoshumFallingTv','infoshumStorm','infoshumStormPlatforms','infoshumPoses','infoshumSilence','targetMarkerGold','targetMarkerPink'].map(k=>[k,a[k]?.naturalWidth>0])},n=g.boss.network,shots={};
   const draw=(k,t=2)=>{g.updateCamera();testRenderer.draw(g,0,t);shots[k]=document.getElementById('game').toDataURL();};
   m.buildWall(g);draw('dark');
   m.exposeInfoshum(g);const t=n.tvs.find(t=>t.state==='face');g.player.x=t.x-120;draw('face');
   n.mode='face';n.timer=0;real.call(g,1/60,{});draw('charge');
   n.timer=0;real.call(g,1/60,{});draw('fire');
   m.crackInfoshumScreen(g);draw('smash');
   let k=0;while(n.tvs.some(t=>t.kind!=='huge'&&t.state!=='broken')&&k++<40){m.crackInfoshumScreen(g);for(const t of n.tvs)if(t.state==='crack')t.state='broken';}m.exposeInfoshum(g);g.player.x=n.tvs.at(-1).x+200;draw('giant');
   m.smashWall(g);for(let i=0;i<90;i++)real.call(g,1/60,{});out.assemble=n.stage;draw('assemble');
   for(let i=0;i<150;i++)real.call(g,1/60,{});out.colossus=n.stage;draw('colossus');
   const mid=g.platforms.filter(s=>s.room===8&&s.debris&&!s.bossHidden&&s.y>170&&s.y<300).sort((x,y)=>y.y-x.y)[0],stand=()=>Object.assign(g.player,{x:mid.x+mid.w/2-17,y:mid.y-48,h:48,grounded:true,supportId:mid.id,vx:0,vy:0,inv:9});stand();
   n.ascent.sweep=0;n.ascent.eye=null;n.ascent.eyeT=99;real.call(g,1/60,{});draw('sweep-warning');
   n.ascent.beamTimer=0;real.call(g,1/60,{});draw('sweep');
   n.ascent.beamMode=null;n.ascent.sweep=99;stand();m.exposeInfoshum(g);out.eyeShown=!!n.ascent.eye;draw('eye');
   for(let e=0;e<3;e++){m.swatEye(g);for(let i=0;i<60;i++)real.call(g,1/60,{});}out.breakout=n.stage;draw('breakout');
   for(let i=0;i<160;i++)real.call(g,1/60,{});out.free=n.stage;n.noiseTime=20;m.exposeInfoshum(g);n.figures.filter(f=>!f.real).forEach(f=>f.state='hover');draw('noise');
   out.distinct=new Set(Object.values(shots)).size;const seen={};out.same=[];for(const [k,v] of Object.entries(shots)){if(seen[v])out.same.push(seen[v]+'='+k);else seen[v]=k;}out.count=Object.keys(shots).length;return out;
  });
  assert.ok(r.sheets.every(([,ok])=>ok),'all Infoshum sheets decode: '+JSON.stringify(r.sheets));
  assert.equal(r.assemble,'assemble');assert.equal(r.colossus,'colossus');assert.equal(r.breakout,'breakout');assert.equal(r.free,'noise');assert.equal(r.eyeShown,true);assert.equal(r.distinct,r.count,'every state looks different: '+r.same.join(', '));
  await shot(page,'infoshum-noise-'+width);await page.close();
 }
 // Full-arena overview: the whole wall of monitors at once.
 const o=await browser.newPage({viewport:{width:3072,height:1000}});o.on('pageerror',e=>errors.push(e.message));await open(o,{story:false,testing:true});await begin(o);
 await o.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5'),m=await import('./infoshum-combat.js?v=0.21.5');const g=testGame;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.step=()=>{};g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;m.exposeInfoshum(g);testRenderer.draw(g,0,1);});
 await shot(o,'infoshum-full-reveal');await o.close();
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS: Infoshum sheets decoded; the wall (dark, face, charge, beam, smash, the huge screen), the assembly, the colossus (sweep warning, sweep, eye), the breakout and the doubles drawn distinctly at 5 viewports and a full-arena view.');
})().catch(e=>{console.error(e);process.exit(1);});
