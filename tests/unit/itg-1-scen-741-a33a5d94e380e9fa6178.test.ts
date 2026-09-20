import { listWorkResultsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-741: 作業実績データ一覧取得 - 日時範囲検証', () => {
  it('作業開始日時の開始日が終了日より後の場合、日時範囲不正エラーが発生する', async () => {
    const input = {
      actualStartFromDateTime: '2024-01-20T10:00:00Z',
      actualStartToDateTime: '2024-01-15T15:00:00Z',
      pageNumber: 1,
      pageSize: 50,
    };

    try {
      await listWorkResultsByCondition(input);
      fail('InvalidSearchConditionError should have been thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.constructor.name).toBe('InvalidSearchConditionError');
      expect(error.message).toBe('検索条件の日時または数値範囲が不正です。');
    }
  });
});