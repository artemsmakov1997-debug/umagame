export const WIDTH=768, HEIGHT=480, WORLD=WIDTH*3, MAX_HEALTH=4;
export const rooms=[{name:'РЕДАКЦИЯ',x:0},{name:'АРХИВ',x:768},{name:'ЭФИРНАЯ',x:1536}];
// Every highlighted surface has matching one-way collision geometry.
const desks=[[0,303,204],[301,300,188],[517,275,251],[0,400,244],[301,412,324],[0,474,230],[300,474,468],[0,169,75],[473,204,134]];
export const platforms=rooms.flatMap((r,room)=>desks.map(([x,y,w],index)=>({x:x+r.x,y,w,room,index})));
export const ladders=rooms.map(r=>({x:r.x+718,y:275,w:31,h:199}));
export const ladder=ladders[0];
export const spawns=rooms.map(r=>({x:r.x+45,y:255}));
export function enemy(type,room,x,platformIndex,extra={}){
 if(!['infonoise','clickbait','headline','panicker'].includes(type))throw new Error('Unknown enemy type: '+type);
 const s=platforms.find(p=>p.room===room&&p.index===platformIndex);
 if(!s)throw new Error('Unknown enemy platform');
 const hp=type==='headline'?3:2;
 return {id:`${type}-${room}-${x}-${platformIndex}`,type,room,x:rooms[room].x+x,y:s.y-29,w:48,h:29,origin:s.x+12,end:s.x+s.w-60,
 dir:-1,speed:type==='infonoise'?24:0,hp,maxHp:hp,state:type==='clickbait'?'lure':'patrol',timer:1.3,
 inv:0,lastSwing:-1,dead:false,alert:0,blastHit:false,...extra};
}
export function createEnemies(){return [
 enemy('infonoise',0,133,0),enemy('infonoise',0,365,1,{guardian:true,hp:3,maxHp:3}),
 enemy('clickbait',0,553,2),enemy('headline',0,390,4),
 enemy('panicker',1,135,0),enemy('infonoise',1,360,1),enemy('headline',1,418,1),
 enemy('clickbait',1,410,4),enemy('infonoise',1,566,2,{guardian:true,hp:4,maxHp:4}),
 enemy('panicker',2,130,0),enemy('infonoise',2,360,1),enemy('headline',2,418,4)
 ];}
export function createFish(){return rooms.flatMap(r=>[[114,260],[216,228],[253,207],[290,189],[327,176],[365,165],[400,159],[503,221],[181,359],[375,368],[570,368]].map(([x,y])=>({x:x+r.x,y,taken:false})));}
export function createSoup(){return [{x:WIDTH+179,y:355,taken:false},{x:WIDTH*2+560,y:366,taken:false}];}
export function surfaceAt(x){const local=((x%WIDTH)+WIDTH)%WIDTH;return local<250?303:local<510?300:275;}
