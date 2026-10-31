// Text, HUD, title screen, win/lose cards, settings toggles.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
const TC=new Map();
function tcv(s,size=8,col='#efeae0',font='monospace'){const k=s+'|'+size+'|'+col+'|'+font;let c=TC.get(k);if(c)return c;
 const m=mk(4,4).getContext('2d');m.font=`bold ${size}px ${font}`;const w=Math.ceil(m.measureText(s).width)+4,h=size+6;
 const cc=mk(w,h),x=cc.getContext('2d');x.font=m.font;x.textBaseline='top';x.fillStyle='#fff';x.fillText(s,2,2);
 const id=x.getImageData(0,0,w,h),d=new Uint32Array(id.data.buffer),a=new Uint8Array(w*h);for(let i=0;i<w*h;i++)a[i]=(d[i]>>>24)>100?1:0;
 const ramp=Array.isArray(col)?col.map(C):null,cc0=ramp?0:C(col);let y0=h,y1=0;for(let i=0;i<w*h;i++)if(a[i]){const y=(i/w)|0;y0=Math.min(y0,y);y1=Math.max(y1,y)}
 for(let y=0;y<h;y++)for(let X=0;X<w;X++){const i=y*w+X;if(a[i]){d[i]=ramp?ramp[Math.min(ramp.length-1,Math.floor((y-y0)/(y1-y0+1)*ramp.length))]:cc0}else{let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=X+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&a[yy*w+xx])n=1}d[i]=n?OUT:0}}
 x.putImageData(id,0,0);TC.set(k,cc);return cc}
function txt(s,x,y,col,align='l',size=8,font){const c=tcv(s,size,col,font);const xx=align==='c'?x-c.width/2:align==='r'?x-c.width:x;ctx.drawImage(c,Math.round(xx),Math.round(y));return c.width}
function wrap(s,n){const w=s.split(' '),L=[];let l='';for(const t of w){if((l+' '+t).trim().length>n){L.push(l.trim());l=t}else l+=' '+t}if(l.trim())L.push(l.trim());return L}
function drawExcl(x,y){txt('!',x,y,'#ff4040','c',10)}
let TITLE;
function drawTitle(){ctx.drawImage(TITLE,0,0);
 txt('THE THIRTEENTH YEAR',VW/2,22,['#fff2a0','#f2c632','#ee8a1c','#c25e0a'],'c',18,'serif');
 txt('YEAR ONE - THE TEMPLE ROAD',VW/2,46,'#efeae0','c',8);
 if((tt*2|0)%2===0)txt('PRESS START',VW/2,124,['#ffffff','#fff2a0','#f2c632'],'c',10);
 txt(hooks.touch?'tap START to begin':'Enter / Space to begin',VW/2,140,'#c8c0d8','c',7);
 txt(S.mute?'SOUND OFF (M)':'SOUND ON (M)',VW-4,VH-11,'#a9a2c0','r',7)}
function drawCard(win){ctx.fillStyle='rgba(8,4,14,0.86)';ctx.fillRect(0,0,VW,VH);ctx.strokeStyle='#d8b24a';ctx.strokeRect(10.5,10.5,VW-21,VH-21);
 if(win){txt('YEAR ONE COMPLETE',VW/2,20,['#fff2a0','#f2c632','#ee8a1c'],'c',14,'serif');
  const L=['Vaka falls, and the temple road breathes again.','','Sanjaya: "A prince with nothing still','protects others. Patience is not waiting -','it is staying true while the years pass."','','LESSON: PATIENCE'];L.forEach((l,i)=>txt(l,VW/2,46+i*11,i===6?'#f2c632':'#efeae0','c'));
  txt('SCORE '+G.score,VW/2,128,'#efeae0','c');}
 else{txt('THE FOREST IS PATIENT',VW/2,28,['#ff8a7a','#e03a3a','#a01822'],'c',14,'serif');
  ['Sanjaya: "Even Arjuna earned his weapons','through patience. Rise, and walk again."','','LESSON: PATIENCE'].forEach((l,i)=>txt(l,VW/2,60+i*11,i===3?'#f2c632':'#efeae0','c'));txt('SCORE '+G.score,VW/2,118,'#efeae0','c')}
 if(tt>1.2&&(tt*2|0)%2===0)txt('PRESS START',VW/2,148,'#ffffff','c',10)}let HUDK=null;
function setOpt(k,v){S[k]=!!v;saveS();if(k==='inf'&&v&&G&&G.p)G.p.arrows=Math.max(G.p.arrows,TUNE.quiverMax)}
function bakeTitle(){TITLE=paint((x,w,h)=>{x.drawImage(BG.sky,0,0);x.drawImage(BG.far,-60,10);x.drawImage(BG.mid,-30,30);
 x.fillStyle='rgba(10,10,40,0.25)';x.fillRect(0,0,w,h);x.fillStyle='#4c4c60';x.fillRect(0,150,w,30);x.fillStyle='#9090aa';x.fillRect(0,150,w,2);
 const v=getHero('strike0',false);x.save();x.translate(54,64);x.scale(2,2);x.drawImage(v,0,0);x.restore();
 const dg=spr('dogsit',()=>dogSprite('sit'));x.save();x.translate(24,114);x.scale(2,2);x.drawImage(dg,0,0);x.restore();
 const vk=vakaSprite('i0');x.save();x.globalAlpha=0.7;x.translate(w-4,150-104);x.scale(-1,1);x.drawImage(vk,0,0);x.restore()},320,180)}
function drawHUD(){const p=G.p,y0=VH-32,bx=30;if(!HUDK)HUDK=komainu();
 ctx.fillStyle='#3a0408';ctx.fillRect(0,y0,VW,32);ctx.fillStyle='#c8161e';ctx.fillRect(0,y0+2,VW,28);ctx.fillStyle='#f2c632';ctx.fillRect(0,y0+2,VW,1);
 ctx.drawImage(HUDK,2,y0+3);ctx.save();ctx.translate(VW-2,y0+3);ctx.scale(-1,1);ctx.drawImage(HUDK,0,0);ctx.restore();
 ctx.fillStyle='#1a0206';ctx.fillRect(bx,y0+5,TUNE.hearts*14+2,7);for(let i=0;i<TUNE.hearts*2;i++){const on=i<p.hp*2;ctx.fillStyle=on?'#bff4ff':'#3a2a40';ctx.fillRect(bx+2+i*7,y0+7,5,3);if(on){ctx.fillStyle='#ffffff';ctx.fillRect(bx+2+i*7,y0+7,5,1)}}
 txt('REST '+String(Math.max(0,G.lives-1)).padStart(2,'0'),bx,y0+12,'#ffffff');txt(String(G.score).padStart(7,'0'),bx+50,y0+12,['#fff2a0','#f2c632','#ee8a1c']);
 ctx.drawImage(IMG.arrow,bx,y0+24);txt(S.inf||p.deva>0?'∞':String(p.arrows),bx+18,y0+20,p.arrows===0&&p.deva<=0&&!S.inf?'#ffd0c0':'#ffffff');
 const w=weapon();ctx.drawImage(IMG.sword[w==='great'?1:0],bx+38,y0+23);txt(w==='great'?'GREAT':'SWORD',bx+72,y0+20,w==='great'?['#fff2a0','#f2c632','#b88a10']:'#ffffff');if(S.inv)txt('INV',bx+110,y0+20,'#fff2a0');
 const rx=174;
 if(G.boss&&G.bossOn){const b=G.boss,f=Math.max(0,b.hp)/TUNE.bossHP,n=16;txt('VAKA',rx,y0+3,'#ffe0c0');ctx.fillStyle='#1a0206';ctx.fillRect(rx,y0+14,n*7+2,7);for(let i=0;i<n;i++){ctx.fillStyle=i<Math.ceil(f*n)?'#ffb030':'#3a2a40';ctx.fillRect(rx+2+i*7,y0+16,5,3)}}
 else if(p.deva>0){txt('DEVA LIGHT',rx,y0+3,['#fff2a0','#f2c632','#ee8a1c']);ctx.fillStyle='#1a0206';ctx.fillRect(rx,y0+14,114,6);ctx.fillStyle='#f2c632';ctx.fillRect(rx+1,y0+15,112*p.deva/TUNE.deva|0,4)}
 else{txt('YEAR ONE',rx,y0+3,'#ffd0c0');txt(p.hp>=TUNE.hearts?'FULL HP: SWORD BEAM':'heal for sword beam',rx,y0+14,p.hp>=TUNE.hearts?'#bff4ff':'#ffb0a0',7)}
 let ty=4;for(const t of toasts){const L=wrap(t.s,46);const a=Math.min(1,t.t*2,(t.max-t.t)*4);ctx.globalAlpha=a;const h=L.length*10+4;ctx.fillStyle='rgba(13,7,16,0.78)';ctx.fillRect(14,ty,VW-28,h);ctx.fillStyle='#d8b24a';ctx.fillRect(14,ty,2,h);
  L.forEach((l,i)=>txt(l,22,ty+1+i*10,'#efeae0'));ctx.globalAlpha=1;break}}
