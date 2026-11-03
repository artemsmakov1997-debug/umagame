// Activating a chapter node changes its surrounding encounter, not just the exit gate.
// All effects are local and temporary. The collected clue and the disabled node persist.
export function applyRelayEffect(g,relay){
 const local=g.enemies.filter(e=>e.room===relay.room&&!e.dead);
 if(relay.kind==='printer'){
  for(const e of local){
   if(e.copyOwnerId){e.dead=true;e.hp=0;e.deathTime=.25;}
   else if(e.type==='copier')e.noticeTime=Math.max(e.noticeTime,2.5);
  }
  return 'Копии распались, печатные машины замерли.';
 }
 if(relay.kind==='broadcast'){
  for(const portal of g.portals)if(portal.room===relay.room)portal.cancelled=true;
  for(const e of local)if(e.type==='panicker'){e.state='recover';e.timer=Math.max(e.timer,3);e.alarmCooldown=Math.max(e.alarmCooldown||0,3);}
  return 'Тревожные передачи прерваны на несколько секунд.';
 }
 if(relay.kind==='edit'){
  g.cuts=g.cuts.filter(c=>c.room!==relay.room);
  g.tether=null;g.player.pulled=false;
  for(const e of local)if(e.type==='splicer'||e.type==='cutter'){e.state='recover';e.timer=Math.max(e.timer,2);}
  return 'Монтажные разрезы исчезли. Путь на время свободен.';
 }
 if(relay.kind==='signal'){
  g.echoImmunity=Math.max(g.echoImmunity,3);
  for(const e of local)if(e.type==='echo')e.noticeTime=Math.max(e.noticeTime,3);
  return 'Эхо ослабло: короткое окно для безопасного рывка.';
 }
 return null;
}
