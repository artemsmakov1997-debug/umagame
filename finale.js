export const endingSlides=[
 {title:'УМА ПОБЕДИЛА',text:'Инфошум распадается. Вокруг Умы кружатся тысячи газет, записей и сообщений. Но кто создал монстров?'},
 {title:'ПОСЛЕДНИЙ ВИХРЬ',text:'Портал затягивает монстров. События прокручиваются назад: испуг, искажённый эфир, копии, чужие пересылки… до первого сообщения.'},
 {title:'ВОЗВРАЩЕНИЕ ДОМОЙ',text:'Юрий снова дома. Но даже честные журналисты не могут в одиночку остановить цепь искажений.'},
 {title:'ТЕПЕРЬ МЫ ВМЕСТЕ',text:'Юрий обнимает Уму. «Мы будем проверять и исправлять. Но всё зависит от того, что каждый из нас решит передать дальше».'},
 {title:'А ЕСЛИ ЗАВТРА?',text:'Где-то человек читает громкий заголовок. Его палец зависает над кнопкой «Поделиться». Инфошум может вернуться. Всё начинается с нас.'}
];
export const projectPurpose='Монстры появились из цепной реакции человеческих действий: спешки, повторений, страха и потери контекста. Журналисты проверяют факты, но остановить инфошум можно только вместе — думая, прежде чем верить и делиться.';
export function scoreBreakdown(g){
 const values=[['Рыбки',g.fish,10],['Побеждённые враги',g.kills,50],['Антенны',g.relays.filter(d=>d.hp===0).length,100],['Боссы',g.bossesDefeated.size,1000]];
 return {items:values.map(([label,count,points])=>({label,count,points,total:count*points})),total:values.reduce((sum,[,count,points])=>sum+count*points,0)};
}
export function beginFinale(g){
 if(g.ending||g.mode==='won')return false;
 g.truthFound=true;g.bolts=[];g.portals=[];g.tether=null;g.player.attack=0;g.player.vx=0;g.player.vy=0;
 g.finalScore=scoreBreakdown(g);g.ending={index:0};g.dialogue=null;g.mode='ending';g.emit('victory');g.emit('endingSlide',{index:0});return true;
}
export function advanceFinale(g,direction=1){
 if(g.mode!=='ending'||!g.ending)return false;
 if(direction<0){if(g.ending.index===0)return false;g.ending.index--;g.emit('endingSlide',{index:g.ending.index});return true;}
 if(g.ending.index<endingSlides.length-1){g.ending.index++;g.emit('endingSlide',{index:g.ending.index});return true;}
 g.mode='won';g.emit('won');return true;
}