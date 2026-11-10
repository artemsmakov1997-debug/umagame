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
   const a=testUI.assets,out={sheets:['infoshumSea','infoshumCasings','infoshumScreenStates','infoshumYuri','infoshumGlass','infoshumTvBeam','infoshumGiantBeam','infoshumColossus','infoshumParts','infoshumAscent','infoshumBreakout','infoshumFree','infoshumStorm','infoshumStormPlatforms','infoshumSilence','loadingShum','targetMarkerGold','targetMarkerPink'].map(k=>[k,a[k]?.naturalWidth>0])},n=g.boss.network,shots={};
   const draw=(k,t=2)=>{g.updateCamera();testRenderer.draw(g,0,t);shots[k]=document.getElementById('game').toDataURL();},run=k=>{for(let i=0;i<k;i++)real.call(g,1/60,{});};
   m.buildWall(g);draw('dark');
   m.exposeInfoshum(g);const t=n.tvs[n.real];g.player.x=t.x-120;draw('faces-and-yuri');
   n.hold=true;n.timer=0;run(2);out.held=n.mode;draw('yuri-holds');
   n.timer=0;run(1);n.hold=false;m.exposeInfoshum(g);n.timer=0;run(1);draw('charge');n.timer=0;run(2);draw('fire');
   let k=0;while(n.broken<9&&k++<40){m.crackInfoshumScreen(g);for(const t of n.tvs)if(t.state==='crack')t.state='broken';}n.mode='rest';n.timer=0;run(2);g.player.x=n.tvs.at(-1).x+200;draw('wall-yuri');
   n.timer=0;run(2);draw('wall-face');
   m.smashWall(g);run(110);out.assemble=n.stage;draw('assemble');
   run(190);out.colossus=n.stage;const col=n.col,go=i=>{col.fist=null;col.sweep=null;col.beam=null;col.shocks=[];col.mode='idle';col.timer=0;col.step=i;g.player.x=16128+520;g.player.y=474-48;};
   go(0);run(50);draw('fist-shadow');run(45);draw('fist-stuck');go(1);run(75);draw('sweep');go(3);run(100);draw('head-beam');
   go(0);m.breakHand(g);m.breakHand(g);out.collapse=col.mode;draw('collapse');
   m.dropColossus(g);m.dropColossus(g);m.dropColossus(g);run(45);out.breakout=n.stage;draw('breakout-glass');run(60);draw('breakout-roar');
   run(120);out.free=n.stage;const f=n.free,fa=i=>{f.tentacles=[];f.shards=[];f.mode='hover';f.timer=0;f.step=i;};
   run(60);draw('free');fa(0);run(60);draw('tentacle');fa(1);run(85);draw('shards');fa(2);run(45);draw('ram');g.boss.hp=2;m.exposeInfoshum(g);run(5);draw('dizzy-yuri');
   g.loading={from:1,to:2,time:.6,duration:1.1};draw('loading');g.loading=null;
   out.distinct=new Set(Object.values(shots)).size;const seen={};out.same=[];for(const [k,v] of Object.entries(shots)){if(seen[v])out.same.push(seen[v]+'='+k);else seen[v]=k;}out.count=Object.keys(shots).length;return out;
  });
  assert.ok(r.sheets.every(([,ok])=>ok),'all Infoshum sheets decode: '+JSON.stringify(r.sheets));
  assert.equal(r.held,'held');assert.equal(r.assemble,'assemble');assert.equal(r.colossus,'colossus');assert.equal(r.collapse,'collapse');assert.equal(r.breakout,'breakout');assert.equal(r.free,'free');assert.equal(r.distinct,r.count,'every state looks different: '+r.same.join(', '));
  await shot(page,'infoshum-noise-'+width);await page.close();
 }
 // Full-arena overview: the whole wall of monitors at once.
 const o=await browser.newPage({viewport:{width:3072,height:1000}});o.on('pageerror',e=>errors.push(e.message));await open(o,{story:false,testing:true});await begin(o);
 await o.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5'),m=await import('./infoshum-combat.js?v=0.21.5');const g=testGame;g.hintsEnabled=false;document.getElementById('toast').classList.remove('visible');activateRoom(g,8);g.step=()=>{};g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;m.exposeInfoshum(g);testRenderer.draw(g,0,1);});
 await shot(o,'infoshum-full-reveal');await o.close();
 await browser.close();assert.deepEqual(errors,[]);
 console.log('PASS: Infoshum sheets decoded; the sea of screens with Yuri, the huge wall, the assembly, the colossus (shadow, stuck fist, sweep, head beam, collapse), the breakout, the free creature (tentacle, shards, ram, dizzy with Yuri) and the loading drawn distinctly at 5 viewports and a full-arena view.');
})().catch(e=>{console.error(e);process.exit(1);});
