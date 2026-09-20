import { listProductivityDataByCondition } from '../../src/logic/data-persistence';
import { InvalidSearchConditionError } from '../../src/logic/errors';

describe('SCEN-958: レコード作成日の検索開始日が終了日より後の場合、日付範囲エラーが発生する', () => {
  it('should throw InvalidSearchConditionError when createdFromDate is after createdToDate', async () => {
    const input = {
      productivityDataIds: undefined,
      workResultIds: undefined,
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workDateFrom: undefined,
      workDateTo: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      minQualityScore: undefined,
      maxQualityScore: undefined,
      minErrorCount: undefined,
      maxErrorCount: undefined,
      proficiencyLevels: undefined,
      createdFromDate: '2024-01-15',
      createdToDate: '2024-01-10',
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    let exceptionThrown = false;
    let caughtError: any = null;

    try {
      await listProductivityDataByCondition(input);
    } catch (error: any) {
      exceptionThrown = true;
      caughtError = error;
    }

    expect(exceptionThrown).toBe(true);
    expect(caughtError).toBeInstanceOf(InvalidSearchConditionError);
    expect(caughtError.message).toBe('検索条件の日付範囲が不正です。開始日時は終了日時以前である必要があります。');
  });
});