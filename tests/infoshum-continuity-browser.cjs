const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const [width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  // The stunned drawing is the actual old sprite, not a flattened flying pose.
  const stunArt=await p.evaluate(async()=>{
   const {drawInfoshumStun}=await import('./infoshum-art.js?v=0.21.5'),AT=(await import('./infoshum-atlas.js?v=0.21.5')).INFOSHUM_ATLAS,a=testUI.assets;
   return ['d0','d1'].map(name=>{
    const p=AT.free2[name],w=p.r[2],h=p.r[3],draw=(damaged,flip=false)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;drawInfoshumStun(ctx,a,name,0,0,w,h,{damaged,flip});return ctx.getImageData(0,0,w,h).data;};
    const normal=draw(false),hurt=draw(true),mirror=draw(true,true);let lost=0,elsewhere=0,mirrored=true;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4,j=(y*w+w-1-x)*4;if(normal[i+3]>80&&hurt[i+3]===0)lost++;
     if(y<30||y>=77||x>=60&&x<=94&&y>=65&&y<77||x>=110&&y>=68&&y<75)for(let k=0;k<4;k++)if(normal[i+k]!==hurt[i+k])elsewhere++;
     for(let k=0;k<4;k++)if(mirror[i+k]!==hurt[j+k])mirrored=false;
    }
    return {name,lost,elsewhere,mirrored};
   });
  });for(const a of stunArt){assert.ok(a.lost>30,'the torn tentacle stays absent '+JSON.stringify(a));assert.equal(a.elsewhere,0,'spiral eyes, stars, rubble and the lower limb keep their original pixels '+JSON.stringify(a));assert.ok(a.mirrored,'correct flipped anatomy');}
  await p.evaluate(async()=>{
   const g=testGame,M=await import('./infoshum-combat.js?v=0.21.5'),{activateRoom}=await import('./room-transitions.js?v=0.21.5');activateRoom(g,8);g.mode='playing';g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;g.hintsEnabled=false;g.step=()=>{};M.freeInfoshum(g);
   window.continueFree=n=>{for(let i=0;i<n;i++)Object.getPrototypeOf(g).step.call(g,1/60,{});};
   const s=g.platforms.find(s=>s.id==='8:2');Object.assign(g.player,{x:s.x+160,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,inv:99});
   window.forceFree=i=>{const f=g.boss.network.free;f.mode='hover';f.timer=0;f.step=i;f.tentacles=[];f.shards=[];g.boss.network.noiseTime=0;continueFree(1);};
   window.captureFree=()=>{const r=testRenderer,c=r.c,a=r.assets,old=c.drawImage,oldClip=c.clip,calls=[];let cuts=0;c.clip=function(...args){if(args[0]==='evenodd')cuts++;return oldClip.apply(this,args);};c.drawImage=function(img,...args){if(img===a.infoshumFree2||img===a.infoshumFree)calls.push({sheet:img===a.infoshumFree2?'free2':'free',args,masked:cuts>0});return old.call(this,img,...args);};try{g.updateCamera();r.draw(g,0);}finally{c.drawImage=old;c.clip=oldClip;}return calls;};
   forceFree(2);
  });
  const hold=await p.evaluate(async()=>{
   const g=testGame,f=g.boss.network.free,AT=(await import('./infoshum-atlas.js?v=0.21.5')).INFOSHUM_ATLAS;
   for(let i=0;i<500&&f.mode!=='pulled';i++)continueFree(1);if(f.mode!=='pulled')throw Error('never landed');
   window.impactSpot={x:f.x,y:f.y};window.holdCalls=captureFree();return {mode:f.mode,yuri:f.yuri};
  });assert.deepEqual(hold,{mode:'pulled',yuri:true});await shot(p,'infoshum-held-impact-'+width);
  const anchored=await p.evaluate(async()=>{
   const g=testGame,f=g.boss.network.free,AT=(await import('./infoshum-atlas.js?v=0.21.5')).INFOSHUM_ATLAS;
   const pivot=calls=>{const c=calls.find(c=>c.sheet==='free2'&&['d0','d1'].some(n=>AT.free2[n].r.every((v,i)=>v===c.args[i])));if(!c)throw Error('no dizzy body');const n=['d0','d1'].find(n=>AT.free2[n].r.every((v,i)=>v===c.args[i])),a=AT.free2[n];return c.args[5]-a.o[1]*1.4+a.cell[1]*1.4;};
   const before=pivot(holdCalls);let stationary=true;for(let i=0;i<80&&f.mode==='pulled';i++){continueFree(1);stationary&&=Math.abs(f.x-impactSpot.x)<.001&&Math.abs(f.y-impactSpot.y)<.001;}
   return {stationary,mode:f.mode,delta:Math.abs(pivot(captureFree())-before),atFloor:Math.abs(before-(f.gy+10))};
  });assert.ok(anchored.stationary&&anchored.mode==='dizzy'&&anchored.delta<1.1&&anchored.atFloor<1,JSON.stringify(anchored));await shot(p,'infoshum-held-dizzy-'+width);
  await p.keyboard.press('Escape');const paused=await p.evaluate(()=>JSON.stringify(testGame));await p.waitForTimeout(70);assert.equal(await p.evaluate(()=>JSON.stringify(testGame)),paused);await p.keyboard.press('Escape');
  const hit=await p.evaluate(()=>{
   const g=testGame,f=g.boss.network.free,s=g.platforms.find(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.gy)<2&&f.x>=s.x&&f.x<=s.x+s.w);Object.assign(g.player,{x:f.x-60,y:f.gy-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,dir:1,cooldown:0,attack:0});Object.getPrototypeOf(g).step.call(g,1/60,{attack:true});
   const out={hp:g.boss.hp,hits:f.hits,mode:f.mode};continueFree(45);return out;
  });assert.deepEqual(hit,{hp:2,hits:1,mode:'hit'});
  const check=async name=>{
   const calls=await p.evaluate(()=>captureFree());if(name==='held')assert.ok(calls.some(c=>c.sheet==='free2'&&c.args[3]>22&&c.masked),'held uses the original drawn dizzy pose with the lost limb clipped');else assert.ok(calls.some(c=>c.sheet==='free'&&[178,148,161,139].every((v,i)=>v===c.args[i])),name+' uses the original wounded sprite');
   assert.ok(!calls.some(c=>c.sheet==='free2'&&c.args[3]>22&&!c.masked),name+' cannot show the intact body');await shot(p,'infoshum-injured-'+name+'-'+width);
  };
  await check('hover');await p.evaluate(()=>{forceFree(0);continueFree(30);});await check('tentacle');await p.evaluate(()=>{forceFree(1);continueFree(85);});await check('volley');
  await p.evaluate(()=>{forceFree(2);continueFree(50);});await check('ghosts');
  const second=await p.evaluate(()=>{
   const g=testGame,f=g.boss.network.free;let frames=0,intact=false;for(;frames<500&&f.mode!=='dizzy';frames++){continueFree(1);if(frames%10===0)intact ||=captureFree().some(c=>c.sheet==='free2'&&c.args[3]>22&&!c.masked);}
   return {mode:f.mode,hits:f.hits,intact};
  });assert.deepEqual(second,{mode:'dizzy',hits:1,intact:false});await check('held');
  const end=await p.evaluate(()=>{const g=testGame,f=g.boss.network.free,s=g.platforms.find(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.gy)<2&&f.x>=s.x&&f.x<=s.x+s.w);Object.assign(g.player,{x:f.x-60,y:f.gy-48,grounded:true,supportId:s?.id,vx:0,vy:0,dir:1,cooldown:0,attack:0});Object.getPrototypeOf(g).step.call(g,1/60,{attack:true});return g.mode;});assert.equal(end,'bossDefeat');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 await browser.close();assert.deepEqual(errors,[]);console.log('PASS: real ghost-dive landing, original drawn dizzy pose with spiral eyes/stars/rubble and a missing limb; fixed ground sprite anchor through Yuri hold and dizzy, pause, two real paw hits, persistent missing tentacle in hover/attacks/ghosts/second hold and defeat at five viewport sizes; no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
