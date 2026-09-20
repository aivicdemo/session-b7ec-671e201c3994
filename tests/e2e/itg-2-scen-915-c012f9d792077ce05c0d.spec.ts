import { test, expect } from '@playwright/test';

test('SCEN-915: 現場リーダーが配置案却下操作を実行するとき、役割に基づく権限検証が成功し、次の入力値検証へ進む', async ({ page }) => {
  // Step 1: 最適人員配置案提案・実行画面にアクセスし、現場リーダーのユーザーアカウントでログインしている状態を確認する
  await page.goto('/');
  
  // ログイン画面が表示されるまで待機
  await page.waitForURL('**/scr-1789461783315.html');
  
  // ログイン画面でのログイン操作
  await page.fill('input[placeholder*="ユーザー"]', 'fieldleader');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後、自動遷移が完了するまで待機
  await page.waitForNavigation();
  
  // 最適人員配置案提案・実行画面に遷移することを確認
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');
  
  // Step 2: 配置案却下ボタンをクリックする
  const rejectButton = page.locator('button:has-text("却下")');
  await expect(rejectButton).toBeVisible();
  await rejectButton.click();
  
  // Step 3: 権限検証が行われている間、画面上に権限検証中であることを示す処理中インジケータが表示されることを確認する
  const loadingIndicator = page.locator('[role="status"], .loading, .spinner, [aria-busy="true"]');
  await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
  
  // Step 4: 権限検証が完了し、配置案却下理由の入力フィールド、添付ファイルアップロード枠、送信ボタンなど入力値検証へ進むための UI コンポーネントが画面に表示されることを確認する
  await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
  
  // 却下理由入力フィールドが表示され、有効化された状態であることを確認
  const reasonInput = page.locator('textarea[placeholder*="却下理由"], input[placeholder*="却下理由"], [aria-label*="却下理由"]');
  await expect(reasonInput).toBeVisible();
  await expect(reasonInput).toBeEnabled();
  
  // 添付ファイルアップロード枠が表示され、有効化された状態であることを確認
  const fileUpload = page.locator('input[type="file"], [aria-label*="ファイル"], .file-upload, .upload-area');
  await expect(fileUpload).toBeVisible();
  await expect(fileUpload).toBeEnabled();
  
  // 送信ボタンが表示され、有効化された状態であることを確認
  const submitButton = page.locator('button:has-text("送信"), button:has-text("実行"), button:has-text("確定")');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  
  // Step 5: 表示された却下理由入力フィールドにフォーカスが当たり、キーボード入力が受け付ける状態になっていることを確認する
  // フィールドをクリックしてフォーカスを当てる
  await reasonInput.click();
  
  // フィールドがフォーカス状態であることを確認
  await expect(reasonInput).toBeFocused();
  
  // キーボード入力が受け付ける状態を確認（入力可能な状態か検証）
  await reasonInput.type('テスト却下理由');
  const inputValue = await reasonInput.inputValue();
  await expect(inputValue).toBe('テスト却下理由');
});