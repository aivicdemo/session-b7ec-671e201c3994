import { deleteDataByConditionAndType } from '../../src/logic/data-persistence';

describe('SCEN-1140: 検索条件が空またはnullで全レコード削除を防ぐ安全装置', () => {
  it('filterConditionが空オブジェクトの場合、InvalidConditionErrorが発生する', async () => {
    const input = {
      dataType: 'worker',
      filterCondition: {},
      deletedBy: 'user123',
    };

    try {
      await deleteDataByConditionAndType(input);
      fail('InvalidConditionErrorが発生するはずです');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('削除条件が指定されていません。条件なしの全削除は許可されていません。');
    }
  });

  it('filterConditionがnullの場合、InvalidConditionErrorが発生する', async () => {
    const input = {
      dataType: 'worker',
      filterCondition: null,
      deletedBy: 'user123',
    };

    try {
      await deleteDataByConditionAndType(input);
      fail('InvalidConditionErrorが発生するはずです');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('削除条件が指定されていません。条件なしの全削除は許可されていません。');
    }
  });

  it('filterConditionがundefinedの場合、InvalidConditionErrorが発生する', async () => {
    const input = {
      dataType: 'worker',
      filterCondition: undefined,
      deletedBy: 'user123',
    };

    try {
      await deleteDataByConditionAndType(input);
      fail('InvalidConditionErrorが発生するはずです');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('削除条件が指定されていません。条件なしの全削除は許可されていません。');
    }
  });
});