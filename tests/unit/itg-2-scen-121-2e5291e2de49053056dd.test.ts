import { detectAndRetryDataTransmissionDelay } from '../../src/logic/productivity-data-collection';

// WES API呼び出しをモック化
jest.mock('node-fetch');

describe('SCEN-121: WES API呼び出しエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('WES API呼び出しが4xxエラーで返された場合、DataTransmissionAPIErrorが発生する', async () => {
    const performanceRecordId = 'perf-001';
    const transmissionStartTime = '2024-01-15T10:00:00Z';
    const maxRetryAttempts = 3;
    const retryIntervalSeconds = 5;
    const timeoutThresholdSeconds = 30;
    const delayNotificationThresholdMinutes = 5;

    // WES API呼び出しをスタブ化し、4xxエラー（400 Bad Request）で返すように設定
    const fetchModule = require('node-fetch');
    fetchModule.default = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({ error: 'Invalid request format' }),
    });

    try {
      await detectAndRetryDataTransmissionDelay({
        performanceRecordId,
        transmissionStartTime,
        maxRetryAttempts,
        retryIntervalSeconds,
        timeoutThresholdSeconds,
        delayNotificationThresholdMinutes,
      });
      fail('Expected DataTransmissionAPIError to be thrown');
    } catch (err: any) {
      expect(err.name).toBe('DataTransmissionAPIError');
      expect(err.message).toBe('WES API returned error response.');
    }
  });
});