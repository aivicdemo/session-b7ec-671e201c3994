import { renderProductivityDashboard } from '../../src/logic/productivity-dashboard-presentation';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as persistenceModule from '../../src/logic/persistence-layer';

describe('SCEN-368: UnauthorizedAccessError when user lacks access rights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when user lacks access rights to worker data', async () => {
    // Arrange
    const userId = 'user-001';
    const workerId = 'worker-999';
    const collectionPeriodStartDate = '2025-01-01';
    const collectionPeriodEndDate = '2025-01-31';

    const unauthorizedError = new Error('このデータへのアクセス権限がありません。');
    unauthorizedError.name = 'UnauthorizedAccessError';

    jest.spyOn(authModule, 'authorizeUserAction').mockImplementation(() => {
      throw unauthorizedError;
    });

    jest.spyOn(persistenceModule, 'findWorkerById').mockResolvedValue({
      id: 'worker-999',
      name: '作業者A',
      department: '配置部門1',
    });

    // Act & Assert
    try {
      await renderProductivityDashboard({
        workerId,
        userId,
        collectionPeriodStartDate,
        collectionPeriodEndDate,
        workTypeFilter: [],
      });
      fail('Expected UnauthorizedAccessError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('UnauthorizedAccessError');
      expect(error.message).toBe('このデータへのアクセス権限がありません。');
    }

    expect(authModule.authorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        workerId,
      })
    );
  });
});