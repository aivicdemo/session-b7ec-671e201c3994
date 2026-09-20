import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as wmsModule from '../../src/services/wms-connector';

describe('SCEN-138: WMSからの進捗データ取得失敗時のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('WMSデータ取得がタイムアウト・エラーで失敗し有効キャッシュも存在しないとき、ProgressDataRetrievalFailureエラーが発生する', async () => {
    // WMS接続処理がネットワークタイムアウトで失敗するようスタブを設定
    jest.spyOn(wmsModule, 'fetchProgressDataFromWMS').mockRejectedValueOnce(
      new Error('Network timeout')
    );

    // 直前の有効キャッシュが存在しない状態をスタブで再現（キャッシュ検索が null を返す）
    jest.spyOn(wmsModule, 'getCachedProgressData').mockReturnValue(null);

    const input = {
      userId: 'user123',
      siteIds: ['site-A'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    let error: Error | null = null;
    let output: any = undefined;

    try {
      output = await monitorProgressAndDetectDelayRisk(input);
    } catch (e) {
      error = e as Error;
    }

    // ProgressDataRetrievalFailure エラーが throw されたことを検証
    expect(error).not.toBeNull();
    expect(error?.constructor.name).toBe('ProgressDataRetrievalFailure');
    expect(error?.message).toBe('進捗データの取得に失敗しました。WMS接続を確認してください。');
    
    // 出力型 MonitorProgressAndDetectDelayRiskOutput は返されず、処理は中断されたことを検証
    expect(output).toBeUndefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});