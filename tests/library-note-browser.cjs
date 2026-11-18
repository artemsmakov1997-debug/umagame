const{chromium}=require('playwright'),assert=require('node:assert/strict');
const{open,shot}=require('./browser-helpers.cjs'),{checkLibrary}=require('./library-helpers.cjs');
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_PATH,args:['--no-sandbox']}),errors=[];
 for(const[width,height]of[[1920,1080],[1366,768],[390,844],[320,568],[844,390]]){
  const p=await b.newPage({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});p.on('pageerror',e=>errors.push(e.message));await open(p,{story:false});
  const decoded=await p.evaluate(()=>(()=>{const images=Object.values(testUI.assets).filter(img=>/library-tactics/.test(img.src));return images.length===2&&images.every(img=>img.complete&&img.naturalWidth>0);})());assert.ok(decoded);
  await p.context().setOffline(true);await p.click('[data-menu=library]');assert.equal(await p.locator('#library-screen .section-heading h2').count(),0);assert.equal(await p.locator('.library-arrow:visible').count(),width>=1000?0:2);await checkLibrary(p);
  const cards=await p.evaluate(async()=>{const{monsters}=await import('./catalog.js?v=0.21.5'),out=[];
   for(let i=0;i<monsters.length;i++){testUI.selectMonster(i);const note=document.querySelector('.tactic'),r=note.getBoundingClientRect(),s=getComputedStyle(note),title=note.querySelector('strong').getBoundingClientRect(),text=note.querySelector('p').getBoundingClientRect();out.push({name:monsters[i].name,bg:s.backgroundImage,fits:title.top>=r.top+parseFloat(s.paddingTop)-1&&text.bottom<=r.bottom-parseFloat(s.paddingBottom)+1&&text.right<=r.right-parseFloat(s.paddingRight)+1,overflow:note.scrollHeight>note.clientHeight+1||note.scrollWidth>note.clientWidth+1});}
   testUI.selectMonster(0);return out;
  });for(const c of cards){assert.ok(c.fits&&!c.overflow,width+' '+JSON.stringify(c));assert.match(c.bg,width<=700?/library-tactics-wide/:/library-tactics\.webp/);}
  const menu=p.locator('#library-screen [data-back]');assert.ok(await menu.isVisible());await shot(p,'library-note-'+width);await menu.click();assert.equal(await p.evaluate(()=>testUI.view),'menu');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();console.log('PASS library note '+width+'x'+height+': 16 cards, instant offline art, title/desktop arrows removed, navigation and back.');
 }await b.close();assert.deepEqual(errors,[]);
})().catch(e=>{console.error(e);process.exit(1);});
