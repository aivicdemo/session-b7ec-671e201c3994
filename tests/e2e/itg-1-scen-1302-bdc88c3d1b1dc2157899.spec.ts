import { test, expect } from '@playwright/test';

test('改善指示配信実行', async ({ page }) => {
  // テスト初期状態として、人員配置最適化提案・実行画面を開く
  await page.goto('/panels/scr-1789461798629.html');
  await page.waitForLoadState('networkidle');

  // 人員配置案を選択し、『配信実行』ボタンをクリックする
  await test.step('人員配置案を選択して配信実行', async () => {
    // 配置案リストから配置案ID 'PLAN-1001' を含む要素を探して選択
    const proposalRow = page.locator('text=PLAN-1001').first();
    await proposalRow.click();
    await page.waitForTimeout(500);

    // 配信実行ボタンをクリック
    const distributeButton = page.getByTestId('distribute-button');
    await distributeButton.click();
  });

  // 配信実行ボタン押下後、画面上に「配信を実行しています」等の進行中メッセージが表示されることを確認する
  await test.step('配信進行中メッセージを確認', async () => {
    const progressMessage = page.locator('text=/配信を実行|実行中/')
      .or(page.locator('text=/配信中/'));
    await expect(progressMessage).toBeVisible({ timeout: 5000 });
  });

  // 配信が完了し、画面上に『配信完了』または『配置案を配信しました』等の完了メッセージが表示されることを確認する
  await test.step('配信完了メッセージを確認', async () => {
    const completionMessage = page.locator('text=/配信完了|配置案を配信/')
      .or(page.locator('text=/配信しました/'));
    await expect(completionMessage).toBeVisible({ timeout: 10000 });
  });

  // 改善指示配信履歴セクション（または配信履歴タブ）に遷移し、新たに配信記録が表示されていることを確認
  await test.step('配信履歴セクション/タブに遷移して新規レコードを確認', async () => {
    // 配信履歴テーブルが表示されることを確認（同一画面内のセクション/タブ）
    const deliveryHistoryTable = page.getByTestId('delivery-history-table');
    await expect(deliveryHistoryTable).toBeVisible({ timeout: 5000 });
  });

  // 配信履歴一覧に新規レコードが表示されていることを確認
  await test.step('配信履歴一覧で新規レコードの必須項目を確認', async () => {
    const historyTable = page.locator('#delivery-history-tbody');
    
    // PLAN-1001を含む行が表示されていることを確認
    const plan1001Row = historyTable.locator('tr:has-text("PLAN-1001")').first();
    await expect(plan1001Row).toBeVisible();

    // 配置案ID が表示されていることを確認
    const planId = plan1001Row.locator('text=PLAN-1001');
    await expect(planId).toBeVisible();

    // 配信日時が表示されていることを確認（タイムスタンプ形式）
    const cells = await plan1001Row.locator('td').all();
    let datetimeFound = false;
    for (const cell of cells) {
      const text = await cell.textContent();
      if (text && /\d{4}[-/]\d{2}[-/]\d{2}/.test(text)) {
        datetimeFound = true;
        break;
      }
    }
    expect(datetimeFound).toBe(true);

    // 配信先 が表示されていることを確認
    const deliverySite = plan1001Row.locator('text=LOC-001').or(plan1001Row.locator('text=TEAM-A'));
    await expect(deliverySite).toBeVisible();

    // ステータスが「配信完了」であることを確認
    const status = plan1001Row.locator('text=/配信完了/');
    await expect(status).toBeVisible();

    // 新規レコードであることを確認（一覧の先頭に表示されていることを検証）
    const allRows = await historyTable.locator('tr').all();
    if (allRows.length > 0) {
      const firstRowText = await allRows[0].textContent();
      expect(firstRowText).toContain('PLAN-1001');
    }
  });

  // 配信履歴一覧から該当レコードを選択し、詳細表示で情報が正確に表示されていることを確認
  await test.step('配信履歴の詳細情報を確認', async () => {
    const historyTable = page.locator('#delivery-history-tbody');
    const plan1001Row = historyTable.locator('tr:has-text("PLAN-1001")').first();
    
    // 詳細行をクリック
    await plan1001Row.click();
    await page.waitForTimeout(500);

    // 詳細表示コンテナが表示されたことを確認
    const detailContainer = page.locator('#delivery-modal, [role="dialog"]').first();
    await expect(detailContainer).toBeVisible({ timeout: 5000 });

    // 詳細表示セクションで配置案IDを確認
    const planIdDetail = detailContainer.locator('text=PLAN-1001');
    await expect(planIdDetail).toBeVisible();

    // 配信状態が「配信完了」であることを確認
    const statusDetail = detailContainer.locator('text=/配信完了/');
    await expect(statusDetail).toBeVisible();

    // 配信先 LOC-001/TEAM-A が表示されていることを確認
    const siteDetail = detailContainer.locator('text=/LOC-001|TEAM-A/');
    await expect(siteDetail).toBeVisible();

    // 配信日時が詳細表示に表示されていることを確認（タイムスタンプ形式）
    const detailText = await detailContainer.textContent();
    const datetimeMatch = detailText?.match(/(\d{4})[-/](\d{2})[-/](\d{2})\s+(\d{2}):(\d{2})/);
    expect(datetimeMatch).toBeTruthy();

    // 配信日時が現在時刻付近であることを検証
    if (datetimeMatch) {
      const [_, year, month, day, hours, minutes] = datetimeMatch;
      const deliveryTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
      const now = new Date();
      const timeDiffMinutes = Math.abs((now.getTime() - deliveryTime.getTime()) / (1000 * 60));
      expect(timeDiffMinutes).toBeLessThan(5);
    }
  });
});