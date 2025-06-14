import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import KifuReplayBoard from './KifuReplayBoard'
import { KifuRecord } from '@/types/kifu'

const mockKifu: KifuRecord = {
  id: 'test-kifu',
  gameInfo: {
    date: '2024/01/01',
    sente: '先手太郎',
    gote: '後手花子',
  },
  moves: [
    {
      from: { row: 6, col: 7 },
      to: { row: 5, col: 7 },
      piece: '歩',
      promote: false,
      player: 'sente',
    },
    {
      from: { row: 2, col: 3 },
      to: { row: 3, col: 3 },
      piece: '歩',
      promote: false,
      player: 'gote',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('KifuReplayBoard', () => {
  it('棋譜情報が正しく表示される', () => {
    render(<KifuReplayBoard kifu={mockKifu} />)

    expect(screen.getByText('棋譜再生')).toBeInTheDocument()
    expect(screen.getByText('先手: 先手太郎')).toBeInTheDocument()
    expect(screen.getByText('後手: 後手花子')).toBeInTheDocument()
    expect(screen.getByText('2024/01/01')).toBeInTheDocument()
  })

  it('初期状態で開始局面が表示される', () => {
    render(<KifuReplayBoard kifu={mockKifu} />)

    expect(screen.getByText('手数: 0 / 2')).toBeInTheDocument()
    expect(screen.getByText('開始局面')).toBeInTheDocument()
  })

  it('一手進むボタンで次の手が表示される', () => {
    render(<KifuReplayBoard kifu={mockKifu} />)

    const nextButton = screen.getByTitle('一手進む (→)')
    fireEvent.click(nextButton)

    expect(screen.getByText('手数: 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('▲歩57')).toBeInTheDocument()
  })

  it('キーボードショートカットで移動できる', () => {
    render(<KifuReplayBoard kifu={mockKifu} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('手数: 1 / 2')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('手数: 2 / 2')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('手数: 1 / 2')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Home' })
    expect(screen.getByText('手数: 0 / 2')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'End' })
    expect(screen.getByText('手数: 2 / 2')).toBeInTheDocument()
  })

  it('手数入力でジャンプできる', () => {
    render(<KifuReplayBoard kifu={mockKifu} />)

    const input = screen.getByLabelText('手数:')
    fireEvent.change(input, { target: { value: '2' } })

    expect(screen.getByText('手数: 2 / 2')).toBeInTheDocument()
    expect(screen.getByText('△歩33')).toBeInTheDocument()
  })

  it('盤面が正しくレンダリングされる', () => {
    render(<KifuReplayBoard kifu={mockKifu} />)

    const board = screen.getByRole('grid')
    expect(board).toBeInTheDocument()
  })
})