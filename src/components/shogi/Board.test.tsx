import { render, screen } from '@testing-library/react'
import { Board } from './Board'

describe('将棋盤コンポーネント', () => {
  describe('盤面の表示', () => {
    it('9x9のグリッドが表示される', () => {
      const { container } = render(<Board />)
      const cells = container.querySelectorAll('.board-cell')
      expect(cells).toHaveLength(81) // 9x9 = 81マス
    })

    it('盤面が適切なグリッドレイアウトを持つ', () => {
      const { container } = render(<Board />)
      const board = container.querySelector('.board')
      expect(board).toHaveClass('grid')
      expect(board).toHaveClass('grid-cols-9')
    })
  })

  describe('座標の表示', () => {
    it('横軸の座標（9-1）が表示される', () => {
      render(<Board />)
      for (let i = 9; i >= 1; i--) {
        expect(screen.getByText(i.toString())).toBeInTheDocument()
      }
    })

    it('縦軸の座標（一-九）が表示される', () => {
      render(<Board />)
      const kanjiNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
      kanjiNumbers.forEach(kanji => {
        expect(screen.getByText(kanji)).toBeInTheDocument()
      })
    })
  })

  describe('初期配置', () => {
    it('後手の香車が正しい位置に配置される', () => {
      render(<Board />)
      const lances = screen.getAllByText('香')
      // 後手の香車2つ（1一、9一）、先手の香車2つ（1九、9九）
      expect(lances).toHaveLength(4)
    })

    it('後手の桂馬が正しい位置に配置される', () => {
      render(<Board />)
      const knights = screen.getAllByText('桂')
      // 後手の桂馬2つ（2一、8一）、先手の桂馬2つ（2九、8九）
      expect(knights).toHaveLength(4)
    })

    it('後手の銀将が正しい位置に配置される', () => {
      render(<Board />)
      const silvers = screen.getAllByText('銀')
      // 後手の銀将2つ（3一、7一）、先手の銀将2つ（3九、7九）
      expect(silvers).toHaveLength(4)
    })

    it('後手の金将が正しい位置に配置される', () => {
      render(<Board />)
      const golds = screen.getAllByText('金')
      // 後手の金将2つ（4一、6一）、先手の金将2つ（4九、6九）
      expect(golds).toHaveLength(4)
    })

    it('王将と玉将が正しい位置に配置される', () => {
      render(<Board />)
      expect(screen.getByText('玉')).toBeInTheDocument() // 後手の玉将（5一）
      expect(screen.getByText('王')).toBeInTheDocument() // 先手の王将（5九）
    })

    it('飛車が正しい位置に配置される', () => {
      render(<Board />)
      const rooks = screen.getAllByText('飛')
      // 後手の飛車（2二）、先手の飛車（8八）
      expect(rooks).toHaveLength(2)
    })

    it('角行が正しい位置に配置される', () => {
      render(<Board />)
      const bishops = screen.getAllByText('角')
      // 後手の角行（8二）、先手の角行（2八）
      expect(bishops).toHaveLength(2)
    })

    it('歩兵が正しい位置に配置される', () => {
      render(<Board />)
      const pawns = screen.getAllByText('歩')
      // 後手の歩兵9つ（三段目）、先手の歩兵9つ（七段目）
      expect(pawns).toHaveLength(18)
    })
  })

  describe('レスポンシブデザイン', () => {
    it('コンテナが適切なクラスを持つ', () => {
      const { container } = render(<Board />)
      const boardContainer = container.querySelector('.board-container')
      expect(boardContainer).toHaveClass('max-w-screen-sm')
      expect(boardContainer).toHaveClass('mx-auto')
    })

    it('盤面がアスペクト比を維持する', () => {
      const { container } = render(<Board />)
      const boardWrapper = container.querySelector('.board-wrapper')
      expect(boardWrapper).toHaveClass('aspect-square')
    })
  })

  describe('インタラクション', () => {
    it('駒クリック時にonPieceClickが呼ばれる', () => {
      const onPieceClick = jest.fn()
      render(<Board onPieceClick={onPieceClick} />)
      const king = screen.getByText('王')
      king.click()
      expect(onPieceClick).toHaveBeenCalled()
    })

    it('空のマスクリック時にonCellClickが呼ばれる', () => {
      const onCellClick = jest.fn()
      const { container } = render(<Board onCellClick={onCellClick} />)
      // 5五のマス（中央）は初期配置では空
      const emptyCell = container.querySelectorAll('.board-cell')[40] // 5五は40番目（0-indexed）
      emptyCell.click()
      expect(onCellClick).toHaveBeenCalled()
    })
  })
})