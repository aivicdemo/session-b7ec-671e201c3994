import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示（実績管理画面から）', () => {
  test('拠点の優先順位付けで、リスク度スコアが重大閾値を超える場合、推奨対応が「人員追加が必要」と判定される', async ({ page }) => {
    // ログイン画面へ遷移
    await page.goto('/');
    await page.waitForURL('**/login.html', { timeout: 5000 }).catch(() => {});
    
    // ログイン（既にログイン状態の場合はスキップ）
    const loginButton = page.locator('button:has-text("ログイン")').first();
    if (await loginButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('input[type="text"]').first().fill('test_user');
      await page.locator('input[type="password"]').first().fill('test_password');
      await loginButton.click();
      await page.waitForURL('**/scr-*.html', { timeout: 10000 });
    }

    // 作業指示・実績管理画面へ遷移
    await test.step('作業指示・実績管理画面へ遷移', async () => {
      const navLink = page.locator('[data-testid="tab-wms"], [href*="scr-1789461813941"]').first();
      if (await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navLink.click();
      } else {
        await page.goto('/panels/scr-1789461813941.html');
      }
      await page.waitForLoadState('networkidle');
    });

    // 作業指示・実績管理画面でテスト用の拠点データ（拠点A）を選択状態にする
    await test.step('作業指示・実績管理画面でテスト用の拠点データ（拠点A）を選択状態にする', async () => {
      // ワーカーサマリーリストから拠点Aのデータを探して選択
      const workerSummaryList = page.locator('#worker-summary-list');
      await expect(workerSummaryList).toBeVisible();
      
      const siteARow = workerSummaryList.locator('text=拠点A').first();
      if (await siteARow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await siteARow.click();
      }
    });

    // WMSから取得された拠点Aの進捗データ（進捗率45%、納期まで2時間）が画面に表示されていることを確認
    await test.step('WMSから取得された拠点Aの進捗データが画面に表示されていることを確認', async () => {
      const instructionTable = page.locator('#work-instruction-tbody');
      await expect(instructionTable).toBeVisible();
      
      // 進捗率45%の表示を確認
      const progressElement = page.locator('text=/進捗.*45|45%/');
      await expect(progressElement.first()).toBeVisible({ timeout: 5000 });
      
      // 納期まで2時間の表示を確認
      const deadlineElement = page.locator('text=/2時間|2h/');
      await expect(deadlineElement.first()).toBeVisible({ timeout: 5000 });
    });

    // 進捗・人員配置ダッシュボードに遷移
    await test.step('進捗・人員配置ダッシュボードに遷移', async () => {
      const dashboardNav = page.locator('text=進捗・人員配置ダッシュボード, [href*="scr-1789461783315"]').first();
      await dashboardNav.click();
      await page.waitForLoadState('networkidle');
    });

    // ダッシュボードの拠点優先順位リストが表示され、拠点Aが重大リスク区分に表示されていることを確認
    await test.step('ダッシュボードの拠点優先順位リストが表示され、拠点Aが重大リスク区分に表示されていることを確認', async () => {
      // サイトバリアンステーブルが表示されることを確認
      const siteVarianceTable = page.locator('#site-variance-tbody');
      await expect(siteVarianceTable).toBeVisible({ timeout: 5000 });
      
      // 拠点Aが重大リスク区分（リスク度スコア80以上）に表示されていることを確認
      const siteARow = siteVarianceTable.locator('text=拠点A');
      await expect(siteARow).toBeVisible({ timeout: 5000 });
      
      // リスク度スコアが80以上であることを確認
      const rowText = await siteARow.locator('xpath=./..').textContent();
      expect(rowText).toMatch(/8\d|9\d|100/);
    });

    // 拠点Aの詳細パネルを開く
    await test.step('拠点Aの詳細パネルを開く', async () => {
      const siteVarianceTable = page.locator('#site-variance-tbody');
      const siteARow = siteVarianceTable.locator('text=拠点A').first();
      await siteARow.click();
      
      // 詳細パネルの表示を待機
      await page.waitForTimeout(500);
    });

    // 詳細パネル内の『推奨対応』フィールドを確認し、「人員追加が必要」と数値が併記されていることを確認
    await test.step('詳細パネルの「推奨対応」フィールドに「人員追加が必要」と数値が併記されていることを確認', async () => {
      // 推奨対応フィールドを探して確認
      const recommendedActionElement = page.locator('#recommended-actions');
      await expect(recommendedActionElement).toBeVisible({ timeout: 5000 });
      
      // 推奨対応要素内のテキストを取得
      const recommendedActionText = await recommendedActionElement.textContent();
      
      // 「人員追加が必要」と数値の両方が併記されていることを確認
      expect(recommendedActionText).toMatch(/人員追加が必要/);
      expect(recommendedActionText).toMatch(/\d+/);
      
      // 併記されていることを確認（同じテキストノード内に両方が含まれている）
      const fullText = recommendedActionText || '';
      const hasAddStaffText = fullText.includes('人員追加が必要');
      const hasNumber = /\d+/.test(fullText);
      expect(hasAddStaffText && hasNumber).toBe(true);
      
      // ダッシュボード画面レイアウトが崩れず、フィールドが正常に読み取り可能な状態で描画されていることを確認
      const contentArea = page.locator('.content-area');
      await expect(contentArea).toBeVisible();
      
      // 要素が表示可能な状態で描画されていることを確認
      const isVisible = await recommendedActionElement.isVisible();
      expect(isVisible).toBe(true);
      
      // 要素のバウンディングボックスを確認してレイアウトが正常であることを確認
      const boundingBox = await recommendedActionElement.boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    });
  });
});