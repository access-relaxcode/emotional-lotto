// A light, close-up hand clap, synthesized locally without external audio files.
function createSoftTapSamples(sampleRate, random = Math.random) {
  const samples = new Float32Array(Math.ceil(sampleRate * 0.085));
  let softenedNoise = 0;
  let previousAir = 0;
  let highPassed = 0;
  const smoothing = 1 - Math.exp(-2 * Math.PI * 2400 / sampleRate);
  const highPassDecay = Math.exp(-2 * Math.PI * 650 / sampleRate);
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / sampleRate;
    softenedNoise += smoothing * (random() * 2 - 1 - softenedNoise);
    const attack = Math.min(1, t / 0.0025);
    const tail = Math.min(1, (samples.length - i - 1) / (sampleRate * 0.008));
    // Three tiny noise bursts give the airy palm sound, without a bass thump.
    const burst = (start, strength) => t < start ? 0 : strength * Math.exp(-(t - start) * 155);
    const envelope = burst(0, 0.6) + burst(0.008, 0.25) + burst(0.016, 0.12);
    const air = softenedNoise * (envelope + 0.10 * Math.exp(-t * 65));
    highPassed = highPassDecay * (highPassed + air - previousAir);
    previousAir = air;
    samples[i] = highPassed * attack * tail;
  }
  return samples;
}

class SoftFlapSound {
  constructor() {
    this.volume = 0;
    this.context = null;
    this.lastTap = -Infinity;
  }

  async start() {
    try {
      if (!this.context || this.context.state === "closed") {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.volume * 0.45;
        this.master.connect(this.context.destination);
        this.buffers = Array.from({ length: 4 }, () => {
          const samples = createSoftTapSamples(this.context.sampleRate);
          const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
          buffer.copyToChannel(samples, 0);
          return buffer;
        });
        this.lastTap = -Infinity;
      }
      await this.context.resume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.master && this.context.state !== "closed") {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(volume * 0.45, now, 0.015);
    }
  }

  play(delay = 0) {
    if (!this.volume || this.context?.state !== "running") return;
    const when = this.context.currentTime + delay;
    // Nearby flaps share one tap, keeping six columns from sounding too busy.
    if (when - this.lastTap < 0.028) return;
    this.lastTap = when;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[Math.floor(Math.random() * this.buffers.length)];
    source.playbackRate.value = 2 ** (2 / 12) * (0.98 + Math.random() * 0.04);
    source.connect(this.master);
    source.onended = () => source.disconnect();
    source.start(when);
  }

  close() {
    if (this.context && this.context.state !== "closed") this.context.close().catch(() => {});
  }
}
