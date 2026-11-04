import {beginLocationTransition} from './room-transitions.js?v=0.21.0';
export const chapterStories={
 spreader:[
  {title:'РАЗНЫЕ ВЕРСИИ',art:0,text:'Распространитель рассыпается на страницы. В каждой — свой заголовок об одном событии. Источник нигде не указан.'},
  {title:'ТЕХНИЧЕСКИЙ СЛЕД',art:1,text:'В станке осталась метка G-17. «Это идентификатор городской передачи, — различает Ума голос Юрия. — Проверю маршрут». '},
  {title:'ЗА ПРЕДЕЛЫ РЕДАКЦИИ',art:2,text:'Метка ведёт к вещательной сети на крышах. Ума выбирается из редакции: там мог сохраниться след первого сообщения.'}
 ],
 agitator:[
  {title:'СЕТЬ БЕЗ ЦЕНТРА',art:3,text:'Мачта Агитатора гаснет. Остальные антенны продолжают передачу: они повторяют друг друга независимо.'},
  {title:'ОБРЫВОК ЭФИРА',art:4,text:'«В ранних копиях есть один и тот же видеокадр…» Изображение Юрия рвётся. На записи виден знак телевизионной студии.'},
  {title:'К ИСХОДНОЙ ЗАПИСИ',art:5,text:'Ума узнаёт здание за окном. В студийном архиве можно найти полную запись — и понять, что в ней изменилось.'}
 ],
 manipulator:[
  {title:'ПОЛНАЯ ЗАПИСЬ',art:6,text:'В архиве уцелел полный эфир: плановая проверка городской системы оповещения. Диктор отдельно говорит: «Угрозы нет».'},
  {title:'ВЫРВАНО ИЗ КОНТЕКСТА',art:7,text:'В копиях оставили только проверочный сигнал. Без объяснения он звучал как тревога. Но как появились сами существа?'},
  {title:'ПО ТУ СТОРОНУ',art:8,text:'След первой пересылки уходит за экран. «Ума, я рядом…» Чужой сигнал повторяет голос Юрия. Экран затягивает кошку.'}
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
