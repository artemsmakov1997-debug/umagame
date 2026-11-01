const url=process.env.GAME_URL||'http://127.0.0.1:8000';
const fs=require('node:fs');const path=require('node:path');
const artifacts=process.env.UMA_ARTIFACTS||'/tmp/uma-browser';fs.mkdirSync(artifacts,{recursive:true});
async function open(page,{story=true}={}){
 await page.goto(url);await page.locator('#start-game:not([disabled])').waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async story=>{
  const [{ScreenManager},{Renderer},{Game}]=await Promise.all([import('./screens.js?v=0.10.0'),import('./render.js?v=0.10.0'),import('./engine.js?v=0.10.0')]);
  if(!story){const start=Game.prototype.start;Game.prototype.start=function(){this.storyEnabled=false;return start.call(this);};}
  const menu=ScreenManager.prototype.draw;ScreenManager.prototype.draw=function(canvas,time){window.testUI=this;return menu.call(this,canvas,window.testTime??time);};
  const draw=Renderer.prototype.draw;Renderer.prototype.draw=function(g,dt,time){window.testGame=g;window.testRenderer=this;return draw.call(this,g,dt,time);};
 },story);await page.waitForFunction(()=>window.testUI);
}
async function begin(page,{wake=true,intro=true}={}){await page.click('#start-game');await page.waitForFunction(()=>window.testGame);if(wake&&await page.evaluate(()=>testGame.mode==='waking'))await page.click('#wake-skip');if(intro&&await page.evaluate(()=>testGame.mode==='dialogue'))await skip(page);}
async function skip(page){await page.locator('#dialogue:not([hidden])').waitFor();await page.click('#dialogue-skip');}
async function at(page,room,index=0,x=45){await page.evaluate(async({room,index,x})=>{const {WIDTH,platforms}=await import('./level.js?v=0.10.0');const s=platforms.find(p=>p.room===room&&p.index===index),g=testGame;g.tutorial.complete=true;g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,sneaking:false,climbing:false,knock:0,dash:0,inv:0,attack:0,cooldown:0});g.room=room;g.updateCamera();},{room,index,x});}
async function fixture(page,room=1,index=0,x=45){await page.evaluate(()=>{const g=testGame;g.storyEnabled=false;g.abilities={attack:true,dash:true,sneak:true};g.mode='playing';g.dialogue=null;g.enemies=[];g.fishes=[];g.soups=[];g.portals=[];g.swallow=null;g.health=4;});await at(page,room,index,x);}
const shot=(page,name)=>page.screenshot({path:path.join(artifacts,name+'.png'),fullPage:true});
module.exports={open,begin,skip,at,fixture,shot,artifacts,url};
