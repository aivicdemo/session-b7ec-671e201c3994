import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-872: listAllocationExecutionStatusByCondition - 数値範囲が逆順の場合にエラーを返す', () => {
  it('minProgressRateがmaxProgressRateより大きい場合、InvalidConditionFormatErrorを返す', async () => {
    const input = {
      minProgressRate: 80,
      maxProgressRate: 20,
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('エラーが発生することを期待していましたが、正常に完了しました');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidConditionFormatError');
      expect(error.message).toContain('検索条件の形式が不正です');
      expect(error.message).toContain('日時はISO8601形式');
      expect(error.message).toContain('ページ番号は1以上');
      expect(error.message).toContain('ページサイズは1以上');
    }
  });

  it('minPlannedWorkHoursがmaxPlannedWorkHoursより大きい場合、InvalidConditionFormatErrorを返す', async () => {
    const input = {
      minPlannedWorkHours: 100,
      maxPlannedWorkHours: 50,
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('エラーが発生することを期待していましたが、正常に完了しました');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidConditionFormatError');
      expect(error.message).toContain('検索条件の形式が不正です');
    }
  });

  it('minActualWorkHoursがmaxActualWorkHoursより大きい場合、InvalidConditionFormatErrorを返す', async () => {
    const input = {
      minActualWorkHours: 200,
      maxActualWorkHours: 100,
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('エラーが発生することを期待していましたが、正常に完了しました');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidConditionFormatError');
      expect(error.message).toContain('検索条件の形式が不正です');
    }
  });

  it('日時範囲が逆順の場合、InvalidConditionFormatErrorを返す', async () => {
    const input = {
      plannedStartToDateTime: '2024-01-01T00:00:00Z',
      plannedStartFromDateTime: '2024-12-31T23:59:59Z',
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('エラーが発生することを期待していましたが、正常に完了しました');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidConditionFormatError');
      expect(error.message).toContain('検索条件の形式が不正です');
    }
  });

  it('複数の逆順条件を含む場合、InvalidConditionFormatErrorを返す', async () => {
    const input = {
      minProgressRate: 100,
      maxProgressRate: 0,
      minPlannedWorkHours: 500,
      maxPlannedWorkHours: 100,
      plannedEndToDateTime: '2024-01-01T00:00:00Z',
      plannedEndFromDateTime: '2024-12-31T23:59:59Z',
    };

    try {
      await listAllocationExecutionStatusByCondition(input);
      fail('エラーが発生することを期待していましたが、正常に完了しました');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidConditionFormatError');
      expect(error.message).toContain('検索条件の形式が不正です');
    }
  });
});