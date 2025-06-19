export const testData = {
  users: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      username: 'TestUser'
    },
    invalid: {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    }
  },
  
  game: {
    initialMoves: [
      { from: { row: 6, col: 6 }, to: { row: 5, col: 6 } }, // 7七歩
      { from: { row: 2, col: 2 }, to: { row: 3, col: 2 } }, // 3三歩
      { from: { row: 6, col: 7 }, to: { row: 5, col: 7 } }, // 8七歩
      { from: { row: 2, col: 1 }, to: { row: 3, col: 1 } }, // 2三歩
    ],
    
    testKifu: `#KIF version=2.0
開始日時：2024/01/01 10:00:00
手合割：平手
先手：先手プレイヤー
後手：後手プレイヤー
手数----指手---------消費時間--
   1 ７六歩(77)   (00:00:00/00:00:00)
   2 ３四歩(33)   (00:00:00/00:00:00)
   3 ２六歩(27)   (00:00:00/00:00:00)
*
`
  },
  
  selectors: {
    common: {
      loadingSpinner: '[data-testid="loading-spinner"]',
      errorMessage: '[role="alert"]',
      successMessage: '[data-testid="success-message"]',
      modal: '[role="dialog"]',
      modalClose: '[data-testid="modal-close"]',
      confirmButton: 'button:has-text("はい"), button:has-text("確認")',
      cancelButton: 'button:has-text("いいえ"), button:has-text("キャンセル")',
    }
  },
  
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000,
    animation: 300
  }
};

export const testHelpers = {
  /**
   * Wait for loading to complete
   */
  async waitForLoading(page: any) {
    const spinner = page.locator(testData.selectors.common.loadingSpinner);
    if (await spinner.count() > 0) {
      await spinner.waitFor({ state: 'hidden', timeout: testData.timeouts.medium });
    }
  },
  
  /**
   * Close modal if open
   */
  async closeModal(page: any) {
    const modal = page.locator(testData.selectors.common.modal);
    if (await modal.count() > 0) {
      const closeButton = page.locator(testData.selectors.common.modalClose);
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await modal.waitFor({ state: 'hidden' });
    }
  },
  
  /**
   * Generate random email for testing
   */
  generateTestEmail(): string {
    const timestamp = Date.now();
    return `test_${timestamp}@example.com`;
  },
  
  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(page: any, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ 
      path: `tests/e2e/screenshots/${name}_${timestamp}.png`,
      fullPage: true 
    });
  }
};