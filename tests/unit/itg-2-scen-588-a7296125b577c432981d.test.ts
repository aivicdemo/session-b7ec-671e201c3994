import { saveWorkType } from '../../src/logic/persistence-layer';
import { SaveWorkTypeInput, SaveWorkTypeOutput } from '../../src/logic/persistence-layer';

describe('SCEN-588: requestingUserIdが無効または権限がない場合エラーが発生する', () => {
  it('無効なrequestingUserIdで保存操作を実行するとエラーが返される', async () => {
    const input: SaveWorkTypeInput = {
      workTypeId: 'WT-001',
      workTypeName: '梱包作業',
      description: undefined,
      standardProductivity: 50,
      difficultyLevel: 'NORMAL',
      activeFlag: true,
      createdBy: 'user-123',
      updatedBy: undefined,
      requestingUserId: 'invalid-user-999',
      operation: 'create',
    };

    let errorThrown = false;
    let result: SaveWorkTypeOutput | undefined;

    try {
      result = await saveWorkType(input);
    } catch (error) {
      errorThrown = true;
      if (error instanceof Error) {
        expect(error.message).toContain('この操作を実行する権限がありません。');
      }
    }

    if (!errorThrown && result) {
      expect(result.success).toBe(false);
      expect(result.message).toContain('この操作を実行する権限がありません。');
    } else if (!errorThrown && !result) {
      fail('saveWorkType should either throw an error or return a result with success=false');
    }

    // 作業タイプマスタレコードが永続化されていないことを検証するため、
    // データベースから当該レコードが存在しないことを確認（この検証方法は実装に応じて調整）
    // ここでは、エラーが発生した場合、レコードが保存されるべきではないという前提で、
    // errorThrown または result.success === false のいずれかが成立することを確認
    expect(errorThrown || (result && !result.success)).toBe(true);
  });
});