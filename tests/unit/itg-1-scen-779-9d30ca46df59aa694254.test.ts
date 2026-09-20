import { getAllocationPlanById } from '../../src/logic/data-persistence';

describe('SCEN-779: getAllocationPlanById with null allocationPlanId', () => {
  it('should throw InvalidAllocationPlanId error when allocationPlanId is null', async () => {
    const input = {
      allocationPlanId: null as any,
    };

    await expect(getAllocationPlanById(input)).rejects.toMatchObject({
      code: 'InvalidAllocationPlanId',
      message: '人員配置案IDは必須です。',
    });
  });
});