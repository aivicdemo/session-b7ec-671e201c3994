import { saveDelayRiskJudgment } from '../../src/logic/data-persistence';
import type { SaveDelayRiskJudgmentInput, SaveDelayRiskJudgmentOutput } from '../../src/logic/data-persistence';

describe('SCEN-972: SaveDelayRiskJudgment - isNewRecord フラグの正確な返却', () => {
  it('新規作成時は isNewRecord が true を返し、更新時は false を返す', async () => {
    const validWorkInstructionId = 'wi-001';
    const validFacilityId = 'fac-001';
    const validTeamId = 'team-001';
    const validUserId = 'user-001';
    const judgmentDateTime = new Date(Date.now() - 60000).toISOString();

    const createInput: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: validWorkInstructionId,
      facilityId: validFacilityId,
      teamId: validTeamId,
      judgmentDateTime,
      riskLevel: 'HIGH',
      delayPredictionDays: 2,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: 'Production capacity below target',
      recommendedAction: 'Allocate 3 additional workers',
      createdBy: validUserId,
    };

    const createResult = await saveDelayRiskJudgment(createInput);

    expect(createResult.isNewRecord).toBe(true);
    expect(createResult.riskJudgmentId).toBeDefined();
    expect(createResult.workInstructionId).toBe(validWorkInstructionId);
    expect(createResult.facilityId).toBe(validFacilityId);
    expect(createResult.teamId).toBe(validTeamId);
    expect(createResult.riskLevel).toBe('HIGH');
    expect(createResult.delayPredictionDays).toBe(2);
    expect(createResult.recommendedAction).toBe('Allocate 3 additional workers');
    expect(createResult.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const updateInput: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: createResult.riskJudgmentId,
      workInstructionId: validWorkInstructionId,
      facilityId: validFacilityId,
      teamId: validTeamId,
      judgmentDateTime,
      riskLevel: 'MEDIUM',
      delayPredictionDays: 1,
      progressRate: 55,
      plannedProgressRate: 60,
      judgmentReason: 'Production capacity improved after allocation',
      recommendedAction: 'Monitor progress over next 2 hours',
      updatedBy: validUserId,
      createdBy: validUserId,
    };

    const updateResult = await saveDelayRiskJudgment(updateInput);

    expect(updateResult.isNewRecord).toBe(false);
    expect(updateResult.riskJudgmentId).toBe(createResult.riskJudgmentId);
    expect(updateResult.workInstructionId).toBe(validWorkInstructionId);
    expect(updateResult.facilityId).toBe(validFacilityId);
    expect(updateResult.teamId).toBe(validTeamId);
    expect(updateResult.riskLevel).toBe('MEDIUM');
    expect(updateResult.delayPredictionDays).toBe(1);
    expect(updateResult.recommendedAction).toBe('Monitor progress over next 2 hours');
    expect(updateResult.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});