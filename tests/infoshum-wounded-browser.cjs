const{chromium}=require('playwright'),assert=require('node:assert/strict');const{open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const atlas=await p.evaluate(async()=>{
   const a=testUI.assets.infoshumWounded,{WOUNDED_FRAMES}=await import('./infoshum-wounded-art.js?v=0.21.6'),c=document.createElement('canvas');c.width=384;c.height=512;const ctx=c.getContext('2d'),pictures=[];
   for(const frame of WOUNDED_FRAMES){ctx.clearRect(0,0,384,512);ctx.drawImage(a,...frame.r,0,0,384,512);pictures.push(c.toDataURL());}
   return{ready:a.complete,size:[a.naturalWidth,a.naturalHeight],unique:new Set(pictures).size};
  });assert.deepEqual(atlas,{ready:true,size:[1536,1024],unique:8});
  await p.evaluate(async()=>{
   const g=testGame,M=await import('./infoshum-combat.js?v=0.21.6'),{activateRoom}=await import('./room-transitions.js?v=0.21.6'),{WOUNDED_FRAMES}=await import('./infoshum-wounded-art.js?v=0.21.6');
   activateRoom(g,8);g.mode='playing';g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.hintsEnabled=false;g.boss.noticeTime=0;g.step=()=>{};M.freeInfoshum(g);
   const s=g.platforms.find(s=>s.id==='8:2');Object.assign(g.player,{x:s.x+160,y:s.y-48,h:48,grounded:true,supportId:s.id,vx:0,vy:0,inv:99});
   window.advanceWounded=(n,input={})=>{for(let i=0;i<n;i++)Object.getPrototypeOf(g).step.call(g,1/60,input);};
   window.forceWounded=i=>{const f=g.boss.network.free;f.mode='hover';f.timer=0;f.step=i;f.tentacles=[];f.shards=[];g.boss.network.noiseTime=0;advanceWounded(1);};
   window.captureWounded=()=>{const r=testRenderer,c=r.c,a=r.assets,old=c.drawImage,calls=[];c.drawImage=function(img,...args){if(img===a.infoshumWounded){const index=WOUNDED_FRAMES.findIndex(p=>p.r.every((n,i)=>n===args[i])),m=c.getTransform();calls.push({index,args,m:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}});}return old.call(this,img,...args);};try{g.updateCamera();r.draw(g,0);}finally{c.drawImage=old;}return calls;};
   window.woundedPivot=(call,anchor)=>{const q=WOUNDED_FRAMES[call.index],x=call.args[4]+(q.eyes[0]+(anchor==='muzzle'?38:0))*call.args[6]/q.r[2],y=call.args[5]+(q.eyes[1]+(anchor==='muzzle'?31.5:0))*call.args[7]/q.r[3],m=call.m;return{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f};};
   // The intact form still uses its existing art, even for the post-copy dive.
   const f=g.boss.network.free;Object.assign(f,{mode:'ghostDash',phase:'dive',seq:2,dive:{x0:f.x,y0:f.y,x:f.x+80,y1:f.y+180},ghosts:null});window.intactWoundedCalls=captureWounded().length;
   forceWounded(2);for(let i=0;i<550&&f.mode!=='dizzy';i++)advanceWounded(1);if(f.mode!=='dizzy')throw Error('did not reach the real first stun');
   const island=g.platforms.find(s=>s.room===8&&!s.bossHidden&&Math.abs(s.y-f.gy)<2&&f.x>=s.x&&f.x<=s.x+s.w);Object.assign(g.player,{x:f.x-60,y:f.gy-48,h:48,grounded:true,supportId:island.id,vx:0,vy:0,dir:1,cooldown:0,attack:0});advanceWounded(1,{attack:true});advanceWounded(45);
  });assert.equal(await p.evaluate(()=>intactWoundedCalls),0);assert.deepEqual(await p.evaluate(()=>({hp:testGame.boss.hp,hits:testGame.boss.network.free.hits})),{hp:2,hits:1});
  const dive=await p.evaluate(()=>{
   forceWounded(2);const g=testGame,f=g.boss.network.free,frames=new Set(),ghostFrames=new Set();let pivotError=0;
   for(let i=0;i<550;i++){
    advanceWounded(1);const calls=captureWounded();if(f.mode==='ghostDash'&&f.seq<2&&f.phase==='dive')calls.forEach(c=>ghostFrames.add(c.index));
    if(f.mode==='ghostDash'&&f.seq===2&&f.phase==='dive')for(const c of calls){frames.add(c.index);const eye=woundedPivot(c,'eyes');pivotError=Math.max(pivotError,Math.abs(eye.x-(f.x-Math.round(g.camera))),Math.abs(eye.y-f.y));}
    if(frames.size===4)break;
   }
   return{frames:[...frames].sort(),ghostFrames:[...ghostFrames].sort(),pivotError,mode:f.mode,phase:f.phase};
  });assert.deepEqual(dive.frames,[0,1,2,3]);assert.deepEqual(dive.ghostFrames,[0,1,2,3]);assert.ok(dive.pivotError<.01,JSON.stringify(dive));assert.equal(dive.mode,'ghostDash');assert.equal(dive.phase,'dive');await shot(p,'wounded-dive-'+width);
  await p.keyboard.press('Escape');await p.waitForTimeout(40);const frozen=await p.evaluate(()=>({time:testGame.time,frames:captureWounded().map(c=>c.index),timer:testGame.boss.network.free.timer}));await p.waitForTimeout(130);assert.deepEqual(await p.evaluate(()=>({time:testGame.time,frames:captureWounded().map(c=>c.index),timer:testGame.boss.network.free.timer})),frozen);await p.keyboard.press('Escape');
  for(const side of['left','right']){
   const volley=await p.evaluate(side=>{
    const g=testGame,s=g.platforms.find(s=>s.id==='8:2');Object.assign(g.player,{x:s.x+(side==='left'?20:s.w-60),y:s.y-48,grounded:true,supportId:s.id,inv:99});forceWounded(1);
    const f=g.boss.network.free,frames=new Set(),launches=[];let count=f.count,muzzleError=0;
    for(let i=0;i<240&&f.mode==='volley';i++){
     advanceWounded(1);const calls=captureWounded();for(const c of calls){frames.add(c.index);const muzzle=woundedPivot(c,'muzzle');muzzleError=Math.max(muzzleError,Math.abs(muzzle.x-(f.x+f.dir*40-Math.round(g.camera))),Math.abs(muzzle.y-f.y));}
     if(f.count<count){launches.push({frame:calls[0]?.index,count:f.count,velocity:f.shards.at(-1)?.vx,dir:f.dir});count=f.count;}
    }
    return{frames:[...frames].sort(),launches,muzzleError};
   },side);assert.deepEqual(volley.frames,[4,5,6,7]);assert.equal(volley.launches.length,3);assert.ok(volley.launches.every(s=>s.frame===5&&Math.sign(s.velocity)===s.dir));assert.ok(volley.muzzleError<.01,JSON.stringify(volley));
   await p.evaluate(()=>{forceWounded(1);advanceWounded(43);});await shot(p,'wounded-shot-'+side+'-'+width);
  }
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: eight drawn wounded frames, real first paw hit, all four post-copy dive/ghost poses, fixed eye pivots, pause freeze, three synchronized shots and muzzle anchors in both directions at five viewport sizes; no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
