import {rooms} from './level.js?v=0.21.5';
// Loading screens between locations: a painted picture of the destination, the name on a gold plate,
// a glowing progress bar and Uma running along it. assets/loading-*.jpg are 1024×576 (16:9).
const PICTURES={1:'loadingNewsroom',2:'loadingSpreader',3:'loadingRoofs',4:'loadingAgitator',5:'loadingStudio',6:'loadingManipulator',7:'loadingDimension',8:'loadingInfoshum'};
export function loadingPicture(room){return PICTURES[room]||null;}
export function drawLoadingScreen(c,a,g,width){
 const e=g.loading;if(!e)return false;const key=loadingPicture(e.to),img=key&&a[key];if(!img?.naturalWidth&&!img?.width)return false;
 const dur=e.duration||1.1,progress=Math.max(0,Math.min(1,e.time/dur)),alpha=Math.max(0,Math.min(1,e.time/.2,(dur+.2-e.time)/.2));
 c.save();c.globalAlpha=alpha;c.fillStyle='#03091b';c.fillRect(0,0,width,480);
 // Cover the screen with the picture (a slow push-in while it loads).
 const k=Math.max(width/1024,480/576)*(1+.03*progress),iw=1024*k,ih=576*k,ox=(width-iw)/2,oy=(480-ih)/2;c.imageSmoothingEnabled=true;c.drawImage(img,ox,oy,iw,ih);c.imageSmoothingEnabled=false;
 // The plate sits where the pictures leave room for it (bottom centre); it always fits the screen.
 const pw=Math.min(width*.96,.69*iw),ph=pw*77/632,px=(width-pw)/2,py=Math.min(480-ph-4,oy+.906*ih-ph/2);
 if(a.loadingPlate)c.drawImage(a.loadingPlate,px,py,pw,ph);
 const size=Math.max(12,Math.min(28,ph*.36));c.font=`${Math.round(size)}px UmaText, monospace`;c.textAlign='center';c.textBaseline='middle';
 c.fillStyle='#1a0b1e';c.fillText(rooms[e.to]?.name||'',width/2+2,py+ph*.5+2);c.fillStyle='#ffe0a0';c.fillText(rooms[e.to]?.name||'',width/2,py+ph*.5);
 // The progress bar over the plate, with Uma running on its glowing edge.
 const bw=Math.min(width*.8,pw*.6),bh=bw*90/555,bx=(width-bw)/2,by=py-bh-6;
 if(a.loadingBar)c.drawImage(a.loadingBar,bx,by,bw,bh);
 const fx=bx+bw*.035,fy=by+bh*.27,fw=(bw*.93)*progress,fh=bh*.44;
 if(a.loadingFill&&fw>1){c.save();c.beginPath();c.rect(fx,fy,fw,fh);c.clip();c.drawImage(a.loadingFill,fx,fy,bw*.93,fh);c.restore();}
 if(a.loadingCat){const ch=Math.max(22,bh*1.15),cw=ch*190/100,f=Math.floor(e.time*12)%4;c.drawImage(a.loadingCat,f*190,0,190,100,Math.round(fx+fw-cw*.6),Math.round(by-ch+bh*.25),Math.round(cw),Math.round(ch));}
 c.restore();return true;
}
