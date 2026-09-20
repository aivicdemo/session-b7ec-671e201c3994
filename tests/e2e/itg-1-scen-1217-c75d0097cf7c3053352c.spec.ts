import { test, expect } from '@playwright/test';

test.describe('SCEN-1217: ダッシュボード表示 - 生産性ベースラインデータ不足時の警告表示', () => {
  test('作業者生産性ベースラインデータが不足している場合、警告メッセージが表示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');

    // ダッシュボードの初期読み込みが完了するまで待機する
    await page.waitForLoadState('networkidle');
    
    // 読込中の表示が消えるまで待機
    const loadingIndicators = page.locator('text="読込中..."');
    await loadingIndicators.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // タイムアウトしても続行
    });

    // ダッシュボード上の効率スコア表示エリア付近を視認する
    const contentArea = page.locator('.content-area');
    await expect(contentArea).toBeVisible();

    // 効率スコア表示エリアを特定する（KPIセクションまたはスコア表示要素）
    const kpiSection = page.locator('[data-testid="kpi-risk-count"], [data-testid="kpi-sites-action"], [data-testid="kpi-active-plans"]').first();
    
    // 警告メッセージを検索
    const warningMessage = page.locator('text="過去の生産性データが不足しています。効率スコアは参考値です"');
    
    // 警告メッセージが表示されていることを確認
    await expect(warningMessage).toBeVisible();

    // 警告メッセージが効率スコア表示エリアの近傍に配置されていることを確認
    const warningBoundingBox = await warningMessage.boundingBox();
    
    // KPI要素またはスコア表示エリアの座標を取得
    const scoreBoundingBox = await kpiSection.boundingBox();
    
    // 警告とスコア表示エリアが視認できる状態にあることを確認
    expect(warningBoundingBox).toBeTruthy();
    expect(scoreBoundingBox).toBeTruthy();
    
    if (warningBoundingBox && scoreBoundingBox) {
      // 警告がビューポート内にあり、スコアエリアの近傍にあることを確認
      // 近傍 = 垂直方向または水平方向の距離が一定範囲内
      const proximityThreshold = 300; // ピクセル
      
      const verticalDistance = Math.abs(
        (warningBoundingBox.y + warningBoundingBox.height / 2) - 
        (scoreBoundingBox.y + scoreBoundingBox.height / 2)
      );
      
      const horizontalDistance = Math.abs(
        (warningBoundingBox.x + warningBoundingBox.width / 2) - 
        (scoreBoundingBox.x + scoreBoundingBox.width / 2)
      );
      
      // 警告がスコア表示エリアの近くにあることを確認
      const isNearby = verticalDistance <= proximityThreshold || horizontalDistance <= proximityThreshold;
      expect(isNearby).toBeTruthy();
    }

    // 警告バナー/アラートコンテナを取得
    const warningContainer = warningMessage.locator('xpath=ancestor::*[contains(@class, "alert") or contains(@class, "banner") or contains(@class, "warning")]').first();
    
    // 警告要素の視覚的な外観を確認（黄色または橙色であることを確認）
    let computedStyle;
    try {
      computedStyle = await warningContainer.evaluate((element) => {
        const styles = window.getComputedStyle(element);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          color: styles.color,
        };
      });
    } catch {
      // コンテナが見つからない場合はメッセージ要素の親を使用
      computedStyle = await warningMessage.evaluate((element) => {
        let currentElement = element;
        while (currentElement) {
          const styles = window.getComputedStyle(currentElement);
          const bgColor = styles.backgroundColor;
          const borderColor = styles.borderColor;
          
          if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            return { backgroundColor: bgColor, borderColor, color: styles.color };
          }
          currentElement = currentElement.parentElement;
          if (!currentElement || currentElement === document.body) break;
        }
        const styles = window.getComputedStyle(element);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          color: styles.color,
        };
      });
    }

    // 背景色または枠線の色が黄色または橙色系であることを確認
    const isYellowOrOrange = (colorStr: string) => {
      if (!colorStr) return false;
      const lower = colorStr.toLowerCase();
      
      // RGB値のマッピング
      const yellowOrangePatterns = [
        /rgb\s*\(\s*245\s*,\s*158\s*,\s*11/, // #f59e0b (primary orange)
        /rgb\s*\(\s*217\s*,\s*119\s*,\s*6/, // #d97706 (darker orange)
        /rgb\s*\(\s*255\s*,\s*193/, // yellow family
        /rgb\s*\(\s*255\s*,\s*212/, // yellow family
        /rgb\s*\(\s*255\s*,\s*152/, // amber
        /ffd700/i, // gold
        /ffb800/i, // orange
        /ffa500/i, // orange
        /ffc107/i, // amber
        /ff9800/i, // orange
        /ffb74d/i, // light orange
        /ffcc80/i, // light orange
      ];
      
      return yellowOrangePatterns.some(pattern => pattern.test(lower));
    };
    
    const bgColor = computedStyle.backgroundColor || '';
    const borderColor = computedStyle.borderColor || '';
    
    expect(
      isYellowOrOrange(bgColor) || isYellowOrOrange(borderColor)
    ).toBeTruthy();

    // メッセージが正確に表示されていることを最終確認
    await expect(page.locator('text="過去の生産性データが不足しています。効率スコアは参考値です"')).toBeVisible();
    
    // 警告が効率スコアの近傍に視認できる状態にあることを確認
    await expect(warningMessage).toBeInViewport();
  });
});