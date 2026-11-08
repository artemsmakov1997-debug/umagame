// «Измерение» (room 7) — «Первоисточник». Pure data: pieces in room-local coordinates.
// Three blocks over a void: «Лента» (rising message bubbles, a Кликбейт sitting on some of them),
// «Изнанка» (a rift turns Uma upside down and the feed runs the other way — the mirror image of «Лента»),
// «Разлом» (a second rift puts her back on her feet before the threshold).
// Yuri's own messages hold; forwarded copies drift and pop. No transmitters: three optional «первоисточники» weaken Infoshum.
export const DIM_ROOM=7;
// The upside-down feed is «Лента» mirrored about this line: y' = MIRROR - y.
export const MIRROR=460;
export const DIM_PIECES=[
 {type:'yuri',x:0,w:210,y:390},                       // 0 start
 // 1–9: three feed lanes of three rising copies each (their y is computed every frame).
 ...[0,1,2].flatMap(lane=>[0,1,2].map(slot=>({type:'copy',lane,slot,x:265+lane*150,w:110,y:470}))),
 {type:'yuri',x:720,w:170,y:300},                     // 10 top of the climb; the first rift cuts through its far end
 {type:'yuri',x:840,w:200,y:70,inverted:true},        // 11 a hanging message: Uma falls up under it
 // 12–20: the same feed upside down — copies sink from the ceiling; Uma hangs under them.
 ...[0,1,2].flatMap(lane=>[0,1,2].map(slot=>({type:'copy',lane,slot,reversed:true,inverted:true,x:1095+lane*150,w:110,y:-10}))),
 {type:'island',x:1550,w:170,y:160,inverted:true},    // 21 hanging island; the second rift cuts through it
 {type:'island',x:1640,w:200,y:380},                  // 22 Uma lands back on her feet
 {type:'island',x:1930,w:120,y:330},                  // 23
 {type:'island',x:2150,w:154,y:300}                   // 24 the threshold of Infoshum
];
// Rising feed: copies appear at `bottom`, rise at `speed` and pop near `top`. Neighbouring lanes are half a step apart.
export const FEED={bottom:500,top:110,speed:34,perLane:3,lanePhase:[0,.5,0],fade:.86,pop:.965};
// Gravity rifts: crossing one turns the world upside down (or back).
export const RIFTS=[{x:870,y:120,h:210},{x:1690,y:110,h:220}];
// «Первоисточники»: Yuri's original messages, hidden off the obvious path.
export const ORIGINALS=[
 {id:'source-1',x:466,y:58},    // above the feed: ride a copy almost to the top and jump
 {id:'source-2',x:1296,y:372},  // its mirror: ride a sinking copy almost to the bottom and jump “down”
 {id:'source-3',x:1985,y:200}   // over the last island: a full jump
];
export const DIM_CHECKPOINTS=[{x:40,index:0},{x:740,index:10},{x:1660,index:22}];
export const dimensionSectionNames=['Лента','Изнанка','Разлом'];
export const isSafeDimPiece=p=>!!p&&!p.inverted&&['yuri','island'].includes(p.type);
