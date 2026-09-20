import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import type {
  ExecuteDailyBatchProcessInput,
  ExecuteDailyBatchProcessOutput,
} from '../../src/logic/daily-batch-execution';

describe('SCEN-168: 手動トリガーで日次バッチ処理がすぐに開始される', () => {
  let startTime: Date;

  beforeEach(() => {
    // 前日のデータ集約処理が完了した時刻を2024-01-14T23:55:00Zに設定
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T00:00:00Z'));
    startTime = new Date();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('手動トリガーで executeDailyBatchProcess が呼び出された場合、システムは定時実行時刻に関わらず即座に日次バッチ処理を開始する', async () => {
    // Arrange
    const input: ExecuteDailyBatchProcessInput = {
      triggerType: 'manual',
      targetDate: '2024-01-15',
      executedByUserId: 'user_center_manager_001',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    // Act
    const result: ExecuteDailyBatchProcessOutput = await executeDailyBatchProcess(input);

    // Assert - 基本的な戻り値の型と存在確認
    expect(result).toBeDefined();
    expect(result.batchExecutionId).toBeDefined();
    expect(typeof result.batchExecutionId).toBe('string');
    expect(result.batchExecutionId.length).toBeGreaterThan(0);

    // Assert - executionStatus の検証
    expect(result.executionStatus).toMatch(/^(success|partial_success|failure)$/);
    expect(['success', 'partial_success']).toContain(result.executionStatus);

    // Assert - targetDate の検証
    expect(result.targetDate).toBe('2024-01-15');

    // Assert - aggregationResult の型検証
    expect(result.aggregationResult).toBeDefined();
    expect(typeof result.aggregationResult).toBe('object');

    // Assert - analysisResult の型検証
    expect(result.analysisResult).toBeDefined();
    expect(typeof result.analysisResult).toBe('object');

    // Assert - placementRecommendations の型検証
    expect(result.placementRecommendations).toBeDefined();
    expect(Array.isArray(result.placementRecommendations)).toBe(true);

    // Assert - 時刻情報の検証（ISO 8601形式）
    expect(result.executionStartTime).toBeDefined();
    expect(typeof result.executionStartTime).toBe('string');
    // ISO 8601形式の検証（例: 2024-01-15T00:00:00Z）
    expect(result.executionStartTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    expect(result.executionEndTime).toBeDefined();
    expect(typeof result.executionEndTime).toBe('string');
    expect(result.executionEndTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Assert - 実行時間の検証
    expect(result.executionDurationSeconds).toBeDefined();
    expect(typeof result.executionDurationSeconds).toBe('number');
    expect(result.executionDurationSeconds).toBeGreaterThanOrEqual(0);

    // Assert - notificationTargets の型検証
    expect(result.notificationTargets).toBeDefined();
    expect(Array.isArray(result.notificationTargets)).toBe(true);
    expect(result.notificationTargets.every((target) => typeof target === 'string')).toBe(true);

    // Assert - dataQualityValidation と analysisResultVerification はオプション
    if (result.dataQualityValidation !== null && result.dataQualityValidation !== undefined) {
      expect(typeof result.dataQualityValidation).toBe('object');
    }

    if (
      result.analysisResultVerification !== null &&
      result.analysisResultVerification !== undefined
    ) {
      expect(typeof result.analysisResultVerification).toBe('object');
    }

    // Assert - 手動トリガーであるため、呼び出し直後に実行開始されたことを確認
    // executionStartTime が呼び出し時刻の直後であることを確認
    const executionStart = new Date(result.executionStartTime);
    const timeDifference = executionStart.getTime() - startTime.getTime();
    // 手動トリガーのため、実行開始時刻は呼び出し後直後（5秒以内）であること
    expect(timeDifference).toBeLessThan(5000);
    expect(timeDifference).toBeGreaterThanOrEqual(0);

    // Assert - 定時実行時刻（午前5時）に関わらず即座に処理が開始されたことを確認
    // 手動トリガーの場合、呼び出し時刻が午前5時でなくても実行される
    expect(executionStart.getHours()).not.toBe(5);
  });
});