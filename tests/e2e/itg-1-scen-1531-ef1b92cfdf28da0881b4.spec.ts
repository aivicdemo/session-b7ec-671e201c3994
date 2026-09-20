import { test, expect } from '@playwright/test';

test('SCEN-1531: 取得した受領履歴レコード内の作業指示IDが現在のマスタデータに存在しない場合、当該レコードは画面から除外されるか警告表示される', async ({ page }) => {
  // 作業指示・実績管理画面を開く
  await page.goto('./panels/scr-1789461813941.html');

  // 画面の初期読み込み時に、作業指示受領履歴表示エリアが自動的にデータを取得・表示する処理が実行されるのを確認
  const receiptHistoryTable = page.locator('#receipt-history-tbody');
  await receiptHistoryTable.waitFor({ state: 'visible' });

  // マスタデータから現在の作業指示IDの一覧を取得
  const workInstructionTable = page.locator('#work-instruction-tbody');
  const workInstructionRows = workInstructionTable.locator('tr');
  const validInstructionIds = new Set<string>();

  const workInstructionCount = await workInstructionRows.count();
  for (let i = 0; i < workInstructionCount; i++) {
    const row = workInstructionRows.nth(i);
    // 最初のセル（指示ID）のテキストを取得
    const instructionIdCell = row.locator('td').first();
    const instructionId = await instructionIdCell.textContent();
    if (instructionId) {
      validInstructionIds.add(instructionId.trim());
    }
  }

  // 受領履歴テーブルの行を取得
  const receiptRows = receiptHistoryTable.locator('tr');
  const receiptRowCount = await receiptRows.count();

  // 受領履歴の各行を検証
  let hasInvalidRecordsExcluded = false;
  let hasInvalidRecordsWithWarning = false;
  let invalidRecordFoundButNotHandled = false;

  for (let i = 0; i < receiptRowCount; i++) {
    const row = receiptRows.nth(i);
    
    // 受領履歴行から作業指示IDを取得（最初のセル）
    const instructionIdCell = row.locator('td').first();
    const instructionId = await instructionIdCell.textContent();
    const trimmedId = instructionId ? instructionId.trim() : '';

    // マスタデータに存在しない作業指示IDの場合
    if (trimmedId && !validInstructionIds.has(trimmedId)) {
      // (B) 警告アイコンと警告テキストの存在を確認
      const warningIcon = row.locator('text=⚠️');
      const warningText = row.locator('text=/作業指示IDがマスタに見つかりません/');

      const hasWarningIcon = await warningIcon.count() > 0;
      const hasWarningText = await warningText.count() > 0;

      // (B) の条件：警告が表示されている場合
      if (hasWarningIcon || hasWarningText) {
        hasInvalidRecordsWithWarning = true;
        await expect(row).toBeVisible();
        if (hasWarningText) {
          await expect(warningText).toBeVisible();
        }
      } else {
        // この無効レコードは警告も表示されていない
        invalidRecordFoundButNotHandled = true;
      }
    }
  }

  // (A) マスタデータに存在しない作業指示IDを持つレコードが完全に除外されているか確認
  // 表示されている受領履歴レコードのうち、無効なIDを持つものが一つもなければ (A) が成立
  let allDisplayedRecordsHaveValidIds = true;
  for (let i = 0; i < receiptRowCount; i++) {
    const row = receiptRows.nth(i);
    const instructionIdCell = row.locator('td').first();
    const instructionId = await instructionIdCell.textContent();
    const trimmedId = instructionId ? instructionId.trim() : '';

    if (trimmedId && !validInstructionIds.has(trimmedId)) {
      allDisplayedRecordsHaveValidIds = false;
      break;
    }
  }

  if (allDisplayedRecordsHaveValidIds) {
    hasInvalidRecordsExcluded = true;
  }

  // 期待結果の検証：
  // (A) または (B) のいずれか1つが成立すること
  const conditionAMet = hasInvalidRecordsExcluded;
  const conditionBMet = hasInvalidRecordsWithWarning;

  expect(conditionAMet || conditionBMet).toBe(true);

  // その他の正常なレコード（存在するIDを持つもの）は通常通り表示されることを確認
  for (let i = 0; i < receiptRowCount; i++) {
    const row = receiptRows.nth(i);
    const instructionIdCell = row.locator('td').first();
    const instructionId = await instructionIdCell.textContent();
    const trimmedId = instructionId ? instructionId.trim() : '';

    if (trimmedId && validInstructionIds.has(trimmedId)) {
      await expect(row).toBeVisible();
    }
  }
});