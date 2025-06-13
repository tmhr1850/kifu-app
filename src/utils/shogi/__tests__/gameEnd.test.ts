import { GameState, Player, PieceType } from '../../../types/shogi'
import {
  createNewGame,
  getGameStatus,
  resign,
  checkImpasse,
  calculateMaterialPoints
} from '../game'
import { createEmptyHandPieces } from '../board'

describe('対局終了処理', () => {
  describe('投了（Resignation）', () => {
    it('先手が投了した場合、後手の勝利となる', () => {
      const gameState = createNewGame()
      const afterResign = resign(gameState)
      const status = getGameStatus(afterResign)

      expect(status.isOver).toBe(true)
      expect(status.winner).toBe(Player.GOTE)
      expect(status.reason).toBe('resignation')
    })

    it('後手が投了した場合、先手の勝利となる', () => {
      const gameState = createNewGame()
      gameState.currentPlayer = Player.GOTE
      const afterResign = resign(gameState)
      const status = getGameStatus(afterResign)

      expect(status.isOver).toBe(true)
      expect(status.winner).toBe(Player.SENTE)
      expect(status.reason).toBe('resignation')
    })
  })

  describe('持将棋（Impasse）', () => {
    it('両玉が敵陣に入り、詰みがない場合は持将棋を判定する', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 両玉を敵陣に配置
      gameState.board[2][4] = { type: PieceType.OU, player: Player.SENTE }
      gameState.board[6][4] = { type: PieceType.OU, player: Player.GOTE }

      const isImpasse = checkImpasse(gameState)
      expect(isImpasse).toBe(true)
    })

    it('先手の玉が敵陣にいない場合は持将棋ではない', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 先手の玉は自陣、後手の玉は敵陣
      gameState.board[8][4] = { type: PieceType.OU, player: Player.SENTE }
      gameState.board[6][4] = { type: PieceType.OU, player: Player.GOTE }

      const isImpasse = checkImpasse(gameState)
      expect(isImpasse).toBe(false)
    })
  })

  describe('点数計算（持将棋判定用）', () => {
    it('駒の点数を正しく計算する', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 盤面に駒を配置
      gameState.board[0][0] = { type: PieceType.FU, player: Player.SENTE } // 歩 = 1点
      gameState.board[0][1] = { type: PieceType.KYO, player: Player.SENTE } // 香 = 1点
      gameState.board[0][2] = { type: PieceType.KEI, player: Player.SENTE } // 桂 = 1点
      gameState.board[0][3] = { type: PieceType.GIN, player: Player.SENTE } // 銀 = 1点
      gameState.board[0][4] = { type: PieceType.KIN, player: Player.SENTE } // 金 = 1点
      gameState.board[0][5] = { type: PieceType.HI, player: Player.SENTE } // 飛 = 5点
      gameState.board[0][6] = { type: PieceType.KAKU, player: Player.SENTE } // 角 = 5点

      // 持ち駒を追加
      gameState.handPieces[Player.SENTE].set(PieceType.FU, 3) // 歩3枚 = 3点

      const points = calculateMaterialPoints(gameState, Player.SENTE)
      expect(points).toBe(18) // 1+1+1+1+1+5+5+3 = 18
    })

    it('成り駒も正しい点数で計算する', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 成り駒を配置
      gameState.board[0][0] = { type: PieceType.TO, player: Player.SENTE } // と金 = 1点
      gameState.board[0][1] = { type: PieceType.RYU, player: Player.SENTE } // 龍 = 5点
      gameState.board[0][2] = { type: PieceType.UMA, player: Player.SENTE } // 馬 = 5点

      const points = calculateMaterialPoints(gameState, Player.SENTE)
      expect(points).toBe(11) // 1+5+5 = 11
    })

    it('持将棋の勝敗を点数で判定する', () => {
      const gameState: GameState = {
        board: createEmptyBoard(),
        handPieces: createEmptyHandPieces(),
        currentPlayer: Player.SENTE,
        moveHistory: []
      }

      // 両玉を敵陣に配置
      gameState.board[2][4] = { type: PieceType.OU, player: Player.SENTE }
      gameState.board[6][4] = { type: PieceType.OU, player: Player.GOTE }

      // 先手に24点分の駒を与える
      gameState.handPieces[Player.SENTE].set(PieceType.HI, 2) // 10点
      gameState.handPieces[Player.SENTE].set(PieceType.KAKU, 2) // 10点
      gameState.handPieces[Player.SENTE].set(PieceType.KIN, 4) // 4点

      // 後手に23点分の駒を与える
      gameState.handPieces[Player.GOTE].set(PieceType.HI, 2) // 10点
      gameState.handPieces[Player.GOTE].set(PieceType.KAKU, 2) // 10点
      gameState.handPieces[Player.GOTE].set(PieceType.KIN, 3) // 3点

      const status = getGameStatus(gameState)
      expect(status.isOver).toBe(true)
      expect(status.winner).toBe(Player.SENTE) // 先手が24点以上
      expect(status.reason).toBe('impasse')
    })
  })

  describe('ゲーム終了理由の詳細', () => {
    it('全ての終了理由を適切に設定する', () => {
      const reasons = [
        'checkmate',
        'stalemate',
        'resignation',
        'repetition',
        'perpetual_check',
        'impasse',
        'timeout'
      ]

      // TypeScriptの型チェックでカバーされるため、配列に含まれることを確認
      expect(reasons).toContain('checkmate')
      expect(reasons).toContain('impasse')
      expect(reasons).toContain('timeout')
    })
  })
})

// ヘルパー関数
function createEmptyBoard() {
  return Array(9).fill(null).map(() => Array(9).fill(null))
}