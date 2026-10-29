// Keyboard input and the button state the game reads.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
const K={l:0,r:0,u:0,d:0,jump:0,shoot:0,strike:0};const KP={jump:0,shoot:0,strike:0};
const KM={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',Space:'jump',KeyX:'shoot',KeyK:'shoot',KeyZ:'strike',KeyJ:'strike'};
function onKD(e){const c=e.code;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c))e.preventDefault();if(e.repeat)return;
 if(c==='KeyM'){audioInit();setMute(!S.mute);return}
 if(c==='KeyP'||c==='Escape'){pause(state==='play');return}
 if(state==='title'||state==='win'||state==='over'){if(c==='Enter'||c==='Space'||c==='KeyX'||c==='KeyZ')pressStart();return}
 const k=KM[c];if(!k)return;press(k,1)}
function onKU(e){const k=KM[e.code];if(k)press(k,0)}
addEventListener('keydown',onKD);addEventListener('keyup',onKU);
function press0(k,v){if(k==='u'){if(v&&!K.u)KP.jump=1;K.u=v;K.jump=v||K._j;return}if(k==='jump'){K._j=v}if(v&&!K[k]&&KP[k]!==undefined)KP[k]=1;K[k]=v;if(k==='jump')K.jump=v||K.u}
const BUF={shoot:0,strike:0};
function press(k,v){if(v&&!K[k]&&(k==='shoot'||k==='strike'))BUF[k]=TUNE.actBuf;press0(k,v)}
