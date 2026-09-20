import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1552: 進捗遅延リスク常時監視', () => {
  it('監視結果・判定結果・配置案・配信状況が集約されてダッシュボード表示用データが準備され、管理者の状況把握が支援される', async () => {
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'user123',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // 戻り値の基本構造を検証
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00Z');
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    // rankedFacilitiesの内容を検証
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    
    // 各rankedFacilityの必須フィールドを検証
    result.rankedFacilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(typeof facility.facilityName).toBe('string');
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(typeof facility.currentProgressRate).toBe('number');
      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(typeof facility.priorityRank).toBe('number');
      expect(facility.priorityRank).toBeGreaterThan(0);
    });

    // ランク付けが正しく行われているか検証（優先度が昇順）
    for (let i = 0; i < result.rankedFacilities.length - 1; i++) {
      expect(result.rankedFacilities[i].priorityRank).toBeLessThanOrEqual(
        result.rankedFacilities[i + 1].priorityRank
      );
    }

    // riskScoreが高い順にソートされているか検証
    for (let i = 0; i < result.rankedFacilities.length - 1; i++) {
      expect(result.rankedFacilities[i].riskScore).toBeGreaterThanOrEqual(
        result.rankedFacilities[i + 1].riskScore
      );
    }

    // delayReasonClassificationsの内容を検証
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
      expect([
        'INSUFFICIENT_STAFF',
        'EFFICIENCY_DECLINE',
        'PRIORITY_MISALIGNMENT',
      ]).toContain(classification.primaryDelayReason);
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(
        classification.responseUrgency
      );
    });

    // recommendedAdjustmentsの内容を検証
    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect([
        'ADD_PERSONNEL',
        'CHANGE_PRIORITY',
        'OPTIMIZE_PROCESS',
        'EXTEND_DEADLINE',
      ]).toContain(adjustment.adjustmentType);
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.adjustmentDescription.length).toBeGreaterThan(0);
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThan(0);
    });

    // hasHighRiskFacilitiesが正しく設定されているか検証
    const hasHighRiskInResult = result.rankedFacilities.some(
      (f) => f.riskLevel === 'HIGH'
    );
    expect(result.hasHighRiskFacilities).toBe(hasHighRiskInResult);

    // facilityIdsに含まれる拠点がすべて結果に含まれているか検証
    const resultFacilityIds = result.rankedFacilities.map((f) => f.facilityId);
    input.facilityIds.forEach((fid) => {
      expect(resultFacilityIds).toContain(fid);
    });

    // evaluationDateTimeが入力値と同じであることを検証
    expect(result.evaluationDateTime).toBe(input.evaluationDateTime);
  });
});