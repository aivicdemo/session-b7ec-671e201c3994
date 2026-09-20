import { test, expect } from '@playwright/test';

test.describe('SCEN-1391: 人員配置案配信', () => {
  test('配置案の実行状況レコードが作成され、計画開始日時・計画工数・進捗率初期値が記録される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    await page.waitForURL(/.*panels.*/, { timeout: 10000 });

    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // 配置案生成に必要なデータが揃っていることを確認
    // 現在の進捗状況を確認
    const progressRateElement = page.locator('[data-testid="progress-rate"]');
    await expect(progressRateElement).toBeVisible();

    // 生産性データが揃っていることを確認
    const productivityList = page.locator('#productivity-list');
    await expect(productivityList).toBeVisible();
    const productivityItems = await productivityList.locator('tr').count();
    expect(productivityItems).toBeGreaterThan(0);

    // 人員配置案を生成
    const generateButton = page.getByRole('button', { name: '人員配置案を自動生成' });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // 配置案が生成されるまで待機
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toContainText(/.+/, { timeout: 10000 });

    // 配置案詳細を取得（配置案の総工数を確認）
    const assignmentDetailTable = page.locator('[data-testid="assignment-detail-table"]');
    await expect(assignmentDetailTable).toBeVisible();

    // 配置案の総工数を計算
    const plannedHoursElements = await page.locator('[data-testid="assignment-detail-table"] tbody tr td:nth-child(4)').allTextContents();
    let totalPlannedHours = 0;
    for (const text of plannedHoursElements) {
      const hours = parseFloat(text);
      if (!isNaN(hours)) {
        totalPlannedHours += hours;
      }
    }

    // 配置案を実行（配置案と作業指示を一括配信ボタンをクリック）
    const distributeButton = page.getByRole('button', { name: '配置案と作業指示を一括配信' });
    await expect(distributeButton).toBeVisible();

    // 実行時刻を記録（配信ボタン押下直前）
    const executionTimeUnix = Math.floor(Date.now() / 1000);

    await distributeButton.click();

    // 配信モーダルで確認
    const distributeModalConfirm = page.locator('[data-testid="distribute-modal-confirm"]');
    await expect(distributeModalConfirm).toBeVisible();
    await distributeModalConfirm.click();

    // ダッシュボードへ遷移を待機
    await page.waitForURL(/.*scr-1789461783315/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // 進捗・人員配置ダッシュボードに遷移したことを確認
    const dashboard = page.locator('[data-testid="active-plans-table"]');
    await expect(dashboard).toBeVisible();

    // 配置案の実行状況レコードが新規作成されていることを確認
    const activePlansTable = page.locator('#active-plans-tbody');
    await expect(activePlansTable).toBeVisible();

    // テーブルから新規作成されたレコードを取得
    const rows = await page.locator('#active-plans-tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // 最新のレコード（最初の行）を確認
    const firstRow = page.locator('#active-plans-tbody tr').first();

    // 計画開始日時（実行時刻）が記録されていることを確認
    const planStartDateTimeCell = firstRow.locator('td:nth-child(3)');
    const planStartDateTimeText = await planStartDateTimeCell.textContent();
    expect(planStartDateTimeText).toBeTruthy();

    // 計画工数が配置案の総工数と一致していることを確認
    const planHoursCell = firstRow.locator('td:nth-child(4)');
    const planHoursText = await planHoursCell.textContent();
    const recordedPlannedHours = parseFloat(planHoursText || '0');
    expect(recordedPlannedHours).toBe(totalPlannedHours);

    // 進捗率初期値が0%であることを確認
    const progressRateCell = firstRow.locator('td:nth-child(5)');
    const progressRateText = await progressRateCell.textContent();
    expect(progressRateText).toContain('0%');

    // データベースに記録されていることを検証
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    const tables = await page.evaluate(() => (window as any).AIVIC_TABLES);

    // active_plansテーブル番号を取得
    const activePlansTableNum = tables.find((t: any) => t.tableName === 'active_plans')?.tableId;

    if (activePlansTableNum && apiUrl && appId) {
      // 最新のレコードをデータベースから取得
      const dbResponse = await page.request.get(
        `${apiUrl}/api/${activePlansTableNum}?app=${appId}&sort=-created_at&limit=1`
      );
      expect(dbResponse.ok()).toBeTruthy();

      const dbData = await dbResponse.json();
      const latestRecord = dbData.records ? dbData.records[0] : null;

      expect(latestRecord).toBeTruthy();

      // 計画開始日時（plan_start_datetime）がデータベースに記録されていることを確認
      expect(latestRecord.plan_start_datetime).toBeTruthy();
      const recordedStartTime = Math.floor(new Date(latestRecord.plan_start_datetime).getTime() / 1000);
      // 実行時刻とDB記録の時刻が同じ範囲内（秒単位で近い）であることを確認
      expect(Math.abs(recordedStartTime - executionTimeUnix)).toBeLessThanOrEqual(5);

      // 計画工数（planned_hours）がデータベースに記録されていることを確認
      expect(latestRecord.planned_hours).toBe(totalPlannedHours);

      // 進捗率初期値（progress_rate）が0%（0）であることを確認
      expect(latestRecord.progress_rate).toBe(0);
    }
  });
});