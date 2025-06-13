import { getInitialBoard, BoardPiece } from './initialSetup'

describe('初期配置', () => {
  let board: (BoardPiece | null)[][]

  beforeEach(() => {
    board = getInitialBoard()
  })

  describe('盤面の構造', () => {
    it('9x9の盤面が生成される', () => {
      expect(board).toHaveLength(9)
      board.forEach(row => {
        expect(row).toHaveLength(9)
      })
    })
  })

  describe('後手の駒配置（一段目）', () => {
    it('後手の香車が1一と9一に配置される', () => {
      expect(board[0][0]).toEqual({ type: '香', isGote: true })
      expect(board[0][8]).toEqual({ type: '香', isGote: true })
    })

    it('後手の桂馬が2一と8一に配置される', () => {
      expect(board[0][1]).toEqual({ type: '桂', isGote: true })
      expect(board[0][7]).toEqual({ type: '桂', isGote: true })
    })

    it('後手の銀将が3一と7一に配置される', () => {
      expect(board[0][2]).toEqual({ type: '銀', isGote: true })
      expect(board[0][6]).toEqual({ type: '銀', isGote: true })
    })

    it('後手の金将が4一と6一に配置される', () => {
      expect(board[0][3]).toEqual({ type: '金', isGote: true })
      expect(board[0][5]).toEqual({ type: '金', isGote: true })
    })

    it('後手の玉将が5一に配置される', () => {
      expect(board[0][4]).toEqual({ type: '玉', isGote: true })
    })
  })

  describe('後手の駒配置（二段目）', () => {
    it('後手の飛車が2二に配置される', () => {
      expect(board[1][7]).toEqual({ type: '飛', isGote: true })
    })

    it('後手の角行が8二に配置される', () => {
      expect(board[1][1]).toEqual({ type: '角', isGote: true })
    })
  })

  describe('後手の歩兵配置（三段目）', () => {
    it('後手の歩兵が三段目全てに配置される', () => {
      for (let col = 0; col < 9; col++) {
        expect(board[2][col]).toEqual({ type: '歩', isGote: true })
      }
    })
  })

  describe('中段の空きマス', () => {
    it('四段目から六段目は全て空きマス', () => {
      for (let row = 3; row <= 5; row++) {
        for (let col = 0; col < 9; col++) {
          expect(board[row][col]).toBeNull()
        }
      }
    })
  })

  describe('先手の歩兵配置（七段目）', () => {
    it('先手の歩兵が七段目全てに配置される', () => {
      for (let col = 0; col < 9; col++) {
        expect(board[6][col]).toEqual({ type: '歩', isGote: false })
      }
    })
  })

  describe('先手の駒配置（八段目）', () => {
    it('先手の角行が2八に配置される', () => {
      expect(board[7][7]).toEqual({ type: '角', isGote: false })
    })

    it('先手の飛車が8八に配置される', () => {
      expect(board[7][1]).toEqual({ type: '飛', isGote: false })
    })
  })

  describe('先手の駒配置（九段目）', () => {
    it('先手の香車が1九と9九に配置される', () => {
      expect(board[8][0]).toEqual({ type: '香', isGote: false })
      expect(board[8][8]).toEqual({ type: '香', isGote: false })
    })

    it('先手の桂馬が2九と8九に配置される', () => {
      expect(board[8][1]).toEqual({ type: '桂', isGote: false })
      expect(board[8][7]).toEqual({ type: '桂', isGote: false })
    })

    it('先手の銀将が3九と7九に配置される', () => {
      expect(board[8][2]).toEqual({ type: '銀', isGote: false })
      expect(board[8][6]).toEqual({ type: '銀', isGote: false })
    })

    it('先手の金将が4九と6九に配置される', () => {
      expect(board[8][3]).toEqual({ type: '金', isGote: false })
      expect(board[8][5]).toEqual({ type: '金', isGote: false })
    })

    it('先手の王将が5九に配置される', () => {
      expect(board[8][4]).toEqual({ type: '王', isGote: false })
    })
  })
})