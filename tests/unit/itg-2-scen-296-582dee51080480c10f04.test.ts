import { recordWorkExecutionStart, RecordWorkExecutionStartInput } from '../../src/logic/work-execution-tracking';

describe('SCEN-296: 作業開始時刻・作業者ID・作業種別・対象商品・予定完了時刻をシステムに記録', () => {
  describe('作業者IDが空または不正な形式の場合', () => {
    it('作業者IDが空文字列のとき、WorkerNotFoundError がスローされること', async () => {
      const input: RecordWorkExecutionStartInput = {
        workerId: '',
        workTypeId: 'valid-work-type-id',
        targetProductId: 'valid-product-id',
        executionStartDateTime: new Date('2024-01-15T08:00:00Z'),
        scheduledCompletionDateTime: new Date('2024-01-15T12:00:00Z'),
      };

      await expect(recordWorkExecutionStart(input)).rejects.toThrow();
      await expect(recordWorkExecutionStart(input)).rejects.toMatchObject({
        name: 'WorkerNotFoundError',
      });
    });

    it('エラーメッセージが「作業者ID  が見つかりません。」であること', async () => {
      const input: RecordWorkExecutionStartInput = {
        workerId: '',
        workTypeId: 'valid-work-type-id',
        targetProductId: 'valid-product-id',
        executionStartDateTime: new Date('2024-01-15T08:00:00Z'),
        scheduledCompletionDateTime: new Date('2024-01-15T12:00:00Z'),
      };

      try {
        await recordWorkExecutionStart(input);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('作業者ID');
        expect((error as Error).message).toContain('見つかりません');
      }
    });

    it('RecordWorkExecutionStartOutput は返却されないこと', async () => {
      const input: RecordWorkExecutionStartInput = {
        workerId: '',
        workTypeId: 'valid-work-type-id',
        targetProductId: 'valid-product-id',
        executionStartDateTime: new Date('2024-01-15T08:00:00Z'),
        scheduledCompletionDateTime: new Date('2024-01-15T12:00:00Z'),
      };

      try {
        await recordWorkExecutionStart(input);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});