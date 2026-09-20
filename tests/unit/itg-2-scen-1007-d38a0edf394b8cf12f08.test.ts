import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-1007: リアルタイム進捗監視と遅延検知 - 作業負荷100%超過時の警告', () => {
  it('対象拠点の作業負荷が既に100%を超えている場合、人員融通だけでは対応できない可能性を警告する', async () => {
    // Arrange
    const userId = 'USER-001';
    const siteIds = ['SITE-OVERLOAD'];
    const monitoringPeriodDays = 7;
    const delayRiskThreshold = 60;
    const includeProductivityAnalysis = true;

    const input = {
      userId,
      siteIds,
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis,
    };

    // Act
    const result = await monitorProgressAndDetectDelayRisk(input);

    // Assert
    // (1) affectedSites に該当拠点が含まれることを確認
    expect(result.affectedSites).toBeDefined();
    expect(result.affectedSites.length).toBeGreaterThan(0);
    
    const affectedSite = result.affectedSites.find(site => site.siteId === 'SITE-OVERLOAD');
    expect(affectedSite).toBeDefined();
    
    // (2) 現在の作業負荷が100%を超えていることが判定できることを確認
    expect(affectedSite!.currentProgressRate).toBeGreaterThan(100);
    expect(affectedSite!.currentProgressRate).toBe(105);
    
    // (3) 進捗ギャップから100%超過状態が認識できることを確認
    expect(affectedSite!.progressGapPercentage).toBeLessThan(0);
    
    // (4) 残り日数と推定納期から過負荷状態が認識できることを確認
    expect(affectedSite!.remainingDays).toBeDefined();
    expect(affectedSite!.estimatedDeliveryDate).toBeDefined();
    expect(affectedSite!.plannedDeliveryDate).toBeDefined();
    
    // (5) リスク指標が92（90以上の高リスク値）であることを確認
    expect(affectedSite!.delayRiskScore).toBe(92);
    expect(affectedSite!.delayRiskScore).toBeGreaterThanOrEqual(90);

    // (6) recommendedAdjustments に該当拠点のエントリが含まれることを確認
    expect(result.recommendedAdjustments).toBeDefined();
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);
    
    const adjustment = result.recommendedAdjustments.find(adj => adj.siteId === 'SITE-OVERLOAD');
    expect(adjustment).toBeDefined();

    // (7) 調整内容に警告文言が含まれることを確認
    expect(adjustment!.adjustmentDescription).toMatch(
      /現在の作業負荷が既に100%を超えているため、人員融通だけでは対応できません|人員融通だけでは対応できません|100%を超えている/
    );

    // (8) 推奨追加人員数=5、融通可能人員数=3 の関係を確認
    expect(adjustment!.requiredPersonnelCount).toBe(5);
    // 融通可能人員数が必要人員数より少ないことを確認
    expect(adjustment!.requiredPersonnelCount).toBeGreaterThan(3);

    // (9) urgencyLevel が過負荷状態に対応した値（critical）であることを確認
    expect(adjustment!.urgencyLevel).toBe('critical');

    // (10) recommendedExecutionDate が設定されていることを確認
    expect(adjustment!.recommendedExecutionDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // (11) estimatedImpactOnDelivery が設定されていることを確認
    expect(adjustment!.estimatedImpactOnDelivery).toBeDefined();
    expect(typeof adjustment!.estimatedImpactOnDelivery).toBe('number');

    // (12) overallDelayRiskScore が92であることを確認
    expect(result.overallDelayRiskScore).toBe(92);

    // (13) delayRiskDetected が true であることを確認
    expect(result.delayRiskDetected).toBe(true);

    // (14) notificationSent が true であることを確認
    expect(result.notificationSent).toBe(true);

    // (15) 実行日時が ISO 8601 形式で設定されていることを確認
    expect(result.monitoringExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // (16) analysisDetails が存在し、監視対象の拠点・期間情報を含むことを確認
    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails!.totalSitesMonitored).toBeGreaterThanOrEqual(1);
    expect(result.analysisDetails!.sitesWithDelayRisk).toBeGreaterThanOrEqual(1);
  });
});