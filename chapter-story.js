import {beginLocationTransition} from './room-transitions.js?v=0.17.0';
export const chapterStories={
 spreader:[{title:'СЛЕД В БУМАГАХ',text:'Среди обрывков Ума находит след: новости отправлялись в эфир без проверки.'},{title:'ВЫШЕ РЕДАКЦИИ',text:'Сигнал Юрия ведёт на крыши, где чужие голоса звучат громче фактов.'}],
 agitator:[{title:'ЭФИР ЗАТИХ',text:'Мачта умолкает, но Юрий предупреждает: кто-то продолжает усиливать ложь.'},{title:'ЗА КУЛИСАМИ',text:'Ума пробирается в телестудию, где из правдивых слов собирают чужую историю.'}],
 manipulator:[{title:'КТО ЗАПУСТИЛ ШУМ',text:'Монтаж распадается: за всем стоял человек, выбравший реакции вместо правды.'},{title:'ПО ТУ СТОРОНУ ЭКРАНА',text:'Чтобы вернуть Юрия, Ума входит в измерение, которое выросло из этой гонки.'}]
};
export function beginChapterStory(g){
 const b=g.boss;if(!g.storyEnabled||!g.cinematic||!chapterStories[b.id])return false;
 g.interlude={boss:b.id,chapterIndex:['spreader','agitator','manipulator'].indexOf(b.id),index:0};g.mode='interlude';g.dialogue=null;g.bolts=[];g.player.vx=0;g.player.vy=0;g.player.attack=0;g.emit('chapterStory',{boss:b.id});return true;
}
export function advanceChapterStory(g,direction=1){
 if(g.mode!=='interlude'||!g.interlude)return false;
 if(direction<0){g.interlude.index=Math.max(0,g.interlude.index-1);return true;}
 if(g.interlude.index===0){g.interlude.index=1;return true;}
 g.mode='playing';g.interlude=null;return beginLocationTransition(g);
}
