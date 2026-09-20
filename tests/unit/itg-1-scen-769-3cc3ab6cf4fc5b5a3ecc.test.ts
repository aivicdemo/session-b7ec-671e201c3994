import { saveAllocationPlan } from '../../src/logic/data-persistence';

describe('SCEN-769: saveAllocationPlan - Invalid Status Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidStatus error when status is not a defined value', async () => {
    const input = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: 'pending_review',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    await expect(saveAllocationPlan(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidStatus',
        message: '配置案ステータスが不正です。定義済みのステータス値を指定してください。',
      })
    );
  });

  it('should throw InvalidStatus error with alternative invalid status value', async () => {
    const input = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '完了予定',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    await expect(saveAllocationPlan(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidStatus',
        message: '配置案ステータスが不正です。定義済みのステータス値を指定してください。',
      })
    );
  });

  it('should not create database record when InvalidStatus error is thrown', async () => {
    const input = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: 'invalid_status',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await saveAllocationPlan(input);
    } catch (error) {
      expect(error).toHaveProperty('name', 'InvalidStatus');
    }
  });
});