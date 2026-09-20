import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-054: 過去実績データの遡及日数が指定されない場合、デフォルトの90日が適用される', () => {
  let mockAiClient: jest.Mocked<Tx5Imp1AiClient>;
  let findProductivityDataByWorkerIdsCallArgs: Array<{
    workerIds: string[];
    lookbackDays: number;
    siteId: string;
  }>;

  beforeEach(() => {
    findProductivityDataByWorkerIdsCallArgs = [];

    mockAiClient = {
      validateInputData: jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
      }),
      authenticateUser: jest.fn().mockResolvedValue({
        isAuthenticated: true,
        userId: 'ADMIN-001',
        role: 'admin',
      }),
      authorizeUserAction: jest.fn().mockResolvedValue({
        isAuthorized: true,
        userId: 'ADMIN-001',
        action: 'generate_initial_assignment',
      }),
      findWorkersByClassificationAndSite: jest.fn().mockResolvedValue({
        workers: [
          {
            workerId: 'W002',
            workerName: '既存者1',
            jobClassification: '仕分け作業',
            siteId: 'SITE-001',
          },
          {
            workerId: 'W003',
            workerName: '既存者2',
            jobClassification: '仕分け作業',
            siteId: 'SITE-001',
          },
          {
            workerId: 'W004',
            workerName: '既存者3',
            jobClassification: '仕分け作業',
            siteId: 'SITE-001',
          },
          {
            workerId: 'W005',
            workerName: '既存者4',
            jobClassification: '仕分け作業',
            siteId: 'SITE-001',
          },
          {
            workerId: 'W006',
            workerName: '既存者5',
            jobClassification: '仕分け作業',
            siteId: 'SITE-001',
          },
        ],
      }),
      findProductivityDataByWorkerIds: jest.fn(async (workerIds, lookbackDays, siteId) => {
        findProductivityDataByWorkerIdsCallArgs.push({
          workerIds,
          lookbackDays,
          siteId,
        });
        return {
          productivityData: [
            {
              workerId: 'W002',
              averageProductivityRate: 95,
              workTypePreferences: ['仕分け', '検品'],
              pastPerformanceMetrics: {
                averageCompletionTime: 120,
                qualityScore: 4.5,
                errorRate: 0.02,
              },
            },
            {
              workerId: 'W003',
              averageProductivityRate: 88,
              workTypePreferences: ['仕分け'],
              pastPerformanceMetrics: {
                averageCompletionTime: 135,
                qualityScore: 4.2,
                errorRate: 0.05,
              },
            },
            {
              workerId: 'W004',
              averageProductivityRate: 92,
              workTypePreferences: ['仕分け', '梱包'],
              pastPerformanceMetrics: {
                averageCompletionTime: 125,
                qualityScore: 4.4,
                errorRate: 0.03,
              },
            },
            {
              workerId: 'W005',
              averageProductivityRate: 85,
              workTypePreferences: ['仕分け'],
              pastPerformanceMetrics: {
                averageCompletionTime: 145,
                qualityScore: 4.0,
                errorRate: 0.07,
              },
            },
            {
              workerId: 'W006',
              averageProductivityRate: 90,
              workTypePreferences: ['仕分け', '検品'],
              pastPerformanceMetrics: {
                averageCompletionTime: 130,
                qualityScore: 4.3,
                errorRate: 0.04,
              },
            },
          ],
        };
      }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.fn().mockResolvedValue({
        peerProductivityPatterns: [
          {
            patternName: 'High Performer',
            description: '高生産性グループ',
            averageProductivityRate: 93.5,
            strengthWorkTypes: ['仕分け', '検品'],
          },
          {
            patternName: 'Standard Performer',
            description: '標準生産性グループ',
            averageProductivityRate: 87.5,
            strengthWorkTypes: ['仕分け'],
          },
        ],
        proposedWorkTypes: [
          {
            workTypeId: 'WT-001',
            workTypeName: '仕分け作業',
            recommendationReason: '既存者の得意領域で、新配属者も適応しやすい',
            expectedProductivityRate: 80,
          },
          {
            workTypeId: 'WT-002',
            workTypeName: '検品作業',
            recommendationReason: '中程度の難度で習熟度向上に適している',
            expectedProductivityRate: 70,
          },
        ],
        estimatedProficiencyDays: 14,
      }),
      saveInitialAssignment: jest.fn().mockResolvedValue({
        initialAssignmentId: 'INIT-ASSIGN-12345',
        savedAt: new Date().toISOString(),
      }),
      sendNotificationToAdministrator: jest.fn().mockResolvedValue({
        notificationStatus: 'sent',
        recipientId: 'ADMIN-001',
        sentAt: new Date().toISOString(),
      }),
    } as unknown as jest.Mocked<Tx5Imp1AiClient>;
  });

  test('historicalDataLookbackDays が指定されない場合、デフォルトの90日が適用されること', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'ADMIN-001',
      historicalDataLookbackDays: undefined,
    };

    // Act
    const result = await runTx5Imp1Agent(input, mockAiClient);

    // Assert
    expect(result.success).toBe(true);
    expect(result.initialAssignmentId).not.toBeNull();
    expect(result.proposedWorkTypes).toHaveLength(2);
    expect(result.proposedWorkTypes[0]).toMatchObject({
      workTypeId: 'WT-001',
      workTypeName: '仕分け作業',
      expectedProductivityRate: 80,
    });
    expect(result.peerProductivityPatterns).toHaveLength(2);
    expect(result.peerProductivityPatterns[0]).toMatchObject({
      patternName: 'High Performer',
      averageProductivityRate: 93.5,
    });
    expect(result.estimatedProficiencyDays).toBe(14);
    expect(result.approverNotificationStatus).toBe('sent');
    expect(result.errorDetails).toBeNull();
    expect(result.executionTimestamp).toBeTruthy();

    // findProductivityDataByWorkerIds が呼び出されたことを確認
    expect(mockAiClient.findProductivityDataByWorkerIds).toHaveBeenCalled();

    // findProductivityDataByWorkerIds への呼び出しで、デフォルトの90日が適用されたことを確認
    expect(findProductivityDataByWorkerIdsCallArgs).toHaveLength(1);
    const callArg = findProductivityDataByWorkerIdsCallArgs[0];
    expect(callArg.lookbackDays).toBe(90);
    expect(callArg.siteId).toBe('SITE-001');
    expect(callArg.workerIds).toEqual(['W002', 'W003', 'W004', 'W005', 'W006']);

    // ISO 8601形式の検証
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
  });

  test('入力データの必須フィールド検証が実行されること', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'ADMIN-001',
    };

    // Act
    await runTx5Imp1Agent(input, mockAiClient);

    // Assert
    expect(mockAiClient.validateInputData).toHaveBeenCalledWith(input);
  });

  test('実行ユーザーの認証と権限チェックが実行されること', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'ADMIN-001',
    };

    // Act
    await runTx5Imp1Agent(input, mockAiClient);

    // Assert
    expect(mockAiClient.authenticateUser).toHaveBeenCalledWith('ADMIN-001');
    expect(mockAiClient.authorizeUserAction).toHaveBeenCalled();
  });

  test('既存作業者の生産性データが正しく分析されること', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'ADMIN-001',
    };

    // Act
    const result = await runTx5Imp1Agent(input, mockAiClient);

    // Assert
    expect(mockAiClient.analyzeOnboardingContextAndExtractPeerPerformancePatterns).toHaveBeenCalled();
    expect(result.peerProductivityPatterns).toHaveLength(2);
    expect(result.proposedWorkTypes).toHaveLength(2);
  });

  test('初期割当案が保存されること', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'ADMIN-001',
    };

    // Act
    await runTx5Imp1Agent(input, mockAiClient);

    // Assert
    expect(mockAiClient.saveInitialAssignment).toHaveBeenCalled();
  });

  test('承認者への通知が送信されること', async () => {
    // Arrange
    const input: Tx5Imp1AgentInput = {
      newAssigneeWorkerId: 'W001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'ADMIN-001',
    };

    // Act
    await runTx5Imp1Agent(input, mockAiClient);

    // Assert
    expect(mockAiClient.sendNotificationToAdministrator).toHaveBeenCalled();
  });
});