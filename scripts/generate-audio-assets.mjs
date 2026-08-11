/**
 * Generates the backing tracks for the certificate score.
 *
 *   node scripts/generate-audio-assets.mjs
 *
 * Everything is synthesised from noise and sine tones rather than sampled, for
 * two reasons. Licensing: a charity should not have to defend the provenance of
 * a sound file it found online, and audio generated here is unambiguously the
 * project's own. Reproducibility: the random number generator is seeded, so
 * re-running this produces byte-identical output, and the character of the
 * applause can be tuned by editing numbers rather than by hunting for a
 * different recording.
 *
 * Applause really is just a very large number of short noise transients, so
 * synthesis gets remarkably close. If you would rather use a real recording,
 * drop it into public/audio with the same filename and record its licence in
 * public/audio/CREDITS.md -- nothing else needs to change.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 48_000;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

// ---------------------------------------------------------------- utilities

/** Seeded PRNG, so every run produces identical files. */
function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seconds = (n) => Math.round(n * SAMPLE_RATE);

/** RBJ cookbook biquad, applied in place. */
function biquad(buffer, { b0, b1, b2, a1, a2 }) {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const x0 = buffer[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    buffer[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return buffer;
}

function lowpass(freq, q = 0.707) {
  const w = (2 * Math.PI * freq) / SAMPLE_RATE;
  const alpha = Math.sin(w) / (2 * q);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  return {
    b0: ((1 - cos) / 2) / a0,
    b1: (1 - cos) / a0,
    b2: ((1 - cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

function highpass(freq, q = 0.707) {
  const w = (2 * Math.PI * freq) / SAMPLE_RATE;
  const alpha = Math.sin(w) / (2 * q);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  return {
    b0: ((1 + cos) / 2) / a0,
    b1: (-(1 + cos)) / a0,
    b2: ((1 + cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

function bandpass(freq, q = 1) {
  const w = (2 * Math.PI * freq) / SAMPLE_RATE;
  const alpha = Math.sin(w) / (2 * q);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  return {
    b0: alpha / a0,
    b1: 0,
    b2: -alpha / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

function normalise(buffer, target = 0.9) {
  let peak = 0;
  for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
  if (peak === 0) return buffer;
  const gain = target / peak;
  for (let i = 0; i < buffer.length; i += 1) buffer[i] *= gain;
  return buffer;
}

/**
 * Turns a longer buffer into a seamlessly looping one of `length` samples by
 * crossfading the overrun back over the start. Without this, looping applause
 * produces an audible click every time it wraps.
 */
function makeLoopable(buffer, length, fadeSamples) {
  const out = new Float32Array(length);
  out.set(buffer.subarray(0, length));
  for (let i = 0; i < fadeSamples; i += 1) {
    const t = i / fadeSamples;
    out[i] = out[i] * t + buffer[length + i] * (1 - t);
  }
  return out;
}

// ------------------------------------------------------------------- sounds

/**
 * A single hand clap: a very short, bright noise transient with an instant
 * attack and a fast exponential decay. Individually it sounds like a twig
 * snapping; hundreds per second overlapping is what a crowd sounds like.
 */
function addClap(buffer, at, gain, brightness, random) {
  const decay = 0.018 + random() * 0.035;
  const length = Math.min(seconds(decay * 4), buffer.length - at);
  if (length <= 0) return;

  const clap = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    clap[i] = (random() * 2 - 1) * Math.exp(-t / decay);
  }
  // Each pair of hands has its own resonance; varying it stops the crowd
  // sounding like one person cloned many times.
  biquad(clap, bandpass(brightness, 0.8));
  biquad(clap, highpass(700));

  for (let i = 0; i < length; i += 1) buffer[at + i] += clap[i] * gain;
}

/**
 * A crowd of roughly a hundred people applauding, at constant density so that
 * any point in the file sounds like any other -- which is what lets it loop.
 */
function makeApplause({ durationSec, clapsPerSecond, seed, cheer }) {
  const random = mulberry32(seed);
  const fade = seconds(0.75);
  const total = seconds(durationSec) + fade;
  const buffer = new Float32Array(total);

  const clapCount = Math.round(durationSec * clapsPerSecond) + Math.round(clapsPerSecond * 0.75);
  for (let i = 0; i < clapCount; i += 1) {
    const at = Math.floor(random() * (total - seconds(0.2)));
    // Log-ish distribution of loudness: a few close claps, many distant ones.
    const gain = 0.15 + random() ** 2.2 * 0.85;
    const brightness = 1100 + random() * 2600;
    addClap(buffer, at, gain, brightness, random);
  }

  // Underlying roar: the diffuse wash of a room full of people, which stops the
  // result sounding like isolated clicks in an anechoic void.
  const roar = new Float32Array(total);
  for (let i = 0; i < total; i += 1) roar[i] = random() * 2 - 1;
  biquad(roar, bandpass(620, 0.5));
  biquad(roar, lowpass(2400));
  for (let i = 0; i < total; i += 1) buffer[i] += roar[i] * 0.32;

  if (cheer) {
    // Voices: narrow bands of noise with slow vibrato read as sustained shouts.
    for (let voice = 0; voice < 14; voice += 1) {
      const centre = 380 + random() * 900;
      const start = Math.floor(random() * total);
      const length = Math.min(seconds(0.7 + random() * 1.6), total - start);
      if (length <= 0) continue;

      const shout = new Float32Array(length);
      const vibratoRate = 4 + random() * 3;
      for (let i = 0; i < length; i += 1) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.sin((Math.PI * i) / length) ** 1.5;
        const vibrato = 1 + 0.06 * Math.sin(2 * Math.PI * vibratoRate * t);
        shout[i] = (random() * 2 - 1) * envelope * vibrato;
      }
      biquad(shout, bandpass(centre, 6));
      for (let i = 0; i < length; i += 1) buffer[start + i] += shout[i] * 0.5;
    }

    // A couple of whistles, high and piercing, as at any school prize-giving.
    for (let whistle = 0; whistle < 2; whistle += 1) {
      const start = Math.floor(random() * (total - seconds(1.2)));
      const length = seconds(0.5 + random() * 0.5);
      const base = 2100 + random() * 700;
      for (let i = 0; i < length; i += 1) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.sin((Math.PI * i) / length) ** 2;
        const freq = base * (1 + 0.05 * Math.sin(2 * Math.PI * 5.5 * t));
        buffer[start + i] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.09;
      }
    }
  }

  return normalise(makeLoopable(buffer, seconds(durationSec), fade), 0.92);
}

/**
 * Room tone: the sound of a hall with people in it who are not making noise on
 * purpose. Almost subliminal, but its absence makes the narration feel like it
 * was recorded in a cupboard.
 */
function makeAmbience({ durationSec, seed }) {
  const random = mulberry32(seed);
  const fade = seconds(1.0);
  const total = seconds(durationSec) + fade;
  const buffer = new Float32Array(total);

  for (let i = 0; i < total; i += 1) buffer[i] = random() * 2 - 1;
  biquad(buffer, lowpass(900));
  biquad(buffer, lowpass(1400));
  biquad(buffer, highpass(90));

  // Slow swells, as a room's murmur rises and falls.
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    buffer[i] *= 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.07 * t) * Math.sin(2 * Math.PI * 0.031 * t);
  }

  // Very occasional distant movement, so it is not a static hiss.
  const random2 = mulberry32(seed + 1);
  for (let i = 0; i < Math.round(durationSec * 2.5); i += 1) {
    addClap(buffer, Math.floor(random2() * (total - seconds(0.3))), 0.06, 900, random2);
  }

  return normalise(makeLoopable(buffer, seconds(durationSec), fade), 0.55);
}

/**
 * The signature chime: three ascending notes with bell-like partials. Played at
 * the head of every certificate, so it becomes the sound of a Vividha award.
 */
function makeChime() {
  const durationSec = 3.2;
  const total = seconds(durationSec);
  const buffer = new Float32Array(total);

  // A major triad, C6-E6-G6: unambiguously bright and celebratory.
  const notes = [
    { freq: 1046.5, at: 0.0 },
    { freq: 1318.51, at: 0.26 },
    { freq: 1567.98, at: 0.52 },
  ];
  // Slightly inharmonic partials give it the metallic quality of a struck bar
  // rather than the hollow purity of a sine.
  const partials = [
    { ratio: 1.0, gain: 1.0, decay: 1.5 },
    { ratio: 2.02, gain: 0.42, decay: 0.9 },
    { ratio: 3.01, gain: 0.18, decay: 0.55 },
    { ratio: 4.97, gain: 0.09, decay: 0.32 },
    { ratio: 6.83, gain: 0.05, decay: 0.2 },
  ];

  for (const note of notes) {
    const start = seconds(note.at);
    for (let i = 0; start + i < total; i += 1) {
      const t = i / SAMPLE_RATE;
      let value = 0;
      for (const partial of partials) {
        value += Math.sin(2 * Math.PI * note.freq * partial.ratio * t)
          * partial.gain
          * Math.exp(-t / partial.decay);
      }
      // A 4 ms attack ramp: an instant start would click.
      const attack = Math.min(1, t / 0.004);
      buffer[start + i] += value * attack * 0.3;
    }
  }

  // Fade the last 250 ms to true silence so the file ends cleanly.
  const fade = seconds(0.25);
  for (let i = 0; i < fade; i += 1) {
    buffer[total - fade + i] *= 1 - i / fade;
  }

  return normalise(buffer, 0.85);
}

/**
 * The riser before the prize is named: noise sweeping upward through a
 * resonant filter, with a rising tone underneath. Purely a tension device --
 * it tells the listener that the important part is about to happen.
 */
function makeRiser() {
  const durationSec = 1.8;
  const total = seconds(durationSec);
  const random = mulberry32(99);
  const buffer = new Float32Array(total);

  for (let i = 0; i < total; i += 1) {
    const progress = i / total;
    const t = i / SAMPLE_RATE;

    // Noise component, swept by a one-pole filter whose cutoff climbs.
    const noise = random() * 2 - 1;

    // Rising tone, an octave and a half over the length of the sweep.
    const freq = 220 * 2 ** (progress * 1.6);
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.35;

    // Crescendo, steep at the end.
    const envelope = progress ** 1.8;
    buffer[i] = (noise * 0.5 + tone) * envelope;
  }

  // Sweep a bandpass across the whole thing in blocks, which is cheaper than a
  // per-sample time-varying filter and indistinguishable here.
  const blocks = 60;
  const blockSize = Math.floor(total / blocks);
  for (let b = 0; b < blocks; b += 1) {
    const slice = buffer.subarray(b * blockSize, (b + 1) * blockSize);
    biquad(slice, bandpass(400 + (b / blocks) ** 1.5 * 4200, 1.4));
  }

  // Short fade out so it tucks under the prize word instead of stopping dead.
  const fade = seconds(0.12);
  for (let i = 0; i < fade; i += 1) buffer[total - fade + i] *= 1 - i / fade;

  return normalise(buffer, 0.8);
}

// ------------------------------------------------------------------ encoding

/**
 * Written as WAV, not MP3, deliberately.
 *
 * MP3 carries encoder delay and end padding, so a decoded file begins with
 * silence and ends with a fragment. The applause and room tone are looped, and
 * that padding would put a click at every wrap -- exactly the artefact the
 * crossfade above exists to prevent. WAV decodes to the same samples that went
 * in, so the loop points land where they were designed to.
 *
 * The cost is size, and it is paid only by the admin tab that mixes
 * certificates. Anyone opening a certificate link downloads a finished MP3 and
 * never fetches these at all.
 */
function encodeWav(samples) {
  const header = Buffer.alloc(44);
  const dataBytes = samples.length * 2;

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format: PCM
  header.writeUInt16LE(1, 22); // channels: mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataBytes, 40);

  const data = Buffer.alloc(dataBytes);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff), i * 2);
  }
  return Buffer.concat([header, data]);
}

function write(name, samples) {
  const wav = encodeWav(samples);
  writeFileSync(join(OUT_DIR, name), wav);
  const durationSec = samples.length / SAMPLE_RATE;
  console.log(
    `  ${name.padEnd(14)} ${durationSec.toFixed(2)}s  ${(wav.length / 1024).toFixed(0)} KB`,
  );
}

mkdirSync(OUT_DIR, { recursive: true });
console.log('Generating backing tracks into public/audio:');
write('chime.wav', makeChime());
write('riser.wav', makeRiser());
// Loop lengths kept modest: long enough not to sound repetitive under a
// 15-second applause tail, short enough to keep the admin page light.
write('ambience.wav', makeAmbience({ durationSec: 9, seed: 7 }));
write('applause.wav', makeApplause({ durationSec: 10, clapsPerSecond: 330, seed: 42, cheer: true }));
console.log('Done.');
