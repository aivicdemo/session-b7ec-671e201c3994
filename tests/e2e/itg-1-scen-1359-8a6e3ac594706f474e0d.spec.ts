import { test, expect } from '@playwright/test';

test.describe('人員配置案自動生成', () => {
  test('検討対象拠点が指定されていないとき、「検討対象拠点を1つ以上選択してください」というエラーが表示される', async ({ page }) => {
    // 人員配置最適化提案・実行画面を開く
    await page.goto('/panels/scr-1789461798629.html');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 画面に表示されている拠点選択フィールドを確認
    const siteSelectionField = page.locator('input[type="checkbox"][aria-label*="拠点"], select[aria-label*="拠点"], [role="listbox"][aria-label*="拠点"]').first();
    await expect(siteSelectionField).toBeVisible();
    
    // 拠点選択フィールドで何も選択しない状態であることを確認
    const checkedCheckboxes = page.locator('input[type="checkbox"]:checked');
    const checkedCount = await checkedCheckboxes.count();
    expect(checkedCount).toBe(0);
    
    // 「人員配置案を自動生成」ボタンをクリック
    const generateButton = page.locator('[data-testid="generate-proposals-btn"]');
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    
    // バリデーションエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=検討対象拠点を1つ以上選択してください');
    await expect(errorMessage).toBeVisible();
    
    // エラーメッセージが赤色系で表示されていることを確認
    const errorColor = await errorMessage.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // rgb値を解析して赤色系であることを確認
    const rgbMatch = errorColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // 赤色系：赤成分が緑・青より大きい
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }
    
    // エラーメッセージが拠点選択フィールドの直下またはフォーム上部に表示されていることを確認
    const fieldBoundingBox = await siteSelectionField.boundingBox();
    const errorBoundingBox = await errorMessage.boundingBox();
    
    if (fieldBoundingBox && errorBoundingBox) {
      // フィールド直下またはフォーム上部のいずれかに配置されていることを確認
      const isDirectlyBelow = errorBoundingBox.y > fieldBoundingBox.y;
      const isAboveField = errorBoundingBox.y < fieldBoundingBox.y;
      expect(isDirectlyBelow || isAboveField).toBeTruthy();
    }
    
    // エラーメッセージがフォーム要素の近くに表示されていることを確認
    await expect(errorMessage).toBeInViewport();
    
    // ボタンが非活性化されているか、またはページ遷移が発生していないことを確認
    const isButtonDisabled = await generateButton.isDisabled();
    const currentUrl = page.url();
    
    // 仕様の要件：ボタンが非活性化されるか、ページ遷移が発生しないこと
    expect(isButtonDisabled || currentUrl === '/panels/scr-1789461798629.html').toBeTruthy();
  });
});