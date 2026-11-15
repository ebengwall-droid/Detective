// All sound is synthesised in the browser: rain, room tone, a far-off
// foghorn, footsteps, a few notes of piano. Nothing is downloaded.
//
// Browsers only allow audio after the player has touched the page, so
// everything starts from unlock(), called on the first tap or key press.

const AMBIENCE = {
  gatehouse: { rain: 0.24, cutoff: 3000, drone: 0.012, wind: 0.07 },
  hall: { rain: 0.08, cutoff: 1300, drone: 0.018 },
  clockshop: { rain: 0.1, cutoff: 1500, drone: 0.014 },
  wheelshop: { rain: 0.07, cutoff: 1100, drone: 0.012 },
  mortuary: { rain: 0, cutoff: 500, drone: 0.05, hum: true },
  meridian: { rain: 0.16, cutoff: 2000, drone: 0.02, creak: true },
  stalemate: { rain: 0.07, cutoff: 1200, drone: 0.016 },
  crux: { rain: 0.2, cutoff: 2600, drone: 0.012, wind: 0.04 },
  almshouse: { rain: 0.1, cutoff: 1500, drone: 0.01 },
  repository: { rain: 0, cutoff: 600, drone: 0.04, hum: true },
  lantern: { rain: 0.3, cutoff: 4200, drone: 0.03, wind: 0.16 },
  title: { rain: 0.1, cutoff: 1500, drone: 0.014 },
};

// D natural minor, low to high.
const SCALE = [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 329.63, 349.23, 440.0];

export class Audio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.ambience = 'title';
    this.timers = [];
  }

  /** Create the audio graph. Safe to call more than once. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.enabled ? 0.9 : 0;
    this.master.connect(c.destination);

    // A small plate reverb from decaying noise.
    this.reverb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 2.6);
    const impulse = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb.buffer = impulse;
    this.wet = c.createGain();
    this.wet.gain.value = 0.5;
    this.reverb.connect(this.wet).connect(this.master);

    // Rain: looped noise through a low-pass that says "indoors".
    const noiseLen = c.sampleRate * 3;
    this.noiseBuf = c.createBuffer(1, noiseLen, c.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < noiseLen; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.045 * white) / 1.045;
      nd[i] = white * 0.55 + lastOut * 5;
    }
    const rainSrc = c.createBufferSource();
    rainSrc.buffer = this.noiseBuf;
    rainSrc.loop = true;
    this.rainFilter = c.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.value = 1400;
    this.rainGain = c.createGain();
    this.rainGain.gain.value = 0;
    rainSrc.connect(this.rainFilter).connect(this.rainGain).connect(this.master);
    rainSrc.start();

    // Wind: the same noise, band-passed and slowly swept.
    const windSrc = c.createBufferSource();
    windSrc.buffer = this.noiseBuf;
    windSrc.loop = true;
    windSrc.playbackRate.value = 0.6;
    this.windFilter = c.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 420;
    this.windFilter.Q.value = 1.4;
    this.windGain = c.createGain();
    this.windGain.gain.value = 0;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 240;
    lfo.connect(lfoGain).connect(this.windFilter.frequency);
    lfo.start();
    windSrc.connect(this.windFilter).connect(this.windGain).connect(this.master);
    windSrc.start();

    // Room tone: two low sines a fraction apart.
    this.droneGain = c.createGain();
    this.droneGain.gain.value = 0;
    for (const f of [55, 55.7, 82.4]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(this.droneGain);
      o.start();
    }
    this.droneGain.connect(this.master);

    // Mains hum for rooms that have refrigeration.
    this.humGain = c.createGain();
    this.humGain.gain.value = 0;
    for (const [f, g] of [[100, 1], [200, 0.35], [300.4, 0.12]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const og = c.createGain();
      og.gain.value = g;
      o.connect(og).connect(this.humGain);
      o.start();
    }
    this.humGain.connect(this.master);

    this.setAmbience(this.ambience);
    this.schedule();
  }

  /** Go quiet when the game is put away (another app, a call, the screen off) and pick up again after. */
  setAway(away) {
    if (!this.ctx) return;
    if (away) this.ctx.suspend().catch(() => {});
    else this.ctx.resume().catch(() => {});
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.08);
  }

  setAmbience(name) {
    this.ambience = AMBIENCE[name] ? name : 'hall';
    if (!this.ctx) return;
    const a = AMBIENCE[this.ambience];
    const t = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(a.rain, t, 0.8);
    this.rainFilter.frequency.setTargetAtTime(a.cutoff, t, 0.8);
    this.windGain.gain.setTargetAtTime(a.wind ?? 0, t, 1.2);
    this.droneGain.gain.setTargetAtTime(a.drone, t, 1.0);
    this.humGain.gain.setTargetAtTime(a.hum ? 0.011 : 0, t, 0.6);
  }

  /** Occasional events: a foghorn, a few piano notes. Driven by timeouts, not a busy loop. */
  schedule() {
    const horn = () => {
      if (AMBIENCE[this.ambience]?.horn) this.foghorn();
      this.timers[0] = setTimeout(horn, 38000 + Math.random() * 50000);
    };
    const piano = () => {
      this.phrase();
      this.timers[1] = setTimeout(piano, 9000 + Math.random() * 15000);
    };
    const creak = () => {
      if (AMBIENCE[this.ambience]?.creak) this.creak();
      this.timers[2] = setTimeout(creak, 7000 + Math.random() * 12000);
    };
    this.timers[0] = setTimeout(horn, 14000 + Math.random() * 20000);
    this.timers[1] = setTimeout(piano, 5000);
    this.timers[2] = setTimeout(creak, 6000);
  }

  /** A hull easing against its fenders. */
  creak() {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    const from = 62 + Math.random() * 20;
    o.frequency.setValueAtTime(from, t);
    o.frequency.linearRampToValueAtTime(from * 0.78, t + 0.7);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 340;
    f.Q.value = 5;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.15);
    g.gain.linearRampToValueAtTime(0, t + 0.8);
    const send = c.createGain();
    send.gain.value = 0.5;
    o.connect(f).connect(g);
    g.connect(this.master);
    g.connect(send).connect(this.reverb);
    o.start(t);
    o.stop(t + 0.9);
  }

  tone(freq, { type = 'sine', gain = 0.1, attack = 0.01, decay = 1, when = 0, wet = 0.4, detune = 0 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    o.connect(g);
    g.connect(this.master);
    if (wet) {
      const send = c.createGain();
      send.gain.value = wet;
      g.connect(send).connect(this.reverb);
    }
    o.start(t);
    o.stop(t + attack + decay + 0.1);
  }

  /** A soft electric-piano note: fundamental plus a quiet octave. */
  note(freq, when = 0, gain = 0.05) {
    this.tone(freq, { gain, decay: 3.2, when, wet: 0.9 });
    this.tone(freq * 2, { gain: gain * 0.25, decay: 1.6, when, wet: 0.6 });
  }

  phrase() {
    if (!this.ctx || !this.enabled || AMBIENCE[this.ambience]?.hum) return; // no music under the cold rooms' hum
    const n = 1 + Math.floor(Math.random() * 3);
    let i = Math.floor(Math.random() * (SCALE.length - 2));
    let when = 0;
    for (let k = 0; k < n; k++) {
      this.note(SCALE[i], when, 0.035);
      i = Math.max(0, Math.min(SCALE.length - 1, i + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))));
      when += 0.7 + Math.random() * 0.9;
    }
  }

  foghorn() {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(92, t);
    o.frequency.linearRampToValueAtTime(88, t + 2.4);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 260;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.5);
    g.gain.setValueAtTime(0.045, t + 1.8);
    g.gain.linearRampToValueAtTime(0, t + 2.8);
    const send = c.createGain();
    send.gain.value = 1.2;
    o.connect(f).connect(g);
    g.connect(this.master);
    g.connect(send).connect(this.reverb);
    o.start(t);
    o.stop(t + 3);
  }

  noiseBurst({ gain = 0.1, freq = 800, q = 1, decay = 0.08, type = 'bandpass', when = 0 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loopStart = Math.random() * 2;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 2, decay + 0.05);
  }

  step() {
    this.foot = !this.foot;
    this.noiseBurst({ gain: 0.05, freq: this.foot ? 240 : 200, q: 0.9, decay: 0.09, type: 'lowpass' });
    this.tone(this.foot ? 70 : 62, { gain: 0.04, decay: 0.09, wet: 0.1 });
  }

  /** Small UI tick. */
  blip() {
    this.tone(660, { gain: 0.025, decay: 0.07, wet: 0.2 });
  }

  click() {
    this.noiseBurst({ gain: 0.04, freq: 2600, q: 2, decay: 0.03 });
  }

  /** Something found. */
  sting() {
    this.note(293.66, 0, 0.06);
    this.note(440.0, 0.16, 0.055);
    this.note(587.33, 0.34, 0.04);
  }

  lead() {
    this.note(220.0, 0, 0.04);
    this.note(329.63, 0.14, 0.03);
  }

  /** A scene break: one low chord. */
  chord() {
    for (const [f, d] of [[73.42, 0], [110.0, 0.05], [146.83, 0.1], [174.61, 0.18]]) this.tone(f, { gain: 0.07, decay: 4.5, when: d, wet: 1 });
  }

  thunder() {
    // A crack, then the long roll behind it.
    this.noiseBurst({ gain: 0.16, freq: 420, q: 0.4, decay: 0.5, type: 'lowpass' });
    this.noiseBurst({ gain: 0.2, freq: 110, q: 0.5, decay: 2.8, type: 'lowpass', when: 0.12 });
    this.noiseBurst({ gain: 0.12, freq: 70, q: 0.5, decay: 4.2, type: 'lowpass', when: 0.9 });
  }

  typeKey() {
    this.noiseBurst({ gain: 0.05, freq: 1800 + Math.random() * 600, q: 3, decay: 0.035 });
  }
}
