import { getWmsSyncLogById } from '../../src/logic/data-persistence';
import { GetWmsSyncLogByIdInput } from '../../src/logic/data-persistence';

describe('SCEN-1111: getWmsSyncLogById - InvalidWmsSyncLogId error on empty string', () => {
  it('should throw InvalidWmsSyncLogId error when wmsSyncLogId is empty string', async () => {
    const input: GetWmsSyncLogByIdInput = {
      wmsSyncLogId: '',
    };

    try {
      await getWmsSyncLogById(input);
      fail('Expected InvalidWmsSyncLogId error to be thrown');
    } catch (error: any) {
      expect(error.code).toBe('InvalidWmsSyncLogId');
      expect(error.message).toBe('WMS連携ログIDは必須です。');
    }
  });

  it('should not throw WmsSyncLogNotFound error when wmsSyncLogId is empty string', async () => {
    const input: GetWmsSyncLogByIdInput = {
      wmsSyncLogId: '',
    };

    try {
      await getWmsSyncLogById(input);
      fail('Expected InvalidWmsSyncLogId error to be thrown');
    } catch (error: any) {
      expect(error.code).not.toBe('WmsSyncLogNotFound');
      expect(error.message).not.toMatch(/WMS連携ログが見つかりません。/);
    }
  });
});