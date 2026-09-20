import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-664: listProficienciesByCondition - 評価日の開始日が終了日より後の場合', () => {
  it('should throw InvalidSearchConditionError when evaluatedFromDate is after evaluatedToDate', async () => {
    const input = {
      evaluatedFromDate: '2024-12-31',
      evaluatedToDate: '2024-12-01',
    };

    await expect(listProficienciesByCondition(input)).rejects.toMatchObject({
      name: 'InvalidSearchConditionError',
      message: '評価日の開始日が終了日より後になっています。',
    });
  });
});