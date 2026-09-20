import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-294: 検討対象拠点が指定されていない場合のエラー処理', () => {
  it('targetFacilityIdsが空配列の場合、InvalidFilterConditionErrorが発生する', async () => {
    const input = {
      userId: 'user-001',
      targetFacilityIds: [],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    await expect(extractAndRankAllocationPlansForReview(input)).rejects.toThrow();
  });

  it('エラーメッセージに「検討対象拠点」または「拠点ID」に関する内容が含まれる', async () => {
    const input = {
      userId: 'user-001',
      targetFacilityIds: [],
      timeRangeStart: '2025-01-15T09:00:00Z',
      timeRangeEnd: '2025-01-15T18:00:00Z',
      priorityFilter: 'all' as const,
      maxResultCount: 50,
    };

    try {
      await extractAndRankAllocationPlansForReview(input);
      fail('エラーがスローされるべき');
    } catch (error) {
      const errorMessage = (error as Error).message;
      expect(
        errorMessage.includes('検討対象拠点') ||
          errorMessage.includes('拠点ID') ||
          errorMessage.includes('フィルタ条件')
      ).toBe(true);
    }
  });
});