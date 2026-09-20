import { test, expect } from '@playwright/test';

test('SCEN-1358: 配置案が優先度付けされた後、生成・優先度付けされた人員配置案がシステムに保存される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.waitForURL(/panels\/scr-/);
  
  // 人員配置最適化提案・実行画面を開く
  await page.goto('/panels/scr-1789461798629.html');
  await page.waitForLoadState('networkidle');

  // 「配置案自動生成」ボタンをクリック
  const generateButton = page.getByRole('button', { name: '人員配置案を自動生成' });
  await generateButton.click();

  // システムが進捗・生産性・リスク予測データを取得し、人員配置案の生成処理が実行されることを確認
  // ローディング状態から生成完了までを待機
  const proposalsContainer = page.locator('[id="proposals-container"]');
  
  // 生成処理の実行を確認：プロポーザルコンテナにプロポーザルが表示されるまで待機
  await page.waitForFunction(
    () => {
      const container = document.getElementById('proposals-container');
      const proposals = container?.querySelectorAll('[role="button"]');
      return proposals && proposals.length > 0;
    },
    { timeout: 30000 }
  );
  
  // 生成されたプロポーザルの数を確認し、生成処理が実行されたことを検証
  const proposals = page.locator('[id="proposals-container"] [role="button"]');
  const proposalCount = await proposals.count();
  expect(proposalCount).toBeGreaterThan(0);

  // 複数案が表示されている場合、その一つを選択
  const firstProposal = proposals.first();
  await firstProposal.click();

  // 配置案の詳細が表示されることを確認
  const detailContainer = page.locator('[id="proposal-detail-container"]');
  await expect(detailContainer).toBeVisible();

  // 詳細コンテナから配置案情報を取得
  const detailContent = await detailContainer.textContent();
  expect(detailContent).toBeTruthy();

  // 詳細情報にタイムスタンプが含まれていることを確認
  const timestampPattern = /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}:\d{2}/;
  expect(detailContent).toMatch(timestampPattern);

  // 詳細情報に優先度ランクが含まれていることを確認
  expect(detailContent).toMatch(/優先度|ランク|Lv[0-9]|Level/);

  // 詳細情報に生成元フラグ（自動生成）が含まれていることを確認
  expect(detailContent).toContain('自動生成');

  // 詳細情報に対象拠点が含まれていることを確認
  expect(detailContent).toMatch(/拠点|東京|大阪|名古屋/);

  // 詳細情報に対象チームが含まれていることを確認
  expect(detailContent).toMatch(/チーム|Team|班/);

  // 配置案テーブルの内容を確認
  const assignmentTable = page.locator('[id="assignment-detail-tbody"]');
  await expect(assignmentTable).toBeVisible();
  const tableContent = await assignmentTable.textContent();
  expect(tableContent).toBeTruthy();

  // テーブルに推奨人員数（工数と人数）が表示されていることを確認
  expect(tableContent).toContain('h');
  expect(tableContent).toMatch(/名|人/);

  // 表示された配置案に対して、画面上の「優先度付け」操作を実行
  // 「配置案を承認」ボタンをクリックして優先度付けを実行
  const approveButton = page.getByRole('button', { name: '配置案を承認' });
  await approveButton.click();

  // 承認モーダルが表示される場合は確認ボタンをクリック
  const approveModalOverlay = page.locator('[id="approve-modal-overlay"]');
  if (await approveModalOverlay.isVisible()) {
    const confirmButton = page.getByRole('button', { name: '承認する' });
    await confirmButton.click();
  }

  // ステータスが『確定済み』に変化したことを画面で確認
  await page.waitForTimeout(1000);
  const statusElement = page.locator('[id="logic-status"]');
  await expect(statusElement).toContainText('確定済み');

  // 人員配置最適化提案・実行画面を再読み込み
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 再読み込み後、同じ配置案が『確定済み』ステータスで復元されることを確認
  const restoredStatusElement = page.locator('[id="logic-status"]');
  await expect(restoredStatusElement).toContainText('確定済み');

  // 保存された配置案の詳細情報を画面上で確認
  const restoredDetailContainer = page.locator('[id="proposal-detail-container"]');
  await expect(restoredDetailContainer).toBeVisible();

  const restoredDetailContent = await restoredDetailContainer.textContent();
  expect(restoredDetailContent).toBeTruthy();

  // 復元後の配置案詳細にタイムスタンプが表示されていることを確認
  expect(restoredDetailContent).toMatch(timestampPattern);

  // 復元後の配置案詳細に優先度ランクが表示されていることを確認
  expect(restoredDetailContent).toMatch(/優先度|ランク|Lv[0-9]|Level/);

  // 復元後の配置案詳細に生成元フラグ（自動生成）が表示されていることを確認
  expect(restoredDetailContent).toContain('自動生成');

  // 復元後の配置案詳細に対象拠点が表示されていることを確認
  expect(restoredDetailContent).toMatch(/拠点|東京|大阪|名古屋/);

  // 復元後の配置案詳細に対象チームが表示されていることを確認
  expect(restoredDetailContent).toMatch(/チーム|Team|班/);

  // 復元後のテーブル内容を確認
  const restoredAssignmentTable = page.locator('[id="assignment-detail-tbody"]');
  await expect(restoredAssignmentTable).toBeVisible();
  const restoredTableContent = await restoredAssignmentTable.textContent();
  expect(restoredTableContent).toBeTruthy();

  // 復元後のテーブルに推奨人員数が表示されていることを確認
  expect(restoredTableContent).toContain('h');
  expect(restoredTableContent).toMatch(/名|人/);

  // 進捗・人員配置ダッシュボードに遷移
  const dashboardNav = page.getByRole('link', { name: '進捗・人員配置ダッシュボード' });
  await dashboardNav.click();
  await page.waitForURL(/panels\/scr-1789461783315/);
  await page.waitForLoadState('networkidle');

  // 『配置案実行状況』セクション（アクティブプランテーブル）に当該配置案が列挙されていることを確認
  const activePlansTable = page.locator('[id="active-plans-tbody"]');
  await expect(activePlansTable).toBeVisible();

  const activePlansContent = await activePlansTable.textContent();
  expect(activePlansContent).toBeTruthy();
  
  // 配置案が「確定待機中」もしくは「配信準備中」として列挙されていることを確認
  const statusMatch = activePlansContent.match(/確定待機中|配信準備中/);
  expect(statusMatch).toBeTruthy();
});