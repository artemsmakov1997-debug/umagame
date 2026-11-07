// «Студия»: a sound stage where the floor is montage. Pure data, local x, y = top surface.
// Fixed islands (truss, flight case, camera dolly) are safe; between them the pits are falls.
// Block 1 «Павильон»: holograms vanish 0.7 s after Uma steps on them (some also blink on a timer).
// Block 2 «Прожекторы»: stage risers are solid only while a sweeping spotlight covers them.
// Block 3 «Монтажная»: red and blue «дубли» swap on the clapper's beat.
// Platform indices follow this order.
export const STUDIO_PIECES=[
 {type:'fixed',kind:'truss',x:0,w:230,y:400},          // 0 start
 {type:'holo',x:285,w:96,y:386},                        // 1
 {type:'holo',x:420,w:96,y:330,blink:{period:4.4,phase:1.2}}, // 2 the real, higher hologram
 {type:'fixed',kind:'truss',x:575,w:190,y:352},         // 3 transmitter 1, Нарезчик
 {type:'fixed',kind:'dolly',x:800,w:170,y:330},         // 4 camera dolly, Склейка
 {type:'stage',x:1010,w:100,y:320},                     // 5
 {type:'stage',x:1150,w:100,y:300},                     // 6
 {type:'stage',x:1290,w:100,y:318},                     // 7
 {type:'fixed',kind:'truss',x:1420,w:150,y:300},        // 8 transmitter 2, Склейка
 {type:'take',color:'red',x:1610,w:100,y:290},          // 9
 {type:'take',color:'blue',x:1750,w:100,y:270},         // 10
 {type:'fixed',kind:'case',x:1890,w:120,y:262},         // 11 transmitter 3, Нарезчик
 {type:'take',color:'red',x:2050,w:100,y:244},          // 12
 {type:'take',color:'blue',x:2150,w:70,y:232},          // 13
 {type:'fixed',kind:'truss',x:2214,w:90,y:226}          // 14 the pavilion door
];
export const HOLO={warn:.7,gone:1.6,back:.35};
// Spotlights hang from the ceiling truss; the lit spot sweeps along the risers' level.
// Two lamps swing together and dwell at the ends: first they light risers 5 and 6, then 6 and 7.
// The middle riser stays lit, the outer ones take turns — "move with the light".
export const SPOTLIGHTS=[{x:1130,mid:1130,amp:70,period:7.2,phase:0,w:150,dwell:1.6},{x:1270,mid:1270,amp:70,period:7.2,phase:0,w:150,dwell:1.6}];
export const SPOT_MIN_OVERLAP=30;
// «Дубли»: red is live for `beat` seconds, then blue; the last `warn` seconds blink before the swap.
export const TAKES={beat:2.4,warn:.6};
// Дипфейк projects fake copies of platforms while it is alive: they look real but hold nothing.
export const FAKES=[
 {owner:0,type:'holo',x:455,w:96,y:394},     // the obvious low step over the first pit
 {owner:1,type:'stage',x:968,w:96,y:362},    // a riser that is "always lit"
 {owner:2,type:'take',color:'red',x:2010,w:96,y:300} // a low red take between the case and the last takes
];
export const STUDIO_CHECKPOINTS=[{x:45,index:0},{x:600,index:3},{x:1440,index:8},{x:1910,index:11}];
export const STUDIO_DOOR={x:2216,h:74};
export const studioSectionNames=['Павильон','Прожекторы','Монтажная'];
export function studioPiece(index){return STUDIO_PIECES[index];}
