import {beginConclusion} from './conclusion.js?v=0.21.5';
export const endingSlides=[
 {title:'УМА ПОБЕДИЛА',art:'ending:0',text:'Инфошум распадается. Портал втягивает уцелевших монстров. Среди обрывков Ума видит Юрия — бледного, но живого.'},
 {title:'ОБРАТНАЯ ПЕРЕМОТКА',art:'rewind:6',text:'Поток разворачивается вспять. Огромный Инфошум распадается на тысячи небольших существ — и ещё более мелких сообщений.'},
 {title:'ПЕРВЫЕ СУЩЕСТВА',art:'rewind:5',text:'Раньше монстров здесь не было. Они возникали там, где накопилось слишком много одинаковых тревожных копий.'},
 {title:'МАССОВОЕ РАСПРОСТРАНЕНИЕ',art:'rewind:4',text:'Экраны, газеты, чаты. Никакого единого пульта: каждый передавал сообщение дальше своим путём.'},
 {title:'ПОВТОРЕНИЯ И ДОМЫСЛЫ',art:'rewind:3',text:'К короткому фрагменту добавляли предположения, громкие слова, страх. С каждой новой копией тревога становилась сильнее.'},
 {title:'ПЕРВАЯ ПЕРЕСЫЛКА',art:'rewind:2',text:'Ещё раньше — обычное нажатие «Переслать». Человек увидел тревожный фрагмент и отправил его дальше, не проверив запись.'},
 {title:'ПОДМЕНА',art:'rewind:1',text:'До этого кто-то обрезал объяснение. В копию не попали слова о плановой проверке и отсутствии угрозы.'},
 {title:'ПЕРВОИСТОЧНИК',art:'rewind:0',text:'Вот начало: достоверный сюжет о проверке оповещения. Маленькие решения разных людей превратили его в страх, а страх — в существ.'},
 {title:'ПЕРЕД СЛЕДУЮЩИМ НАЖАТИЕМ',art:'rewind:7',text:'Единственного виновника нет. Каждый добавил немного. Даже честные журналисты не остановят эту цепь в одиночку.'},
 {title:'ВОЗВРАЩЕНИЕ ДОМОЙ',art:'ending:2',text:'Помехи стихают. Юрий садится за свой стол и впервые за долгое время слышит тишину. Ума узнаёт его голос без треска.'},
 {title:'ТЕПЕРЬ МЫ ВМЕСТЕ',art:'ending:3',text:'Юрий обнимает Уму. «Одному было не справиться, — шепчет он. — Хорошо, что я был не один». Ума тихо мурлычет.'}
];
export const projectPurpose='Журналисты проверяют факты. Чтобы информационный шум не возвращался, важно участие каждого из нас.';
export function scoreBreakdown(g){const values=[['Рыбки',g.fish,10],['Побеждённые враги',g.kills,50],['Улики',g.clues.length,100],['Боссы',g.bossesDefeated.size,1000]];return{items:values.map(([label,count,points])=>({label,count,points,total:count*points})),total:values.reduce((sum,[,count,points])=>sum+count*points,0)};}
export function beginFinale(g){if(g.ending||g.conclusion||g.mode==='won')return false;g.truthFound=true;g.bolts=[];g.portals=[];g.tether=null;g.player.attack=0;g.player.vx=0;g.player.vy=0;g.finalScore=scoreBreakdown(g);g.ending={index:0};g.dialogue=null;g.mode='ending';g.emit('victory');g.emit('endingSlide',{index:0});return true;}
export function advanceFinale(g,direction=1){if(g.mode!=='ending'||!g.ending)return false;if(direction<0){if(g.ending.index===0)return false;g.ending.index--;g.emit('endingSlide',{index:g.ending.index});return true;}if(g.ending.index<endingSlides.length-1){g.ending.index++;g.emit('endingSlide',{index:g.ending.index});return true;}return beginConclusion(g);}
