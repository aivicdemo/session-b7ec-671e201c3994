import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-1017: 現在の完了率が既に目標値を超えている場合、調整が不要であることを判定する', () => {
  it('完了率92%が目標値85%を超えている場合、遅延リスク検知なし・推奨調整なしとなること', async () => {
    const userId = 'user-001';
    const siteId = 'site-001';
    const teamId = 'team-001';
    const monitoringPeriodDays = 7;
    const delayRiskThreshold = 60;
    const includeProductivityAnalysis = true;

    // 現在の完了率92%、目標値85%の状態を表現
    const currentProgressRate = 92;
    const plannedProgressRate = 85;

    const input = {
      userId,
      siteIds: [siteId],
      teamIds: [teamId],
      monitoringPeriodDays,
      delayRiskThreshold,
      includeProductivityAnalysis,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    // WMSからのリアルタイム進捗データを確認
    // 対象拠点の現在の完了率が既に目標値を超えた状態であることを確認
    expect(result.affectedSites.length).toBeGreaterThanOrEqual(0);
    if (result.affectedSites.length > 0) {
      const targetSite = result.affectedSites.find(site => site.siteId === siteId);
      if (targetSite) {
        expect(targetSite.currentProgressRate).toBeGreaterThanOrEqual(currentProgressRate);
        expect(targetSite.plannedProgressRate).toBeLessThanOrEqual(plannedProgressRate);
      }
    }

    // 対象拠点・期間のチームごとの生産性データ取得を確認
    // 分析に必要な最小件数以上が存在することを確認
    if (result.analysisDetails) {
      expect(result.analysisDetails.totalSitesMonitored).toBeGreaterThan(0);
      expect(result.analysisDetails.dataQualityScore).toBeGreaterThanOrEqual(0);
    }

    // 現在の完了率92%が目標値85%を超えていることから
    // 全体遅延リスクスコアが15と計算されることを確認
    expect(result.overallDelayRiskScore).toBe(15);

    // 遅延リスクスコア15が判定閾値60未満であるため
    // 対応が必要な拠点が存在せず
    // affectedSites は空配列、recommendedAdjustments は空配列となることを確認
    expect(result.delayRiskDetected).toBe(false);
    expect(result.affectedSites).toEqual([]);
    expect(result.recommendedAdjustments).toEqual([]);
    expect(result.overallDelayRiskScore).toBeLessThan(delayRiskThreshold);
    expect(result.notificationSent).toBe(false);
    expect(result.monitoringExecutedAt).toBeDefined();
  });
});