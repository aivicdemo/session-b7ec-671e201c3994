import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-746: listWorkResultsByCondition - invalid defect count range', () => {
  it('should throw InvalidSearchConditionError when minDefectCount is greater than maxDefectCount', async () => {
    const input = {
      minDefectCount: 10,
      maxDefectCount: 5,
    };

    try {
      await listWorkResultsByCondition(input);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidSearchConditionError');
      expect(error.message).toBe('検索条件の日時または数値範囲が不正です。');
    }
  });
});