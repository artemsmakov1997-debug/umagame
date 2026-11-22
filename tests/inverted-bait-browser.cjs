const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const [width,height]of[[1920,1080],[390,844],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:false});await begin(p);
  const feed=await p.evaluate(async()=>{
   const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.6');activateRoom(g,7);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.hintsEnabled=false;g.tutorial.complete=true;g.abilities={attack:true,dash:true,sneak:true};g.step=()=>{};
   window.baitTick=(n,input={})=>{for(let i=0;i<n;i++)Object.getPrototypeOf(g).step.call(g,1/60,input);};
   const s=g.platforms.find(s=>s.id==='7:10');Object.assign(g.player,{x:s.x+80,y:s.y-48,h:48,flipped:false,grounded:true,supportId:s.id,vx:0,vy:0,inv:0});
   for(let i=0;i<200&&!(g.player.flipped&&g.player.grounded);i++)baitTick(1,{right:true});
   const crossed=g.player.flipped&&g.player.supportId==='7:11';window.baitSurface=g.platforms.find(s=>s.dim?.inverted&&s.bait&&s.dimState==='rise'&&s.y>20&&s.y<300);
   Object.assign(g.player,{x:baitSurface.x-40,y:baitSurface.y+60,grounded:false,supportId:null,vx:0,vy:0});g.updateCamera();testRenderer.draw(g,0);
   return {crossed,pink:!!baitSurface.bait,descending:baitSurface.dim.reversed,asset:testUI.assets.clickbaitTrap.naturalWidth};
  });assert.deepEqual(feed,{crossed:true,pink:true,descending:true,asset:1056});await shot(p,'inverted-pink-feed-'+width);
  const emergence=await p.evaluate(()=>{
   const g=testGame,s=baitSurface;Object.assign(g.player,{x:s.x+s.w/2-17,y:s.y,grounded:true,supportId:s.id,vx:0,vy:0,flipped:true});baitTick(1);window.baitMonster=g.enemies.find(e=>e.bait);baitTick(8);g.updateCamera();testRenderer.draw(g,0);
   return {flipped:baitMonster.flipped,onLine:Math.abs(baitMonster.y-s.y)<.01,used:!s.bait,state:baitMonster.state};
  });assert.deepEqual(emergence,{flipped:true,onLine:true,used:true,state:'emerge'});await shot(p,'inverted-clickbait-emerge-'+width);
  const capture=await p.evaluate(()=>{for(let i=0;i<60&&!testGame.swallow;i++)baitTick(1);baitTick(2);testRenderer.draw(testGame,0);return {captured:!!testGame.swallow,flipped:testGame.player.flipped};});assert.deepEqual(capture,{captured:true,flipped:true});await shot(p,'inverted-clickbait-capture-'+width);
  // The original trap art and Uma must both remain upside down, including during capture.
  const orientation=await p.evaluate(()=>{const r=testRenderer,c=r.c,a=r.assets,old=c.drawImage,seen={trap:[],uma:[]};c.drawImage=function(img,...args){if(img===a.clickbaitTrap)seen.trap.push(this.getTransform().d);if(img===a.uma)seen.uma.push(this.getTransform().d);return old.call(this,img,...args);};try{r.draw(testGame,0);}finally{c.drawImage=old;}return seen;});assert.ok(orientation.trap.length&&orientation.trap.every(d=>d<0),JSON.stringify(orientation));assert.ok(orientation.uma.length&&orientation.uma.every(d=>d<0),JSON.stringify(orientation));
  await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>JSON.stringify({s:testGame.swallow,e:baitMonster,time:testGame.time}));await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>JSON.stringify({s:testGame.swallow,e:baitMonster,time:testGame.time})),frozen);await p.keyboard.press('Escape');
  const spit=await p.evaluate(()=>{for(let i=0;i<40&&testGame.swallow;i++)baitTick(1);testRenderer.draw(testGame,0);return {health:testGame.health,flipped:testGame.player.flipped,vy:testGame.player.vy,capture:testGame.swallow};});assert.deepEqual(spit,{health:2,flipped:true,vy:240,capture:null});await shot(p,'inverted-clickbait-spit-'+width);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 await browser.close();assert.deepEqual(errors,[]);console.log('PASS: actual rift crossing, pink descending bait, mirrored emergence and capture sprites, pause and two-heart spit on desktop, portrait and landscape Chromium; no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
