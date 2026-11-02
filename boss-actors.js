export const bossActorId=b=>'boss:'+b.id;
export function actorById(g,id){return g.enemies.find(e=>e.id===id)||(g.boss?.active&&g.boss.hp>0&&id===bossActorId(g.boss)?g.boss:null);}
export function bossProxy(g){const b=g.boss,s=g.platforms.find(s=>s.room===b.room&&s.index===b.platformIndex);return{...b,id:bossActorId(b),type:b.id,x:b.x+(b.w-48)/2,y:b.y+b.h-29,w:48,h:29,origin:(s?.x??b.x)+12,end:(s?s.x+s.w:b.x+b.w)-60,dead:b.hp<=0,boss:true};}
