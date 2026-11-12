// Original chiptune scores: every location and boss has its own theme, written as 8 bars of 8th notes.
// Notation (parsed below): a melody is note names (C5, F#4, Bb3) with «-» holding the previous note and «.» a rest;
// «|» only marks bars. chords: one chord name per bar. bass: 8 symbols per bar — R root, 5 fifth, 3 third,
// O octave, b flat seventh, «-» hold, «.» rest. Drum lanes: 8 symbols per bar, x hit (o open hat), repeated for
// every bar. Uma's own motif (a rising sixth that falls back a step, E–G–C–B) opens the menu, the quiet room and
// the ending, so the game has one tune players recognise.
const NOTE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export function noteNumber(name){const m=/^([A-G])([#b]?)(-?\d)$/.exec(name);if(!m)return null;return 12*(+m[3]+1)+NOTE[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);}
const QUAL={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],m7:[0,3,7,10],maj7:[0,4,7,11],dim:[0,3,6],sus4:[0,5,7],sus2:[0,2,7]};
export function chordNotes(name){const m=/^([A-G])([#b]?)(.*)$/.exec(name);const pc=(NOTE[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12)%12;let root=48+pc;if(root<52)root+=12;return (QUAL[m[3]]||QUAL['']).map(i=>root+i);}
// A melody line → per step: {note, hold} at note onsets, null elsewhere.
export function parseLine(text){
 const tokens=text.replace(/\|/g,' ').trim().split(/\s+/),out=tokens.map(()=>null);
 tokens.forEach((t,i)=>{const n=noteNumber(t);if(n===null)return;let hold=1;while(tokens[i+hold]==='-')hold++;out[i]={note:n,hold};});return out;
}
const lane=s=>s.replace(/\s+/g,'');
function score(def){
 const melody=parseLine(def.lead.line),counter=def.counter?parseLine(def.counter.line):null,bass=lane(def.bass.line);
 return {...def,steps:melody.length,melody,counterLine:counter,bassLine:bass.length>=64?bass:bass.repeat(Math.ceil(64/bass.length)).slice(0,64),
  chordNotes:def.chords.map(chordNotes),drums:Object.fromEntries(Object.entries(def.drums||{}).map(([k,v])=>[k,lane(v)]))};
}
export const musicScores={
 // Uma's theme: warm C major, the motif climbs and settles.
 menu:score({bpm:92,swing:0,chords:['C','G','Am','F','C','G','F','G'],
  lead:{wave:'triangle',gain:.036,echo:[3,.28],line:'E5 - - G5 C6 - B5 G5 | D5 - - G5 B5 - A5 G5 | C5 - - E5 A5 - G5 E5 | F5 - E5 D5 C5 - - . | E5 - - G5 C6 - D6 E6 | D6 - - B5 G5 - A5 B5 | C6 - A5 F5 G5 - E5 C5 | D5 - - - . . G4 .'},
  arp:{wave:'square',gain:.008,octave:1,pattern:[0,1,2,1,0,1,2,1]},pad:{wave:'triangle',gain:.012},
  bass:{wave:'triangle',gain:.06,line:'R . 5 . O . 5 .'},drums:{kick:'x . . . x . . .',hat:'. . x . . . x .'},hatFilter:7000,snareFilter:2600}),
 // Home: a music box — the same motif, slow and high, no drums.
 quiet:score({bpm:72,swing:0,chords:['F','C','Dm','Bb','F','C','Bb','C'],
  lead:{wave:'sine',gain:.034,octave:0,echo:[2,.35],line:'A5 - - C6 F6 - - . | E6 - D6 C6 G5 - - . | F5 - - A5 D6 - C6 A5 | Bb5 - A5 G5 F5 - - . | A5 - - C6 F6 - G6 A6 | G6 - - E6 C6 - D6 E6 | F6 - D6 Bb5 C6 - A5 F5 | G5 - - - . . . .'},
  arp:{wave:'sine',gain:.012,octave:1,pattern:[0,2,1,2,0,2,1,2]},pad:{wave:'sine',gain:.01,attack:.4},
  bass:{wave:'sine',gain:.05,line:'R - - - 5 - - -'},drums:{}}),
 // Редакция: E minor, a telegraph motif of repeated notes over a typewriter clatter and a clanking press.
 newsroom:score({bpm:108,swing:0,chords:['Em','Em','C','D','Em','Em','Am','B'],
  lead:{wave:'square',gain:.028,line:'E5 E5 . E5 G5 . F#5 E5 | B4 . . D5 E5 - . . | G5 G5 . G5 A5 . G5 E5 | F#5 - D5 - A4 - . . | E5 E5 . E5 B5 . A5 G5 | F#5 . E5 . D5 - E5 . | C6 - B5 A5 E5 - A5 C6 | B5 - - - D#5 - F#5 .'},
  pad:{wave:'triangle',gain:.009},bass:{wave:'triangle',gain:.07,line:'R R . R O . R 5'},
  drums:{kick:'x . . x x . . .',snare:'. . x . . . x .',hat:'x x x x x x x x'},hatFilter:8200,hatGain:.008,snareFilter:2300,snareLen:.06}),
 // Крыши: night city in B minor, a swung square lead with an echo, walking bass, brushes and wind.
 roofs:score({bpm:112,swing:.22,wind:true,chords:['Bm','G','D','A','Bm','G','Em','F#'],
  lead:{wave:'square',gain:.024,detune:7,echo:[3,.33],line:'F#5 - B5 - A5 F#5 - D5 | E5 - G5 B5 - A5 G5 . | F#5 - A5 D6 - C#6 A5 . | E5 - - C#5 - E5 A5 - | B5 - D6 - C#6 B5 - F#5 | G5 - B5 D6 - E6 D6 B5 | G5 - E5 - B4 - E5 G5 | A#5 - - C#6 - - F#5 .'},
  pad:{wave:'triangle',gain:.01},bass:{wave:'triangle',gain:.062,line:'R . 3 . 5 . O 5'},
  drums:{kick:'x . . . x . . .',snare:'. . x . . . x .',hat:'x x x x x x x x'},hatFilter:5200,hatGain:.007,snareFilter:3000,snareLen:.09}),
 // Студия: a TV-show disco in C minor — four on the floor, funky octave bass, shutter claps.
 studio:score({bpm:120,swing:0,chords:['Cm','F','Cm','Bb','Ab','Bb','Cm','G'],
  lead:{wave:'square',gain:.026,line:'G5 . G5 Bb5 . C6 . G5 | A5 - F5 . C5 . F5 A5 | G5 . G5 Bb5 . D6 C6 Bb5 | D6 - - Bb5 F5 - . . | C6 . Eb6 . C6 Ab5 . Eb5 | D6 . F6 . D6 Bb5 . F5 | Eb6 - D6 C6 Bb5 - G5 Bb5 | B5 - - D6 G6 - . .'},
  arp:{wave:'triangle',gain:.009,octave:1,pattern:[0,null,2,null,1,null,2,null]},pad:{wave:'triangle',gain:.008},
  bass:{wave:'square',gain:.04,line:'R O . R O . R O'},drums:{kick:'x . x . x . x .',snare:'. . x . . . x .',hat:'. o . o . o . o'},hatFilter:6500,snareFilter:1700,snareLen:.08}),
 // Измерение: C# minor, a wobbling saw over a drone, glass blips and slow swells.
 dimension:score({bpm:88,swing:0,wobble:true,chords:['C#m','A','D','C#m','C#m','A','F#m','G#'],
  lead:{wave:'sawtooth',gain:.017,attack:.06,line:'C#5 - - - G#5 - - . | A5 - - E5 C#5 - - . | D5 - F#5 - A5 - G5 - | G#5 - - - . . C#6 . | C#6 - B5 - G#5 - - E5 | A5 - - - E5 . C#5 . | F#5 - A5 - C#6 - D6 - | C6 - - - G#5 - - .'},
  arp:{wave:'sine',gain:.011,octave:2,pattern:[0,null,2,null,null,1,null,3]},pad:{wave:'triangle',gain:.012,attack:.6},
  bass:{wave:'sine',gain:.06,line:'R - - - - - - -'},drums:{kick:'x . . . . . x .',hat:'. . . x . . . .'},hatFilter:9500,hatGain:.01}),
 // Распространитель: A minor running 8ths, pages flying.
 spreader:score({bpm:150,swing:0,chords:['Am','G','F','E','Am','G','F','E'],
  lead:{wave:'triangle',gain:.04,line:'A5 C6 E6 C6 A5 C6 E6 A6 | G6 D6 B5 D6 G5 B5 D6 G6 | F6 C6 A5 C6 F5 A5 C6 F6 | E6 B5 G#5 B5 E5 G#5 B5 . | A5 - E6 - D6 C6 B5 A5 | B5 - G5 - A5 B5 C6 D6 | C6 - A5 - B5 C6 D6 E6 | E6 - - - G#5 - B5 .'},
  pad:{wave:'triangle',gain:.011},bass:{wave:'triangle',gain:.08,line:'R . R O R . 5 O'},
  drums:{kick:'x . x . x . x .',snare:'. . x . . . x x',hat:'. x . x . x . x'},hatFilter:6000,snareFilter:2400}),
 // Агитатор: a D minor march — snare rolls and a megaphone square.
 agitator:score({bpm:126,swing:0,chords:['Dm','Dm','Bb','A','Dm','Gm','A','Dm'],
  lead:{wave:'square',gain:.03,line:'D5 - D5 F5 A5 - A5 . | G5 - F5 E5 D5 - . . | F5 - F5 A5 D6 - C6 Bb5 | A5 - - E5 C#5 - A4 . | D6 - C6 A5 F5 - A5 D6 | Bb5 - A5 G5 D5 - G5 Bb5 | C#6 - E6 - A5 - G5 E5 | D5 - - - . A4 D5 .'},
  pad:{wave:'triangle',gain:.011},bass:{wave:'triangle',gain:.08,line:'R . 5 . R . 5 .'},
  drums:{kick:'x . . . x . . .',snare:'x . x x x . x .',hat:'. . . . . . . .'},snareFilter:2100,snareLen:.05}),
 // Манипулятор: an F minor film-noir tango — habanera bass, a sly chromatic line.
 manipulator:score({bpm:116,swing:0,chords:['Fm','Fm','Db','C','Fm','Bbm','Db','C'],
  lead:{wave:'triangle',gain:.04,detune:9,line:'C5 - - Db5 C5 - Ab4 - | F4 - - . . G4 Ab4 Bb4 | Ab4 - - Bb4 Ab4 - F4 - | E4 - - - G4 - Bb4 . | F5 - Eb5 Db5 C5 - Ab4 C5 | Db5 - C5 Bb4 F4 - Bb4 Db5 | F5 - Eb5 Db5 C5 - Bb4 Ab4 | G4 - - - E4 - C4 .'},
  counter:{wave:'square',gain:.008,line:'. . . . F5 . . . | . . . . Ab5 . . . | . . . . F5 . . . | . . . . G5 . . . | . . . . Ab5 . . . | . . . . F5 . . . | . . . . Ab5 . . . | . . . . G5 . E5 .'},
  pad:{wave:'triangle',gain:.01},bass:{wave:'triangle',gain:.08,line:'R . . R 5 . R .'},
  drums:{kick:'x . . x . . x .',snare:'. . x . . . . .',hat:'. x . . . x . .'},snareFilter:5200,snareLen:.03,hatFilter:7500}),
 // Инфошум: the epic. A minor at 160 — a doubled, detuned saw over a choir pad, driving bass, big drums and fills;
 // the colossus thickens the drums and the freed form lifts the whole song a tone and adds a racing arpeggio.
 infoshum:score({bpm:160,swing:0,epic:true,chords:['Am','F','C','G','Am','F','G','E'],
  lead:{wave:'sawtooth',gain:.026,detune:12,octave:-12,line:'A4 - E5 - A5 - G5 E5 | F5 - - E5 C5 - A4 C5 | E5 - G5 - C6 - B5 G5 | D5 - - - G5 - B5 D6 | E6 - - D6 C6 - B5 A5 | C6 - - A5 F5 - G5 A5 | B5 - D6 - G6 - - . | G#5 - B5 - E6 - - -'},
  arp:{wave:'square',gain:.009,octave:1,pattern:[0,1,2,1,0,1,2,3],from:2},pad:{wave:'triangle',gain:.016,detune:8},
  bass:{wave:'sawtooth',gain:.05,line:'R R O R R R O R'},
  drums:{kick:'x . x . x . x .',snare:'. . x . . . x .',hat:'x x x x x x x x',tom:'. . . . . . . .'},fill:'. . . . x x x x',hatFilter:7800,hatGain:.009,snareFilter:2000,snareLen:.08}),
 // The ending: Uma's theme again, slow and tender.
 ending:score({bpm:76,swing:0,chords:['C','G','Am','F','C','G','F','C'],
  lead:{wave:'triangle',gain:.036,echo:[4,.3],line:'E5 - - G5 C6 - - B5 | D5 - - G5 B5 - - . | C5 - - E5 A5 - G5 E5 | F5 - - E5 D5 - C5 . | E5 - - G5 C6 - D6 E6 | D6 - - B5 G5 - A5 B5 | C6 - A5 F5 G5 - - E5 | C5 - - - - - - .'},
  arp:{wave:'sine',gain:.01,octave:1,pattern:[0,1,2,1,0,1,2,1]},pad:{wave:'sine',gain:.013,attack:.5},
  bass:{wave:'sine',gain:.055,line:'R - - - 5 - - -'},drums:{}})
};
export function sceneMusic(view,g,rooms){
 if(view!=='game')return'menu';const mode=g.mode==='paused'?g.pausedFrom:g.mode;if(['ending','interlude','conclusion','won'].includes(mode))return'ending';
 const r=rooms[g.room];if(!r||g.room===0)return'quiet';if(r.arena&&(g.boss?.hp>0||mode==='bossDefeat'))return r.boss;
 return{newsroom:'newsroom',roofs:'roofs',studio:'studio',noise:'dimension'}[r.theme]||'newsroom';
}
// How hard the final fight plays: 0 the tower, 1 the colossus, 2 the freed form.
export function musicIntensity(theme,g){if(theme!=='infoshum')return 0;return {assemble:1,colossus:1,breakout:2,free:2}[g?.boss?.network?.stage]||0;}
