import { saveAllocationPlan, SaveAllocationPlanInput } from '../../src/logic/data-persistence';

describe('SCEN-760: saveAllocationPlan - Required field validation', () => {
  const validInput: SaveAllocationPlanInput = {
    allocationPlanId: null,
    planName: 'Test Allocation Plan',
    facilityId: 'facility-123',
    teamId: 'team-123',
    workInstructionId: 'work-456',
    allocationStartDate: '2024-01-15',
    allocationEndDate: '2024-01-20',
    estimatedWorkHours: 40,
    estimatedCompletionDate: '2024-01-20',
    status: 'proposal',
    description: 'Test plan',
    createdBy: 'user-001',
  };

  test('should throw InvalidAllocationPlanInput error when facilityId is null', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      facilityId: null as any,
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });

  test('should throw InvalidAllocationPlanInput error when teamId is undefined', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      teamId: undefined as any,
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });

  test('should throw InvalidAllocationPlanInput error when workInstructionId is empty string', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      workInstructionId: '',
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });

  test('should throw InvalidAllocationPlanInput error when allocationStartDate is null', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      allocationStartDate: null as any,
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });

  test('should throw InvalidAllocationPlanInput error when allocationEndDate is empty string', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      allocationEndDate: '',
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });

  test('should throw InvalidAllocationPlanInput error when estimatedWorkHours is null', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      estimatedWorkHours: null as any,
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });

  test('should throw InvalidAllocationPlanInput error when status is undefined', async () => {
    const input: SaveAllocationPlanInput = {
      ...validInput,
      status: undefined as any,
    };

    await expect(saveAllocationPlan(input)).rejects.toMatchObject({
      name: 'InvalidAllocationPlanInput',
      message: expect.stringContaining('人員配置案の入力データが不正です。必須フィールド（拠点ID、チームID、作業指示ID、配置開始日、配置終了日、予想工数、ステータス）を確認してください。'),
    });
  });
});