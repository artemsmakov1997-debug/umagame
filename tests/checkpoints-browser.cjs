const{chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,fixture,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false});await begin(p);
  await p.evaluate(()=>{testGame.step=()=>{};testGame.hintsEnabled=false;window.checkpointTick=(n,input={})=>{for(let i=0;i<n;i++)Object.getPrototypeOf(testGame).step.call(testGame,1/60,input);};});
  for(const room of[1,3,5,7]){
   const point=await p.evaluate(async room=>{
    const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.6'),{checkpointMarkers}=await import('./checkpoint-art.js?v=0.21.6');activateRoom(g,room);g.mode='playing';g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.baitOff=true;g.events=[];g.testingInvulnerable=false;
    const points=checkpointMarkers(g),m=points[Math.floor(points.length/2)];window.marker=m;Object.assign(g.player,{x:m.x-17,y:m.y-48,h:48,grounded:true,supportId:room+':'+m.index,vx:0,vy:0,inv:99});g.updateCamera();testRenderer.draw(g,0);return{inactive:!m.active,grounded:g.platforms.some(s=>s.id===room+':'+m.index&&s.y===m.y),count:points.length};
   },room);assert.ok(point.inactive&&point.grounded&&point.count===1);await shot(p,'checkpoint-unreached-'+room+'-'+width);
   const terminal=await p.evaluate(async()=>{
    const{drawCheckpointMarkers}=await import('./checkpoint-art.js?v=0.21.6'),a=testUI.assets,g=testGame,c=document.createElement('canvas');c.width=180;c.height=180;const ctx=c.getContext('2d'),surface=g.platforms.find(s=>s.id===g.room+':'+marker.index);
    const take=(active,time)=>{ctx.clearRect(0,0,180,180);const calls={terminal:[],face:[]},old=ctx.drawImage;ctx.drawImage=function(img,...args){if(img===a.checkpointTerminals)calls.terminal.push(args.slice(0,4));if(img===a.yuriEmotions)calls.face.push(args.slice(0,4));return old.call(this,img,...args);};
     const state={...g,time,platforms:[surface],newsroomCheckpoint:active?marker.rank:-1,roofs:{checkpoint:active?marker.rank:0},studio:{checkpoint:active?marker.rank:0},dimension:{checkpoint:active?marker.rank:0}};
     try{ctx.save();ctx.translate(90-marker.x,150-marker.y);drawCheckpointMarkers(ctx,state,a);ctx.restore();}finally{ctx.drawImage=old;}return{...calls,pixels:c.toDataURL()};};
    const off=take(false,3.8),on=take(true,3.8),blink=take(true,4),speech=take(true,4.2),paused=take(true,3.8);
    return{loaded:a.checkpointTerminals.__rw===768&&a.checkpointTerminals.width===1536,offFaces:off.face.length,onFaces:on.face.length,offRow:off.terminal[0][1],onRow:on.terminal[0][1],frames:new Set([on.pixels,blink.pixels,speech.pixels]).size,paused:on.pixels===paused.pixels};
   });assert.deepEqual(terminal,{loaded:true,offFaces:0,onFaces:1,offRow:0,onRow:512,frames:3,paused:true});
   const active=await p.evaluate(async()=>{checkpointTick(2);const{checkpointMarkers}=await import('./checkpoint-art.js?v=0.21.6');return checkpointMarkers(testGame).find(m=>m.rank===marker.rank).current;});assert.ok(active);
   const restored=await p.evaluate(()=>{const g=testGame;g.player.x-=50;g.loseLife('damage');checkpointTick(70);g.enemies=[];g.updateCamera();testRenderer.draw(g,0);return{mode:g.mode,support:g.player.supportId,health:g.health,lives:g.lives,dx:Math.abs(g.player.x-(marker.x-17))};});assert.equal(restored.mode,'playing');assert.equal(restored.support,room+':'+await p.evaluate(()=>marker.index));assert.equal(restored.health,4);assert.equal(restored.lives,2);assert.ok(restored.dx<2);await shot(p,'checkpoint-restored-'+room+'-'+width);
  }
  // A real inverted Clickbait bite costs two hearts and returns to the reached beacon, not to the bite point.
  const bite=await p.evaluate(async()=>{
   const g=testGame,{enemy,rooms}=await import('./level.js?v=0.21.6');g.health=4;g.lives=3;g.player.inv=0;const s=g.platforms.find(s=>s.id==='7:22');Object.assign(g.player,{x:s.x+90,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,flipped:false});
   const e=enemy('clickbait',7,g.player.x-rooms[7].x,22,{active:true,noticed:true,spawnTime:0,state:'snap',timer:.3,revealed:true});g.enemies=[e];checkpointTick(1);const caught=!!g.swallow;
   if(!caught)throw Error('the actual mouth did not capture Uma');g.player.flipped=true;g.mode='paused';const timer=g.swallow.timer;checkpointTick(40);const frozen=g.swallow.timer===timer;g.mode='playing';for(let i=0;i<40&&g.swallow;i++)checkpointTick(1);
   g.updateCamera();testRenderer.draw(g,0);return{caught,frozen,health:g.health,lives:g.lives,flipped:g.player.flipped,support:g.player.supportId,dx:Math.abs(g.player.x-(marker.x-17))};
  });assert.ok(bite.caught&&bite.frozen);assert.equal(bite.health,2);assert.equal(bite.lives,3);assert.equal(bite.flipped,false);assert.equal(bite.support,'7:22');assert.ok(bite.dx<2);await shot(p,'clickbait-checkpoint-return-'+width);
  // Actual keyboard input from a crouch, including release of Down and an unfinished hurt reaction.
  await fixture(p,1,0,240);await p.evaluate(()=>{const g=testGame;g.platforms.find(s=>s.id==='1:0').belt=0;g.player.hurtTime=.1;g.player.inv=99;g.step=Object.getPrototypeOf(g).step;
   const c=testRenderer.c,draw=c.drawImage;window.lowFrames=[];c.drawImage=function(img,...a){if(img===testUI.assets.moods&&testGame.player.lowSwat&&testGame.player.attack>0)lowFrames.push({box:a.slice(0,4),height:testGame.player.h});return draw.call(this,img,...a);};
  });await p.keyboard.down('ArrowDown');await p.waitForFunction(()=>testGame.player.sneaking);await p.keyboard.press('Space');await p.keyboard.up('ArrowDown');
  await p.waitForFunction(()=>lowFrames.some(b=>b.box[0]===358*testUI.assets.moods.k));const frames=await p.evaluate(()=>{testGame.step=()=>{};return lowFrames;});
  const k=await p.evaluate(()=>testUI.assets.moods.k);assert.ok(frames.some(b=>b.box[0]===14*k));assert.ok(frames.some(b=>b.box[0]===358*k));assert.ok(frames.every(f=>f.height===26),'the whole swat stays low after releasing Down');await shot(p,'uma-low-swat-complete-'+width);
  const fake=await p.evaluate(async()=>{const g=testGame,{enemy}=await import('./level.js?v=0.21.6'),{PRESSES,PRESS_HOLD}=await import('./newsroom-systems.js?v=0.21.6');const press=PRESSES[0];
   const e=enemy('fakenews',1,press.x+55,0,{active:true,noticed:true,spawnTime:0,state:'recover',timer:99});g.enemies=[e];g.time=PRESS_HOLD-.2;checkpointTick(1);const underPress={alive:!e.dead,hp:e.hp,speed:e.speed};
   Object.assign(e,{x:g.player.x+45,inv:0});Object.assign(g.player,{attack:0,cooldown:0,lowSwat:false,sneaking:false,h:48,y:382,dir:1});checkpointTick(1,{attack:true});const first=e.hp;checkpointTick(25);checkpointTick(1,{attack:true});return{underPress,first,dead:e.dead};
  });assert.deepEqual(fake,{underPress:{alive:true,hp:2,speed:48},first:1,dead:true});
  const farms=await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.6'),{createEnemies}=await import('./level.js?v=0.21.6');const g=testGame;activateRoom(g,5);g.enemies=createEnemies().filter(e=>e.type==='botfarm');g.notebooks=[];g.lifePickups=[];g.fishes=[];g.soups=[];for(const f of g.enemies)Object.assign(f,{active:true,noticed:true,spawnTime:0,noticeTime:0,timer:0});g.player.inv=99;checkpointTick(50);g.updateCamera();testRenderer.draw(g,0);return{farms:g.enemies.filter(e=>e.type==='botfarm').length,owners:[...new Set(g.enemies.filter(e=>e.type==='bot').map(e=>e.ownerId))].length};});assert.deepEqual(farms,{farms:2,owners:2});await shot(p,'studio-second-botfarm-'+width);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();console.log('PASS checkpoints/balance '+width+'x'+height);
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: all four locations have grounded beacons and real life-loss returns, Clickbait returns to the saved beacon, low swat draws both original poses from keyboard input, both farms print, no JavaScript errors.');
})().catch(e=>{console.error(e);process.exit(1);});
