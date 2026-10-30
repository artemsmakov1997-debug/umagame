export const WIDTH=768, HEIGHT=480, WORLD=WIDTH*3, MAX_HEALTH=4;
export const rooms=[{name:'РЕДАКЦИЯ',x:0},{name:'АРХИВ',x:768},{name:'ЭФИРНАЯ',x:1536}];
// Coordinates follow the illustrated desktops, repeated across connected rooms.
const desks=[[0,303,204],[301,300,188],[517,275,251],[0,400,244],[301,412,324],[0,474,230],[300,474,468],[0,169,75],[473,204,134]];
export const platforms=rooms.flatMap((r,room)=>desks.map(([x,y,w],index)=>({x:x+r.x,y,w,room,index})));
export const ladders=rooms.map(r=>({x:r.x+718,y:275,w:31,h:199}));
export const ladder=ladders[0];
export const spawns=rooms.map(r=>({x:r.x+45,y:255}));
export function enemy(type,room,x,platformIndex,extra={}){
 const s=platforms.find(p=>p.room===room&&p.index===platformIndex);
 const hp=type==='guard'?4:type==='charger'?3:2;
 return {type,room,x:rooms[room].x+x,y:s.y-29,w:48,h:29,origin:s.x+12,end:s.x+s.w-60,
  dir:-1,speed:type==='charger'?44:34,hp,maxHp:hp,armor:type==='guard',flying:type==='flyer',baseY:145,
  state:'patrol',timer:1.5,inv:0,lastSwing:-1,dead:false,...extra};
}
export function createEnemies(){return [
 enemy('crawler',0,133,0),enemy('charger',0,365,1,{guardian:true,hp:4,maxHp:4}),enemy('flyer',0,460,1,{origin:420,end:585}),
 enemy('guard',1,133,0),enemy('charger',1,365,1),enemy('flyer',1,460,1,{origin:420,end:585}),enemy('crawler',1,420,4),enemy('guard',1,566,2,{guardian:true,hp:5,maxHp:5}),
 enemy('charger',2,133,0),enemy('guard',2,365,1),enemy('flyer',2,460,1,{origin:420,end:550})
 ].map(e=>{if(e.room&&e.flying){e.origin+=e.room*WIDTH;e.end+=e.room*WIDTH;}return e;});}
export function createFish(){return rooms.flatMap(r=>[[114,260],[216,228],[253,207],[290,189],[327,176],[365,165],[400,159],[503,221],[562,233],[181,359],[375,368],[570,368]].map(([x,y])=>({x:x+r.x,y,taken:false})));}
export function surfaceAt(x){const local=((x%WIDTH)+WIDTH)%WIDTH;return local<250?303:local<510?300:275;}
