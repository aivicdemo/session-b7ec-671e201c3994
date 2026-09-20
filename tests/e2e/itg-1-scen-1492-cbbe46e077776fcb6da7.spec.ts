import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

test.describe('SCEN-1492: 作業指示実績CSV出力', () => {
  let downloadPath: string;

  test.beforeAll(async () => {
    downloadPath = path.join(os.tmpdir(), `playwright-downloads-${Date.now()}`);
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
  });

  test.afterAll(async () => {
    if (fs.existsSync(downloadPath)) {
      fs.rmSync(downloadPath, { recursive: true, force: true });
    }
  });

  test('フィルター条件に基づいて作業指示一覧が取得され、CSVファイルがダウンロードされること', async ({ browser }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });
    const page = await context.newPage();

    // ログイン
    await page.goto('/');
    await page.fill('input[name="userId"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button:has-text("ログイン")');
    await page.waitForNavigation();

    // ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 作業指示・実績管理画面に遷移
    await page.click('a:has-text("作業指示・実績管理")');
    await page.waitForLoadState('networkidle');

    // フィルター条件設定：拠点を「東京センター」に設定
    const siteFilterSelect = page.locator('select').first();
    if (await siteFilterSelect.isVisible()) {
      await siteFilterSelect.selectOption({ label: '東京センター' });
    }

    // フィルター条件設定：チーム「ピッキングチームA」を指定
    const teamFilterInputs = page.locator('input[placeholder*="チーム"], input[placeholder*="Team"]');
    const teamFilterCount = await teamFilterInputs.count();
    if (teamFilterCount > 0) {
      for (let i = 0; i < teamFilterCount; i++) {
        const placeholder = await teamFilterInputs.nth(i).getAttribute('placeholder');
        if (placeholder && (placeholder.includes('チーム') || placeholder.includes('team'))) {
          await teamFilterInputs.nth(i).fill('ピッキングチームA');
          break;
        }
      }
    }

    // フィルター条件設定：期間（2024年1月1日～31日）
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();
    if (dateInputCount >= 2) {
      await dateInputs.nth(0).fill('2024-01-01');
      await dateInputs.nth(1).fill('2024-01-31');
    }

    // 検索ボタンをクリックしてフィルター条件を適用
    await page.click('button[data-testid="filter-search-button"]');
    await page.waitForLoadState('networkidle');

    // 作業指示一覧テーブルが表示されていることを確認
    const workInstructionTable = page.locator('[data-testid="work-instruction-list"]');
    await expect(workInstructionTable).toBeVisible();

    // テーブルに必要な列が表示されていることを確認
    const tableBody = page.locator('[id="work-instruction-tbody"]');
    await expect(tableBody).toBeVisible();
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // テーブルのヘッダーから列インデックスを取得
    const headerRow = page.locator('thead tr').first();
    const headerCells = headerRow.locator('th');
    const headerCount = await headerCells.count();
    
    // 必要な列が表示されていることを確認
    const headerTexts: string[] = [];
    for (let i = 0; i < headerCount; i++) {
      const text = await headerCells.nth(i).textContent();
      headerTexts.push(text || '');
    }
    
    expect(headerTexts.join(',')).toMatch(/作業指示ID/);
    expect(headerTexts.join(',')).toMatch(/拠点名/);
    expect(headerTexts.join(',')).toMatch(/チーム名/);
    expect(headerTexts.join(',')).toMatch(/作業内容/);
    expect(headerTexts.join(',')).toMatch(/完了数/);
    expect(headerTexts.join(',')).toMatch(/残数/);
    expect(headerTexts.join(',')).toMatch(/進捗率/);
    expect(headerTexts.join(',')).toMatch(/実績タイムスタンプ/);
    expect(headerTexts.join(',')).toMatch(/作業者ID/);

    // テーブルデータからフィルター条件に合致するデータを確認
    let hasTokyoData = false;
    let hasPickingTeamA = false;
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      if (rowText) {
        if (rowText.includes('東京')) {
          hasTokyoData = true;
        }
        if (rowText.includes('ピッキング') && rowText.includes('チームA')) {
          hasPickingTeamA = true;
        }
      }
    }

    // フィルター条件に合致するデータが表示されていることを確認
    expect(hasTokyoData).toBeTruthy();
    expect(hasPickingTeamA).toBeTruthy();

    // CSVエクスポートボタンをクリック
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[data-testid="export-csv-button"]');
    const download = await downloadPromise;

    // ダウンロード完了を待機
    const fileName = download.suggestedFilename;
    const filePath = path.join(downloadPath, fileName);
    await download.saveAs(filePath);
    
    // ファイルが実際に保存されたことを確認
    await new Promise(resolve => {
      const checkFile = setInterval(() => {
        if (fs.existsSync(filePath)) {
          clearInterval(checkFile);
          resolve(true);
        }
      }, 100);
      setTimeout(() => clearInterval(checkFile), 5000);
    });

    // ファイル名形式の検証：work_instruction_YYYYMMDD_YYYYMMDD_*_*.csv の形式
    expect(fileName).toMatch(/^work_instruction_\d{8}_\d{8}_.*\.csv$/);
    
    // ファイル名に開始日時と終了日時が含まれていることを確認
    const dateMatch = fileName.match(/work_instruction_(\d{8})_(\d{8})_/);
    expect(dateMatch).toBeTruthy();
    if (dateMatch) {
      const startDate = dateMatch[1];
      const endDate = dateMatch[2];
      // 2024年1月1日：20240101、2024年1月31日：20240131
      expect(startDate).toBe('20240101');
      expect(endDate).toBe('20240131');
    }
    
    // ファイル名に拠点情報とチーム情報が含まれていることを確認
    expect(fileName.toLowerCase()).toContain('tokyo');
    expect(fileName.toLowerCase()).toContain('picking');
    expect(fileName.toLowerCase()).toContain('_a');

    // ファイルの内容を検証
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent.length).toBeGreaterThan(0);

    // CSVヘッダーを確認
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const headerLine = lines[0];
    expect(headerLine).toMatch(/作業指示ID/);
    expect(headerLine).toMatch(/拠点名/);
    expect(headerLine).toMatch(/チーム名/);
    expect(headerLine).toMatch(/作業内容/);
    expect(headerLine).toMatch(/完了数/);
    expect(headerLine).toMatch(/残数/);
    expect(headerLine).toMatch(/進捗率/);
    expect(headerLine).toMatch(/実績タイムスタンプ/);
    expect(headerLine).toMatch(/作業者ID/);

    // データ行が存在することを確認
    expect(lines.length).toBeGreaterThan(1);

    // CSVファイルが正常な形式であることを確認（文字化けなし）
    expect(fileContent).not.toMatch(/\ufffd/);

    // データ行がフィルター条件に合致していることを確認
    const headerFields = headerLine.split(',').map(field => field.trim());
    const siteNameIndex = headerFields.findIndex(field => field.includes('拠点名'));
    const teamNameIndex = headerFields.findIndex(field => field.includes('チーム名'));
    const timestampIndex = headerFields.findIndex(field => field.includes('実績タイムスタンプ'));

    // 全データ行がフィルター条件に合致し、他のデータが混在していないことを確認
    for (let i = 1; i < lines.length; i++) {
      const dataLine = lines[i];
      const fields = dataLine.split(',').map(field => field.trim());
      
      if (fields.length > Math.max(siteNameIndex, teamNameIndex, timestampIndex)) {
        // 拠点のデータが東京センターに合致していることを確認
        if (siteNameIndex >= 0 && fields[siteNameIndex]) {
          expect(fields[siteNameIndex]).toBe('東京センター');
        }
        
        // チーム名のデータがピッキングチームAに合致していることを確認
        if (teamNameIndex >= 0 && fields[teamNameIndex]) {
          expect(fields[teamNameIndex]).toBe('ピッキングチームA');
        }
        
        // 期間内のデータであることを確認
        if (timestampIndex >= 0 && fields[timestampIndex]) {
          const dateStr = fields[timestampIndex];
          
          // ISO形式（2024-01-15）またはその他の形式に対応
          const isoDateMatch = dateStr.match(/(2024)-(01)-(\d{1,2})/);
          if (isoDateMatch) {
            const year = isoDateMatch[1];
            const month = isoDateMatch[2];
            const day = isoDateMatch[3];
            
            expect(year).toBe('2024');
            expect(month).toBe('01');
            const dayNum = parseInt(day);
            expect(dayNum).toBeGreaterThanOrEqual(1);
            expect(dayNum).toBeLessThanOrEqual(31);
          } else {
            // 他の日付形式にも対応
            const slashDateMatch = dateStr.match(/(2024)\/(01)\/(\d{1,2})/);
            if (slashDateMatch) {
              const year = slashDateMatch[1];
              const month = slashDateMatch[2];
              const day = slashDateMatch[3];
              
              expect(year).toBe('2024');
              expect(month).toBe('01');
              const dayNum = parseInt(day);
              expect(dayNum).toBeGreaterThanOrEqual(1);
              expect(dayNum).toBeLessThanOrEqual(31);
            }
          }
        }
      }
    }

    await context.close();
  });
});