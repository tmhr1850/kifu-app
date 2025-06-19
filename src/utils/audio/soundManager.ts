import { SoundType } from '@/contexts/AudioContext'

interface AudioSettings {
  masterVolume: number
  effectsVolume: number
  bgmVolume: number
  isMuted: boolean
  selectedBgm: string | null
  isEffectsEnabled: boolean
  isBgmEnabled: boolean
}

interface SoundConfig {
  frequency: number
  duration: number
  type: OscillatorType
  gain?: number
}

export class SoundManager {
  private audioContext!: AudioContext
  private bgmElement: HTMLAudioElement | null = null
  private settings: AudioSettings = {
    masterVolume: 0.7,
    effectsVolume: 0.8,
    bgmVolume: 0.5,
    isMuted: false,
    selectedBgm: null,
    isEffectsEnabled: true,
    isBgmEnabled: false
  }

  // Web Audio API で生成する効果音の設定
  private soundConfigs: Record<SoundType, SoundConfig> = {
    [SoundType.MOVE]: { frequency: 800, duration: 100, type: 'sine', gain: 0.3 },
    [SoundType.CAPTURE]: { frequency: 600, duration: 150, type: 'square', gain: 0.2 },
    [SoundType.CHECK]: { frequency: 1200, duration: 200, type: 'sawtooth', gain: 0.4 },
    [SoundType.CHECKMATE]: { frequency: 400, duration: 500, type: 'sine', gain: 0.5 },
    [SoundType.PROMOTION]: { frequency: 1000, duration: 300, type: 'triangle', gain: 0.3 },
    [SoundType.DROP]: { frequency: 700, duration: 80, type: 'sine', gain: 0.25 },
    [SoundType.GAME_START]: { frequency: 880, duration: 400, type: 'sine', gain: 0.4 },
    [SoundType.GAME_END]: { frequency: 440, duration: 600, type: 'sine', gain: 0.4 },
    [SoundType.CLICK]: { frequency: 1000, duration: 50, type: 'sine', gain: 0.1 },
    [SoundType.ERROR]: { frequency: 200, duration: 200, type: 'sawtooth', gain: 0.3 }
  }

  // BGM のプレースホルダー（実際の音楽ファイルは後で追加）
  private bgmTracks = {
    traditional: '/audio/bgm/traditional.mp3',
    modern: '/audio/bgm/modern.mp3',
    ambient: '/audio/bgm/ambient.mp3',
    silence: null
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
    }
  }

  updateSettings(settings: AudioSettings) {
    this.settings = settings
    
    if (this.bgmElement) {
      this.bgmElement.volume = settings.masterVolume * settings.bgmVolume
      this.bgmElement.muted = settings.isMuted || !settings.isBgmEnabled
    }
  }

  playSound(soundType: SoundType) {
    if (this.settings.isMuted || !this.settings.isEffectsEnabled) return

    const config = this.soundConfigs[soundType]
    if (!config) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = config.type
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime)

      const effectiveGain = (config.gain || 0.3) * this.settings.masterVolume * this.settings.effectsVolume
      gainNode.gain.setValueAtTime(effectiveGain, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration / 1000)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + config.duration / 1000)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  startBgm(trackName: string) {
    if (this.settings.isMuted || !this.settings.isBgmEnabled) return

    const trackUrl = this.bgmTracks[trackName as keyof typeof this.bgmTracks]
    if (!trackUrl || trackUrl === this.bgmElement?.src) return

    this.stopBgm()

    try {
      this.bgmElement = new Audio(trackUrl)
      this.bgmElement.loop = true
      this.bgmElement.volume = this.settings.masterVolume * this.settings.bgmVolume
      this.bgmElement.play().catch(error => {
        console.error('Error playing BGM:', error)
      })
    } catch (error) {
      console.error('Error loading BGM:', error)
    }
  }

  stopBgm() {
    if (this.bgmElement) {
      this.bgmElement.pause()
      this.bgmElement = null
    }
  }

  // 特殊な効果音を生成（例：王手の警告音）
  playCheckWarning() {
    if (this.settings.isMuted || !this.settings.isEffectsEnabled) return

    try {
      // 2つの音を組み合わせて警告音を作成
      const duration = 0.3
      const now = this.audioContext.currentTime

      // 高音
      const osc1 = this.audioContext.createOscillator()
      const gain1 = this.audioContext.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(1200, now)
      osc1.frequency.exponentialRampToValueAtTime(800, now + duration / 2)
      gain1.gain.setValueAtTime(0.2 * this.settings.masterVolume * this.settings.effectsVolume, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + duration)

      // 低音
      const osc2 = this.audioContext.createOscillator()
      const gain2 = this.audioContext.createGain()
      osc2.type = 'sawtooth'
      osc2.frequency.setValueAtTime(400, now)
      gain2.gain.setValueAtTime(0.1 * this.settings.masterVolume * this.settings.effectsVolume, now)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + duration)

      osc1.connect(gain1)
      gain1.connect(this.audioContext.destination)
      osc2.connect(gain2)
      gain2.connect(this.audioContext.destination)

      osc1.start(now)
      osc1.stop(now + duration)
      osc2.start(now)
      osc2.stop(now + duration)
    } catch (error) {
      console.error('Error playing check warning:', error)
    }
  }

  // 詰みの祝福音
  playCheckmateVictory() {
    if (this.settings.isMuted || !this.settings.isEffectsEnabled) return

    try {
      const now = this.audioContext.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

      notes.forEach((freq, index) => {
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + index * 0.1)
        
        const startTime = now + index * 0.1
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.3 * this.settings.masterVolume * this.settings.effectsVolume, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

        osc.connect(gain)
        gain.connect(this.audioContext.destination)
        
        osc.start(startTime)
        osc.stop(startTime + 0.5)
      })
    } catch (error) {
      console.error('Error playing checkmate victory:', error)
    }
  }
}