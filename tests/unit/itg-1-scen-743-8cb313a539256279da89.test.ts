import { listWorkResultsByCondition, ListWorkResultsByConditionInput } from '../../src/logic/data-persistence';
import * as validationCommonCalculation from '../../src/logic/validation-common-calculation';

describe('SCEN-743: 作業実績データ取得 - 日時範囲不正エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('作成日時の開始日が終了日より後の場合、InvalidSearchConditionErrorが発生する', async () => {
    const validateDateTimeRangeMock = jest.fn(() => {
      const error = new Error('検索条件の日時または数値範囲が不正です。');
      error.name = 'InvalidSearchConditionError';
      throw error;
    });

    jest.spyOn(validationCommonCalculation, 'validateDateTimeRange').mockImplementation(validateDateTimeRangeMock);

    const input: ListWorkResultsByConditionInput = {
      createdFromDate: '2024-01-31T23:59:59Z',
      createdToDate: '2024-01-01T00:00:00Z',
      workResultIds: undefined,
      workInstructionIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    let exceptionThrown = false;
    let caughtError: Error | null = null;
    let outputReturned: any = undefined;

    try {
      const result = await listWorkResultsByCondition(input);
      outputReturned = result;
    } catch (error) {
      exceptionThrown = true;
      caughtError = error as Error;
    }

    expect(validateDateTimeRangeMock).toHaveBeenCalled();
    expect(exceptionThrown).toBe(true);
    expect(caughtError).not.toBeNull();
    expect(caughtError?.name).toBe('InvalidSearchConditionError');
    expect(caughtError?.message).toBe('検索条件の日時または数値範囲が不正です。');
    expect(outputReturned).toBeUndefined();
    expect(typeof outputReturned).toBe('undefined');
  });
});