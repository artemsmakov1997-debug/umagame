import {phasePlans} from './boss-phases.js?v=0.17.0';
import {drawMonster} from './art.js?v=0.17.0';
import {rect} from './pixel.js?v=0.17.0';
export const bossStyles={
 spreader:{name:'Распространитель',edge:'#dcb87b',fill:'#f0d7a7',dark:'#47384a',portrait:'#17273b',kind:'paper'},
 agitator:{name:'Агитатор',edge:'#e69258',fill:'#f06361',dark:'#4b2237',portrait:'#281f35',kind:'broadcast'},
 manipulator:{name:'Манипулятор',edge:'#ba9ee9',fill:'#bc7de5',dark:'#32244e',portrait:'#1b1935',kind:'film'},
 infoshum:{name:'Инфошум',edge:'#70dfe8',fill:'#ef5197',dark:'#31274e',portrait:'#09192f',kind:'static'}
};
const portraits=new WeakMap();
function portrait(assets,id){let map=portraits.get(assets);if(!map){map=new Map();portraits.set(assets,map);}if(!map.has(id)){const c=document.createElement('canvas');c.width=80;c.height=80;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;drawMonster(ctx,assets,id,2,2,76,76,0,false,{state:'patrol',projection:true});map.set(id,c);}return map.get(id);}
export function drawBossHud(c,a,g,width){
 const b=g.boss;if(!b.active||b.hp<=0||b.room!==g.room)return;
 const style=bossStyles[b.id],w=Math.min(width-20,324),x=Math.round((width-w)/2),y=51,face=40,barX=x+face+9,barW=w-face-13;
 rect(c,x-2,y-3,w+4,77,'#02091be8');rect(c,x,y,face,face,style.edge);rect(c,x+2,y+2,face-4,face-4,style.portrait);c.drawImage(portrait(a,b.id),x+1,y+1,face-2,face-2);
 rect(c,barX-2,y+3,barW+4,16,style.edge);rect(c,barX,y+5,barW,12,style.dark);
 const cells=Math.min(24,b.maxHp),gap=1,cell=(barW-4-(cells-1)*gap)/cells;
 for(let i=0;i<cells;i++){const left=barX+2+i*(cell+gap),amount=Math.max(0,Math.min(1,b.hp/b.maxHp*cells-i));if(amount>0){rect(c,left,y+7,cell*amount,8,style.fill);rect(c,left,y+7,cell*amount,2,'#ffe8c3');}}
 c.save();c.font=`${width<360?17:20}px UmaText, monospace`;c.fillStyle='#ffe4b1';c.textAlign='center';c.textBaseline='top';c.fillText(style.name,barX+barW/2,y+24,barW);c.restore();
 if(style.kind==='paper')for(let i=0;i<3;i++)rect(c,x+7+i*7,y+43,4,3,style.edge);
 if(style.kind==='broadcast')for(let i=0;i<6;i++)rect(c,barX+i*8,y+48,3,3+i%3,style.edge);
 if(style.kind==='film')for(let i=0;i<Math.floor(w/12);i++)rect(c,x+i*12,y+49,5,3,style.edge);
 if(style.kind==='static')for(let i=0;i<8;i++)rect(c,barX+i*barW/8,y+48+i%2,8,2,i%2?style.fill:style.edge);
 c.save();c.font='14px UmaText,monospace';c.fillStyle=style.fill;c.textAlign='center';c.fillText(`${b.phase} / 3 · ${phasePlans[b.id][b.phase-1][0]}`,x+w/2,y+69,w-10);c.restore();
 const sx=b.x+b.w/2-g.camera;if(sx<24||sx>width-24){const right=sx>width-24,px=right?width-16:8;for(let i=0;i<5;i++)rect(c,px+(right?i:-i)*2,125+i*2,2,10-i*2,style.edge);}
}
