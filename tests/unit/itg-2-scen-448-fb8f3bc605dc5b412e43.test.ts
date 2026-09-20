import { findWorkersByClassificationAndSite } from '../../src/logic/persistence-layer';

// Mock the authorization module
jest.mock('../../src/logic/authorization', () => ({
  authorizeUserAction: jest.fn(),
}));

import { authorizeUserAction } from '../../src/logic/authorization';

describe('SCEN-448: findWorkersByClassificationAndSite - Unauthorized access error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when requesting user has no access to target site', async () => {
    const input = {
      jobType: 'JT001',
      siteId: 'SITE-999',
      operatingStatusFilter: undefined,
      requestingUserId: 'USER-UNAUTHORIZED',
    };

    // Stub authorizeUserAction to deny access
    (authorizeUserAction as jest.Mock).mockImplementation(() => {
      const error = new Error('この拠点の作業者情報にアクセスする権限がありません。');
      (error as any).name = 'UnauthorizedAccessError';
      throw error;
    });

    try {
      await findWorkersByClassificationAndSite(input);
      fail('Expected UnauthorizedAccessError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as any).name).toBe('UnauthorizedAccessError');
      expect(error.message).toBe('この拠点の作業者情報にアクセスする権限がありません。');
    }
  });
});