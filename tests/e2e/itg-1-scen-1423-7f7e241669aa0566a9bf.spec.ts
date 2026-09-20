import { test, expect } from '@playwright/test';

test('SCEN-1423: ユーザーが人員配置案の却下操作を実行する権限を保有していない場合、権限確認工程で処理が中断され、ユーザーに権限不足を通知する画面が表示される', async ({ page }) => {
  // 1. 人員配置最適化提案・実行画面にて、権限不足のテストユーザーアカウント（却下操作権限なし）でログインする
  await page.goto('/');
  
  // ログイン画面で権限不足のテストユーザーアカウントでログイン
  await page.fill('input[type="text"]', 'testuser-no-reject-permission');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button:has-text("ログイン")');
  
  // ログイン後、自動遷移が完了するまで待機
  await page.waitForURL('**/panels/scr-1789461783315.html');
  
  // 人員配置最適化提案画面へ遷移
  await page.click('a:has-text("人員配置最適化提案")');
  await page.waitForURL('**/panels/scr-1789461798629.html');
  
  // 2. 画面に表示された人員配置案の一覧から、却下対象となる配置案を特定する
  // 配置案が表示されるまで待機
  await page.waitForSelector('[data-testid="assignment-detail-table"]', { timeout: 5000 });
  
  // 配置案の現在の状態を特定（data属性またはクラス属性で取得）
  const proposalRow = page.locator('[data-testid="assignment-detail-table"] tbody tr').first();
  const proposalStateAttr = await proposalRow.getAttribute('data-status');
  
  // 3. 当該配置案に対して、却下操作トリガー（「却下」ボタン）を実行する
  const rejectButton = page.locator('[data-testid="reject-button"]').first();
  
  // 4. 却下操作が発火され、バックエンド権限確認工程（認可判定）へ到達したことを待機する
  // APIレスポンスを待機（ステータスコードに関わらず権限確認工程の結果を監視）
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/api/') && response.request().method() === 'POST'
  );
  
  await rejectButton.click();
  
  // 5. バックエンド権限確認結果が画面へ返却されることを監視する
  const response = await responsePromise;
  
  // 期待結果: 却下操作トリガー実行後、画面に権限不足エラーモーダルが表示される
  const errorModal = page.locator('[role="dialog"]');
  await expect(errorModal).toBeVisible({ timeout: 5000 });
  
  // モーダルに以下の要素が含まれることを確認
  // (1) エラー分類「権限不足」を明記するタイトルまたはメッセージ
  const titleOrMessage = errorModal.locator('text=/権限不足|権限がありません/');
  await expect(titleOrMessage).toBeVisible();
  
  // (2) 「この操作を実行するための権限がありません」または同等の業務メッセージ
  const errorMessageElement = errorModal.locator('text=/この操作を実行するための権限がありません|権限がありません|実行する権限/');
  await expect(errorMessageElement).toBeVisible();
  
  // (3) ユーザーが取るべき対応を示す説明文（例：「システム管理者にお問い合わせください」）
  const explanationText = errorModal.locator('text=/システム管理者にお問い合わせください|管理者に/');
  await expect(explanationText).toBeVisible();
  
  // (4) モーダルを閉じるボタン（「OK」「閉じる」など）
  const closeButton = errorModal.locator('button:has-text(/^(OK|閉じる|確認)$/)');
  await expect(closeButton).toBeVisible();
  
  // 却下処理は実行されず、配置案の状態は変更されない
  // モーダルを閉じる前の配置案状態を確認
  const proposalTableBefore = page.locator('[data-testid="assignment-detail-table"] tbody tr').first();
  await expect(proposalTableBefore).toBeVisible();
  
  // モーダルを閉じる
  await closeButton.click();
  
  // モーダルが閉じられたことを確認
  await expect(errorModal).not.toBeVisible();
  
  // 配置案の状態が変更されていないことを確認（data属性で検証）
  const proposalStateAttrAfter = await proposalRow.getAttribute('data-status');
  expect(proposalStateAttrAfter).toBe(proposalStateAttr);
  
  // 配置案テーブルがまだ表示されていることを確認
  const proposalTableAfter = page.locator('[data-testid="assignment-detail-table"] tbody tr').first();
  await expect(proposalTableAfter).toBeVisible();
  
  // 却下ボタンが相変わらず表示されていることを確認
  const rejectButtonAfter = page.locator('[data-testid="reject-button"]').first();
  await expect(rejectButtonAfter).toBeVisible();
});