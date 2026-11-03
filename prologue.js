// Preserve the mystery: no explanation of where the creatures come from.
export const openingSlides=[
 {title:'ДОМ УМЫ',text:'В небольшой редакции живёт кошка Ума. Её лучший друг — журналист Юрий.'},
 {title:'ОБЫЧНЫЙ ВЕЧЕР',text:'Юрий проверяет источники, Ума дремлет среди бумаг. За окнами засыпает город.'},
 {title:'НЕИЗВЕСТНЫЙ СИГНАЛ',text:'Внезапно экраны вспыхивают. Из газет и мониторов выходят странные существа. Никто не знает почему.'},
 {title:'ПРОПАВШИЙ РЕДАКТОР',text:'Юрия затягивает в экран. Ума остаётся одна. Чтобы вернуть друга, ей предстоит найти источник загадочного сигнала.'}
];
export function advanceOpening(g,direction=1){
 if(g.mode!=='prologue')return false;
 if(direction<0){g.openingIndex=Math.max(0,g.openingIndex-1);return true;}
 if(g.openingIndex<openingSlides.length-1){g.openingIndex++;return true;}
 g.mode='waking';g.emit('openingEnd');return true;
}