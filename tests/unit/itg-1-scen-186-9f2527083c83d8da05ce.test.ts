import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-186: AllocationPlanNotFound error handling', () => {
  it('should reject with AllocationPlanNotFoundError when allocation plan does not exist', async () => {
    const input = {
      allocationPlanId: 'plan-nonexistent',
      operatingUserId: 'user-001',
      deliveryNotes: null,
    };

    await expect(
      deliverAllocationPlanAndWorkInstructions(input)
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'AllocationPlanNotFound',
        message: expect.stringContaining(
          `人員配置案が見つからないか、承認済みではありません。配置案ID: ${input.allocationPlanId}`
        ),
      })
    );
  });

  it('should reject with AllocationPlanNotFoundError when allocation plan status is not approved', async () => {
    const input = {
      allocationPlanId: 'plan-draft-001',
      operatingUserId: 'user-001',
      deliveryNotes: 'Additional notes',
    };

    await expect(
      deliverAllocationPlanAndWorkInstructions(input)
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'AllocationPlanNotFound',
        message: expect.stringContaining(
          `人員配置案が見つからないか、承認済みではありません。配置案ID: ${input.allocationPlanId}`
        ),
      })
    );
  });

  it('should reject with AllocationPlanNotFoundError for rejected status allocation plan', async () => {
    const input = {
      allocationPlanId: 'plan-rejected-001',
      operatingUserId: 'user-001',
      deliveryNotes: null,
    };

    await expect(
      deliverAllocationPlanAndWorkInstructions(input)
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'AllocationPlanNotFound',
        message: expect.stringContaining(
          `人員配置案が見つからないか、承認済みではありません。配置案ID: ${input.allocationPlanId}`
        ),
      })
    );
  });

  it('should reject with AllocationPlanNotFoundError for in_review status allocation plan', async () => {
    const input = {
      allocationPlanId: 'plan-in-review-001',
      operatingUserId: 'user-001',
      deliveryNotes: null,
    };

    await expect(
      deliverAllocationPlanAndWorkInstructions(input)
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'AllocationPlanNotFound',
        message: expect.stringContaining(
          `人員配置案が見つからないか、承認済みではありません。配置案ID: ${input.allocationPlanId}`
        ),
      })
    );
  });
});