import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-135: 高リスク拠点が存在しない場合、出力のhasHighRiskFacilitiesフラグをfalseに設定する', () => {
  it('should set hasHighRiskFacilities to false when no high-risk facilities exist', async () => {
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'U001',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.hasHighRiskFacilities).toBe(false);
    expect(result.rankedFacilities).toEqual([]);
    expect(result.delayReasonClassifications).toEqual([]);
    expect(result.recommendedAdjustments).toEqual([]);
    expect(result.judgmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00Z');
  });
});