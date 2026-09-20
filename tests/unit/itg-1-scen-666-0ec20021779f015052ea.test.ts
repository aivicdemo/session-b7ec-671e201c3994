import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-666', () => {
  describe('更新日の開始日が終了日より後の場合、エラーが発生する', () => {
    it('updatedFromDateが「2024-12-31」、updatedToDateが「2024-12-01」の場合、InvalidSearchConditionErrorが発生する', async () => {
      const input = {
        proficiencyIds: undefined,
        workerIds: undefined,
        jobTypes: undefined,
        proficiencyLevels: undefined,
        evaluatedFromDate: undefined,
        evaluatedToDate: undefined,
        createdFromDate: undefined,
        createdToDate: undefined,
        updatedFromDate: '2024-12-31',
        updatedToDate: '2024-12-01',
        sortBy: undefined,
        sortOrder: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      };

      await expect(listProficienciesByCondition(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidSearchConditionError',
          message: '更新日の開始日が終了日より後になっています。',
        })
      );
    });
  });
});