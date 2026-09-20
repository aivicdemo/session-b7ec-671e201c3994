import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-1008: リアルタイム進捗監視と遅延検知 - 空の拠点IDエラー', () => {
  it('影響を受ける拠点IDが空の場合、対象拠点が指定されていないエラーを発生させる', async () => {
    const input = {
      userId: 'test-user-001',
      siteIds: [],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    try {
      await monitorProgressAndDetectDelayRisk(input);
      fail('エラーが発生するはずです');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).name).toBe('InvalidProgressDataFormat');
      expect((error as any).message).toBe('進捗データの形式が不正です。');
    }
  });
});