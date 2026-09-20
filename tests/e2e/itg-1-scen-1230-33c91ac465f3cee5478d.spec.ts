import { test, expect } from '@playwright/test';

test('SCEN-1230: 複数拠点を指定した場合、各拠点の進捗率が比較され進捗遅延拠点の配置案が優先される', async ({ page }) => {
  // ログイン画面へアクセス
  await page.goto('/');
  
  // ログイン画面が表示されることを確認
  const loginTitle = page.locator('text=作業管理システム').first();
  await expect(loginTitle).toBeVisible();
  
  // ログイン情報を入力（テスト用認証情報を使用）
  const userIdInput = page.locator('input[placeholder*="ID"], input[placeholder*="ユーザー"]').first();
  const passwordInput = page.locator('input[type="password"]');
  
  await userIdInput.fill('testuser');
  await passwordInput.fill('testpass');
  
  // ログインボタンをクリック
  const loginButton = page.locator('button:has-text("ログイン"), button[type="submit"]').first();
  await loginButton.click();
  
  // ダッシュボード画面への自動遷移を待機
  await page.waitForURL(/.*\/panels\/scr-1789461783315\.html/);
  
  // ダッシュボード画面でログイン状態を確認
  const dashboardTitle = page.locator('text=進捗・人員配置ダッシュボード');
  await expect(dashboardTitle).toBeVisible();
  
  // 複数拠点を指定可能な状態を確認
  const siteFilter = page.locator('[data-testid="site-filter"]');
  await expect(siteFilter).toBeVisible();
  
  // 拠点フィルターを開く
  await siteFilter.click();
  
  // 各拠点オプションが表示されていることを確認
  const tokyoOption = page.locator('text=東京拠点');
  const osakaOption = page.locator('text=大阪拠点');
  const nagoyaOption = page.locator('text=名古屋拠点');
  
  await expect(tokyoOption).toBeVisible();
  await expect(osakaOption).toBeVisible();
  await expect(nagoyaOption).toBeVisible();
  
  // 拠点A、B、Cを選択（東京=A、大阪=B、名古屋=C）
  await tokyoOption.click();
  await osakaOption.click();
  await nagoyaOption.click();
  
  // フィルターを確定（フィルター外をクリックするか、確定ボタンをクリック）
  await page.locator('body').click({ position: { x: 0, y: 0 } });
  
  // 「人員配置を最適化」ボタンをクリック
  const optimizeButton = page.locator('button:has-text("人員配置を最適化")');
  await optimizeButton.click();
  
  // 人員配置最適化提案・実行画面に遷移することを確認
  await page.waitForURL(/.*\/panels\/scr-1789461798629\.html/);
  
  // 配置案コンテナが表示されていることを確認
  const proposalsContainer = page.locator('#proposals-container');
  await expect(proposalsContainer).toBeVisible();
  
  // 配置案要素を取得
  const proposalElements = proposalsContainer.locator('[class*="proposal"]');
  const proposalCount = await proposalElements.count();
  
  // 複数の配置案が存在することを確認
  expect(proposalCount).toBeGreaterThanOrEqual(3);
  
  // 最初の配置案（拠点C：進捗率55%）を検証
  const firstProposal = proposalElements.first();
  
  // 拠点Cの拠点名ラベルを確認
  const firstProposalSiteLabel = firstProposal.locator('text=名古屋');
  await expect(firstProposalSiteLabel).toBeVisible();
  
  // 拠点Cの進捗率ラベルを確認
  const firstProposalProgressLabel = firstProposal.locator('text=/55%|進捗率.*55/');
  await expect(firstProposalProgressLabel).toBeVisible();
  
  // 2番目の配置案（拠点A：進捗率65%）を検証
  const secondProposal = proposalElements.nth(1);
  
  // 拠点Aの拠点名ラベルを確認
  const secondProposalSiteLabel = secondProposal.locator('text=東京');
  await expect(secondProposalSiteLabel).toBeVisible();
  
  // 拠点Aの進捗率ラベルを確認
  const secondProposalProgressLabel = secondProposal.locator('text=/65%|進捗率.*65/');
  await expect(secondProposalProgressLabel).toBeVisible();
  
  // 3番目の配置案（拠点B：進捗率80%）を検証
  const thirdProposal = proposalElements.nth(2);
  
  // 拠点Bの拠点名ラベルを確認
  const thirdProposalSiteLabel = thirdProposal.locator('text=大阪');
  await expect(thirdProposalSiteLabel).toBeVisible();
  
  // 拠点Bの進捗率ラベルを確認
  const thirdProposalProgressLabel = thirdProposal.locator('text=/80%|進捗率.*80/');
  await expect(thirdProposalProgressLabel).toBeVisible();
  
  // 拠点Cの配置案（最初の配置案）に「優先度：高」バッジが表示されていることを確認
  const priorityBadge = firstProposal.locator('[class*="badge"], [class*="priority"], text=優先度');
  await expect(priorityBadge).toBeVisible();
  
  const priorityBadgeText = await priorityBadge.textContent();
  expect(priorityBadgeText).toContain('優先度');
  expect(priorityBadgeText).toContain('高');
});