import test from 'node:test';
import assert from 'node:assert/strict';
import {packFrame} from '../pack-art.js';
test('health packet: four idle frames, then pop, sparkles and the empty pedestal that stays',()=>{
 const p={x:0,taken:false};assert.deepEqual([0,.2,.4,.6].map(t=>packFrame(p,0,t)),[0,1,2,3]);
 const q={x:0,taken:true,takenAt:10};assert.deepEqual([10,10.2,10.35,10.5,30].map(t=>packFrame(q,t,0)),[4,5,6,7,7]);
});
