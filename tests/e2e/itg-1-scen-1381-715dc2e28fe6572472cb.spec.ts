import { test, expect } from '@playwright/test';

test.describe('人員配置案承認', () => {
  test('取得した人員配置案が承認基準を満たさない場合、基準判定で不承認と判定される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    
    // ログイン処理
    await page.fill('input[placeholder*=""]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("ログイン")');
    
    // ログイン後の自動遷移を待機
    await page.waitForURL('**/scr-1789461783315.html');
    
    // 人員配置最適化提案・実行画面にナビゲート
    await page.click('a:has-text("人員配置最適化提案")');
    await page.waitForURL('**/scr-1789461798629.html');
    
    // ページが完全にロードされるのを待機
    await page.waitForLoadState('networkidle');
    
    // 人員配置案を自動生成
    await page.click('button:has-text("人員配置案を自動生成")');
    
    // 生成処理の完了を待機
    await page.waitForTimeout(2000);
    
    // 基準判定結果セクションが表示されるまで待機
    await page.waitForSelector('[id="logic-status"]', { timeout: 10000 });
    
    // 基準判定結果を確認
    const logicStatusElement = await page.locator('[id="logic-status"]');
    const logicStatusText = await logicStatusElement.textContent();
    
    // 不承認と表示されていることを確認
    expect(logicStatusText).toContain('不承認');
    
    // 不承認理由が具体的に表示されていることを確認
    const proposalReasonElement = await page.locator('[id="proposal-reason"]');
    const proposalReasonText = await proposalReasonElement.textContent();
    
    // 不承認理由が空でなく、具体的な内容を含んでいることを確認
    expect(proposalReasonText).toBeTruthy();
    // 数値や具体的な形式を含む不承認理由の検証
    expect(proposalReasonText).toMatch(/(?:必要人員数\([^)]*\)が利用可能人員数\([^)]*\)を超過|配置対象者の平均習熟度スコア\([^)]*\)が基準値\([^)]*\)以下)/);
    
    // 承認ボタンが無効化されていることを確認
    const approveButton = await page.locator('[data-testid="approve-button"]');
    const isDisabled = await approveButton.isDisabled();
    
    expect(isDisabled).toBe(true);
  });
});