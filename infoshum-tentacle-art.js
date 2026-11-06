const ribbonSections=[[[175,103],[173,105],[173,103],[172,102],[173,96],[175,92],[177,92],[183,87],[187,85],[190,82],[193,79],[196,73],[198,69],[200,65],[201,61],[200,60],[200,59],[200,58],[200,58],[201,58],[204,53],[206,51],[207,48],[208,46],[209,45],[210,42],[212,38],[212,36],[212,33],[210,33],[210,29],[213,24],[215,20]],[[175,103],[174,104],[174,102],[173,100],[175,95],[178,93],[184,91],[189,87],[194,85],[200,79],[203,75],[204,73],[205,71],[204,69],[200,71],[196,70],[193,69],[191,67],[190,64],[190,61],[192,56],[194,52],[197,51],[202,49],[206,46],[209,44],[212,41],[215,36],[215,34],[213,32],[211,30],[210,25],[214,19]],[[175,103],[173,105],[174,102],[173,101],[175,95],[179,92],[184,90],[189,87],[195,85],[199,83],[203,77],[203,74],[202,73],[198,73],[193,73],[189,71],[184,69],[181,68],[181,62],[182,58],[184,53],[187,52],[191,50],[196,48],[202,44],[207,40],[210,39],[212,37],[215,32],[214,30],[211,29],[210,25],[213,20]],[[174,105],[172,107],[171,105],[169,104],[170,99],[172,95],[175,95],[181,92],[184,91],[190,87],[194,84],[198,78],[201,74],[203,70],[205,66],[204,64],[202,62],[200,60],[197,59],[195,56],[195,51],[197,47],[199,44],[201,42],[203,41],[207,38],[209,37],[212,34],[213,32],[214,29],[212,28],[213,24],[217,18]]];
// Paint a continuous textured ribbon along the real strike curve. Adjacent slices
// overlap; these are samples of the illustrated limb, not a particle trail.
export function drawInfoshumTentacle(c,a,b,n,time){
 if(!n.target||!['slam','weak'].includes(n.mode)||!a.infoshumTentacle?.naturalWidth)return;
 const image=a.infoshumTentacle,cw=image.width/4,ch=image.height/2,frame=Math.floor(time*7)%4;
 const start={x:b.x+b.w/2,y:b.y+b.h*.5},corePoint={x:n.target.x,y:n.target.y-26};
 const tip=n.mode==='weak'?3:2,core=tip===3?{x:255,y:230}:{x:340,y:260},scale=.23,side=corePoint.x>=start.x?1:-1;
 const end={x:corePoint.x-side*(core.x-12)*scale,y:corePoint.y+(200-core.y)*scale};
 const strength=n.mode==='weak'?1:Math.min(1,Math.max(0,1-n.timer/.34));
 end.x=start.x+(end.x-start.x)*strength;end.y=start.y+(end.y-start.y)*strength;
 const control={x:(start.x+end.x)/2+30,y:Math.min(start.y,end.y)-45};
 const count=Math.min(190,Math.max(12,Math.ceil(Math.hypot(end.x-start.x,end.y-start.y)/4)));
 const at=t=>({x:(1-t)*(1-t)*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)*(1-t)*start.y+2*(1-t)*t*control.y+t*t*end.y});
 for(let i=0;i<count;i++){
  const t=i/count,p=at(t),q=at((i+1)/count),length=Math.hypot(q.x-p.x,q.y-p.y),thickness=30-15*t;
  c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));
  const band=ribbonSections[frame][Math.min(32,Math.floor(t*32))];c.drawImage(image,frame*cw+14+t*400,band[0],Math.max(2,400/count),band[1],-.7,-thickness/2,length+1.4,thickness);c.restore();
 }

 c.save();if(n.mode==='weak'){c.shadowColor='#ff74dc';c.shadowBlur=5;}
 c.translate(end.x+side*(core.x-12)*scale,end.y-(200-core.y)*scale);if(side<0)c.scale(-1,1);c.drawImage(image,tip*cw,ch,cw,ch,-core.x*scale,-core.y*scale,cw*scale,ch*scale);c.restore();
}
