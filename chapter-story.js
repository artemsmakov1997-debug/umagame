import {beginLocationTransition} from './room-transitions.js?v=0.21.5';
export const chapterStories={
 spreader:[
  {title:'РАЗНЫЕ ВЕРСИИ',art:0,text:'Распространитель рассыпается на страницы. На каждой свой заголовок об одном и том же. Подписи нет ни под одним.'},
  {title:'ТЕХНИЧЕСКИЙ СЛЕД',art:1,text:'В станке осталась метка G-17. «Городская передача, — шепчет из динамика Юрий. — Я писал о ней… Проверь крыши».'},
  {title:'ЗА ПРЕДЕЛЫ РЕДАКЦИИ',art:2,text:'«Сначала источник, потом заголовок, — голос Юрия дрожит. — А сегодня я сам опоздал». Ума выходит на крыши.'}
 ],
 agitator:[
  {title:'СЕТЬ БЕЗ ЦЕНТРА',art:3,text:'Мачта Агитатора гаснет, но антенны кричат дальше: они повторяют друг друга независимо. Общего рубильника нет.'},
  {title:'ОБРЫВОК ЭФИРА',art:4,text:'«В ранних копиях один и тот же кадр…» Изображение Юрия рвётся на полуслове. За его спиной виден знак телестудии.'},
  {title:'К ИСХОДНОЙ ЗАПИСИ',art:5,text:'«Если я пропаду — досмотри запись. Не до тревожного места, а до конца», — просит Юрий. Ума узнаёт студию за окном.'}
 ],
 manipulator:[
  {title:'ПОЛНАЯ ЗАПИСЬ',art:6,text:'В архиве уцелел полный эфир: плановая проверка оповещения. Диктор говорит: «Угрозы нет». Юрий долго молчит.'},
  {title:'ВЫРВАНО ИЗ КОНТЕКСТА',art:7,text:'«Хватило вырезать одну фразу, — тихо говорит он. — Я полминуты сомневался. Шуму этого хватило».'},
  {title:'ПО ТУ СТОРОНУ',art:8,text:'След первой пересылки уходит за экран. «Ума, я рядом…» — но это копия его голоса. Экран затягивает кошку.'}
 ]
};
export function beginChapterStory(g){
 const b=g.boss;if(!g.storyEnabled||!g.cinematic||!chapterStories[b.id])return false;
 g.interlude={boss:b.id,chapterIndex:['spreader','agitator','manipulator'].indexOf(b.id),index:0};g.mode='interlude';g.dialogue=null;g.bolts=[];g.player.vx=0;g.player.vy=0;g.player.attack=0;g.emit('chapterStory',{boss:b.id});return true;
}
export function advanceChapterStory(g,direction=1){
 if(g.mode!=='interlude'||!g.interlude)return false;
 if(direction<0){g.interlude.index=Math.max(0,g.interlude.index-1);return true;}
 if(g.interlude.index<chapterStories[g.interlude.boss].length-1){g.interlude.index++;return true;}
 g.mode='playing';g.interlude=null;return beginLocationTransition(g);
}
