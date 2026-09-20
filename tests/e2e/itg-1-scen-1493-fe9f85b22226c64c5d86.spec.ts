import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('SCEN-1493: 取得した作業指示に紐づく作業実績データが条件に基づいて取得される', async ({ page, context }) => {
  // ステップ1: 進捗・人員配置ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  await page.waitForLoadState('networkidle');

  // ステップ2: 作業指示・実績管理画面に遷移する
  const workInstructionNav = page.locator('a').filter({ hasText: '作業指示・実績管理' }).first();
  await workInstructionNav.click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/.*scr-1789461813941/);

  // ステップ3: 対象の作業指示ID「WI-20250115-001」を選択する
  const workInstructionRow = page.locator('[data-testid="work-instruction-list"]').locator('tr').filter({ has: page.locator('text=WI-20250115-001') }).first();
  await workInstructionRow.click();
  await page.waitForLoadState('networkidle');
  
  // 選択された作業指示が画面に表示されたことを確認
  await expect(page.locator('text=WI-20250115-001')).toBeVisible();

  // ステップ4: 「作業指示実績CSV出力」ボタンをクリックする
  const downloadPromise = context.waitForEvent('download');
  await page.locator('button').filter({ hasText: '作業指示実績CSV出力' }).click();
  
  // ステップ5: ファイルダウンロードダイアログが表示されることを確認する
  const download = await downloadPromise;
  expect(download).toBeTruthy();

  // ステップ6: ダウンロードされたCSVファイルをローカルマシンで取得する
  const fileName = download.suggestedFilename;
  const filePath = path.join('/tmp', fileName);
  await download.saveAs(filePath);

  // ファイルが存在することを確認
  expect(fs.existsSync(filePath)).toBeTruthy();

  // ステップ7: CSVファイルを開き、内容を確認する
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // ヘッダ行の確認
  const headers = lines[0].split(',').map(h => h.trim());
  expect(headers).toContain('作業指示ID');
  expect(headers).toContain('作業者ID');
  expect(headers).toContain('作業内容');
  expect(headers).toContain('実績数');
  expect(headers).toContain('タイムスタンプ');

  // データ行の確認
  const dataLines = lines.slice(1);
  
  // 作業指示ID「WI-20250115-001」に紐づく作業実績が含まれているか確認
  const workInstructionIdIndex = headers.indexOf('作業指示ID');
  const workerIdIndex = headers.indexOf('作業者ID');
  const performanceIndex = headers.indexOf('実績数');
  const timestampIndex = headers.indexOf('タイムスタンプ');

  const wiData = dataLines.filter(line => {
    const cols = line.split(',').map(c => c.trim());
    return cols[workInstructionIdIndex] === 'WI-20250115-001';
  });

  // 正確に3行の作業者の実績が含まれていることを確認
  expect(wiData).toHaveLength(3);

  // 作業者A/実績50、作業者B/実績45、作業者C/実績30の確認
  const performanceMap: { [key: string]: string } = {};
  wiData.forEach(line => {
    const cols = line.split(',').map(c => c.trim());
    performanceMap[cols[workerIdIndex]] = cols[performanceIndex];
  });

  expect(performanceMap['作業者A']).toBe('50');
  expect(performanceMap['作業者B']).toBe('45');
  expect(performanceMap['作業者C']).toBe('30');

  // タイムスタンプがISO 8601形式であることを確認
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/;
  wiData.forEach(line => {
    const cols = line.split(',').map(c => c.trim());
    const timestamp = cols[timestampIndex];
    expect(timestamp).toMatch(iso8601Regex);
  });

  // ファイル名に出力日時が含まれていることを確認
  const fileNamePattern = /work_result_\d{8}_\d{6}\.csv/;
  expect(fileName).toMatch(fileNamePattern);

  // クリーンアップ
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});