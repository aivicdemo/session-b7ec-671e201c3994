import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';
import * as productivityDataCollection from '../../src/logic/productivity-data-collection';

describe('SCEN-108: WES送信遅延が許容値内のとき、transmissionStatusが"sent"で出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return transmissionStatus as "sent" when WES transmission delay is within acceptable threshold', async () => {
    const currentTime = Date.now();
    const transmissionStartTime = currentTime - 3000;
    const performanceRecordId = 'PR-' + Date.now();

    // テスト用スタブの初期化
    jest.spyOn(productivityDataCollection as any, 'validateInputData').mockReturnValue(true);
    jest.spyOn(productivityDataCollection as any, 'findWorkerById').mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
    });
    jest.spyOn(productivityDataCollection as any, 'findWorkTypeById').mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Test Work Type',
    });
    jest.spyOn(productivityDataCollection as any, 'savePerformanceRecord').mockResolvedValue({
      performanceRecordId: performanceRecordId,
      recordedAt: new Date(currentTime).toISOString(),
    });

    // WES送信遅延検知ロジックのモック設定
    jest.spyOn(productivityDataCollection as any, 'validateAndRetryRealtimeDataTransmission').mockResolvedValue({
      transmissionStartTime: transmissionStartTime,
      currentTime: currentTime,
      allowedDelayMs: 5000,
      elapsedTimeMs: 3000,
      delayDetected: false,
      action: 'proceed',
    });

    jest.spyOn(Date, 'now').mockReturnValue(currentTime);

    const input = {
      workerId: 'W001',
      workTypeId: 'WT001',
      completedQuantity: 10,
      requiredTimeMinutes: 30,
      workDate: '2024-01-15',
      departmentId: 'D001',
      teamId: 'T001',
      siteId: 'S001',
    };

    const result = await receiveAndRecordWorkPerformanceData(input);

    // 期待結果の検証
    expect(result.transmissionStatus).toBe('sent');
    expect(result.performanceRecordId).toBeDefined();
    expect(typeof result.performanceRecordId).toBe('string');
    expect(result.recordedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.recordedAt)).toBe(true);
    expect(result.cacheStatus).toBe('cached');
    expect(result.retryCount).toBeUndefined();
    expect(result.notificationSent).toBe(false);
  });
});