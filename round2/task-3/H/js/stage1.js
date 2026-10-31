// Stage 1 map, background art and enemy layout.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
const COLS=424,LW=COLS*T,LH=ROWS*T;
let MAP,ENT0,CHECKS,DECOR;
function buildMap(){MAP=new Uint8Array(COLS*ROWS);
 const g=(c,h)=>{for(let r=ROWS-h;r<ROWS;r++)MAP[r*COLS+c]=r===ROWS-h?1:3};
 const hts=new Array(COLS).fill(2);
 const seg=[[0,40,2],[40,60,3],[60,74,2],[78,96,2],[96,112,3],[117,130,4],[130,150,3],[154,180,2],[180,200,3],[200,230,2],[235,250,3],[255,275,2],[275,300,4],[304,330,2],[330,360,3],[365,404,2],[404,424,2]];
 hts.fill(0);for(const[a,b,h]of seg)for(let c=a;c<b;c++)hts[c]=h;
 for(let c=0;c<COLS;c++)if(hts[c])g(c,hts[c]);
 for(let r=0;r<ROWS;r++){MAP[r*COLS]=3;MAP[r*COLS+COLS-1]=3}
 const plat=(c,r,w)=>{for(let i=0;i<w;i++)MAP[r*COLS+c+i]=2};
 plat(27,7,6);plat(45,6,4);plat(73,7,6);plat(86,6,5);plat(111,7,7);plat(122,5,4);plat(140,6,5);plat(149,7,6);plat(165,6,4);plat(186,5,5);
 plat(213,6,5);plat(229,7,7);plat(240,5,4);plat(249,7,7);plat(262,6,4);plat(284,4,4);plat(299,7,6);plat(318,6,5);plat(342,5,4);plat(359,7,7);plat(375,6,4);plat(386,5,4);
 plat(409,7,3);plat(417,7,3);
 CHECKS=[3,96,200,330,396].map(c=>({c,lit:c===3}));
 ENT0=[];const E=(t,c,o={})=>ENT0.push(Object.assign({t,c},o));
 [20,52,66,100,134,160,190,206,240,268,290,312,340,370,388].forEach((c,i)=>E(i%3===2?'cobra':'boar',c));
 [36,58,90,125,145,172,196,222,258,280,322,350,380].forEach(c=>E('bird',c));
 [24,47,62,88,113,124,142,167,188,215,242,263,286,320,344,377].forEach((c,i)=>E(i%4===3?'heart':'mango',c,{row:i%2?4:5}));
 [44,108,176,226,272,334,392].forEach(c=>E('quiver',c));
 [128,286].forEach(c=>E('orb',c,{row:3}));
 E('guard',320); // statue guard on the raised platform after the guardian-statue tower
 E('guard',400); // statue guard on the ground before the boss clearing
 DECOR=[];const rr=rng(7);for(let c=6;c<400;c+=3+((rr()*6)|0)){const h=surf(c);if(h<ROWS)DECOR.push({c,k:(rr()*5)|0})}}
function tileAt(c,r){if(c<0||c>=COLS)return 3;if(r<0)return 0;if(r>=ROWS)return 0;return MAP[r*COLS+c]}
function solid(c,r){const t=tileAt(c,r);return t===1||t===3}
function gnd(c){for(let r=0;r<ROWS;r++){const t=MAP[r*COLS+c];if(t===1||t===3)return r}return ROWS}
function surf(c){for(let r=0;r<ROWS;r++)if(MAP[r*COLS+c])return r;return ROWS}
let BG={};
function patchInit(){const seq=['boar','imp','cobra','vetala','imp','boar'];ENT0.filter(e=>e.t==='boar'||e.t==='cobra').forEach((e,i)=>{e.t=seq[i%seq.length]});
 SFX.spin=()=>{noise(0.25,0.25,2600,2,0,900);tone('triangle',500,1100,0.2,0.1)};SFX.beam=()=>{tone('square',900,1800,0.12,0.09);tone('triangle',1400,600,0.2,0.08,0.03)};
 SFX.bite=()=>{tone('sawtooth',700,300,0.08,0.2);noise(0.08,0.2,1500,2)};IMG.sword=[makeSwordIcon(false),makeSwordIcon(true)]}
function bakeBG(){const r=rng(11),ST=R('#30303e','#5a5a6e','#8a8aa0','#c0c0d4'),STD=R('#1e1e2a','#3a3a4c','#5a5a6e','#7a7a90'),WD=P.wood,LANT=R('#6a0a00','#c0201a','#ff5a30','#ffd080'),RF=R('#1a1418','#3a2a30','#5a4048','#806068');
 BG.sky=paint((x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1c64d8');g.addColorStop(0.6,'#3c9cf0');g.addColorStop(1,'#8cd0ff');x.fillStyle=g;x.fillRect(0,0,w,h);
  const id=x.getImageData(0,0,w,h),d=id.data;for(let y=0;y<h;y++)for(let X=0;X<w;X++){const i=(y*w+X)*4,b=BAYER[(y&3)*4+(X&3)]*18;for(let k=0;k<3;k++)d[i+k]=Math.round((d[i+k]+b)/16)*16}x.putImageData(id,0,0);
  for(let i=0;i<5;i++){const cx=r()*w,cy=12+r()*36;x.fillStyle='rgba(255,255,255,0.85)';for(let j=0;j<5;j++){x.beginPath();x.ellipse(cx+j*10-20,cy+(j%2)*3,13,5,0,0,7);x.fill()}}},320,180);
 BG.far=paint((x,w,h)=>{const s=new Spr(w,h),RK=R('#3a1a14','#7a4030','#c07a5e','#eab49a'),DK=R('#2a1210','#3a1a14','#5a2a20','#7a4030');const top=X=>66+Math.sin(X*0.013)*24+Math.sin(X*0.041)*10+Math.sin(X*0.11)*3;
  for(let X=0;X<w;X++){const t=top(X);for(let y=Math.floor(t);y<h;y++){const n=Math.sin(X*0.9+y*1.7)*0.5+Math.sin(X*0.23-y*0.4)*0.5;s.p(X,y,s.pick(RK,0.35-(y-t)*0.006+n*0.35,X,y))}}
  for(const hx of [140,420,660]){const hy=top(hx)+34;s.ell(hx,hy,16,19,RK,0.25);s.rect(hx-9,hy-6,6,3,DK);s.rect(hx+3,hy-6,6,3,DK);s.rect(hx-2,hy,4,6,RK,-0.2);s.rect(hx-7,hy+9,14,3,DK)}
  x.drawImage(s.cv(),0,0)},800,180);
 BG.ruin=paint((x,w,h)=>{const s=new Spr(w,h),SS=R('#4a2a24','#9a6a5a','#d0a08a','#f4d0bc');
  for(let i=0;i<20;i++){const bx=i*48+12+(r()*6|0);if(i%5===4)continue;s.rect(bx-8,122,16,28,SS,0);s.ell(bx,114,8,9,SS,0.15);s.rect(bx-9,104,18,3,SS,0.2);s.rect(bx-10,148,20,4,SS,-0.1)}
  s.rect(0,150,w,30,SS,-0.25);x.drawImage(s.outline().cv(),0,0)},960,180);
 BG.mid=paint((x,w,h)=>{const s=new Spr(w,h),OR=P.saf;
  for(let b=0;b<3;b++){const x0=b*320+30,x1=x0+200;s.rect(x0,64,x1-x0,90,OR,-0.05);
   for(let px=x0+12;px<x1-20;px+=50){s.rect(px,80,26,30,WD,-0.3);for(let gx=px+2;gx<px+26;gx+=5)for(let gy=82;gy<108;gy++)s.p(gx,gy,WD[3]);for(let gy=82;gy<109;gy+=5)for(let gx=px+2;gx<px+25;gx++)s.p(gx,gy,WD[3])}
   for(let px=x0;px<=x1;px+=50){s.rect(px-5,56,10,98,P.red,0.1);s.rect(px-6,56,12,3,P.gold);s.rect(px-6,146,12,4,P.gold)}
   s.poly([[x0-24,62],[x0-14,44],[x1+14,44],[x1+24,62]],RF,0);s.rect(x0-16,40,x1-x0+32,4,RF,0.2);s.rect(x0-14,60,x1-x0+28,3,P.gold);
   s.poly([[x0+30,40],[x0+48,24],[x1-48,24],[x1-30,40]],RF,0.1);s.rect(x0+46,20,x1-x0-92,4,RF,0.3);
   for(let lx=x0+25;lx<x1;lx+=50){s.line(lx,63,lx,70,OUT);s.ell(lx,75,4,5,LANT,0.3);s.rect(lx-3,70,7,1,P.gold);s.rect(lx-3,80,7,1,P.gold)}}
  x.drawImage(s.outline().cv(),0,0)},960,180);
 BG.shaft=paint((x,w,h)=>{for(let i=0;i<4;i++){const sx=i*90+r()*30;const g=x.createLinearGradient(sx,0,sx+40,h);g.addColorStop(0,'rgba(255,255,240,0.18)');g.addColorStop(1,'rgba(255,255,240,0)');x.fillStyle=g;x.beginPath();x.moveTo(sx,0);x.lineTo(sx+16,0);x.lineTo(sx+60,h);x.lineTo(sx+30,h);x.fill()}},360,180);
 const L=mk(LW,LH),x=L.getContext('2d');
 const tile=(kind,v)=>{const s=new Spr(16,16);const rr=rng(v*31+kind);
  if(kind===2){s.rect(0,0,16,5,P.red,0.15);s.rect(0,5,16,1,P.gold);s.rect(1,6,3,4,P.red,-0.2);s.rect(12,6,3,4,P.red,-0.2);return s.cv()}
  const pal=kind===1?ST:STD;for(let y=0;y<16;y++){const off=((y>>2)&1)*4;for(let X=0;X<16;X++){const bx=(X+off)&7,by=y&3;let l=0.05+rr()*0.25-0.12;if(bx===0||by===0)l=-0.9;else if(bx===1||by===1)l+=0.35;else if(bx===7||by===3)l-=0.3;s.p(X,y,s.pick(pal,l,X,y))}}
  if(kind===1)for(let X=0;X<16;X++){s.p(X,0,pal[3]);s.p(X,1,pal[2])}
  return s.cv()};
 const tc={};for(const k of[1,2,3])for(let v=0;v<4;v++)tc[k+'_'+v]=artTile(k,v)||tile(k,v);
 const kom=komainu();
 for(const d of DECOR){const X=d.c*T,Y=surf(d.c)*T;let im;
  if(d.k===0)im=kom;
  else if(d.k===1)im=makeLamp(true);
  else if(d.k===2){const s=new Spr(22,24);s.rect(1,2,20,22,ST,0);s.rect(4,7,5,3,STD,-0.4);s.rect(13,7,5,3,STD,-0.4);s.rect(9,11,4,5,ST,0.3);s.rect(6,18,10,2,STD,-0.4);im=s.outline().cv()}
  else if(d.k===3){const s=new Spr(12,30);s.rect(5,4,2,26,WD);s.rect(1,2,10,2,WD,0.2);s.ell(6,10,4,5,LANT,0.3);s.rect(3,5,6,1,P.gold);s.rect(3,15,6,1,P.gold);im=s.outline().cv()}
  else{const s=new Spr(14,20);s.rect(3,9,8,11,ST,0);s.ell(7,6,4.5,5,ST,0.15);s.rect(2,10,10,2,P.red,0.1);im=s.outline().cv()}
  x.drawImage(im,X,Y-im.height)}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=MAP[r*COLS+c];if(!t)continue;let k=t;if(t===1&&r>0&&MAP[(r-1)*COLS+c]===1)k=3;x.drawImage(tc[k+'_'+((c*7+r*3)&3)],c*T,r*T);
  if((t===1||t===3)&&c>0&&!MAP[r*COLS+c-1]){x.fillStyle='#0d0710';x.fillRect(c*T,r*T,1,T)}if((t===1||t===3)&&c<COLS-1&&!MAP[r*COLS+c+1]){x.fillStyle='#0d0710';x.fillRect(c*T+T-1,r*T,1,T)}}
 BG.level=L;
 BG.near=paint((x,w,h)=>{for(let i=0;i<2;i++){const s=new Spr(14,180);s.rect(0,0,14,180,P.red,0.1);for(let k=0;k<4;k++)s.rect(0,20+k*44,14,3,P.gold);x.drawImage(s.outline().cv(),i*330+120+r()*80,0)}},660,180);
 BG.fringe=paint((x,w,h)=>{const s=new Spr(w,h);s.rect(0,0,w,5,RF,0.1);s.rect(0,5,w,1,P.gold);for(let lx=20;lx<w;lx+=66){s.line(lx,6,lx,10,OUT);s.ell(lx,15,4,5,LANT,0.3);s.rect(lx-3,10,7,1,P.gold);s.rect(lx-3,20,7,1,P.gold)}x.drawImage(s.outline().cv(),0,0)},660,24);
 BG.lamp=[makeLamp(false),makeLamp(true)]}

