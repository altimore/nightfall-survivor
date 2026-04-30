// Web Audio API · SFX + procedural music · ported from the original monolith.
let audio = null;
let muted = false;
let musicTimer = null;

export function initAudio() {
  if (audio) return audio;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0.32;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ctx.destination);
  audio = { ctx, master };
  return audio;
}

export function setMuted(v) {
  muted = v;
  if (muted) stopMusic();
}
export const isMuted = () => muted;

function tone(a, freq, type, atk, sus, rel, vol = 0.3, off = 0) {
  const t = a.ctx.currentTime + off;
  const o = a.ctx.createOscillator(), e = a.ctx.createGain();
  o.type = type; o.frequency.value = freq;
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(vol, t + atk);
  e.gain.setValueAtTime(vol, t + atk + sus);
  e.gain.linearRampToValueAtTime(0, t + atk + sus + rel);
  o.connect(e); e.connect(a.master); o.start(t); o.stop(t + atk + sus + rel + 0.01);
}

function noiseBlast(a, dur, vol = 0.2, hp = 500, off = 0) {
  const t = a.ctx.currentTime + off;
  const sr = a.ctx.sampleRate;
  const buf = a.ctx.createBuffer(1, Math.floor(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.ctx.createBufferSource(); src.buffer = buf;
  const f = a.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const e = a.ctx.createGain();
  e.gain.setValueAtTime(vol, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f); f.connect(e); e.connect(a.master); src.start(t); src.stop(t + dur + 0.01);
}

const SFX_FNS = {
  dagger:    a => { tone(a,900,'sawtooth',.005,.01,.08,.12); noiseBlast(a,.07,.08,3000); },
  nova:      a => { tone(a,55,'sine',.01,.08,.5,.45); noiseBlast(a,.35,.35,80); tone(a,110,'sawtooth',.01,.05,.3,.18); },
  lightning: a => { noiseBlast(a,.18,.45,1200); tone(a,330,'square',.001,.04,.1,.1); },
  hit:       a => { tone(a,180,'sawtooth',.001,.04,.25,.35); noiseBlast(a,.18,.22,250); },
  death:     a => { tone(a,280,'sawtooth',.001,.02,.18,.22); noiseBlast(a,.1,.12,600); },
  xp:        a => { tone(a,1047,'sine',.005,.02,.09,.09); tone(a,1319,'sine',.01,.02,.07,.07); },
  levelup:   a => { [261,330,392,523,659].forEach((f,i) => tone(a,f,'sine',.01,.08,.25,.32,i*.07)); },
  boss:      a => { tone(a,55,'sawtooth',.05,.3,.8,.5); noiseBlast(a,.5,.4,60); },
  victory:   a => { [392,494,587,784].forEach((f,i) => tone(a,f,'sine',.01,.15,.3,.4,i*.1)); },
  gameover:  a => { [392,349,311,261,220].forEach((f,i) => tone(a,f,'sawtooth',.01,.15,.4,.28,i*.18)); },
  projhit:   a => { noiseBlast(a,.06,.15,1500); },
  itempickup:a => { tone(a,660,'sine',.01,.05,.2,.2); tone(a,880,'sine',.02,.05,.18,.15); },
  eprojshoot:a => { noiseBlast(a,.05,.08,2000); },
};

const HAPTICS = {
  hit:      () => navigator.vibrate?.([40,20,40]),
  death:    () => navigator.vibrate?.(15),
  nova:     () => navigator.vibrate?.([60,20,30]),
  levelup:  () => navigator.vibrate?.([30,50,30,50,80]),
  boss:     () => navigator.vibrate?.([100,30,100,30,150]),
  gameover: () => navigator.vibrate?.([100,50,100,50,200]),
  victory:  () => navigator.vibrate?.([50,30,50,30,50,30,200]),
  itempickup: () => navigator.vibrate?.([20,10,40]),
};

export function playSfx(name) {
  if (muted || !audio) return;
  SFX_FNS[name]?.(audio);
  HAPTICS[name]?.();
}

const MUSIC_BPM = 95;
const BEAT_S = 60 / MUSIC_BPM;
const BASS_SEQ = [55,55,49,52,55,49,52,55];
const PAD_CHORDS = [[110,138,165],[98,123,147],[104,131,156],[110,131,165]];

export function startMusic() {
  if (muted || !audio) return;
  stopMusic();
  let step = 0;
  let nextT = audio.ctx.currentTime + 0.05;
  const a = audio;
  const schedule = () => {
    while (nextT < a.ctx.currentTime + 0.4) {
      const s = step % 32;
      if (s % 4 === 0 || s === 10 || s === 22) tone(a, BASS_SEQ[Math.floor(s/4) % BASS_SEQ.length], 'triangle', .04, BEAT_S*.6, BEAT_S*.4, .38, nextT - a.ctx.currentTime);
      if (s % 8 === 0) tone(a, BASS_SEQ[Math.floor(s/8) % 4] * 0.5, 'sine', .1, BEAT_S*3, BEAT_S, .22, nextT - a.ctx.currentTime);
      noiseBlast(a, .04, s % 2 === 0 ? .06 : .03, 9000, nextT - a.ctx.currentTime);
      if (s % 8 === 4 || s % 8 === 12) noiseBlast(a, .12, .14, 800, nextT - a.ctx.currentTime);
      if (s % 16 === 0) {
        const c = PAD_CHORDS[Math.floor(step/16) % 4];
        c.forEach(f => tone(a, f, 'sine', .4, BEAT_S*5, BEAT_S*2, .05, nextT - a.ctx.currentTime));
      }
      nextT += BEAT_S / 2; step++;
    }
    musicTimer = setTimeout(schedule, 120);
  };
  schedule();
}

export function stopMusic() {
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}
