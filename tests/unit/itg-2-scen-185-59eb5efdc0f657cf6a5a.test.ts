import { validateAggregatedPerformanceData, ValidateAggregatedPerformanceDataInput } from '../../src/logic/data-quality-validation';
import * as authModule from '../../src/logic/authentication';
import * as authzModule from '../../src/logic/authorization';
import * as repoModule from '../../src/logic/productivity-repository';

jest.mock('../../src/logic/authentication');
jest.mock('../../src/logic/authorization');
jest.mock('../../src/logic/productivity-repository');

describe('SCEN-185: 境界テスト - タイムスタンプが未来の日時である場合の例外処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('タイムスタンプが未来の日時である場合、タイムスタンプ不正の例外が throw される', async () => {
    // 現在日時より未来のタイムスタンプを動的に生成
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間後
    const futureTimestamp = futureDate.toISOString();
    
    const currentDate = '2024-01-15';
    
    const mockProductivityData = [
      {
        productivityDataId: 'PROD001',
        workerId: 'WORKER001',
        plannedWorkingHours: 8,
        actualWorkingHours: 8,
        completedCount: 100,
        productivityRate: 90,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'intermediate',
        timestamp: futureTimestamp,
        date: currentDate,
        taskType: 'assembly',
        processingTime: 480,
        errorRate: 0.02,
      },
    ];

    (authModule.authenticateUser as jest.Mock).mockResolvedValue({
      userId: 'LEADER001',
      role: 'fieldLeader',
    });

    (authzModule.authorizeUserAction as jest.Mock).mockResolvedValue(true);

    (repoModule.findProductivityDataByTeamAndPeriod as jest.Mock).mockResolvedValue(
      mockProductivityData
    );

    const input: ValidateAggregatedPerformanceDataInput = {
      aggregationPeriodStartDate: '2024-01-15',
      aggregationPeriodEndDate: '2024-01-15',
      teamId: 'TEAM001',
      fieldLeaderUserId: 'LEADER001',
      userAuthToken: 'valid_token_12345',
    };

    // モックが呼び出される際に、未来のタイムスタンプを含むデータが返されることを確認
    expect(repoModule.findProductivityDataByTeamAndPeriod).not.toHaveBeenCalled();

    try {
      await validateAggregatedPerformanceData(input);
      fail('Expected validateAggregatedPerformanceData to throw an error');
    } catch (error: unknown) {
      // モックが正しくデータを返したことを確認
      expect(repoModule.findProductivityDataByTeamAndPeriod).toHaveBeenCalled();
      const callArgs = (repoModule.findProductivityDataByTeamAndPeriod as jest.Mock).mock.calls[0];
      expect(callArgs).toBeDefined();

      // エラーが throw されたことを確認
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      
      // 仕様で指定された文言がエラーメッセージに含まれることを確認
      expect(errorMessage).toContain('タイムスタンプが不正です');
      expect(errorMessage).toContain('ハンディターミナルの日時設定を確認してください');
      
      // エラーの型が SystemProcessingError または DataAccuracyValidationFailedError であることを確認
      const errorName = (error as any).name || (error as any).constructor.name;
      expect(['SystemProcessingError', 'DataAccuracyValidationFailedError']).toContain(errorName);
      
      // 業務ルール br-tx_2-002 の制約を検証
      expect(errorName).toMatch(/^(SystemProcessingError|DataAccuracyValidationFailedError)$/);
    }
  });
});