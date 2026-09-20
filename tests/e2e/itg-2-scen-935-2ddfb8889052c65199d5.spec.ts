import { test, expect } from '@playwright/test';

test.describe('配置案承認 - 入力エラー処理', () => {
  test('SCEN-935: 必須項目欠落または形式不正な場合、入力エラーが発生し処理が中断される', async ({ page }) => {
    // ログイン画面へアクセス
    await page.goto('/');
    
    // ログイン処理（認証が前提）
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // ログイン後の遷移完了を待つ
    await page.waitForNavigation();

    // 最適人員配置案提案・実行画面に遷移
    await page.goto('/panels/scr-1789461978707.html');
    await page.waitForLoadState('networkidle');

    // 承認待ち状態の配置案を1件選択して承認画面を開く
    const pendingApprovalRow = page.locator('tr:has-text("承認待ち")').first();
    await expect(pendingApprovalRow).toBeVisible();
    
    // 配置案行をクリックして承認画面を開く
    await pendingApprovalRow.click();
    
    // 承認画面が開かれるまで待機
    const approvalDialog = page.locator('[role="dialog"]').first();
    await expect(approvalDialog).toBeVisible();

    // 承認画面で配置案ID・承認者情報・承認コメント入力フォームが表示されていることを確認
    const placementIdInput = page.locator('input[name="placementId"]');
    const approverInfoInput = page.locator('input[name="approverInfo"]');
    const commentInput = page.locator('textarea[name="comment"]');
    
    await expect(placementIdInput).toBeVisible();
    await expect(approverInfoInput).toBeVisible();
    await expect(commentInput).toBeVisible();

    // 必須項目を空白のまま、または形式不正なデータを入力して承認ボタンをクリック
    await test.step('必須項目空白・形式不正でのエラーテスト', async () => {
      // フォームをクリアして空白の状態にする
      await placementIdInput.clear();
      await approverInfoInput.clear();
      await commentInput.clear();

      // 承認ボタンをクリック
      const approveButton = page.locator('button:has-text("承認")').first();
      await approveButton.click();

      // 入力エラーメッセージが表示されることを確認
      const errorMessages = page.locator('[role="alert"], .error-message, .validation-error');
      await expect(errorMessages.first()).toBeVisible();

      // 具体的なエラーメッセージを確認（項目ごと）
      await expect(page.locator('text=/配置案IDが不正です|配置案ID.*必須/')).toBeVisible();
      await expect(page.locator('text=/承認者情報は必須/')).toBeVisible();

      // エラーメッセージが赤色で表示されていることを確認
      const errorElement = page.locator('[role="alert"], .error-message, .validation-error').first();
      const color = await errorElement.evaluate(el => window.getComputedStyle(el).color);
      // 赤色のRGB値（赤成分が高く、緑・青成分が低い）を検証
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        expect(r > 200 && g < 100 && b < 100).toBeTruthy();
      }

      // 最適人員配置案提案・実行画面内に留まっていることを確認
      await expect(page).toHaveURL(/scr-1789461978707/);
    });

    // 承認画面を再度開く
    const pendingApprovalRow2 = page.locator('tr:has-text("承認待ち")').first();
    await pendingApprovalRow2.click();
    const approvalDialog2 = page.locator('[role="dialog"]').first();
    await expect(approvalDialog2).toBeVisible();

    // 形式不正なデータでの入力エラーテスト
    await test.step('形式不正なデータでの入力エラーテスト', async () => {
      // 入力フィールドをクリア
      const placementIdInput2 = page.locator('input[name="placementId"]');
      const approverInfoInput2 = page.locator('input[name="approverInfo"]');
      const commentInput2 = page.locator('textarea[name="comment"]');

      await placementIdInput2.clear();
      await approverInfoInput2.clear();
      await commentInput2.clear();

      // 形式不正なデータを入力
      await placementIdInput2.fill('INVALID@#$'); // 配置案IDに形式不正な文字
      await approverInfoInput2.fill('承認者@#$'); // 承認者IDに許可されていない特殊文字
      
      // コメントに許可されていない特殊文字を入力
      const invalidComment = '承認します<script>alert("test")</script>';
      await commentInput2.fill(invalidComment);

      // 承認ボタンをクリック
      const approveButton = page.locator('button:has-text("承認")').first();
      await approveButton.click();

      // 入力エラーメッセージが表示されることを確認
      const errorMessages = page.locator('[role="alert"], .error-message, .validation-error');
      await expect(errorMessages.first()).toBeVisible();

      // 具体的なエラーメッセージを確認
      await expect(page.locator('text=/配置案IDが不正です/')).toBeVisible();

      // 最適人員配置案提案・実行画面内に留まっていることを確認
      await expect(page).toHaveURL(/scr-1789461978707/);
    });

    // 承認画面を再度開く
    const pendingApprovalRow3 = page.locator('tr:has-text("承認待ち")').first();
    await pendingApprovalRow3.click();
    const approvalDialog3 = page.locator('[role="dialog"]').first();
    await expect(approvalDialog3).toBeVisible();

    // 500文字を超えるコメントでのエラーテスト
    await test.step('コメント文字数超過でのエラーテスト', async () => {
      // 入力フィールドをクリア
      const placementIdInput3 = page.locator('input[name="placementId"]');
      const approverInfoInput3 = page.locator('input[name="approverInfo"]');
      const commentInput3 = page.locator('textarea[name="comment"]');

      await placementIdInput3.clear();
      await approverInfoInput3.clear();
      await commentInput3.clear();

      // 有効なデータを入力
      await placementIdInput3.fill('PLACE001');
      await approverInfoInput3.fill('12345');

      // 500文字を超えるコメントを生成して入力
      const longComment = 'a'.repeat(501);
      await commentInput3.fill(longComment);

      // 承認ボタンをクリック
      const approveButton = page.locator('button:has-text("承認")').first();
      await approveButton.click();

      // 文字数制限のエラーメッセージが表示されることを確認
      await expect(page.locator('text=/承認コメントは500文字以内で入力してください/')).toBeVisible();

      // 最適人員配置案提案・実行画面内に留まっていることを確認
      await expect(page).toHaveURL(/scr-1789461978707/);
    });

    // 配置案が承認されていないことを確認
    await test.step('配置案が承認されず、保存が発生していないことを確認', async () => {
      // 最適人員配置案提案・実行画面内に留まっていることを確認
      await expect(page).toHaveURL(/scr-1789461978707/);

      // 承認待ちステータスがまだ存在することを確認
      const statusText = await page.locator('td:has-text("承認待ち")').first().textContent();
      expect(statusText).toContain('承認待ち');

      // ページをリロードして、データが保存されていないことを確認
      await page.reload();
      await page.waitForLoadState('networkidle');
      const statusAfterReload = await page.locator('td:has-text("承認待ち")').first().textContent();
      expect(statusAfterReload).toContain('承認待ち');
    });
  });
});