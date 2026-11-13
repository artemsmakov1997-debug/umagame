export const closingParagraphs=[
 'ЭТА ИГРА — ПРЕДОСТЕРЕЖЕНИЕ',
 'В реальном мире нет кошки Умы, которая сможет победить все манипуляции, искажения и преувеличения.',
 'Здесь всё зависит от нас. Даже добросовестные журналисты, такие как Юрий Шмаков, не смогут противостоять информационному шуму в одиночку.',
 'Каждый читатель должен уметь распознавать манипуляции и понимать, когда и как СМИ пытаются ввести его в заблуждение.',
 'И я вам в этом помогу.'
];
export const closingText=closingParagraphs.join('\n\n');
export function beginConclusion(g){if(g.conclusion||g.mode!=='ending')return false;g.conclusion={stage:'fade',elapsed:0,revealed:0,budget:0};g.mode='conclusion';g.emit('conclusionBegin');return true;}
export function stepConclusion(g,dt){
 const s=g.conclusion;if(!s||g.mode!=='conclusion')return;s.elapsed+=dt;
 if(s.stage==='fade'&&s.elapsed>=.7){s.stage='typing';s.elapsed=0;}
 if(s.stage!=='typing')return;s.budget+=dt;
 while(s.revealed<closingText.length){const previous=closingText[s.revealed-1],next=closingText[s.revealed],delay=previous==='\n'?(next==='\n'?.18:.65):/[.!?]/.test(previous||'')?.22:1/30;if(s.budget<delay)break;s.budget-=delay;s.revealed++;}
 if(s.revealed===closingText.length){s.stage='read';s.elapsed=0;g.emit('conclusionTyped');}
}
export function advanceConclusion(g,skip=false){
 if(g.mode!=='conclusion'||!g.conclusion)return false;const s=g.conclusion;
 if(skip||s.stage==='brand'){g.mode='won';g.emit('won');return true;}
 if(s.stage==='fade'||s.stage==='typing'){s.stage='read';s.revealed=closingText.length;s.elapsed=0;return true;}
 s.stage='brand';s.elapsed=0;g.emit('brandReveal');return true;
}
