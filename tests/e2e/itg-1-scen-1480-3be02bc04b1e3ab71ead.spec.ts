import { test, expect } from '@playwright/test';

test.describe('作業指示実績管理画面表示', () => {
  test('WMS連携が一時的に失敗したとき、キャッシュされた最後の正常なデータが使用され、遅延を示す注記が表示される', async ({ page, context }) => {
    // ログイン
    await page.goto('/');
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // 作業指示・実績管理画面を開く
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    let cachedDataBeforeError = '';
    let normalStateTimestamp = '';
    let initialMinutes = 0;

    test.step('WMS連携が正常に動作している状態を確認し、進捗データが画面に表示されていることを確認', async () => {
      // 進捗データが表示されていることを確認
      const workerSummaryList = page.locator('#worker-summary-list');
      await expect(workerSummaryList).toBeVisible();

      // 作業指示一覧が表示されていることを確認
      const workInstructionList = page.getByTestId('work-instruction-list');
      await expect(workInstructionList).toBeVisible();

      // 具体的なデータ内容の確認（拠点A、チームB、進捗率75%）
      const summaryRows = workerSummaryList.locator('tr');
      const rowCount = await summaryRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // 少なくとも1行に拠点A、チームBのデータが含まれていることを確認
      let dataFound = false;
      for (let i = 0; i < rowCount; i++) {
        const rowText = await summaryRows.nth(i).textContent();
        if (rowText && rowText.includes('拠点A') && rowText.includes('チームB') && rowText.includes('75%')) {
          dataFound = true;
          cachedDataBeforeError = rowText;
          break;
        }
      }
      expect(dataFound).toBeTruthy();

      // 正常状態で表示されているデータから現在時刻をタイムスタンプとして保存
      normalStateTimestamp = new Date().toISOString();
    });

    test.step('WMS連携に一時的な通信エラーが発生するよう環境を設定', async () => {
      // WMS関連のネットワークリクエストをブロック
      await context.route('**/api/wms/**', route => route.abort());

      // ページ内のWMS関連リクエストをトリガーするため少し待機
      await page.waitForTimeout(500);
    });

    test.step('作業指示・実績管理画面を更新または再ロード', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
    });

    test.step('画面の進捗データ表示領域を確認', async () => {
      // キャッシュされたデータが表示されていることを確認
      const workerSummaryList = page.locator('#worker-summary-list');
      await expect(workerSummaryList).toBeVisible();

      // データが存在することを確認
      const rows = workerSummaryList.locator('tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // キャッシュされた具体的なデータが保持されていることを確認
      let cachedDataFound = false;
      for (let i = 0; i < rowCount; i++) {
        const rowText = await rows.nth(i).textContent();
        if (rowText && rowText.includes('拠点A') && rowText.includes('チームB') && rowText.includes('75%')) {
          cachedDataFound = true;
          break;
        }
      }
      expect(cachedDataFound).toBeTruthy();
    });

    test.step('画面上の進捗表示に付随する注記を確認', async () => {
      // 「進捗データの更新に遅延が発生しています。最後の更新：○分前」という注記が表示されていることを確認
      const delayNotification = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：.+分前/');
      await expect(delayNotification).toBeVisible();

      // 注記テキストを取得
      const notificationText = await delayNotification.textContent();

      // 注記に必要な要素が含まれていることを確認
      expect(notificationText).toContain('進捗データの更新に遅延が発生しています');
      expect(notificationText).toContain('最後の更新：');

      // 経過時間を示す「分前」が含まれていることを確認
      expect(notificationText).toMatch(/\d+分前/);

      // タイムスタンプが注記内に表示されているか確認
      // ISO形式またはJST形式のタイムスタンプを検証
      const timestampPattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}|(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}))/;
      expect(notificationText).toMatch(timestampPattern);

      // 注記が進捗データ表示領域の直下または近傍に配置されていることを確認
      const workerSummaryList = page.locator('#worker-summary-list');
      const summaryBoundingBox = await workerSummaryList.boundingBox();
      const notificationBoundingBox = await delayNotification.boundingBox();

      if (summaryBoundingBox && notificationBoundingBox) {
        // 注記がデータ表示領域の下に配置されているか確認
        const isBelow = notificationBoundingBox.y >= summaryBoundingBox.y;
        const isNearby = notificationBoundingBox.y - (summaryBoundingBox.y + summaryBoundingBox.height) <= 200;
        expect(isBelow && isNearby).toBeTruthy();
      }

      // 経過時間を抽出して保存
      const minutesPattern = /(\d+)分前/;
      const initialMatch = notificationText?.match(minutesPattern);
      expect(initialMatch).not.toBeNull();
      initialMinutes = initialMatch ? parseInt(initialMatch[1]) : 0;
      expect(initialMinutes).toBeGreaterThanOrEqual(0);
    });

    test.step('データが古いことを明示する表示を確認', async () => {
      const workerSummaryList = page.locator('#worker-summary-list');

      // グレーアウト表示を確認（opacity が低い、または color がグレー）
      const tableRows = workerSummaryList.locator('tr');
      const rowCount = await tableRows.count();

      let hasGrayOut = false;
      for (let i = 0; i < rowCount; i++) {
        const row = tableRows.nth(i);
        const opacity = await row.evaluate(el =>
          window.getComputedStyle(el).opacity
        ).catch(() => '1');

        const color = await row.evaluate(el =>
          window.getComputedStyle(el).color
        ).catch(() => 'rgb(0, 0, 0)');

        if (parseFloat(opacity) < 1) {
          hasGrayOut = true;
        }

        // グレーの色（RGB値が比較的均等で薄い）を確認
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          const brightness = (r + g + b) / 3;
          // グレースケールの値が中程度（グレーアウト状態）かどうか確認
          if (brightness < 200 && brightness > 100) {
            hasGrayOut = true;
          }
        }
      }

      // 警告アイコンが表示されているか確認
      const warningIcon = page.locator('[class*="warning"], [class*="alert"], [data-testid*="warning"], [data-testid*="alert"]').first();
      let hasWarningIcon = false;
      try {
        await expect(warningIcon).toBeVisible({ timeout: 2000 });
        hasWarningIcon = true;
      } catch {
        hasWarningIcon = false;
      }

      // 「待機中」ラベルが表示されているか確認
      const waitingLabel = page.locator('text=待機中').first();
      let hasWaitingLabel = false;
      try {
        await expect(waitingLabel).toBeVisible({ timeout: 2000 });
        hasWaitingLabel = true;
      } catch {
        hasWaitingLabel = false;
      }

      // データが古いことを明示する表示のいずれかが付与されていることを確認
      const hasAnyIndicator = hasWaitingLabel || hasGrayOut || hasWarningIcon;
      expect(hasAnyIndicator).toBeTruthy();
    });

    test.step('タイムスタンプに基づいた経過時間が動的に更新されることを確認', async () => {
      // 初回の経過時間を記録
      const delayNotification = page.locator('text=/進捗データの更新に遅延が発生しています。最後の更新：.+分前/');
      const initialText = await delayNotification.textContent();

      // タイムスタンプが表示されていることを確認
      expect(initialText).toContain('進捗データの更新に遅延が発生しています');
      expect(initialText).toContain('最後の更新：');

      // 表示されたタイムスタンプを抽出
      const timestampPattern = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}|(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}))/;
      const timestampMatch = initialText?.match(timestampPattern);
      expect(timestampMatch).not.toBeNull();
      const displayedTimestamp = timestampMatch ? timestampMatch[0] : '';

      // 初回の経過時間を抽出
      const minutesPattern = /(\d+)分前/;
      const initialMatch = initialText?.match(minutesPattern);
      expect(initialMatch).not.toBeNull();
      const firstMinutes = initialMatch ? parseInt(initialMatch[1]) : -1;
      expect(firstMinutes).toBeGreaterThanOrEqual(0);

      // タイムスタンプから計算される経過時間が表示された分数と合致しているか確認
      const timestampDate = new Date(displayedTimestamp);
      const currentTime = new Date();
      const elapsedMinutes = Math.floor((currentTime.getTime() - timestampDate.getTime()) / (1000 * 60));
      // 誤差範囲（±1分程度）で検証
      expect(Math.abs(elapsedMinutes - firstMinutes)).toBeLessThanOrEqual(1);

      // 数秒待機後に経過時間が動的に更新されているか確認
      await page.waitForTimeout(3000);

      const updatedText = await delayNotification.textContent();
      expect(updatedText).toContain('進捗データの更新に遅延が発生しています');
      expect(updatedText).toContain('最後の更新：');

      // 更新後のタイムスタンプを抽出（通常は同じタイムスタンプ）
      const updatedTimestampMatch = updatedText?.match(timestampPattern);
      expect(updatedTimestampMatch).not.toBeNull();

      const updatedMatch = updatedText?.match(minutesPattern);
      expect(updatedMatch).not.toBeNull();
      const secondMinutes = updatedMatch ? parseInt(updatedMatch[1]) : -1;
      expect(secondMinutes).toBeGreaterThanOrEqual(0);

      // タイムスタンプに基づいた経過時間が動的に更新されていることを確認
      // 3秒経過したため、分数が増加するか、同じままか、を検証
      expect(secondMinutes).toBeGreaterThanOrEqual(firstMinutes);
    });

    // ネットワークエラーのリセット
    await context.clearCookies();
  });
});