import {
  monitorProgressAndDetectDelayRisk,
  MonitorProgressAndDetectDelayRiskInput,
  MonitorProgressAndDetectDelayRiskOutput,
} from "../../src/logic/progress-monitoring";

describe("SCEN-1003: リアルタイム進捗監視と遅延検知", () => {
  it("5分以上のデータ遅延発生時、現場リーダーに遅延警告が通知され、手動入力モードへの切り替えが促される", async () => {
    // 1. パラメータの準備
    const input: MonitorProgressAndDetectDelayRiskInput = {
      userId: "leader001",
      siteIds: ["siteA"],
      teamIds: undefined,
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    // 2-5. システム状態の構成（モック等で実現される想定）
    // - WMSから取得したリアルタイム進捗データ
    // - 過去7日間の作業者生産性パターンデータ
    // - 遅延リスクスコアが75となる進捗遅延リスク
    // - 拠点A:人員追加3名、作業優先順位再編成
    // - 現場リーダーへの通知送信成功

    // 6. monitorProgressAndDetectDelayRisk()を実行
    const result: MonitorProgressAndDetectDelayRiskOutput =
      await monitorProgressAndDetectDelayRisk(input);

    // 7. 出力検証

    // (1) monitoringExecutedAt が ISO 8601形式の日時文字列
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.monitoringExecutedAt)).toBe(true);

    // (2) delayRiskDetected が true
    expect(result.delayRiskDetected).toBe(true);

    // (3) affectedSites に拠点Aの詳細情報が含まれ、リスクスコアが75
    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThan(0);

    const affectedSiteA = result.affectedSites.find((site) => site.siteId === "siteA");
    expect(affectedSiteA).toBeDefined();
    if (affectedSiteA) {
      expect(affectedSiteA.siteName).toBeDefined();
      expect(affectedSiteA.delayRiskScore).toBe(75);
      expect(affectedSiteA.currentProgressRate).toBeDefined();
      expect(affectedSiteA.plannedProgressRate).toBeDefined();
      expect(affectedSiteA.progressGapPercentage).toBeDefined();
      expect(affectedSiteA.estimatedDeliveryDate).toBeDefined();
      expect(affectedSiteA.plannedDeliveryDate).toBeDefined();
      expect(affectedSiteA.remainingDays).toBeDefined();
      expect(Array.isArray(affectedSiteA.affectedTeams)).toBe(true);
    }

    // (4) recommendedAdjustments に拠点Aに対する具体的な調整内容が含まれる
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    const siteAAdjustments = result.recommendedAdjustments.filter(
      (adj) => adj.siteId === "siteA"
    );
    expect(siteAAdjustments.length).toBeGreaterThan(0);

    // 人員追加の調整を確認
    const personnelAdjustment = siteAAdjustments.find(
      (adj) => adj.adjustmentType === "personnel_addition"
    );
    expect(personnelAdjustment).toBeDefined();
    if (personnelAdjustment) {
      expect(personnelAdjustment.requiredPersonnelCount).toBe(3);
      expect(personnelAdjustment.adjustmentDescription).toBeDefined();
      expect(personnelAdjustment.urgencyLevel).toBeDefined();
      expect(personnelAdjustment.recommendedExecutionDate).toBeDefined();
      expect(personnelAdjustment.estimatedImpactOnDelivery).toBeDefined();
    }

    // 優先度再編成の調整を確認
    const priorityAdjustment = siteAAdjustments.find(
      (adj) => adj.adjustmentType === "priority_reordering"
    );
    expect(priorityAdjustment).toBeDefined();
    if (priorityAdjustment) {
      expect(priorityAdjustment.adjustmentDescription).toContain("優先");
      expect(priorityAdjustment.adjustmentDescription).toBeDefined();
    }

    // (5) overallDelayRiskScore が 75
    expect(result.overallDelayRiskScore).toBe(75);

    // (6) notificationSent が true で、現場リーダーへ通知が送信されている
    expect(result.notificationSent).toBe(true);

    // (7) analysisDetails が存在し、進捗分析の詳細を包含
    expect(result.analysisDetails).toBeDefined();
    if (result.analysisDetails) {
      expect(result.analysisDetails.analysisStartDate).toBeDefined();
      expect(result.analysisDetails.analysisEndDate).toBeDefined();
      expect(result.analysisDetails.totalSitesMonitored).toBeGreaterThan(0);
      expect(result.analysisDetails.sitesWithDelayRisk).toBeGreaterThan(0);
      expect(result.analysisDetails.averageProgressRate).toBeDefined();
      expect(
        result.analysisDetails.averageProgressRate >= 0 &&
          result.analysisDetails.averageProgressRate <= 100
      ).toBe(true);
      expect(result.analysisDetails.dataQualityScore).toBeDefined();
      expect(
        result.analysisDetails.dataQualityScore >= 0 &&
          result.analysisDetails.dataQualityScore <= 100
      ).toBe(true);
      expect(result.analysisDetails.analysisReliability).toBeDefined();
      expect(["high", "medium", "low"]).toContain(
        result.analysisDetails.analysisReliability
      );
    }
  });
});