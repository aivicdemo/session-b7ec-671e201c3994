import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-235: ハンディターミナルからのリアルタイム作業実績データを自動取得・集約し、作業者の生産性指標を計算して進捗監視と配置最適化の基礎データを提供する', () => {
  it('永続化された生産性データのID配列が出力に含められる', async () => {
    // Arrange
    const operatingUserId = 'user-123';
    const facilityId = 'facility-456';
    const teamId = 'team-789';
    const aggregationStartDateTime = '2024-01-01T00:00:00Z';
    const aggregationEndDateTime = '2024-01-02T00:00:00Z';

    const expectedPersistedProductivityDataIds = [
      'prod-data-001',
      'prod-data-002',
      'prod-data-003',
    ];

    const mockHandyTerminalLogs = [
      {
        handyTerminalSyncLogId: 'log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId,
        teamId,
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 100,
        defectiveQuantity: 5,
        syncTimestamp: '2024-01-01T09:01:00Z',
      },
      {
        handyTerminalSyncLogId: 'log-002',
        workInstructionId: 'wi-001',
        workerId: 'worker-002',
        facilityId,
        teamId,
        workStartDateTime: '2024-01-01T08:30:00Z',
        workEndDateTime: '2024-01-01T09:30:00Z',
        completedQuantity: 95,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T09:31:00Z',
      },
    ];

    const mockWorkerData = [
      {
        workerId: 'worker-001',
        proficiencyLevel: '中級',
        recentProductivityRate: 0.92,
        qualityScore: 95,
      },
      {
        workerId: 'worker-002',
        proficiencyLevel: '初級',
        recentProductivityRate: 0.85,
        qualityScore: 88,
      },
    ];

    const mockAggregatedResults = {
      workResults: [
        {
          workResultId: 'wr-001',
          workerId: 'worker-001',
          workInstructionId: 'wi-001',
          workStartDateTime: '2024-01-01T08:00:00Z',
          workEndDateTime: '2024-01-01T09:00:00Z',
          completedQuantity: 100,
          defectiveQuantity: 5,
          dataSource: 'handy_terminal' as const,
        },
        {
          workResultId: 'wr-002',
          workerId: 'worker-002',
          workInstructionId: 'wi-001',
          workStartDateTime: '2024-01-01T08:30:00Z',
          workEndDateTime: '2024-01-01T09:30:00Z',
          completedQuantity: 95,
          defectiveQuantity: 3,
          dataSource: 'handy_terminal' as const,
        },
      ],
      productivityMetrics: [
        {
          workerId: 'worker-001',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 1,
          completedItemCount: 100,
          productivityRate: 0.92,
          qualityScore: 0.95,
          errorCount: 1,
          proficiencyLevel: '中級',
        },
        {
          workerId: 'worker-002',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 1,
          completedItemCount: 95,
          productivityRate: 0.85,
          qualityScore: 0.88,
          errorCount: 0,
          proficiencyLevel: '初級',
        },
      ],
    };

    // Mock the authorization check
    jest
      .spyOn(global as any, 'authorizeOperation')
      .mockResolvedValue({ hasPermission: true });

    // Mock the handy terminal log retrieval
    jest
      .spyOn(global as any, 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValue(mockHandyTerminalLogs);

    // Mock the worker data retrieval
    jest
      .spyOn(global as any, 'getWorkerWithProficiencyAndProductivity')
      .mockResolvedValue(mockWorkerData);

    // Mock the aggregation and calculation
    jest
      .spyOn(global as any, 'aggregateWorkResultsAndCalculateProductivity')
      .mockResolvedValue(mockAggregatedResults);

    // Mock the persistence of productivity data
    jest
      .spyOn(global as any, 'saveProductivityData')
      .mockResolvedValue(expectedPersistedProductivityDataIds);

    // Mock the audit log recording
    jest
      .spyOn(global as any, 'recordOperationAudit')
      .mockResolvedValue({ auditLogId: 'audit-log-001' });

    // Act
    const result = await aggregateHandyTerminalWorkResults({
      facilityId,
      teamId,
      aggregationStartDateTime,
      aggregationEndDateTime,
      operatingUserId,
      includeWmsData: true,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.aggregationId).toBeDefined();
    expect(result.facilityId).toBe(facilityId);
    expect(result.teamId).toBe(teamId);
    expect(result.aggregationPeriodStart).toBe(aggregationStartDateTime);
    expect(result.aggregationPeriodEnd).toBe(aggregationEndDateTime);
    expect(result.totalHandyTerminalSyncLogsProcessed).toBeGreaterThanOrEqual(0);
    expect(result.totalWmsSyncLogsProcessed).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedWorkResults).toBeDefined();
    expect(Array.isArray(result.aggregatedWorkResults)).toBe(true);
    expect(result.calculatedProductivityMetrics).toBeDefined();
    expect(Array.isArray(result.calculatedProductivityMetrics)).toBe(true);
    expect(result.persistedProductivityDataIds).toBeDefined();
    expect(Array.isArray(result.persistedProductivityDataIds)).toBe(true);
    expect(result.persistedProductivityDataIds).toEqual(
      expectedPersistedProductivityDataIds
    );
    expect(result.persistedProductivityDataIds.length).toBeGreaterThanOrEqual(1);
    result.persistedProductivityDataIds.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id).not.toBe(result.aggregationId);
      expect(id).not.toBe(result.auditLogId);
    });
    expect(result.aggregationCompletedTimestamp).toBeDefined();
    expect(result.auditLogId).toBeDefined();
  });
});