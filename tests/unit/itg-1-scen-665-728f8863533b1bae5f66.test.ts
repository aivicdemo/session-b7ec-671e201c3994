import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-665: 作成日の開始日が終了日より後の場合、エラーが発生する', () => {
  it('createdFromDate が createdToDate より後の場合、InvalidSearchConditionError を発生させる', async () => {
    const invalidCondition = {
      proficiencyIds: undefined,
      workerIds: undefined,
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: '2024-12-31',
      createdToDate: '2024-12-01',
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listProficienciesByCondition(invalidCondition)).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: '作成日の開始日が終了日より後になっています。',
    });
  });
});