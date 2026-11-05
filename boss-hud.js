import {drawMonster} from './art.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
export const bossStyles={
 spreader:{name:'Распространитель',edge:'#dcb87b',fill:'#f0d7a7',dark:'#47384a',portrait:'#17273b',kind:'paper'},
 agitator:{name:'Агитатор',edge:'#e69258',fill:'#f06361',dark:'#4b2237',portrait:'#281f35',kind:'broadcast'},
 manipulator:{name:'Манипулятор',edge:'#ba9ee9',fill:'#bc7de5',dark:'#32244e',portrait:'#1b1935',kind:'film'},
 infoshum:{name:'Инфошум',edge:'#70dfe8',fill:'#ef5197',dark:'#31274e',portrait:'#09192f',kind:'static'}
};
const portraits=new WeakMap();
function portrait(assets,id){let map=portraits.get(assets);if(!map){map=new Map();portraits.set(assets,map);}if(!map.has(id)){const c=document.createElement('canvas');c.width=80;c.height=80;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;drawMonster(ctx,assets,id,2,2,76,76,0,false,{state:'patrol',projection:true});map.set(id,c);}return map.get(id);}
export function drawBossHud(c,a,g,width,{y=8}={}){
 const b=g.boss;if(b.room!==g.room||(!b.active||b.hp<=0)&&g.mode!=='bossDefeat'&&g.pausedFrom!=='bossDefeat')return;
 const style=bossStyles[b.id],w=Math.min(width<700?width-20:width-350,440),x=Math.round((width-w)/2),face=width<700?40:49,barX=x+face+9,barW=w-face-13;
 rect(c,x-2,y-3,w+4,58,'#02091be8');rect(c,x,y,face,face,style.edge);rect(c,x+2,y+2,face-4,face-4,style.portrait);c.drawImage(portrait(a,b.id),x+1,y+1,face-2,face-2);
 rect(c,barX-2,y+3,barW+4,16,style.edge);rect(c,barX,y+5,barW,12,style.dark);
 rect(c,barX+2,y+7,(barW-4)*Math.max(0,b.hp/b.maxHp),8,style.fill);rect(c,barX+2,y+7,(barW-4)*Math.max(0,b.hp/b.maxHp),2,'#ffe8c3');
 for(const fraction of[1/3,2/3])rect(c,barX+barW*fraction,y+5,2,12,'#020817');
 c.save();c.font=`${width<360?17:20}px UmaText, monospace`;c.fillStyle='#ffe4b1';c.textAlign='center';c.textBaseline='top';c.fillText(style.name,barX+barW/2,y+24,barW);c.restore();
 if(style.kind==='paper')for(let i=0;i<3;i++)rect(c,x+7+i*7,y+43,4,3,style.edge);
 if(style.kind==='broadcast')for(let i=0;i<6;i++)rect(c,barX+i*8,y+48,3,3+i%3,style.edge);
 if(style.kind==='film')for(let i=0;i<Math.floor(w/12);i++)rect(c,x+i*12,y+49,5,3,style.edge);
 if(style.kind==='static')for(let i=0;i<8;i++)rect(c,barX+i*barW/8,y+48+i%2,8,2,i%2?style.fill:style.edge);
 const sx=b.x+b.w/2-g.camera,world=g.viewWidth||768;if(sx<24||sx>world-24){const right=sx>world-24,px=right?x+w-10:x+7;for(let i=0;i<4;i++)rect(c,px+(right?i:-i),y+45+i,1,8-i*2,style.edge);}
}
