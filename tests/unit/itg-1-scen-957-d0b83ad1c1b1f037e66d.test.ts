import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-957: 作業日の検索開始日が終了日より後の場合、日付範囲エラーが発生する', () => {
  it('workDateFromが2024-12-31、workDateToが2024-12-01の場合、InvalidSearchConditionErrorが発生する', async () => {
    const input = {
      workDateFrom: '2024-12-31',
      workDateTo: '2024-12-01',
    };

    let errorThrown = false;
    let errorInstance: any = null;

    try {
      const result = await listProductivityDataByCondition(input);
      // 出力型 ListProductivityDataByConditionOutput が返されないことを確認
      expect(result).toBeUndefined();
    } catch (error: any) {
      errorThrown = true;
      errorInstance = error;
      expect(error.name).toBe('InvalidSearchConditionError');
      expect(error.message).toBe(
        '検索条件の日付範囲が不正です。開始日時は終了日時以前である必要があります。'
      );
    }

    // エラーが発生したことを確認
    expect(errorThrown).toBe(true);
    // エラーインスタンスが存在することを確認
    expect(errorInstance).toBeDefined();
    // エラーインスタンスが ListProductivityDataByConditionOutput 型ではないことを確認
    expect(errorInstance).not.toHaveProperty('productivityDataList');
    expect(errorInstance).not.toHaveProperty('totalCount');
    expect(errorInstance).not.toHaveProperty('retrievedAt');
  });
});