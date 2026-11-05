// Web Audio API로 합성하는 효과음 (음원 파일 불필요)
type SoundName = 'discard' | 'draw' | 'riichi' | 'call' | 'hora' | 'bigHora' | 'ryuukyoku'

const STORAGE_MUTED = 'riichi-sound-muted'
const STORAGE_VOLUME = 'riichi-sound-volume'

let ctx: AudioContext | null = null
let muted = localStorage.getItem(STORAGE_MUTED) === '1'
let volume = Number(localStorage.getItem(STORAGE_VOLUME) ?? '0.6')
if (!Number.isFinite(volume)) volume = 0.6

function getCtx(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// 브라우저 자동재생 정책: 첫 사용자 입력에서 AudioContext 활성화
export function unlockAudio() {
  getCtx()
}

export function isMuted() {
  return muted
}
export function getVolume() {
  return volume
}
export function setMuted(v: boolean) {
  muted = v
  localStorage.setItem(STORAGE_MUTED, v ? '1' : '0')
}
export function setVolume(v: number) {
  volume = Math.min(1, Math.max(0, v))
  localStorage.setItem(STORAGE_VOLUME, String(volume))
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType = 'sine',
  freqEnd?: number,
) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain * volume, start + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g).connect(c.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

function noiseBurst(c: AudioContext, start: number, dur: number, gain: number, cutoff: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  const g = c.createGain()
  g.gain.value = gain * volume
  src.connect(filter).connect(g).connect(c.destination)
  src.start(start)
}

export function playSound(name: SoundName) {
  if (muted || volume <= 0) return
  const c = getCtx()
  if (!c) return
  const t = c.currentTime

  switch (name) {
    case 'discard': // 패를 탁 내려놓는 소리
      noiseBurst(c, t, 0.06, 0.9, 3500)
      tone(c, 220, t, 0.08, 0.5, 'triangle', 90)
      break
    case 'draw': // 가벼운 쯔모 소리
      noiseBurst(c, t, 0.04, 0.35, 5000)
      break
    case 'riichi': // 리치봉 "딩"
      tone(c, 880, t, 0.5, 0.45, 'sine')
      tone(c, 1320, t + 0.02, 0.45, 0.25, 'sine')
      noiseBurst(c, t, 0.05, 0.4, 4000)
      break
    case 'call': // 치/퐁/깡
      tone(c, 523, t, 0.12, 0.4, 'square')
      tone(c, 784, t + 0.1, 0.18, 0.4, 'square')
      break
    case 'hora': // 론/쯔모 화료
      tone(c, 392, t, 0.18, 0.5, 'triangle')
      tone(c, 523, t + 0.14, 0.18, 0.5, 'triangle')
      tone(c, 659, t + 0.28, 0.18, 0.5, 'triangle')
      tone(c, 784, t + 0.42, 0.6, 0.55, 'triangle')
      break
    case 'bigHora': // 만관 이상 팡파르
      ;[392, 523, 659, 784, 1046].forEach((f, i) => tone(c, f, t + i * 0.12, 0.3, 0.5, 'sawtooth'))
      tone(c, 1046, t + 0.65, 0.9, 0.55, 'triangle')
      tone(c, 1318, t + 0.65, 0.9, 0.35, 'triangle')
      noiseBurst(c, t + 0.65, 0.25, 0.4, 6000)
      break
    case 'ryuukyoku': // 유국: 하강음
      tone(c, 440, t, 0.5, 0.4, 'sine', 220)
      tone(c, 330, t + 0.3, 0.6, 0.4, 'sine', 165)
      break
  }
}
