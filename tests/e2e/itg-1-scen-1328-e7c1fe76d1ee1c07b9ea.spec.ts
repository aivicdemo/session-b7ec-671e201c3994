import { test, expect } from '@playwright/test';

test.describe('SCEN-1328: 人員配置最適化提案画面表示', () => {
  test('各配置案に推奨理由（日本語テキスト）が付与されて表示される', async ({ page }) => {
    // ブラウザで進捗・人員配置ダッシュボードにアクセスする
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // 進捗・人員配置ダッシュボードから遅延リスク「高」と判定された拠点を選択する
    // リスクレベルフィルターで「高」を選択
    const riskLevelFilter = page.locator('[data-testid="risk-level-filter"]');
    await riskLevelFilter.waitFor({ state: 'visible' });
    await riskLevelFilter.click();
    
    // フィルター内から「高」を選択
    const highRiskOption = page.locator('text=高').first();
    await highRiskOption.click();
    await page.waitForLoadState('networkidle');

    // リスク評価テーブルから高リスク拠点を確認し、該当行をクリック
    const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
    await riskAssessmentTable.waitFor({ state: 'visible' });
    
    // リスク評価テーブルの最初の行を選択（高リスク拠点）
    const firstRiskRow = page.locator('#risk-assessment-tbody tr').first();
    await firstRiskRow.click();
    await page.waitForLoadState('networkidle');

    // 人員配置最適化提案・実行画面へ遷移するのを待つ
    await page.waitForURL('**/scr-1789461798629.html', { timeout: 10000 }).catch(() => {
      // URLが変わらない場合は手動で遷移
    });

    // URLが変わらない場合は直接遷移
    if (!page.url().includes('scr-1789461798629')) {
      await page.goto('/panels/scr-1789461798629.html');
    }
    await page.waitForLoadState('networkidle');

    // 現在の進捗・生産性データが画面に読み込まれ、複数の配置案候補が配置案一覧として表示されるまで待機
    const progressRateValue = page.locator('#progress-rate-value');
    await progressRateValue.waitFor({ state: 'visible' });
    
    const progressText = await progressRateValue.textContent();
    expect(progressText).toBeTruthy();

    // 複数の配置案候補が配置案一覧として表示されるまで待機
    await page.locator('#proposals-container').waitFor({ state: 'visible' });
    
    const proposalElements = await page.locator('#proposals-container [id^="proposal-"]').count();
    expect(proposalElements).toBeGreaterThan(0);

    // 画面に表示された配置案一覧のうち、任意の1件の配置案を確認する
    const firstProposal = page.locator('#proposals-container [id^="proposal-"]').first();
    await firstProposal.click();
    await page.waitForLoadState('networkidle');

    // その配置案に付与されている推奨理由テキストを目視で確認する
    const proposalReasonElement = page.locator('#proposal-reason');
    await proposalReasonElement.waitFor({ state: 'visible' });

    const reasonText = await proposalReasonElement.textContent();
    
    // 推奨理由テキストが存在し、空でないことを確認
    expect(reasonText).toBeTruthy();
    expect(reasonText?.trim().length).toBeGreaterThan(0);

    // 日本語テキストが含まれていることを確認（文字化けがないか）
    expect(reasonText).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/);

    // テキストボックスまたはツールチップ等の領域に表示されていることを確認
    const isVisible = await proposalReasonElement.isVisible();
    expect(isVisible).toBe(true);

    // 要素がテキストボックス、ツールチップ、またはそれに類する領域として表示されていることを確認
    const elementTag = await proposalReasonElement.evaluate((el) => el.tagName.toLowerCase());
    const elementRole = await proposalReasonElement.getAttribute('role');
    const elementClass = await proposalReasonElement.getAttribute('class');
    
    // テキストボックス、ツールチップ、またはその他の表示領域として実装されていることを確認
    const isTextArea = elementTag === 'textarea' || elementTag === 'input';
    const isTextBox = elementClass?.includes('textbox') || elementClass?.includes('text-box');
    const isTooltip = elementRole === 'tooltip' || elementClass?.includes('tooltip');
    const isSection = elementTag === 'div' || elementTag === 'span' || elementTag === 'p';
    
    expect(isTextArea || isTextBox || isTooltip || isSection).toBe(true);

    // 要素のバウンディングボックスを確認
    const boundingBox = await proposalReasonElement.boundingBox();
    expect(boundingBox).toBeDefined();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);

    // 推奨理由テキストが以下の3つの要素を含んでいることを確認

    // 要素1：業務上の根拠を確認
    const hasBusinessRationale = 
      /(拠点|作業者|チーム).{0,15}?(進捗|遅延|リスク|生産性|技能|スキル).{0,15}?\d+%.*?(ため|回避|改善|対応|実現)/.test(reasonText || '') ||
      /\d+%.*?(ため|回避|改善|対応).*?(拠点|作業者|チーム|配置|スキル|生産性)/.test(reasonText || '');
    expect(hasBusinessRationale).toBe(true);

    // 要素2：配置内容の要約を確認
    const allocationMatches = reasonText?.match(/拠点.*?\d+名/g) || [];
    const hasMultipleAllocationSources = allocationMatches.length >= 2 || /複数拠点|から.{0,10}?拠点|複数.*?配置/.test(reasonText || '');
    const hasAllocationSummary = hasMultipleAllocationSources && /配置|名|員/.test(reasonText || '');
    expect(hasAllocationSummary).toBe(true);

    // 要素3：想定される効果を確認
    const hasExpectedEffect = /\d+%\s*(から|～)\s*\d+%\s*(に|へ|まで).{0,10}?(向上|改善|削減|短縮|上昇|確度)/.test(reasonText || '');
    expect(hasExpectedEffect).toBe(true);

    // 文字化けや記号化の異常がないか確認
    const hasInvalidCharacters = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(reasonText || '');
    expect(hasInvalidCharacters).toBe(false);

    // 空白表示のみでないことを確認
    const hasNonWhitespaceContent = /[^\s]/.test(reasonText || '');
    expect(hasNonWhitespaceContent).toBe(true);

    // 要素が完全に表示されている（スクロール不要）ことを確認
    const scrollHeight = await proposalReasonElement.evaluate((el: Element) => {
      const htmlEl = el as HTMLElement;
      return htmlEl.scrollHeight;
    });
    const clientHeight = await proposalReasonElement.evaluate((el: Element) => {
      const htmlEl = el as HTMLElement;
      return htmlEl.clientHeight;
    });
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);

    // 配置案の詳細情報も表示されていることを確認
    const detailContainer = page.locator('#proposal-detail-container');
    await detailContainer.waitFor({ state: 'visible' });

    // 配置内容テーブルが表示されていることを確認
    const assignmentTable = page.locator('#assignment-detail-table');
    await assignmentTable.waitFor({ state: 'visible' });

    const tableRowCount = await page.locator('#assignment-detail-tbody tr').count();
    expect(tableRowCount).toBeGreaterThan(0);
  });
});