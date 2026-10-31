// Art: pixel-sprite builder (Spr), palettes, every character/item sprite.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
class Spr{
 constructor(w,h){this.w=w;this.h=h;this.d=new Uint32Array(w*h)}
 p(x,y,c){x|=0;y|=0;if(x>=0&&y>=0&&x<this.w&&y<this.h)this.d[y*this.w+x]=c}
 g(x,y){x|=0;y|=0;return(x>=0&&y>=0&&x<this.w&&y<this.h)?this.d[y*this.w+x]:0}
 pick(R,l,x,y){l+=BAYER[(y&3)*4+(x&3)]*0.3;const n=R.length;if(n>3&&l>0.72)return R[3];if(l>0.22)return R[2];if(l>-0.32)return R[1];return R[0]}
 ell(cx,cy,rx,ry,R,amb=0){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const nx=(x+.5-cx)/rx,ny=(y+.5-cy)/ry,dd=nx*nx+ny*ny;if(dd>1)continue;const l=-(nx*0.65+ny*0.8)*0.9+(1-dd)*0.25-0.05+amb;this.p(x,y,this.pick(R,l,x,y))}}
 cap(x0,y0,x1,y1,r,R,amb=0){const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1e-6,L=Math.sqrt(L2);let nx=-dy/L,ny=dx/L;if(nx*-0.65+ny*-0.8<0){nx=-nx;ny=-ny}
  const xa=Math.floor(Math.min(x0,x1)-r-1),xb=Math.ceil(Math.max(x0,x1)+r+1),ya=Math.floor(Math.min(y0,y1)-r-1),yb=Math.ceil(Math.max(y0,y1)+r+1);
  for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){const px=x+.5-x0,py=y+.5-y0;let t=(px*dx+py*dy)/L2;t=t<0?0:t>1?1:t;const ex=px-dx*t,ey=py-dy*t,d=Math.sqrt(ex*ex+ey*ey);if(d>r)continue;const s=(ex*nx+ey*ny)/r;this.p(x,y,this.pick(R,s*0.85+amb,x,y))}}
 rect(x0,y0,w,h,R,amb=0){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){let l=0;if(y===y0||x===x0)l=0.5;if(y===y0+h-1||x===x0+w-1)l=-0.6;this.p(x,y,this.pick(R,l+amb,x,y))}}
 poly(pts,R,amb=0){let ya=1e9,yb=-1e9;for(const p of pts){ya=Math.min(ya,p[1]);yb=Math.max(yb,p[1])}const H=yb-ya||1;
  for(let y=Math.floor(ya);y<=Math.ceil(yb);y++){const xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const yy=y+.5;if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))xs.push(a[0]+(yy-a[1])/(b[1]-a[1])*(b[0]-a[0]))}xs.sort((a,b)=>a-b);
   for(let k=0;k+1<xs.length;k+=2){const x0=Math.round(xs[k]),x1=Math.round(xs[k+1]);for(let x=x0;x<x1;x++){const l=0.55-1.3*(y-ya)/H+(x===x0?0.3:0)+(x===x1-1?-0.3:0)+amb;this.p(x,y,this.pick(R,l,x,y))}}}}
 line(x0,y0,x1,y1,c){x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(;;){this.p(x0,y0,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
 outline(c=OUT){const o=new Uint32Array(this.d);for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){const i=y*this.w+x;if(this.d[i])continue;if(this.g(x-1,y)||this.g(x+1,y)||this.g(x,y-1)||this.g(x,y+1))o[i]=c}this.d=o;return this}
 cv(){const c=mk(this.w,this.h),x=c.getContext('2d'),id=x.createImageData(this.w,this.h);new Uint32Array(id.data.buffer).set(this.d);x.putImageData(id,0,0);return c}
}
const P={
 skin:R('#5e3214','#8a5222','#A0612C','#c98648'),skinD:R('#3e200c','#5e3214','#7a4620','#8a5222'),
 hair:R('#05040a','#16121e','#2a2638','#3e3a52'),saf:R('#7a3606','#c25e0a','#ee8a1c','#ffc061'),
 wht:R('#6d6a80','#bdb8c8','#efeae0','#ffffff'),gold:R('#6b4a06','#b88a10','#f2c632','#fff2a0'),wood:R('#2e180a','#5a3818','#8a5e32','#b08458'),
 steel:R('#3a4458','#8a9ab4','#d4def0','#ffffff'),blade2:R('#8a5200','#e0a020','#ffe070','#ffffff'),
 dog:R('#50545f','#9094a2','#cdd0d8','#f6f7f9'),dogD:R('#3a3e48','#6a6e7a','#9a9eaa','#b8bcc6'),red:R('#5a0a10','#a01822','#e03a3a','#ff8a7a'),
 boar:R('#1e1720','#3c2e40','#5e4a66','#86708e'),boarD:R('#140e16','#2a2030','#3e3046','#544460'),snout:R('#4a2a34','#7a4a56','#a87080','#d0a0a8'),tusk:R('#8a8270','#d8d0b8','#f4f0e4','#ffffff'),
 crow:R('#0c0e1c','#1e2644','#34447a','#5c74b8'),beak:R('#6b4a06','#c89010','#f2c632'),
 snake:R('#14280c','#2f5a16','#62962a','#b4d850'),hood:R('#3a2a06','#8a6a12','#d0aa30','#f4dc70'),
 vaka:R('#0e1816','#1f3a32','#356250','#5f9472'),vakaD:R('#0a1210','#152a24','#244636','#3a6450'),vbelly:R('#2e3c22','#58743e','#8aa862','#b6cc88'),
 bone:R('#5e5646','#ada384','#e6dec2','#ffffff'),cloth:R('#240610','#521222','#86223a','#b44a5e'),rock:R('#24202c','#46404f','#6e6882','#9c96b0'),
 mango:R('#6a2a00','#d06a10','#f6b030','#fff0a0'),leaf:R('#10300c','#246a1c','#4aa232','#8ad44a'),lotus:R('#6a1a4a','#c04a8a','#f08ac0','#ffe0f0')
};
const SC=new Map();function spr(k,fn){let c=SC.get(k);if(!c){c=fn();SC.set(k,c)}return c}
const WF=new WeakMap();function whiteOf(c){let w=WF.get(c);if(!w){w=mk(c.width,c.height);const x=w.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,w.width,w.height);WF.set(c,w)}return w}
function cobraSprite(fr){const s=new Spr(22,26);const up=fr==='s';
 s.ell(9,22,8,3,P.snake);s.cap(12,21,12,up?6:9,2.4,P.snake,0.1);s.ell(12,up?7:10,5,5.5,P.hood);s.ell(12,up?7:10,2.6,4,P.snake,0.2);
 s.ell(15,up?4:7,3.4,2.6,P.snake,0.2);s.p(16,up?3:6,C('#ff3a2a'));if(up){s.p(19,5,P.red[2]);s.p(20,6,P.red[2])}return s.outline().cv()}
function makeArrow(){const s=new Spr(16,5);s.line(0,2,12,2,P.wood[2]);s.line(1,1,3,1,P.wht[2]);s.line(1,3,3,3,P.wht[2]);s.poly([[12,0],[16,2.5],[12,5]],P.steel);return s.outline().cv()}
function makeRock(){const s=new Spr(14,14);s.ell(7,7,6,5.5,P.rock,0.1);s.p(5,5,P.rock[3]);return s.outline().cv()}
function makeOrb(i){const s=new Spr(16,16);s.ell(8,8,6.5,6.5,P.gold,0.15+Math.sin(i)*0.1);s.ell(8,8,3,3,R('#ffe0a0','#ffffff','#ffffff'),0.4);return s.outline(C('#5a2a00')).cv()}
function makeHeartPk(){const s=new Spr(14,13);s.ell(4.5,4.5,3.8,3.8,P.red,0.2);s.ell(9.5,4.5,3.8,3.8,P.red,0.2);s.poly([[1,5],[13,5],[7,12]],P.red,0.1);return s.outline().cv()}
function makeMango(){const s=new Spr(12,14);s.ell(6,8,4.6,5.5,P.mango,0.1);s.cap(6,3,8,0,0.8,P.wood);s.ell(9,2,2.6,1.4,P.leaf);return s.outline().cv()}
function makeQuiverPk(){const s=new Spr(14,16);s.rect(3,4,8,11,P.wood);s.rect(3,4,8,2,P.gold);for(let i=0;i<3;i++){s.line(4+i*3,0,4+i*3,4,P.wood[3]);s.p(4+i*3,0,P.wht[2])}return s.outline().cv()}
function makeHeartUI(full){const s=new Spr(9,8);const r=full?P.red:R('#2a2030','#3e3046','#544460');s.ell(2.5,2.5,2.2,2.2,r,0.3);s.ell(6.5,2.5,2.2,2.2,r,0.3);s.poly([[0,3],[9,3],[4.5,8]],r,0.1);return s.outline().cv()}
const IMG={};
function initImgs(){IMG.arrow=makeArrow();IMG.rock=makeRock();IMG.orb=[0,1,2,3].map(makeOrb);IMG.heart=makeHeartPk();IMG.mango=makeMango();IMG.quiver=makeQuiverPk();IMG.spear=makeSpear();IMG.venom=makeVenom();IMG.hF=makeHeartUI(true);IMG.hE=makeHeartUI(false)}
function foeImg(e){if(e.t==='imp'){const fr=!e.ground?'j':String((tt*6|0)%2);return spr('imp'+fr,()=>impSprite(fr))}
 if(e.t==='vetala'){const fr=e.st==='hang'?'h':String((tt*4|0)%2);return spr('vet'+fr,()=>vetalaSprite(fr))}
 if(e.t==='guard'){const fr=e.st==='tell'?'tell':e.st==='throw'?'throw':'idle';return spr('guard'+fr,()=>guardSprite(fr))}
 const fr=e.st==='spit'?'s':String((tt*3|0)%2);return spr('yak'+fr,()=>yakshaSprite(fr))}
function getHero(fr,deva){if(G&&G.p&&G.p.spin>0&&state!=='title')return BLANK;
 return spr('H'+fr+(deva?'d':''),()=>{const body=heroSprite0(fr,deva),sw=swordLayer(fr,deva),c=mk(48,44),x=c.getContext('2d');if(sw.back)x.drawImage(sw.c,0,0);x.drawImage(body,8,4);if(!sw.back)x.drawImage(sw.c,0,0);
  if(!deva)return c;const b=mk(60,55);b.getContext('2d').drawImage(c,0,0,60,55);return b})}
function makeSwordIcon(g){const s=new Spr(30,7);s.cap(8,3,28,3,1.6,g?P.blade2:P.steel,0.1);s.line(9,2,27,2,(g?P.blade2:P.steel)[3]);s.rect(6,0,2,7,P.gold);s.cap(1,3,5,3,1.2,P.wood);return s.outline().cv()}
function komainu(){const s=new Spr(24,28),K2=R('#14201c','#2e4a42','#56786a','#94b4a4');
 s.rect(2,22,20,6,K2,-0.1);s.ell(11,17,8,6,K2,0);s.cap(16,14,18,22,2.2,K2,0.1);s.cap(8,20,6,22,2,K2);s.ell(15,9,6.5,6,K2,0.15);
 for(let i=0;i<4;i++)s.ell(9+i*1.2,4+i*2.5,2.2,2.2,K2,0.25);s.rect(17,11,5,2,R('#2a0004','#5a0a10','#a01822'));s.p(17,7,OUT);s.p(19,7,OUT);s.ell(4,12,2.4,3,K2,0.2);
 return s.outline().cv()}
function boarSprite(fr){const s=new Spr(40,30),ph=fr[0]==='r'?+fr[1]:0,k=Math.sin(ph/4*Math.PI*2)*2,tell=fr==='tell',N=R('#0e2a2a','#1f5a50','#3a8a6e','#7cc49a');
 s.ell(12,25,10,4,N,0);s.ell(4+k,22,4,3,N,-0.1);s.cap(2+k,21,0,16,1.4,N);s.ell(16,25,6,3,P.gold,-0.1);
 s.cap(17,24,18,12,4,N,0.05);s.rect(15,16,6,2,P.gold);s.ell(17,7,7,7,R('#123a2a','#2a6a48','#4a9a60','#8ad08a'),-0.1);
 s.ell(19,7,3.6,3.8,N,0.2);s.p(21,6,C(tell?'#ff3030':'#ffe070'));s.p(22,8,OUT);s.cap(19,2,19,0,1.2,P.gold);
 const sx=tell?8:14,ex=tell?30:35;s.cap(sx,13,ex,12,0.9,P.wood);s.poly([[ex,9],[ex+4,12],[ex,15]],P.steel);s.cap(18,14,22,13,1.5,N);
 return s.outline().cv()}
function birdSprite(fr){const s=new Spr(28,22),W=R('#5a0a10','#b0261a','#e8641c','#ffc061');
 if(fr==='d')s.poly([[4,4],[14,10],[6,14]],W);else if(fr==='0'){s.poly([[3,1],[14,9],[8,12]],W);s.poly([[26,2],[15,9],[20,12]],W)}else{s.poly([[2,16],[13,10],[9,8]],W);s.poly([[26,17],[16,10],[19,8]],W)}
 s.ell(14,12,5,4,P.gold,0.1);s.ell(19,8,3,3,W,0.2);s.poly([[21,7],[26,9],[21,10]],P.beak);s.p(20,7,OUT);s.cap(12,16,10,20,1,P.gold);s.cap(15,16,16,20,1,P.gold);s.poly([[9,13],[2,15],[9,16]],W);
 return s.outline().cv()}
function makeVenom(){const s=new Spr(7,7);s.ell(3.5,3.5,2.8,2.8,R('#c04000','#ff8a10','#ffe060','#ffffff'),0.3);return s.outline(C('#5a1000')).cv()}
function makeSpear(){const s=new Spr(18,5);s.cap(0,2,12,2,1.2,P.wood,0.1);s.poly([[12,0],[18,2.5],[12,5]],P.steel,0.2);return s.outline().cv()}
function vakaSprite(fr){const s=new Spr(100,104),run=fr[0]==='r',ph=run?+fr[1]:0,k=run?Math.sin(ph/4*Math.PI*2)*6:0,b=fr==='i1'?1:0,tell=fr==='tell',th=fr==='throw',st=fr==='stun';
 const AR=R('#3a0608','#8a1418','#c8321e','#f07a4a'),GD=P.gold,SK=P.vaka,IR=R('#1a1a24','#3a3a4c','#6a6a84','#a8a8c4'),MO=R('#2a0004','#5a0a10','#a01822','#e03a3a');
 s.cap(38,70,36-k,98,7,SK);s.cap(60,70,62+k,98,7,SK);s.rect(28-Math.round(k),94,16,9,IR);s.rect(54+Math.round(k),94,16,9,IR);
 for(let i=0;i<5;i++)s.rect(28+i*9,66,8,17,AR,-0.05);s.rect(27,63,46,3,GD);
 s.ell(50,48+b,24,22,AR,0.05);s.rect(30,40+b,40,3,GD);s.rect(30,53+b,40,3,GD);s.ell(50,47+b,7,5,GD,0.2);
 const ay=st?62:th?18:tell?28:46;s.cap(26,40+b,18,62,6,SK);s.rect(12,56,12,8,IR);s.ell(17,66,7,6,SK,0.15);s.cap(74,40+b,86,ay,6,SK);
 s.ell(86,ay,7,6.5,SK,0.15);if(!st){s.cap(86,ay,96,ay-30,4.5,IR,0.1);for(let i=0;i<4;i++)s.p(93+(i%2)*4,ay-12-i*5,IR[3])}else s.cap(84,64,98,96,4.5,IR);
 s.rect(18,28+b,16,20,AR,0.1);s.rect(66,28+b,16,20,AR,0.1);s.rect(18,28+b,16,3,GD);s.rect(66,28+b,16,3,GD);s.rect(18,36+b,16,1,GD);s.rect(66,36+b,16,1,GD);
 s.ell(50,20+b,14,13,SK,0.1);s.rect(36,7+b,28,9,IR,0.1);s.rect(36,14+b,28,2,GD);s.rect(48,3+b,4,5,GD,0.2);
 s.poly([[38,10+b],[26,-2+b],[35,5+b]],GD,0.2);s.poly([[62,10+b],[74,-2+b],[65,5+b]],GD,0.2);
 const ey=C(tell?'#ffffff':'#ff3030');s.p(44,20+b,ey);s.p(45,20+b,ey);s.p(55,20+b,ey);s.p(56,20+b,ey);s.rect(42,18+b,6,1,MO);s.rect(52,18+b,6,1,MO);
 s.rect(42,25+b,16,5,MO);for(let i=0;i<4;i++)s.p(44+i*4,25+b,P.tusk[3]);s.p(43,24+b,P.tusk[2]);s.p(57,24+b,P.tusk[2]);
 return s.outline().cv()}
function makeLamp(lit){const s=new Spr(14,30),ST=R('#30303e','#5a5a6e','#8a8aa0','#c0c0d4');s.rect(5,14,4,13,ST);s.rect(2,26,10,4,ST,-0.1);s.rect(2,8,10,7,ST,0.05);s.poly([[0,9],[7,2],[14,9]],ST,0.2);s.rect(6,0,2,3,ST);
 s.rect(4,10,6,4,lit?R('#c04000','#ff8a10','#ffe060','#ffffff'):R('#0d0710','#1e1e2a','#3a3a4c','#5a5a6e'),lit?0.4:-0.3);return s.outline().cv()}
function heroSq(p){if(p.ground&&!HS.g&&!p.dead)HS.land=1;HS.g=p.ground;let sx=1,sy=1;
 if(HS.land>0){sy=1-0.2*HS.land;sx=1+0.18*HS.land;HS.land=Math.max(0,HS.land-0.11)}
 else if(!p.ground){const v=clamp(-p.vy/260,-1,1);if(v>0){sy=1+0.14*v;sx=1-0.1*v}else{sy=1-0.05*v;sx=1+0.04*v}}
 else if(!p.act&&Math.abs(p.vx)<=8){sy=1+0.03*Math.sin(tt*3.2);sx=1-0.015*Math.sin(tt*3.2)}
 SQX=sx;SQY=sy}
function heroSprite0(fr,deva){const s=new Spr(32,40),sk=P.skin,skd=P.skinD,HR=P.hair,SCF=deva?P.gold:P.red,EYE=C('#ffffff');
 const run=fr.startsWith('run'),ph=run?+fr[3]:0,idle=fr.startsWith('idle'),ip=idle?+fr[4]:0;
 let lk=0,rk=0,la=0,ra=0,by=0,lean=0,fl=0,fly=0;
 if(run){const a=Math.sin(ph/8*Math.PI*2);lk=a*6.5;rk=-lk;la=-a*5;ra=a*4;by=Math.abs(Math.cos(ph/8*Math.PI*2))>0.7?1:-1;lean=1;fl=ph*0.8;fly=-1}
 else if(idle){by=[0,0,1,1][ip];fl=ip*1.6}
 else if(fr==='jump'){lk=-5;rk=3;fly=-3;fl=1}else if(fr==='fall'){lk=3;rk=-4;fly=2;fl=3}
 else if(fr==='hurt'){lean=-2;fly=1}else if(fr.startsWith('strike')){lean=fr==='strike0'?1:2;fl=2}else if(fr==='shoot'){lean=0}
 const hx=16+lean,hy=9+by,w1=Math.sin(fl)*2,w2=Math.cos(fl*1.3)*2;
 s.poly([[hx-3,hy+7],[hx-13,hy+5+w1+fly],[hx-15,hy+9+w2+fly],[hx-11,hy+11+fly],[hx-3,hy+10]],SCF,0.1);
 s.cap(hx-4,hy-3,hx-11,hy+1+w2*0.6+fly,2.4,HR);s.ell(hx-12,hy+2+w2*0.6+fly,1.8,1.8,HR);
 s.rect(8+lean,15+by,3,10,P.wood);s.p(9+lean,14+by,P.red[2]);s.p(10+lean,13+by,P.wht[2]);
 s.cap(14,27,14+rk*0.45,31.5,2.4,skd);s.cap(14+rk*0.45,31.5,14+rk*0.85,35.5,2.1,skd);s.ell(15.5+rk*0.85,37.5,3.8,2.1,P.wood,-0.1);
 if(fr!=='shoot'){s.cap(13+lean,18+by,12+lean+ra*0.5,22+by,1.9,skd);s.ell(12+lean+ra*0.6,24+by,2.4,2.4,skd)}
 s.poly([[11+lean,17+by],[21+lean,17+by],[20,26],[12,26]],P.saf);s.cap(12+lean,17+by,19+lean,25+by,0.8,P.wht);
 s.poly([[11,25],[21,25],[23,30],[17,29],[15,29],[9,30]],P.wht);s.rect(11,25,10,2,P.gold);
 s.cap(18,27,18+lk*0.45,31.5,2.6,sk);s.cap(18+lk*0.45,31.5,18+lk*0.85,35.5,2.3,sk);s.ell(19.5+lk*0.85,37.5,4,2.2,P.wood,0);
 s.ell(hx,hy,6.6,6.3,sk,0.12);
 s.ell(hx-1,hy-4,7,3.8,HR);s.poly([[hx-6,hy-4],[hx-2,hy-10],[hx,hy-6],[hx+3,hy-10],[hx+5,hy-5],[hx+7,hy-7],[hx+6,hy-2]],HR,0.1);s.cap(hx-5,hy-3,hx-6,hy+3,2.3,HR);
 s.rect(hx-6,hy-4,13,2,P.gold);
 if(fr==='hurt'){s.line(hx+2,hy-1,hx+4,hy+1,OUT);s.line(hx+4,hy-1,hx+2,hy+1,OUT);s.rect(hx+2,hy+3,3,1,OUT)}
 else{s.rect(hx+2,hy-1,3,3,EYE);s.p(hx+4,hy,OUT);s.p(hx+4,hy+1,OUT);s.line(hx+1,hy-2,hx+5,hy-3,OUT);s.p(hx+4,hy+4,sk[0]);s.p(hx+5,hy+4,sk[0])}
 const arm=(ex,ey,hx2,hy2)=>{s.cap(18+lean,18+by,ex,ey,2.1,sk);s.ell(hx2,hy2,2.7,2.6,sk,0.18)};
 if(fr==='shoot'){arm(24,17+by,26,17+by);s.cap(14,18+by,21,15+by,1.8,skd);s.line(26,4+by,28,10+by,P.wood[2]);s.line(28,10+by,28,22+by,P.wood[2]);s.line(28,22+by,26,28+by,P.wood[1]);s.line(27,5+by,27,27+by,C('#efeae0'))}
 else if(fr==='strike0')arm(23,13,25,12);else if(fr==='strike1')arm(24,22,26,23);
 else if(fr==='jump')arm(21,13,23,11);else if(fr==='hurt')arm(21,11,22,10);
 else arm(19+lean+la*0.5,22+by,19+lean+la*0.6,24+by);
 return s.outline().cv()}
function swordLayer(fr,deva){const s=new Spr(48,44),RB=deva?P.blade2:P.steel,rw=deva?2.2:1.8;let h,e,back=false;
 if(fr==='strike0'){h=[33,16];e=[47,1]}else if(fr==='strike1'){h=[34,27];e=[47,36]}
 else if(fr==='shoot'||fr==='hurt'){h=[15,16];e=[12,38];back=true}
 else if(fr==='jump'){h=[31,15];e=[45,4]}else if(fr==='fall'){h=[30,27];e=[44,16]}
 else{const run=fr.startsWith('run'),ph=run?+fr[3]:0,la=run?-Math.sin(ph/8*Math.PI*2)*5:0,by=run?(Math.abs(Math.cos(ph/8*Math.PI*2))>0.7?1:-1):fr.startsWith('idle')?[0,0,1,1][+fr[4]]:0,ln=run?1:0;h=[27+ln+la*0.6,28+by];e=[h[0]+14,h[1]-12]}
 const dx=e[0]-h[0],dy=e[1]-h[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
 s.cap(h[0]-ux*4,h[1]-uy*4,h[0],h[1],1.3,P.wood);s.cap(h[0]+ux*2,h[1]+uy*2,e[0],e[1],rw,RB,0.1);
 s.cap(h[0]+ux-uy*3.5,h[1]+uy+ux*3.5,h[0]+ux+uy*3.5,h[1]+uy-ux*3.5,1.2,P.gold,0.2);s.line(h[0]+ux*3,h[1]+uy*3,e[0]-ux*2,e[1]-uy*2,RB[3]);
 return{c:s.outline().cv(),back}}
function dogSprite(fr){const s=new Spr(30,22),sit=fr.startsWith('sit'),ph=sit?0:+fr,a=Math.sin(ph/6*Math.PI*2),D=P.dog,DD=P.dogD,wag=sit?(fr==='sit1'?3:-1):a*2.5,b=sit?0:(Math.abs(a)>0.7?0:-1);
 s.cap(7,11+b,2,5+wag,1.8,D,0.1);s.ell(2,5+wag,1.8,1.8,D,0.2);
 if(sit){s.ell(10,15,6,5,D,0);s.ell(13,19.5,3,1.7,DD)}else{s.cap(9,13+b,9-a*3.5,18,1.7,DD);s.ell(10-a*3.5,19.5,2.6,1.6,DD);s.cap(18,13+b,18+a*3.5,18,1.7,DD);s.ell(19+a*3.5,19.5,2.6,1.6,DD)}
 if(sit)s.ell(13,12,5,6,D,0.05);else s.ell(13.5,12+b,8,4.6,D,0.05);
 if(sit){s.cap(17,11,17,18,1.9,D);s.ell(18,19.5,2.9,1.8,D,0.1)}else{s.cap(11,13+b,11+a*3.5,18,1.9,D);s.ell(12+a*3.5,19.5,2.9,1.8,D,0.1);s.cap(20,13+b,20-a*3.5,18,1.9,D);s.ell(21-a*3.5,19.5,2.9,1.8,D,0.1)}
 const hx=sit?20:22,hy=(sit?6:7)+b;s.rect(hx-5,hy+4,5,2,P.saf,0.2);
 s.ell(hx,hy,5.8,5.3,D,0.18);s.ell(hx+5,hy+2.5,3.2,2.3,D,0.3);s.p(hx+8,hy+1,OUT);s.p(hx+7,hy+1,OUT);
 s.ell(hx-3,hy+0.5,2.2,3.8,DD,-0.1);s.rect(hx+1,hy-2,2,3,C('#ffffff'));s.p(hx+2,hy-1,OUT);s.p(hx+2,hy,OUT);s.line(hx,hy-3,hx+3,hy-3,OUT);
 if(!sit||fr==='sit1')s.rect(hx+5,hy+4,2,2+(sit?0:1),P.red);
 return s.outline().cv()}
function yakshaSprite(fr){const s=new Spr(24,32),sp=fr==='s',b=fr==='1'?1:0,Y=R('#10283a','#245a7a','#3a9ad0','#9ae0ff'),F=R('#6a1a00','#d0501a','#ffa020','#fff0a0');
 s.poly([[7,23],[17,23],[13,32-b],[11,28],[9,31-b]],F,0.2);s.ell(12,19,7,5.5,Y,0.05);s.ell(12,21,4,2.6,P.gold,-0.2);
 s.cap(6,16,sp?2:3,sp?12:22,1.8,Y);s.ell(sp?2:3,sp?11:23,2.4,2.4,Y,0.2);s.cap(18,16,sp?22:21,sp?10:22,1.8,Y);s.ell(sp?22:21,sp?9:23,2.4,2.4,Y,0.2);if(sp)s.ell(22,6,2,2,F,0.3);
 s.ell(12,9-b,6.5,6,Y,0.15);s.rect(9,7-b,2,3,C('#ffe070'));s.rect(14,7-b,2,3,C('#ffe070'));s.rect(9,12-b,7,2,R('#2a0004','#5a0a10','#a01822'));s.p(10,12-b,P.tusk[3]);s.p(14,12-b,P.tusk[3]);
 s.poly([[5,5-b],[7,0],[10,3-b],[12,0],[14,3-b],[17,0],[19,5-b]],P.gold,0.2);return s.outline().cv()}
function guardSprite(fr){const s=new Spr(24,32),ST=P.rock,GD=P.gold,WD=P.wood,SL=P.steel,tell=fr==='tell',thr=fr==='throw';
 s.rect(6,22,4,10,ST,-0.1);s.rect(14,22,4,10,ST,-0.1);s.rect(4,30,6,2,ST,-0.1);s.rect(14,30,6,2,ST,-0.1);
 s.poly([[6,12],[18,12],[20,24],[4,24]],ST,0.05);s.rect(4,21,16,2,GD,0.1);s.ell(12,16,3,3,GD,0.2);
 s.ell(5,13,3,3,ST,0.1);s.ell(19,13,3,3,ST,0.1);
 s.ell(12,7,6,6,ST,0.15);s.rect(6,2,12,3,GD,0.2);s.rect(7,0,10,2,GD,0.3);
 s.rect(9,7,2,2,C('#ff3030'));s.rect(13,7,2,2,C('#ff3030'));s.rect(10,11,4,1,OUT);
 if(tell){s.cap(6,13,4,6,2,ST);s.ell(3,5,2.4,2.4,ST);s.cap(18,13,20,6,2,ST);s.ell(21,5,2.4,2.4,ST);
  s.cap(3,4,21,4,1.6,WD,0.1);s.poly([[21,1],[24,4],[21,7]],SL,0.2)}
 else if(thr){s.cap(6,13,10,14,2,ST);s.ell(11,14,2.4,2.4,ST);s.cap(18,13,22,12,2,ST);s.ell(23,12,2.4,2.4,ST);
  s.line(20,10,23,10,GD);s.line(20,14,23,14,GD)}
 else{s.cap(6,13,4,20,2,ST);s.ell(3,22,2.4,2.4,ST);s.cap(18,13,20,20,2,ST);s.ell(21,22,2.4,2.4,ST);
  s.cap(21,2,21,30,1.6,WD,0.1);s.poly([[21,0],[24,3],[21,6]],SL,0.2)}
 return s.outline().cv()}
function impSprite(fr){const s=new Spr(20,20),j=fr==='j',k=fr==='1'?1:0,I=R('#3a1440','#7a3a8a','#b46ac0','#e8b0f0');
 s.cap(7,14,j?4:6-k,18,1.3,I);s.ell(j?4:6-k,19,2,1.2,I);s.cap(12,14,j?15:13+k,18,1.3,I);s.ell(j?15:13+k,19,2,1.2,I);s.ell(10,13,4,3.4,I,0);
 s.cap(13,13,17,j?8:12,1.1,I);s.ell(17,j?8:12,1.7,1.7,I,0.2);
 s.ell(10,7,6.4,5.6,I,0.15);s.poly([[4,4],[1,0],[7,2]],I,0.2);s.poly([[15,2],[18,-1],[17,5]],I,0.2);
 s.rect(11,5,3,3,C('#ffe040'));s.rect(7,5,2,3,C('#ffe040'));s.p(13,6,OUT);s.p(8,6,OUT);s.line(8,10,14,10,C('#f4f0e4'));return s.outline().cv()}
function vetalaSprite(fr){const s=new Spr(22,30),V=R('#3a3a3a','#8a8a7a','#d8d8c0','#ffffff'),H=R('#05040a','#16121e','#2a2638','#3e3a52'),CL=R('#2a1040','#5a1a70','#8a3aa0','#c070d0');
 if(fr==='h'){s.cap(9,0,9,6,1.2,V);s.cap(12,0,12,6,1.2,V);s.rect(7,6,8,8,CL);s.cap(7,8,4,16,1,V);s.ell(4,17,1.8,1.8,V);s.cap(14,8,17,16,1,V);s.ell(17,17,1.8,1.8,V);s.ell(11,19,5.6,5,V,0.1);s.rect(8,18,2,2,C('#ff3030'));s.rect(12,18,2,2,C('#ff3030'));s.rect(6,23,10,7,H)}
 else{const k=fr==='1'?1:0;s.cap(9,21,8-k*2,27,1.3,V);s.ell(8-k*2,28.5,2.4,1.4,V);s.cap(13,21,14+k*2,27,1.3,V);s.ell(14+k*2,28.5,2.4,1.4,V);s.rect(7,13,8,9,CL);
  s.poly([[7,4],[3,8+k],[2,16+k],[6,14]],H);s.ell(12,8,5.6,5.2,V,0.1);s.rect(7,3,5,4,H);s.rect(14,7,2,2,C('#ff3030'));s.line(13,11,16,11,OUT);s.cap(14,14,19,15+k,1.1,V);s.ell(19.5,15+k,1.8,1.8,V,0.2)}
 return s.outline().cv()}

