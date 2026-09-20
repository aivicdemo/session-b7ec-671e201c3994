import { saveAllocationPlan } from '../../src/logic/data-persistence';

describe('SCEN-761: SaveAllocationPlan with Invalid Date Format', () => {
  it('should raise InvalidAllocationPlanInputError when allocationStartDate is not in ISO 8601 format', async () => {
    const invalidInput = {
      allocationPlanId: null,
      planName: 'Test Allocation Plan',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workInstructionId: 'instruction-001',
      allocationStartDate: '2024/01/15', // Invalid format (slash-separated instead of ISO 8601)
      allocationEndDate: '2024-01-20', // Valid ISO 8601 format
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-25',
      status: 'proposal',
      description: 'Test description',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    let errorThrown: any;
    try {
      await saveAllocationPlan(invalidInput);
    } catch (error) {
      errorThrown = error;
    }

    expect(errorThrown).toBeDefined();
    expect(errorThrown.name).toBe('InvalidAllocationPlanInputError');
    expect(errorThrown.message).toBe(
      '人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'
    );
  });
});