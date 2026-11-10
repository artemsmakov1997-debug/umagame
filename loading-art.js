import {INFOSHUM_ATLAS as AT} from './infoshum-atlas.js?v=0.21.5';
// Between locations: a tiny Infoshum drags the loading bar across a dark screen. He peeks out of a little TV,
// hauls the glowing lamp, gets tangled in his own cable halfway and waves at the end.
// assets/loading-shum.png (infoshum-atlas.js «load»): four hauling frames, tangled, two TV frames, a wave, the bar and its fill.
export function drawLoadingScreen(c,a,g,width){
 const e=g.loading,img=a.loadingShum;if(!e||!img)return false;
 const dur=e.duration||1.1,k=Math.max(0,Math.min(1,e.time/dur)),alpha=Math.max(0,Math.min(1,e.time/.15,(dur+.15-e.time)/.15)),L=AT.load;
 const put=(p,x,y,w,flip=false)=>{const h=w*p.r[3]/p.r[2];c.save();if(flip){c.translate(Math.round(x+w),Math.round(y));c.scale(-1,1);c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],0,0,Math.round(w),Math.round(h));}else c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));c.restore();};
 c.save();c.globalAlpha=alpha;c.fillStyle='#050816';c.fillRect(0,0,width,480);
 const bw=Math.min(430,width-50),bx=width/2-bw/2,by=264,bh=bw*L.bar.r[3]/L.bar.r[2],fw=bw*.92,fh=fw*L.fill.r[3]/L.fill.r[2];
 c.save();c.beginPath();c.rect(bx+bw*.07,by+bh*.2,bw*.86*k,bh*.6);c.clip();put(L.fill,bx+bw*.04,by+bh/2-fh/2,fw);c.restore();
 put(L.bar,bx,by,bw);
 // He walks to the right (the sheet faces left); the lamp he drags trails behind him.
 const head=bx+bw*.07+bw*.86*k,tv=k<.1;let name='w'+Math.floor(e.time*9)%4,w=156;
 if(tv){name='tv'+Math.floor(e.time*6)%2;w=92;}else if(k>.46&&k<.6)name='tangled';else if(k>.92){name='wave';w=164;}
 const p=L[name],h=w*p.r[3]/p.r[2];put(p,tv?bx-w*.4:head-w*.78,by+8-h,w,!tv);
 c.restore();return true;
}
