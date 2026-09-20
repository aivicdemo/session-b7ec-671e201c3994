import { test, expect } from '@playwright/test';

test('SCEN-957: ログインユーザーの拠点・チームに属する作業者が作業者選択ドロップダウンに一覧表示される', async ({ page, context }) => {
  // テスト用ユーザー（拠点A・チームX所属）でシステムにログインする
  await page.goto('/');
  
  // ログイン画面が表示されるのを待つ
  await page.waitForSelector('.login-card', { timeout: 5000 });
  
  // ログイン情報を入力
  await page.fill('input[type="text"]', 'testuser_a_x');
  await page.fill('input[type="password"]', 'testpassword');
  
  // ログインボタンをクリック
  await page.click('button[type="submit"]');
  
  // ログイン後のリダイレクトを待つ
  await page.waitForNavigation({ timeout: 10000 });

  // 生産性ダッシュボード・分析画面から作業実績データ記録・入力画面へ遷移する
  // ナビゲーションから「作業実績データ記録・入力画面」へのリンクをクリック
  await page.click('a:has-text("作業実績データ記録・入力")');
  
  // 作業実績データ記録・入力画面が表示されたことを確認する
  await page.waitForURL(/scr-1789461993203/, { timeout: 5000 });
  const pageTitle = await page.locator('h1, .page-title').first().textContent();
  expect(pageTitle).toContain('作業実績');

  // APIからログインユーザーの情報を取得
  const apiUrl = (await page.evaluate(() => (window as any).AIVIC_API_URL)) as string;
  const appId = (await page.evaluate(() => (window as any).AIVIC_APP_ID)) as string;
  
  // ログインユーザーの拠点・チーム情報を取得（API呼び出し）
  const userResponse = await context.request.get(`${apiUrl}/api/users?app=${appId}&filter=login_user`);
  const userData = await userResponse.json();
  const loginUserBaseId = userData?.[0]?.base_id;
  const loginUserTeamId = userData?.[0]?.team_id;
  
  // 拠点A・チームXに属する作業者リストをAPIから取得
  const workersResponse = await context.request.get(
    `${apiUrl}/api/workers?app=${appId}&base_id=${loginUserBaseId}&team_id=${loginUserTeamId}`
  );
  const workersData = await workersResponse.json();
  const expectedWorkerNames = workersData.map((w: any) => w.name);

  // 画面上の作業者選択ドロップダウンをクリックして展開する
  const dropdown = page.locator('select, [role="combobox"], button:has-text("作業者を選択")').first();
  await dropdown.click();
  
  // ドロップダウンメニューが展開されたことを確認
  await page.waitForSelector('[role="option"], .dropdown-menu li, select option', { timeout: 5000 });
  
  // ドロップダウン内のオプションを取得
  const options = await page.locator('[role="option"], .dropdown-menu li, select option').allTextContents();
  const displayedWorkerNames = options.map(opt => opt.trim()).filter(opt => opt.length > 0);
  
  // 期待結果の確認:
  // - ログインユーザーと同じ拠点・チーム（拠点A・チームX）に属する作業者のみがリスト表示される
  expect(displayedWorkerNames.length).toBe(expectedWorkerNames.length);
  
  // 表示されたオプションがAPIから取得した拠点A・チームXの作業者と一致することを確認
  for (const workerName of expectedWorkerNames) {
    expect(displayedWorkerNames).toContain(workerName);
  }
  
  // 表示されたオプション全てが期待される作業者であることを確認
  for (const displayedName of displayedWorkerNames) {
    expect(expectedWorkerNames).toContain(displayedName);
  }
});