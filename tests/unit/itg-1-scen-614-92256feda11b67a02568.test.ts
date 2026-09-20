import { listWorkersByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-614', () => {
  describe('作成日時の開始日が終了日より後ろである場合、InvalidSearchConditionErrorが発生する', () => {
    it('createdFromDateが終了日より後ろの場合、InvalidSearchConditionErrorを発生させる', async () => {
      const input = {
        workerIds: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        workerNameKeyword: undefined,
        jobTypes: undefined,
        operatingStatuses: undefined,
        minHourlyRate: undefined,
        maxHourlyRate: undefined,
        minMaxWorkingHours: undefined,
        maxMaxWorkingHours: undefined,
        createdFromDate: '2024-12-31',
        createdToDate: '2024-12-01',
        updatedFromDate: undefined,
        updatedToDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      };

      await expect(listWorkersByCondition(input)).rejects.toThrow();
      await expect(listWorkersByCondition(input)).rejects.toMatchObject({
        name: 'InvalidSearchConditionError',
        message: expect.stringContaining('検索条件の日付範囲が不正です'),
      });
    });

    it('エラーメッセージが正確に一致することを確認する', async () => {
      const input = {
        workerIds: null,
        facilityIds: null,
        teamIds: null,
        workerNameKeyword: null,
        jobTypes: null,
        operatingStatuses: null,
        minHourlyRate: null,
        maxHourlyRate: null,
        minMaxWorkingHours: null,
        maxMaxWorkingHours: null,
        createdFromDate: '2024-12-31',
        createdToDate: '2024-12-01',
        updatedFromDate: null,
        updatedToDate: null,
        sortBy: null,
        sortOrder: null,
        pageNumber: null,
        pageSize: null,
      };

      try {
        await listWorkersByCondition(input);
        fail('例外が発生するはずです');
      } catch (error: any) {
        expect(error.message).toBe('検索条件の日付範囲が不正です。開始日時は終了日時以前である必要があります。');
      }
    });

    it('エラー発生時はデータが返されない', async () => {
      const input = {
        workerIds: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        workerNameKeyword: undefined,
        jobTypes: undefined,
        operatingStatuses: undefined,
        minHourlyRate: undefined,
        maxHourlyRate: undefined,
        minMaxWorkingHours: undefined,
        maxMaxWorkingHours: undefined,
        createdFromDate: '2024-12-31',
        createdToDate: '2024-12-01',
        updatedFromDate: undefined,
        updatedToDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      };

      await expect(listWorkersByCondition(input)).rejects.toThrow('検索条件の日付範囲が不正です。開始日時は終了日時以前である必要があります。');
    });
  });
});