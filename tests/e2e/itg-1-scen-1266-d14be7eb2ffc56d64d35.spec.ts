import { test, expect } from '@playwright/test';

test.describe('進捗遅延リスク分析実行', () => {
  test('時間不足が算出される場合、その時間に基づいて必要な追加作業者数が計算されて推奨調整内容に含められる', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // ダッシュボードに拠点・チーム別の現在の作業進捗データが表示されていることを確認する
    const siteVarianceTable = page.locator('#site-variance-tbody');
    await expect(siteVarianceTable).toBeVisible();
    
    const teamVarianceTable = page.locator('#team-variance-tbody');
    await expect(teamVarianceTable).toBeVisible();

    // 進捗遅延リスク分析の実行ボタンをクリック
    const optimizeButton = page.getByRole('button', { name: '人員配置を最適化' });
    await optimizeButton.click();

    // 分析処理が完了するまで待機
    await page.waitForLoadState('networkidle');

    // 推奨調整内容表示エリアを確認
    const recommendedActionsArea = page.locator('#recommended-actions');
    await expect(recommendedActionsArea).toBeVisible();

    // 推奨調整内容に不足時間と必要追加作業者数が含まれていることを確認
    const recommendedActionsText = await recommendedActionsArea.textContent();
    
    // 不足時間、必要追加作業者数、配置元を含むテキストが表示されていることを検証
    expect(recommendedActionsText).toMatch(/不足時間/);
    expect(recommendedActionsText).toMatch(/必要追加作業者数/);
    expect(recommendedActionsText).toMatch(/配置元/);
    
    // より詳細な形式で確認：不足時間と名の単位を含む
    expect(recommendedActionsText).toMatch(/\d+時間\d+分\s*\/\s*必要追加作業者数\s*[:：]\s*\d+名/);
  });
});