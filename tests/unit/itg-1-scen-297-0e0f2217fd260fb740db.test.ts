import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-297: 優先度ウェイトの合計が100%でない場合のエラー検証', () => {
  it('should throw error when priority weights do not sum to 100%', async () => {
    const userId = 'CENTER-MANAGER-001';
    const targetFacilityIds = ['FAC-001', 'FAC-002'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T17:00:00Z';
    const priorityFilter = 'high';
    const maxResultCount = 50;

    const input = {
      userId,
      targetFacilityIds,
      timeRangeStart,
      timeRangeEnd,
      priorityFilter,
      maxResultCount,
      priorityWeights: {
        deliveryRiskWeight: 30,
        productivityWeight: 30,
        skillMatchWeight: 25,
        workloadBalanceWeight: 10,
      },
    };

    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('優先度ウェイトの合計は100%である必要があります'),
      })
    );
  });
});