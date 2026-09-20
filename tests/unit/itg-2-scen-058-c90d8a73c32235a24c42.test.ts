import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-058: AIクライアント返却値がJSON解析不可またはnullの場合のエラーハンドリング', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockFindWorkersByClassificationAndSite: jest.Mock;
  let mockFindProductivityDataByWorkerIds: jest.Mock;
  let mockAnalyzeOnboardingContext: jest.Mock;

  beforeEach(() => {
    mockAuthenticateUser = jest.fn().mockResolvedValue({ userId: 'admin-001', role: 'admin' });
    mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });
    mockValidateInputData = jest.fn().mockResolvedValue({ valid: true });
    mockFindWorkersByClassificationAndSite = jest.fn().mockResolvedValue([
      { workerId: 'worker-001', name: 'Worker 1' },
      { workerId: 'worker-002', name: 'Worker 2' },
      { workerId: 'worker-003', name: 'Worker 3' },
    ]);
    mockFindProductivityDataByWorkerIds = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-001',
        productivityRate: 95,
        workTypes: ['assembly', 'inspection'],
      },
      {
        workerId: 'worker-002',
        productivityRate: 88,
        workTypes: ['packaging', 'inspection'],
      },
      {
        workerId: 'worker-003',
        productivityRate: 92,
        workTypes: ['assembly', 'quality-check'],
      },
    ]);
    mockAnalyzeOnboardingContext = jest.fn();

    jest.spyOn(global, 'fetch').mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('AIクライアントが解析不可なJSON文字列を返却した場合、InitialAssignmentGenerationFailureErrorとしてエラー結果が返される', async () => {
    mockAnalyzeOnboardingContext.mockResolvedValue('{invalid json}');

    const input = {
      newAssigneeWorkerId: 'new-worker-001',
      jobClassification: 'assembly-line-A',
      assignedSiteId: 'site-001',
      assignedTeamId: 'team-001',
      assignedDepartmentId: 'dept-001',
      assignmentStartDate: '2024-01-15T00:00:00Z',
      executingUserId: 'admin-001',
      historicalDataLookbackDays: 90,
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContext,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
    expect(result.approverNotificationStatus).toMatch(/failed|pending/);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(mockAnalyzeOnboardingContext).toHaveBeenCalled();
  });

  test('AIクライアントがnullを返却した場合、InitialAssignmentGenerationFailureErrorが返される', async () => {
    mockAnalyzeOnboardingContext.mockResolvedValue(null);

    const input = {
      newAssigneeWorkerId: 'new-worker-002',
      jobClassification: 'quality-check-B',
      assignedSiteId: 'site-002',
      assignedTeamId: 'team-002',
      assignedDepartmentId: 'dept-002',
      assignmentStartDate: '2024-01-20T00:00:00Z',
      executingUserId: 'admin-001',
      historicalDataLookbackDays: 60,
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContext,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
    expect(result.approverNotificationStatus).toMatch(/failed|pending/);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(mockAnalyzeOnboardingContext).toHaveBeenCalled();
  });

  test('不正な返却値を受け取ると出力フィールドがエラー状態で返される', async () => {
    mockAnalyzeOnboardingContext.mockResolvedValue(null);

    const input = {
      newAssigneeWorkerId: 'new-worker-004',
      jobClassification: 'inspection-D',
      assignedSiteId: 'site-004',
      assignedTeamId: 'team-004',
      assignedDepartmentId: 'dept-004',
      assignmentStartDate: '2024-02-01T00:00:00Z',
      executingUserId: 'admin-001',
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContext,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(false);
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
    expect(mockAnalyzeOnboardingContext).toHaveBeenCalled();
  });

  test('出力型のすべてのフィールドが正しく設定される', async () => {
    mockAnalyzeOnboardingContext.mockResolvedValue(null);

    const input = {
      newAssigneeWorkerId: 'new-worker-005',
      jobClassification: 'inspection-E',
      assignedSiteId: 'site-005',
      assignedTeamId: 'team-005',
      assignedDepartmentId: 'dept-005',
      assignmentStartDate: '2024-02-01T00:00:00Z',
      executingUserId: 'admin-001',
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContext,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('initialAssignmentId');
    expect(result).toHaveProperty('proposedWorkTypes');
    expect(result).toHaveProperty('peerProductivityPatterns');
    expect(result).toHaveProperty('estimatedProficiencyDays');
    expect(result).toHaveProperty('approverNotificationStatus');
    expect(result).toHaveProperty('errorDetails');
    expect(result).toHaveProperty('executionTimestamp');

    expect(typeof result.success).toBe('boolean');
    expect(result.initialAssignmentId === null || typeof result.initialAssignmentId === 'string').toBe(true);
    expect(Array.isArray(result.proposedWorkTypes)).toBe(true);
    expect(Array.isArray(result.peerProductivityPatterns)).toBe(true);
    expect(typeof result.estimatedProficiencyDays).toBe('number');
    expect(typeof result.approverNotificationStatus).toBe('string');
    expect(result.errorDetails === null || typeof result.errorDetails === 'string').toBe(true);
    expect(typeof result.executionTimestamp).toBe('string');

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
    expect(mockAnalyzeOnboardingContext).toHaveBeenCalled();
  });

  test('AIクライアントがJSON解析エラーをスローした場合、エラーが正しく処理される', async () => {
    mockAnalyzeOnboardingContext.mockImplementation(() => {
      throw new SyntaxError('Unexpected token in JSON');
    });

    const input = {
      newAssigneeWorkerId: 'new-worker-006',
      jobClassification: 'assembly-line-F',
      assignedSiteId: 'site-006',
      assignedTeamId: 'team-006',
      assignedDepartmentId: 'dept-006',
      assignmentStartDate: '2024-02-05T00:00:00Z',
      executingUserId: 'admin-001',
      historicalDataLookbackDays: 90,
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContext,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
    expect(result.approverNotificationStatus).toMatch(/failed|pending/);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(mockAnalyzeOnboardingContext).toHaveBeenCalled();
  });

  test('不正な返却値でも executionTimestamp は ISO 8601 形式で返される', async () => {
    mockAnalyzeOnboardingContext.mockResolvedValue(null);

    const input = {
      newAssigneeWorkerId: 'new-worker-007',
      jobClassification: 'quality-check-G',
      assignedSiteId: 'site-007',
      assignedTeamId: 'team-007',
      assignedDepartmentId: 'dept-007',
      assignmentStartDate: '2024-02-10T00:00:00Z',
      executingUserId: 'admin-001',
    };

    const aiClient = {
      authenticateUser: mockAuthenticateUser,
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkersByClassificationAndSite: mockFindWorkersByClassificationAndSite,
      findProductivityDataByWorkerIds: mockFindProductivityDataByWorkerIds,
      analyzeOnboardingContextAndExtractPeerPerformancePatterns:
        mockAnalyzeOnboardingContext,
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.executionTimestamp).toMatch(iso8601Regex);
    expect(result.success).toBe(false);
    expect(result.errorDetails).toBe(
      '初期割当案の生成に失敗しました。入力データと分析ロジックを確認してください。'
    );
  });
});