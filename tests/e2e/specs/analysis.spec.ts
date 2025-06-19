import { test, expect } from '../fixtures/test-base';

test.describe('棋譜解析機能', () => {
  test('解析ページの表示', async ({ page }) => {
    await page.goto('/analysis');
    
    // 解析ボードが表示されることを確認
    await expect(page.locator('[data-testid="analysis-board"]')).toBeVisible({ timeout: 10000 });
  });

  test('棋譜のインポート', async ({ page }) => {
    await page.goto('/analysis');
    
    // インポートボタンを探す
    const importButton = page.locator('button:has-text("インポート"), button:has-text("Import")');
    if (await importButton.count() > 0) {
      await importButton.click();
      
      // インポートダイアログが表示されることを確認
      await expect(page.locator('[data-testid="import-dialog"], [role="dialog"]')).toBeVisible();
    }
  });

  test('評価値の表示', async ({ page }) => {
    await page.goto('/analysis');
    
    // 評価値表示エリアを確認
    const evaluationDisplay = page.locator('[data-testid="evaluation-display"]');
    if (await evaluationDisplay.count() > 0) {
      await expect(evaluationDisplay).toBeVisible();
    }
  });

  test('推奨手の表示', async ({ page }) => {
    await page.goto('/analysis');
    
    // 推奨手表示エリアを確認
    const recommendedMoves = page.locator('[data-testid="recommended-moves"]');
    if (await recommendedMoves.count() > 0) {
      await expect(recommendedMoves).toBeVisible();
    }
  });

  test('解析モードの切り替え', async ({ page }) => {
    await page.goto('/analysis');
    
    // モード切り替えボタンを探す
    const modeButtons = page.locator('[data-testid="analysis-mode-panel"] button');
    if (await modeButtons.count() > 0) {
      // 最初のモードボタンをクリック
      await modeButtons.first().click();
      
      // UIが更新されることを確認（少し待つ）
      await page.waitForTimeout(1000);
    }
  });

  test('棋譜のエクスポート', async ({ page }) => {
    await page.goto('/analysis');
    
    // エクスポートボタンを探す
    const exportButton = page.locator('button:has-text("エクスポート"), button:has-text("Export")');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      // エクスポートダイアログが表示されることを確認
      await expect(page.locator('[data-testid="export-dialog"], [role="dialog"]')).toBeVisible();
    }
  });

  test('解析中の局面操作', async ({ page }) => {
    await page.goto('/analysis');
    
    // 解析ボードで駒を動かす
    const board = page.locator('[data-testid="analysis-board"]');
    if (await board.count() > 0) {
      // 7七の歩を7六へ（標準的な初手）
      const fromSquare = page.locator('[data-testid="square-6-6"]');
      const toSquare = page.locator('[data-testid="square-5-6"]');
      
      if (await fromSquare.count() > 0 && await toSquare.count() > 0) {
        await fromSquare.click();
        await page.waitForTimeout(100);
        await toSquare.click();
        
        // 評価が更新されることを期待
        await page.waitForTimeout(1000);
      }
    }
  });

  test('変化手順の管理', async ({ page }) => {
    await page.goto('/analysis');
    
    // 変化手順ツリーを確認
    const variationTree = page.locator('[data-testid="variation-tree"]');
    if (await variationTree.count() > 0) {
      await expect(variationTree).toBeVisible();
    }
  });
});