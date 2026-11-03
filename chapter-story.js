import {beginLocationTransition} from './room-transitions.js?v=0.18.1';
export const chapterStories={
 spreader:[{title:'СЛЕД В БУМАГАХ',text:'В архиве повторяется одна заметка без подписи — сигнал ведёт дальше.'},{title:'ВЫШЕ РЕДАКЦИИ',text:'Юрий ловит обрывок сигнала с крыш, и Ума идёт по следу.'}],
 agitator:[{title:'ЭФИР ЗАТИХ',text:'Мачта умолкла, но изменённое сообщение повторяют сотни передатчиков.'},{title:'ЗА КУЛИСАМИ',text:'Путь ведёт в студию, где ещё могла сохраниться исходная запись.'}],
 manipulator:[{title:'КТО ЗАПУСТИЛ ШУМ',text:'В исходной записи нет угрозы, которой пугают копии, — кто изменил её смысл?'},{title:'ПО ТУ СТОРОНУ ЭКРАНА',text:'Последний след уходит за экран, в измерение, где затерялся Юрий.'}]
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
