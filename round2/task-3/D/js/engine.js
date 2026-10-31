// Core: canvas, shared helpers, game state, main update/render loop.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
const cv=document.getElementById('cv'); // the one game canvas (never replaced)
const hooks={}; // filled by bootGame() from index.html: music, onMute, onPause, touch
const VW=320,VH=180,T=16,ROWS=12,CAMY=-14;
const DEBUG=false;
const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
const S=Object.assign({mute:false,size:'fit',rotate:false,touch:'auto'},(()=>{try{return JSON.parse(localStorage.getItem('tty-stage1')||'{}')}catch(e){return{}}})());
function saveS(){try{localStorage.setItem('tty-stage1',JSON.stringify(S))}catch(e){}}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function C(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return(0xff000000|((n&255)<<16)|(n&0xff00)|((n>>16)&255))>>>0}
function R(...a){return a.map(C)}
const OUT=C('#0d0710');
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>v/16-0.5);
function paint(fn,w,h){const c=mk(w,h);fn(c.getContext('2d'),w,h);return c}
const TUNE=TUNING; // all numbers live in js/tuning.js
let G,state='title',tt=0,toasts=[],parts=[],shake=0,flash=0;
function newGame(){G={score:0,lives:TUNE.lives,check:3};CHECKS&&CHECKS.forEach(c=>c.lit=c.c===3);startLife(true)}
function toast(s,dur=3.2){toasts.push({s,t:dur,max:dur})}
function addP(x,y,vx,vy,col,life=0.5,g=300,sz=1){if(parts.length>180)parts.shift();parts.push({x,y,vx,vy,col,life,max:life,g,sz})}
function burst(x,y,col,n=10,sp=90){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=sp*(0.3+Math.random());addP(x,y,Math.cos(a)*s,Math.sin(a)*s-40,col,0.4+Math.random()*0.4)}}
function hitSolid(x,y,w,h){const c0=Math.floor(x/T),c1=Math.floor((x+w-0.01)/T),r0=Math.floor(y/T),r1=Math.floor((y+h-0.01)/T);for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(solid(c,r))return true;return false}
function moveBody(o,dt,oneway=true){o.x+=o.vx*dt;const L=o.x-o.w/2;if(hitSolid(L,o.y,o.w,o.h)){if(o.vx>0)o.x=Math.floor((L+o.w)/T)*T-o.w/2-0.01;else o.x=(Math.floor(L/T)+1)*T+o.w/2+0.01;o.vx=0;o.wall=true}else o.wall=false;
 const py=o.y;o.y+=o.vy*dt;o.ground=false;const L2=o.x-o.w/2;
 if(o.vy>0){const r=Math.floor((o.y+o.h)/T),pr=Math.floor((py+o.h-0.01)/T);const c0=Math.floor(L2/T),c1=Math.floor((L2+o.w-0.01)/T);
  for(let c=c0;c<=c1;c++){const t=tileAt(c,r);if(t===1||t===3||(oneway&&t===2&&pr<r&&!o.drop)){o.y=r*T-o.h;o.vy=0;o.ground=true;break}}}
 else if(o.vy<0&&hitSolid(L2,o.y,o.w,o.h)){o.y=(Math.floor(o.y/T)+1)*T;o.vy=0}}
function ov(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2&&a.y<b.y+b.h&&b.y<a.y+a.h}
function update0(dt){tt+=dt;for(const t of toasts)t.t-=dt;toasts=toasts.filter(t=>t.t>0);
 for(const q of parts){q.life-=dt;q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt}parts=parts.filter(q=>q.life>0);shake=Math.max(0,shake-dt*20);flash=Math.max(0,flash-dt*3);
 if(state!=='play')return;const p=G.p;
 if(p.dead){p.vy+=TUNE.grav*dt;p.y+=p.vy*dt;p.deadT-=dt;if(p.deadT<=0)afterDeath();return}
 const deva=p.deva>0,spd=deva?TUNE.devaRun:TUNE.run;p.w=deva?12:10;const nh=deva?28:22;if(p.h!==nh){p.y+=p.h-nh;p.h=nh}
 let ix=(K.r?1:0)-(K.l?1:0);if(p.hurtT>0){p.hurtT-=dt;ix=0}
 const acc=p.ground?TUNE.accG:TUNE.accA;if(ix){p.vx+=ix*acc*dt;p.vx=clamp(p.vx,-spd,spd);p.face=ix}else{const f=acc*dt;p.vx=Math.abs(p.vx)<=f?0:p.vx-Math.sign(p.vx)*f}
 p.drop=K.d&&KP.jump;
 if(KP.jump)p.buf=TUNE.buffer;else p.buf-=dt;p.coy=p.ground?TUNE.coyote:p.coy-dt;
 if(p.buf>0){if(p.drop&&p.ground&&tileAt(Math.floor(p.x/T),Math.floor((p.y+p.h+1)/T))===2){p.y+=3;p.buf=0;p.ground=false}
  else if(p.coy>0){p.vy=-TUNE.jump*(deva?1.06:1);p.coy=0;p.buf=0;p.jumps=1;sfx('jump')}else if(p.jumps<2){p.vy=-TUNE.djump;p.jumps=2;p.buf=0;sfx('djump');for(let i=0;i<8;i++)addP(p.x,p.y+p.h,(Math.random()-0.5)*80,20+Math.random()*30,'#f2e8c0',0.3,0)}}
 if(!K.jump&&p.vy<-120)p.vy+=TUNE.grav*dt*1.4;
 p.vy=Math.min(TUNE.maxFall,p.vy+TUNE.grav*dt);moveBody(p,dt,true);p.drop=false;if(p.ground)p.jumps=0;
 p.x=clamp(p.x,8,G.bossOn?(423*T-8):LW-8);if(G.bossOn)p.x=Math.max(p.x,404*T+8);
 p.cd-=dt;p.scd-=dt;p.actT-=dt;if(p.actT<=0)p.act=null;p.inv-=dt;
 if(KP.shoot&&p.cd<=0){if(deva||p.arrows>0){if(!deva)p.arrows--;p.cd=deva?TUNE.devaShootCD:TUNE.shootCD;p.act='shoot';p.actT=0.18;G.arrowsF.push({x:p.x+p.face*10,y:p.y+(deva?9:8),vx:p.face*TUNE.arrowSpd*(deva?1.2:1),life:1.2,deva,w:12,h:4});sfx('bow');
   if(!deva&&p.arrows===0)toast('Quiver empty - Vel draws his sword.',2)}else{doStrike()}}
 if(KP.strike&&p.scd<=0)doStrike();
 if(p.deva>0){p.deva-=dt;if(Math.random()<0.5)addP(p.x+(Math.random()-0.5)*14,p.y+Math.random()*p.h,0,-30,Math.random()<0.5?'#ffe070':'#ffffff',0.5,-20);if(p.deva<=0){sfx('devaOff');toast('The Deva light fades.',2)}}
 if(p.y>LH+20){pitFall();return}
 p.anim+=dt*(Math.abs(p.vx)/60+1);
 const tgt=p.x-130+p.face*20;G.cam+=(tgt-G.cam)*Math.min(1,dt*5);G.cam=clamp(G.cam,0,LW-VW);if(G.bossOn)G.cam+=((404*T)-G.cam)*Math.min(1,dt*4);
 for(const ck of CHECKS)if(!ck.lit&&p.x>ck.c*T){ck.lit=true;G.check=ck.c;sfx('check');burst(ck.c*T+8,surf(ck.c)*T-26,'#ffc061',14);
  toast(ck.c===96?'Sanjaya: "The road is long. He walks it anyway."':ck.c===200?'Sanjaya: "Among the ruins, the old gods still keep their lamps."':ck.c===330?'Sanjaya: "Twelve years of forest. This is only the first."':'Sanjaya: "The deep forest is listening. Something waits."',3.6)}
 for(const a of G.arrowsF){a.x+=a.vx*dt;a.life-=dt;if(solid(Math.floor(a.x/T),Math.floor(a.y/T))){a.life=0;burst(a.x,a.y,'#c8b088',4,40);sfx('thunk')}
  for(const e of G.ents)if(e.alive&&!e.pick&&ov({x:a.x,y:a.y-2,w:a.w,h:a.h},e)){hurtFoe(e,a.deva?2:1,Math.sign(a.vx));a.life=0;sfx('athit');break}
  if(G.boss&&a.life>0&&G.boss.hp>0&&ov({x:a.x,y:a.y-2,w:a.w,h:a.h},G.boss)){hurtBoss(a.deva?2:1);a.life=0}
  for(const r of G.rocks)if(a.life>0&&r.alive&&Math.hypot(a.x-r.x,a.y-r.y)<10){r.alive=false;a.life=0;burst(r.x,r.y,'#6e6882',8);sfx('rock');G.score+=10}}
 G.arrowsF=G.arrowsF.filter(a=>a.life>0&&a.x>G.cam-20&&a.x<G.cam+VW+20);
 for(const e of G.ents){if(!e.alive)continue;if(Math.abs(e.x-p.x)>VW*0.9&&e.t!=='bird')continue;e.flash-=dt;
  if(e.pick){e.bob+=dt*4;if(ov(p,{x:e.x,y:e.y,w:e.w+4,h:e.h})){e.alive=false;G.taken.add(e.src);pickup(e)}continue}
  if(e.dying){e.dying-=dt;e.y+=e.vy*dt;e.vy+=500*dt;if(e.dying<=0)e.alive=false;continue}
  e.tm-=dt;
  if(e.t==='boar'){const d=p.x-e.x;
   if(e.st==='idle'){e.vx=e.face*TUNE.enemies.boar.walkSpeed;if(Math.random()<dt*0.5||e.wall||edge(e))e.face*=-1;if(Math.abs(d)<130&&Math.abs(p.y-e.y)<40){e.st='tell';e.tm=0.55;e.face=Math.sign(d)||1;e.vx=0}}
   else if(e.st==='tell'){e.vx=0;if(e.tm<=0){e.st='charge';e.tm=1.4}}
   else if(e.st==='charge'){e.vx=e.face*TUNE.enemies.boar.chargeSpeed;if(Math.random()<0.4)addP(e.x-e.face*12,e.y+e.h,-e.face*30,-20,'#8a7a6a',0.3);if(e.tm<=0||e.wall||edge(e)){e.st='rest';e.tm=0.9;e.vx=0}}
   else if(e.st==='rest'){e.vx=0;if(e.tm<=0)e.st='idle'}
   e.vy+=TUNE.grav*dt;moveBody(e,dt,false);if(e.y>LH)e.alive=false}
  else if(e.t==='bird'){if(Math.abs(e.x-p.x)>VW)continue;
   if(e.st==='idle'){e.x+=Math.sin(tt*1.3+e.home)*40*dt+e.face*-20*dt;e.y=e.base+Math.sin(tt*3+e.home)*6;if(Math.abs(p.x-e.x)<90&&e.tm<=0&&p.x<e.x+40){e.st='dive';const dx=p.x-e.x,dy=p.y+8-e.y,m=Math.hypot(dx,dy)||1;e.vx=dx/m*TUNE.enemies.bird.diveSpeed;e.vy=dy/m*TUNE.enemies.bird.diveSpeed;e.face=Math.sign(dx)}}
   else if(e.st==='dive'){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.y>p.y+10||e.y>(surf(Math.floor(e.x/T))*T-14)){e.st='rise';e.vy=-90;e.vx=e.face*60}}
   else if(e.st==='rise'){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.y<=e.base){e.st='idle';e.tm=1.6}}}
  else if(e.t==='cobra'){e.face=Math.sign(p.x-e.x)||-1;if(Math.abs(p.x-e.x)<160&&e.tm<=0){e.tm=2.2;e.st='spit';e.stT=0.3;sfx('spit');const vx=clamp((p.x-e.x)*0.9,-TUNE.enemies.cobra.spitSpeed,TUNE.enemies.cobra.spitSpeed);G.foes.push({x:e.x+e.face*6,y:e.y+4,vx,vy:-170,life:3,t:'venom'})}if(e.stT>0)e.stT-=dt;else e.st='idle'}
  else if(e.t==='guard'){const dx=p.x-e.x,dy=p.y-e.y;
   if(e.st==='wait'){if(Math.abs(dx)<120&&Math.abs(dy)<60){e.st='aim';e.tm=1.0;e.face=Math.sign(dx)||1}}
   else if(e.st==='aim'){e.tm-=dt;if(e.tm<=0){e.st='throw';e.tm=0.8;const spd=120;G.foes.push({x:e.x+e.face*8,y:e.y+8,vx:e.face*spd,vy:0,life:2.5,t:'spear'})}}
   else if(e.st==='throw'){e.tm-=dt;if(e.tm<=0)e.st='wait'}}
  if(e.alive&&!e.dying&&ov(p,e))hurtPlayer(Math.sign(p.x-e.x)||1)}
 for(const f of G.foes){f.vy+=420*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt;if(solid(Math.floor(f.x/T),Math.floor(f.y/T))){f.life=0;burst(f.x,f.y,'#62b81a',5,40)}if(f.life>0&&ov(p,{x:f.x,y:f.y-3,w:6,h:6})){f.life=0;hurtPlayer(Math.sign(f.vx)||1)}}G.foes=G.foes.filter(f=>f.life>0);
 updDog(dt);
 if(!G.bossOn&&!G.bossDone&&p.x>407*T){startBoss()}
 if(G.boss)updBoss(dt);
 for(const r of G.rocks){if(!r.alive)continue;r.vy+=(r.fall?520:360)*dt;r.x+=r.vx*dt;r.y+=r.vy*dt;r.rot+=dt*8;if(r.y>(surf(Math.floor(r.x/T))*T-6)||solid(Math.floor(r.x/T),Math.floor(r.y/T))){r.alive=false;burst(r.x,r.y,'#6e6882',8);sfx('thud');shake=2}
  if(r.alive&&ov(p,{x:r.x,y:r.y-6,w:12,h:12})){r.alive=false;hurtPlayer(Math.sign(r.vx)||1)}}G.rocks=G.rocks.filter(r=>r.alive);
 KP.jump=KP.shoot=KP.strike=0}
function par(img,f,y=0){const w=img.width;let x=-((G?G.cam:tt*20)*f)%w;if(x>0)x-=w;for(;x<VW;x+=w)ctx.drawImage(img,Math.round(x),y)}
function drawWorld0(){const cam=Math.round(G.cam);const sx=shake?(Math.random()-0.5)*shake:0,sy=shake?(Math.random()-0.5)*shake:0;
 ctx.drawImage(BG.sky,0,0);par(BG.far,0.12,0);
 const ruinA=clamp((G.cam-1800)/1500,0,1);if(ruinA>0){ctx.globalAlpha=ruinA;par(BG.ruin,0.3,6);ctx.globalAlpha=1}
 par(BG.mid,0.5,10);drawArena();ctx.globalAlpha=0.8;par(BG.shaft,0.6,0);ctx.globalAlpha=1;
 ctx.fillStyle='rgba(220,230,210,0.10)';ctx.fillRect(0,0,VW,VH);
 ctx.save();ctx.translate(Math.round(sx),Math.round(sy)+CAMY-12);
 ctx.drawImage(BG.level,cam,0,VW,LH,0,0,VW,LH);
 const X=v=>Math.round(v-cam);
 for(const ck of CHECKS){const lx=ck.c*T+2-cam;if(lx<-20||lx>VW+20)continue;ctx.drawImage(BG.lamp[ck.lit?1:0],lx,surf(ck.c)*T-30);if(ck.lit&&Math.random()<0.3)addP(ck.c*T+9,surf(ck.c)*T-30,(Math.random()-0.5)*10,-30,'#ffc061',0.5,-30)}
 if(G.bossOn){ctx.fillStyle='#30303e';ctx.fillRect(404*T-cam-2,0,6,LH);ctx.fillStyle='#6c6c84';ctx.fillRect(404*T-cam-1,0,1,LH)}
 for(const e of G.ents){if(!e.alive||!e.pick)continue;const ex=X(e.x),ey=Math.round(e.y+Math.sin(e.bob)*2);if(ex<-20||ex>VW+20)continue;
  const im=e.t==='orb'?IMG.orb[(tt*8|0)%4]:IMG[e.t];if(e.t==='orb'){ctx.globalAlpha=0.35;ctx.fillStyle='#fff2a0';ctx.beginPath();ctx.arc(ex,ey+2,10+Math.sin(tt*6)*2,0,7);ctx.fill();ctx.globalAlpha=1}ctx.drawImage(im,ex-im.width/2,ey-im.height/2+4)}
 const d=G.dog;{const run=Math.abs(d.vx)>10,fr=typeof dogFrame==='function'?dogFrame(d):run?String((d.t*14|0)%6):'sit'+((tt*3|0)%2);if(run){SQY=1+0.06*Math.sin(d.t*28);SQX=2-SQY}else{SQY=1+0.03*Math.sin(tt*4)}const im=spr('dog'+fr,()=>dogSprite(fr));drawS(im,X(d.x),Math.round(d.y)+15,d.face<0,false);
  if(d.barkT>0)txt('!',X(d.x)+d.face*8,d.y-12,'#ffe070','c')}
 for(const e of G.ents){if(!e.alive||e.pick)continue;const ex=X(e.x);if(ex<-40||ex>VW+40)continue;let im;
  if(e.t==='boar'){const fr=e.st==='tell'?'tell':e.st==='charge'?'c'+((tt*14|0)%4):e.vx?'r'+((tt*7|0)%4):'idle';im=spr('boar'+fr,()=>boarSprite(fr));if(e.st==='tell'&&(tt*16|0)%2)drawExcl(ex,e.y-10)}
  else if(e.t==='bird'){const fr=e.st==='dive'?'d':String((tt*10|0)%4);im=spr('bird'+fr,()=>birdSprite(fr))}
  else if(e.t==='guard'){const fr=e.st==='aim'?'aim':e.st==='throw'?'throw':'idle';im=spr('guard'+fr,()=>guardSprite(fr))}
  else{im=foeImg(e)}
  {const w=Math.sin(tt*5+e.x*0.1);SQY=1+0.05*w;SQX=1-0.04*w;if(e.st==='charge'){SQX=1.12;SQY=0.92}}drawS(im,ex,Math.round(e.y+e.h),e.face<0,e.flash>0,e.dying?1:0)}
 const b=G.boss;if(b){const fr=b.st==='tell'?'tell':b.st==='charge'?'r'+((tt*12|0)%4):b.st==='wind'||b.st==='throw'?'throw':b.st==='stun'?'stun':'i'+((tt*2|0)%2);const im=(typeof vakaRig==='function'&&vakaRig(b))||spr('vaka'+fr,()=>vakaSprite(fr));
  if(b.st==='tell'&&(tt*14|0)%2)drawExcl(X(b.x),b.y-14);if(b.st==='stun')for(let i=0;i<3;i++){const a=tt*4+i*2.1;ctx.fillStyle='#ffe070';ctx.fillRect(X(b.x)+Math.cos(a)*12+b.face*6,b.y+2+Math.sin(a)*3,2,2)}
  {const w=Math.sin(tt*2.6);SQY=1+0.03*w;SQX=1-0.02*w;if(b.st==='charge'){SQX=1.08;SQY=0.94}if(im.rig){SQX=1;SQY=1}}drawS(im,X(b.x),Math.round(b.y+b.h)+2,b.face<0,b.flash>0&&!im.rig,b.st==='die'?((tt*10|0)%2):0)}
 const p=G.p;if(!(p.inv>0&&!p.dead&&(tt*20|0)%2)){const deva=p.deva>0;let fr;
  if(p.dead||p.act==='hurt')fr='hurt';else if(p.act)fr=p.act;else if(!p.ground)fr=p.vy<0?'jump':'fall';else if(Math.abs(p.vx)>8)fr='run'+((p.anim*2.1|0)%8);else fr='idle'+((tt*4|0)%4);
  const im=getHero(fr,deva);if(deva){ctx.globalAlpha=0.3+Math.sin(tt*10)*0.1;ctx.fillStyle='#fff2a0';ctx.beginPath();ctx.ellipse(X(p.x),p.y+p.h/2,16,20,0,0,7);ctx.fill();ctx.globalAlpha=1}
  heroSq(p);drawS(im,X(p.x),Math.round(p.y+p.h)+(deva?2:2),p.face<0,false)}
 for(const a of G.arrowsF){ctx.save();ctx.translate(X(a.x),Math.round(a.y));if(a.vx<0)ctx.scale(-1,1);if(a.deva){ctx.fillStyle='rgba(255,240,160,0.6)';ctx.fillRect(-14,0,14,2)}ctx.drawImage(IMG.arrow,-8,-2);ctx.restore()}
 for(const f of G.foes){if(f.t==='spear')ctx.drawImage(IMG.spear,X(f.x)-6,Math.round(f.y)-3);else ctx.drawImage(IMG.venom,X(f.x)-3,Math.round(f.y)-3);}
 for(const r of G.rocks){ctx.save();ctx.translate(X(r.x),Math.round(r.y));ctx.rotate(Math.round(r.rot*2)/2);ctx.drawImage(IMG.rock,-7,-7);ctx.restore();if(r.fall&&r.y<20){ctx.fillStyle='rgba(13,7,16,0.5)';ctx.fillRect(X(r.x)-5,surf(Math.floor(r.x/T))*T-2,10,2)}}
 for(const q of parts){ctx.globalAlpha=Math.min(1,q.life/q.max*1.5);ctx.fillStyle=q.col;ctx.fillRect(Math.round(q.x-cam),Math.round(q.y),q.sz,q.sz)}ctx.globalAlpha=1;
 ctx.restore();
 ctx.globalAlpha=0.9;par(BG.near,1.35,0);par(BG.fringe,1.2,0);ctx.globalAlpha=1;
 if(flash>0){ctx.globalAlpha=Math.min(0.5,flash);ctx.fillStyle=G.p.deva>0?'#fff2c0':'#ff3030';ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=1}}
function render(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);
 if(state==='title'){drawTitle();return}
 drawWorld();drawHUD();if(state==='pause'){ctx.fillStyle='rgba(6,4,12,0.55)';ctx.fillRect(0,0,VW,VH);txt('PAUSED',VW/2,70,['#fff2a0','#f2c632','#ee8a1c'],'c',16,'serif');txt('P / Esc or the PAUSE button to resume',VW/2,96,'#efeae0','c',7)}
 if(state==='win')drawCard(true);if(state==='over')drawCard(false)}
function start(){audioInit();if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();sfx('sel');newGame();state='play';music('stage',0.8);toast('Year One. Exiled, Vel sets out on the temple road with a bow, a sword and a loyal dog.',3.6)}
function pressStart(){audioInit();if(AU.ctx&&AU.ctx.state==='suspended'&&state!=='pause')AU.ctx.resume();if(state==='title')start();else if((state==='win'||state==='over')&&tt>1.2){state='title';tt=0;musicStop()}}
function pause(on){if(state!=='play'&&state!=='pause')return;if(on===(state==='pause'))return;state=on?'pause':'play';if(AU.ctx){on?AU.ctx.suspend():AU.ctx.resume()}if(REM.cur){if(on)REM.cur.pause();else REM.cur.play().catch(()=>{})}hooks.onPause(on);if(!on)sfx('blip')}
function onVis(){if(document.hidden&&state==='play')pause(true)}
document.addEventListener('visibilitychange',onVis);
let last=performance.now(),raf=0;
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;if(state!=='pause')update(dt);render();raf=requestAnimationFrame(frame)}
/* ===== Batch 2: settings, sword + beam, spin attack, Deva theme, dog, temple art, new foes ===== */
const BLANK=mk(1,1);
function update(dt){let c0=0,s0=0,j0=0;const live=state==='play'&&G&&!G.p.dead;
 if(live){const p=G.p;if(!G.beams)G.beams=[];if(S.inf)p.arrows=Math.max(p.arrows,TUNE.quiverMax);BUF.shoot-=dt;BUF.strike-=dt;
  if(BUF.shoot>0&&p.cd<=0)KP.shoot=1;if(BUF.strike>0&&p.scd<=0)KP.strike=1;c0=p.cd;s0=p.scd;j0=p.jumps}
 update0(dt);
 if(!live||state!=='play')return;const p=G.p;if(p.dead){p.spin=0;return}
 if(p.cd>c0)BUF.shoot=0;if(p.scd>s0){BUF.strike=0;BUF.shoot=0}
 if(p.jumps===2&&j0<2){p.spin=0.5;p.spinA=0;G.spinId=(G.spinId||0)+1;sfx('spin')}
 if(p.spin>0){p.spin-=dt;p.spinA+=dt*p.face*22;if(p.ground)p.spin=0;else spinHits(p)}
 for(const m of G.beams){m.x+=m.vx*dt;m.life-=dt;if(solid(Math.floor(m.x/T),Math.floor(m.y/T)))m.life=0;const box={x:m.x,y:m.y-6,w:14,h:12};
  for(const e of G.ents)if(m.life>0&&e.alive&&!e.pick&&!e.dying&&ov(box,e)){hurtFoe(e,2,Math.sign(m.vx));m.life=0;burst(m.x,m.y,'#bfe8ff',6,60)}
  const b=G.boss;if(m.life>0&&b&&b.hp>0&&ov(box,b)){hurtBoss(2);m.life=0;burst(m.x,m.y,'#bfe8ff',6,60)}
  for(const f of G.foes)if(ov(box,{x:f.x,y:f.y-3,w:6,h:6}))f.life=0;
  if(Math.random()<0.5)addP(m.x-Math.sign(m.vx)*6,m.y+(Math.random()-0.5)*8,0,0,m.deva?'#ffe070':'#bfe8ff',0.2,0)}
 G.beams=G.beams.filter(m=>m.life>0&&m.x>G.cam-30&&m.x<G.cam+VW+30);
 for(const e of G.ents){if(!e.alive||e.pick||e.dying||Math.abs(e.x-p.x)>VW)continue;const dx=p.x-e.x;
  if(e.t==='imp'){e.vy+=TUNE.grav*dt;moveBody(e,dt,false);if(e.ground){e.vx*=0.8;if(e.tm<=0&&Math.abs(dx)<170){e.face=Math.sign(dx)||1;e.vy=-190-Math.random()*60;e.vx=e.face*(TUNE.enemies.imp.hopSpeed+Math.random()*30);e.tm=0.7+Math.random()*0.5}}if(e.y>LH)e.alive=false}
  else if(e.t==='vetala'){if(e.st==='hang'){e.y=e.hy+Math.sin(tt*2+e.home)*2;e.face=Math.sign(dx)||1;if(Math.abs(dx)<44){e.st='drop';e.vy=0;sfx('spit')}}
   else{e.vy+=TUNE.grav*dt;if(e.st==='walk'){e.face=Math.sign(dx)||1;e.vx=e.face*TUNE.enemies.vetala.walkSpeed}else e.vx=0;moveBody(e,dt,false);if(e.ground&&e.st==='drop'){e.st='walk';burst(e.x,e.y+e.h,'#b0a890',6,50);sfx('thud')}if(e.y>LH)e.alive=false}}
  else if(e.t==='cobra')e.y=e.base+Math.sin(tt*2.4+e.home)*3}
 const want=p.deva>0?'deva':G.bossOn&&G.boss?'boss':'stage';music(want)}
function drawWorld(){drawWorld0();if(!G)return;const cam=Math.round(G.cam),X=v=>Math.round(v-cam),p=G.p;ctx.save();ctx.translate(0,CAMY-12);
 for(const e of G.ents)if(e.alive&&e.t==='vetala'&&e.st==='hang'){const ex=X(e.x);if(ex>-20&&ex<VW+20){ctx.fillStyle='#3a2a1a';ctx.fillRect(ex,0,1,Math.round(e.y)-4)}}
 for(const m of G.beams||[]){ctx.save();ctx.translate(X(m.x),Math.round(m.y));ctx.scale(Math.sign(m.vx),1);ctx.globalAlpha=Math.min(1,m.life*3);ctx.fillStyle=m.deva?'#ffe070':'#7fd4ff';
  ctx.beginPath();ctx.ellipse(0,0,7,10,0,-Math.PI/2,Math.PI/2);ctx.ellipse(-3,0,4,8,0,Math.PI/2,-Math.PI/2,true);ctx.fill();ctx.fillStyle='#ffffff';ctx.fillRect(2,-6,2,12);ctx.restore()}
 if(p.act&&p.act.startsWith('strike')&&!(p.spin>0)&&!p.dead){const r0=TUNE.reach[weapon()]*0.75,cx=X(p.x)+p.face*4,cy=Math.round(p.y+p.h/2-2);ctx.globalAlpha=Math.min(0.8,p.actT*4);ctx.strokeStyle=p.deva>0?'#ffe070':'#e8f6ff';ctx.lineWidth=3;ctx.beginPath();
  if(p.face>0)ctx.arc(cx,cy,r0,-1.3,0.9);else ctx.arc(cx,cy,r0,Math.PI-0.9,Math.PI+1.3);ctx.stroke();ctx.globalAlpha=1}
 if(p.spin>0&&!p.dead&&!(p.inv>0&&(tt*20|0)%2)){const dv=p.deva>0,cx=X(p.x),cy=Math.round(p.y+p.h/2),a=p.spinA,Rr=dv?34:28;
  const body=spr('hbody'+(dv?'d':''),()=>{const c=heroSprite0('jump',dv);if(!dv)return c;const b=mk(40,50);b.getContext('2d').drawImage(c,0,0,40,50);return b});
  ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=0.55;ctx.strokeStyle=dv?'#ffe070':'#dff4ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,Rr-5,Math.min(a,a-2.4*p.face),Math.max(a,a-2.4*p.face));ctx.stroke();ctx.globalAlpha=1;
  ctx.rotate(a);if(p.face<0)ctx.scale(-1,1);ctx.drawImage(body,-(body.width/2|0),-(body.height/2|0)-2);const sw=IMG.sword[dv?1:0];ctx.drawImage(sw,4,-3);ctx.restore()}
 const d=G.dog;if(d.barkT>0){const bx=X(d.x)+d.face*12,by=Math.round(d.y)+4;ctx.strokeStyle='#ffe070';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.globalAlpha=clamp(d.barkT*2-i*0.25,0,1);ctx.beginPath();
  if(d.face>0)ctx.arc(bx,by,4+i*4,-0.7,0.7);else ctx.arc(bx,by,4+i*4,Math.PI-0.7,Math.PI+0.7);ctx.stroke()}ctx.globalAlpha=1}
 ctx.restore()}
/* v3: cartoon (SFA-inspired) sprites + squash/stretch */
let SQX=1,SQY=1;const HS={g:true,land:0};
function drawS(im,cx,by,flip,white,fade){const w=im.width,h=im.height;ctx.save();if(fade)ctx.globalAlpha=0.6;ctx.translate(cx,by);ctx.scale((flip?-1:1)*SQX,SQY);ctx.drawImage(white?whiteOf(im):im,-(w/2|0),-h);ctx.restore();SQX=1;SQY=1}


