import { test, expect } from '@playwright/test';

test.describe('最適人員配置案表示', () => {
  test('納期まで15～30分の進捗遅延が検出された場合、画面にhighリスクレベルで表示される', async ({
    page,
  }) => {
    // ログイン画面にアクセス
    await page.goto('/');
    await page.waitForURL('**/panels/**');

    // ログイン処理（必要に応じて）
    const loginTitle = page.locator('.login-title');
    if (await loginTitle.isVisible()) {
      // ログイン画面が表示されている場合はログイン
      await page.fill('input[type="text"]', 'testuser');
      await page.fill('input[type="password"]', 'testpass');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/panels/**', { timeout: 5000 });
    }

    // Step 1: 生産性ダッシュボード・分析画面にアクセスする
    let delayedWorkerIdentifier: string | null = null;
    
    await test.step('生産性ダッシュボード・分析画面にアクセスする', async () => {
      await page.goto('/panels/scr-1789461964046.html');
      await page.waitForLoadState('networkidle');
    });

    // Step 2: 納期までの残り時間が15～30分の範囲で、かつ進捗が計画比で遅延している作業者のデータが画面に表示されていることを確認する
    await test.step('納期まで15～30分の遅延作業者データが表示されていることを確認する', async () => {
      // ダッシュボード画面上のすべての作業者要素を取得
      const workerElements = page.locator('[data-worker-id]');
      const workerCount = await workerElements.count();
      
      let found = false;
      for (let i = 0; i < workerCount; i++) {
        const element = workerElements.nth(i);
        
        // 残り時間データを取得
        const timeRemainingStr = await element.getAttribute('data-time-remaining-minutes');
        const isDelayed = await element.getAttribute('data-is-delayed');
        const workerId = await element.getAttribute('data-worker-id');
        
        if (timeRemainingStr && isDelayed === 'true') {
          const timeRemaining = parseInt(timeRemainingStr, 10);
          // 15～30分の範囲かつ遅延状態を確認
          if (timeRemaining >= 15 && timeRemaining <= 30) {
            await expect(element).toBeVisible();
            delayedWorkerIdentifier = workerId;
            found = true;
            break;
          }
        }
      }
      
      expect(found).toBe(true);
    });

    // Step 3: 画面を更新または自動更新の完了を待つ
    await test.step('画面を更新または自動更新の完了を待つ', async () => {
      // 更新前のタイムスタンプを記録
      const updateIndicator = page.locator('[data-last-updated]');
      const initialTimestamp = await updateIndicator.getAttribute('data-last-updated');
      
      // 画面を再読み込み
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 更新後のタイムスタンプが変更されたことを確認
      const updatedTimestamp = await updateIndicator.getAttribute('data-last-updated');
      expect(updatedTimestamp).not.toBe(initialTimestamp);
      
      // 更新後のデータが表示されたことを確認
      const updatedDataLocator = page.locator('[data-worker-id]');
      await expect(updatedDataLocator.first()).toBeVisible();
    });

    // Step 4: 最適人員配置案提案・実行画面に遷移する
    await test.step('最適人員配置案提案・実行画面に遷移する', async () => {
      await page.goto('/panels/scr-1789461978707.html');
      await page.waitForLoadState('networkidle');
    });

    // Step 5: 配置案の一覧から、上記の遅延作業者に関連する配置案を確認する
    // Expected Result: 配置案表示画面上で、納期まで15～30分の進捗遅延が検出された作業者の配置案が『high』のリスクレベル表示で画面に表示される
    await test.step('納期まで15～30分の遅延に対応するhighリスクレベルの配置案が表示されていることを確認する', async () => {
      // 配置案の一覧から遅延作業者に関連する配置案を探す
      const proposalElements = page.locator('[data-worker-id][data-risk-level]');
      const proposalCount = await proposalElements.count();
      
      let foundHighRiskProposal = false;
      
      for (let i = 0; i < proposalCount; i++) {
        const element = proposalElements.nth(i);
        const workerId = await element.getAttribute('data-worker-id');
        const riskLevel = await element.getAttribute('data-risk-level');
        const timeRemainingStr = await element.getAttribute('data-time-remaining-minutes');
        
        // Step2で確認した遅延作業者の配置案を探す
        if (workerId === delayedWorkerIdentifier && timeRemainingStr) {
          const timeRemaining = parseInt(timeRemainingStr, 10);
          if (timeRemaining >= 15 && timeRemaining <= 30) {
            if (riskLevel === 'high') {
              foundHighRiskProposal = true;
              await expect(element).toBeVisible();
            }
          }
        }
      }
      
      expect(foundHighRiskProposal).toBe(true);
      
      // highリスクレベルの配置案が表示されていることを確認
      const highRiskElement = page.locator(`[data-worker-id="${delayedWorkerIdentifier}"][data-risk-level="high"]`).first();
      await expect(highRiskElement).toBeVisible();
      
      // highリスクレベルの視覚的な特性を確認（色、アイコン、ラベル）
      const highRiskVisualIndicators = await highRiskElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const iconElements = el.querySelectorAll('[class*="icon"], [class*="Icon"]');
        const labelElements = el.querySelectorAll('[class*="label"], [class*="Label"], span');
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          color: styles.color,
          hasIcon: iconElements.length > 0,
          hasLabel: labelElements.length > 0,
          iconContent: Array.from(iconElements).map(el => (el as HTMLElement).innerText || (el as HTMLElement).className),
          labelContent: Array.from(labelElements).map(el => (el as HTMLElement).innerText).filter(text => text.trim().length > 0),
        };
      });
      
      const hasVisualIndicator = 
        highRiskVisualIndicators.backgroundColor ||
        highRiskVisualIndicators.borderColor ||
        highRiskVisualIndicators.color ||
        highRiskVisualIndicators.hasIcon ||
        highRiskVisualIndicators.hasLabel;
      expect(hasVisualIndicator).toBeTruthy();
      
      // その他のリスクレベルの配置案と視覚的に区別されていることを検証
      const lowRiskElements = page.locator('[data-risk-level="low"]');
      const mediumRiskElements = page.locator('[data-risk-level="medium"]');
      
      let lowRiskVisualIndicators: any = null;
      let mediumRiskVisualIndicators: any = null;
      
      if (await lowRiskElements.count() > 0) {
        lowRiskVisualIndicators = await lowRiskElements.first().evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const iconElements = el.querySelectorAll('[class*="icon"], [class*="Icon"]');
          const labelElements = el.querySelectorAll('[class*="label"], [class*="Label"], span');
          return {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            color: styles.color,
            hasIcon: iconElements.length > 0,
            hasLabel: labelElements.length > 0,
            iconContent: Array.from(iconElements).map(el => (el as HTMLElement).innerText || (el as HTMLElement).className),
            labelContent: Array.from(labelElements).map(el => (el as HTMLElement).innerText).filter(text => text.trim().length > 0),
          };
        });
      }
      
      if (await mediumRiskElements.count() > 0) {
        mediumRiskVisualIndicators = await mediumRiskElements.first().evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const iconElements = el.querySelectorAll('[class*="icon"], [class*="Icon"]');
          const labelElements = el.querySelectorAll('[class*="label"], [class*="Label"], span');
          return {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            color: styles.color,
            hasIcon: iconElements.length > 0,
            hasLabel: labelElements.length > 0,
            iconContent: Array.from(iconElements).map(el => (el as HTMLElement).innerText || (el as HTMLElement).className),
            labelContent: Array.from(labelElements).map(el => (el as HTMLElement).innerText).filter(text => text.trim().length > 0),
          };
        });
      }
      
      // highリスクとlowリスクの視覚的な特性が異なることを確認
      if (lowRiskVisualIndicators) {
        const stylesDiffer = 
          highRiskVisualIndicators.backgroundColor !== lowRiskVisualIndicators.backgroundColor ||
          highRiskVisualIndicators.borderColor !== lowRiskVisualIndicators.borderColor ||
          highRiskVisualIndicators.color !== lowRiskVisualIndicators.color ||
          highRiskVisualIndicators.hasIcon !== lowRiskVisualIndicators.hasIcon ||
          highRiskVisualIndicators.hasLabel !== lowRiskVisualIndicators.hasLabel;
        expect(stylesDiffer).toBe(true);
      }
      
      // highリスクとmediumリスクの視覚的な特性が異なることを確認
      if (mediumRiskVisualIndicators) {
        const stylesDiffer = 
          highRiskVisualIndicators.backgroundColor !== mediumRiskVisualIndicators.backgroundColor ||
          highRiskVisualIndicators.borderColor !== mediumRiskVisualIndicators.borderColor ||
          highRiskVisualIndicators.color !== mediumRiskVisualIndicators.color ||
          highRiskVisualIndicators.hasIcon !== mediumRiskVisualIndicators.hasIcon ||
          highRiskVisualIndicators.hasLabel !== mediumRiskVisualIndicators.hasLabel;
        expect(stylesDiffer).toBe(true);
      }
    });
  });
});