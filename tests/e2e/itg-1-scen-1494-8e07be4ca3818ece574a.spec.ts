import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('SCEN-1494: 作業実績に対応する生産性データが取得され、CSV出力に含める生産性指標が準備される', async ({ page, context }) => {
  // ダッシュボード画面へ遷移
  await page.goto('/');
  await page.waitForURL('**/panels/scr-1789461783315.html');
  
  // ダッシュボード画面が表示されることを確認
  await expect(page).toHaveURL('**/panels/scr-1789461783315.html');
  
  // ナビゲーションから作業指示・実績管理画面へ遷移
  await page.click('a[href*="scr-1789461813941"]');
  await page.waitForURL('**/panels/scr-1789461813941.html');
  
  // CSVエクスポートボタンが表示されることを確認
  const exportButton = page.locator('button:has-text("CSVエクスポート")');
  await expect(exportButton).toBeVisible();
  
  // ダウンロードリスナーを設定
  const downloadPromise = context.waitForEvent('download');
  
  // CSVエクスポートボタンをクリック
  await exportButton.click();
  
  // ダウンロード完了を待機
  const download = await downloadPromise;
  
  // ダウンロードファイル名の確認
  const fileName = download.suggestedFilename();
  expect(fileName).toMatch(/\.csv$/i);
  
  // ファイルを一時ディレクトリに保存
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, fileName);
  await download.saveAs(filePath);
  
  // ファイルが存在することを確認
  expect(fs.existsSync(filePath)).toBe(true);
  
  // CSVファイルの内容を読み込み
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  
  // ファイルが空でないことを確認
  expect(csvContent.length).toBeGreaterThan(0);
  
  // CSVの各行をパース
  const lines = csvContent.trim().split('\n');
  expect(lines.length).toBeGreaterThan(0);
  
  // ヘッダー行を取得
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  
  // 必須カラムが含まれていることを確認
  const requiredColumns = [
    '作業者ID',
    '作業内容',
    '実績数',
    'タイムスタンプ',
    '時間当たり処理数',
    '品質スコア',
    '習熟度'
  ];
  
  for (const column of requiredColumns) {
    expect(headers).toContain(column);
  }
  
  // データ行が存在し、各カラムに値が埋込まれていることを確認
  if (lines.length > 1) {
    for (let i = 1; i < lines.length; i++) {
      const dataLine = lines[i];
      const values = dataLine.split(',').map(v => v.trim());
      
      // カラム数がヘッダーと一致することを確認
      expect(values.length).toBe(headers.length);
      
      // 必須カラムのインデックスを取得
      const workerIdIndex = headers.indexOf('作業者ID');
      const contentIndex = headers.indexOf('作業内容');
      const quantityIndex = headers.indexOf('実績数');
      const timestampIndex = headers.indexOf('タイムスタンプ');
      const rateIndex = headers.indexOf('時間当たり処理数');
      const qualityIndex = headers.indexOf('品質スコア');
      const proficiencyIndex = headers.indexOf('習熟度');
      
      // 各必須カラムに値が存在することを確認
      expect(values[workerIdIndex]).toBeTruthy();
      expect(values[contentIndex]).toBeTruthy();
      expect(values[quantityIndex]).toBeTruthy();
      expect(values[timestampIndex]).toBeTruthy();
      expect(values[rateIndex]).toBeTruthy();
      expect(values[qualityIndex]).toBeTruthy();
      expect(values[proficiencyIndex]).toBeTruthy();
    }
  }
  
  // UTF-8エンコーディングであることを確認
  const buffer = fs.readFileSync(filePath);
  const isBOM = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const isUTF8 = isBOM || !buffer.includes(0x00);
  expect(isUTF8).toBe(true);
  
  // ファイル形式がCSVであることを確認
  expect(fileName).toMatch(/\.csv$/i);
  
  // クリーンアップ
  fs.unlinkSync(filePath);
});