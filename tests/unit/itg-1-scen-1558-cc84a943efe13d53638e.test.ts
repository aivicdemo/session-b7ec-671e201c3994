import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1558: 複数拠点の遅延リスク度が数値化され、対応優先度の高い順に拠点が自動ランク付けされて提示される', () => {
  it('monitorAndJudgeDelayRisk関数が複数拠点の遅延リスクを数値化し、優先度順にランク付けして返す', async () => {
    const input = {
      facilityIds: ['FACILITY_001', 'FACILITY_002', 'FACILITY_003'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T14:30:00Z',
      userId: 'USER_MONITOR_001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // (1) judgmentIdフィールドに一意の識別子が格納されている
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId.length).toBeGreaterThan(0);

    // (2) evaluationDateTimeフィールドに入力時刻が格納されている
    expect(result.evaluationDateTime).toBe('2025-01-15T14:30:00Z');

    // (3) rankedFacilitiesフィールドに3拠点分のRankedFacilityRiskInfo配列が格納され、
    // リスクスコア降順に並んでいる
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBe(3);

    // リスクスコアの降順確認
    for (let i = 0; i < result.rankedFacilities.length - 1; i++) {
      expect(result.rankedFacilities[i].riskScore).toBeGreaterThanOrEqual(
        result.rankedFacilities[i + 1].riskScore
      );
    }

    // 各拠点の必須フィールド確認
    result.rankedFacilities.forEach((facility, index) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(typeof facility.currentProgressRate).toBe('number');
      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(facility.priorityRank).toBe(index + 1);
    });

    // (4) delayReasonClassificationsフィールドに各拠点の遅延要因分類が格納されている
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThanOrEqual(3);

    result.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);

      // 寄与度の合計が100であることを確認（許容誤差0.1%）
      const total =
        classification.insufficientStaffContribution +
        classification.efficiencyDeclineContribution +
        classification.priorityMisalignmentContribution;
      expect(Math.abs(total - 100)).toBeLessThan(0.1);

      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason
      );
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification.responseUrgency);
    });

    // (5) recommendedAdjustmentsフィールドにRecommendedAdjustment配列が格納されている
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType
      );
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThan(0);
    });

    // (6) hasHighRiskFacilitiesフィールドにboolean値が格納されている
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    // hasHighRiskFacilitiesと実際のリスクスコアが一致していることを確認
    const hasHighRiskFacility = result.rankedFacilities.some((facility) => facility.riskScore >= 70);
    expect(result.hasHighRiskFacilities).toBe(hasHighRiskFacility);
  });
});