// Original melodies, harmonies and rhythm patterns for every location and boss.
export const musicScores={
 menu:{bpm:86,wave:'triangle',melody:[69,null,72,76,74,null,72,71,69,null,67,64,67,69,72,null,72,76,79,76,74,72,71,null,67,71,74,72,71,67,69,null],bass:[33,29,36,31],chords:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],drums:[]},
 quiet:{bpm:72,wave:'sine',melody:[72,null,null,76,null,79,null,null,76,null,74,null,72,null,null,null,69,null,72,null,76,null,null,74,72,null,69,null,67,null,72,null],bass:[36,33,29,31],chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],drums:[]},
 newsroom:{bpm:104,wave:'triangle',melody:[64,67,69,null,72,69,67,64,67,null,71,74,72,71,67,null,69,72,76,72,69,67,64,null,62,65,69,null,67,65,64,null],bass:[28,33,29,31],chords:[[52,55,59],[57,60,64],[53,57,60],[55,59,62]],drums:[0,3,4,6],noise:3600},
 roofs:{bpm:114,wave:'triangle',melody:[74,null,81,78,null,76,74,null,73,76,null,80,76,null,73,69,71,null,78,75,null,74,71,null,69,73,76,null,78,76,73,null],bass:[38,33,35,33],chords:[[62,66,69],[57,61,64],[59,62,66],[57,61,64]],drums:[0,2,5,7],noise:6500},
 studio:{bpm:124,wave:'square',melody:[72,79,null,75,79,null,82,79,70,null,77,74,null,77,81,null,68,75,72,null,79,75,null,72,67,null,74,71,77,null,74,null],bass:[36,34,32,31],chords:[[60,63,67],[58,62,65],[56,60,63],[55,59,62]],drums:[0,1,4,6],noise:2100},
 dimension:{bpm:94,wave:'sawtooth',melody:[61,null,62,null,68,61,null,null,60,66,null,61,null,67,60,null,58,null,64,65,null,58,null,59,61,null,null,68,62,null,61,null],bass:[25,24,22,25],chords:[[49,52,56],[48,51,55],[46,49,53],[49,53,56]],drums:[0,3,5],noise:5200,gain:.018},
 spreader:{bpm:146,wave:'triangle',melody:[76,72,69,76,79,76,72,69,74,71,67,74,77,74,71,67,72,69,65,72,76,72,69,65,71,67,64,71,74,71,67,null],bass:[33,31,29,28],chords:[[57,60,64],[55,59,62],[53,57,60],[52,55,59]],drums:[0,2,3,6],noise:4200},
 agitator:{bpm:132,wave:'square',melody:[62,62,69,null,62,65,69,65,61,61,68,null,61,64,68,64,60,60,67,null,60,63,67,63,59,59,66,null,59,62,66,null],bass:[26,25,24,23],chords:[[50,53,57],[49,52,56],[48,51,55],[47,50,54]],drums:[0,2,4,6],noise:1400},
 manipulator:{bpm:128,wave:'triangle',melody:[65,null,72,68,65,72,null,75,64,71,null,67,71,null,74,67,63,null,70,66,63,70,null,73,62,69,null,65,69,null,72,null],bass:[29,28,27,26],chords:[[53,56,60],[52,55,59],[51,54,58],[50,53,57]],drums:[0,3,4,7],noise:7000},
 infoshum:{bpm:154,wave:'sawtooth',melody:[57,69,58,70,64,null,67,63,56,68,57,69,65,64,60,null,60,72,61,73,67,72,71,67,59,71,60,72,68,62,59,null],bass:[21,20,24,23],chords:[[45,48,52],[44,47,51],[48,51,55],[47,50,54]],drums:[0,1,3,4,6,7],noise:5600,gain:.025},
 ending:{bpm:78,wave:'triangle',melody:[72,null,76,79,84,null,83,79,77,null,76,74,72,null,null,67,69,null,72,76,79,76,74,null,72,null,67,64,60,null,null,null],bass:[36,29,33,36],chords:[[60,64,67],[53,57,60],[57,60,64],[60,64,67]],drums:[]}
};
export function sceneMusic(view,g,rooms){
 if(view!=='game')return'menu';const mode=g.mode==='paused'?g.pausedFrom:g.mode;if(['ending','interlude','conclusion','won'].includes(mode))return'ending';
 const r=rooms[g.room];if(!r||g.room===0)return'quiet';if(r.arena&&(g.boss?.hp>0||mode==='bossDefeat'))return r.boss;
 return{newsroom:'newsroom',roofs:'roofs',studio:'studio',noise:'dimension'}[r.theme]||'newsroom';
}
