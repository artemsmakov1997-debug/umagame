export const openingSlides=[
 {title:'ДОМ УМЫ',text:'Это Ума — кошка, жительница и страж редакции.'},
 {title:'НА СТОРОНЕ ПРАВДЫ',text:'Вместе с редактором Юрием она защищает журналистику от лжи и манипуляций.'},
 {title:'КОГДА ПОГАС СВЕТ',text:'Но однажды шум стал громче правды — и редакцию поглотила тьма.'},
 {title:'ОСТАЛАСЬ ТОЛЬКО УМА',text:'Инфошум похитил Юрия, и теперь только Ума может вернуть его домой.'}
];
export function advanceOpening(g,direction=1){
 if(g.mode!=='prologue')return false;
 if(direction<0){g.openingIndex=Math.max(0,g.openingIndex-1);return true;}
 if(g.openingIndex<openingSlides.length-1){g.openingIndex++;return true;}
 g.mode='waking';g.emit('openingEnd');return true;
}
