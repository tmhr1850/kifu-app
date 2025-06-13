import { render, screen } from '@testing-library/react'
import { Piece } from './Piece'

describe('駒コンポーネント', () => {
  describe('基本的な表示', () => {
    it('先手の王将が正しく表示される', () => {
      render(<Piece type="王" isGote={false} />)
      expect(screen.getByText('王')).toBeInTheDocument()
    })

    it('後手の王将が正しく表示される', () => {
      render(<Piece type="王" isGote={true} />)
      expect(screen.getByText('王')).toBeInTheDocument()
    })

    it('先手の飛車が正しく表示される', () => {
      render(<Piece type="飛" isGote={false} />)
      expect(screen.getByText('飛')).toBeInTheDocument()
    })

    it('先手の角行が正しく表示される', () => {
      render(<Piece type="角" isGote={false} />)
      expect(screen.getByText('角')).toBeInTheDocument()
    })

    it('先手の金将が正しく表示される', () => {
      render(<Piece type="金" isGote={false} />)
      expect(screen.getByText('金')).toBeInTheDocument()
    })

    it('先手の銀将が正しく表示される', () => {
      render(<Piece type="銀" isGote={false} />)
      expect(screen.getByText('銀')).toBeInTheDocument()
    })

    it('先手の桂馬が正しく表示される', () => {
      render(<Piece type="桂" isGote={false} />)
      expect(screen.getByText('桂')).toBeInTheDocument()
    })

    it('先手の香車が正しく表示される', () => {
      render(<Piece type="香" isGote={false} />)
      expect(screen.getByText('香')).toBeInTheDocument()
    })

    it('先手の歩兵が正しく表示される', () => {
      render(<Piece type="歩" isGote={false} />)
      expect(screen.getByText('歩')).toBeInTheDocument()
    })
  })

  describe('駒の向き', () => {
    it('先手の駒は回転されない', () => {
      const { container } = render(<Piece type="王" isGote={false} />)
      const piece = container.firstChild as HTMLElement
      expect(piece).not.toHaveClass('rotate-180')
    })

    it('後手の駒は180度回転される', () => {
      const { container } = render(<Piece type="王" isGote={true} />)
      const piece = container.firstChild as HTMLElement
      expect(piece).toHaveClass('rotate-180')
    })
  })

  describe('スタイリング', () => {
    it('駒が適切なクラスを持つ', () => {
      const { container } = render(<Piece type="王" isGote={false} />)
      const piece = container.firstChild as HTMLElement
      expect(piece).toHaveClass('piece')
    })

    it('クリック可能な駒はホバーエフェクトを持つ', () => {
      const onClick = jest.fn()
      const { container } = render(<Piece type="王" isGote={false} onClick={onClick} />)
      const piece = container.firstChild as HTMLElement
      expect(piece).toHaveClass('cursor-pointer')
    })

    it('クリック不可能な駒はホバーエフェクトを持たない', () => {
      const { container } = render(<Piece type="王" isGote={false} />)
      const piece = container.firstChild as HTMLElement
      expect(piece).not.toHaveClass('cursor-pointer')
    })
  })

  describe('インタラクション', () => {
    it('クリックイベントが正しく処理される', () => {
      const onClick = jest.fn()
      render(<Piece type="王" isGote={false} onClick={onClick} />)
      const piece = screen.getByText('王')
      piece.click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})