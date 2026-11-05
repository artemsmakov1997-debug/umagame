export const phasePlans={
 spreader:[['Подъём к Распространителю',['summon']],['Газетная бомбардировка',['rain']],['Открытый тираж',['scatter','summon']]],
 agitator:[['Обращение',['broadcast','telecast']],['Тревожный эфир',['pressure','alarm','summon','telecast']],['Охват любой ценой',['telecast','pressure','alarm','summon','broadcast']]],
 manipulator:[['Прямой эфир',['ticker','spotlight']],['Потерянный контекст',['cut','ticker','splice']],['Финальная склейка',['splice','cut','summon','spotlight']]],
 infoshum:[['Шумовой фон',['volley','wave','summon']],['Поток искажений',['rain','echoPulse','wave','summon']],['Поглощение',['copy','rain','cut','splice','wave','staticRush','lure','echoPulse','summon','volley']]]
};
export function phasePattern(b){return phasePlans[b.id][Math.min(2,b.phase-1)][1];}
export function stepBossPhase(g,dt){
 const b=g.boss,desired=b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
 if(desired>b.phase){b.phase=desired;b.phaseName=phasePlans[b.id][desired-1][0];b.state='phaseChange';b.timer=1.4;b.turn=0;b.ability=null;b.phased=false;g.bolts=[];g.cuts=[];g.tether=null;g.player.pulled=false;g.player.inv=Math.max(g.player.inv,1.6);g.emit('bossPhase',{boss:b.id,phase:b.phase,name:b.phaseName});}
 if(b.state!=='phaseChange')return false;
 b.timer-=dt;if(b.timer<=0){b.state='recover';b.timer=.7;}return true;
}
