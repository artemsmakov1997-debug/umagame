const {chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,begin,shot}=require('./browser-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const [width,height]of(process.env.QUICK?[]:[[1920,1080],[1366,768],[390,844],[320,568],[844,390]])){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);
  const count=await p.evaluate(async()=>{const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{drawAgitatorPose}=await import('./agitator-art.js?v=0.21.5');activateRoom(g,4);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.step=()=>{};g.hintsEnabled=false;const c=document.createElement('canvas');c.width=c.height=140;const ctx=c.getContext('2d'),frames=[];for(let f=0;f<16;f++){ctx.clearRect(0,0,140,140);drawAgitatorPose(ctx,testUI.assets,f,0,0,140,132);frames.push(c.toDataURL());}const A=testUI.assets;return{count:new Set(frames).size,sizes:['agitatorBoss','agitatorLetters','agitatorPlacards','agitatorFx','agitatorProps','agitatorArena'].map(k=>A[k]?.naturalWidth>0)};});
  assert.equal(count.count,16);assert.ok(count.sizes.every(Boolean),'all six Agitator sheets load');
  // Every phase drawn from the live model: slogan in flight, staircase + overheat, rally with placards and «УРА!», live broadcast gust.
  for(const scene of['volley','overheat','rally','ura','gust','tower']){
   await p.evaluate(async scene=>{const g=testGame,b=g.boss,n=b.broadcast,{towerStand}=await import('./agitator-combat.js?v=0.21.5'),{rooms}=await import('./level.js?v=0.21.5'),x0=rooms[4].x,real=Object.getPrototypeOf(g).step;
    const run=(frames)=>{for(let i=0;i<frames;i++)real.call(g,1/60,{});};
    Object.assign(g.player,{x:x0+392,y:374,vx:0,vy:0,grounded:true,supportId:'4:0',inv:9});
    if(scene==='volley'||scene==='overheat'){Object.assign(b.broadcast,{stage:'slogan',mode:'rest',timer:.01,letters:[],mast:'standing'});b.phase=1;run(scene==='volley'?150:330);}
    if(scene==='rally'||scene==='ura'){Object.assign(n,{stage:'rally',mode:'walk',mast:'standing',letters:[],placards:[],spawnTimer:0,uraTimer:scene==='ura'?0:99,stompTimer:99});n.mast='bent';b.phase=2;b.hp=12;b.x=x0+620;b.y=282;g.player.x=x0+420;run(scene==='ura'?160:200);}
    if(scene==='gust'||scene==='tower'){Object.assign(n,{stage:'air',mode:'idle',tower:scene==='tower'?0:1,placards:[],birds:[],wind:{phase:'warn',timer:.01}});n.mast='bent';b.phase=3;b.hp=6;Object.assign(b,towerStand(n.tower));g.player.x=scene==='tower'?x0+300:x0+1100;run(40);}
    g.updateCamera();testRenderer.draw(g,0,3.2);
   },scene);await shot(p,'agitator-'+scene+'-'+width);
  }
  await p.keyboard.press('Escape');const before=await p.evaluate(()=>JSON.stringify(testGame.boss.broadcast));await p.waitForTimeout(60);assert.equal(await p.evaluate(()=>JSON.stringify(testGame.boss.broadcast)),before);await p.keyboard.press('Escape');
  const limb=await p.evaluate(async()=>{
   const {drawInfoshumTentacle}=await import('./infoshum-tentacle-art.js?v=0.21.5'),{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{stepBoss}=await import('./boss.js?v=0.21.5');
   const c=document.createElement('canvas');c.width=400;c.height=260;const ctx=c.getContext('2d'),draw=ctx.drawImage;let images=0,primitives=0;ctx.drawImage=function(...args){if(args[0]===testUI.assets.infoshumTentacle)images++;return draw.apply(this,args);};ctx.fillRect=()=>primitives++;
   drawInfoshumTentacle(ctx,testUI.assets,{x:20,y:20,w:100,h:136},{mode:'weak',target:{x:350,y:240}},1);
   const filled=ctx.getImageData(0,0,400,260).data.filter((v,i)=>i%4===3&&v>150).length;
   const g=testGame;activateRoom(g,8);g.enemies=[];g.notebooks=[];g.boss.noticeTime=0;const n=g.boss.network;n.stage='rupture';n.timer=.001;n.monitors.forEach(m=>{m.state='broken';m.armor=0;});n.defeatedMonitors=3;g.boss.hp=20;stepBoss(g,1/60);n.mode='weak';n.target={x:g.player.x+100,y:g.player.y+48};testRenderer.draw(g,0,2);return{images,primitives,filled};
  });assert.ok(limb.images>30);assert.equal(limb.primitives,0,'the limb is painted sprites, not dots');assert.ok(limb.filled>4000);await shot(p,'infoshum-painted-limb-'+width);for(const level of[.55,1]){await p.evaluate(async level=>{const g=testGame,{activateRoom}=await import('./room-transitions.js?v=0.21.5');if(g.room!==8)activateRoom(g,8);const n=g.boss.network;n.stage='free';n.mode='rest';n.noise=level;testRenderer.draw(g,0,3.2);},level);await shot(p,'infoshum-interference-'+Math.round(level*100)+'-'+width);}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
 // Phase one with the keyboard: climb the letter staircase onto the mast and strike the overheated megaphone.
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false,testing:true});await begin(p);await p.evaluate(async()=>{const{activateRoom}=await import('./room-transitions.js?v=0.21.5'),{rooms}=await import('./level.js?v=0.21.5');activateRoom(testGame,4);testGame.enemies=[];testGame.notebooks=[];testGame.lifePickups=[];testGame.boss.noticeTime=0;Object.assign(testGame.player,{x:rooms[4].x+392});});
 await p.waitForFunction(()=>testGame.boss.broadcast.mode==='overheat',null,{timeout:15000});await shot(p,'agitator-staircase-live');
 await p.evaluate(async()=>{const g=testGame,b=g.boss,s=g.platforms.find(s=>s.id==='4:1');Object.assign(g.player,{x:b.x-46,y:s.y-48,grounded:true,supportId:s.id,dir:1,vx:0,vy:0,knock:0,attack:0,cooldown:0});g.updateCamera();});
 await p.keyboard.down('Space');await p.waitForFunction(()=>testGame.boss.hp<18);await p.keyboard.up('Space');
 // The remaining openings through the model; the final blow starts the scrap-and-smoke defeat.
 await p.evaluate(async()=>{const g=testGame,b=g.boss,{exposeAgitator,damageAgitator}=await import('./agitator-combat.js?v=0.21.5');const real=Object.getPrototypeOf(g).step;for(let k=0;k<30&&b.hp>0;k++){for(let i=0;i<200&&(['leap','climb'].includes(b.broadcast.stage)||b.broadcast.mode==='jump');i++)real.call(g,1/60,{});exposeAgitator(g);b.cooldown=0;damageAgitator(g,2,b.broadcast.stage==='rally'?b.x+b.w/2-b.dir*60:b.x);for(let i=0;i<5;i++)real.call(g,1/60,{});}if(g.mode==='bossDefeat'){g.pausedFrom='bossDefeat';g.mode='paused';}});
 assert.equal(await p.evaluate(()=>testGame.pausedFrom),'bossDefeat');
 for(const t of[.3,.75,1.3]){await p.evaluate(t=>{const g=testGame;if(g.defeat){g.defeat.time=t;testRenderer.draw(g,0,3);}},t);await shot(p,'agitator-defeat-'+t);}
 await p.evaluate(()=>{testGame.mode='bossDefeat';delete testGame.pausedFrom;});assert.equal(await p.evaluate(()=>testGame.bolts.length),0);await p.evaluate(()=>{testGame.storyEnabled=true;testGame.skipBossDefeat();});await p.waitForFunction(()=>testGame.mode==='interlude');assert.equal(await p.evaluate(()=>testGame.interlude.boss),'agitator');
 await p.close();await browser.close();assert.deepEqual(errors,[]);console.log('PASS agitator: 16 poses, six sheets, slogan/staircase/rally/УРА/gust/tower scenes and Infoshum limb at 5 viewports; a real keyboard strike on the overheated megaphone, scrap defeat and the original story.');
})().catch(e=>{console.error(e);process.exit(1);});
