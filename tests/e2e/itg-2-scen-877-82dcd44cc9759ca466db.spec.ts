import { test, expect } from '@playwright/test';

test('SCEN-877: 作業者の生産性パターンデータが3日分未満の場合、警告メッセージが表示される', async ({ page }) => {
  // ログイン画面への遷移
  await page.goto('/');
  
  // ログイン処理
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後の自動遷移が終わるまで待機
  await page.waitForURL(/.*panels.*/);
  
  // 作業実績データ記録・入力画面に遷移
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');
  
  // テスト対象作業者のプロフィールを開く
  // 実績データが2日分（48時間以内）の作業者を選択
  await page.click('[data-testid="worker-profile-button"]');
  await page.waitForSelector('[data-testid="worker-details"]');
  
  // 実績データ記録件数が2日分であることを確認
  const dataRecordInfo = await page.locator('[data-testid="record-count"]').textContent();
  expect(dataRecordInfo).toContain('2');
  
  // 「分析実行」または「推奨配置生成」ボタンをクリック
  const analyzeButton = page.locator('button:has-text("分析実行"), button:has-text("推奨配置生成")').first();
  await analyzeButton.click();
  
  // 生産性ダッシュボード・分析画面への遷移を待機
  await page.waitForURL(/.*panels\/scr-1789461964046.*/);
  await page.waitForLoadState('networkidle');
  
  // 警告メッセージが表示されることを確認
  const warningMessage = page.locator('text=生産性データが不足しているため、推奨精度が低い可能性があります');
  await expect(warningMessage).toBeVisible();
  
  // メッセージが画面上部またはアラート領域に表示されていることを確認
  const warningContainer = page.locator('[role="alert"], .alert, .warning');
  const messageLocator = warningContainer.filter({ hasText: '生産性データが不足しているため、推奨精度が低い可能性があります' });
  await expect(messageLocator).toBeVisible();
  
  // メッセージが操作可能な状態で表示されていることを確認（閉じるボタンまたは×アイコンが存在）
  const closeButton = warningContainer.locator('button:has-text("閉じる"), button[aria-label="閉じる"], button:has-text("×")').first();
  await expect(closeButton).toBeVisible();
  await expect(closeButton).toBeEnabled();
});