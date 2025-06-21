import React from 'react'
import { render, screen } from '@testing-library/react'
import { EvaluationDisplay } from '../EvaluationDisplay'
import { Player } from '@/types/shogi'
import type { PositionAnalysis, EvaluationDisplaySettings } from '@/types/analysis'

describe('EvaluationDisplay', () => {
  const mockAnalysis: PositionAnalysis = {
    score: 150, // センチポーン（1.5ポーン）
    depth: 15,
    bestMove: {
      from: { row: 7, col: 7 },
      to: { row: 6, col: 7 },
      piece: 'FU',
      player: 'SENTE'
    },
    pv: [],
    nodesEvaluated: 1234567
  }

  it('分析データがない場合は待機中メッセージを表示すること', () => {
    render(
      <EvaluationDisplay
        analysis={null}
        currentPlayer={Player.SENTE}
      />
    )

    expect(screen.getByText('分析待機中...')).toBeInTheDocument()
  })

  it('デフォルト設定で正しく表示されること', () => {
    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    expect(screen.getByRole('heading', { name: '局面評価' })).toBeInTheDocument()
    expect(screen.getByText('評価値')).toBeInTheDocument()
    expect(screen.getByText('+1.5')).toBeInTheDocument()
    expect(screen.getByText('先手優勢')).toBeInTheDocument()
    expect(screen.getByText('探索深度')).toBeInTheDocument()
    expect(screen.getByText('15手')).toBeInTheDocument()
    expect(screen.getByText('評価局面数')).toBeInTheDocument()
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })

  it('後手優勢の場合の表示が正しいこと', () => {
    const goteAnalysis = {
      ...mockAnalysis,
      score: -250 // -2.5ポーン
    }

    render(
      <EvaluationDisplay
        analysis={goteAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    expect(screen.getByText('-2.5')).toBeInTheDocument()
    expect(screen.getByText('後手優勢')).toBeInTheDocument()
  })

  it('評価値0の場合は互角と表示されること', () => {
    const evenAnalysis = {
      ...mockAnalysis,
      score: 0
    }

    render(
      <EvaluationDisplay
        analysis={evenAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    expect(screen.getByText('-0.0')).toBeInTheDocument()
    expect(screen.getByText('後手優勢')).toBeInTheDocument() // 0は後手として扱われる
  })

  it('精度設定が反映されること', () => {
    const settings: EvaluationDisplaySettings = {
      showNumeric: true,
      showBar: true,
      showAdvantage: true,
      precision: 2
    }

    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
        settings={settings}
      />
    )

    expect(screen.getByText('+1.50')).toBeInTheDocument()
  })

  it('数値表示を非表示にできること', () => {
    const settings: EvaluationDisplaySettings = {
      showNumeric: false,
      showBar: true,
      showAdvantage: true,
      precision: 1
    }

    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
        settings={settings}
      />
    )

    expect(screen.queryByText('評価値')).not.toBeInTheDocument()
    expect(screen.queryByText('+1.5')).not.toBeInTheDocument()
  })

  it('優勢表示を非表示にできること', () => {
    const settings: EvaluationDisplaySettings = {
      showNumeric: true,
      showBar: true,
      showAdvantage: false,
      precision: 1
    }

    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
        settings={settings}
      />
    )

    expect(screen.getByText('+1.5')).toBeInTheDocument()
    expect(screen.queryByText('先手優勢')).not.toBeInTheDocument()
  })

  it('評価バーを非表示にできること', () => {
    const settings: EvaluationDisplaySettings = {
      showNumeric: true,
      showBar: false,
      showAdvantage: true,
      precision: 1
    }

    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
        settings={settings}
      />
    )

    expect(screen.queryByText('先手')).not.toBeInTheDocument()
    expect(screen.queryByText('互角')).not.toBeInTheDocument()
    expect(screen.queryByText('後手')).not.toBeInTheDocument()
  })

  it('評価バーの位置が正しく計算されること', () => {
    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    // バーの要素を探す
    const bar = screen.getByText('互角').closest('.relative')?.querySelector('.bg-gradient-to-r')
    expect(bar).toHaveStyle({ width: '57.5%' }) // (15 + 100) / 2 = 57.5%
  })

  it('極端な評価値でもバーが範囲内に収まること', () => {
    const extremeAnalysis = {
      ...mockAnalysis,
      score: 5000 // +50ポーン
    }

    render(
      <EvaluationDisplay
        analysis={extremeAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    const bar = screen.getByText('互角').closest('.relative')?.querySelector('.bg-gradient-to-r')
    expect(bar).toHaveStyle({ width: '100%' }) // 最大100%
  })

  it('負の極端な評価値でもバーが範囲内に収まること', () => {
    const extremeAnalysis = {
      ...mockAnalysis,
      score: -5000 // -50ポーン
    }

    render(
      <EvaluationDisplay
        analysis={extremeAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    const bar = screen.getByText('互角').closest('.relative')?.querySelector('.bg-gradient-to-r')
    expect(bar).toHaveStyle({ width: '0%' }) // 最小0%
  })

  it('カスタムクラス名が適用されること', () => {
    render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
        className="custom-class"
      />
    )

    const container = screen.getByRole('heading', { name: '局面評価' }).parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('評価値の色が正しく適用されること', () => {
    const { rerender } = render(
      <EvaluationDisplay
        analysis={mockAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    // 先手優勢は青色
    let scoreElement = screen.getByText('+1.5')
    expect(scoreElement).toHaveClass('text-blue-600')

    // 後手優勢は赤色
    const goteAnalysis = {
      ...mockAnalysis,
      score: -150
    }
    
    rerender(
      <EvaluationDisplay
        analysis={goteAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    scoreElement = screen.getByText('-1.5')
    expect(scoreElement).toHaveClass('text-red-600')
  })

  it('大きな評価局面数が正しくフォーマットされること', () => {
    const bigNumberAnalysis = {
      ...mockAnalysis,
      nodesEvaluated: 1234567890
    }

    render(
      <EvaluationDisplay
        analysis={bigNumberAnalysis}
        currentPlayer={Player.SENTE}
      />
    )

    expect(screen.getByText('1,234,567,890')).toBeInTheDocument()
  })

  it('探索深度0でも正しく表示されること', () => {
    const shallowAnalysis = {
      ...mockAnalysis,
      depth: 0
    }

    render(
      <EvaluationDisplay
        analysis={shallowAnalysis}
        currentPlayer={Player.GOTE}
      />
    )

    expect(screen.getByText('0手')).toBeInTheDocument()
  })

  it('分析待機中の表示に正しいスタイルが適用されること', () => {
    render(
      <EvaluationDisplay
        analysis={null}
        currentPlayer={Player.SENTE}
        className="custom-class"
      />
    )

    const container = screen.getByText('分析待機中...').parentElement
    expect(container).toHaveClass('bg-gray-100', 'rounded-lg', 'p-4', 'custom-class')
  })
})