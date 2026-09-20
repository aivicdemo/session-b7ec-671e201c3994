import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';

describe('SCEN-112: receiveAndRecordWorkPerformanceData - null payload error handling', () => {
  it('should throw error with specific message when transmissionPayload is null', async () => {
    const nullPayload = null as any;

    await expect(
      receiveAndRecordWorkPerformanceData(nullPayload)
    ).rejects.toThrow('作業実績データが空です。ハンディターミナルの記録を確認してください');
  });

  it('should throw error with specific message when transmissionPayload is undefined', async () => {
    const undefinedPayload = undefined as any;

    await expect(
      receiveAndRecordWorkPerformanceData(undefinedPayload)
    ).rejects.toThrow('作業実績データが空です。ハンディターミナルの記録を確認してください');
  });

  it('should not return ReceiveWorkPerformanceDataOutput when payload is null', async () => {
    const nullPayload = null as any;

    try {
      await receiveAndRecordWorkPerformanceData(nullPayload);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('作業実績データが空です。ハンディターミナルの記録を確認してください');
    }
  });
});