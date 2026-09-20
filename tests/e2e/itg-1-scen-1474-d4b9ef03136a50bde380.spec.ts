import { test, expect } from "@playwright/test";

test("SCEN-1474: ハンディターミナル連携ログが取得され、連携状況が画面に表示される", async ({
  page,
}) => {
  // 作業指示・実績管理画面を開く
  await page.goto("/panels/scr-1789461813941.html");

  // ページが完全に読み込まれるまで待機
  await page.waitForLoadState("networkidle");

  // ハンディターミナルタブが存在することを確認
  const handyTerminalTab = page.getByTestId("tab-handy-terminal");
  await expect(handyTerminalTab).toBeVisible();

  // ハンディターミナルタブをクリック
  await handyTerminalTab.click();

  // タブコンテンツが表示されるまで待機
  const tabContent = page.locator("#tab-handy-terminal-content");
  await expect(tabContent).toBeVisible();

  // 画面全体のボタンから「データ更新」または「同期」ボタンを探して実行
  const buttons = page.locator("button");
  const buttonCount = await buttons.count();

  let updateButtonFound = false;

  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const buttonText = await button.textContent();
    if (buttonText?.includes("データ更新") || buttonText?.includes("同期")) {
      // ボタンをクリック
      await button.click();
      updateButtonFound = true;

      // ローディング状態を待機
      const loadingIndicator = page.locator(
        "[class*='loading'], [class*='spinner'], .spinner"
      );

      // ローディング状態が表示されるまで待機（存在する場合）
      try {
        await loadingIndicator
          .first()
          .waitFor({ state: "visible", timeout: 5000 })
          .catch(() => {});
      } catch (e) {
        // ローディングインジケーターが無い可能性もあるため、スキップ
      }

      // ローディング状態が終わるまで待機
      await page.waitForLoadState("networkidle");

      break;
    }
  }

  // 「データ更新」または「同期」ボタンが見つかったことを確認
  expect(updateButtonFound).toBe(true);

  // ハンディターミナル連携ログテーブルが存在することを確認
  const logTable = page.locator("#handy-terminal-log-tbody");
  await expect(logTable).toBeVisible();

  // ハンディターミナル連携ログテーブルの行を取得
  const logRows = page.locator("#handy-terminal-log-tbody tr");

  // 最低1件のログが存在することを確認
  const rowCount = await logRows.count();
  expect(rowCount).toBeGreaterThan(0);

  // 最初の行（最新のタイムスタンプのログ）を確認
  const firstRow = logRows.nth(0);
  await expect(firstRow).toBeVisible();

  // 複数行のログが存在する場合、全行が表示されていることを確認
  const allLogData: {
    timestamp: string;
    workerId?: string;
    workContent?: string;
    quantity?: string;
    status?: string;
  }[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row = logRows.nth(i);
    await expect(row).toBeVisible();

    // 各行のセルを取得
    const cells = row.locator("td");
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(5);

    // セルの内容を確認：作業者ID、作業内容、実績数、タイムスタンプ、連携ステータス
    const cellTexts = [];
    let workerId = "";
    let workContent = "";
    let quantity = "";
    let timestamp = "";
    let status = "";

    for (let j = 0; j < cellCount; j++) {
      const cell = cells.nth(j);
      const cellText = await cell.textContent();
      expect(cellText?.trim()).toBeTruthy();
      cellTexts.push(cellText?.trim() || "");

      // 作業者IDを抽出（最初のセル）
      if (j === 0) {
        workerId = cellText?.trim() || "";
      }
      // 作業内容を抽出（2番目のセル）
      if (j === 1) {
        workContent = cellText?.trim() || "";
      }
      // 実績数を抽出（3番目のセル）
      if (j === 2) {
        quantity = cellText?.trim() || "";
      }
      // タイムスタンプを抽出（4番目のセル）
      if (j === 3) {
        timestamp = cellText?.trim() || "";
      }
      // 連携ステータスを抽出（5番目のセル）
      if (j === 4) {
        status = cellText?.trim() || "";
      }
    }

    allLogData.push({ timestamp, workerId, workContent, quantity, status });

    // 期待される項目が含まれていることを確認
    const rowTextContent = cellTexts.join(" ");
    expect(rowTextContent.length).toBeGreaterThan(0);

    // 作業者ID、作業内容、実績数、タイムスタンプ、連携ステータスが存在することを確認
    expect(workerId).toBeTruthy();
    expect(workContent).toBeTruthy();
    expect(quantity).toBeTruthy();
    expect(timestamp).toBeTruthy();
    expect(status).toBeTruthy();
  }

  // テーブル全体のテキストから期待されるコンテンツの存在を確認
  const tableText = await logTable.textContent();
  expect(tableText).toBeTruthy();

  // タイムスタンプが降順（最新が上）になっているか確認
  // 単一件の場合も最初のログが最新のものであることを確認
  if (rowCount >= 1) {
    // 全行が正しくデータを含んでいることを確認
    for (let i = 0; i < rowCount; i++) {
      const logData = allLogData[i];
      expect(logData.workerId).toBeTruthy();
      expect(logData.workContent).toBeTruthy();
      expect(logData.quantity).toBeTruthy();
      expect(logData.timestamp).toBeTruthy();
      expect(logData.status).toBeTruthy();
    }

    // 複数件の場合、タイムスタンプが降順（最新が上）になっているか確認
    if (rowCount > 1) {
      for (let i = 0; i < rowCount - 1; i++) {
        const currentTimestamp = allLogData[i].timestamp;
        const nextTimestamp = allLogData[i + 1].timestamp;

        // タイムスタンプを日時オブジェクトに変換して比較
        const currentDate = new Date(currentTimestamp);
        const nextDate = new Date(nextTimestamp);

        // タイムスタンプが有効な形式であることを確認
        expect(currentDate.getTime()).not.toEqual(NaN);
        expect(nextDate.getTime()).not.toEqual(NaN);

        // 最新のタイムスタンプが上に位置する（現在行の方が新しい）ことを確認
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(
          nextDate.getTime()
        );
      }
    }

    // 最新のタイムスタンプのログが画面最上部に位置することを確認
    // （最初の行が取得できていることで確認）
    expect(allLogData[0].timestamp).toBeTruthy();
  }
});