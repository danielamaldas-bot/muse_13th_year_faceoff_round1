// Vaka (the Stage 1 boss).
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
function hurtBoss(d){const b=G.boss;if(b.st==='intro'||b.hp<=0)return;b.hp-=d;b.flash=0.12;sfx('bhit');G.score+=20;burst(b.x,b.y+30,'#ffffff',5,70);
 if(!b.orb&&b.hp<=TUNE.bossHP/2){b.orb=true;b.phase=2;G.ents.push(spawn({t:'orb',c:Math.floor(G.p.x/T)<414?419:409,row:4}));toast('A Deva orb falls from the canopy!',2.5);sfx('roar')}
 if(b.hp<=0){b.st='die';b.tm=2.4;sfx('bdie');shake=10;G.score+=5000}}
function updBoss(dt){const b=G.boss,p=G.p;b.tm-=dt;b.flash-=dt;b.anim+=dt;const ph2=b.phase===2;const floor=gnd(Math.floor(b.x/T))*T;
 if(b.st==='die'){if(Math.random()<0.5)burst(b.x+(Math.random()-0.5)*40,b.y+Math.random()*60,Math.random()<0.5?'#f2c632':'#e03a3a',3,80);if(b.tm<=0){G.boss=null;G.bossDone=true;state='win';tt=0;musicStop();sfx('win')}return}
 if(b.st==='intro'){if(b.tm<=0){b.st='idle';b.tm=1}}
 else if(b.st==='idle'){b.face=Math.sign(p.x-b.x)||-1;b.vx=Math.abs(p.x-b.x)>70?b.face*TUNING.anim.bossWalk:0;if(b.tm<=0){b.st=Math.random()<0.55?'tell':'wind';b.tm=b.st==='tell'?(ph2?0.65:0.85):(ph2?0.55:0.7);if(b.st==='tell')sfx('roar')}}
 else if(b.st==='tell'){b.vx=0;if(b.tm<=0){b.st='charge';b.tm=2}}
 else if(b.st==='charge'){b.vx=b.face*(ph2?260:220);if(Math.random()<0.6)addP(b.x-b.face*20,floor,-b.face*40,-40,'#8a7a6a',0.4);const nx=b.x+b.vx*dt;if(nx<405*T+20||nx>422*T-20||b.tm<=0){b.st='stun';b.tm=1.4;shake=7;sfx('thud');b.vx=0;
   for(let i=0;i<(ph2?4:3);i++)G.rocks.push({x:(406+Math.random()*16)*T,y:-10-i*30,vx:0,vy:0,rot:0,alive:true,fall:true})}}
 else if(b.st==='stun'){b.vx=0;if(b.tm<=0){b.st='idle';b.tm=ph2?0.6:1}}
 else if(b.st==='wind'){b.vx=0;b.face=Math.sign(p.x-b.x)||-1;if(b.tm<=0){const n=ph2?3:1;for(let i=0;i<n;i++){const tx=p.x+(i-(n-1)/2)*30,dx=tx-b.x,tm=0.9;G.rocks.push({x:b.x+b.face*20,y:b.y+8,vx:dx/tm,vy:-200,rot:0,alive:true})}sfx('rock');b.st='throw';b.tm=0.4}}
 else if(b.st==='throw'){if(b.tm<=0){b.st='idle';b.tm=ph2?0.9:1.3}}
 b.x+=(b.vx||0)*dt;b.x=clamp(b.x,405*T+20,422*T-20);b.y=floor-b.h;
 if(b.st!=='intro'&&b.st!=='stun'&&ov(p,{x:b.x,y:b.y+10,w:b.w,h:b.h-10}))hurtPlayer(Math.sign(p.x-b.x)||1);
 if(p.arrows<6&&p.deva<=0){G.resup-=dt;if(G.resup<=0){G.resup=7;G.ents.push(spawn({t:'quiver',c:Math.floor(p.x/T)<414?418:409,row:5}))}}}
function startBoss(){G.bossOn=true;G.boss={x:419*T,y:gnd(419)*T-96,w:52,h:96,hp:TUNE.bossHP,face:-1,st:'intro',tm:2.2,vx:0,flash:0,anim:0,orb:false,phase:1};sfx('roar');shake=8;
 toast('Vaka, armored rakshasa of the temple, blocks the way!',3.2)}
