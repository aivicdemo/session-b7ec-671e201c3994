import { jest } from '@jest/globals';
import {
  getAllocationPlanById,
  GetAllocationPlanByIdInput,
  GetAllocationPlanByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-782: getAllocationPlanById - DatabaseAccessError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return allocation plan details with all required fields when database query succeeds', async () => {
    const allocationPlanId = 'plan-uuid-existing';

    const result: GetAllocationPlanByIdOutput =
      await getAllocationPlanById(allocationPlanId);

    expect(result).toBeDefined();
    expect(result.allocationPlanId).toBeDefined();
    expect(typeof result.allocationPlanId).toBe('string');
    expect(result.planName).toBeDefined();
    expect(typeof result.planName).toBe('string');
    expect(result.facilityId).toBeDefined();
    expect(typeof result.facilityId).toBe('string');
    expect(result.teamId).toBeDefined();
    expect(typeof result.teamId).toBe('string');
    expect(result.workInstructionId).toBeDefined();
    expect(typeof result.workInstructionId).toBe('string');
    expect(result.allocationStartDate).toBeDefined();
    expect(typeof result.allocationStartDate).toBe('string');
    expect(result.allocationEndDate).toBeDefined();
    expect(typeof result.allocationEndDate).toBe('string');
    expect(result.estimatedWorkHours).toBeDefined();
    expect(typeof result.estimatedWorkHours).toBe('number');
    expect(result.estimatedCompletionDate).toBeDefined();
    expect(typeof result.estimatedCompletionDate).toBe('string');
    expect(result.status).toBeDefined();
    expect(typeof result.status).toBe('string');
    expect(result.createdAt).toBeDefined();
    expect(typeof result.createdAt).toBe('string');
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe('string');
    expect(result.createdBy).toBeDefined();
    expect(typeof result.createdBy).toBe('string');
  });

  it('should throw DatabaseAccessError when database connection fails', async () => {
    const invalidAllocationPlanId = 'invalid-plan-id-nonexistent';

    try {
      await getAllocationPlanById(invalidAllocationPlanId);
      fail('Should have thrown DatabaseAccessError');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('人員配置案データの取得に失敗しました。');
    }
  });

  it('should throw DatabaseAccessError when database query execution fails', async () => {
    const allocationPlanId = 'plan-uuid-query-error';

    try {
      await getAllocationPlanById(allocationPlanId);
      fail('Should have thrown DatabaseAccessError');
    } catch (error: any) {
      expect(error.name).toBe('DatabaseAccessError');
      expect(error.message).toBe('人員配置案データの取得に失敗しました。');
    }
  });
});