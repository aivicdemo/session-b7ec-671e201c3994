import { deleteDataByIdAndType } from '../../src/logic/data-persistence';

describe('SCEN-1135: deleteDataByIdAndType - RecordNotFoundError when record does not exist', () => {
  it('should throw RecordNotFoundError when deleting a non-existent worker record', async () => {
    const dataType = 'worker';
    const recordId = 'WORKER-999999';
    const deletedBy = 'ADMIN001';

    try {
      await deleteDataByIdAndType({
        dataType,
        recordId,
        deletedBy,
      });
      fail('Expected RecordNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('RecordNotFoundError');
      expect(error.message).toBe('削除対象のレコードが見つかりません。');
    }
  });
});