import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';

describe('SCEN-161: バッチ処理対象の物流拠点が0件のため、バッチ実行が例外で中止される', () => {
  it('should throw exception when batch processing target sites count is 0', async () => {
    const input = {
      triggerType: 'manual' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'user001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    // executeDailyBatchProcessが例外をスローすることを確認
    let exceptionThrown = false;
    let errorMessage = '';
    let result: any = undefined;

    try {
      result = await executeDailyBatchProcess(input);
      // 例外がスローされない場合、テストは失敗
    } catch (error: any) {
      exceptionThrown = true;
      errorMessage = error.message;
    }

    // 業務ルールbr-tx_2-001の制約「[throw] 対象拠点数が0件のとき」が実装されていることを確認
    expect(exceptionThrown).toBe(true);
    
    // エラーメッセージが要求されたメッセージを含むことを確認
    expect(errorMessage).toContain('バッチ処理対象の拠点がありません');
    expect(errorMessage).toContain('システム設定を確認してください');

    // executionStatus、aggregationResult、analysisResult、placementRecommendationsなどの
    // 出力フィールドが返却されないことを確認
    // 例外がスローされたため、resultは割り当てられていない
    expect(result).toBeUndefined();
  });
});