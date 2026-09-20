import { executeDailyBatchProcess } from '../../src/logic/daily-batch-execution';
import * as dailyBatchModule from '../../src/logic/daily-batch-execution';

describe('SCEN-157: 日次バッチ処理の前提条件チェック', () => {
  it('前日のデータ集約処理が未完了のため、バッチ実行開始時に前提条件エラーで処理が中断される', async () => {
    const mockValidateDailyBatchTriggerCondition = jest.spyOn(
      dailyBatchModule,
      'validateDailyBatchTriggerCondition' as any
    );

    mockValidateDailyBatchTriggerCondition.mockResolvedValue({
      canExecuteBatch: false,
      executionReason: 'insufficient_data_completion',
      aggregatedDataCompletionRate: 85,
    });

    const input = {
      triggerType: 'scheduled' as const,
      targetDate: '2024-01-15',
      executedByUserId: 'system_user',
      includeQualityValidation: true,
      includeAnalysisVerification: true,
    };

    await expect(executeDailyBatchProcess(input)).rejects.toThrow();
    await expect(executeDailyBatchProcess(input)).rejects.toMatchObject({
      name: 'BatchTriggerConditionNotMet',
      message: '日次バッチ処理の前提条件が満たされていません。前日のデータ集約処理の完了を確認してください。',
    });

    expect(mockValidateDailyBatchTriggerCondition).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDate: '2024-01-15',
        triggerType: 'scheduled',
      })
    );

    mockValidateDailyBatchTriggerCondition.mockRestore();
  });
});