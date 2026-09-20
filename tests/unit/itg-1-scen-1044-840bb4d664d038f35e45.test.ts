import { getWorkInstructionReceptionHistoryById } from '../../src/logic/data-persistence';

describe('SCEN-1044: undefinedの受領履歴IDで照会するとエラーが発生する', () => {
  it('receptionHistoryId に undefined を指定した場合、InvalidReceptionHistoryId エラーが発生する', async () => {
    const invalidReceptionHistoryId = undefined as any;

    await expect(
      getWorkInstructionReceptionHistoryById({
        receptionHistoryId: invalidReceptionHistoryId,
      })
    ).rejects.toMatchObject({
      name: 'InvalidReceptionHistoryId',
      message: 'Reception history ID must not be empty or null.',
    });
  });
});