import React from 'react'
import { render, screen } from '@testing-library/react'
import { SimpleBoard } from '../SimpleBoard'
import type { GameState } from '@/types/shogi'

// Pieceコンポーネントをモック
jest.mock('../../shogi/Piece', () => ({
  Piece: ({ type, isGote }: any) => (
    <div data-testid="piece">{type}-{isGote ? 'GOTE' : 'SENTE'}</div>
  )
}))

describe('SimpleBoard', () => {
  const createEmptyBoard = () => Array(9).fill(null).map(() => Array(9).fill(null))

  const mockGameState: GameState = {
    board: createEmptyBoard(),
    currentPlayer: 'SENTE',
    capturedPieces: { SENTE: {}, GOTE: {} },
    moveCount: 0,
    lastMove: null,
    isCheck: false,
    isCheckmate: false,
    winner: null
  }

  it('空の盤面が正しく表示されること', () => {
    render(<SimpleBoard gameState={mockGameState} />)

    // 9x9 = 81マスが表示される
    const squares = screen.getByRole('img', { hidden: true }).parentElement?.querySelectorAll('.w-12.h-12')
    expect(squares).toHaveLength(81)
  })

  it('座標が表示されること', () => {
    render(<SimpleBoard gameState={mockGameState} showCoordinates={true} />)

    // 列番号（1-9）
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument()
    }

    // 行ラベル（一-九）
    const rowLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
    rowLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it('座標を非表示にできること', () => {
    render(<SimpleBoard gameState={mockGameState} showCoordinates={false} />)

    // 列番号が表示されない
    expect(screen.queryByText('1')).not.toBeInTheDocument()
    
    // 行ラベルが表示されない
    expect(screen.queryByText('一')).not.toBeInTheDocument()
  })

  it('駒が正しく表示されること', () => {
    const boardWithPieces = createEmptyBoard()
    boardWithPieces[0][0] = { type: 'KYO', player: 'GOTE' }
    boardWithPieces[8][8] = { type: 'KYO', player: 'SENTE' }
    boardWithPieces[4][4] = { type: 'OU', player: 'SENTE' }

    const gameStateWithPieces = {
      ...mockGameState,
      board: boardWithPieces
    }

    render(<SimpleBoard gameState={gameStateWithPieces} />)

    expect(screen.getByText('KYO-GOTE')).toBeInTheDocument()
    expect(screen.getByText('KYO-SENTE')).toBeInTheDocument()
    expect(screen.getByText('OU-SENTE')).toBeInTheDocument()
  })

  it('ハイライトされたマスが正しく表示されること', () => {
    const highlightedSquares = [
      { row: 0, col: 0 },
      { row: 4, col: 4 }
    ]

    const { container } = render(
      <SimpleBoard 
        gameState={mockGameState} 
        highlightedSquares={highlightedSquares}
      />
    )

    // ハイライトされたマスを探す
    const highlightedElements = container.querySelectorAll('.ring-2.ring-blue-500.bg-blue-100')
    expect(highlightedElements).toHaveLength(2)
  })

  it('盤面を反転表示できること', () => {
    render(<SimpleBoard gameState={mockGameState} flipped={true} />)

    // 反転時は列番号が逆順になる
    const colNumbers = screen.getAllByText(/^[1-9]$/)
    expect(colNumbers[0]).toHaveTextContent('1')
    expect(colNumbers[8]).toHaveTextContent('9')

    // 行ラベルも逆順になる
    const rowLabels = screen.getAllByText(/^[一二三四五六七八九]$/)
    expect(rowLabels[0]).toHaveTextContent('九')
    expect(rowLabels[8]).toHaveTextContent('一')
  })

  it('反転時に駒の位置も正しく反転すること', () => {
    const boardWithPiece = createEmptyBoard()
    boardWithPiece[0][0] = { type: 'KYO', player: 'GOTE' } // 左上

    const gameStateWithPiece = {
      ...mockGameState,
      board: boardWithPiece
    }

    const { container } = render(
      <SimpleBoard gameState={gameStateWithPiece} flipped={true} />
    )

    // 反転時は右下に表示される
    const squares = container.querySelectorAll('.w-12.h-12.bg-amber-100')
    const lastSquare = squares[squares.length - 1]
    expect(lastSquare).toHaveTextContent('KYO-GOTE')
  })

  it('カスタムクラス名が適用されること', () => {
    const { container } = render(
      <SimpleBoard gameState={mockGameState} className="custom-board-class" />
    )

    expect(container.querySelector('.custom-board-class')).toBeInTheDocument()
  })

  it('盤面のスタイリングが正しく適用されること', () => {
    const { container } = render(<SimpleBoard gameState={mockGameState} />)

    // 盤面の背景色
    const boardGrid = container.querySelector('.grid.grid-cols-9.bg-amber-900')
    expect(boardGrid).toBeInTheDocument()

    // マスのスタイル
    const square = container.querySelector('.w-12.h-12.bg-amber-100')
    expect(square).toBeInTheDocument()
  })

  it('デフォルトプロパティが正しく設定されること', () => {
    const { container } = render(<SimpleBoard gameState={mockGameState} />)

    // デフォルトでは座標が表示される
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('五')).toBeInTheDocument()

    // デフォルトではハイライトなし
    const highlightedElements = container.querySelectorAll('.ring-2.ring-blue-500')
    expect(highlightedElements).toHaveLength(0)

    // デフォルトでは反転なし
    const colNumbers = screen.getAllByText(/^[1-9]$/)
    expect(colNumbers[0]).toHaveTextContent('9')
  })

  it('複数のハイライトが同じマスに重ならないこと', () => {
    const highlightedSquares = [
      { row: 0, col: 0 },
      { row: 0, col: 0 } // 重複
    ]

    const { container } = render(
      <SimpleBoard 
        gameState={mockGameState} 
        highlightedSquares={highlightedSquares}
      />
    )

    // 重複していても1つのマスのみハイライト
    const highlightedElements = container.querySelectorAll('.ring-2.ring-blue-500.bg-blue-100')
    expect(highlightedElements).toHaveLength(1)
  })

  it('トランジション効果が適用されていること', () => {
    const { container } = render(<SimpleBoard gameState={mockGameState} />)

    const square = container.querySelector('.transition-all.duration-200')
    expect(square).toBeInTheDocument()
  })
})