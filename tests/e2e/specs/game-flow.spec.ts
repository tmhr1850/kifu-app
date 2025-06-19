import { test, expect } from '../fixtures/test-base';

test.describe('対局フロー', () => {
  test('ローカル対局の基本的な流れ', async ({ page, homePage, gamePage }) => {
    await homePage.goto();
    await gamePage.waitForGameReady();

    // 初期配置の確認
    expect(await gamePage.getCurrentTurn()).toBe('sente');
    
    // 歩を動かす (7七の歩を7六へ)
    await gamePage.makeMove(6, 6, 5, 6);
    await page.waitForTimeout(500);
    
    // 手番が変わったことを確認
    expect(await gamePage.getCurrentTurn()).toBe('gote');
    
    // 後手の歩を動かす (3三の歩を3四へ)
    await gamePage.makeMove(2, 2, 3, 2);
    await page.waitForTimeout(500);
    
    // 手番が戻ったことを確認
    expect(await gamePage.getCurrentTurn()).toBe('sente');
    
    // 棋譜が記録されていることを確認
    const moves = await gamePage.getMoveHistory();
    expect(moves.length).toBeGreaterThan(0);
  });

  test('駒の成りの処理', async ({ page, gamePage }) => {
    await page.goto('/');
    await gamePage.waitForGameReady();

    // テスト用の局面を作る必要があるため、スキップ
    // 実際のテストでは、成りが可能な局面まで進める必要がある
    test.skip();
  });

  test('投了の処理', async ({ page, gamePage }) => {
    await page.goto('/');
    await gamePage.waitForGameReady();

    // 投了ボタンをクリック
    await gamePage.resign();
    
    // ゲーム終了を確認
    expect(await gamePage.isGameEnded()).toBeTruthy();
    
    // 結果を確認
    const result = await gamePage.getGameResult();
    expect(result).toContain('投了');
  });

  test('棋譜の保存', async ({ page, gamePage }) => {
    await page.goto('/');
    await gamePage.waitForGameReady();

    // いくつか手を進める
    await gamePage.makeMove(6, 6, 5, 6);
    await page.waitForTimeout(500);
    await gamePage.makeMove(2, 2, 3, 2);
    await page.waitForTimeout(500);

    // 棋譜保存ボタンをクリック
    await gamePage.saveKifu();
    
    // 保存ダイアログまたは成功メッセージを確認
    await expect(page.locator('[data-testid="save-dialog"], [data-testid="save-success"]')).toBeVisible({ timeout: 5000 });
  });

  test('待った（アンドゥ）機能', async ({ page, gamePage }) => {
    await page.goto('/');
    await gamePage.waitForGameReady();

    // 手を進める
    await gamePage.makeMove(6, 6, 5, 6);
    await page.waitForTimeout(500);
    
    const movesBeforeUndo = await gamePage.getMoveHistory();
    const moveCountBefore = movesBeforeUndo.length;

    // 待ったボタンをクリック
    await gamePage.undo();
    await page.waitForTimeout(500);

    // 手数が減っていることを確認
    const movesAfterUndo = await gamePage.getMoveHistory();
    expect(movesAfterUndo.length).toBeLessThan(moveCountBefore);
  });

  test('持ち駒の使用', async ({ page, gamePage }) => {
    // 持ち駒を使える局面まで進める必要があるため、基本的な確認のみ
    await page.goto('/');
    await gamePage.waitForGameReady();

    // 持ち駒エリアが表示されていることを確認
    await expect(page.locator('[data-testid="captured-pieces-sente"]')).toBeVisible();
    await expect(page.locator('[data-testid="captured-pieces-gote"]')).toBeVisible();
  });
});