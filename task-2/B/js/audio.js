// Audio: chiptune sequencer, sound effects, hosted MP3 music with chiptune fallback.
// Plain script (no build step). All game files share one global scope; load order is set in index.html.
'use strict';
const SONG={
 stage:{step:60/132/2,lead:[62,0,65,67,69,0,67,65,67,69,70,69,67,65,64,0,62,0,65,67,69,0,72,70,69,67,65,64,62,0,0,0,74,0,72,70,69,0,67,69,70,0,69,67,65,0,64,0,62,64,65,67,69,70,72,74,72,70,69,67,65,64,62,0],
  bass:[38,0,50,0,41,0,53,0,43,0,55,0,45,0,57,45],drum:[1,0,2,0,1,0,2,0,1,0,2,0,1,1,2,0],lt:'square',lv:0.07},
 boss:{step:60/156/2,lead:[57,58,57,0,64,0,62,61,57,58,57,0,65,64,62,61,57,0,60,0,62,0,64,65,64,62,61,58,57,0,57,0,69,0,68,0,65,0,64,0,62,64,65,64,62,61,58,61],
  bass:[33,33,45,33,33,45,34,46],drum:[1,0,2,1,1,0,2,0],lt:'sawtooth',lv:0.05}};
let NB=null;
const AU={ctx:null,master:null,sfx:null,mus:null,cur:null,step:0,next:0,iv:0};
const mf=n=>440*Math.pow(2,(n-69)/12);
function mnote(type,n,t,dur,vol){const A=AU.ctx,o=A.createOscillator(),g=A.createGain();o.type=type;o.frequency.setValueAtTime(mf(n),t);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(AU.mus);o.start(t);o.stop(t+dur+0.02)}
function mdrum(k,t){const A=AU.ctx;if(k===1){const o=A.createOscillator(),g=A.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.12);g.gain.setValueAtTime(0.25,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.14);o.connect(g);g.connect(AU.mus);o.start(t);o.stop(t+0.16)}
 else{if(!NB)return;const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=NB;f.type='highpass';f.frequency.value=6000;g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);s.connect(f);f.connect(g);g.connect(AU.mus);s.start(t);s.stop(t+0.06)}}
function seqTick(){const A=AU.ctx;if(!A||!AU.cur||A.state!=='running')return;const sg=SONG[AU.cur];while(AU.next<A.currentTime+0.15){const i=AU.step,t=AU.next;
 const l=sg.lead[i%sg.lead.length];if(l)mnote(sg.lt,l,t,sg.step*0.9,sg.lv);const b=sg.bass[i%sg.bass.length];if(b)mnote('triangle',b,t,sg.step*0.95,0.16);
 const d=sg.drum[i%sg.drum.length];if(d)mdrum(d,t);if(i%4===0)mnote('triangle',l?l+12:74,t,0.05,0.015);AU.step++;AU.next+=sg.step}}
function audioInit(){if(AU.ctx)return;try{const A=new (window.AudioContext||window.webkitAudioContext)();AU.ctx=A;AU.master=A.createGain();AU.master.gain.value=S.mute?0:1;AU.master.connect(A.destination);AU.sfx=A.createGain();AU.sfx.gain.value=TUNE.sfxVolume;AU.sfx.connect(AU.master);
 AU.mus=A.createGain();AU.mus.gain.value=0;AU.mus.connect(AU.master);noise(0.01,0.0001);AU.iv=setInterval(seqTick,30)}catch(e){AU.ctx=null}}
function chip(k,fade=1.2){if(!AU.ctx||AU.cur===k)return;const A=AU.ctx,t=A.currentTime,g=AU.mus.gain;g.cancelScheduledValues(t);g.setValueAtTime(0.0001,t);g.linearRampToValueAtTime(0.9,t+Math.min(fade,0.6));AU.cur=k;AU.step=0;AU.next=t+0.05}
function chipStop(){if(!AU.ctx)return;const t=AU.ctx.currentTime,g=AU.mus.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+0.4);AU.cur=null}
function setMute(v){S.mute=v;saveS();if(REM.cur)REM.cur.muted=v;if(AU.ctx)AU.master.gain.setTargetAtTime(v?0:1,AU.ctx.currentTime,0.03);hooks.onMute(S.mute)}
function tone(type,f0,f1,dur,vol=0.3,delay=0){const A=AU.ctx;if(!A)return;const t=A.currentTime+delay,o=A.createOscillator(),g=A.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(AU.sfx);o.start(t);o.stop(t+dur+0.02)}
function noise(dur,vol=0.3,fc=2000,q=1,delay=0,f1){const A=AU.ctx;if(!A)return;if(!NB){NB=A.createBuffer(1,A.sampleRate,A.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 const t=A.currentTime+delay,s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=NB;f.type='bandpass';f.frequency.setValueAtTime(fc,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);f.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(AU.sfx);s.start(t);s.stop(t+dur+0.02)}
const SFX={
 jump(){tone('square',260,520,0.12,0.16)},djump(){tone('square',400,900,0.14,0.15);tone('triangle',800,1400,0.1,0.1,0.03)},
 bow(){noise(0.12,0.25,3000,2,0,800);tone('triangle',700,240,0.1,0.15)},ahit(){noise(0.06,0.3,1800,3);tone('square',300,120,0.06,0.12)},
 staff(){noise(0.1,0.25,900,1.5,0,2400)},sword(){noise(0.14,0.3,3500,2,0,1200);tone('sawtooth',1200,500,0.08,0.06)},
 ehit(){tone('square',220,90,0.1,0.22);noise(0.08,0.25,1200,1)},edie(){tone('square',300,40,0.35,0.22);noise(0.3,0.3,700,0.8,0.02,200)},
 hurt(){tone('sawtooth',380,110,0.28,0.25);tone('square',190,80,0.25,0.15,0.04)},
 pick(){tone('square',880,880,0.06,0.15);tone('square',1320,1320,0.09,0.15,0.06)},heart(){[523,659,784].forEach((f,i)=>tone('triangle',f,f,0.12,0.2,i*0.06))},
 ammo(){tone('square',600,600,0.05,0.12);tone('square',900,900,0.07,0.12,0.05)},
 check(){[392,523,659,784].forEach((f,i)=>tone('triangle',f,f,0.18,0.18,i*0.08))},
 bark(){tone('sawtooth',520,300,0.07,0.2);noise(0.06,0.15,900,2);tone('sawtooth',560,320,0.07,0.18,0.12);noise(0.06,0.12,900,2,0.12)},
 roar(){tone('sawtooth',140,50,1.1,0.32);tone('square',95,40,1.2,0.2,0.05);noise(1.0,0.35,400,0.6,0,120)},
 bhit(){tone('square',160,70,0.14,0.28);noise(0.12,0.3,600,1)},bdie(){for(let i=0;i<6;i++){noise(0.4,0.3,500-i*60,0.7,i*0.18);tone('sawtooth',200-i*25,40,0.4,0.18,i*0.18)}},
 devaOn(){[523,659,784,1046,1318].forEach((f,i)=>tone('triangle',f,f*1.01,0.3,0.18,i*0.07));noise(0.6,0.12,6000,1)},devaOff(){[784,659,523,392].forEach((f,i)=>tone('triangle',f,f,0.16,0.16,i*0.08))},
 win(){[523,659,784,1046,784,1046,1318].forEach((f,i)=>tone('square',f,f,0.2,0.14,i*0.13))},lose(){[392,349,311,262].forEach((f,i)=>tone('triangle',f,f*0.97,0.35,0.2,i*0.25))},
 blip(){tone('square',660,660,0.05,0.12)},sel(){tone('square',880,1320,0.1,0.14)},rock(){noise(0.2,0.3,300,0.8);tone('square',90,50,0.15,0.2)},
 spit(){noise(0.15,0.2,2500,3,0,900)},thud(){noise(0.15,0.35,200,0.8);tone('sine',90,40,0.15,0.3)}
};
function sfx(n){if(AU.ctx&&!S.mute&&SFX[n])try{SFX[n]()}catch(e){}}
SONG.deva={step:60/200/2,lead:[72,76,79,84,79,76,72,0,74,77,81,86,81,77,74,0,76,79,83,88,83,79,76,79,77,81,84,89,88,86,84,83],
 bass:[48,60,48,60,50,62,50,62,52,64,52,64,53,65,55,67],drum:[1,2,2,2,1,2,2,1],lt:'square',lv:0.06};
const REM={on:true,el:{},cur:null,url:{stage:'https://cdn.jsdelivr.net/gh/thepodemail-lgtm/thirteenth-year-music@main/stage1-v2.mp3',boss:'https://cdn.jsdelivr.net/gh/thepodemail-lgtm/thirteenth-year-music@main/last-stand-at-the-spire.mp3'}};
function remPause(){for(const k in REM.el){try{REM.el[k].pause()}catch(_){}}REM.cur=null}
function remFail(){if(!REM.on)return;REM.on=false;remPause();const k=AU.want;AU.want=null;if(k)music(k,0.6)}
function remPlay(k){if(!REM.on||!REM.url[k])return false;let e=REM.el[k];if(!e){try{e=new Audio(REM.url[k]);e.loop=true;e.preload='auto';e.volume=TUNE.musicVolume;e.addEventListener('error',remFail);REM.el[k]=e}catch(_){REM.on=false;return false}}if(REM.cur&&REM.cur!==e)REM.cur.pause();if(k==='boss'&&REM.cur!==e)e.currentTime=0;REM.cur=e;e.muted=!!S.mute;if(state!=='pause'){const pr=e.play();if(pr&&pr.catch)pr.catch(()=>{if(REM.cur===e)remFail()})}setTimeout(()=>{if(REM.on&&REM.cur===e&&e.readyState<2&&state!=='pause')remFail()},12000);return true}
function remMusic(k){if(k==='stage'||k==='boss')return remPlay(k);remPause();return false}
function music(k,fade=1.2){if(!AU.ctx||AU.want===k)return;AU.want=k;const ext=hooks.music?hooks.music(k):remMusic(k);if(ext)chipStop();else chip(k,fade)}
function musicStop(){AU.want=null;if(hooks.music)hooks.music(null);else remPause();chipStop()}
