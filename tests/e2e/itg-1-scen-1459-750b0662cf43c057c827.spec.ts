import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移（実績管理画面から）', () => {
  test('セッション有効性検証後、ユーザーの人員配置最適化提案画面へのアクセス権限が確認される', async ({ page }) => {
    // ステップ1: テストユーザー（権限：拠点長）でシステムにログインし、セッションを確立する
    await test.step('テストユーザーでログインし、セッションを確立する', async () => {
      await page.goto('/');
      
      // ログイン画面が表示されるまで待機
      await page.waitForSelector('input[type="text"]');
      
      // ユーザーID入力
      await page.fill('input[type="text"]', 'test_user');
      
      // パスワード入力
      await page.fill('input[type="password"]', 'password123');
      
      // ログインボタンをクリック
      await page.click('button:has-text("ログイン")');
      
      // ダッシュボード画面への遷移を待機
      await page.waitForURL(/panels\/scr-1789461783315\.html/);
    });

    // ステップ2: 作業指示・実績管理画面を表示する
    await test.step('作業指示・実績管理画面を表示する', async () => {
      // ナビゲーションで作業指示・実績管理をクリック
      await page.click('[id="scr-1789461813941"]');
      
      // 作業指示・実績管理画面への遷移を待機
      await page.waitForURL(/panels\/scr-1789461813941\.html/);
      
      // 画面が完全にロードされたことを確認
      await page.waitForSelector('[id="worker-summary-list"]');
    });

    // ステップ3: 『人員配置最適化提案』ボタンをクリックして遷移を開始する
    await test.step('人員配置最適化提案ボタンをクリックして遷移を開始する', async () => {
      // 『人員配置最適化提案』ボタンをクリック
      await page.click('button:has-text("人員配置最適化提案")');
      
      // 遷移処理中のセッション有効性検証とアクセス権限確認が内部で実行される
      // 遷移完了を待機
      await page.waitForURL(/panels\/scr-1789461798629\.html/, { timeout: 10000 });
    });

    // ステップ4-7: 権限確認結果が正常で、画面が正常に表示されることを確認する
    await test.step('人員配置最適化提案・実行画面が正常に表示されることを確認する', async () => {
      // エラーダイアログが表示されていないことを確認
      const errorDialog = page.locator('[role="alert"]');
      await expect(errorDialog).not.toBeVisible();
      
      // エラーメッセージが表示されていないことを確認
      await expect(page.locator('text="セッション無効"')).not.toBeVisible();
      await expect(page.locator('text="権限がありません"')).not.toBeVisible();
      
      // 配置案生成関連セクション（提案コンテナ）が表示されていることを確認
      await page.waitForSelector('[id="proposals-container"]');
      const proposalsContainer = page.locator('[id="proposals-container"]');
      await expect(proposalsContainer).toBeVisible();
      
      // 配置案を自動生成ボタンが表示されていることを確認
      const generateButton = page.locator('button:has-text("人員配置案を自動生成")');
      await expect(generateButton).toBeVisible();
      
      // 人員配置最適化提案・実行画面の主要要素が正常にレンダリングされていることを確認
      const progressRate = page.locator('[id="progress-rate-value"]');
      await expect(progressRate).toBeVisible();
      
      // 以降のユーザー操作が可能な状態となっていることを確認
      const assignmentDetailTable = page.locator('[id="assignment-detail-tbody"]');
      await expect(assignmentDetailTable).toBeVisible();
    });
  });
});