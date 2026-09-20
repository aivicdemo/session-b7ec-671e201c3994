import { test, expect } from '@playwright/test';

test.describe('SCEN-1222: リアルタイム進捗分析により納期遅延リスクが数値化され、対応が必要な拠点が特定される', () => {
  test('進捗・人員配置ダッシュボード画面から人員配置最適化提案画面への遷移', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');

    // 画面の進捗分析ペイン・リスク表示エリアが読み込まれるまで待機
    await expect(page.getByTestId('kpi-risk-count')).toBeVisible();
    await expect(page.locator('#risk-assessment-tbody')).toBeVisible();

    // リアルタイム進捗データと遅延リスク数値が表示されるまで待機
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面に表示されている全拠点の納期遅延リスク数値を確認
    const riskTable = page.locator('#risk-assessment-tbody');
    const riskRows = riskTable.locator('tr');
    const rowCount = await riskRows.count();
    
    expect(rowCount).toBeGreaterThan(0);

    // 各行から遅延確率を抽出して確認
    const rows = await riskRows.all();
    let highRiskRowFound = false;
    let targetRow: any = null;

    for (const row of rows) {
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      // 遅延確率が68%以上の行を探す
      if (cellCount >= 4) {
        const delayProbabilityText = await cells.nth(3).textContent();
        if (delayProbabilityText) {
          const probabilityMatch = delayProbabilityText.match(/(\\d+)%/);
          if (probabilityMatch) {
            const probability = parseInt(probabilityMatch[1]);
            if (probability >= 68) {
              highRiskRowFound = true;
              targetRow = row;
              
              // 遅延リスク数値が高い拠点が色分け・アイコン・ハイライト等で強調表示されていることを視認
              // 要素が視認可能（表示されている）ことを確認
              await expect(row).toBeVisible();
              
              // CSSクラスで強調表示状態を確認
              const classAttr = await row.getAttribute('class');
              const hasHighlightClass = classAttr && (
                classAttr.includes('highlight') || 
                classAttr.includes('danger') || 
                classAttr.includes('alert') || 
                classAttr.includes('warning') ||
                classAttr.includes('high-risk')
              );
              
              // または背景色やスタイルで視認可能な強調表示があるか確認
              const computedStyle = await row.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                  backgroundColor: styles.backgroundColor,
                  borderColor: styles.borderColor,
                  boxShadow: styles.boxShadow,
                };
              });
              
              const hasVisualHighlight = 
                hasHighlightClass ||
                (computedStyle.backgroundColor && 
                 computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                 computedStyle.backgroundColor !== 'transparent') ||
                (computedStyle.borderColor && 
                 computedStyle.borderColor !== 'rgba(0, 0, 0, 0)' && 
                 computedStyle.borderColor !== 'transparent') ||
                (computedStyle.boxShadow && 
                 computedStyle.boxShadow !== 'none');
              
              // 強調表示が視認できることを検証
              expect(hasVisualHighlight).toBe(true);
              
              // 強調表示された拠点の行が操作可能な状態（クリック可能）
              await expect(row).toBeEnabled();
              
              // ホバー時に状態変化することを確認
              await row.hover();
              const hoverStyle = await row.evaluate((el) => {
                const styles = window.getComputedStyle(el);
                return {
                  cursor: styles.cursor,
                  opacity: styles.opacity,
                  backgroundColor: styles.backgroundColor,
                  transform: styles.transform,
                };
              });
              
              // ホバー時に何らかの視認可能な変化があることを確認（カーソル変更、透明度変化、背景色変化など）
              expect(
                hoverStyle.cursor === 'pointer' ||
                hoverStyle.opacity !== '1' ||
                hoverStyle.transform !== 'none'
              ).toBe(true);
              
              break;
            }
          }
        }
      }
    }

    expect(highRiskRowFound).toBe(true);

    // 強調表示された拠点の行をクリックするか、対応するボタンを操作
    if (targetRow) {
      // 対象行に関連する操作可能な要素を探す
      const rowButton = targetRow.locator('button, a[role="button"]').first();
      
      // ボタンが存在するかどうかを確認
      const rowButtonExists = await rowButton.isVisible().catch(() => false);
      
      if (rowButtonExists) {
        // ボタンが存在する場合はボタンをクリック
        await rowButton.click();
      } else {
        // ボタンがない場合は行をクリック
        await targetRow.click();
      }
    }

    // 人員配置最適化提案・実行画面が正常に読み込まれることを確認
    await page.waitForURL('**/scr-1789461798629.html', { timeout: 10000 });
    await expect(page).toHaveURL(/scr-1789461798629\.html/);

    // 対象拠点に関連する配置提案内容が表示される
    await expect(page.getByTestId('progress-rate')).toBeVisible();
    await expect(page.locator('#proposals-container')).toBeVisible();
    await page.waitForLoadState('networkidle');
  });
});