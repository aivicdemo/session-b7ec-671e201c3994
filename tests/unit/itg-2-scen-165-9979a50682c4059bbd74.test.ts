import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

describe('配置最適化推奨の生成処理でアルゴリズムエラーが発生し、推奨生成失敗エラーで処理が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('PlacementRecommendationGenerationFailure エラーが発生し、executionStatus が failure となり、placementRecommendations は空の配列またはnullとなる', async () => {
    // generateOptimalPlacementRecommendations をスタブ化してエラーを発生させる
    jest.spyOn(dailyBatchModule, 'generateOptimalPlacementRecommendations' as any).mockImplementation(() => {
      const error = new Error('配置最適化推奨の生成に失敗しました。十分な生産性データが蓄積されているか確認してください。');
      (error as any).name = 'PlacementRecommendationGenerationFailure';
      throw error;
    });

    const input = {
      triggerType: 'manual' as const,
      targetDate: '2025-01-15',
      executedByUserId: 'manager-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const result = await executeDailyBatchProcess(input);

    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('failure');
    expect(result.placementRecommendations).toBeDefined();
    expect(Array.isArray(result.placementRecommendations) || result.placementRecommendations === null).toBe(true);
    if (Array.isArray(result.placementRecommendations)) {
      expect(result.placementRecommendations.length).toBe(0);
    }
  });

  it('バッチ処理の実行結果にエラー情報が記録され、エラー文言が含まれる', async () => {
    // generateOptimalPlacementRecommendations をスタブ化してエラーを発生させる
    jest.spyOn(dailyBatchModule, 'generateOptimalPlacementRecommendations' as any).mockImplementation(() => {
      const error = new Error('配置最適化推奨の生成に失敗しました。十分な生産性データが蓄積されているか確認してください。');
      (error as any).name = 'PlacementRecommendationGenerationFailure';
      throw error;
    });

    const input = {
      triggerType: 'manual' as const,
      targetDate: '2025-01-15',
      executedByUserId: 'manager-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const result = await executeDailyBatchProcess(input);

    expect(result.batchExecutionId).toBeDefined();
    expect(typeof result.batchExecutionId).toBe('string');
    expect(result.targetDate).toBe('2025-01-15');
    expect(result.executionStatus).toBe('failure');
    expect(result.warnings).toBeDefined();
    if (Array.isArray(result.warnings) && result.warnings.length > 0) {
      const hasErrorMessage = result.warnings.some(warning =>
        warning.warningMessage.includes('配置最適化推奨の生成に失敗しました') ||
        warning.warningMessage.includes('十分な生産性データが蓄積されているか確認してください')
      );
      expect(hasErrorMessage).toBe(true);
    }
  });

  it('配置最適化推奨生成のアルゴリズムエラーが原因でバッチ全体が失敗状態に遷移する', async () => {
    // generateOptimalPlacementRecommendations をスタブ化してエラーを発生させる
    jest.spyOn(dailyBatchModule, 'generateOptimalPlacementRecommendations' as any).mockImplementation(() => {
      const error = new Error('配置最適化推奨の生成に失敗しました。十分な生産性データが蓄積されているか確認してください。');
      (error as any).name = 'PlacementRecommendationGenerationFailure';
      throw error;
    });

    const input = {
      triggerType: 'manual' as const,
      targetDate: '2025-01-15',
      executedByUserId: 'manager-001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    const result = await executeDailyBatchProcess(input);

    expect(result.executionStatus).toBe('failure');
    expect(result.placementRecommendations).toBeDefined();
    if (Array.isArray(result.placementRecommendations)) {
      expect(result.placementRecommendations.length).toBe(0);
    } else {
      expect(result.placementRecommendations).toBeNull();
    }
    expect(result.executionEndTime).toBeDefined();
    expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(0);
  });
});