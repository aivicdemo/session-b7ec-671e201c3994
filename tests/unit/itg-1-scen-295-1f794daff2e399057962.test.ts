import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-295: 時間帯の開始時刻が終了時刻より後の場合のエラー処理', () => {
  it('timeRangeStartが終了時刻より後の場合、InvalidFilterConditionErrorを発生させる', async () => {
    const input = {
      userId: 'user-123',
      targetFacilityIds: ['facility-001', 'facility-002'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T08:00:00Z',
      priorityFilter: 'high' as const,
      maxResultCount: 50,
    };

    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: expect.stringContaining('フィルタ条件が無効です。拠点ID、時間帯、優先度を確認してください。'),
      })
    );
  });

  it('timeRangeStartが終了時刻と同じ場合もエラーを発生させる', async () => {
    const input = {
      userId: 'user-123',
      targetFacilityIds: ['facility-001'],
      timeRangeStart: '2024-01-15T08:00:00Z',
      timeRangeEnd: '2024-01-15T08:00:00Z',
      priorityFilter: 'all' as const,
    };

    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidFilterConditionError',
      })
    );
  });

  it('有効な時間帯の場合はエラーを発生させない', async () => {
    const input = {
      userId: 'user-123',
      targetFacilityIds: ['facility-001'],
      timeRangeStart: '2024-01-15T08:00:00Z',
      timeRangeEnd: '2024-01-15T09:00:00Z',
      priorityFilter: 'medium' as const,
      maxResultCount: 50,
    };

    const result = await extractAndRankAllocationPlansForReview(input);

    expect(result).toBeDefined();
    expect(result.allocationPlans).toBeDefined();
    expect(Array.isArray(result.allocationPlans)).toBe(true);
  });
});