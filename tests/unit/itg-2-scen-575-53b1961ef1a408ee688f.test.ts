import { findPerformanceRecordsByPlacementPlan } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-575: findPerformanceRecordsByPlacementPlan - Unauthorized Access Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when requester lacks access rights to placement plan site and team', async () => {
    const placementPlanId = 'placement-plan-001';
    const requestingUserId = 'user-without-access';

    const unauthorizedError = new Error('この配置計画へのアクセス権がありません。');
    (unauthorizedError as any).name = 'UnauthorizedAccessError';

    jest.spyOn(persistenceLayer, 'findPerformanceRecordsByPlacementPlan').mockRejectedValueOnce(unauthorizedError);

    try {
      await findPerformanceRecordsByPlacementPlan({
        placementPlanId,
        requestingUserId,
      });
      fail('Expected UnauthorizedAccessError to be thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      const err = error as Error & { name?: string };
      expect(err.message).toBe('この配置計画へのアクセス権がありません。');
      expect(err.name).toBe('UnauthorizedAccessError');
      
      const result = error as any;
      expect(result.performanceRecords).toBeUndefined();
      expect(result.totalCount).toBeUndefined();
      expect(result.found).toBeUndefined();
      expect(result.placementPlanId).toBeUndefined();
      expect(result.placementPeriodStartDate).toBeUndefined();
      expect(result.placementPeriodEndDate).toBeUndefined();
    }
  });
});