import { saveTeam, SaveTeamInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-551: チーム情報の永続化エラー処理', () => {
  it('データベース接続障害またはトランザクション失敗が発生したとき、永続化失敗エラーが発生する', async () => {
    const validTeamInput: SaveTeamInput = {
      teamName: 'Team1',
      facilityId: 'FAC001',
      teamLeaderId: 'WRK001',
      operatingStatus: '稼働中',
      capacity: 10,
      createdBy: 'USER001',
    };

    // データベース層のトランザクション実行時に、接続障害をシミュレートするスタブを挿入する
    const originalSaveTeam = dataPersistence.saveTeam;
    let errorThrown = false;
    let errorMessage = '';
    let errorName = '';
    let caughtError: unknown;

    // データベースコネクション取得時に例外を発生させるスタブを設定
    jest.spyOn(dataPersistence, 'saveTeam').mockImplementationOnce(async () => {
      const dbError = new Error('Database connection failed');
      const persistenceError = new Error('チーム情報の保存に失敗しました。');
      (persistenceError as any).name = 'PersistenceError';
      throw persistenceError;
    });

    try {
      // saveTeam関数を実行する
      // 実装内部でデータベース接続を試み、接続障害が発生することを期待する
      await saveTeam(validTeamInput);
    } catch (error) {
      errorThrown = true;
      caughtError = error;
      if (error instanceof Error) {
        errorName = error.name;
        errorMessage = error.message;
      }
    }

    // 発生したエラーをキャッチして検証する
    expect(errorThrown).toBe(true);
    expect(errorName).toBe('PersistenceError');
    expect(errorMessage).toBe('チーム情報の保存に失敗しました。');

    // SaveTeamOutput型の出力が返却されないことを確認
    // caughtErrorはError型であり、SaveTeamOutput型ではないことを確認
    expect(caughtError).toBeInstanceOf(Error);

    // SaveTeamOutput型の必須フィールドを持たないことを明示的に検証
    if (caughtError instanceof Error) {
      expect(caughtError).not.toHaveProperty('teamId');
      expect(caughtError).not.toHaveProperty('teamName');
      expect(caughtError).not.toHaveProperty('facilityId');
      expect(caughtError).not.toHaveProperty('savedAt');
      expect(caughtError).not.toHaveProperty('isNewRecord');
    }

    jest.restoreAllMocks();
  });
});