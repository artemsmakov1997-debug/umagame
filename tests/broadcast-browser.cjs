const {chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const [width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const count=await p.evaluate(async()=>{const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{drawAgitatorPose}=await import('./agitator-art.js?v=0.21.5');activateRoom(g,4);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.step=()=>{};g.hintsEnabled=false;const c=document.createElement('canvas');c.width=c.height=140;const ctx=c.getContext('2d'),frames=[];for(let r=0;r<6;r++)for(let f=0;f<4;f++){ctx.clearRect(0,0,140,140);drawAgitatorPose(ctx,testUI.assets,r,f,0,0,140,132);frames.push(c.toDataURL());}return{count:new Set(frames).size,size:[testUI.assets.agitator.naturalWidth,testUI.assets.agitator.naturalHeight]};});
  assert.equal(count.count,24);assert.deepEqual(count.size,[1024,1536]);
  for(const mode of['shield','antenna','break','chase','flood']){
   await p.evaluate(mode=>{const g=testGame,b=g.boss,n=b.broadcast;n.mode='rest';n.stage='shield';b.phase=1;
    if(mode==='antenna'){n.antennas[0].hits=1;n.antennas[0].locked=true;n.antennas[0].flash=.3;}
    if(mode==='break'){n.antennas.forEach(a=>{a.hits=3;a.locked=false;});n.stage='break';n.timer=.8;}
    if(mode==='chase'||mode==='flood'){n.stage='chase';n.mode='hold';n.fill=mode==='flood'?1:.55;b.phase=2;}
    testRenderer.draw(g,0,3.2);
   },mode);await shot(p,'agitator-'+mode+'-'+width);
  }
  await p.keyboard.press('Escape');const before=await p.evaluate(()=>JSON.stringify(testGame.boss.broadcast));await p.waitForTimeout(60);assert.equal(await p.evaluate(()=>JSON.stringify(testGame.boss.broadcast)),before);await p.keyboard.press('Escape');
  const limb=await p.evaluate(async()=>{
   const {drawInfoshumTentacle}=await import('./infoshum-tentacle-art.js?v=0.21.5'),{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{stepBoss}=await import('./boss.js?v=0.21.5');
   const c=document.createElement('canvas');c.width=400;c.height=260;const ctx=c.getContext('2d'),draw=ctx.drawImage;let images=0,primitives=0;ctx.drawImage=function(...args){if(args[0]===testUI.assets.infoshumTentacle)images++;return draw.apply(this,args);};ctx.fillRect=()=>primitives++;
   drawInfoshumTentacle(ctx,testUI.assets,{x:20,y:20,w:100,h:136},{mode:'weak',target:{x:350,y:240}},1);
   const filled=ctx.getImageData(0,0,400,260).data.filter((v,i)=>i%4===3&&v>150).length;
   const g=testGame;activateRoom(g,8);g.enemies=[];g.notebooks=[];g.boss.noticeTime=0;const n=g.boss.network;n.stage='rupture';n.timer=.001;n.monitors.forEach(m=>{m.state='broken';m.armor=0;});n.defeatedMonitors=3;g.boss.hp=20;stepBoss(g,1/60);n.mode='weak';n.target={x:g.player.x+100,y:g.player.y+48};testRenderer.draw(g,0,2);return{images,primitives,filled};
  });assert.ok(limb.images>30);assert.equal(limb.primitives,0,'the limb is painted sprites, not dots');assert.ok(limb.filled>4000);await shot(p,'infoshum-painted-limb-'+width);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 // Six actual console attacks followed by eight actual chase counters.
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5');activateRoom(testGame,4);testGame.enemies=[];testGame.notebooks=[];testGame.boss.noticeTime=0;});
 for(const index of[0,1,0,1,0,1]){
  await p.waitForFunction(i=>testGame.boss.broadcast.antennas[i].lockTime<=0,index);
  const previous=await p.evaluate(async i=>{const g=testGame,{antennaStation}=await import('./agitator-combat.js?v=0.21.5'),a=g.boss.broadcast.antennas[i],at=antennaStation(g,a);Object.assign(g.player,{x:at.x-32,y:at.y-48,grounded:true,supportId:at.platform.id,dir:1,vx:0,vy:0,knock:0,attack:0,cooldown:0});g.updateCamera();return a.hits;},index);
  await p.keyboard.down('Space');await p.waitForFunction(({index,previous})=>testGame.boss.broadcast.antennas[index].hits>previous,{index,previous});await p.keyboard.up('Space');
 }
 await p.waitForFunction(()=>testGame.boss.broadcast.stage==='chase');assert.equal(await p.evaluate(()=>testGame.boss.phase),2);
 for(let i=0;i<8;i++){
  await p.waitForFunction(()=>testGame.boss.broadcast.mode==='hold');const hp=await p.evaluate(()=>{const g=testGame,b=g.boss,s=g.platforms.find(s=>s.room===4&&s.index===b.platformIndex);Object.assign(g.player,{x:b.x-30,y:s.y-48,grounded:true,supportId:s.id,dir:1,vx:0,vy:0,knock:0,attack:0,cooldown:0});g.updateCamera();return b.hp;});await p.keyboard.down('Space');await p.waitForFunction(hp=>testGame.boss.hp<hp,hp);await p.keyboard.up('Space');
 }
 await p.waitForFunction(()=>testGame.mode==='bossDefeat');assert.equal(await p.evaluate(()=>testGame.bolts.length),0);await shot(p,'agitator-defeat-live');await p.evaluate(()=>{testGame.storyEnabled=true;testGame.skipBossDefeat();});await p.waitForFunction(()=>testGame.mode==='interlude');assert.equal(await p.evaluate(()=>testGame.interlude.boss),'agitator');
 await p.close();await browser.close();assert.deepEqual(errors,[]);console.log('PASS broadcast: 24 poses, antenna rotation/shields, chase/noise/flood and painted continuous limb at 5 viewports; 6 real console hits, 8 real chase counters, defeat and original story.');
})().catch(e=>{console.error(e);process.exit(1);});
