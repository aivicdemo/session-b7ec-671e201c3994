import { savePerformanceRecord, SavePerformanceRecordInput, SavePerformanceRecordOutput } from '../../src/logic/persistence-layer';

describe('SCEN-549: 所要時間が1分のときの正常系で新規作成が成功する', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindPlacementPlanByWorkerAndDate: jest.Mock;
  let mockFindPerformanceRecordsByWorkerAndPeriod: jest.Mock;

  beforeEach(() => {
    mockAuthorizeUserAction = jest.fn().mockResolvedValue(undefined);
    mockValidateInputData = jest.fn().mockResolvedValue(undefined);
    mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'テスト作業者',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1200,
      maxOperatingHours: 8,
      found: true,
    });
    mockFindPlacementPlanByWorkerAndDate = jest.fn().mockResolvedValue({
      placementPlanId: 'placement-001',
      workerId: 'worker-001',
      placementDepartment: '製造部',
      placementJobType: 'ピッキング',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: 'スキルマッチ',
      found: true,
    });
    mockFindPerformanceRecordsByWorkerAndPeriod = jest.fn().mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      workerId: 'worker-001',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-01-01'),
    });

    jest.doMock('../../src/logic/persistence-layer', () => ({
      authorizeUserAction: mockAuthorizeUserAction,
      validateInputData: mockValidateInputData,
      findWorkerById: mockFindWorkerById,
      findPlacementPlanByWorkerAndDate: mockFindPlacementPlanByWorkerAndDate,
      findPerformanceRecordsByWorkerAndPeriod: mockFindPerformanceRecordsByWorkerAndPeriod,
      savePerformanceRecord: jest.requireActual('../../src/logic/persistence-layer').savePerformanceRecord,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('requiredTimeMinutes が 1 分のとき、新規作成が成功する', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-001',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('perf-record-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 5000);
  });

  it('authorizeUserAction が正常に処理される', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-002',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await savePerformanceRecord(input);

    expect(mockAuthorizeUserAction).toHaveBeenCalled();
  });

  it('validateInputData が正常に処理される', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-003',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await savePerformanceRecord(input);

    expect(mockValidateInputData).toHaveBeenCalled();
  });

  it('findWorkerById が正常に処理される', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-004',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await savePerformanceRecord(input);

    expect(mockFindWorkerById).toHaveBeenCalled();
  });

  it('findPlacementPlanByWorkerAndDate が正常に処理される', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-005',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await savePerformanceRecord(input);

    expect(mockFindPlacementPlanByWorkerAndDate).toHaveBeenCalled();
  });

  it('findPerformanceRecordsByWorkerAndPeriod が正常に処理される', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-006',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await savePerformanceRecord(input);

    expect(mockFindPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalled();
  });

  it('workContent が1文字のとき制約を満たす', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-007',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピ',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });

  it('workContent が500文字のとき制約を満たす', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-008',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'a'.repeat(500),
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });

  it('completionCount が1のとき制約を満たす', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-009',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 1,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });

  it('qualityScore が0のとき制約を満たす', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-010',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 0,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });

  it('qualityScore が100のとき制約を満たす', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-011',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 100,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });

  it('remarks が undefined のとき制約を満たす', async () => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 5);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-012',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 1,
      qualityScore: 95,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
  });
});