export const endingSlides=[
 {title:'УМА ПОБЕДИЛА',text:'Инфошум рассеивается. Шум, рождённый гонкой за просмотрами, теряет силу.'},
 {title:'ПОСЛЕДНИЙ ВИХРЬ',text:'Портал затягивает монстров. Редакция снова свободна.'},
 {title:'ВОЗВРАЩЕНИЕ ДОМОЙ',text:'Ума возвращается в редакцию. За столом её ждёт Юрий.'},
 {title:'ТЕПЕРЬ МЫ ВМЕСТЕ',text:'Юрий обнимает Уму. «Спасибо. Теперь наш черёд — отвечать за слова».'}
];
export const projectPurpose='Мы сделали игру, чтобы учиться замечать манипуляции, проверять источники и ценить ответственную журналистику.';
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
