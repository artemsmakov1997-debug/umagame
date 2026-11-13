// Preserve the mystery: no explanation of where the creatures come from.
export const openingSlides=[
 {title:'ДОМ УМЫ',text:'Ночная редакция. Журналист Юрий Шмаков и кошка Ума. Юрий не публикует ни строчки, пока не проверит её.'},
 {title:'ТРЕВОЖНЫЙ ФРАГМЕНТ',text:'По городу разлетается видео с сигналом тревоги. Его пересылают все. Юрий ищет, кто его снял.'},
 {title:'ШУМ',text:'Экраны вспыхивают. Из газет и мониторов выходят странные существа. Юрий тянется к рубильнику эфира.'},
 {title:'ПРОПАВШИЙ ЖУРНАЛИСТ',text:'Не успел. Юрия затягивает в экран. «Ума, найди источник!» — последнее, что она слышит.'}
];
export function advanceOpening(g,direction=1){
 if(g.mode!=='prologue')return false;
 if(direction<0){g.openingIndex=Math.max(0,g.openingIndex-1);return true;}
 if(g.openingIndex<openingSlides.length-1){g.openingIndex++;return true;}
 g.mode='waking';g.emit('openingEnd');return true;
}