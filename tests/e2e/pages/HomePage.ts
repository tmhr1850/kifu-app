import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly selectors = {
    gameBoard: '[data-testid="game-board"]',
    newGameButton: 'button:has-text("新規対局")',
    aiGameButton: 'a[href="/ai"]',
    onlineGameButton: 'a[href="/online"]',
    kifuListButton: 'a[href="/kifu"]',
    analysisButton: 'a[href="/analysis"]',
    loginButton: 'a[href="/auth/login"]',
    signupButton: 'a[href="/auth/signup"]',
    userMenu: '[data-testid="user-menu"]',
    profileLink: 'a[href="/profile"]',
    settingsLink: 'a[href="/settings"]',
    logoutButton: 'button:has-text("ログアウト")',
    boardSquare: '[data-testid^="square-"]',
    piece: '[data-testid^="piece-"]',
    capturedPieces: '[data-testid="captured-pieces"]',
    moveHistory: '[data-testid="move-history"]',
  };

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate('/');
    await this.waitForPageLoad();
  }

  async navigateToAIGame() {
    await this.clickElement(this.selectors.aiGameButton);
    await this.waitForNavigation('/ai');
  }

  async navigateToOnlineGame() {
    await this.clickElement(this.selectors.onlineGameButton);
    await this.waitForNavigation('/online');
  }

  async navigateToKifuList() {
    await this.clickElement(this.selectors.kifuListButton);
    await this.waitForNavigation('/kifu');
  }

  async navigateToAnalysis() {
    await this.clickElement(this.selectors.analysisButton);
    await this.waitForNavigation('/analysis');
  }

  async navigateToLogin() {
    await this.clickElement(this.selectors.loginButton);
    await this.waitForNavigation('/auth/login');
  }

  async navigateToSignup() {
    await this.clickElement(this.selectors.signupButton);
    await this.waitForNavigation('/auth/signup');
  }

  async isGameBoardVisible(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.gameBoard);
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.userMenu);
  }

  async openUserMenu() {
    if (await this.isUserLoggedIn()) {
      await this.clickElement(this.selectors.userMenu);
    }
  }

  async logout() {
    await this.openUserMenu();
    await this.clickElement(this.selectors.logoutButton);
    await this.waitForNavigation();
  }

  async clickSquare(row: number, col: number) {
    const squareSelector = `[data-testid="square-${row}-${col}"]`;
    await this.clickElement(squareSelector);
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

  async getMoveHistory(): Promise<string[]> {
    const moveElements = await this.page.$$(this.selectors.moveHistory + ' li');
    const moves: string[] = [];
    
    for (const element of moveElements) {
      const text = await element.textContent();
      if (text) moves.push(text.trim());
    }
    
    return moves;
  }
}