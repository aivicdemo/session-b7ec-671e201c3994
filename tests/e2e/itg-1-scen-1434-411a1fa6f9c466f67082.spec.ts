import { test, expect } from '@playwright/test';

test.describe('ダッシュボード表示（実績管理画面から）', () => {
  test('納期遅延リスク判定時に、残り時間が0以下の場合、エラーメッセージが表示され判定が中止される', async ({ page }) => {
    // ログイン処理
    await page.goto('/');
    
    // ログイン画面が表示されているか確認
    const loginForm = page.locator('form').first();
    const isLoginPageVisible = await loginForm.isVisible().catch(() => false);
    
    if (isLoginPageVisible) {
      // ログイン画面からテスト用の認証情報でログイン
      const usernameInput = page.locator('input[type="text"], input[placeholder*="ユーザー"], input[placeholder*="ID"]').first();
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button').filter({ hasText: /ログイン|login/ }).first();
      
      await usernameInput.fill('testuser');
      await passwordInput.fill('testpass');
      await loginButton.click();
      
      await page.waitForURL(/.*\/panels\/.*/, { timeout: 10000 });
    }
    
    // 自動リダイレクト後の確認
    await page.waitForLoadState('networkidle');
    
    // 作業指示・実績管理画面を開く
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');
    
    // 進捗・人員配置ダッシュボード画面に遷移
    await test.step('進捗・人員配置ダッシュボード画面に遷移する', async () => {
      const dashboardNavItem = page.locator('[data-testid="scr-1789461783315"], nav a, nav button').filter({ hasText: /進捗.*人員配置ダッシュボード/ }).first();
      await dashboardNavItem.click();
      await page.waitForLoadState('networkidle');
      
      const dashboardUrl = page.url();
      expect(dashboardUrl).toContain('scr-1789461783315');
    });
    
    // ページが完全に読み込まれるまで待機
    await page.waitForSelector('[data-testid="kpi-risk-count"]', { timeout: 5000 });
    
    // ダッシュボード上で、納期が現在時刻より前の作業指示が表示されていることを確認
    await test.step('ダッシュボード上で、納期が現在時刻より前の作業指示が表示されていることを確認する', async () => {
      const riskAssessmentTable = page.locator('#risk-assessment-tbody, [data-testid="risk-assessment-table"] tbody');
      const tableRows = riskAssessmentTable.locator('tr');
      const rowCount = await tableRows.count();
      
      expect(rowCount).toBeGreaterThan(0);
      
      // 納期が現在時刻より前の作業指示データを確認
      let foundOverdueInstructions = false;
      
      for (let i = 0; i < rowCount; i++) {
        const row = tableRows.nth(i);
        const cells = row.locator('td');
        const cellCount = await cells.count();
        
        if (cellCount > 0) {
          const cellTexts = await Promise.all(
            Array.from({ length: cellCount }, (_, i) => cells.nth(i).textContent())
          );
          
          // 負の遅延日数（残り時間が0以下を示す）が表示されているか確認
          const hasNegativeDelayDays = cellTexts.some(text => {
            if (!text) return false;
            const trimmed = text.trim();
            // 負の数値パターン（-1, -2など）で納期が過ぎていることを確認
            return /^-\d+/.test(trimmed);
          });
          
          if (hasNegativeDelayDays) {
            foundOverdueInstructions = true;
            break;
          }
        }
      }
      
      expect(foundOverdueInstructions).toBeTruthy();
    });
    
    // ダッシュボード上で納期遅延リスク判定を実行するボタンをクリック
    await test.step('ダッシュボード上で納期遅延リスク判定を実行するボタンをクリックする', async () => {
      // 「人員配置を最適化」ボタンが納期遅延リスク判定を実行するボタンとして機能
      const optimizeButton = page.locator('button').filter({ hasText: /人員配置を最適化/ }).first();
      await expect(optimizeButton).toBeVisible();
      await optimizeButton.click();
      await page.waitForLoadState('networkidle');
    });
    
    // 画面に表示される結果を確認
    await test.step('画面に表示される結果を確認する', async () => {
      // エラーメッセージ「納期が既に過ぎています。緊急対応が必要です」が表示されることを確認
      const errorMessage = page.locator('text=納期が既に過ぎています。緊急対応が必要です');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      // エラーメッセージが赤色またはアラートアイコンで強調表示されていることを確認
      const errorElement = page.locator('[role="alert"], .error-message, [class*="error"]').first();
      await expect(errorElement).toBeVisible();
      
      // 赤色またはアラートアイコンで強調表示されているかを確認
      const hasAlertIconOrRedColor = await errorElement.evaluate((el) => {
        // アラートアイコンの存在確認
        const svgIcon = el.querySelector('svg');
        const iconElement = el.querySelector('[class*="icon"], i[class*="alert"]');
        
        if (svgIcon || iconElement) {
          return true;
        }
        
        // 赤色表示の確認
        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        const bgColor = computedStyle.backgroundColor;
        
        const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        const bgRgbMatch = bgColor.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch;
          const red = parseInt(r);
          if (red > Math.max(parseInt(g), parseInt(b))) {
            return true;
          }
        }
        
        if (bgRgbMatch) {
          const [, r, g, b] = bgRgbMatch;
          const red = parseInt(r);
          if (red > Math.max(parseInt(g), parseInt(b))) {
            return true;
          }
        }
        
        return false;
      });
      
      expect(hasAlertIconOrRedColor).toBeTruthy();
      
      // 配置案が生成されていないことを確認
      const proposalsContainer = page.locator('#proposals-container, [data-testid="proposals-container"]');
      const isProposalsVisible = await proposalsContainer.isVisible().catch(() => false);
      
      if (isProposalsVisible) {
        const proposalContent = await proposalsContainer.textContent();
        const hasProposalGenerated = proposalContent?.match(/配置案.*\d+名|配置案案/) ?? null;
        expect(hasProposalGenerated).toBeNull();
      }
      
      // 優先順位変更提案が生成されていないことを確認
      const recommendedActionsSection = page.locator('#recommended-actions, [data-testid="recommended-actions"]');
      const isRecommendedActionsVisible = await recommendedActionsSection.isVisible().catch(() => false);
      
      if (isRecommendedActionsVisible) {
        const recommendedContent = await recommendedActionsSection.textContent();
        const hasRecommendationGenerated = recommendedContent?.match(/新しい提案|提案が生成されました|優先順位の変更/) ?? null;
        expect(hasRecommendationGenerated).toBeNull();
      }
      
      // 再試行を促すボタンが提供されていることを確認
      const retryButton = page.locator('button').filter({ 
        hasText: /再試行|手動確認|やり直す|確認/ 
      }).first();
      
      await expect(retryButton).toBeVisible({ timeout: 5000 });
    });
  });
});