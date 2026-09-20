import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import { UnauthorizedAccessError } from '../../src/errors/UnauthorizedAccessError';

jest.mock('../../src/logic/auth-authorization-audit.ts', () => ({
  authorizeOperation: jest.fn(),
}));

import { authorizeOperation } from '../../src/logic/auth-authorization-audit';

describe('extractAndRankAllocationPlansForReview - Authorization Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when user does not have logistics center manager permission', async () => {
    const userId = 'user-without-permission';
    const targetFacilityIds = ['facility-1', 'facility-2'];
    const timeRangeStart = '2024-01-01T00:00:00Z';
    const timeRangeEnd = '2024-01-31T23:59:59Z';
    const priorityFilter = 'all';

    (authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: false,
      reason: '物流センター長権限がありません',
    });

    await expect(
      extractAndRankAllocationPlansForReview({
        userId,
        targetFacilityIds,
        timeRangeStart,
        timeRangeEnd,
        priorityFilter,
      })
    ).rejects.toThrow(UnauthorizedAccessError);

    await expect(
      extractAndRankAllocationPlansForReview({
        userId,
        targetFacilityIds,
        timeRangeStart,
        timeRangeEnd,
        priorityFilter,
      })
    ).rejects.toThrow('この操作を実行する権限がありません。');
  });
});