import { test, expect, Page } from '@playwright/test';

test.describe('WMS連携ログが取得され、連携状況が画面に表示される', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('SCEN-1475: 作業指示・実績管理画面でWMS連携ログが表示される', async () => {
    // ステップ1: テスト対象システムにログインし、作業指示・実績管理画面を開く
    await page.goto('/');
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    // ログイン認証情報を入力
    const emailInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("ログイン")');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    // ログイン後、ダッシュボード画面が表示されるまで待機
    await page.waitForURL('**/scr-1789461783315.html', { timeout: 10000 });
    
    // 作業指示・実績管理画面へナビゲート
    const workManagementNav = page.locator('text=作業指示・実績管理');
    await workManagementNav.click();
    
    // 作業指示・実績管理画面が表示されるまで待機
    await page.waitForURL('**/scr-1789461813941.html', { timeout: 10000 });

    // ステップ2: 画面のリフレッシュボタンを押下するか、ページをリロード
    await page.reload({ waitUntil: 'networkidle' });

    // ステップ3: 「WMS連携ログ」セクションを確認し、ログ一覧が表示される状態までの読み込みを待つ
    const wmsTab = page.locator('[data-testid="tab-wms"]');
    await wmsTab.click();
    
    // WMS連携ログテーブルの読み込み完了を待機
    await page.waitForSelector('#wms-log-tbody', { timeout: 10000 });
    
    const wmsLogTable = page.locator('#wms-log-tbody');
    await expect(wmsLogTable).toBeVisible();

    // ステップ4: WMS連携ログエントリから、必要な項目が各行に含まれていることを確認
    const logRows = page.locator('#wms-log-tbody tr');
    const rowCount = await logRows.count();
    
    expect(rowCount).toBeGreaterThan(0);

    // 最新のエントリを確認（日時降順で最初の行）
    const firstRow = logRows.first();
    await expect(firstRow).toBeVisible();
    
    // 各列の内容を検証
    const cells = firstRow.locator('td');
    
    // 連携タイプが含まれている（例：進捗データ取得、作業実績取得など）
    const integrationTypeCell = cells.nth(0);
    const integrationTypeText = await integrationTypeCell.textContent();
    expect(integrationTypeText).toBeTruthy();
    expect(integrationTypeText).toMatch(/進捗データ取得|作業実績取得|その他/);
    
    // 実行時刻がYYYY-MM-DD HH:mm:ss形式で表示されている
    const timestampCell = cells.nth(1);
    const timestampText = await timestampCell.textContent();
    expect(timestampText).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    
    // ステータスが「成功」で表示されている
    const statusCell = cells.nth(2);
    const statusText = await statusCell.textContent();
    expect(statusText?.trim()).toBe('成功');
    
    // 取得件数が「○件」の形式で表示されている
    const recordCountCell = cells.nth(3);
    const recordCountText = await recordCountCell.textContent();
    expect(recordCountText).toMatch(/^\d+件$/);
    
    // 期待結果: 最新のWMS連携ログエントリが日時降順で一覧表示され、
    // 各エントリに必要な情報が正確に表示されていることを確認
    expect(rowCount).toBeGreaterThan(0);
    expect(integrationTypeText).toBeTruthy();
    expect(timestampText).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(statusText?.trim()).toBe('成功');
    expect(recordCountText).toMatch(/^\d+件$/);
  });
});