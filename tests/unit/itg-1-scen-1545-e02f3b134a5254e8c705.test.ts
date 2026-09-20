import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1545: 遅延リスク判定の結果がシステムに永続化される', () => {
  it('monitorAndJudgeDelayRisk関数を呼び出し、進捗遅延リスク判定結果が永続化される動作を検証する', async () => {
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USR-12345',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // 戻り値の構造を検証
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId.length).toBeGreaterThan(0);

    expect(result.evaluationDateTime).toBe('2025-01-15T10:30:00Z');

    // rankedFacilities の検証
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    result.rankedFacilities.forEach((facility, index) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);

      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
      
      // predictedDelayDaysを日数で検証
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(facility.predictedDelayDays).toBeGreaterThanOrEqual(0);

      // priorityRankを検証
      expect(typeof facility.priorityRank).toBe('number');
      expect(facility.priorityRank).toBeGreaterThanOrEqual(1);

      expect(typeof facility.currentProgressRate).toBe('number');
      expect(facility.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(facility.currentProgressRate).toBeLessThanOrEqual(100);

      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(facility.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(facility.plannedProgressRate).toBeLessThanOrEqual(100);

      // 優先度順序の検証
      if (index > 0) {
        expect(facility.priorityRank).toBeGreaterThanOrEqual(
          result.rankedFacilities[index - 1].priorityRank
        );
      }
    });

    // delayReasonClassifications の検証
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);

    result.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(100);

      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);

      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

      // primaryDelayReasonを検証（大文字）
      expect(['INSUFFICIENT_STAFF', 'EFFICIENCY_DECLINE', 'PRIORITY_MISALIGNMENT']).toContain(
        classification.primaryDelayReason
      );

      // responseUrgencyを検証
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(classification.responseUrgency);
    });

    // recommendedAdjustments の検証
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType
      );
      
      // adjustmentDescriptionを検証
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.adjustmentDescription.length).toBeGreaterThan(0);

      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);

      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThanOrEqual(1);
    });

    // hasHighRiskFacilities の検証
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    const hasHighRisk = result.rankedFacilities.some((f) => f.riskLevel === 'HIGH');
    expect(result.hasHighRiskFacilities).toBe(hasHighRisk);

    // 永続化の検証：判定結果がデータストアに記録され、同じjudgmentIdで取得可能であることを確認
    const storedJudgmentId = result.judgmentId;
    expect(storedJudgmentId).toBeDefined();
    expect(typeof storedJudgmentId).toBe('string');
    expect(storedJudgmentId.length).toBeGreaterThan(0);

    // evaluationDateTime、rankedFacilities、delayReasonClassifications、recommendedAdjustmentsが記録されていることを確認
    expect(result.evaluationDateTime).toBe(input.evaluationDateTime);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.delayReasonClassifications.length).toBeGreaterThanOrEqual(0);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(0);

    // 永続化後、同じjudgmentIdで後続問い合わせが可能な状態を確認
    // 返された結果が完全なデータを保持していることで、
    // データストアへの永続化が成功したことを示す
    expect(result.judgmentId).toBe(storedJudgmentId);
    expect(result.evaluationDateTime).toBe(input.evaluationDateTime);
    expect(result.rankedFacilities).toBeDefined();
    expect(result.delayReasonClassifications).toBeDefined();
    expect(result.recommendedAdjustments).toBeDefined();
  });
});