import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1547: 抽出された対応拠点に対して、現在の進捗状況・作業者生産性・習熟度に基づいて複数の最適人員配置案が自動生成される', () => {
  it('should generate multiple optimal staffing plans for facilities with delay risk', async () => {
    // テスト初期化：進捗遅延リスク判定エンジンのテスト環境をセットアップ
    const evaluationDateTime = '2024-01-15T14:30:00Z';
    const userId = 'USR-123';

    // 入力パラメータ構築：MonitorAndJudgeDelayRiskInput型で設定
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime,
      userId,
    };

    // 対象処理呼び出し：monitorAndJudgeDelayRisk(input)を実行
    const result = await monitorAndJudgeDelayRisk(input);

    // 戻り値型の検証：MonitorAndJudgeDelayRiskOutput型の全フィールドが返却されていることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('judgmentId');
    expect(result).toHaveProperty('evaluationDateTime');
    expect(result).toHaveProperty('rankedFacilities');
    expect(result).toHaveProperty('delayReasonClassifications');
    expect(result).toHaveProperty('recommendedAdjustments');
    expect(result).toHaveProperty('hasHighRiskFacilities');

    // judgmentId検証：返却されたjudgmentIdが文字列型で、空でないことを確認
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).not.toBe('');

    // evaluationDateTime検証：返却されたevaluationDateTimeが入力値と同じISO 8601形式であることを確認
    expect(result.evaluationDateTime).toBe(evaluationDateTime);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.evaluationDateTime)).toBe(true);

    // rankedFacilities検証：返却されたrankedFacilitiesが配列型で、少なくとも1件以上のRankedFacilityRiskInfo要素を含むことを確認
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThanOrEqual(1);

    // rankedFacilities詳細検証：各RankedFacilityRiskInfo要素が必要なフィールドを含むことを確認
    result.rankedFacilities.forEach((facility) => {
      expect(typeof facility.facilityId).toBe('string');
      expect(facility.facilityId).not.toBe('');
      expect(typeof facility.facilityName).toBe('string');
      expect(facility.facilityName).not.toBe('');
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high']).toContain(facility.riskLevel);
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(typeof facility.currentProgressRate).toBe('number');
      expect(facility.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(facility.currentProgressRate).toBeLessThanOrEqual(100);
      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(facility.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(facility.plannedProgressRate).toBeLessThanOrEqual(100);
      expect(typeof facility.priorityRank).toBe('number');
      expect(facility.priorityRank).toBeGreaterThan(0);
    });

    // delayReasonClassifications検証：返却されたdelayReasonClassificationsが配列型で、複数の遅延要因分類と各寄与度を含むことを確認
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThanOrEqual(1);

    result.delayReasonClassifications.forEach((classification) => {
      expect(typeof classification.facilityId).toBe('string');
      expect(classification.facilityId).not.toBe('');
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(100);
      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

      // 各要因の寄与度が合計100%に正規化されることを検証
      const totalContribution =
        classification.insufficientStaffContribution +
        classification.efficiencyDeclineContribution +
        classification.priorityMisalignmentContribution;
      expect(totalContribution).toBeCloseTo(100, 1);

      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason,
      );
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification.responseUrgency);
    });

    // recommendedAdjustments検証：返却されたrecommendedAdjustmentsが配列型で、複数の推奨調整内容を含むことを確認
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    // recommendedAdjustments詳細検証：各推奨調整内容が必要なフィールドを含むことを確認
    result.recommendedAdjustments.forEach((adjustment) => {
      expect(typeof adjustment.facilityId).toBe('string');
      expect(adjustment.facilityId).not.toBe('');
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType,
      );
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.adjustmentDescription).not.toBe('');
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThan(0);
    });

    // hasHighRiskFacilities検証：boolean型で、rankedFacilitiesにリスクレベル'high'以上の拠点が存在する場合はtrueであることを確認
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
    const hasHighRiskFacilityInRanked = result.rankedFacilities.some((facility) => facility.riskLevel === 'high');
    expect(result.hasHighRiskFacilities).toBe(hasHighRiskFacilityInRanked);
  });
});