import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KifuReplayControls from './KifuReplayControls'
import { KifuMove } from '@/types/kifu'

const mockMoves: KifuMove[] = [
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
  {
    from: { row: 5, col: 7 },
    to: { row: 4, col: 7 },
    piece: '歩',
    promote: false,
    player: 'sente',
  },
]

describe('KifuReplayControls', () => {
  const mockOnMoveIndexChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('初期状態で正しく表示される', () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={-1}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    expect(screen.getByText('手数: 0 / 3')).toBeInTheDocument()
    expect(screen.getByText('開始局面')).toBeInTheDocument()
    expect(screen.getByTitle('最初へ (Home)')).toBeDisabled()
    expect(screen.getByTitle('一手戻る (←)')).toBeDisabled()
    expect(screen.getByTitle('一手進む (→)')).toBeEnabled()
    expect(screen.getByTitle('最後へ (End)')).toBeEnabled()
  })

  it('現在の手が正しく表示される', () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={0}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    expect(screen.getByText('手数: 1 / 3')).toBeInTheDocument()
    expect(screen.getByText('▲歩57')).toBeInTheDocument()
  })

  it('ナビゲーションボタンが正しく動作する', () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={1}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    fireEvent.click(screen.getByTitle('一手戻る (←)'))
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(0)

    fireEvent.click(screen.getByTitle('一手進む (→)'))
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByTitle('最初へ (Home)'))
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(-1)

    fireEvent.click(screen.getByTitle('最後へ (End)'))
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(2)
  })

  it('手数ジャンプが正しく動作する', async () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={0}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    const input = screen.getByLabelText('手数:')
    await userEvent.clear(input)
    await userEvent.type(input, '2')

    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(1)
  })

  it('キーボードショートカットが正しく動作する', () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={1}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(0)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(2)

    fireEvent.keyDown(window, { key: 'Home' })
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(-1)

    fireEvent.keyDown(window, { key: 'End' })
    expect(mockOnMoveIndexChange).toHaveBeenCalledWith(2)
  })

  it('自動再生が正しく動作する', async () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={0}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    const playButton = screen.getByTitle('自動再生 (Space)')
    fireEvent.click(playButton)

    expect(screen.getByTitle('一時停止 (Space)')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockOnMoveIndexChange).toHaveBeenCalled()
  })

  it('再生速度の変更が正しく動作する', async () => {
    render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={0}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    const speed2xButton = screen.getByText('2x')
    fireEvent.click(speed2xButton)

    const playButton = screen.getByTitle('自動再生 (Space)')
    fireEvent.click(playButton)

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(mockOnMoveIndexChange).toHaveBeenCalled()
  })

  it('最後の手で自動再生が停止する', async () => {
    const { rerender } = render(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={1}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    const playButton = screen.getByTitle('自動再生 (Space)')
    fireEvent.click(playButton)

    rerender(
      <KifuReplayControls
        moves={mockMoves}
        currentMoveIndex={2}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByTitle('自動再生 (Space)')).toBeInTheDocument()
    })
  })

  it('消費時間が表示される', () => {
    const movesWithTime: KifuMove[] = [
      {
        ...mockMoves[0],
        time: 125,
      },
    ]

    render(
      <KifuReplayControls
        moves={movesWithTime}
        currentMoveIndex={0}
        onMoveIndexChange={mockOnMoveIndexChange}
      />
    )

    expect(screen.getByText('消費時間: 2分5秒')).toBeInTheDocument()
  })
})