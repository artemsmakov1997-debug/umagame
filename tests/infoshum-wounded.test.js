import test from 'node:test';import assert from 'node:assert/strict';
import {woundedDashFrame,woundedAttackFrame,WOUNDED_FRAMES,WOUNDED_SCALE,drawWoundedAttack} from '../infoshum-wounded-art.js';
import {FREE} from '../infoshum-combat.js';
test('four distinct wounded dash drawings cover the real post-copy dive and horizontal ram only',()=>{
 const f={hits:1,mode:'ghostDash',seq:2,phase:'dive'};assert.deepEqual([0,1,2,3].map(i=>woundedAttackFrame(f,(i+.1)/14)),[0,1,2,3]);
 assert.equal(woundedAttackFrame({...f,hits:0},.1),null);assert.equal(woundedAttackFrame({...f,seq:1},.1),null);assert.equal(woundedAttackFrame({...f,phase:'aim'},.1),null);assert.equal(woundedAttackFrame({...f,mode:'ram'},.1),woundedDashFrame(.1));
});
test('shooting charge, flash, recoil and recovery follow actual projectile timers without changing them',()=>{
 const f={hits:1,mode:'volley',timer:0,count:2,sub:FREE.volleyGap},before=JSON.stringify(f);
 assert.equal(woundedAttackFrame({...f,timer:.5},0),null);assert.equal(woundedAttackFrame({...f,timer:.1},0),4);
 assert.deepEqual([0,.12,.24,.36].map(age=>woundedAttackFrame({...f,sub:FREE.volleyGap-age},0)),[5,6,7,4]);
 for(const count of[2,1,0])assert.equal(woundedAttackFrame({...f,count},0),5);
 assert.equal(woundedAttackFrame({...f,count:0,sub:-.1},0),7);assert.equal(JSON.stringify(f),before);
 for(const mode of['pulled','dizzy','hit','hover','tentacle'])assert.equal(woundedAttackFrame({...f,mode},0),null);
});
test('atlas frames and eye/muzzle anchors stay in bounds and retain one scale in either direction',()=>{
 const image={complete:true,naturalWidth:1536};
 for(const [i,p]of WOUNDED_FRAMES.entries()){
  assert.ok(p.r[0]+p.r[2]<=1536&&p.r[1]+p.r[3]<=1024);assert.ok(p.eyes[0]>0&&p.eyes[0]<p.r[2]&&p.eyes[1]>0&&p.eyes[1]<p.r[3]);
  for(const flip of[false,true])for(const anchor of['eyes','muzzle']){
   let call;const c={save(){},restore(){},translate(x,y){assert.deepEqual([x,y],[120,230]);},scale(x,y){assert.deepEqual([x,y],[-1,1]);},drawImage(...args){call=args;}};
   assert.ok(drawWoundedAttack(c,{infoshumWounded:image},i,120,230,{flip,anchor}));assert.deepEqual(call.slice(1,5),p.r);
   const ax=p.eyes[0]+(anchor==='muzzle'?38:0),ay=p.eyes[1]+(anchor==='muzzle'?31.5:0);
   assert.ok(Math.abs(call[5]+ax*WOUNDED_SCALE)<.0001&&Math.abs(call[6]+ay*WOUNDED_SCALE)<.0001);assert.equal(call[7],p.r[2]*WOUNDED_SCALE);assert.equal(call[8],p.r[3]*WOUNDED_SCALE);
  }
 }
 assert.equal(drawWoundedAttack({}, {},0,0,0),false);
});
