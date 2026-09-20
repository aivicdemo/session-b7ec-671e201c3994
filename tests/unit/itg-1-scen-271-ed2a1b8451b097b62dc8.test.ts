import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-271: 優先度フィルタの値が high/medium/low/all 以外の場合、フィルタ条件が無効であることを示すエラーが返される', () => {
  it('should throw InvalidFilterConditionError when priorityFilter is invalid', async () => {
    const invalidInput = {
      userId: 'センター長001',
      targetFacilityIds: ['F001', 'F002'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T12:00:00Z',
      priorityFilter: 'invalid_priority' as any,
      maxResultCount: 50,
    };

    await expect(
      extractAndRankAllocationPlansForReview(invalidInput)
    ).rejects.toThrow('フィルタ条件が無効です。拠点ID、時間帯、優先度を確認してください。');
  });
});