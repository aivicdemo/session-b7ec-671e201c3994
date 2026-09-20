import { test, expect } from '@playwright/test';

test('SCEN-964: 配置計画が取得されると、指定作業者の過去生産性データが期間指定で取得され配置案の根拠となるデータが参照可能になる', async ({ page }) => {
  // ログイン画面にアクセス
  await page.goto('/');
  
  // ログイン処理（テスト用デフォルト認証情報）
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // リダイレクト完了を待機
  await page.waitForNavigation();
  
  // 作業実績データ記録・入力画面へ遷移
  await page.goto('/panels/scr-1789461993203.html');
  await page.waitForLoadState('networkidle');

  // 指定作業者「WK001」を選択
  const workerSelect = page.locator('select[name="worker"], [data-testid="worker-select"]').first();
  await workerSelect.selectOption('WK001');

  // 作業期間を2024年1月1日～1月31日で指定
  const startDateInput = page.locator('input[name="startDate"], [data-testid="start-date"]').first();
  const endDateInput = page.locator('input[name="endDate"], [data-testid="end-date"]').first();
  
  await startDateInput.fill('2024-01-01');
  await endDateInput.fill('2024-01-31');

  // 作業実績データを1件以上入力
  const productionInput = page.locator('input[name="production"], [data-testid="production-input"]').first();
  const workTimeInput = page.locator('input[name="workTime"], [data-testid="work-time-input"]').first();
  const qualityInput = page.locator('input[name="quality"], [data-testid="quality-input"]').first();

  await productionInput.fill('100');
  await workTimeInput.fill('8');
  await qualityInput.fill('95');

  // 保存ボタンをクリック
  const saveButton = page.locator('button:has-text("保存"), [data-testid="save-button"]').first();
  await saveButton.click();

  // 保存完了を待機
  await page.waitForLoadState('networkidle');

  // 最適人員配置案提案・実行画面に遷移
  await page.goto('/panels/scr-1789461978707.html');
  await page.waitForLoadState('networkidle');

  // 配置計画の生成・取得が完了するまで待機
  await page.waitForSelector('[data-testid="placement-detail"], .placement-detail-section', { timeout: 30000 });

  // 配置案が表示されるまで待機
  const placementDetailArea = page.locator('[data-testid="placement-detail"], .placement-detail-section').first();
  await expect(placementDetailArea).toBeVisible();

  // 指定作業者（WK001）の根拠データセクションを探す
  const workerSection = page.locator('[data-testid*="WK001"], :has-text("WK001")').first();
  await expect(workerSection).toBeVisible();

  // 根拠データセクションを探す
  const evidenceSection = page.locator('[data-testid="evidence-data"], [data-testid="reference-data"], .evidence-section, .reference-data-section').first();
  await expect(evidenceSection).toBeVisible();
  
  // セクションが折りたたまれている場合は展開
  const expandButton = evidenceSection.locator('button').first();
  const isExpandable = await expandButton.isVisible().catch(() => false);
  if (isExpandable) {
    const ariaExpanded = await expandButton.getAttribute('aria-expanded');
    if (ariaExpanded === 'false') {
      await expandButton.click();
      await page.waitForTimeout(500);
    }
  }

  // セクション内のデータ行を取得
  const dataRowsArray = await evidenceSection.locator('[data-testid="data-row"], tr, .data-item').all();

  // 5件以上のデータレコードが存在することを確認
  expect(dataRowsArray.length).toBeGreaterThanOrEqual(5);

  // データの内容を検証（日付、生産数、作業時間などのカラムが存在）
  for (const row of dataRowsArray.slice(0, 5)) {
    // 日付フィールドが存在し、指定期間内であることを確認
    const dateCell = row.locator('[data-testid*="date"], .date-cell').first();
    await expect(dateCell).toBeVisible();
    
    const dateText = await dateCell.textContent();
    // 日付形式: YYYY-MM-DD または YYYY年MM月DD日 を想定
    let dateValue: Date;
    if (dateText && dateText.includes('年')) {
      // "2024年01月01日" 形式
      const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (match) {
        dateValue = new Date(`${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`);
      } else {
        dateValue = new Date(dateText);
      }
    } else {
      dateValue = new Date(dateText || '');
    }
    
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    
    expect(dateValue.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
    expect(dateValue.getTime()).toBeLessThanOrEqual(endDate.getTime());
    
    // 生産数フィールドが存在することを確認
    const productionCell = row.locator('[data-testid*="production"], .production-cell').first();
    await expect(productionCell).toBeVisible();
    
    // 作業時間フィールドが存在することを確認
    const workTimeCell = row.locator('[data-testid*="workTime"], .work-time-cell').first();
    await expect(workTimeCell).toBeVisible();
  }

  // 入力画面で保存した期間と一致するもののみが表示されていることを確認
  const allDataRows = await evidenceSection.locator('[data-testid="data-row"], tr, .data-item').all();
  for (const row of allDataRows) {
    const dateCell = row.locator('[data-testid*="date"], .date-cell').first();
    const dateText = await dateCell.textContent();
    
    let dateValue: Date;
    if (dateText && dateText.includes('年')) {
      // "2024年01月01日" 形式
      const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (match) {
        dateValue = new Date(`${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`);
      } else {
        dateValue = new Date(dateText);
      }
    } else {
      dateValue = new Date(dateText || '');
    }
    
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    
    // すべてのデータが指定期間内であることを確認
    expect(dateValue.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
    expect(dateValue.getTime()).toBeLessThanOrEqual(endDate.getTime());
  }
});