import test from 'node:test';
import assert from 'node:assert/strict';
import {packFrame} from '../pack-art.js';
import {Game} from '../engine.js';
import {FOOD_BOOST} from '../health-packs.js';
import {playerHorizontal} from '../player-rest.js';
import {drawSpeedAura,drawSleepZ,drawClawMarks} from '../uma-micro-effects.js';
test('health packet: four idle frames, then pop, sparkles and the empty pedestal that stays',()=>{
 const p={x:0,taken:false};assert.deepEqual([0,.2,.4,.6].map(t=>packFrame(p,0,t)),[0,1,2,3]);
 const q={x:0,taken:true,takenAt:10};assert.deepEqual([10,10.2,10.35,10.5,30].map(t=>packFrame(q,t,0)),[4,5,6,7,7]);
});

test('food speeds up only ordinary grounded running; dash, air, sneak and expiry keep their normal speeds',()=>{
 const g=new Game({story:false});g.start();g.inks=[];const p=g.player;Object.assign(p,{grounded:true,speedTime:FOOD_BOOST.duration,knock:0,dash:0,inkTime:0,launch:0});
 playerHorizontal(g,1,1/60);assert.equal(p.vx,155*1.1);
 p.sneaking=true;playerHorizontal(g,1,1/60);assert.equal(p.vx,62);
 p.sneaking=false;p.grounded=false;playerHorizontal(g,1,1/60);assert.equal(p.vx,155);
 p.dash=.1;p.dir=-1;playerHorizontal(g,1,1/60);assert.equal(p.vx,-430);
 p.dash=0;p.grounded=true;p.speedTime=0;playerHorizontal(g,1,1/60);assert.equal(p.vx,155);
});

test('micro effects change their drawn pixels over time and stop with their actor states',()=>{
 const record=()=>{const marks=[],c={globalAlpha:1,save(){},restore(){},translate(...v){marks.push(['move',...v]);},scale(...v){marks.push(['scale',...v]);},fillRect(...v){marks.push([typeof this.fillStyle==='string'?this.fillStyle:'glow',...v]);},createRadialGradient(){return{addColorStop(){}};}};return{c,marks};};
 const p={x:30,y:80,w:34,h:48,dir:1,grounded:true,vx:170,speedTime:10};
 for(const [draw,a,b]of[[drawSpeedAura,0,.4],[drawSleepZ,1.3,2],[drawClawMarks,.14,.06]]){
  const first=record(),second=record();if(draw===drawSleepZ){p.sleeping=true;p.sleepTime=a;}else if(draw===drawClawMarks){p.sleeping=false;p.attack=a;}
  assert.equal(draw(first.c,p,a),true);if(draw===drawSleepZ)p.sleepTime=b;else if(draw===drawClawMarks)p.attack=b;assert.equal(draw(second.c,p,b),true);assert.notDeepEqual(first.marks,second.marks);
 }
 Object.assign(p,{speedTime:0,dash:0,sleeping:false,attack:0});assert.equal(drawSpeedAura({},p,0),false);assert.equal(drawSleepZ({},p),false);assert.equal(drawClawMarks({},p),false);
});
