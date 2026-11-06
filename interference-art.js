import {rect} from './pixel.js?v=0.21.5';
// «Помехи»: the interference meter of Infoshum's final phase (the freed form).
export function drawInterferenceOverlay(c,g,width){
 const n=g.boss.network;if(g.room!==8||!n||n.stage!=='free'||g.boss.hp<=0)return;
 const fill=n.noise||0;
 c.save();c.globalAlpha=Math.min(.72,.08+fill*.6);
 const lines=Math.floor(fill*110);
 for(let i=0;i<lines;i++){const x=(i*109+Math.floor(g.time*24)*17)%width,y=25+(i*47+Math.floor(g.time*8)*3)%440,w=20+(i*73)%Math.max(40,width*.35);rect(c,x,y,w,i%4?2:4,i%3?'#b746f1':'#2acde9');}
 c.restore();
 if(fill>=.99){rect(c,0,0,width,480,'#101337');for(let y=0;y<480;y+=4){const x=(y*31+Math.floor(g.time*40)*13)%width;rect(c,0,y,width,2,'#294267');rect(c,x,y,Math.min(width-x,80+(y*47)%300),3,y%12?'#be3da7':'#4acbd5');}}
 const w=Math.min(190,width-90);rect(c,10,10,w,31,'#030c21ed');c.font='14px UmaText,monospace';c.fillStyle='#8bedff';c.textAlign='left';c.fillText('ПОМЕХИ '+Math.floor(fill*100)+'%',17,23);
 rect(c,17,29,w-14,5,'#233455');rect(c,17,29,(w-14)*fill,5,fill>.75?'#fa73ce':'#66e9ee');
}
