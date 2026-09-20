import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('進捗遅延リスク常時監視 - SCEN-1546', () => {
  it('遅延リスク判定の結果から対応が必要な拠点が特定され、既存の人員配置案候補の中から対応優先度の高い順に抽出・ランク付けされる', async () => {
    // Arrange
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'user-mgr-001',
    };

    // Act
    const output = await monitorAndJudgeDelayRisk(input);

    // Assert
    // (1) judgmentIdが一意の文字列で返される
    expect(output.judgmentId).toBeDefined();
    expect(typeof output.judgmentId).toBe('string');
    expect(output.judgmentId.length).toBeGreaterThan(0);

    // (2) evaluationDateTimeが正しく返される
    expect(output.evaluationDateTime).toBe('2024-01-15T10:30:00Z');

    // (3) rankedFacilitiesが対応優先度の高い順にソートされている
    expect(output.rankedFacilities).toBeDefined();
    expect(Array.isArray(output.rankedFacilities)).toBe(true);
    expect(output.rankedFacilities.length).toBeGreaterThanOrEqual(2);

    // 最初の要素がF001で優先度最高
    expect(output.rankedFacilities[0].facilityId).toBe('F001');
    expect(output.rankedFacilities[0].priorityRank).toBe(1);
    expect(output.rankedFacilities[0].riskScore).toBeGreaterThanOrEqual(75);
    expect(output.rankedFacilities[0].riskLevel).toBe('HIGH');

    // 2番目の要素がF002
    expect(output.rankedFacilities[1].facilityId).toBe('F002');
    expect(output.rankedFacilities[1].priorityRank).toBe(2);
    expect(output.rankedFacilities[1].riskScore).toBeLessThanOrEqual(50);
    expect(output.rankedFacilities[1].riskLevel).toBe('MEDIUM');

    // rankedFacilitiesの各要素が正しいフィールドを持つ
    output.rankedFacilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(facility.riskScore).toBeDefined();
      expect(typeof facility.riskScore).toBe('number');
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(facility.riskLevel).toMatch(/^(HIGH|MEDIUM|LOW)$/);
      expect(facility.predictedDelayDays).toBeDefined();
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(facility.currentProgressRate).toBeDefined();
      expect(typeof facility.currentProgressRate).toBe('number');
      expect(facility.plannedProgressRate).toBeDefined();
      expect(typeof facility.plannedProgressRate).toBe('number');
      expect(facility.priorityRank).toBeDefined();
      expect(typeof facility.priorityRank).toBe('number');
    });

    // (4) delayReasonClassificationsが複数要素を持つ
    expect(output.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(output.delayReasonClassifications)).toBe(true);
    expect(output.delayReasonClassifications.length).toBeGreaterThanOrEqual(2);

    // F001に対応する要素を検証
    const f001Classification = output.delayReasonClassifications.find(
      (c) => c.facilityId === 'F001'
    );
    expect(f001Classification).toBeDefined();
    expect(f001Classification!.primaryDelayReason).toMatch(
      /^(INSUFFICIENT_STAFF|EFFICIENCY_DECLINE|PRIORITY_MISALIGNMENT)$/
    );
    expect(f001Classification!.insufficientStaffContribution).toBeDefined();
    expect(typeof f001Classification!.insufficientStaffContribution).toBe('number');
    expect(f001Classification!.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
    expect(f001Classification!.insufficientStaffContribution).toBeLessThanOrEqual(100);
    expect(f001Classification!.efficiencyDeclineContribution).toBeDefined();
    expect(typeof f001Classification!.efficiencyDeclineContribution).toBe('number');
    expect(f001Classification!.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
    expect(f001Classification!.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
    expect(f001Classification!.priorityMisalignmentContribution).toBeDefined();
    expect(typeof f001Classification!.priorityMisalignmentContribution).toBe('number');
    expect(f001Classification!.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
    expect(f001Classification!.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

    // 各寄与度の合計が100に正規化されている
    const totalContributionF001 =
      f001Classification!.insufficientStaffContribution +
      f001Classification!.efficiencyDeclineContribution +
      f001Classification!.priorityMisalignmentContribution;
    expect(totalContributionF001).toBe(100);

    // F002に対応する要素を検証
    const f002Classification = output.delayReasonClassifications.find(
      (c) => c.facilityId === 'F002'
    );
    expect(f002Classification).toBeDefined();
    expect(f002Classification!.primaryDelayReason).toMatch(
      /^(INSUFFICIENT_STAFF|EFFICIENCY_DECLINE|PRIORITY_MISALIGNMENT)$/
    );
    expect(f002Classification!.insufficientStaffContribution).toBeDefined();
    expect(typeof f002Classification!.insufficientStaffContribution).toBe('number');
    expect(f002Classification!.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
    expect(f002Classification!.insufficientStaffContribution).toBeLessThanOrEqual(100);
    expect(f002Classification!.efficiencyDeclineContribution).toBeDefined();
    expect(typeof f002Classification!.efficiencyDeclineContribution).toBe('number');
    expect(f002Classification!.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
    expect(f002Classification!.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
    expect(f002Classification!.priorityMisalignmentContribution).toBeDefined();
    expect(typeof f002Classification!.priorityMisalignmentContribution).toBe('number');
    expect(f002Classification!.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
    expect(f002Classification!.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

    // 各寄与度の合計が100に正規化されている
    const totalContributionF002 =
      f002Classification!.insufficientStaffContribution +
      f002Classification!.efficiencyDeclineContribution +
      f002Classification!.priorityMisalignmentContribution;
    expect(totalContributionF002).toBe(100);

    // (5) recommendedAdjustmentsが対応が必要な拠点に対してのみ提示される
    expect(output.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(output.recommendedAdjustments)).toBe(true);

    // F001に対応する要素を検証
    const f001Adjustment = output.recommendedAdjustments.find(
      (a) => a.facilityId === 'F001'
    );
    expect(f001Adjustment).toBeDefined();
    expect(f001Adjustment!.adjustmentType).toMatch(
      /^(ADD_PERSONNEL|CHANGE_PRIORITY|OPTIMIZE_PROCESS|EXTEND_DEADLINE)$/
    );
    expect(f001Adjustment!.adjustmentDescription).toBeDefined();
    expect(typeof f001Adjustment!.adjustmentDescription).toBe('string');
    expect(f001Adjustment!.adjustmentDescription.length).toBeGreaterThan(0);
    expect(f001Adjustment!.estimatedEffectiveness).toBeDefined();
    expect(typeof f001Adjustment!.estimatedEffectiveness).toBe('number');
    expect(f001Adjustment!.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
    expect(f001Adjustment!.estimatedEffectiveness).toBeLessThanOrEqual(100);
    expect(f001Adjustment!.implementationPriority).toBeDefined();
    expect(typeof f001Adjustment!.implementationPriority).toBe('number');

    // F002に対応する要素を検証
    const f002Adjustment = output.recommendedAdjustments.find(
      (a) => a.facilityId === 'F002'
    );
    if (f002Adjustment) {
      expect(f002Adjustment.adjustmentType).toMatch(
        /^(ADD_PERSONNEL|CHANGE_PRIORITY|OPTIMIZE_PROCESS|EXTEND_DEADLINE)$/
      );
      expect(f002Adjustment.adjustmentDescription).toBeDefined();
      expect(typeof f002Adjustment.adjustmentDescription).toBe('string');
      expect(f002Adjustment.adjustmentDescription.length).toBeGreaterThan(0);
      expect(f002Adjustment.estimatedEffectiveness).toBeDefined();
      expect(typeof f002Adjustment.estimatedEffectiveness).toBe('number');
      expect(f002Adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(f002Adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(f002Adjustment.implementationPriority).toBeDefined();
      expect(typeof f002Adjustment.implementationPriority).toBe('number');
    }

    // (6) hasHighRiskFacilitiesがtrueで返される
    expect(output.hasHighRiskFacilities).toBe(true);
  });
});