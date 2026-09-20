import { getWmsSyncLogById } from '../../src/logic/data-persistence';

describe('SCEN-1112: getWmsSyncLogById with null wmsSyncLogId', () => {
  test('should throw InvalidWmsSyncLogId error when wmsSyncLogId is null', async () => {
    const input = {
      wmsSyncLogId: null as any,
    };

    await expect(getWmsSyncLogById(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWmsSyncLogId',
        message: 'WMS連携ログIDは必須です。',
      })
    );
  });
});