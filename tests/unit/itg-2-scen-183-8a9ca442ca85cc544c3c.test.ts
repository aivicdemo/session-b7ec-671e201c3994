import {
  validateAggregatedPerformanceData,
  ValidateAggregatedPerformanceDataInput,
} from '../../src/logic/data-quality-validation';

// DataCompletenessValidationFailedError をインポート
// 実装ファイルから export されている前提
class DataCompletenessValidationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataCompletenessValidationFailedError';
  }
}

jest.mock('../../src/services/auth.service');
jest.mock('../../src/repositories/productivity.repository');

describe('SCEN-183: 勤務予定作業者数が0以下の場合の例外処理', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockAuthorizeUserAction: jest.Mock;
  let mockFindProductivityDataByTeamAndPeriod: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const authService = require('../../src/services/auth.service');
    const productivityRepo = require('../../src/repositories/productivity.repository');

    mockAuthenticateUser = authService.authenticateUser = jest.fn().mockResolvedValue({
      userId: 'LEADER-001',
      role: 'fieldLeader',
      isAuthenticated: true,
    });

    mockAuthorizeUserAction = authService.authorizeUserAction = jest.fn().mockResolvedValue({
      authorized: true,
      permission: 'data_quality_validation',
    });

    mockFindProductivityDataByTeamAndPeriod = productivityRepo.findProductivityDataByTeamAndPeriod = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('勤務予定作業者数が0の場合、DataCompletenessValidationFailedError例外がthrowされる', async () => {
    const input: ValidateAggregatedPerformanceDataInput = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: '有効なトークン',
    };

    mockFindProductivityDataByTeamAndPeriod.mockResolvedValue({
      records: [
        {
          productivityDataId: 'PROD-001',
          workerId: 'WORKER-001',
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 100,
          productivityRate: 100,
          qualityScore: 95,
          errorCount: 0,
          proficiencyLevel: 'L3',
        },
      ],
      expectedWorkerCount: 0,
    });

    await expect(validateAggregatedPerformanceData(input)).rejects.toThrow(
      DataCompletenessValidationFailedError
    );

    try {
      await validateAggregatedPerformanceData(input);
      fail('例外がthrowされるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(DataCompletenessValidationFailedError);
      if (error instanceof DataCompletenessValidationFailedError) {
        expect(error.message).toBe(
          'データの完全性が不足しています。欠落フィールド数と不足件数を改善指示に含めます。'
        );
      }
    }
  });

  test('勤務予定作業者数が負の値の場合、DataCompletenessValidationFailedError例外がthrowされる', async () => {
    const input: ValidateAggregatedPerformanceDataInput = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: '有効なトークン',
    };

    mockFindProductivityDataByTeamAndPeriod.mockResolvedValue({
      records: [
        {
          productivityDataId: 'PROD-001',
          workerId: 'WORKER-001',
          plannedWorkingHours: 8,
          actualWorkingHours: 8,
          completedCount: 100,
          productivityRate: 100,
          qualityScore: 95,
          errorCount: 0,
          proficiencyLevel: 'L3',
        },
      ],
      expectedWorkerCount: -5,
    });

    await expect(validateAggregatedPerformanceData(input)).rejects.toThrow(
      DataCompletenessValidationFailedError
    );

    try {
      await validateAggregatedPerformanceData(input);
      fail('例外がthrowされるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(DataCompletenessValidationFailedError);
      if (error instanceof DataCompletenessValidationFailedError) {
        expect(error.message).toBe(
          'データの完全性が不足しています。欠落フィールド数と不足件数を改善指示に含めます。'
        );
      }
    }
  });

  test('例外がthrowされる際に、業務ルール制約が検証される', async () => {
    const input: ValidateAggregatedPerformanceDataInput = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'TEAM-001',
      fieldLeaderUserId: 'LEADER-001',
      userAuthToken: '有効なトークン',
    };

    mockFindProductivityDataByTeamAndPeriod.mockResolvedValue({
      records: [],
      expectedWorkerCount: 0,
    });

    await expect(validateAggregatedPerformanceData(input)).rejects.toThrow(
      DataCompletenessValidationFailedError
    );

    try {
      await validateAggregatedPerformanceData(input);
      fail('例外がthrowされるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(DataCompletenessValidationFailedError);
      if (error instanceof DataCompletenessValidationFailedError) {
        expect(error.message).toContain('データの完全性が不足しています');
      }
    }
  });
});