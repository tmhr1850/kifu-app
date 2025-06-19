'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAudio } from '@/contexts/AudioContext'
import { useRouter } from 'next/navigation'
import type { BoardTheme } from '@/contexts/ThemeContext'

const boardThemes: { value: BoardTheme; label: string; description: string }[] = [
  { value: 'traditional', label: '伝統的', description: '昔ながらの木目調の盤面' },
  { value: 'modern', label: 'モダン', description: 'シンプルでクリーンなデザイン' },
  { value: 'dark', label: 'ダーク', description: '目に優しい暗めの配色' },
  { value: 'sakura', label: '桜', description: '春を感じるピンク系の配色' },
  { value: 'ocean', label: '海', description: '爽やかなブルー系の配色' },
]

const bgmOptions = [
  { value: 'traditional', label: '伝統的', description: '和風の落ち着いたBGM' },
  { value: 'modern', label: 'モダン', description: '現代的な軽快なBGM' },
  { value: 'ambient', label: 'アンビエント', description: '集中できる環境音' },
  { value: null, label: 'なし', description: 'BGMを再生しない' },
]

export default function SettingsPage() {
  const { themeMode, boardTheme, setThemeMode, setBoardTheme } = useTheme()
  const { settings, updateSettings } = useAudio()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">設定</h1>
        </div>

        <div className="space-y-8">
          {/* ダークモード設定 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">表示モード</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span>ライトモード</span>
                <input
                  type="radio"
                  name="themeMode"
                  value="light"
                  checked={themeMode === 'light'}
                  onChange={() => setThemeMode('light')}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>ダークモード</span>
                <input
                  type="radio"
                  name="themeMode"
                  value="dark"
                  checked={themeMode === 'dark'}
                  onChange={() => setThemeMode('dark')}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </section>

          {/* 盤面テーマ設定 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">盤面テーマ</h2>
            <div className="space-y-4">
              {boardThemes.map((theme) => (
                <label
                  key={theme.value}
                  className="flex items-start cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <input
                    type="radio"
                    name="boardTheme"
                    value={theme.value}
                    checked={boardTheme === theme.value}
                    onChange={() => setBoardTheme(theme.value)}
                    className="mt-1 mr-3 w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">{theme.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {theme.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* 音声設定 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">音声設定</h2>
            
            {/* マスターボリューム */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="masterVolume" className="font-medium">
                  マスターボリューム
                </label>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                id="masterVolume"
                type="range"
                min="0"
                max="100"
                value={settings.masterVolume * 100}
                onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* 効果音設定 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">効果音</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isEffectsEnabled}
                    onChange={(e) => updateSettings({ isEffectsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {settings.isEffectsEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="effectsVolume" className="text-sm">
                      効果音の音量
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(settings.effectsVolume * 100)}%
                    </span>
                  </div>
                  <input
                    id="effectsVolume"
                    type="range"
                    min="0"
                    max="100"
                    value={settings.effectsVolume * 100}
                    onChange={(e) => updateSettings({ effectsVolume: Number(e.target.value) / 100 })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              )}
            </div>

            {/* BGM設定 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">BGM</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isBgmEnabled}
                    onChange={(e) => updateSettings({ isBgmEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {settings.isBgmEnabled && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="bgmVolume" className="text-sm">
                        BGMの音量
                      </label>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(settings.bgmVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id="bgmVolume"
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bgmVolume * 100}
                      onChange={(e) => updateSettings({ bgmVolume: Number(e.target.value) / 100 })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">BGM選択</label>
                    <div className="space-y-2">
                      {bgmOptions.map((option) => (
                        <label
                          key={option.value || 'none'}
                          className="flex items-start cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <input
                            type="radio"
                            name="bgm"
                            value={option.value || ''}
                            checked={settings.selectedBgm === option.value}
                            onChange={() => updateSettings({ selectedBgm: option.value })}
                            className="mt-1 mr-3 w-4 h-4"
                          />
                          <div>
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {option.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ミュート */}
            <div className="flex items-center justify-between">
              <span className="font-medium">すべてミュート</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isMuted}
                  onChange={(e) => updateSettings({ isMuted: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>
          </section>

          {/* プレビュー */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">プレビュー</h2>
            <div className="flex justify-center">
              <div
                className="relative border-2"
                style={{
                  width: '200px',
                  height: '200px',
                  backgroundColor: 'var(--board-bg)',
                  borderColor: 'var(--board-grid)',
                }}
              >
                {/* 簡易的な盤面グリッド */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="border"
                      style={{ borderColor: 'var(--board-grid)' }}
                    />
                  ))}
                </div>
                {/* サンプル駒 */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: 'var(--piece-bg)',
                    color: 'var(--piece-text)',
                  }}
                >
                  王
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}