import { test, expect } from '@playwright/test';

test.describe('人員配置最適化提案画面遷移', () => {
  test('SCEN-1226: 検討対象拠点が指定されていない場合、エラーメッセージが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案画面へのナビゲーション要素を特定
    const optimizeButton = page.getByRole('button', { name: '人員配置を最適化' });
    await expect(optimizeButton).toBeVisible();

    // 検討対象拠点を選択せずに、人員配置最適化提案画面への遷移を試みる
    // 「人員配置を最適化」ボタンをクリック
    await optimizeButton.click();

    // 画面遷移の実行を待機
    await page.waitForTimeout(1000);

    // 期待結果1: 進捗・人員配置ダッシュボード画面のままとなることを確認
    await expect(page).toHaveURL(/scr-1789461783315/);

    // 期待結果2: エラーメッセージが表示されていることを確認
    const errorMessages = [
      '検討対象拠点を指定してください',
      '拠点が選択されていません',
      '拠点を選択してください'
    ];

    let errorFound = false;
    let errorElement: any;
    
    for (const message of errorMessages) {
      const element = page.locator(`text="${message}"`);
      const count = await element.count();
      if (count > 0) {
        errorFound = true;
        errorElement = element.first();
        break;
      }
    }

    // エラーメッセージが表示されていることを確認
    expect(errorFound).toBeTruthy();
    await expect(errorElement).toBeVisible();

    // 期待結果3: エラーメッセージが赤色またはエラーアイコン付きで視認可能であることを確認
    const hasRedColor = await errorElement.evaluate((el: HTMLElement) => {
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      const borderColor = computedStyle.borderColor;
      
      // text color、background color、border colorで赤系を検出
      const isRedText = color.includes('rgb(220, 38, 38)') || 
                        color.includes('rgb(239, 68, 68)') ||
                        color.includes('rgb(252, 165, 165)') ||
                        color.toLowerCase().includes('red');
      
      const isRedBackground = backgroundColor.includes('rgb(254, 226, 226)') ||
                             backgroundColor.includes('rgb(252, 165, 165)') ||
                             backgroundColor.toLowerCase().includes('red');
      
      const isRedBorder = borderColor.includes('rgb(220, 38, 38)') ||
                         borderColor.includes('rgb(239, 68, 68)') ||
                         borderColor.toLowerCase().includes('red');
      
      return isRedText || isRedBackground || isRedBorder;
    });

    // エラーアイコンの有無を確認
    const hasErrorIcon = await errorElement.evaluate((el: HTMLElement) => {
      // 要素自体または直近の親要素にエラー関連のクラスがあるか確認
      const checkElement = (e: HTMLElement): boolean => {
        const className = e.className.toString().toLowerCase();
        if (className.includes('error') || className.includes('alert') || className.includes('danger')) {
          return true;
        }
        // SVG/iconのような要素がないか確認
        if (e.querySelector('svg') || e.querySelector('[class*="icon"]')) {
          return true;
        }
        return false;
      };
      
      // 要素自体、親要素、子要素をチェック
      if (checkElement(el)) return true;
      if (el.parentElement && checkElement(el.parentElement)) return true;
      if (el.parentElement?.parentElement && checkElement(el.parentElement.parentElement)) return true;
      
      return false;
    });

    // 赤色またはエラーアイコンのいずれかが必ず存在することを確認
    const hasVisibleErrorIndicator = hasRedColor || hasErrorIcon;
    expect(hasVisibleErrorIndicator).toBeTruthy();
  });
});