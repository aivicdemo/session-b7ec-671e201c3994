import { getWorkInstructionById } from '../../src/logic/data-persistence';

describe('SCEN-686: nullの作業指示IDを指定するとInvalidWorkInstructionIdエラーが発生する', () => {
  it('nullの作業指示IDで呼び出すとInvalidWorkInstructionIdエラーがスローされる', async () => {
    const input = {
      workInstructionId: null,
    };

    await expect(getWorkInstructionById(input as any)).rejects.toMatchObject({
      code: 'InvalidWorkInstructionId',
      message: expect.stringContaining('作業指示IDは必須です。'),
    });
  });
});