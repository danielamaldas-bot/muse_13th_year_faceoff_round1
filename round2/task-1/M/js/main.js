// Boot: builds the level and art, starts the frame loop, returns the controls API used by index.html.
'use strict';
function bootGame(h){Object.assign(hooks,h);
buildMap();patchInit();bakeBG();initImgs();bakeTitle();raf=requestAnimationFrame(frame);hooks.onMute(S.mute);loadArt();animInit();
return{press,pressStart,setOpt,pauseSet:(on)=>pause(on),opts:()=>({inv:!!S.inv,inf:!!S.inf}),
 togglePause(){audioInit();if(state==='title'||state==='win'||state==='over'){setMute(!S.mute);return}pause(state==='play')},
 toggleMute(){audioInit();setMute(!S.mute)},
 restart(){if(state==='pause')pause(false);newGame();state='play';music('stage',0.5)},
 stop(){remPause();REM.on=false;cancelAnimationFrame(raf);removeEventListener('keydown',onKD);removeEventListener('keyup',onKU);document.removeEventListener('visibilitychange',onVis);if(AU.iv)clearInterval(AU.iv);if(AU.ctx)AU.ctx.close().catch(()=>{})}};
}
