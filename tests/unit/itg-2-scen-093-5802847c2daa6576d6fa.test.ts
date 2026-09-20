import { runTx5Imp2Agent, Tx5Imp2AgentInput, Tx5Imp2AgentOutput } from '../../src/agents/tx-5-imp-2/orchestrator';

// Mock prompt modules
jest.mock('../../src/agents/tx-5-imp-2/prompts/action-01', () => ({
  buildAction01Prompt: jest.fn(),
  ACTION_01_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-5-imp-2/prompts/action-02', () => ({
  buildAction02Prompt: jest.fn(),
  ACTION_02_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-5-imp-2/prompts/action-03', () => ({
  buildAction03Prompt: jest.fn(),
  ACTION_03_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-5-imp-2/prompts/action-04', () => ({
  buildAction04Prompt: jest.fn(),
  ACTION_04_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-5-imp-2/prompts/action-05', () => ({
  buildAction05Prompt: jest.fn(),
  ACTION_05_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-5-imp-2/prompts/action-06', () => ({
  buildAction06Prompt: jest.fn(),
  ACTION_06_PROMPT_VERSION: '1.0.0',
}));

jest.mock('../../src/agents/tx-5-imp-2/prompts/action-07', () => ({
  buildAction07Prompt: jest.fn(),
  ACTION_07_PROMPT_VERSION: '1.0.0',
}));

describe('SCEN-093: エージェント実行タイムスタンプがISO 8601形式で出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should output executionTimestamp in ISO 8601 format', async () => {
    // Arrange
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: { score: 82 },
      assignmentStartDate: '2025-01-15T09:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    const mockAiClient = {
      validateInputData: jest.fn().mockResolvedValue({ isValid: true }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.fn().mockResolvedValue({
        peerPatterns: [
          {
            workTypeId: 'WT001',
            workTypeName: 'Assembly',
            averageProductivityRate: 85,
            averageQualityScore: 90,
            averageTimeToThreshold: 20,
          },
        ],
      }),
      findWorkerById: jest.fn().mockResolvedValue({
        workerId: 'A001',
        name: 'Test Worker',
      }),
      getCurrentAssignmentStatus: jest.fn().mockResolvedValue({
        currentWorkTypeId: 'WT001',
        currentDepartmentId: 'DEPT001',
      }),
      collectProficiencyMonitoringData: jest.fn().mockResolvedValue({
        currentLevel: 70,
        recentMetrics: [
          { date: '2025-01-22', productivityRate: 70, qualityScore: 85, completedQuantity: 100 },
        ],
      }),
      generateDifficultyAdjustmentRecommendation: jest.fn().mockResolvedValue({
        recommendedNextWorkTypeId: 'WT002',
        recommendedNextWorkTypeName: 'Quality Check',
        difficultyLevelChange: 'increase',
        adjustmentReason: 'Proficiency threshold reached',
        recommendedAdjustmentDate: '2025-02-15T09:00:00Z',
        expectedProductivityImpact: 80,
      }),
      sendNotificationToAdminAndLeader: jest.fn().mockResolvedValue({ notificationSent: true }),
    };

    // Act
    const result = await runTx5Imp2Agent(mockAiClient, input);

    // Assert
    expect(result).toBeDefined();
    expect(result.executionTimestamp).toBeDefined();

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(iso8601Regex.test(result.executionTimestamp)).toBe(true);

    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(result.executionTimestamp).toMatch(/T\d{2}:\d{2}:\d{2}/);
    expect(result.executionTimestamp).toMatch(/(Z|[+-]\d{2}:\d{2})$/);
  });

  it('should accept ISO 8601 format with Z timezone', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: { score: 82 },
      assignmentStartDate: '2025-01-15T09:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    const mockAiClient = {
      validateInputData: jest.fn().mockResolvedValue({ isValid: true }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.fn().mockResolvedValue({
        peerPatterns: [
          {
            workTypeId: 'WT001',
            workTypeName: 'Assembly',
            averageProductivityRate: 85,
            averageQualityScore: 90,
            averageTimeToThreshold: 20,
          },
        ],
      }),
      findWorkerById: jest.fn().mockResolvedValue({
        workerId: 'A001',
        name: 'Test Worker',
      }),
      getCurrentAssignmentStatus: jest.fn().mockResolvedValue({
        currentWorkTypeId: 'WT001',
        currentDepartmentId: 'DEPT001',
      }),
      collectProficiencyMonitoringData: jest.fn().mockResolvedValue({
        currentLevel: 70,
        recentMetrics: [
          { date: '2025-01-22', productivityRate: 70, qualityScore: 85, completedQuantity: 100 },
        ],
      }),
      generateDifficultyAdjustmentRecommendation: jest.fn().mockResolvedValue({
        recommendedNextWorkTypeId: 'WT002',
        recommendedNextWorkTypeName: 'Quality Check',
        difficultyLevelChange: 'increase',
        adjustmentReason: 'Proficiency threshold reached',
        recommendedAdjustmentDate: '2025-02-15T09:00:00Z',
        expectedProductivityImpact: 80,
      }),
      sendNotificationToAdminAndLeader: jest.fn().mockResolvedValue({ notificationSent: true }),
    };

    const result = await runTx5Imp2Agent(mockAiClient, input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(iso8601Regex.test(result.executionTimestamp)).toBe(true);
  });

  it('should accept ISO 8601 format with milliseconds', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: { score: 82 },
      assignmentStartDate: '2025-01-15T09:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    const mockAiClient = {
      validateInputData: jest.fn().mockResolvedValue({ isValid: true }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.fn().mockResolvedValue({
        peerPatterns: [
          {
            workTypeId: 'WT001',
            workTypeName: 'Assembly',
            averageProductivityRate: 85,
            averageQualityScore: 90,
            averageTimeToThreshold: 20,
          },
        ],
      }),
      findWorkerById: jest.fn().mockResolvedValue({
        workerId: 'A001',
        name: 'Test Worker',
      }),
      getCurrentAssignmentStatus: jest.fn().mockResolvedValue({
        currentWorkTypeId: 'WT001',
        currentDepartmentId: 'DEPT001',
      }),
      collectProficiencyMonitoringData: jest.fn().mockResolvedValue({
        currentLevel: 70,
        recentMetrics: [
          { date: '2025-01-22', productivityRate: 70, qualityScore: 85, completedQuantity: 100 },
        ],
      }),
      generateDifficultyAdjustmentRecommendation: jest.fn().mockResolvedValue({
        recommendedNextWorkTypeId: 'WT002',
        recommendedNextWorkTypeName: 'Quality Check',
        difficultyLevelChange: 'increase',
        adjustmentReason: 'Proficiency threshold reached',
        recommendedAdjustmentDate: '2025-02-15T09:00:00Z',
        expectedProductivityImpact: 80,
      }),
      sendNotificationToAdminAndLeader: jest.fn().mockResolvedValue({ notificationSent: true }),
    };

    const result = await runTx5Imp2Agent(mockAiClient, input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(iso8601Regex.test(result.executionTimestamp)).toBe(true);
  });

  it('should accept ISO 8601 format with timezone offset', async () => {
    const input: Tx5Imp2AgentInput = {
      newAssigneeId: 'A001',
      aptitudeTestResult: { score: 82 },
      assignmentStartDate: '2025-01-15T09:00:00Z',
      monitoringDurationDays: 30,
      proficiencyThreshold: 75,
      triggeredBy: 'manual_onboarding',
    };

    const mockAiClient = {
      validateInputData: jest.fn().mockResolvedValue({ isValid: true }),
      analyzeOnboardingContextAndExtractPeerPerformancePatterns: jest.fn().mockResolvedValue({
        peerPatterns: [
          {
            workTypeId: 'WT001',
            workTypeName: 'Assembly',
            averageProductivityRate: 85,
            averageQualityScore: 90,
            averageTimeToThreshold: 20,
          },
        ],
      }),
      findWorkerById: jest.fn().mockResolvedValue({
        workerId: 'A001',
        name: 'Test Worker',
      }),
      getCurrentAssignmentStatus: jest.fn().mockResolvedValue({
        currentWorkTypeId: 'WT001',
        currentDepartmentId: 'DEPT001',
      }),
      collectProficiencyMonitoringData: jest.fn().mockResolvedValue({
        currentLevel: 70,
        recentMetrics: [
          { date: '2025-01-22', productivityRate: 70, qualityScore: 85, completedQuantity: 100 },
        ],
      }),
      generateDifficultyAdjustmentRecommendation: jest.fn().mockResolvedValue({
        recommendedNextWorkTypeId: 'WT002',
        recommendedNextWorkTypeName: 'Quality Check',
        difficultyLevelChange: 'increase',
        adjustmentReason: 'Proficiency threshold reached',
        recommendedAdjustmentDate: '2025-02-15T09:00:00Z',
        expectedProductivityImpact: 80,
      }),
      sendNotificationToAdminAndLeader: jest.fn().mockResolvedValue({ notificationSent: true }),
    };

    const result = await runTx5Imp2Agent(mockAiClient, input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(iso8601Regex.test(result.executionTimestamp)).toBe(true);
  });
});