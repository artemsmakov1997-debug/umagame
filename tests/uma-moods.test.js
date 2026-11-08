import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {enemy,rooms} from '../level.js';
import {moodPose,moodFrames,MOOD} from '../cat-animation.js';
// Uma's new moods: a low paw swat from the sneak, a hiss when a monster notices her, a frightened long fall,
// being dragged by glue, the dash pose and joy after a broken transmitter.
const tick=(g,n,i={})=>{for(let k=0;k<n;k++)g.step(1/60,i);};
function ready(room=1){const g=new Game({story:false});g.start();g.tutorial.complete=true;g.abilities={attack:true,dash:true,sneak:true};activateRoom(g,room);g.enemies=[];g.notebooks=[];g.soups=[];g.fishes=[];g.lifePickups=[];return g;}
function standOn(g,id,local){const s=g.platforms.find(s=>s.id===id);Object.assign(g.player,{x:rooms[g.room].x+local,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:id});return s;}

test('eight mood frames with boxes inside the sheet',()=>{
 assert.equal(moodFrames.length,8);for(const {box,pivot}of moodFrames){assert.ok(box[0]>=0&&box[1]>=0&&box[0]+box[2]<=1536&&box[1]+box[3]<=1024);assert.ok(pivot[0]>box[0]&&pivot[0]<box[0]+box[2]);}
});

test('↓ + paw on the last floor is a low swat from the sneak: Uma stays low and hits a monster in front',()=>{
 const g=ready(1);standOn(g,'1:0',300);const e=enemy('fakenews',1,345,0,{active:true,noticed:true,speed:0,timer:99});g.enemies=[e];
 tick(g,1,{down:true});assert.equal(g.player.sneaking,true);
 tick(g,1,{down:true,attack:true});assert.equal(g.player.lowSwat,true);assert.ok(g.player.attack>0);assert.equal(g.player.sneaking,true,'the swat does not stand her up');assert.equal(g.player.h,26);
 assert.equal(moodPose(g.player,g),MOOD.lowWindup);tick(g,6,{down:true});assert.equal(moodPose(g.player,g),MOOD.lowStrike);
 assert.equal(e.dead,true,'one low swat knocks out the Fakenews');assert.ok(g.events.some(v=>v.type==='swat'&&v.low));
 assert.equal(g.events.filter(v=>v.type==='dropThrough').length,0);
});

test('↓ + paw still drops through a platform when nothing is in reach, and swats instead when a monster is',()=>{
 let g=ready(1);g.platforms.find(s=>s.id==='1:0').belt=0;const cache=g.platforms.find(s=>s.id==='1:3');Object.assign(g.player,{x:cache.x+10,y:cache.y-48,grounded:true,supportId:cache.id});
 tick(g,2,{down:true,attack:true});assert.equal(g.events.filter(v=>v.type==='dropThrough').length,1);
 g=ready(1);g.platforms.find(s=>s.id==='1:0').belt=0;const c2=g.platforms.find(s=>s.id==='1:3');Object.assign(g.player,{x:c2.x+10,y:c2.y-48,grounded:true,supportId:c2.id,dir:1});
 g.enemies=[enemy('fakenews',1,c2.x-rooms[1].x+50,3,{active:true,noticed:true,speed:0,timer:99})];
 tick(g,2,{down:true,attack:true});assert.equal(g.events.filter(v=>v.type==='dropThrough').length,0);assert.equal(g.player.lowSwat,true);
});

test('a standing swat is unchanged and clears the low flag',()=>{
 const g=ready(1);standOn(g,'1:0',300);tick(g,1,{attack:true});assert.equal(g.player.lowSwat,false);assert.equal(g.player.h,48);assert.equal(moodPose(g.player,g),null);
});

test('a monster noticing Uma nearby makes her hiss while she stands still; moving or swatting ends it',()=>{
 const g=ready(1);standOn(g,'1:0',300);g.enemies=[enemy('fakenews',1,470,0,{active:true,speed:0,timer:99})];
 tick(g,1);assert.ok(g.player.frightTime>0);assert.equal(moodPose(g.player,g),MOOD.hiss);
 tick(g,2,{right:true});assert.equal(moodPose(g.player,g),null);tick(g,60);assert.equal(moodPose(g.player,g),null,'the hiss is brief');
});

test('only a long fall shows the frightened pose; an ordinary jump never does',()=>{
 const g=ready(1);standOn(g,'1:0',300);let seen=false;tick(g,1,{jump:true});for(let i=0;i<80;i++){tick(g,1);if(moodPose(g.player,g)===MOOD.fall)seen=true;}assert.equal(seen,false);
 const h=ready(5);const s=standOn(h,'5:4',900);Object.assign(h.player,{grounded:false,supportId:null,y:s.y+20,vy:0});h.player.peakY=h.player.y;
 for(let i=0;i<40&&moodPose(h.player,h)!==MOOD.fall;i++)tick(h,1);assert.equal(moodPose(h.player,h),MOOD.fall);
});

test('dash, glue and joy poses',()=>{
 const g=ready(1);standOn(g,'1:0',300);tick(g,1,{dash:true});assert.equal(moodPose(g.player,g),MOOD.dash);
 const s=ready(5);standOn(s,'5:6',1200);const splicer=enemy('splicer',5,1046,16,{active:true,noticed:true,timer:0,noticeTime:0});s.enemies=[splicer];s.player.inv=999;
 for(let i=0;i<80&&!s.tether;i++)tick(s,1);assert.ok(s.tether);tick(s,1);assert.equal(moodPose(s.player,s),MOOD.dragged);
 const r=ready(5);standOn(r,'5:3',40);r.player.joyTime=1.1;for(let i=0;i<20;i++)tick(r,1);assert.equal(moodPose(r.player,r),MOOD.joy);
 tick(r,80);assert.equal(moodPose(r.player,r),null);
});
