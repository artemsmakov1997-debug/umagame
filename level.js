export const WIDTH=768, HEIGHT=480, MAX_HEALTH=4;
export const rooms=[
 {name:'ПУСТАЯ РЕДАКЦИЯ',theme:'newsroom',objective:'НАЙДИ БЛОКНОТ: СНИМИ СИГНАЛ'},
 {name:'НОЧНАЯ УЛИЦА',theme:'street',objective:'ОСВОБОДИ РЕПОРТЕРА'},
 {name:'ТИПОГРАФИЯ',theme:'press',objective:'ОСВОБОДИ РЕДАКТОРА'},
 {name:'ТЕЛЕСТУДИЯ',theme:'studio',objective:'ОСВОБОДИ СЪЕМОЧНУЮ ГРУППУ'},
 {name:'БАШНЯ ЭФИРА',theme:'tower',objective:'НАЙДИ ЮРИЯ ШМАКОВА'}
].map((r,i)=>({...r,x:i*WIDTH}));
export const WORLD=WIDTH*rooms.length,LAST_ROOM=rooms.length-1,FINAL_X=LAST_ROOM*WIDTH;
// Every highlighted surface has matching one-way collision geometry.
const desks=[[0,303,204],[301,300,188],[517,275,251],[0,400,244],[301,412,324],[0,474,230],[300,474,468],[0,169,75],[473,204,134]];
const layouts=[desks,
 [[0,330,220],[285,290,205],[540,265,228],[0,424,250],[310,408,315],[0,474,230],[300,474,468],[0,195,100],[470,185,135]],
 [[0,310,228],[300,290,190],[535,275,233],[0,403,244],[301,412,324],[0,474,230],[300,474,468],[0,182,90],[473,204,134]],
 [[0,303,220],[285,280,205],[540,250,228],[0,400,244],[301,412,324],[0,474,230],[300,474,468],[0,169,90],[473,184,134]],desks];
export const platforms=rooms.flatMap((r,room)=>layouts[room].map(([x,y,w],index)=>({x:x+r.x,y,w,room,index,belt:room===2&&(index===1||index===4)?(index===1?20:-20):0})));
export const ladders=rooms.map((r,i)=>({x:r.x+718,y:layouts[i][2][1],w:31,h:474-layouts[i][2][1]}));
export const ladder=ladders[0];
export const spawns=rooms.map((r,i)=>({x:r.x+45,y:layouts[i][0][1]-48}));
export function enemy(type,room,x,platformIndex,extra={}){
 if(!['infonoise','clickbait','headline','panicker'].includes(type))throw new Error('Unknown enemy type: '+type);
 const s=platforms.find(p=>p.room===room&&p.index===platformIndex);
 if(!s)throw new Error('Unknown enemy platform');
 const hp=type==='headline'?3:2;
 return {id:`${type}-${room}-${x}-${platformIndex}`,type,room,x:rooms[room].x+x,y:s.y-29,w:48,h:29,origin:s.x+12,end:s.x+s.w-60,
 dir:-1,speed:type==='infonoise'?24:type==='headline'?14:type==='panicker'?18:0,hp,maxHp:hp,state:type==='clickbait'?'lure':'patrol',timer:1.3,
 inv:0,lastSwing:-1,dead:false,alert:0,blastHit:false,attackFlash:0,walkTime:0,...extra};
}
export function createEnemies(){return [
 enemy('infonoise',0,133,0),enemy('infonoise',0,365,1,{guardian:true,hp:3,maxHp:3}),
 enemy('infonoise',1,145,0),enemy('clickbait',1,365,1),enemy('infonoise',1,594,2,{guardian:true,hp:3,maxHp:3}),
 enemy('infonoise',2,133,0),enemy('headline',2,365,1),enemy('clickbait',2,410,4),enemy('infonoise',2,575,2,{guardian:true,hp:4,maxHp:4}),
 enemy('panicker',3,320,1),enemy('infonoise',3,420,1),enemy('headline',3,390,4),enemy('infonoise',3,575,2,{guardian:true,hp:4,maxHp:4}),
 enemy('panicker',4,133,0),enemy('infonoise',4,360,1),enemy('headline',4,418,4),enemy('clickbait',4,557,4)
 ];}
export function createFish(){return rooms.flatMap((r,i)=>[[114,layouts[i][0][1]-43],[216,228],[253,207],[290,189],[327,176],[365,165],[400,159],[503,221],[181,layouts[i][3][1]-41],[375,368],[570,368]].map(([x,y])=>({x:x+r.x,y,taken:false})));}
export function createSoup(){return [1,2,3,4].map(room=>({x:WIDTH*room+(room%2?179:560),y:room%2?355:366,taken:false}));}
export function createPeople(){return [
 {id:'reporter',name:'Репортёр',room:1}, {id:'editor',name:'Редактор',room:2},
 {id:'crew',name:'Съёмочная группа',room:3}, {id:'yuri',name:'Юрий Шмаков',room:LAST_ROOM}
].map(person=>({...person,x:person.room*WIDTH+697,y:layouts[person.room][2][1],rescued:false}));}
export function surfaceAt(x){const local=((x%WIDTH)+WIDTH)%WIDTH;return local<250?303:local<510?300:275;}
