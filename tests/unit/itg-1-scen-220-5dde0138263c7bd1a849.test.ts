import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-220: ハンディターミナル実績の集約と生産性指標の計算', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockValidateHandyTerminalData: jest.Mock;
  let mockAggregateWorkResultsAndCalculateProductivity: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      hasAccess: true,
      facilityId: 'FAC-100',
      teamId: null,
    });

    const handyTerminalLogs = Array.from({ length: 120 }, (_, i) => ({
      handyTerminalSyncLogId: `LOG-${i + 1}`,
      workInstructionId: `WI-${(i % 10) + 1}`,
      workerId: `WORKER-${(i % 15) + 1}`,
      facilityId: 'FAC-100',
      teamId: `TEAM-${(i % 3) + 1}`,
      workStartDateTime: '2024-01-15T08:00:00Z',
      workEndDateTime: '2024-01-15T09:00:00Z',
      completedQuantity: Math.floor(Math.random() * 50) + 10,
      defectiveQuantity: Math.floor(Math.random() * 5),
      syncTimestamp: '2024-01-15T09:30:00Z',
    }));

    mockListHandyTerminalSyncLogByCondition = jest.fn().mockResolvedValue(handyTerminalLogs);

    mockValidateHandyTerminalData = jest.fn().mockResolvedValue({
      isValid: true,
      validRecordCount: 120,
      invalidRecordCount: 0,
      validationErrors: [],
    });

    const aggregatedWorkResults = Array.from({ length: 60 }, (_, i) => ({
      workResultId: `WRES-${i + 1}`,
      workerId: `WORKER-${(i % 15) + 1}`,
      workInstructionId: `WI-${(i % 10) + 1}`,
      workStartDateTime: '2024-01-15T08:00:00Z',
      workEndDateTime: '2024-01-15T09:00:00Z',
      completedQuantity: Math.floor(Math.random() * 50) + 10,
      defectiveQuantity: Math.floor(Math.random() * 5),
      dataSource: 'handy_terminal' as const,
    }));

    const calculatedProductivityMetrics = Array.from({ length: 15 }, (_, i) => ({
      workerId: `WORKER-${i + 1}`,
      aggregationDate: '2024-01-15',
      plannedWorkHours: 8,
      actualWorkHours: 7.5 + Math.random(),
      completedItemCount: Math.floor(Math.random() * 100) + 50,
      productivityRate: 0.85 + Math.random() * 0.15,
      qualityScore: Math.floor(Math.random() * 20) + 80,
      errorCount: Math.floor(Math.random() * 3),
      proficiencyLevel: ['初級', '中級', '上級'][Math.floor(Math.random() * 3)],
    }));

    mockAggregateWorkResultsAndCalculateProductivity = jest
      .fn()
      .mockResolvedValue({
        aggregatedWorkResults,
        calculatedProductivityMetrics,
        totalWmsSyncLogsProcessed: 45,
      });

    const persistedProductivityDataIds = Array.from({ length: 15 }, (_, i) =>
      `PROD-20240115-${String(i + 1).padStart(3, '0')}`
    );

    mockSaveProductivityData = jest.fn().mockResolvedValue(persistedProductivityDataIds);

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditLogId: 'AUDIT-20240115-ABC123',
    });

    jest.doMock('../../src/adapters/authorization-adapter', () => ({
      authorizeOperation: mockAuthorizeOperation,
    }));

    jest.doMock('../../src/data/handy-terminal-repository', () => ({
      listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
    }));

    jest.doMock('../../src/logic/handy-terminal-validator', () => ({
      validateHandyTerminalData: mockValidateHandyTerminalData,
    }));

    jest.doMock('../../src/logic/productivity-aggregator', () => ({
      aggregateWorkResultsAndCalculateProductivity:
        mockAggregateWorkResultsAndCalculateProductivity,
    }));

    jest.doMock('../../src/data/productivity-repository', () => ({
      saveProductivityData: mockSaveProductivityData,
    }));

    jest.doMock('../../src/data/audit-repository', () => ({
      recordOperationAudit: mockRecordOperationAudit,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('指定拠点の指定期間内のハンディターミナル実績を集約し、生産性指標を計算して永続化する', async () => {
    const input = {
      facilityId: 'FAC-100',
      teamId: null,
      aggregationStartDateTime: '2024-01-15T00:00:00Z',
      aggregationEndDateTime: '2024-01-15T23:59:59Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    // Step 1: 権限検証
    expect(mockAuthorizeOperation).toHaveBeenCalledWith({
      operatingUserId: 'user-001',
      facilityId: 'FAC-100',
      teamId: null,
    });

    // Step 2: ハンディターミナルログの取得
    expect(mockListHandyTerminalSyncLogByCondition).toHaveBeenCalledWith({
      facilityId: 'FAC-100',
      teamId: null,
      startDateTime: '2024-01-15T00:00:00Z',
      endDateTime: '2024-01-15T23:59:59Z',
    });

    // Step 3: バリデーション実行と確認
    expect(mockValidateHandyTerminalData).toHaveBeenCalled();
    const validateCallArgs = mockValidateHandyTerminalData.mock.calls[0][0];
    expect(validateCallArgs.handyTerminalSyncLogs).toHaveLength(120);

    // バリデーション結果の確認
    const validationResult = await mockValidateHandyTerminalData(validateCallArgs);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.validRecordCount).toBe(120);
    expect(validationResult.invalidRecordCount).toBe(0);
    expect(validationResult.validationErrors).toEqual([]);

    // Step 4: 集約・計算時にハンディターミナルログと WMS データが含められたことを確認
    expect(mockAggregateWorkResultsAndCalculateProductivity).toHaveBeenCalled();
    const aggregateCallArgs = mockAggregateWorkResultsAndCalculateProductivity.mock.calls[0][0];
    expect(aggregateCallArgs.includeWmsData).toBe(true);
    expect(aggregateCallArgs.handyTerminalSyncLogs).toBeDefined();
    expect(aggregateCallArgs.handyTerminalSyncLogs).toHaveLength(120);

    // Step 5: 生産性データの永続化
    expect(mockSaveProductivityData).toHaveBeenCalled();
    const saveCallArgs = mockSaveProductivityData.mock.calls[0][0];
    expect(saveCallArgs.calculatedProductivityMetrics).toBeDefined();
    expect(saveCallArgs.calculatedProductivityMetrics).toHaveLength(15);

    // Step 6: 監査ログ記録
    expect(mockRecordOperationAudit).toHaveBeenCalledWith({
      operatingUserId: 'user-001',
      operationType: 'aggregateHandyTerminalWorkResults',
      facilityId: 'FAC-100',
      teamId: null,
    });

    // 出力値の検証
    expect(result.aggregationId).toBeDefined();
    expect(typeof result.aggregationId).toBe('string');

    expect(result.facilityId).toBe('FAC-100');
    expect(result.teamId).toBeNull();

    expect(result.aggregationPeriodStart).toBe('2024-01-15T00:00:00Z');
    expect(result.aggregationPeriodEnd).toBe('2024-01-15T23:59:59Z');

    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(120);
    expect(result.totalWmsSyncLogsProcessed).toBeGreaterThan(0);
    expect(result.totalWmsSyncLogsProcessed).toBe(45);

    expect(result.aggregatedWorkResults).toHaveLength(60);
    expect(result.aggregatedWorkResults[0]).toHaveProperty('workResultId');
    expect(result.aggregatedWorkResults[0]).toHaveProperty('workerId');
    expect(result.aggregatedWorkResults[0]).toHaveProperty('workInstructionId');
    expect(result.aggregatedWorkResults[0]).toHaveProperty('completedQuantity');
    expect(result.aggregatedWorkResults[0]).toHaveProperty('defectiveQuantity');

    expect(result.calculatedProductivityMetrics).toHaveLength(15);
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('workerId');
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('actualWorkHours');
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('completedItemCount');
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('productivityRate');
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('qualityScore');
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('errorCount');
    expect(result.calculatedProductivityMetrics[0]).toHaveProperty('proficiencyLevel');

    expect(result.calculatedProductivityMetrics[0].qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.calculatedProductivityMetrics[0].qualityScore).toBeLessThanOrEqual(100);

    expect(result.persistedProductivityDataIds).toHaveLength(15);
    expect(
      result.persistedProductivityDataIds.every((id) => id.startsWith('PROD-20240115-'))
    ).toBe(true);

    // dataQualityIssues は空配列またはオプション未出力（undefined）の両方を許容
    expect(
      result.dataQualityIssues === undefined || result.dataQualityIssues?.length === 0
    ).toBe(true);

    expect(result.aggregationCompletedTimestamp).toBeDefined();
    expect(typeof result.aggregationCompletedTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.aggregationCompletedTimestamp)).toBe(
      true
    );

    expect(result.auditLogId).toBe('AUDIT-20240115-ABC123');
  });
});