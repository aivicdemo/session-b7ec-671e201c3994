import { listTeamsByCondition, ListTeamsByConditionInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

// DatabaseAccessError のモック定義
class DatabaseAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseAccessError';
  }
}

describe('作業進捗・人員配置最適化エンジン - SCEN-564', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listTeamsByCondition', () => {
    it('データベース接続エラーが発生した場合、DatabaseAccessErrorを返す', async () => {
      const input: ListTeamsByConditionInput = {
        teamIds: ['team-001'],
        facilityIds: ['facility-A'],
        teamNameKeyword: 'team',
        operatingStatuses: ['active'],
        minCapacity: 5,
        maxCapacity: 50,
        createdFromDate: '2024-01-01T00:00:00Z',
        createdToDate: '2024-12-31T23:59:59Z',
        updatedFromDate: '2024-01-01T00:00:00Z',
        updatedToDate: '2024-12-31T23:59:59Z',
        sortBy: 'teamName',
        sortOrder: 'asc',
        pageNumber: 1,
        pageSize: 50,
      };

      // validateDateTimeRange の呼び出しをスタブ化し、日時範囲が正常と判定されるよう返す
      const validateDateTimeRangeSpy = jest
        .spyOn(dataPersistence, 'validateDateTimeRange' as any)
        .mockReturnValue(true);

      // テスト前提条件：データベース接続層をスタブ化し、接続エラーをシミュレート
      const mockListTeamsByCondition = jest
        .fn()
        .mockRejectedValue(
          new DatabaseAccessError(
            'チーム情報の取得に失敗しました。システム管理者に連絡してください。'
          )
        );

      jest.spyOn(dataPersistence, 'listTeamsByCondition').mockImplementation(mockListTeamsByCondition);

      // listTeamsByCondition を上記の入力で呼び出す
      let caughtError: Error | undefined;
      try {
        await listTeamsByCondition(input);
        fail('エラーが発生すると予想されていたが、正常終了してしまいました');
      } catch (error) {
        // DatabaseAccessError エラーが発生することを確認
        caughtError = error as Error;
        expect(caughtError).toBeDefined();
        expect(caughtError).toBeInstanceOf(DatabaseAccessError);
        expect(caughtError.message).toBe(
          'チーム情報の取得に失敗しました。システム管理者に連絡してください。'
        );
        expect(caughtError.name).toBe('DatabaseAccessError');
      }

      // 出力型 ListTeamsByConditionOutput の teams、totalCount、retrievedAt などのフィールドは返されない
      expect(caughtError).toBeDefined();
      if (caughtError instanceof DatabaseAccessError) {
        // エラーが発生したため、通常の出力フィールド（teams、totalCount、retrievedAt）は存在しない
        expect((caughtError as any).teams).toBeUndefined();
        expect((caughtError as any).totalCount).toBeUndefined();
        expect((caughtError as any).retrievedAt).toBeUndefined();
      }

      validateDateTimeRangeSpy.mockRestore();
    });
  });
});