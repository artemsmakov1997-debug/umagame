// Spreader arena furniture: steel braces under the two side ledges. The shelters draw themselves (spreader-art.js).
export function drawSpreaderEquipment(c,a,g){
 if(g.room!==2)return;
 for(const s of g.platforms.filter(p=>p.room===2&&p.index!==0&&!p.shelter)){
  const side=s.x+s.w/2<g.platforms.find(p=>p.room===2&&p.index===0).x+432?-1:1,xx=side===-1?s.x+10:s.x+s.w-14;
  c.fillStyle='#0a182b';c.fillRect(xx,s.y+12,5,39);
  for(let i=0;i<37;i++){c.fillStyle='#152c43';c.fillRect(xx+(side===-1?i:-i),s.y+47-i,6,5);c.fillStyle='#42617a';c.fillRect(xx+(side===-1?i:-i),s.y+47-i,2,2);}
 }
}
