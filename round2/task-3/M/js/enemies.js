// Regular enemies: spawning and damage.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
function spawn0(e){const x=e.c*T+8,top=surf(e.c)*T;const o={src:e,t:e.t,x,y:top,vx:0,vy:0,face:-1,hp:1,st:'idle',tm:0,alive:true,flash:0,home:x};
 if(e.t==='boar'){o.hp=TUNE.enemies.boar.hp;o.w=26;o.h=16;o.y=top-16}
 else if(e.t==='bird'){o.hp=TUNE.enemies.bird.hp;o.w=16;o.h=10;o.y=30+((e.c*13)%30);o.base=o.y}
 else if(e.t==='cobra'){o.hp=TUNE.enemies.cobra.hp;o.w=12;o.h=20;o.y=top-20;o.tm=1+((e.c%5)*0.3)}
 else if(e.t==='statue'){o.hp=TUNE.enemies.statue.hp;o.w=14;o.h=28;o.y=(e.row?e.row*T:top)-28}
 else{o.w=12;o.h=12;o.y=(e.row||5)*T;o.pick=true;o.bob=Math.random()*6}
 return o}
function edge(e){const c=Math.floor((e.x+e.face*(e.w/2+2))/T),r=Math.floor((e.y+e.h+2)/T);return!solid(c,r)&&tileAt(c,r)!==2}
function hurtFoe(e,d,dir){e.hp-=d;e.flash=0.12;burst(e.x,e.y+e.h/2,'#ffffff',4,60);if(e.hp<=0){e.dying=0.5;e.vy=-160;e.st='dead';sfx('edie');G.score+=e.t==='boar'?150:e.t==='cobra'?120:100;burst(e.x,e.y+e.h/2,'#f2c632',10)}else{sfx('ehit');if(e.t==='boar'){e.x+=dir*4}}}
function spawn(e){const o=spawn0(e),top=surf(e.c)*T;
 if(e.t==='boar'){o.w=22;o.h=24;o.y=top-24}
 else if(e.t==='cobra'){o.w=14;o.h=22;o.y=top-32;o.base=o.y}
 else if(e.t==='imp'){o.pick=false;o.hp=TUNE.enemies.imp.hp;o.w=12;o.h=14;o.y=top-14}
 else if(e.t==='vetala'){o.pick=false;o.hp=TUNE.enemies.vetala.hp;o.w=12;o.h=22;o.st='hang';o.y=34+((e.c*7)%14);o.hy=o.y}
 else if(e.t==='statue'){o.pick=false;}
 return o}