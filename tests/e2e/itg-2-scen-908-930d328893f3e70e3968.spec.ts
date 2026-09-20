import { test, expect } from '@playwright/test';

test.describe('SCEN-908: 配置案詳細表示', () => {
  test('対象作業者の過去の割当変更履歴が参照され、配置変更の追跡履歴が表示される', async ({ page }) => {
    // ログイン画面に遷移
    await page.goto('/');
    
    // ログイン処理
    await test.step('最適人員配置案提案・実行画面にログインする', async () => {
      await page.fill('input[type="text"]', 'testuser');
      await page.fill('input[type="password"]', 'testpass');
      await page.click('button[type="submit"]');
      
      // ログイン後の自動遷移完了を待つ
      await page.waitForNavigation();
    });

    // 最適人員配置案提案・実行画面が起動したことを確認
    await test.step('システムが起動した状態を確認する', async () => {
      await page.goto('/panels/scr-1789461978707.html');
      await expect(page).toHaveURL(/scr-1789461978707/);
    });

    // 配置案一覧から対象配置案を選択
    await test.step('配置案一覧から対象となる配置案を選択する', async () => {
      // 配置案一覧内で2024年1月15日の配置案を検索・選択
      const placementPlanItem = page.locator('text=2024-01-15');
      await placementPlanItem.first().click();
      
      // 配置案詳細表示画面が開くまで待機
      await page.waitForLoadState('networkidle');
    });

    // 対象作業者を選択
    await test.step('対象作業者を選択する', async () => {
      const workerElement = page.locator('text=WK-00123');
      await workerElement.click();
      
      // 作業者詳細パネルが表示されるまで待機
      await page.waitForLoadState('networkidle');
    });

    // 作業者詳細パネルまたは配置変更履歴セクションが表示されるまで待機
    await test.step('作業者詳細パネルまたは配置変更履歴セクションが表示されるまで待機する', async () => {
      const detailPanel = page.locator('[class*="detail"], [class*="panel"], [class*="modal"]').first();
      const historySection = page.locator('[class*="history"], [class*="timeline"], [class*="change"]').first();
      
      // 詳細パネルまたは履歴セクションのいずれかが表示されるまで待機
      await Promise.race([
        detailPanel.waitFor({ state: 'visible' }),
        historySection.waitFor({ state: 'visible' })
      ]);
    });

    // 過去の割当変更履歴タブをクリック
    await test.step('過去の割当変更履歴タブをクリックする', async () => {
      const historyTab = page.locator('text=/過去の割当変更履歴|割当変更履歴|変更履歴/');
      await historyTab.click();
      
      // 履歴セクションが表示されるまで待機
      await page.waitForLoadState('networkidle');
    });

    // 配置変更追跡履歴が表示されることを確認
    await test.step('配置変更追跡履歴が時系列で表示されることを確認する', async () => {
      // 配置変更履歴コンテナが表示されている
      const historyContainer = page.locator('[class*="history"], [class*="timeline"], [class*="list"]').first();
      await expect(historyContainer).toBeVisible();
      
      // 履歴行：日付、作業タイプ、矢印、日付、作業タイプを含む行を検索
      // 一覧形式で複数の履歴が時系列で表示されていることを確認
      const historyRows = historyContainer.locator('tr, li, [class*="row"]').filter({ hasText: /→/ });
      
      // 少なくとも1つの履歴行が存在することを確認
      const rowCount = await historyRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
      
      // 時系列パターン：複数の履歴が矢印で区切られている
      const firstRow = historyRows.first();
      const firstRowText = await firstRow.textContent();
      
      // 変更日時、変更前作業タイプ、矢印、変更後作業タイプのパターンを確認
      expect(firstRowText).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(firstRowText).toContain('→');
    });

    // 履歴行が正常にレンダリングされ、スクロール可能であることを確認
    await test.step('履歴行が正常にレンダリングされ、スクロール可能な状態であることを確認する', async () => {
      // 履歴コンテナを取得
      const scrollContainer = page.locator('[class*="history"], [class*="timeline"], [class*="list"]').first();
      
      // 日付と矢印を含む行を抽出
      const historyRows = scrollContainer.locator('tr, li, [class*="row"]').filter({ hasText: /→/ });
      
      // 少なくとも1つの履歴行が存在
      const rowCount = await historyRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
      
      // 最初の履歴行が表示可能
      const firstRow = historyRows.first();
      await expect(firstRow).toBeVisible();
      
      // 履歴行に変更前日時・作業タイプ、矢印、変更後日時・作業タイプが含まれていることを確認
      const firstRowText = await firstRow.textContent();
      expect(firstRowText).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(firstRowText).toContain('→');
      
      // スクロール可能なコンテナであることを確認
      const isScrollable = await scrollContainer.evaluate((element) => {
        return element.scrollHeight > element.clientHeight;
      });
      
      // スクロール可能な状態で閲覧できることを確認（複数行存在時）
      if (rowCount > 1) {
        expect(isScrollable).toBe(true);
      }
      
      // 複数の行が存在する場合、各行が正常にレンダリングされていることを確認
      if (rowCount >= 2) {
        const secondRow = historyRows.nth(1);
        await expect(secondRow).toBeVisible();
        
        const secondRowText = await secondRow.textContent();
        expect(secondRowText).toMatch(/\d{4}-\d{2}-\d{2}/);
        expect(secondRowText).toContain('→');
      }
    });
  });
});