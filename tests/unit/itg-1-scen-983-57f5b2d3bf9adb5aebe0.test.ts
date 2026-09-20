import { saveDelayRiskJudgment, SaveDelayRiskJudgmentInput, SaveDelayRiskJudgmentOutput } from '../../src/logic/data-persistence';

describe('SCEN-983: saveDelayRiskJudgment with undefined updatedBy', () => {
  it('should successfully save new delay risk judgment when updatedBy is null', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      judgmentDateTime: '2025-01-15T09:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 3,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: '人員不足',
      recommendedAction: '作業者追加',
      actionStatus: '未対応',
      createdBy: 'user-001',
      updatedBy: null,
    };

    const result: SaveDelayRiskJudgmentOutput = await saveDelayRiskJudgment(input);

    expect(result).toBeDefined();
    expect(result.riskJudgmentId).toBeTruthy();
    expect(typeof result.riskJudgmentId).toBe('string');
    expect(result.riskJudgmentId.length).toBeGreaterThan(0);

    expect(result.workInstructionId).toBe('WI-001');
    expect(result.facilityId).toBe('F-001');
    expect(result.teamId).toBe('T-001');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.delayPredictionDays).toBe(3);
    expect(result.recommendedAction).toBe('作業者追加');

    expect(result.savedAt).toBeTruthy();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThan(0);
    expect(savedAtDate.toISOString()).toBe(result.savedAt);

    expect(result.isNewRecord).toBe(true);
  });

  it('should successfully save new delay risk judgment when updatedBy is undefined', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-002',
      facilityId: 'F-002',
      teamId: 'T-002',
      judgmentDateTime: '2025-01-15T10:00:00Z',
      riskLevel: 'MEDIUM',
      delayPredictionDays: 1,
      progressRate: 50,
      plannedProgressRate: 60,
      judgmentReason: '進捗遅延',
      recommendedAction: '優先度調整',
      actionStatus: '未対応',
      createdBy: 'user-002',
      updatedBy: undefined,
    };

    const result: SaveDelayRiskJudgmentOutput = await saveDelayRiskJudgment(input);

    expect(result).toBeDefined();
    expect(result.riskJudgmentId).toBeTruthy();
    expect(result.isNewRecord).toBe(true);
    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.delayPredictionDays).toBe(1);
  });

  it('should preserve all input fields except updatedBy in the saved record', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-003',
      facilityId: 'F-003',
      teamId: 'T-003',
      judgmentDateTime: '2025-01-15T11:15:00Z',
      riskLevel: 'LOW',
      delayPredictionDays: 0,
      progressRate: 75,
      plannedProgressRate: 70,
      judgmentReason: '順調に進行中',
      recommendedAction: 'なし',
      actionStatus: '完了',
      createdBy: 'user-003',
      updatedBy: null,
    };

    const result: SaveDelayRiskJudgmentOutput = await saveDelayRiskJudgment(input);

    expect(result.workInstructionId).toBe(input.workInstructionId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.riskLevel).toBe(input.riskLevel);
    expect(result.delayPredictionDays).toBe(input.delayPredictionDays);
    expect(result.recommendedAction).toBe(input.recommendedAction);
  });
});