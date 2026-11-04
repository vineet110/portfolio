/**
 * Tiny synthesized sound effects — no audio files. Only ever played after
 * the visitor switches sound on (and so after a user gesture).
 */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function blip(freq = 660, dur = 0.08, type: OscillatorType = "sine", gain = 0.05) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function whoosh(dur = 0.45, gain = 0.08) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = "bandpass"
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(300, t)
  filter.frequency.exponentialRampToValueAtTime(3200, t + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(g).connect(ac.destination)
  src.start(t)
}

export function fanfare() {
  ;[523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => blip(f, 0.18, "triangle", 0.06), i * 110))
}
