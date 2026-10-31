// Vel (player) and the dog companion: weapons, damage, death, pickups.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
function startLife(first){const c=G.check;const p={x:c*T+4,y:(surf(c)*T)-24,vx:0,vy:0,w:10,h:22,face:1,ground:false,coy:0,buf:0,jumps:0,hp:TUNE.hearts,inv:first?0:1.5,arrows:Math.max(TUNE.quiver0,G.arrows||0),cd:0,scd:0,act:null,actT:0,deva:0,anim:0,hurtT:0,dead:false};
 G.p=p;G.cam=Math.max(0,p.x-120);G.dog={x:p.x-20,y:p.y+10,vx:0,vy:0,face:1,state:'follow',t:0,bark:0,away:0};
 G.ents=ENT0.filter(e=>!(G.taken&&G.taken.has(e))).map(e=>spawn(e));G.arrowsF=[];G.foes=[];G.rocks=[];G.boss=null;G.bossOn=false;G.bossDone=false;G.resup=7;
 if(!G.taken)G.taken=new Set();
 if(state!=='title')music('stage')}
function doStrike0(){const p=G.p;if(p.scd>0)return;const w=weapon();p.scd=TUNE.strikeCD;p.act=p.act==='strike0'?'strike1':'strike0';p.actT=0.2;sfx(w==='staff'?'staff':'sword');
 const reach=TUNE.reach[w],dmg=TUNE.dmg[w],box={x:p.x+p.face*reach/2,y:p.y-4,w:reach,h:p.h+8};
 for(const e of G.ents)if(e.alive&&!e.pick&&!e.dying&&ov(box,e))hurtFoe(e,dmg,p.face);
 for(const r of G.rocks)if(r.alive&&ov(box,{x:r.x,y:r.y-6,w:12,h:12})){r.alive=false;burst(r.x,r.y,'#6e6882',8);sfx('rock');G.score+=10}
 for(const f of G.foes)if(ov(box,{x:f.x,y:f.y-3,w:6,h:6}))f.life=0;
 if(G.boss&&G.boss.hp>0&&ov(box,G.boss))hurtBoss(dmg);
 for(let i=0;i<5;i++)addP(p.x+p.face*(8+i*reach/6),p.y+6+i*2,p.face*40,-10,w==='great'?'#ffe070':'#efeae0',0.18,0)}
function hurtPlayer0(dir){const p=G.p;if(p.inv>0||p.dead)return;p.hp-=TUNE.heartsLostPerHit;p.inv=TUNE.inv;p.hurtT=0.25;p.vx=dir*140;p.vy=-180;p.act='hurt';p.actT=0.3;sfx('hurt');shake=4;flash=0.4;
 G.dog.state='rush';
 if(p.hp<=0)die()}
function pitFall0(){const p=G.p;p.hp-=1;sfx('hurt');flash=0.5;if(p.hp<=0){die();return}
 let c=Math.floor(p.x/T);for(let i=0;i<20;i++){const cc=c-i*Math.sign(p.vx||1);if(surf(cc)<ROWS&&surf(cc+1)<ROWS&&surf(cc-1)<ROWS){c=cc;break}}
 p.x=c*T+8;p.y=surf(c)*T-p.h-2;p.vx=0;p.vy=0;p.inv=1.5;toast('A fall costs a heart - never a life.',2);G.dog.x=p.x-16;G.dog.y=p.y}
function die(){const p=G.p;if(p.dead)return;p.dead=true;p.deadT=1.6;p.vy=-240;sfx('lose');musicStop()}
function afterDeath(){G.lives--;G.arrows=G.p.arrows;if(G.lives<=0){state='over';tt=0;return}
 const wasBoss=G.bossOn;startLife(false);if(wasBoss)toast('Vel rises again. Patience.',2.5)}
function pickup(e){const p=G.p;burst(e.x,e.y,'#ffe070',8,60);
 if(e.t==='mango'){G.score+=50;sfx('pick')}
 else if(e.t==='heart'){p.hp=Math.min(TUNE.hearts,p.hp+1);sfx('heart');G.score+=50}
 else if(e.t==='quiver'){p.arrows=Math.min(TUNE.quiverMax,p.arrows+TUNE.pack);sfx('ammo');toast('+'+TUNE.pack+' arrows',1.4)}
 else if(e.t==='orb'){p.deva=TUNE.deva;sfx('devaOn');flash=0.8;toast('Deva light! Great sword and endless arrows for 30 seconds.',3)}}
function weapon(){return G.p.deva>0?'great':'sword'}
function hurtPlayer(dir){if(S.inv)return;hurtPlayer0(dir)}
function pitFall(){pitFall0()}
function doStrike(){const p=G.p;if(p.scd>0)return;doStrike0();if(p.hp>=TUNE.hearts){(G.beams||(G.beams=[])).push({x:p.x+p.face*16,y:p.y+p.h/2-2,vx:p.face*250,life:0.8,deva:p.deva>0});sfx('beam')}}
function spinHits(p){const cx=p.x,cy=p.y+p.h/2,R0=p.deva>0?34:28,dmg=TUNE.dmg[weapon()];
 for(const e of G.ents)if(e.alive&&!e.pick&&!e.dying&&e.spinId!==G.spinId&&Math.hypot(e.x-cx,e.y+e.h/2-cy)<R0+Math.max(e.w,e.h)/2){e.spinId=G.spinId;hurtFoe(e,dmg,Math.sign(e.x-cx)||1)}
 for(const r of G.rocks)if(r.alive&&Math.hypot(r.x-cx,r.y-cy)<R0+6){r.alive=false;burst(r.x,r.y,'#6e6882',8);sfx('rock');G.score+=10}
 for(const f of G.foes)if(Math.hypot(f.x-cx,f.y-cy)<R0)f.life=0;
 const b=G.boss;if(b&&b.hp>0&&b.spinId!==G.spinId&&ov({x:cx,y:cy-R0,w:R0*2,h:R0*2},b)){b.spinId=G.spinId;hurtBoss(dmg)}
 if(Math.random()<0.7){const a=p.spinA;addP(cx+Math.cos(a)*R0*0.8,cy+Math.sin(a)*R0*0.8,0,0,p.deva>0?'#ffe070':'#dff4ff',0.2,0)}}
function updDog(dt){const d=G.dog,p=G.p;d.t+=dt;d.bark-=dt;d.ap=(d.ap||0)+dt*Math.abs(d.vx)/9;d.w=14;d.h=14;d.acd=(d.acd||0)-dt;if(d.barkT>0)d.barkT-=dt;
 let tx=p.x-p.face*22,foe=null;
 for(const e of G.ents)if(e.alive&&!e.pick&&!e.dying&&e.st!=='hang'&&Math.abs(e.x-d.x)<100&&Math.abs(e.y-d.y)<60){foe=e;break}
 if(!foe&&d.bark<=0&&d.ground&&Math.random()<dt*TUNING.dog.idleBarkRate){d.bark=5+Math.random()*4;sfx('bark');d.barkT=0.6}
 if(foe&&d.bark<=0){d.bark=TUNING.dog.barkGap+Math.random()*2;sfx('bark');d.barkT=0.6;d.face=Math.sign(foe.x-d.x)||1}
 if(d.state==='atk'){d.at-=dt;if(d.tgt&&d.tgt.alive&&!d.tgt.dying&&!d.hit&&ov(d,d.tgt)){d.hit=true;hurtFoe(d.tgt,1,d.face);sfx('bite')}if(d.at<=0||(d.hit&&d.ground))d.state='follow'}
 else if(foe&&d.acd<=0&&d.ground&&Math.abs(foe.x-d.x)<TUNING.dog.attackRange&&Math.random()<dt*TUNING.dog.attackRate){d.state='atk';d.tgt=foe;d.hit=false;d.at=0.7;d.acd=TUNING.dog.attackCooldown+Math.random()*2;d.face=Math.sign(foe.x-d.x)||1;d.vx=d.face*190;d.vy=-210;d.barkT=0.4;sfx('bark')}
 else{if(d.state==='rush'){tx=p.x-p.face*12;if(Math.abs(d.x-tx)<10)d.state='follow'}const dx=tx-d.x;d.vx=Math.abs(dx)<6?0:clamp(dx*4,-170,170);if(d.vx)d.face=Math.sign(d.vx);
  if(d.ground&&(d.wall||(Math.abs(dx)>30&&p.y<d.y-20)))d.vy=-320}
 d.vy=Math.min(TUNE.maxFall,d.vy+TUNE.grav*dt);moveBody(d,dt,true);
 if((Math.abs(d.x-p.x)>VW*0.6||d.y>LH)&&p.ground){d.x=p.x-16*p.face;d.y=p.y+p.h-d.h;d.vx=0;d.vy=0;d.state='follow';burst(d.x,d.y+8,'#cdd0d8',6,40)}}