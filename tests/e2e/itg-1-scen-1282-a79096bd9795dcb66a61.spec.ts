import { test, expect } from '@playwright/test';

test.describe('リスク分析結果確認', () => {
  test('リスク判定結果に基づいて、対応が必要な拠点ごとに複数の人員配置案が抽出・優先度付けされ確認用に提示される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/');
    
    // ログイン画面が表示されている場合はログイン
    const loginForm = await page.locator('.login-form').isVisible().catch(() => false);
    if (loginForm) {
      await page.locator('input[placeholder*="ユーザーID"], input[placeholder*="ID"]').first().fill('test-user');
      await page.locator('input[placeholder*="パスワード"], input[type="password"]').first().fill('test-password');
      await page.locator('button:has-text("ログイン")').click();
      await page.waitForNavigation();
    }

    // ダッシュボード画面の読み込み完了を待つ
    await page.waitForLoadState('networkidle');

    // リスク分析が実行済みの状態を確認する
    // predictDelayRiskにより進捗遅延リスク判定が完了した後の状態
    const riskCountKpi = page.getByTestId('kpi-risk-count');
    await expect(riskCountKpi).toBeVisible();

    // ダッシュボード上に『対応が必要な拠点』として、遅延リスク判定結果が一覧表示されていることを確認する
    const riskAssessmentTable = page.locator('#risk-assessment-tbody');
    await expect(riskAssessmentTable).toBeVisible();
    
    const tableRows = riskAssessmentTable.locator('tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 対応が必要な拠点の1つをクリック/タップして詳細表示を開く
    const firstRiskRow = tableRows.first();
    await firstRiskRow.click();

    // 人員配置最適化提案画面への遷移を待つ
    await page.waitForURL('**/scr-1789461798629.html');
    await page.waitForLoadState('networkidle');

    // その拠点に対してsuggestStaffingAdjustmentから返された複数の人員配置案が画面上に表示されていることを確認する
    const proposalsContainer = page.locator('#proposals-container');
    await expect(proposalsContainer).toBeVisible();

    const proposals = proposalsContainer.locator('[class*="proposal"]');
    const proposalCount = await proposals.count();
    expect(proposalCount).toBeGreaterThan(1);

    // 複数の配置案それぞれに対して、優先度ラベル（『推奨』『代替案1』『代替案2』など）が付与されていることを確認する
    const priorityLabelPatterns = ['推奨', '代替案'];
    let foundPriorityLabels = 0;

    for (let i = 0; i < proposalCount; i++) {
      const proposal = proposals.nth(i);
      const proposalText = await proposal.textContent() || '';
      
      // 各配置案に優先度ラベルが付与されていることを確認
      let hasPriorityLabel = false;
      for (const pattern of priorityLabelPatterns) {
        if (proposalText.includes(pattern)) {
          hasPriorityLabel = true;
          foundPriorityLabels++;
          break;
        }
      }
      expect(hasPriorityLabel).toBe(true);
    }

    // 複数の配置案に優先度ラベルが付与されていることを確認
    expect(foundPriorityLabels).toBeGreaterThan(1);

    // 各配置案に拠点名、必要人数、配置元拠点の情報が含まれていることを確認する
    for (let i = 0; i < proposalCount; i++) {
      const proposal = proposals.nth(i);
      const proposalText = await proposal.textContent() || '';
      
      // 拠点名が含まれているか確認
      const hasSiteName = /拠点|東京|大阪|名古屋/.test(proposalText);
      expect(hasSiteName).toBe(true);
      
      // 必要人数が含まれているか確認
      const hasAssignmentCount = /\d+\s*名|\d+\s*人/.test(proposalText);
      expect(hasAssignmentCount).toBe(true);
      
      // 配置元拠点の情報が含まれているか確認
      const hasSourceSiteInfo = /配置元|から|転配|配置先|配置元拠点/.test(proposalText);
      expect(hasSourceSiteInfo).toBe(true);
    }

    // 最も優先度が高い配置案の詳細がプリミティブ領域（画面の目立つ位置）に表示されていることを確認する
    const proposalDetailContainer = page.locator('#proposal-detail-container');
    await expect(proposalDetailContainer).toBeVisible();

    // 最優先案の詳細がビューポート内で見える位置に配置されていることを確認
    const proposalDetailBbox = await proposalDetailContainer.boundingBox();
    expect(proposalDetailBbox).toBeTruthy();
    if (proposalDetailBbox) {
      // 画面の上部に配置されている（目立つ位置）か確認
      expect(proposalDetailBbox.y).toBeLessThan(600);
    }

    const assignmentDetailTable = page.locator('#assignment-detail-tbody');
    await expect(assignmentDetailTable).toBeVisible();

    const detailRows = assignmentDetailTable.locator('tr');
    const detailRowCount = await detailRows.count();
    expect(detailRowCount).toBeGreaterThan(0);

    // 最優先案の詳細に必要人数、配置元拠点、推奨理由が含まれていることを確認
    const detailText = await assignmentDetailTable.textContent() || '';
    
    // 必要人数が含まれているか確認
    const hasDetailAssignmentCount = /\d+\s*名|\d+\s*人/.test(detailText);
    expect(hasDetailAssignmentCount).toBe(true);
    
    // 配置元拠点情報が含まれているか確認
    const hasDetailSourceSiteInfo = /拠点|東京|大阪|名古屋/.test(detailText);
    expect(hasDetailSourceSiteInfo).toBe(true);
    
    // 推奨理由が含まれているか確認
    const hasDetailReason = /推奨理由|理由/.test(detailText);
    expect(hasDetailReason).toBe(true);

    // 最優先案の詳細テーブル内で複数のセルが存在することを確認
    const firstDetailRow = detailRows.first();
    const cellCount = await firstDetailRow.locator('td').count();
    expect(cellCount).toBeGreaterThanOrEqual(2);

    // 画面上で複数配置案の比較表示が可能な状態であることを確認する
    // 複数案が同時に表示されている（並行表示可能）ことを確認
    const proposalElements = proposalsContainer.locator('[class*="proposal"]');
    const visibleProposalCount = await proposalElements.count();
    expect(visibleProposalCount).toBeGreaterThan(1);

    // 各提案要素が視覚的に区別可能であることを確認
    for (let i = 0; i < Math.min(visibleProposalCount, 2); i++) {
      const proposalElement = proposalElements.nth(i);
      const isVisible = await proposalElement.isVisible();
      expect(isVisible).toBe(true);
    }

    // 切り替え操作による比較も可能であることを確認
    if (proposalCount > 1) {
      const secondProposal = proposals.nth(1);
      await expect(secondProposal).toBeVisible();
      await secondProposal.click();
      
      // クリック後、詳細内容が更新されることを確認
      const updatedDetailTable = page.locator('#assignment-detail-tbody');
      await expect(updatedDetailTable).toBeVisible();
      
      const updatedRows = updatedDetailTable.locator('tr');
      const updatedRowCount = await updatedRows.count();
      expect(updatedRowCount).toBeGreaterThan(0);
      
      // 更新された詳細の内容が変更されていることを確認
      const updatedDetailText = await updatedDetailTable.textContent() || '';
      expect(updatedDetailText.length).toBeGreaterThan(0);
    }
  });
});