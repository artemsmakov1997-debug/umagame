const crt=[[36,77,319,271],[392,77,321,271],[749,77,319,271],[1104,77,321,271],[1461,77,322,271],[1818,77,319,271]];
const body=[[40,57,369,362],[471,60,390,320],[911,50,397,334],[1353,42,402,362],[25,491,397,360],[466,475,395,388],[921,483,369,378],[1353,468,396,380]];
const effects=[[48,207,495,338],[543,319,534,219],[1240,137,235,408],[1650,137,459,424]];
export function drawInfoshumSprite(c,a,kind,index,x,y,w,h){
 const image=kind==='crt'?a.infoshumCRT:kind==='body'?a.infoshumBody:kind==='effect'?a.infoshumEffects:a.infoshumTerminal;
 if(!image?.complete||!image.naturalWidth)return;
 const box=kind==='crt'?crt[index]:kind==='body'?body[index]:kind==='effect'?effects[index]:[index*362+36,430,320,240];if(!box)return;
 c.imageSmoothingEnabled=false;
 if(kind==='body'){const scale=Math.min(w/box[2],h/box[3]),dw=box[2]*scale,dh=box[3]*scale;x+=(w-dw)/2;y+=(h-dh)/2;w=dw;h=dh;}
 c.drawImage(image,...box,Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
export function drawInfoshumProjectile(c,a,b,t){
 if(!b.infoshumAttack)return false;
 const frame=b.infoshumAttack==='rain'?2:b.infoshumAttack==='wave'?1:3;
 drawInfoshumSprite(c,a,'effect',frame,b.x,b.y,b.w,b.h);return true;
}
