import { getAllocationExecutionStatusById } from '../../src/logic/data-persistence';

describe('SCEN-833: getAllocationExecutionStatusById with empty allocationExecutionStatusId', () => {
  it('should throw InvalidAllocationExecutionStatusId error when allocationExecutionStatusId is empty string', async () => {
    const input = {
      allocationExecutionStatusId: '',
    };

    await expect(getAllocationExecutionStatusById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationExecutionStatusId',
        message: '人員配置実行状況IDは必須です。',
      })
    );
  });
});