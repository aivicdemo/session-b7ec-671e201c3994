import { getTeamById } from '../../src/logic/data-persistence';

describe('SCEN-557: 形式が不正なチームIDで検索した場合、InvalidTeamIdFormatErrorが発生する', () => {
  describe('getTeamById', () => {
    it('特殊記号のみのチームIDで呼び出すと、InvalidTeamIdFormatErrorが発生する', async () => {
      const invalidTeamId = '@#$%';

      await expect(getTeamById({ teamId: invalidTeamId })).rejects.toThrow(
        expect.objectContaining({
          name: expect.stringMatching(/InvalidTeamIdFormatError|Error/),
          message: expect.stringContaining(`Invalid team ID format: ${invalidTeamId}`),
        })
      );
    });

    it('制御文字を含むチームIDで呼び出すと、InvalidTeamIdFormatErrorが発生する', async () => {
      const invalidTeamId = 'team\x00id';

      await expect(getTeamById({ teamId: invalidTeamId })).rejects.toThrow(
        expect.objectContaining({
          name: expect.stringMatching(/InvalidTeamIdFormatError|Error/),
          message: expect.stringContaining(`Invalid team ID format: ${invalidTeamId}`),
        })
      );
    });

    it('空文字列以外の不正形式（例：スペースのみ）のチームIDで呼び出すと、InvalidTeamIdFormatErrorが発生する', async () => {
      const invalidTeamId = '   ';

      await expect(getTeamById({ teamId: invalidTeamId })).rejects.toThrow(
        expect.objectContaining({
          name: expect.stringMatching(/InvalidTeamIdFormatError|Error/),
          message: expect.stringContaining(`Invalid team ID format: ${invalidTeamId}`),
        })
      );
    });

    it('不正形式のチームIDでエラー発生時、TeamNotFoundErrorやDatabaseAccessErrorは発生しない', async () => {
      const invalidTeamId = '!!!invalid!!!';
      let errorName: string | undefined;

      try {
        await getTeamById({ teamId: invalidTeamId });
      } catch (error: any) {
        errorName = error.name || error.constructor.name;
      }

      expect(errorName).not.toBe('TeamNotFoundError');
      expect(errorName).not.toBe('DatabaseAccessError');
      expect(errorName).toBeDefined();
    });
  });
});