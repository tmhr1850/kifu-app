import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalysisBoard } from '../AnalysisBoard'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { GameState, Move } from '@/types/shogi'
import type { Analysis } from '@/types/analysis'

// モック
jest.mock('@/hooks/useAnalysis')
jest.mock('../SimpleBoard', () => ({
  SimpleBoard: ({ gameState, highlightedSquares, showCoordinates, flipped, className }: any) => (
    <div data-testid="simple-board" className={className}>
      SimpleBoard - Highlighted: {highlightedSquares.length}
    </div>
  )
}))
jest.mock('../EvaluationDisplay', () => ({
  EvaluationDisplay: ({ analysis, currentPlayer, settings }: any) => (
    <div data-testid="evaluation-display">
      EvaluationDisplay - Player: {currentPlayer}
    </div>
  )
}))
jest.mock('../RecommendedMoves', () => ({
  RecommendedMoves: ({ analysis, onMoveClick, highlightedMove }: any) => (
    <div data-testid="recommended-moves">
      <button onClick={() => onMoveClick({ from: {row: 7, col: 7}, to: {row: 6, col: 7}, piece: 'FU', player: 'SENTE' })}>
        推奨手
      </button>
    </div>
  )
}))
jest.mock('../EvaluationGraph', () => ({
  EvaluationGraph: ({ history, currentMove, onMoveClick, settings }: any) => (
    <div data-testid="evaluation-graph">
      <button onClick={() => onMoveClick(5)}>手数5</button>
    </div>
  )
}))
jest.mock('../AnalysisModePanel', () => ({
  AnalysisModePanel: ({ mode, settings, onModeChange, onSettingsChange, isAnalyzing }: any) => (
    <div data-testid="analysis-mode-panel">
      <button onClick={() => onModeChange('analyzing')}>分析開始</button>
      <button onClick={() => onModeChange('off')}>分析停止</button>
    </div>
  )
}))
jest.mock('../AnalysisExportDialog', () => ({
  AnalysisExportDialog: ({ isOpen, onClose, evaluationHistory, analyses, metadata }: any) => 
    isOpen ? (
      <div data-testid="export-dialog">
        <button onClick={onClose}>閉じる</button>
      </div>
    ) : null
}))

describe('AnalysisBoard', () => {
  const mockGameState: GameState = {
    board: Array(9).fill(null).map(() => Array(9).fill(null)),
    currentPlayer: 'SENTE',
    capturedPieces: { SENTE: {}, GOTE: {} },
    moveCount: 0,
    lastMove: null,
    isCheck: false,
    isCheckmate: false,
    winner: null
  }

  const mockAnalysis: Analysis = {
    evaluation: 150,
    depth: 15,
    principal_variation: [],
    candidate_moves: []
  }

  const mockUseAnalysis = {
    currentAnalysis: mockAnalysis,
    evaluationHistory: [
      { moveNumber: 0, evaluation: 0 },
      { moveNumber: 1, evaluation: 50 },
      { moveNumber: 2, evaluation: 150 }
    ],
    analysisCache: new Map(),
    mode: 'off' as const,
    settings: {
      depth: 15,
      multipv: 3,
      timeLimit: 5000
    },
    isAnalyzing: false,
    startAnalysis: jest.fn(),
    stopAnalysis: jest.fn(),
    updateSettings: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAnalysis as jest.Mock).mockReturnValue(mockUseAnalysis)
  })

  it('基本的なレイアウトが正しく表示されること', () => {
    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    expect(screen.getByRole('heading', { name: '局面分析' })).toBeInTheDocument()
    expect(screen.getByTestId('simple-board')).toBeInTheDocument()
    expect(screen.getByTestId('evaluation-display')).toBeInTheDocument()
    expect(screen.getByTestId('recommended-moves')).toBeInTheDocument()
    expect(screen.getByTestId('evaluation-graph')).toBeInTheDocument()
    expect(screen.getByTestId('analysis-mode-panel')).toBeInTheDocument()
  })

  it('エクスポートボタンが表示されること', () => {
    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    const exportButton = screen.getByRole('button', { name: '分析結果をエクスポート' })
    expect(exportButton).toBeInTheDocument()
    expect(exportButton).not.toBeDisabled()
  })

  it('評価履歴が空の場合エクスポートボタンが無効化されること', () => {
    ;(useAnalysis as jest.Mock).mockReturnValue({
      ...mockUseAnalysis,
      evaluationHistory: []
    })

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={0}
      />
    )

    const exportButton = screen.getByRole('button', { name: '分析結果をエクスポート' })
    expect(exportButton).toBeDisabled()
  })

  it('推奨手をクリックすると盤面にハイライトが表示されること', async () => {
    const user = userEvent.setup()
    const mockOnMoveSelect = jest.fn()

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
        onMoveSelect={mockOnMoveSelect}
      />
    )

    // 推奨手をクリック
    await user.click(screen.getByRole('button', { name: '推奨手' }))

    // SimpleBoardに2つのハイライトが表示される（移動元と移動先）
    await waitFor(() => {
      expect(screen.getByText('SimpleBoard - Highlighted: 2')).toBeInTheDocument()
    })

    // コールバックが呼ばれる
    expect(mockOnMoveSelect).toHaveBeenCalledWith({
      from: {row: 7, col: 7},
      to: {row: 6, col: 7},
      piece: 'FU',
      player: 'SENTE'
    })
  })

  it('グラフから手数を選択できること', async () => {
    const user = userEvent.setup()
    const mockOnMoveNumberChange = jest.fn()

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
        onMoveNumberChange={mockOnMoveNumberChange}
      />
    )

    await user.click(screen.getByRole('button', { name: '手数5' }))

    expect(mockOnMoveNumberChange).toHaveBeenCalledWith(5)
  })

  it('分析を開始できること', async () => {
    const user = userEvent.setup()

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    await user.click(screen.getByRole('button', { name: '分析開始' }))

    expect(mockUseAnalysis.startAnalysis).toHaveBeenCalled()
  })

  it('分析を停止できること', async () => {
    const user = userEvent.setup()

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    await user.click(screen.getByRole('button', { name: '分析停止' }))

    expect(mockUseAnalysis.stopAnalysis).toHaveBeenCalled()
  })

  it('エクスポートダイアログを開閉できること', async () => {
    const user = userEvent.setup()

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    // 初期状態ではダイアログは表示されない
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()

    // エクスポートボタンをクリック
    await user.click(screen.getByRole('button', { name: '分析結果をエクスポート' }))

    // ダイアログが表示される
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument()

    // 閉じるボタンをクリック
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    // ダイアログが閉じる
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()
  })

  it('カスタムクラス名が適用されること', () => {
    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
        className="custom-class"
      />
    )

    const container = screen.getByRole('heading', { name: '局面分析' }).closest('.custom-class')
    expect(container).toBeInTheDocument()
  })

  it('現在のプレイヤー情報が評価表示に渡されること', () => {
    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    expect(screen.getByText('EvaluationDisplay - Player: SENTE')).toBeInTheDocument()
  })

  it('GOTEの手番でも正しく表示されること', () => {
    const goteGameState = {
      ...mockGameState,
      currentPlayer: 'GOTE' as const
    }

    render(
      <AnalysisBoard
        gameState={goteGameState}
        currentMoveNumber={3}
      />
    )

    expect(screen.getByText('EvaluationDisplay - Player: GOTE')).toBeInTheDocument()
  })

  it('手の移動元または移動先がnullの場合でもエラーにならないこと', async () => {
    const user = userEvent.setup()
    
    // RecommendedMovesのモックを更新
    jest.mocked(require('../RecommendedMoves')).RecommendedMoves = ({ onMoveClick }: any) => (
      <div data-testid="recommended-moves">
        <button onClick={() => onMoveClick({ from: null, to: {row: 6, col: 7}, piece: 'FU', player: 'SENTE' })}>
          駒台から
        </button>
      </div>
    )

    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    // エラーなくクリックできること
    await user.click(screen.getByRole('button', { name: '駒台から' }))

    // ハイライトは1つのみ（移動先のみ）
    expect(screen.getByText('SimpleBoard - Highlighted: 1')).toBeInTheDocument()
  })

  it('レスポンシブレイアウトが適用されていること', () => {
    render(
      <AnalysisBoard
        gameState={mockGameState}
        currentMoveNumber={2}
      />
    )

    const grid = screen.getByRole('heading', { name: '局面分析' })
      .closest('.bg-white')
      ?.parentElement
      ?.parentElement

    expect(grid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6')
  })
})