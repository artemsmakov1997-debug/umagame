const assert=require('node:assert/strict');
async function checkLibrary(page){
 const groups=await page.evaluate(async()=>{const {chapters}=await import('./level.js?v=0.17.0');const {monsters}=await import('./catalog.js?v=0.17.0');return chapters.map((c,i)=>({name:c.name,monsters:monsters.filter(m=>m.chapter===i).map(m=>m.name)}));});
 assert.equal(await page.locator('.monster-option').count(),16);let shape;
 for(const [index,group]of groups.entries()){
  await page.locator(`#library-chapters [data-chapter="${index}"]`).click();assert.equal(await page.locator('.monster-option:visible').count(),4);
  for(const name of group.monsters){await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.locator('#monster-title').textContent(),name);assert.equal(await page.locator('#monster-abilities>div').count(),2);
   const geometry=await page.evaluate(()=>{const card=document.querySelector('#monster-card'),base=card.getBoundingClientRect();return ['#monster-title','.portrait-stage','#monster-description','#monster-abilities','.tactic'].map(s=>{const r=card.querySelector(s).getBoundingClientRect();return {y:Math.round((r.y-base.y)*10),h:Math.round(r.height*10),w:Math.round(r.width*10)};});});
   if(shape)assert.deepEqual(geometry,shape,'uniform card: '+name);else shape=geometry;
   const overflow=await page.evaluate(()=>['#monster-title','#monster-description','#monster-abilities','.tactic'].filter(s=>{const e=document.querySelector(s);return e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2;}));assert.deepEqual(overflow,[],'visible complete card text: '+name);
  }
  const rows=await page.locator('.monster-option:visible').evaluateAll(es=>es.map(e=>Math.round(e.getBoundingClientRect().height)));assert.equal(new Set(rows).size,1);
 }
 await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#monster-title').textContent(),'Эхо');await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#monster-title').textContent(),'Вброс');
}
module.exports={checkLibrary};
