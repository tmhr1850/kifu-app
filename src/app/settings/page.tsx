'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import type { BoardTheme } from '@/contexts/ThemeContext'

const boardThemes: { value: BoardTheme; label: string; description: string }[] = [
  { value: 'traditional', label: '伝統的', description: '昔ながらの木目調の盤面' },
  { value: 'modern', label: 'モダン', description: 'シンプルでクリーンなデザイン' },
  { value: 'dark', label: 'ダーク', description: '目に優しい暗めの配色' },
  { value: 'sakura', label: '桜', description: '春を感じるピンク系の配色' },
  { value: 'ocean', label: '海', description: '爽やかなブルー系の配色' },
]

export default function SettingsPage() {
  const { themeMode, boardTheme, setThemeMode, setBoardTheme } = useTheme()
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