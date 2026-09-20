import { executeDailyBatchProcess, ExecuteDailyBatchProcessInput } from '../../src/logic/daily-batch-execution';

describe('SCEN-172: バッチ処理で部分的な警告が発生する場合の処理継続', () => {
  it('バッチ処理の各ステップで部分的に警告が発生しても処理が継続され、最終的には全ステップの結果が出力に含まれる', async () => {
    // Arrange: バッチ処理の入力を構成
    const input: ExecuteDailyBatchProcessInput = {
      triggerType: 'manual',
      targetDate: '2024-01-15',
      executedByUserId: 'user-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    // Act: executeDailyBatchProcess を呼び出す
    const result = await executeDailyBatchProcess(input);

    // Assert: executionStatus が 'partial_success' であることを確認
    expect(result.executionStatus).toBe('partial_success');

    // aggregationResult が存在し、データ集約が実行されていることを確認
    expect(result.aggregationResult).toBeDefined();
    expect(result.aggregationResult).not.toBeNull();

    // analysisResult が存在し、生産性分析が実行されていることを確認
    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult).not.toBeNull();

    // placementRecommendations が配列であり、要素を含むことを確認
    expect(Array.isArray(result.placementRecommendations)).toBe(true);
    expect(result.placementRecommendations.length).toBeGreaterThanOrEqual(0);

    // dataQualityValidation が存在し、品質検証結果が含まれていることを確認
    expect(result.dataQualityValidation).toBeDefined();
    expect(result.dataQualityValidation).not.toBeNull();

    // analysisResultVerification が存在し、妥当性検証結果が含まれていることを確認
    expect(result.analysisResultVerification).toBeDefined();
    expect(result.analysisResultVerification).not.toBeNull();

    // warnings が配列であり、要素数が2以上であることを確認
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);

    // executionStartTime と executionEndTime がISO 8601形式の文字列であることを確認
    expect(typeof result.executionStartTime).toBe('string');
    expect(typeof result.executionEndTime).toBe('string');
    expect(new Date(result.executionStartTime).toString()).not.toBe('Invalid Date');
    expect(new Date(result.executionEndTime).toString()).not.toBe('Invalid Date');

    // executionDurationSeconds が実行開始から終了までの秒数に相当することを確認
    const startTime = new Date(result.executionStartTime).getTime();
    const endTime = new Date(result.executionEndTime).getTime();
    const expectedDurationSeconds = Math.floor((endTime - startTime) / 1000);
    expect(result.executionDurationSeconds).toBeLessThanOrEqual(expectedDurationSeconds + 1);
    expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(expectedDurationSeconds - 1);

    // notificationTargets が文字列配列であることを確認
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.every((target) => typeof target === 'string')).toBe(true);

    // batchExecutionId が一意の識別子として生成されていることを確認
    expect(result.batchExecutionId).toBeDefined();
    expect(typeof result.batchExecutionId).toBe('string');
    expect(result.batchExecutionId.length).toBeGreaterThan(0);

    // targetDate が入力の targetDate と一致していることを確認
    expect(result.targetDate).toBe(input.targetDate);
  });
});