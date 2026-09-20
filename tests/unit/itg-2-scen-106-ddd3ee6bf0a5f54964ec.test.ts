import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';

describe('SCEN-106: 完了数量が負数の場合、InvalidPerformanceDataErrorを発生させる', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidPerformanceDataError when completedQuantity is negative', async () => {
    const input = {
      workerId: 'W001',
      workTypeId: 'WT001',
      completedQuantity: -5,
      requiredTimeMinutes: 30,
      workDate: '2024-01-15',
    };

    let caughtError: Error | undefined;
    try {
      await receiveAndRecordWorkPerformanceData(input);
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('InvalidPerformanceDataError');
    expect(caughtError?.message).toBe('完了数量 -5 または所要時間 30 が無効です。');
  });
});