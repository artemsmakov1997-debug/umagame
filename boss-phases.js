export const phasePlans={
 spreader:[['Подъём к Распространителю',['summon']],['Газетная бомбардировка',['rain']],['Открытый тираж',['scatter','summon']]],
 agitator:[['Перенастройка антенн',['sonic','headline']],['Погоня в помехах',['flee','headline']]],
 manipulator:[['Преследование',['rewrite','beam']],['Перезапись',['rewrite','beam']],['Последний дубль',['rewrite','beam']]],
 infoshum:[['Три заражённых экрана',['tentacle','wave','transfer']],['Сеть рушится',['tentacle','wave','transfer']],['Освобождение',['tentacle','wave','weak']]]
};
export function phasePattern(b){return phasePlans[b.id][Math.min(phasePlans[b.id].length-1,b.phase-1)][1];}
export function stepBossPhase(g,dt){
 const b=g.boss,desired=b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
 if(desired>b.phase){b.phase=desired;b.phaseName=phasePlans[b.id][desired-1][0];b.state='phaseChange';b.timer=1.4;b.turn=0;b.ability=null;b.phased=false;g.bolts=[];g.cuts=[];g.tether=null;g.player.pulled=false;g.player.inv=Math.max(g.player.inv,1.6);g.emit('bossPhase',{boss:b.id,phase:b.phase,name:b.phaseName});}
 if(b.state!=='phaseChange')return false;
 b.timer-=dt;if(b.timer<=0){b.state='recover';b.timer=.7;}return true;
}
