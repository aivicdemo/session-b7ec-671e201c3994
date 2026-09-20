import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';

describe('SCEN-1028: 受領日時がシステム時刻より未来であるときInvalidReceptionDateTimeErrorが発生する', () => {
  it('should throw InvalidReceptionDateTimeError when receptionDateTime is in the future', async () => {
    // システム現在時刻を基準時刻として取得する
    const baseTime = new Date();

    // 基準時刻より未来の日時を受領日時に設定する（30分後）
    const futureDate = new Date(baseTime.getTime() + 30 * 60 * 1000);
    const futureReceptionDateTime = futureDate.toISOString();

    // 入力値を構築
    const input = {
      receptionHistoryId: null,
      workInstructionId: 'valid-work-instruction-id',
      workerId: 'valid-worker-id',
      receptionDateTime: futureReceptionDateTime,
      receptionStatus: 'confirmed' as const,
      confirmationDateTime: undefined,
      deliveryMethod: 'handy_terminal' as const,
      remarks: undefined,
      createdBy: 'valid-creator-user-id',
      updatedBy: undefined,
    };

    // saveWorkInstructionReceptionHistory 処理を呼び出してエラーが発生することを確認
    let thrownError: unknown;
    try {
      await saveWorkInstructionReceptionHistory(input);
      fail('Expected InvalidReceptionDateTimeError to be thrown');
    } catch (error: unknown) {
      thrownError = error;
    }

    // エラーが発生していることを確認
    expect(thrownError).toBeDefined();

    // エラーオブジェクトを型安全に処理
    const err = thrownError as Error & { name?: string };

    // エラーの名前が InvalidReceptionDateTimeError であることを確認
    expect(err.name).toBe('InvalidReceptionDateTimeError');

    // 正確なエラーメッセージを確認
    const expectedMessage = `受領日時 '${futureReceptionDateTime}' は無効な形式またはシステム時刻より未来です。`;
    expect(err.message).toBe(expectedMessage);

    // 処理は中断され、受領履歴データはデータベースに保存されていないことを確認
    // エラーが発生することで、データベース保存処理が実行されたかどうかを間接的に検証
    // 実装が仕様通りであれば、エラーはthrowされる前に検証されるため保存されない
  });
});