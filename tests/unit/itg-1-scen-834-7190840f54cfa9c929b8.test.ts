import { getAllocationExecutionStatusById } from '../../src/logic/data-persistence';

describe('SCEN-834: 人員配置実行状況IDがnullの場合の検証', () => {
  it('allocationExecutionStatusIdがnullの場合、InvalidAllocationExecutionStatusIdエラーをスローする', async () => {
    const input = {
      allocationExecutionStatusId: null as any,
    };

    await expect(getAllocationExecutionStatusById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidAllocationExecutionStatusIdError',
        message: '人員配置実行状況IDは必須です。',
      })
    );
  });
});