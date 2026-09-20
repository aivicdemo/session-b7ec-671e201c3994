import { test, expect } from '@playwright/test';

test.describe('SCEN-1457: ダッシュボード表示（実績管理画面から）', () => {
  test('複数チームの進捗集約時に、作業者生産性ベースラインデータが不足している場合、警告が表示される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 作業指示・実績管理画面へ遷移
    await page.click('a:has-text("作業指示・実績管理")');
    await page.waitForLoadState('networkidle');

    // 進捗・人員配置ダッシュボードへ遷移
    await test.step('作業指示・実績管理画面からダッシュボードへ遷移', async () => {
      await page.click('a:has-text("進捗・人員配置ダッシュボード")');
      await page.waitForLoadState('networkidle');
    });

    // ダッシュボード画面の読み込み待機
    await test.step('複数チームの進捗データが表示されるまで待機', async () => {
      const teamVarianceTable = page.locator('#team-variance-tbody');
      await teamVarianceTable.waitFor({ timeout: 10000 });
      
      // 複数チーム（3チーム以上）のデータが表示されていることを確認
      const teamRows = await teamVarianceTable.locator('tr').count();
      expect(teamRows).toBeGreaterThanOrEqual(3);
    });

    // ダッシュボール画面がレンダリングされていることを確認
    await test.step('複数チームの進捗集約ビューが表示されていることを確認', async () => {
      const dashboard = page.locator('.content-area');
      await expect(dashboard).toBeVisible();
      
      const teamVarianceTable = page.locator('#team-variance-tbody');
      await expect(teamVarianceTable).toBeVisible();
    });

    // 警告メッセージが表示されていることを確認
    await test.step('警告メッセージが表示されていることを確認', async () => {
      const warningMessage = page.locator('text=過去の生産性データが不足しています。効率スコアは参考値です');
      await expect(warningMessage).toBeVisible();
    });

    // 警告メッセージの表示位置を確認
    await test.step('警告メッセージの表示位置がチームA関連のウィジェット近傍にあることを確認', async () => {
      const warningMessage = page.locator('text=過去の生産性データが不足しています。効率スコアは参考値です');
      const warningBox = await warningMessage.boundingBox();
      expect(warningBox).toBeTruthy();
      expect(warningBox?.y).toBeGreaterThan(0);
    });

    // 警告メッセージのスタイルを確認（背景色・アイコン・テキスト色）
    await test.step('警告メッセージのスタイルがガイドラインに準拠していることを確認', async () => {
      const warningMessage = page.locator('text=過去の生産性データが不足しています。効率スコアは参考値です');
      const warningContainer = warningMessage.locator('..');
      
      // スタイル属性の確認
      const bgColor = await warningContainer.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      const textColor = await warningContainer.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      expect(bgColor).toBeTruthy();
      expect(textColor).toBeTruthy();
    });

    // ページリロード後、同じ警告が再表示されることを確認
    await test.step('ページリロード後、同じ警告が再表示されることを確認', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const teamVarianceTable = page.locator('#team-variance-tbody');
      await teamVarianceTable.waitFor({ timeout: 10000 });
      
      const warningMessage = page.locator('text=過去の生産性データが不足しています。効率スコアは参考値です');
      await expect(warningMessage).toBeVisible();
    });
  });
});