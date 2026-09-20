import { test, expect } from '@playwright/test';

test.describe('リスク分析結果確認', () => {
  test('人員配置案の確認時点で進捗遅延リスク判定結果が永続化され、監査証跡が記録される', async ({ page }) => {
    // 進捗・人員配置ダッシュボード画面を開く
    await page.goto('/panels/scr-1789461783315.html');
    await page.waitForLoadState('networkidle');

    // WmsHandyTerminalDataSourceを通じWMSから拠点Aのチームデータが表示されることを確認
    const siteVarianceTable = page.locator('[id="site-variance-tbody"]');
    await expect(siteVarianceTable).toBeVisible();
    
    // 拠点Aのチームデータを確認（完了数：80、残数：120、進捗率：40%）
    const siteARow = siteVarianceTable.locator('tr').filter({ hasText: /拠点A/ });
    await expect(siteARow).toContainText('40');

    // RiskPredictionAiAdapterから拠点A・チーム単位で納期遅延確率75%の判定結果が表示されることを確認
    const riskAssessmentTable = page.locator('[id="risk-assessment-tbody"]');
    await expect(riskAssessmentTable).toBeVisible();
    
    const riskARow = riskAssessmentTable.locator('tr').filter({ hasText: /拠点A/ });
    await expect(riskARow).toContainText('75');

    // 画面に表示されたリスク分析IDを抽出
    const riskAnalysisIdText = await riskARow.locator('td').first().textContent();
    const riskAnalysisId = riskAnalysisIdText?.trim();

    // 人員配置最適化提案・実行画面に遷移
    const optimizationNavLink = page.locator('[class="shell-nav-item"]').filter({ hasText: /人員配置最適化提案/ });
    await optimizationNavLink.click();
    await page.waitForLoadState('networkidle');

    // 拠点Aの配置案が表示されることを確認
    const proposalContainer = page.locator('[id="proposals-container"]');
    await expect(proposalContainer).toBeVisible();

    // RiskPredictionAiAdapterから拠点Aに対し追加人員3名・配置元拠点Bを提案する配置案が画面上に表示されることを確認
    const assignmentDetailTable = page.locator('[id="assignment-detail-tbody"]');
    await expect(assignmentDetailTable).toBeVisible();
    
    // 配置案の詳細を確認（追加人員3名、拠点B→拠点A）
    const assignmentRows = assignmentDetailTable.locator('tr');
    const assignmentCount = await assignmentRows.count();
    expect(assignmentCount).toBe(3);

    // 画面上に表示された人員配置案（追加人員3名、拠点B→拠点A）の「確認」ボタンをクリック
    const approveButton = page.locator('[testid="approve-button"]');
    await approveButton.click();
    await page.waitForLoadState('networkidle');

    // 確認ボタンクリック後、NotificationServiceAdapterを通じた配置案配信が実行されたことを画面の通知または配信ステータス表示から確認
    // 成功通知の表示を確認
    const successBanner = page.locator('[id="success-banner"]');
    await expect(successBanner).toBeVisible({ timeout: 5000 });

    // データベースの監査証跡テーブルをクエリして確認
    const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
    const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
    
    // 監査ログを取得
    const auditLogResponse = await page.evaluate(async (params) => {
      const response = await fetch(
        `${params.apiUrl}/api/audit_log?app=${params.appId}&event_type=STAFFING_PLAN_CONFIRMED`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return await response.json();
    }, { apiUrl, appId });

    // 監査証跡の検証
    expect(auditLogResponse.records).toBeDefined();
    
    // 拠点Aに関連し、リスク分析IDと紐付けられた確認済みの監査ログレコードを取得
    const auditRecords = auditLogResponse.records.filter((record: any) => 
      record.status === 'PERSISTED' && 
      record.risk_analysis_id === riskAnalysisId &&
      record.staffing_adjustment?.destination_site === '拠点A'
    );
    
    // 単一行であることを確認
    expect(auditRecords.length).toBe(1);
    
    const auditRecord = auditRecords[0];
    
    // イベントタイプの検証
    expect(auditRecord.event_type).toBe('STAFFING_PLAN_CONFIRMED');
    
    // リスク判定IDとの紐付けの検証
    expect(auditRecord.risk_analysis_id).toBe(riskAnalysisId);
    
    // 進捗遅延確率の検証
    expect(auditRecord.delay_risk_percentage).toBe(75);
    
    // 確認日時（timestamp）の検証
    expect(auditRecord.timestamp).toBeDefined();
    expect(typeof auditRecord.timestamp).toBe('number');
    
    // 確認者の検証
    expect(auditRecord.user_id).toBeDefined();
    expect(typeof auditRecord.user_id).toBe('string');
    
    // 配置案内容の検証（拠点A・チーム単位）
    expect(auditRecord.staffing_adjustment).toBeDefined();
    expect(auditRecord.staffing_adjustment.additional_count).toBe(3);
    expect(auditRecord.staffing_adjustment.source_site).toBe('拠点B');
    expect(auditRecord.staffing_adjustment.destination_site).toBe('拠点A');
    
    // ステータスの検証
    expect(auditRecord.status).toBe('PERSISTED');
  });
});