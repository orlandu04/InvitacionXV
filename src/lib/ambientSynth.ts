/**
 * Sintetizador ambiental generativo — respaldo elegante cuando no existe
 * el archivo de música. Produce un arpegio suave tipo "caja de música"
 * con delay etéreo, usando Web Audio API.
 */
export class AmbientSynth {
  /** Escala pentatónica de Re mayor — dulce y celebratoria */
  private static readonly MELODY = [587.33, 659.25, 739.99, 880, 987.77, 880, 739.99, 659.25]
  private static readonly DRONE = [146.83, 220] // D3 · A3

  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private delaySend: DelayNode | null = null
  private droneGain: GainNode | null = null
  private droneNodes: OscillatorNode[] = []
  private schedulerId: number | null = null
  private nextNoteTime = 0
  private step = 0
  private volume = 0.65

  get isAvailable(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window
  }

  async play(): Promise<void> {
    if (!this.isAvailable) throw new Error('WebAudio no disponible')
    this.ensureGraph()
    await this.ctx!.resume()
    if (this.schedulerId === null) {
      this.nextNoteTime = this.ctx!.currentTime + 0.08
      this.schedulerId = window.setInterval(() => this.schedule(), 240)
      this.startDrone()
    }
  }

  pause(): void {
    void this.ctx?.suspend()
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId)
      this.schedulerId = null
    }
  }

  setVolume(value: number): void {
    this.volume = value
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value * 0.5, this.ctx.currentTime, 0.15)
    }
  }

  dispose(): void {
    this.pause()
    for (const osc of this.droneNodes) {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        /* ya detenido */
      }
    }
    this.droneNodes = []
    try {
      this.droneGain?.disconnect()
    } catch {
      /* noop */
    }
    this.droneGain = null
    void this.ctx?.close()
    this.ctx = null
    this.master = null
    this.delaySend = null
  }

  /* ── internos ─────────────────────────────────────────── */

  private ensureGraph(): void {
    if (this.ctx) return

    const ctx = new window.AudioContext()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = this.volume * 0.5
    this.master.connect(ctx.destination)

    // Delay con realimentación filtrada — brillo etéreo sin reverb costosa
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.42
    const feedback = ctx.createGain()
    feedback.gain.value = 0.34
    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2600

    delay.connect(damp)
    damp.connect(feedback)
    feedback.connect(delay)

    const wet = ctx.createGain()
    wet.gain.value = 0.4
    delay.connect(wet)
    wet.connect(ctx.destination)

    this.delaySend = delay
  }

  private startDrone(): void {
    const ctx = this.ctx!
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.05
    droneGain.connect(this.master!)
    this.droneGain = droneGain

    for (const freq of AmbientSynth.DRONE) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(droneGain)
      osc.start()
      this.droneNodes.push(osc)
    }
  }

  private schedule(): void {
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running') return

    while (this.nextNoteTime < ctx.currentTime + 0.5) {
      this.pluck(AmbientSynth.MELODY[this.step % AmbientSynth.MELODY.length], this.nextNoteTime)
      this.step += 1
      this.nextNoteTime += this.step % 8 === 0 ? 1.9 : 0.95
    }
  }

  private pluck(freq: number, at: number): void {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, at)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.22, at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.2)

    osc.connect(gain)
    gain.connect(this.master!)
    if (this.delaySend) gain.connect(this.delaySend)

    osc.start(at)
    osc.stop(at + 2.4)
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
  }
}
