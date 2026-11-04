import {rooms} from './level.js?v=0.22.0';
export function createEchoTrace(g,owner,{chase=false}={}){if(g.motionHistory.length<8||g.echoTraces.some(t=>t.phase!=='fade')||g.echoTraces.length>=2)return null;const trace={id:'echo-trace-'+(++g.tacticalSerial),ownerId:owner.id,room:g.room,points:g.motionHistory.map(p=>({...p})),phase:'warning',time:0,chase,life:chase?26:2,x:g.motionHistory[0].x,y:g.motionHistory[0].y,w:30,h:42,dir:1};g.echoTraces.push(trace);g.emit('echoTraceWarning',{x:trace.x,y:trace.y});return trace;}
export function stepDimension(g,dt,paw=null){if(!rooms[g.room].multiStorey||rooms[g.room].theme!=='noise')return;g.motionClock+=dt;if(g.motionClock>=.05){g.motionClock=0;g.motionHistory.push({x:g.player.x,y:g.player.y,dir:g.player.dir,t:g.time});g.motionHistory=g.motionHistory.filter(p=>g.time-p.t<=2).slice(-41);}
 for(const e of g.enemies)if(e.room===g.room&&e.type==='echo'&&e.active&&!e.dead&&Math.hypot(e.x-g.player.x,e.y-g.player.y)<350){e.traceCooldown=Math.max(0,(e.traceCooldown||0)-dt);if(!e.traceCooldown&&createEchoTrace(g,e))e.traceCooldown=9;}
 const event=g.chapterEvent;if(event?.type==='noise'&&!event.traceStarted&&createEchoTrace(g,{id:'own-echo'},{chase:true}))event.traceStarted=true;
 for(const trace of g.echoTraces){trace.time+=dt;if(trace.chase&&(!event||event.type!=='noise')){trace.phase='fade';trace.time=0;trace.chase=false;}
  if(trace.phase==='warning'&&trace.time>=.9){trace.phase='active';trace.time=0;g.emit('echoTraceActive',{x:trace.x,y:trace.y});}
  const point=trace.phase==='warning'&&!trace.chase?trace.points[0]:trace.chase?g.motionHistory[0]:trace.points[Math.min(trace.points.length-1,Math.floor(trace.time/.05))];if(point&&trace.phase!=='fade')Object.assign(trace,{x:point.x,y:point.y,dir:point.dir});
  if(trace.phase==='active'){if(g.player.dash>0&&Math.hypot(trace.x-g.player.x,trace.y-g.player.y)<90||paw&&g.player.attack>0&&g.overlap(paw,trace)){trace.phase='fade';trace.time=0;g.emit('ghostDispel',{x:trace.x,y:trace.y});}else if(g.overlap(g.player,trace))g.hurt(false,trace.x);if(trace.time>=trace.life){trace.phase='fade';trace.time=0;}}
 }g.echoTraces=g.echoTraces.filter(t=>t.room===g.room&&(t.phase!=='fade'||t.time<.35));
 for(const e of g.enemies)if(e.type==='static')e.distortionSuppressed=Math.max(0,(e.distortionSuppressed||0)-dt);
}
