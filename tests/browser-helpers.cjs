const url=process.env.GAME_URL||'http://127.0.0.1:8000';
const fs=require('node:fs');const path=require('node:path');
const artifacts=process.env.UMA_ARTIFACTS||'/tmp/uma-browser';fs.mkdirSync(artifacts,{recursive:true});
async function open(page,{story=true,testing=false}={}){
 await page.goto(url);await page.locator('#start-game:not([disabled])').waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async({story,testing})=>{
  const [{ScreenManager},{Renderer},{Game}]=await Promise.all([import('./screens.js?v=0.21.5'),import('./render.js?v=0.21.5'),import('./engine.js?v=0.21.5')]);
  const start=Game.prototype.start;Game.prototype.start=function(){this.testingInvulnerable=testing;if(!story)this.storyEnabled=false;return start.call(this);};
  const menu=ScreenManager.prototype.draw;ScreenManager.prototype.draw=function(canvas,time){window.testUI=this;return menu.call(this,canvas,window.testTime??time);};
  const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(g,dt,time){window.testGame=g;window.testRenderer=this;return draw.call(this,g,dt,time);};
 },{story,testing});await page.waitForFunction(()=>window.testUI);
}
async function begin(page,{wake=true,intro=true}={}){await page.click('#start-game');await page.waitForFunction(()=>window.testGame);if(await page.evaluate(()=>testGame.mode==='prologue'))await page.evaluate(()=>{while(testGame.mode==='prologue')testGame.advanceOpening();});if(wake&&await page.evaluate(()=>testGame.mode==='waking'))await page.click('#wake-skip');if(intro&&await page.evaluate(()=>testGame.mode==='dialogue'))await skip(page);}
async function skip(page){await page.locator('#dialogue:not([hidden])').waitFor();await page.click('#dialogue-skip');}
async function at(page,room,index=0,x=45){await page.evaluate(async({room,index,x})=>{const {rooms,WIDTH,platforms}=await import('./level.js?v=0.21.5');const g=testGame,s=g.platforms.find(p=>p.room===room&&p.index===index);g.tutorial.complete=true;g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);Object.assign(g.player,{x:rooms[room].x+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,sneaking:false,climbing:false,knock:0,dash:0,inv:0,attack:0,cooldown:0});g.room=room;g.unlockForRoom(room);g.updateCamera();},{room,index,x});}
async function fixture(page,room=1,index=0,x=45){await page.evaluate(()=>{const g=testGame;g.storyEnabled=false;g.abilities={attack:true,dash:true,sneak:true};g.mode='playing';g.dialogue=null;g.defeat=null;g.conclusion=null;g.interlude=null;g.ending=null;g.enemies=[];g.fishes=[];g.soups=[];g.portals=[];g.swallow=null;g.loading=null;g.echoWarp=null;g.tether=null;g.boss.active=false;g.arenaEntered=false;g.notebooks=[];g.health=4;});await at(page,room,index,x);await page.evaluate(room=>testGame.checkpoint=room,room);}
async function atDish(page,room){const data=await page.evaluate(room=>{const d=testGame.relays.find(d=>d.room===room),s=testGame.platforms.find(s=>s.room===room&&s.index===d.platformIndex);return {index:s.index,x:Math.max(s.x+4,Math.min(s.x+s.w-38,d.x-37))-(testGame.platforms.find(p=>p.room===room&&p.index===0).x)};},room);await at(page,room,data.index,data.x);await page.evaluate(()=>testGame.player.dir=1);}
// Old generic room-7 layout for mechanics checks (the real Dimension is built from dimension-map.js).
async function legacyFixture(page,index=0,x=45){await fixture(page,7,0,45);await page.evaluate(async([index,x])=>{const L=await import('./tests/legacy-room.js'),g=testGame;L.installLegacyRoom7(g);
 const s=g.platforms.find(s=>s.room===7&&s.index===index),x0=g.platforms.find(s=>s.id==='7:0').x;Object.assign(g.player,{x:x0+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,flipped:false});
 const seat=()=>{for(const e of g.enemies)if(e.room===7&&!e.legacySeated){L.seatLegacy(e);e.legacySeated=true;}};const step=Object.getPrototypeOf(g).step;g.step=function(dt,input){seat();return step.call(this,dt,input);};g.updateCamera();},[index,x]);}
// Bottom of the play area: the scene, or on portrait phones the control panel right under it (mobile-layout.js).
async function fieldBottom(page){return page.evaluate(()=>{const g=document.getElementById('game').getBoundingClientRect(),t=document.getElementById('touch-panel');if(!t||t.hidden||document.getElementById('app').dataset.layout!=='panel')return g.bottom;const r=t.getBoundingClientRect();return Math.abs(r.top-g.bottom)<2?r.bottom:-1;});}
// «Далее»: the button, or on the phone novel layout a tap on the text box.
async function next(page){if(await page.locator('#dialogue-next').isVisible())await page.click('#dialogue-next');else await page.click('#dialogue-text');}
const shot=(page,name)=>page.screenshot({path:path.join(artifacts,name+'.png'),fullPage:true});
module.exports={next,fieldBottom,open,begin,skip,at,atDish,fixture,legacyFixture,shot,artifacts,url};
