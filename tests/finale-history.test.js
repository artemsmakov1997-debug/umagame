import test from 'node:test';import assert from 'node:assert/strict';
import {endingSlides} from '../finale.js';import {finaleFrame} from '../ending-ui.js';
test('the rescue is followed by the ten requested scenes, without HUD or time codes',()=>{
 assert.equal(endingSlides.length,11);assert.deepEqual(endingSlides.slice(1,9).map(s=>s.art),Array.from({length:8},(_,i)=>'finaleHistory:'+i));
 assert.match(endingSlides[1].text,/исчезают/);assert.match(endingSlides[2].text,/откуда они вообще взялись/);assert.match(endingSlides[3].text,/зародыш Инфошума.*ждал/);
 assert.match(endingSlides[4].text,/перестанут спрашивать/);assert.match(endingSlides[5].text,/пересылать.*не разобравшись/);assert.match(endingSlides[6].text,/страх и ярость/);assert.match(endingSlides[7].text,/честный журналист/);assert.match(endingSlides[8].text,/Ума его победила.*не значит, что он исчез навсегда/);
 for(const s of endingSlides){assert.equal(s.hud,undefined);assert.equal(s.labels,undefined);assert.match(s.title,/^[А-ЯЁ ]+$/);assert.ok(!/\d\d:\d\d/.test(s.text));}
});
test('the original rescue, return and embrace are unchanged and precede the existing conclusion',()=>{assert.deepEqual([endingSlides[0],endingSlides[9],endingSlides[10]],[
 {title:'УМА ПОБЕДИЛА',art:'extra:1',text:'Инфошум распадается. Из осколков экрана выбирается Юрий Шмаков — бледный, но живой. Ума бросается к нему.'},
 {title:'ВОЗВРАЩЕНИЕ ДОМОЙ',art:'ending:2',text:'Помехи стихают. Юрий садится за свой стол и впервые за долгое время слышит тишину. Ума узнаёт его голос без треска.'},
 {title:'ТЕПЕРЬ МЫ ВМЕСТЕ',art:'ending:3',text:'Юрий обнимает Уму. «Одному было не справиться, — шепчет он. — Хорошо, что я был не один». Ума тихо мурлычет.'}
]);});
test('all eleven images use complete 3:2 cells within their source sheets',()=>{const a={finaleHistory:{width:3072,height:1024},ending:{width:1536,height:1024},storyExtra:{width:1536,height:512}};for(let i=0;i<endingSlides.length;i++){const{a:image,box:[x,y,w,h]}=finaleFrame(a,i);assert.equal(w/h,1.5);assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height);}});
