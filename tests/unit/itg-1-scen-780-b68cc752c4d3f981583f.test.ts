import { getAllocationPlanById } from '../../src/logic/data-persistence';

describe('SCEN-780: 指定された人員配置案IDがデータベースに存在しない場合、AllocationPlanNotFoundエラーが発生する', () => {
  it('should throw AllocationPlanNotFound error when allocation plan ID does not exist', async () => {
    const input = {
      allocationPlanId: 'nonexistent-plan-999',
    };

    await expect(getAllocationPlanById(input)).rejects.toThrow('人員配置案ID nonexistent-plan-999 は見つかりません。');
  });

  it('should throw an error with AllocationPlanNotFound name', async () => {
    const input = {
      allocationPlanId: 'nonexistent-plan-999',
    };

    try {
      await getAllocationPlanById(input);
      fail('Expected getAllocationPlanById to throw an error');
    } catch (error) {
      expect((error as Error).name).toBe('AllocationPlanNotFound');
    }
  });
});