import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import { MonitorAndJudgeDelayRiskInput, MonitorAndJudgeDelayRiskOutput } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-107: 進捗乖離率計算と遅延リスク判定', () => {
  it('現在の実績進捗と計画進捗の差分から進捗乖離率を計算し、乖離率が閾値を超えている場合にリスク判定の根拠とする', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'user-001',
    };

    const output: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(output.judgmentId).toBe('JDG-20240115-001');
    expect(output.evaluationDateTime).toBe('2024-01-15T10:30:00Z');

    expect(output.rankedFacilities).toHaveLength(1);
    expect(output.rankedFacilities[0].facilityId).toBe('F001');
    expect(output.rankedFacilities[0].riskScore).toBe(35.2);
    expect(output.rankedFacilities[0].currentProgressRate).toBe(70.0);
    expect(output.rankedFacilities[0].plannedProgressRate).toBe(85.0);

    const progressGap = output.rankedFacilities[0].plannedProgressRate - output.rankedFacilities[0].currentProgressRate;
    const divergenceRate = (progressGap / output.rankedFacilities[0].plannedProgressRate) * 100;
    expect(divergenceRate).toBeCloseTo(17.65, 2);

    expect(output.delayReasonClassifications).toHaveLength(1);
    const classification = output.delayReasonClassifications[0];
    expect(classification.facilityId).toBe('F001');
    expect(classification.insufficientStaffContribution).toBe(45.0);
    expect(classification.efficiencyDeclineContribution).toBe(35.0);
    expect(classification.priorityMisalignmentContribution).toBe(20.0);
    expect(
      classification.insufficientStaffContribution +
        classification.efficiencyDeclineContribution +
        classification.priorityMisalignmentContribution
    ).toBe(100.0);
    expect(classification.primaryDelayReason).toBe('INSUFFICIENT_STAFF');

    expect(output.recommendedAdjustments.length).toBeGreaterThan(0);
    expect(output.recommendedAdjustments[0].facilityId).toBe('F001');
    expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
      output.recommendedAdjustments[0].adjustmentType
    );

    expect(output.hasHighRiskFacilities).toBe(false);
  });
});