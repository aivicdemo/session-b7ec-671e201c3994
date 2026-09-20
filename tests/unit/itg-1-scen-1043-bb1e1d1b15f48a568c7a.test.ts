import { getWorkInstructionReceptionHistoryById } from '../../src/logic/data-persistence';

describe('SCEN-1043: getWorkInstructionReceptionHistoryById', () => {
  it('should throw InvalidReceptionHistoryId error when receptionHistoryId is null', async () => {
    const input = {
      receptionHistoryId: null as any,
    };

    await expect(
      getWorkInstructionReceptionHistoryById(input)
    ).rejects.toMatchObject({
      code: 'InvalidReceptionHistoryId',
      message: 'Reception history ID must not be empty or null.',
    });
  });
});