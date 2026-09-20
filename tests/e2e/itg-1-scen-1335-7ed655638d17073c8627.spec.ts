import { test, expect } from '@playwright/test';

test('SCEN-1335: Amazon SageMakerからのリスク判定取得に失敗した場合、キャッシュされた配置案が「更新待機中」と注記されて表示される', async ({ page }) => {
  // ログイン画面への遷移と認証
  await page.goto('/')
  await page.waitForURL('**/login**', { timeout: 5000 }).catch(() => {
    // ログイン画面が表示されない場合はスキップ
  });

  // ログイン画面が表示されている場合はログイン処理を実行
  const loginTitle = await page.locator('.login-title').isVisible().catch(() => false);
  if (loginTitle) {
    await page.fill('input[placeholder*="ユーザーID"]', 'testuser');
    await page.fill('input[placeholder*="パスワード"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  }

  // 進捗・人員配置ダッシュボード画面に遷移
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面から人員配置最適化提案・実行画面へ遷移
  // 「人員配置を最適化」ボタンをクリック
  await page.click('button:has-text("人員配置を最適化")');
  await page.waitForNavigation({ waitUntil: 'networkidle' });

  // 人員配置最適化提案・実行画面が初期化され、前回キャッシュされた配置案データが画面に表示されるまで待機
  await page.waitForSelector('[id="proposals-container"]', { timeout: 10000 });

  // 期待結果1: 画面上部のアラートメッセージ領域に警告メッセージが表示されている
  const alertMessage = page.locator('text=リスク判定エンジンが一時的に利用できません。前回の判定結果を表示しています');
  await expect(alertMessage).toBeVisible();

  // 期待結果2: 前回キャッシュされた配置案が表示される配置案リスト内の各案の右側に「更新待機中」というラベルが付与されている
  const proposalsContainer = page.locator('[id="proposals-container"]');
  const proposalElements = proposalsContainer.locator('[id*="proposal"]');
  const proposalCount = await proposalElements.count();
  expect(proposalCount).toBeGreaterThan(0);

  // 各配置案に「更新待機中」のラベルが表示されていることを確認
  for (let i = 0; i < proposalCount; i++) {
    const proposal = proposalElements.nth(i);
    const waitingLabel = proposal.locator('text=更新待機中');
    await expect(waitingLabel).toBeVisible();
  }

  // 期待結果3: メッセージと「更新待機中」の注記が画面に留まり、配置案のインタラクティブな操作が可能な状態である
  // アラートメッセージが表示され続けていることを確認
  await expect(alertMessage).toBeVisible();

  // 最初の配置案を選択して操作可能性を確認
  const firstProposal = proposalElements.first();
  await firstProposal.click();
  await page.waitForLoadState('networkidle');

  // 選択後もアラートメッセージが表示され続けていることを確認
  await expect(alertMessage).toBeVisible();

  // 選択後も「更新待機中」ラベルが表示され続けていることを確認
  for (let i = 0; i < proposalCount; i++) {
    const proposal = proposalElements.nth(i);
    const waitingLabel = proposal.locator('text=更新待機中');
    await expect(waitingLabel).toBeVisible();
  }

  // 詳細情報が表示されていることを確認（インタラクティブな操作が可能な状態）
  const detailContainer = page.locator('[id="proposal-detail-container"]');
  await expect(detailContainer).toBeVisible();
});