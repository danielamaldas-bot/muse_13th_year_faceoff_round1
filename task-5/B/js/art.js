// Hand-drawn art pack (assets/art/*.png + frames.json).
// Loads Daniel's pixel art and swaps it in for the procedural sprites/backgrounds.
// Every swap is per-asset: if an image fails to load, that piece keeps its procedural drawing.
// Hitboxes and gameplay are untouched; only what gets drawn changes.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
const ART={im:{},fr:null,ok:false};
const ART_FILES=['vel','dog','boar','hawk','vaka','arena','far','ruins','tiles','title'];
function artFrame(sheet,key){const f=ART.fr&&ART.fr[sheet]&&ART.fr[sheet][key],im=ART.im[sheet];if(!f||!im)return null;const c=mk(f[2],f[3]);c.getContext('2d').drawImage(im,f[0],f[1],f[2],f[3],0,0,f[2],f[3]);return c}
// Draw frame bottom-centred on a canvas of at least w x h (drawS anchors sprites by bottom-centre).
function artPlace(f,w,h,dx=0,dy=0){const c=mk(Math.max(w,f.width+Math.abs(dx)*2),Math.max(h,f.height+Math.abs(dy)));c.getContext('2d').drawImage(f,((c.width-f.width)/2|0)+dx,c.height-f.height-dy);return c}
function artTint(c,col,a){const x=c.getContext('2d');x.save();x.globalCompositeOperation='source-atop';x.globalAlpha=a;x.fillStyle=col;x.fillRect(0,0,c.width,c.height);x.restore();return c}
// ---- swaps (originals kept for fallback)
const _getHero=getHero,_heroSprite0=heroSprite0,_dogSprite=dogSprite,_boarSprite=boarSprite,_birdSprite=birdSprite,_vakaSprite=vakaSprite,_bakeBG=bakeBG,_bakeTitle=bakeTitle;
function velKey(fr,deva){if(fr.startsWith('idle'))return'idle';if(fr.startsWith('run'))return +fr.slice(3)<4?'run1':'run2';
 if(fr==='jump'||fr==='fall')return'jump';if(fr==='shoot')return'aim';if(fr.startsWith('strike'))return deva?'strikeD':'strike';if(fr==='hurt')return'hurt';return'idle'}
// Vel: sword is baked into the strike pose (staff replaced by a blade; gold blade in Deva form).
function velArt(fr,deva){const f=artFrame('vel',velKey(fr,deva));if(!f)return null;
 const k=velKey(fr,deva),dx=(k==='aim')?3:0;let c=artPlace(f,48,44,dx);if(deva){artTint(c,'#ffe070',0.18);const b=mk(c.width*1.25|0,c.height*1.25|0);b.getContext('2d').drawImage(c,0,0,b.width,b.height);c=b}return c}
getHero=function(fr,deva){if(!ART.im.vel)return _getHero(fr,deva);if(G&&G.p&&G.p.spin>0&&state!=='title')return BLANK;return spr('AH'+fr+(deva?'d':''),()=>velArt(fr,deva)||_getHero(fr,deva))};
heroSprite0=function(fr,deva){if(!ART.im.vel)return _heroSprite0(fr,deva);const f=artFrame('vel','jump');return f?artPlace(f,32,40):_heroSprite0(fr,deva)};
dogSprite=function(fr){if(!ART.im.dog)return _dogSprite(fr);const k=fr==='bark'?'bark':fr.startsWith('sit')?'sit':(+fr<3?'run1':'run2');const f=artFrame('dog',k);return f?artPlace(f,30,22):_dogSprite(fr)};
boarSprite=function(fr){if(!ART.im.boar)return _boarSprite(fr);const k=fr==='idle'?'stand':fr==='tell'?'charge':(+fr[1]%2?'charge':'stand');const f=artFrame('boar',k);if(!f)return _boarSprite(fr);
 const c=artPlace(f,42,30);return fr==='tell'?artTint(c,'#ff3020',0.25):c};
birdSprite=function(fr){if(!ART.im.hawk)return _birdSprite(fr);const f=artFrame('hawk',fr==='0'?'up':'down');return f?artPlace(f,28,22):_birdSprite(fr)};
vakaSprite=function(fr){if(!ART.im.vaka)return _vakaSprite(fr);const f=artFrame('vaka','idle');if(!f)return _vakaSprite(fr);
 const run=fr[0]==='r',dy=fr==='i1'?1:run?[0,2,0,1][+fr[1]]:0,c=artPlace(f,100,108,0,dy);
 if(fr==='tell')artTint(c,'#ff2010',0.3);else if(fr==='throw')artTint(c,'#ffd060',0.15);else if(fr==='stun')artTint(c,'#a0a0ff',0.25);return c};
// Stage tiles from the ruins brickwork (kind 1 = mossy top, 3 = fill; kind 2 red beams stay procedural).
function artTile(k,v){const im=ART.im.tiles,t=ART.fr&&ART.fr.tiles;if(!im||!t||k===2)return null;const L=k===1?t.top:t.fill,i=L[v%L.length],c=mk(16,16);c.getContext('2d').drawImage(im,i*16,0,16,16,0,0,16,16);return c}
// Backgrounds: images are pre-hazed (lightened/desaturated) so sprites stay readable. No scanlines.
bakeBG=function(){_bakeBG();if(ART.im.far)BG.far=ART.im.far;if(ART.im.ruins){BG.ruin=ART.im.ruins;BG.mid=mk(1,1)}};
function drawArena(){const a=ART.im.arena;if(!a||!G)return;const k=clamp((G.cam-(404*T-VW-200))/200,0,1);if(k<=0)return;ctx.globalAlpha=k;par(a,0.15,0);ctx.globalAlpha=1}
bakeTitle=function(){const t=ART.im.title;if(!t)return _bakeTitle();TITLE=paint((x,w,h)=>{x.drawImage(t,0,0,w,h);let g=x.createLinearGradient(0,0,0,60);g.addColorStop(0,'rgba(10,6,20,0.55)');g.addColorStop(1,'rgba(10,6,20,0)');x.fillStyle=g;x.fillRect(0,0,w,60);
 g=x.createLinearGradient(0,108,0,h);g.addColorStop(0,'rgba(10,6,20,0)');g.addColorStop(1,'rgba(10,6,20,0.6)');x.fillStyle=g;x.fillRect(0,108,w,h-108)},320,180)};
// Load everything, then rebake. Failure of one file only disables that file's swap.
function loadArt(base='assets/art/'){return fetch(base+'frames.json').then(r=>r.ok?r.json():null).catch(()=>null).then(fr=>{ART.fr=fr;
 return Promise.all(ART_FILES.map(n=>new Promise(res=>{const im=new Image();im.onload=()=>{ART.im[n]=im;res()};im.onerror=()=>res();im.src=base+n+'.png'})))}).then(()=>{
 if(!ART.fr)for(const n of['vel','dog','boar','hawk','vaka','tiles'])delete ART.im[n];
 ART.ok=Object.keys(ART.im).length>0;if(!ART.ok)return;SC.clear();bakeBG();bakeTitle()})}
