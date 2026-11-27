// «Измерение» (room 7) — «Первоисточник». Pure data: pieces in room-local coordinates.
// Four blocks over a void (the fourth, «Пересылка», is messages sliding to and fro): «Лента» (rising message bubbles,
// Кликбейты sitting on some of them), «Изнанка» (a rift turns Uma upside down and the feed runs the other way — the
// mirror image of «Лента»), «Разлом» (a second rift puts her back on her feet before the threshold).
// The ground to rest on is islands. Among the moving messages, Yuri's own blue ones hold; the purple forwarded copies
// crumble a moment after Uma lands on one and come back with the next wrap of the feed. No transmitters.
export const DIM_ROOM=7;
// The upside-down feed is «Лента» mirrored about this line: y' = MIRROR - y.
export const MIRROR=460;
export const DIM_PIECES=[
 {type:'island',x:0,w:210,y:390},                     // 0 start
 // 1–9: three feed lanes of three rising copies each (their y is computed every frame).
 ...[0,1,2].flatMap(lane=>[0,1,2].map(slot=>({type:'copy',lane,slot,blue:(lane+slot)%2===0,x:265+lane*150,w:110,y:470}))),
 {type:'island',x:720,w:170,y:300},                   // 10 top of the climb; the first rift cuts through its far end
 {type:'island',x:840,w:200,y:70,inverted:true},      // 11 a hanging island: Uma falls up under it
 // 12–20: the same feed upside down — copies sink from the ceiling; Uma hangs under them.
 ...[0,1,2].flatMap(lane=>[0,1,2].map(slot=>({type:'copy',lane,slot,blue:(lane+slot)%2===0,reversed:true,inverted:true,x:1095+lane*150,w:110,y:-10}))),
 {type:'island',x:1550,w:170,y:160,inverted:true},    // 21 hanging island; the second rift cuts through it
 {type:'island',x:1640,w:200,y:380},                  // 22 Uma lands back on her feet
 // «Пересылка»: forwarded messages sliding to and fro over the void; a Кликбейт rides one of them.
 {type:'slide',blue:true,x:1880,range:110,w:100,y:340,period:4.6,phase:0},     // 23
 {type:'slide',blue:true,x:2120,range:110,w:100,y:300,period:4.6,phase:Math.PI},// 24
 {type:'island',x:2360,w:130,y:300},                  // 25 a breather
 {type:'slide',blue:true,x:2520,range:120,w:100,y:280,period:5.2,phase:0},     // 26
 {type:'slide',blue:true,x:2760,range:70,w:90,y:320,period:3.8,phase:1.4},     // 27
 {type:'island',x:2918,w:154,y:300}                   // 28 the threshold of Infoshum
];
// Rising feed: copies appear at `bottom`, rise at `speed` and pop near `top`. Neighbouring lanes are half a step apart.
export const FEED={bottom:500,top:110,speed:34,perLane:3,lanePhase:[0,.5,0],fade:.86,pop:.965};
// «Яркие сообщения»: copies leave the bottom of a lane one after another; every fourth one in each lane comes up
// bright — bait in both the rising and upside-down feeds. Step on it and a Кликбейт bursts out of the bubble. They come regularly from the very start (lanes 0
// and 2 are offset so one of them always carries a bait); a used one stays plain until it wraps.
export const BAIT={every:4,emerge:.4};
export function feedCycle(piece,t){const range=FEED.bottom-FEED.top,spacing=range/FEED.perLane;return Math.floor((FEED.speed*t+(piece.slot+FEED.lanePhase[piece.lane])*spacing)/range);}
// The order in which a lane's copies come up: slot s of wrap c is the (3c−s)-th.
export function isBaitCopy(piece,t){if(piece.type!=='copy')return false;const k=FEED.perLane*feedCycle(piece,t)-piece.slot+piece.lane;return (k%BAIT.every+BAIT.every)%BAIT.every===0;}
// Gravity rifts: crossing one turns the world upside down (or back).
export const RIFTS=[{x:870,y:120,h:210},{x:1690,y:110,h:220}];
// «Первоисточники» (envelopes) were removed from the map; the list stays empty.
export const ORIGINALS=[];
// A purple copy under Uma: cracks after CRUMBLE.crack seconds, pops after CRUMBLE.pop and stays gone until it wraps.
export const CRUMBLE={crack:.3,pop:.6};
export const DIM_CHECKPOINTS=[{x:40,index:0},{x:1660,index:22}];
export const dimensionSectionNames=['Лента','Изнанка','Разлом','Пересылка'];
export const isSafeDimPiece=p=>!!p&&!p.inverted&&p.type==='island';
// A sliding message: its x at time t (x is the left end of its swing, range the swing width).
export function slideX(piece,t){return piece.x+piece.range*(.5-.5*Math.cos(2*Math.PI*t/piece.period+piece.phase));}
