import { saveProductivityData } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/utils/authorization-and-validation';

describe('SCEN-466: saveProductivityData - Unauthorized Access Error', () => {
  it('should throw UnauthorizedAccessError when requestingUser lacks permission to save productivity data', async () => {
    const input = {
      productivityDataId: 'prod-001',
      performanceRecordId: 'perf-001',
      workerId: 'worker-001',
      siteId: 'site-001',
      teamId: 'team-001',
      workDate: new Date('2024-01-15'),
      plannedWorkHours: 480,
      actualWorkHours: 500,
      completionCount: 10,
      productivityRate: 104.17,
      qualityScore: 95,
      errorCount: 1,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: null,
      createdBy: 'user-admin',
      updatedBy: undefined,
      requestingUserId: 'user-limited',
      operation: 'create' as const,
    };

    const authorizeSpy = jest.spyOn(authModule, 'authorizeUserAction').mockImplementation(() => {
      const error = new Error('この操作を実行する権限がありません。ユーザーID: user-limited');
      (error as any).name = 'UnauthorizedAccessError';
      throw error;
    });

    try {
      await saveProductivityData(input);
      fail('Expected UnauthorizedAccessError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('UnauthorizedAccessError');
      expect(error.message).toBe('この操作を実行する権限がありません。ユーザーID: user-limited');
    }

    expect(authorizeSpy).toHaveBeenCalled();
    authorizeSpy.mockRestore();
  });
});