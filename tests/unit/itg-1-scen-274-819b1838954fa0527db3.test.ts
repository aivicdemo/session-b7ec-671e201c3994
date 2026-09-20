import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import * as allocationPlanModule from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-274: extractAndRankAllocationPlansForReview - データ取得失敗時のエラーハンドリング', () => {
  let authorizeOperationSpy: jest.SpyInstance;
  let validateDateTimeRangeSpy: jest.SpyInstance;
  let listAllocationPlansByConditionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return DataRetrievalError when data retrieval fails', async () => {
    // Stub化: authorizeOperation - ユーザーが物流センター長権限を持つと返す
    authorizeOperationSpy = jest.spyOn(allocationPlanModule as any, 'authorizeOperation')
      .mockResolvedValue(true);

    // Stub化: validateDateTimeRange - 入力の時間帯が有効と返す
    validateDateTimeRangeSpy = jest.spyOn(allocationPlanModule as any, 'validateDateTimeRange')
      .mockResolvedValue(true);

    // Stub化: listAllocationPlansByCondition - データ取得失敗時に例外をスロー
    const dataRetrievalError = new Error('データ取得に失敗しました。システム管理者に連絡してください。');
    (dataRetrievalError as any).name = 'DataRetrievalError';

    listAllocationPlansByConditionSpy = jest.spyOn(allocationPlanModule as any, 'listAllocationPlansByCondition')
      .mockRejectedValue(dataRetrievalError);

    const input = {
      userId: 'user-001',
      targetFacilityIds: ['FAC-001', 'FAC-002'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T17:00:00Z',
      priorityFilter: 'high' as const,
      maxResultCount: 50,
    };

    // 呼び出し: extractAndRankAllocationPlansForReview を実行
    await expect(extractAndRankAllocationPlansForReview(input))
      .rejects
      .toMatchObject({
        name: 'DataRetrievalError',
        message: 'データ取得に失敗しました。システム管理者に連絡してください。',
      });

    // 各スタブが呼ばれたことを確認
    expect(authorizeOperationSpy).toHaveBeenCalledWith(input.userId, expect.any(String));
    expect(validateDateTimeRangeSpy).toHaveBeenCalledWith(input.timeRangeStart, input.timeRangeEnd);
    expect(listAllocationPlansByConditionSpy).toHaveBeenCalled();
  });
});