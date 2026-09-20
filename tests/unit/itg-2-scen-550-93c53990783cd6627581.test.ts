import { savePerformanceRecord, SavePerformanceRecordInput, SavePerformanceRecordOutput } from '../../src/logic/persistence-layer';

describe('SCEN-550: 品質スコアが0のときの正常系で新規作成が成功する', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindPlacementPlanByWorkerAndDate: jest.Mock;
  let mockFindPerformanceRecordsByWorkerAndPeriod: jest.Mock;
  let mockDatabase: Map<string, any>;

  beforeEach(() => {
    mockDatabase = new Map();
    jest.clearAllMocks();

    mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });
    mockValidateInputData = jest.fn().mockResolvedValue({ valid: true });
    mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'テスト作業者',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxOperatingHours: 8,
      found: true,
    });

    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 10);
    mockFindPlacementPlanByWorkerAndDate = jest.fn().mockResolvedValue({
      placementPlanId: 'plan-456',
      workerId: 'worker-123',
      placementDepartment: '製造部',
      placementJobType: 'ピッキング',
      startDate: new Date(workDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(workDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      optimizationReason: 'テスト最適化',
      found: true,
    });

    mockFindPerformanceRecordsByWorkerAndPeriod = jest.fn().mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      workerId: 'worker-123',
      periodStartDate: new Date(workDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      periodEndDate: new Date(workDate.getTime() + 1 * 24 * 60 * 60 * 1000),
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('品質スコアが0の場合、新規作成が成功し、SavePerformanceRecordOutputが正しく返される', async () => {
    const performanceRecordId = 'perf-record-uuid-001';
    const workerId = 'worker-123';
    const placementPlanId = 'plan-456';
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 10);
    const requestingUserId = 'user-789';

    const input: SavePerformanceRecordInput = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'テスト作業内容',
      completionCount: 10,
      requiredTimeMinutes: 480,
      qualityScore: 0,
      remarks: null,
      createdBy: 'user-789',
      updatedBy: undefined,
      requestingUserId,
      operation: 'create',
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });

  it('品質スコアが0で他のパラメータが有効な場合、operation フィールドが create を返す', async () => {
    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-uuid-002',
      workerId: 'worker-123',
      placementPlanId: 'plan-456',
      workDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      workContent: 'テスト作業内容',
      completionCount: 10,
      requiredTimeMinutes: 480,
      qualityScore: 0,
      remarks: null,
      createdBy: 'user-789',
      updatedBy: undefined,
      requestingUserId: 'user-789',
      operation: 'create',
    };

    const result = await savePerformanceRecord(input);

    expect(result.operation).toBe('create');
  });

  it('新規UUID が保存される時、savedAt が現在時刻に近い日時を返す', async () => {
    const beforeCall = new Date();
    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-record-uuid-003',
      workerId: 'worker-123',
      placementPlanId: 'plan-456',
      workDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      workContent: 'テスト作業内容',
      completionCount: 10,
      requiredTimeMinutes: 480,
      qualityScore: 0,
      remarks: null,
      createdBy: 'user-789',
      updatedBy: undefined,
      requestingUserId: 'user-789',
      operation: 'create',
    };

    const result = await savePerformanceRecord(input);
    const afterCall = new Date();

    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });
});