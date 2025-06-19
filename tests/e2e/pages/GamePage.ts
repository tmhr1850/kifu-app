import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GamePage extends BasePage {
  readonly selectors = {
    gameBoard: '[data-testid="game-board"]',
    boardSquare: '[data-testid^="square-"]',
    piece: '[data-testid^="piece-"]',
    capturedPieces: {
      sente: '[data-testid="captured-pieces-sente"]',
      gote: '[data-testid="captured-pieces-gote"]',
    },
    turnIndicator: '[data-testid="turn-indicator"]',
    moveHistory: '[data-testid="move-history"]',
    resignButton: 'button:has-text("投了")',
    drawOfferButton: 'button:has-text("引き分け")',
    undoButton: 'button:has-text("待った")',
    saveKifuButton: 'button:has-text("保存")',
    promotionModal: '[data-testid="promotion-modal"]',
    promoteButton: 'button:has-text("成る")',
    notPromoteButton: 'button:has-text("成らない")',
    gameEndModal: '[data-testid="game-end-modal"]',
    newGameButton: 'button:has-text("新規対局")',
    timer: {
      sente: '[data-testid="timer-sente"]',
      gote: '[data-testid="timer-gote"]',
    },
  };

  constructor(page: Page) {
    super(page);
  }

  async waitForGameReady() {
    await this.waitForElement(this.selectors.gameBoard);
    await this.waitForPageLoad();
  }

  async makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    const fromSquare = `[data-testid="square-${fromRow}-${fromCol}"]`;
    const toSquare = `[data-testid="square-${toRow}-${toCol}"]`;
    
    await this.clickElement(fromSquare);
    await this.page.waitForTimeout(100); // Small delay for UI update
    await this.clickElement(toSquare);
  }

  async dragPiece(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    const fromSquare = `[data-testid="square-${fromRow}-${fromCol}"]`;
    const toSquare = `[data-testid="square-${toRow}-${toCol}"]`;
    
    await this.page.dragAndDrop(fromSquare, toSquare);
  }

  async handlePromotion(promote: boolean) {
    await this.waitForElement(this.selectors.promotionModal);
    
    if (promote) {
      await this.clickElement(this.selectors.promoteButton);
    } else {
      await this.clickElement(this.selectors.notPromoteButton);
    }
  }

  async dropCapturedPiece(pieceType: string, row: number, col: number) {
    const capturedPieceSelector = `[data-testid="captured-${pieceType}"]`;
    const targetSquare = `[data-testid="square-${row}-${col}"]`;
    
    await this.page.dragAndDrop(capturedPieceSelector, targetSquare);
  }

  async getCurrentTurn(): Promise<'sente' | 'gote'> {
    const turnText = await this.getElementText(this.selectors.turnIndicator);
    return turnText.includes('先手') ? 'sente' : 'gote';
  }

  async getPieceAtSquare(row: number, col: number): Promise<string | null> {
    const squareSelector = `[data-testid="square-${row}-${col}"]`;
    const pieceSelector = `${squareSelector} [data-testid^="piece-"]`;
    
    if (await this.isElementVisible(pieceSelector)) {
      const piece = await this.page.$(pieceSelector);
      if (piece) {
        const testId = await piece.getAttribute('data-testid');
        return testId ? testId.replace('piece-', '') : null;
      }
    }
    return null;
  }

  async getCapturedPieces(player: 'sente' | 'gote'): Promise<string[]> {
    const selector = this.selectors.capturedPieces[player];
    const pieces = await this.page.$$(selector + ' [data-testid^="captured-"]');
    const capturedTypes: string[] = [];
    
    for (const piece of pieces) {
      const testId = await piece.getAttribute('data-testid');
      if (testId) {
        capturedTypes.push(testId.replace('captured-', ''));
      }
    }
    
    return capturedTypes;
  }

  async getMoveHistory(): Promise<string[]> {
    const moveElements = await this.page.$$(this.selectors.moveHistory + ' li');
    const moves: string[] = [];
    
    for (const element of moveElements) {
      const text = await element.textContent();
      if (text) moves.push(text.trim());
    }
    
    return moves;
  }

  async resign() {
    await this.clickElement(this.selectors.resignButton);
    await this.page.waitForTimeout(100);
    // Confirm resignation if dialog appears
    const confirmButton = 'button:has-text("はい")';
    if (await this.page.isVisible(confirmButton)) {
      await this.clickElement(confirmButton);
    }
  }

  async offerDraw() {
    await this.clickElement(this.selectors.drawOfferButton);
  }

  async undo() {
    await this.clickElement(this.selectors.undoButton);
  }

  async saveKifu() {
    await this.clickElement(this.selectors.saveKifuButton);
  }

  async isGameEnded(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.gameEndModal);
  }

  async getGameResult(): Promise<string> {
    if (await this.isGameEnded()) {
      return await this.getElementText(this.selectors.gameEndModal + ' h2');
    }
    return '';
  }

  async startNewGame() {
    await this.clickElement(this.selectors.newGameButton);
  }

  async getTimeRemaining(player: 'sente' | 'gote'): Promise<string> {
    return await this.getElementText(this.selectors.timer[player]);
  }
}