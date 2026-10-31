// anim.js: smooth animation layer on top of art.js (tweened frames from frames.json),
// Vaka skeletal rig (vaka_parts.png + frames.json "vakaRig"), dog keys, and the SFX remix.
ART_FILES.push('vaka_parts');
// --- Vel: 8-frame run (rn0-7), jump rise/apex/fall, landing squash ---
velKey=function(fr,deva){const F=ART.fr&&ART.fr.vel||{};
 if(fr==='land'&&F.land)return'land';if(fr.startsWith('idle'))return'idle';
 if(fr.startsWith('run'))return F.rn0?'rn'+(+fr.slice(3)%8):(+fr.slice(3)<4?'run1':'run2');
 if(fr.startsWith('j_'))return F[fr.slice(2)]?fr.slice(2):'jump';
 if(fr==='jump'||fr==='fall')return'jump';if(fr==='shoot')return'aim';if(fr.startsWith('strike'))return deva?'strikeD':'strike';if(fr==='hurt')return'hurt';return'idle'};
const _getHeroA=getHero;
getHero=function(fr,deva){const p=G&&G.p;
 if(p&&(fr==='jump'||fr==='fall'))fr='j_'+(p.vy<-TUNING.anim.apexVy?'rise':p.vy>TUNING.anim.apexVy?'fall':'apex');
 else if(p&&fr.startsWith('idle')&&HS.land>0.3)fr='land';
 return _getHeroA(fr,deva)};
// --- Dog: 6-frame run (r0-5), sit breathing, leap (attack) and bark ---
dogSprite=function(fr){if(!ART.im.dog)return _dogSprite(fr);const F=ART.fr.dog||{};
 const k=fr==='leap'?(F.leap?'leap':'bark'):fr==='bark'?'bark':fr==='sit1'&&F.sitb?'sitb':fr.startsWith('sit')?'sit':F.r0?'r'+(+fr%6):(+fr<3?'run1':'run2');
 const f=artFrame('dog',k);return f?artPlace(f,30,22):_dogSprite(fr)};
function dogFrame(d){const run=Math.abs(d.vx)>10;
 if(d.state==='atk'||(!d.ground&&Math.abs(d.vy)>60))return'leap';if(d.barkT>0)return'bark';
 return run?String((d.ap|0)%6):'sit'+((tt*1.6|0)%2)}
// --- Boar: 4-frame walk (w0-3) and 4-frame charge gallop (c0-3) ---
boarSprite=function(fr){if(!ART.im.boar)return _boarSprite(fr);const F=ART.fr.boar||{};let k;
 if(fr==='idle')k='stand';else if(fr==='tell')k=F.c0?'c0':'charge';else if(fr[0]==='c')k=F.c0?fr:'charge';else k=F.w0?'w'+fr[1]:(+fr[1]%2?'charge':'stand');
 const f=artFrame('boar',k);if(!f)return _boarSprite(fr);const c=artPlace(f,44,30);return fr==='tell'?artTint(c,'#ff3020',0.25):c};
// --- Hawk: 4 flap frames (f0-3) + dive ---
birdSprite=function(fr){if(!ART.im.hawk)return _birdSprite(fr);const F=ART.fr.hawk||{};
 const k=fr==='d'?(F.dv?'dv':'down'):F.f0?'f'+(+fr%4):(fr==='0'?'up':'down');const f=artFrame('hawk',k);return f?artPlace(f,36,30):_birdSprite(fr)};
// --- Vaka skeletal rig. Parts are cut from Daniel's Vaka art, pivots in sprite coords (83x106). ---
const RIG={c:null,w:null,W:160,H:150};
function rigPose(b){const t=tt,st=b.st,D=Math.PI/180,P={bob:0,rx:0,lean:0,head:0,jaw:0,uL:4,fL:0,hL:0,uR:-4,fR:0,hR:0,legL:0,legR:0,liftL:0,liftR:0,loin:0};
 const walk=Math.abs(b.vx||0)>5,ph=b.x/(st==='charge'?7:10),s=Math.sin(ph),c=Math.cos(ph),br=Math.sin(t*2.2);
 if(walk){P.legL=(st==='charge'?24:15)*s;P.legR=-P.legL;P.liftL=Math.max(0,c)*3;P.liftR=Math.max(0,-c)*3;P.bob=-Math.abs(s)*2+1;P.uL=4-10*s;P.uR=-4-10*s;P.fL=-8;P.fR=8;P.loin=-P.legL*0.3;P.head=s*2}
 else{P.bob=br;P.uL=4+br*3;P.uR=-4-br*3;P.fL=-br*3;P.fR=br*3;P.head=br*1.5;P.jaw=Math.max(0,br)*4}
 const k=x=>Math.max(0,Math.min(1,x));
 if(st==='tell'||st==='intro'){const q=k(1.5-(b.tm||0)*1.5);P.head=-8+Math.sin(t*40)*2;P.jaw=24*Math.max(q,0.6);P.uL=70;P.fL=-55;P.hL=-20;P.uR=-70;P.fR=55;P.hR=20;P.rx=Math.sin(t*55);P.bob=-1;P.lean=-4}
 else if(st==='charge'){P.lean=16;P.uL=-35;P.uR=-50;P.fL=-30;P.fR=-25;P.head=10;P.jaw=12}
 else if(st==='wind'){const q=k(1-(b.tm||0)/0.7);P.uR=-155*q;P.fR=-35*q;P.hR=-20*q;P.lean=-8*q;P.uL=25*q;P.fL=-30*q;P.head=-6*q;P.jaw=10*q}
 else if(st==='throw'){const q=k(1-(b.tm||0)/0.4),e=1-Math.pow(1-q,3);P.uR=-155+130*e;P.fR=-35+20*e;P.lean=-8+20*e;P.uL=25-85*Math.sin(q*Math.PI);P.fL=-30+10*q;P.hL=-25*Math.sin(q*Math.PI);P.head=8*e;P.jaw=16;P.bob=2*e}
 else if(st==='stun'){P.lean=7+Math.sin(t*3)*4;P.head=20+Math.sin(t*4)*7;P.jaw=10;P.uL=-4;P.uR=4;P.fL=12;P.fR=-12;P.bob=3}
 else if(st==='die'){P.lean=-10+Math.sin(t*6)*6;P.head=28;P.jaw=22;P.uL=30;P.uR=-30;P.bob=4}
 if(b.flash>0&&st!=='die'){const f=Math.min(1,b.flash*4);P.rx-=3*f;P.lean-=10*f;P.head-=10*f;P.jaw=Math.max(P.jaw,18*f)}
 for(const n in P)if(!/bob|rx|lift/.test(n))P[n]*=D;return P}
function vakaRig(b){const R=ART.fr&&ART.fr.vakaRig,im=ART.im.vaka_parts;if(!R||!im||!TUNING.anim.bossRig)return null;
 if(!RIG.c){RIG.c=mk(RIG.W,RIG.H);RIG.w=mk(RIG.W,RIG.H);RIG.c.rig=RIG.w.rig=true}
 const c=RIG.c,x=c.getContext('2d'),P=rigPose(b),ox=(RIG.W-83)/2|0,oy=RIG.H-106;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,RIG.W,RIG.H);
 const pt=R.parts;function part(n,rot,pre){const q=pt[n];if(!q)return;x.save();if(pre)pre();const pv=q.p;x.translate(pv[0],pv[1]);x.rotate(rot||0);x.translate(-pv[0],-pv[1]);x.drawImage(im,q.r[0],q.r[1],q.r[2],q.r[3],q.o[0],q.o[1],q.r[2],q.r[3])}
 const end=()=>x.restore();x.translate(ox,oy);
 part('legL',P.legL,()=>x.translate(0,-P.liftL));end();part('legR',P.legR,()=>x.translate(0,-P.liftR));end();
 part('torso',P.lean,()=>x.translate(P.rx,P.bob));
  part('loin',P.loin);end();part('head',P.head);part('jaw',P.jaw);end();end();
  part('upperL',P.uL);part('foreL',P.fL);part('handL',P.hL);end();end();end();
  part('upperR',P.uR);part('foreR',P.fR);part('handR',P.hR);end();end();end();
 end();x.setTransform(1,0,0,1,0,0);
 if(b.st==='tell')artTint(c,'#ff2010',0.25);else if(b.st==='stun')artTint(c,'#a0a0ff',0.2);
 if(b.flash>0){const w=RIG.w.getContext('2d');w.clearRect(0,0,RIG.W,RIG.H);w.globalCompositeOperation='source-over';w.drawImage(c,0,0);w.globalCompositeOperation='source-in';w.fillStyle='#fff';w.fillRect(0,0,RIG.W,RIG.H);w.globalCompositeOperation='source-over';return RIG.w}
 return c}
// --- Sound: princely sword, bigger beam/spin, arrow-stop thunk. Called after patchInit. ---
function animInit(){const shimmer=(base,v,d)=>{[1,1.26,1.5,2].forEach((m,i)=>tone('triangle',base*m,base*m*1.003,d,v,0.03+i*0.025))};
 SFX.sword=()=>{noise(0.07,0.32,7500,3,0,11000);noise(0.13,0.28,2600,1.3,0,7000);tone('sine',2093,2093,0.5,0.08);tone('sine',2637,2642,0.45,0.06,0.01);tone('triangle',3136,3136,0.32,0.04,0.02);tone('sine',4186,4180,0.22,0.03,0.03);shimmer(523,0.05,0.65)};
 SFX.beam=()=>{SFX.sword();noise(0.35,0.18,5000,1.5,0.02,9000);[784,988,1175,1568].forEach((f,i)=>tone('triangle',f,f*1.004,0.5,0.06,0.05+i*0.05));tone('sine',262,262,0.6,0.07,0.02)};
 SFX.spin=()=>{noise(0.32,0.3,1200,1.4,0,5200);noise(0.1,0.25,7000,3,0.12,11000);tone('sine',1568,1568,0.5,0.06,0.1);shimmer(392,0.06,0.7);tone('sine',196,196,0.6,0.08,0.05)};
 SFX.thunk=()=>{tone('sine',190,65,0.1,0.45);noise(0.035,0.35,1400,2);tone('square',120,60,0.05,0.12);tone('triangle',430,390,0.07,0.09,0.02)};
 SFX.athit=()=>{SFX.thunk();noise(0.06,0.22,700,1.2,0.01)};
 SFX.bark=SFX.bark||(()=>{})}
