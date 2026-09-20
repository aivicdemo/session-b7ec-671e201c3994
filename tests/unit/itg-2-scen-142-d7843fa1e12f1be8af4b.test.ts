import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-142: 遅延リスク検知と対応判定', () => {
  it('現在の人員配置と生産性データから遅延リスクスコアを計算し、閾値と比較して遅延リスクを正確に判定する', async () => {
    const userId = 'user-001';
    const siteIds = ['site-a', 'site-b'];
    const teamIds = ['team-1', 'team-2'];
    const monitoringPeriodDays = 7;
    const delayRiskThreshold = 60;
    const includeProductivityAnalysis = true;

    const result = await monitorProgressAndDetectDelayRisk({
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis,
    });

    // 1. monitoringExecutedAt が ISO 8601 形式の現在日時であること
    expect(result.monitoringExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );

    // 2. delayRiskDetected が true であること（スコア65 > 閾値60）
    expect(result.delayRiskDetected).toBe(true);

    // 3. affectedSites 配列に、リスク度合い「high」で拠点B が含まれていること
    const affectedSiteB = result.affectedSites.find(
      (site) => site.siteId === 'site-b'
    );
    expect(affectedSiteB).toBeDefined();
    expect(affectedSiteB?.delayRiskScore).toBeGreaterThan(delayRiskThreshold);
    expect(affectedSiteB?.currentProgressRate).toBeLessThan(
      affectedSiteB!.plannedProgressRate
    );
    expect(affectedSiteB?.progressGapPercentage).toBeGreaterThan(0);

    // 4. recommendedAdjustments 配列に、拠点Bに対して以下の調整内容が含まれていること
    const adjustmentForSiteB = result.recommendedAdjustments.find(
      (adj) => adj.siteId === 'site-b'
    );
    expect(adjustmentForSiteB).toBeDefined();
    expect(adjustmentForSiteB?.adjustmentType).toBe('personnel_addition');
    expect(adjustmentForSiteB?.requiredPersonnelCount).toBeGreaterThan(0);
    expect(adjustmentForSiteB?.estimatedImpactOnDelivery).toBeGreaterThan(0);
    expect(adjustmentForSiteB?.urgencyLevel).toBe('high');

    // 5. overallDelayRiskScore が閾値を超過していること
    expect(result.overallDelayRiskScore).toBeGreaterThan(delayRiskThreshold);

    // 6. notificationSent が true であること
    expect(result.notificationSent).toBe(true);

    // 7. analysisDetails に、監視対象期間7日の進捗分析詳細が含まれていること
    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails?.totalSitesMonitored).toBe(
      siteIds.length
    );
    expect(result.analysisDetails?.sitesWithDelayRisk).toBeGreaterThan(0);
    expect(result.analysisDetails?.analysisStartDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
    expect(result.analysisDetails?.analysisEndDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});