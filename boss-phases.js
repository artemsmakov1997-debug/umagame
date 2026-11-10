export const phasePlans={
 spreader:[['Ковровая бомбардировка',['rain','collect','summon']],['Рывок',['dash','summon']],['Срочный выпуск',['spear','rain']]],
 agitator:[['Лозунг',['slogan']],['Митинг',['ura','swing','stomp']],['Прямой эфир',['gust','swing']]],
 manipulator:[['Панорама',['pan','beam']],['Стоп-кадр',['snap','cut']],['Проектор',['beam','illusion']]],
 infoshum:[['Море экранов',['screens','tvBeam']],['Колосс',['slam','sweep']],['На свободе',['tentacle','ram']]]
};
export function phasePattern(b){return phasePlans[b.id][Math.min(phasePlans[b.id].length-1,b.phase-1)][1];}
export function stepBossPhase(g,dt){
 const b=g.boss,desired=b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
 if(desired>b.phase){b.phase=desired;b.phaseName=phasePlans[b.id][desired-1][0];b.state='phaseChange';b.timer=1.4;b.turn=0;b.ability=null;b.phased=false;g.bolts=[];g.cuts=[];g.tether=null;g.player.pulled=false;g.player.inv=Math.max(g.player.inv,1.6);g.emit('bossPhase',{boss:b.id,phase:b.phase,name:b.phaseName});}
 if(b.state!=='phaseChange')return false;
 b.timer-=dt;if(b.timer<=0){b.state='recover';b.timer=.7;}return true;
}
