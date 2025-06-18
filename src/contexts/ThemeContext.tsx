'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'
export type BoardTheme = 'traditional' | 'modern' | 'dark' | 'sakura' | 'ocean'
export type PieceDesign = 'standard' | 'kanji' | 'international' // 将来的に複数デザイン対応

interface ThemeContextType {
  themeMode: ThemeMode
  boardTheme: BoardTheme
  pieceDesign: PieceDesign
  setThemeMode: (mode: ThemeMode) => void
  setBoardTheme: (theme: BoardTheme) => void
  setPieceDesign: (design: PieceDesign) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('traditional')
  const [pieceDesign, setPieceDesign] = useState<PieceDesign>('standard')

  // LocalStorageから設定を読み込み
  useEffect(() => {
    const savedThemeMode = localStorage.getItem('themeMode') as ThemeMode
    const savedBoardTheme = localStorage.getItem('boardTheme') as BoardTheme
    const savedPieceDesign = localStorage.getItem('pieceDesign') as PieceDesign

    if (savedThemeMode) setThemeMode(savedThemeMode)
    if (savedBoardTheme) setBoardTheme(savedBoardTheme)
    if (savedPieceDesign) setPieceDesign(savedPieceDesign)
  }, [])

  // 設定変更時にLocalStorageに保存
  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode)
    localStorage.setItem('themeMode', mode)
  }

  const handleSetBoardTheme = (theme: BoardTheme) => {
    setBoardTheme(theme)
    localStorage.setItem('boardTheme', theme)
  }

  const handleSetPieceDesign = (design: PieceDesign) => {
    setPieceDesign(design)
    localStorage.setItem('pieceDesign', design)
  }

  // テーマに応じたCSS変数を設定
  useEffect(() => {
    const root = document.documentElement
    const isDark = themeMode === 'dark'

    // 盤面テーマの色設定
    switch (boardTheme) {
      case 'traditional':
        root.style.setProperty('--board-bg', isDark ? '#3d2e1f' : '#d4a574')
        root.style.setProperty('--board-grid', isDark ? '#2a1f14' : '#8b6f47')
        root.style.setProperty('--square-hover', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        break
      case 'modern':
        root.style.setProperty('--board-bg', isDark ? '#2d3748' : '#f7fafc')
        root.style.setProperty('--board-grid', isDark ? '#1a202c' : '#cbd5e0')
        root.style.setProperty('--square-hover', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        break
      case 'dark':
        root.style.setProperty('--board-bg', '#1a1a1a')
        root.style.setProperty('--board-grid', '#333333')
        root.style.setProperty('--square-hover', 'rgba(255, 255, 255, 0.1)')
        break
      case 'sakura':
        root.style.setProperty('--board-bg', isDark ? '#4a2c3d' : '#ffe0ec')
        root.style.setProperty('--board-grid', isDark ? '#2d1a24' : '#ffb3c6')
        root.style.setProperty('--square-hover', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 0, 100, 0.1)')
        break
      case 'ocean':
        root.style.setProperty('--board-bg', isDark ? '#1a2f4a' : '#e0f2fe')
        root.style.setProperty('--board-grid', isDark ? '#0f1a2a' : '#7dd3fc')
        root.style.setProperty('--square-hover', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 100, 255, 0.1)')
        break
    }

    // ダークモード設定
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [themeMode, boardTheme])

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        boardTheme,
        pieceDesign,
        setThemeMode: handleSetThemeMode,
        setBoardTheme: handleSetBoardTheme,
        setPieceDesign: handleSetPieceDesign,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}