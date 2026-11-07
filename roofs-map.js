// «Крыши»: an ascent over rooftops to the Agitator's mast. Pure data, local x, y = top surface.
// Buildings are solid blocks (their walls stop Uma below the roof line); the street between them is a fall.
// Three blocks of one screen each: fire escapes → washing lines → antenna forest.
// Platform indices follow this order: buildings, then the rope, the awning and the roof props.
export const ROOF_BUILDINGS=[
 {x:0,w:260,y:420,style:'brick'},                 // 0 A0 start roof
 {x:330,w:232,y:392,style:'tin'},                 // 1 A1
 {x:520,w:248,y:262,style:'brick',wall:562},      // 2 A2 tall; eave over A1 for the fire-escape ladder
 {x:900,w:180,y:298,style:'brick'},               // 3 B0 (Нагнетатель faces the washing line)
 {x:1110,w:130,y:338,style:'tin'},                // 4 B1
 {x:1306,w:230,y:200,style:'brick',wall:1316},    // 5 B2 tall; reached only by the awning
 {x:1630,w:170,y:230,style:'tin'},                // 6 C0 behind the windy gap
 {x:1840,w:175,y:262,style:'brick'},              // 7 C1
 {x:1972,w:332,y:150,style:'brick',wall:2015}     // 8 C2 the mast roof and the arena door
];
export const ROOF_ROPES=[{x:768,w:132,y:270}];                    // 9 washing line over the first alley
export const ROOF_AWNINGS=[{x:1250,w:80,y:376}];                  // 10 striped awning on B2's wall: a trampoline
export const ROOF_PROPS=[
 {kind:'chimney',x:400,w:30,y:320,base:392},                      // 11 A1 chimney (soup)
 {kind:'chimney',x:1490,w:40,y:152,base:200},                     // 12 B2 chimney (life)
 {kind:'tank',x:1700,w:70,y:162,base:230}                         // 13 C0 water tank (life)
];
export const ROOF_LADDERS=[{x:524,top:262,bottom:392},{x:1980,top:150,bottom:262}];
// Flocks of Сенсации cross a lane at a fixed height; birds fly over [x1,x2] from the `from` side.
export const SENSATION_LANES=[
 {id:'rope',x1:730,x2:940,y:228,from:1,period:5,phase:0},       // head height on the washing line: crouch or wait
 {id:'jump',x1:1060,x2:1260,y:224,from:1,period:3.8,phase:1.4},   // jump height between B0 and B1: don't jump into it
 {id:'ladder',x1:1820,x2:2040,y:220,from:1,period:4.6,phase:2.2}  // over C1 and the last ladder
];
// Wind gusts sweep the antenna forest (block 3) right → left; they move Uma only while she is in the air.
export const WIND={x1:1536,x2:2304,period:5,warn:.8,gust:1.6,speed:-95};
// Checkpoints after losing a life: start, end of block 1, end of block 2.
export const ROOF_CHECKPOINTS=[{x:45,index:0},{x:690,index:2},{x:1400,index:5}];
export const ROOF_ENTRANCE={x:2168,h:166};
export const roofSectionNames=['Пожарные лестницы','Бельевые верёвки','Антенный лес'];
// What stands at a room-3 platform index.
export function roofPiece(index){
 const nb=ROOF_BUILDINGS.length,nr=ROOF_ROPES.length,na=ROOF_AWNINGS.length;
 if(index<nb)return {type:'building',...ROOF_BUILDINGS[index]};
 if(index<nb+nr)return {type:'rope',...ROOF_ROPES[index-nb]};
 if(index<nb+nr+na)return {type:'awning',...ROOF_AWNINGS[index-nb-nr]};
 return {type:'prop',...ROOF_PROPS[index-nb-nr-na]};
}
