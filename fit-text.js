// Shrinks an element's text until it fits its box (no scrolling, no clipping); the CSS size is the starting point.
export function fitText(el,min=8){
 if(!el)return;el.style.fontSize='';if(!el.clientHeight)return;let size=parseFloat(getComputedStyle(el).fontSize);
 while((el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)&&size>min){size-=.5;el.style.fontSize=size+'px';}
}
