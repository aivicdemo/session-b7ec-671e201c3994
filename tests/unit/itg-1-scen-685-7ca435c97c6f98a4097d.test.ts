import { getWorkInstructionById } from '../../src/logic/data-persistence';

describe('SCEN-685: 空文字列の作業指示IDを指定するとInvalidWorkInstructionIdエラーが発生する', () => {
  it('should throw InvalidWorkInstructionId error when workInstructionId is empty string', async () => {
    const input = {
      workInstructionId: '',
    };

    await expect(getWorkInstructionById(input)).rejects.toMatchObject({
      name: 'InvalidWorkInstructionId',
      message: '作業指示IDは必須です。',
    });
  });
});