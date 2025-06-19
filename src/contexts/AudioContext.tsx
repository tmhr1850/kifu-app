'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AudioSettings {
  masterVolume: number
  effectsVolume: number
  bgmVolume: number
  isMuted: boolean
  selectedBgm: string | null
  isEffectsEnabled: boolean
  isBgmEnabled: boolean
}

interface AudioContextType {
  settings: AudioSettings
  updateSettings: (settings: Partial<AudioSettings>) => void
  playSound: (soundType: SoundType) => void
  startBgm: () => void
  stopBgm: () => void
}

export enum SoundType {
  MOVE = 'move',
  CAPTURE = 'capture',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  PROMOTION = 'promotion',
  DROP = 'drop',
  GAME_START = 'gameStart',
  GAME_END = 'gameEnd',
  CLICK = 'click',
  ERROR = 'error'
}

const defaultSettings: AudioSettings = {
  masterVolume: 0.7,
  effectsVolume: 0.8,
  bgmVolume: 0.5,
  isMuted: false,
  selectedBgm: null,
  isEffectsEnabled: true,
  isBgmEnabled: false
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(defaultSettings)
  const [soundManager, setSoundManager] = useState<{ 
    updateSettings: (settings: AudioSettings) => void;
    playSound: (soundType: SoundType) => void;
    startBgm: (trackName: string) => void;
    stopBgm: () => void;
  } | null>(null)

  useEffect(() => {
    const loadedSettings = localStorage.getItem('audioSettings')
    if (loadedSettings) {
      setSettings(JSON.parse(loadedSettings))
    }

    const initSoundManager = async () => {
      const { SoundManager } = await import('@/utils/audio/soundManager')
      const manager = new SoundManager()
      setSoundManager(manager)
    }

    initSoundManager()
  }, [])

  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(settings))
    
    if (soundManager) {
      soundManager.updateSettings(settings)
    }
  }, [settings, soundManager])

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const playSound = (soundType: SoundType) => {
    if (soundManager && settings.isEffectsEnabled && !settings.isMuted) {
      soundManager.playSound(soundType)
    }
  }

  const startBgm = () => {
    if (soundManager && settings.isBgmEnabled && !settings.isMuted && settings.selectedBgm) {
      soundManager.startBgm(settings.selectedBgm)
    }
  }

  const stopBgm = () => {
    if (soundManager) {
      soundManager.stopBgm()
    }
  }

  return (
    <AudioContext.Provider value={{
      settings,
      updateSettings,
      playSound,
      startBgm,
      stopBgm
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}