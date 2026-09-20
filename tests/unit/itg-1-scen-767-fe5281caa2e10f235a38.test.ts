import { saveAllocationPlan, SaveAllocationPlanInput } from '../../src/logic/data-persistence';

describe('SCEN-767: 予想工数が0以下の場合、InvalidWorkHoursエラーが発生する', () => {
  it('should throw InvalidWorkHours error when estimatedWorkHours is 0', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 0,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await saveAllocationPlan(input);
      fail('Expected InvalidWorkHours error to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidWorkHours');
      expect(error.message).toBe(
        '予想工数が不正です。0より大きく、チームの定員人数と配置期間から計算される最大工数以下である必要があります。'
      );
    }
  });

  it('should not save allocation plan when estimatedWorkHours is negative', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: -5,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    try {
      await saveAllocationPlan(input);
      fail('Expected InvalidWorkHours error to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('InvalidWorkHours');
      expect(error.message).toContain('予想工数が不正です');
    }
  });
});