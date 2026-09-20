import {
  findAllocationChangeHistoryByPeriod,
  FindAllocationChangeHistoryByPeriodInput,
  FindAllocationChangeHistoryByPeriodOutput,
} from '../../src/logic/persistence-layer';

describe('SCEN-662: 割当変更履歴の期間検索で結果が存在しない場合', () => {
  it('should return empty results when no allocation change history exists in the specified period', async () => {
    const input: FindAllocationChangeHistoryByPeriodInput = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      requestingUserId: 'user-001',
    };

    const result: FindAllocationChangeHistoryByPeriodOutput =
      await findAllocationChangeHistoryByPeriod(input);

    expect(result.allocationChangeHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.found).toBe(false);
    expect(result.periodStartDate).toEqual(new Date('2024-01-01'));
    expect(result.periodEndDate).toEqual(new Date('2024-01-31'));
  });
});