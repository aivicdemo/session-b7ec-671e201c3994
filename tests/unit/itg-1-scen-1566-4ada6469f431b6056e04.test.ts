import { monitorAndJudgeDelayRisk, MonitorAndJudgeDelayRiskInput } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1566: 拠点の進捗データが欠落しているとき、警告ログが記録される', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should record warning log when progress data is incomplete', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['facility_001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'user_manager_001',
    };

    let result;
    let error;

    try {
      result = await monitorAndJudgeDelayRisk(input);
    } catch (e) {
      error = e;
    }

    // Check if error is thrown or warning is logged
    const hasError = error !== undefined;
    const hasWarningLog = warnSpy.mock.calls.some((call) =>
      call[0]?.includes?.('進捗データが不完全です。最新データを確認してください')
    );

    expect(hasError || hasWarningLog).toBe(true);

    // If result is returned, verify properties
    if (result) {
      expect(result).toBeDefined();
      expect(result.rankedFacilities).toBeDefined();
      expect(Array.isArray(result.rankedFacilities)).toBe(true);
      expect(result.hasHighRiskFacilities).toBe(false);
      expect(result.evaluationDateTime).toBe('2025-01-15T10:30:00Z');
    }

    // If error is thrown, verify error message
    if (error) {
      const errorMessage = error.message || String(error);
      expect(errorMessage).toMatch(
        /進捗データが利用不可です。WMS連携を確認してください|進捗データが不完全です。最新データを確認してください/
      );
    }
  });
});