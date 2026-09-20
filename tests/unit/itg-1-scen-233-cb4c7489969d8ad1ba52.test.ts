import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

// スタブの型定義（実装参考用）
interface MockDependencies {
  authorizeOperation: jest.Mock;
  listHandyTerminalSyncLogByCondition: jest.Mock;
  getWorkerWithProficiencyAndProductivity: jest.Mock;
  aggregateWorkResultsAndCalculateProductivity: jest.Mock;
  saveProductivityData: jest.Mock;
  recordOperationAudit: jest.Mock;
}

describe('SCEN-233: 集約中に検出されたデータ品質上の問題が出力に含められる', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockAggregateWorkResultsAndCalculateProductivity: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });

    mockListHandyTerminalSyncLogByCondition = jest.fn().mockResolvedValue([
      {
        handyTerminalSyncLogId: 'log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'facility-A',
        teamId: 'team-B',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 100,
        defectiveQuantity: 5,
        syncTimestamp: '2024-01-01T09:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'log-002',
        workInstructionId: 'wi-001',
        workerId: 'worker-002',
        facilityId: 'facility-A',
        teamId: 'team-B',
        workStartDateTime: 'invalid-timestamp',
        workEndDateTime: '2024-01-01T10:00:00Z',
        completedQuantity: 80,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T10:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'log-003',
        workInstructionId: 'wi-002',
        workerId: 'worker-001',
        facilityId: 'facility-A',
        teamId: 'team-B',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:00:00Z',
        completedQuantity: 120,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-01T11:05:00Z',
      },
    ]);

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-001',
        workerName: 'Worker A',
        proficiencyLevel: '中級',
        recentProductivityRate: 0.85,
        qualityScore: 92,
      },
      {
        workerId: 'worker-002',
        workerName: 'Worker B',
        proficiencyLevel: '初級',
        recentProductivityRate: 0.70,
        qualityScore: 85,
      },
    ]);

    mockAggregateWorkResultsAndCalculateProductivity = jest
      .fn()
      .mockResolvedValue({
        aggregatedWorkResults: [
          {
            workResultId: 'wr-001',
            workerId: 'worker-001',
            workInstructionId: 'wi-001',
            workStartDateTime: '2024-01-01T08:00:00Z',
            workEndDateTime: '2024-01-01T09:00:00Z',
            completedQuantity: 100,
            defectiveQuantity: 5,
            dataSource: 'handy_terminal',
          },
          {
            workResultId: 'wr-003',
            workerId: 'worker-001',
            workInstructionId: 'wi-002',
            workStartDateTime: '2024-01-01T10:00:00Z',
            workEndDateTime: '2024-01-01T11:00:00Z',
            completedQuantity: 120,
            defectiveQuantity: 0,
            dataSource: 'handy_terminal',
          },
        ],
        calculatedProductivityMetrics: [
          {
            workerId: 'worker-001',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 2,
            completedItemCount: 220,
            productivityRate: 0.92,
            qualityScore: 0.96,
            errorCount: 0,
            proficiencyLevel: '中級',
          },
          {
            workerId: 'worker-002',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 1,
            completedItemCount: 80,
            productivityRate: 0.75,
            qualityScore: 0.88,
            errorCount: 1,
            proficiencyLevel: '初級',
          },
        ],
        dataQualityIssues: [
          {
            issueType: 'invalid_format',
            affectedRecordId: 'log-002',
            description:
              'タイムスタンプフィールドが不正な形式です: workStartDateTime="invalid-timestamp"',
            severity: 'warning',
          },
          {
            issueType: 'missing_data',
            affectedRecordId: 'log-002',
            description:
              '必須フィールドが不完全です: workStartDateTime が解析不可',
            severity: 'warning',
          },
        ],
      });

    mockSaveProductivityData = jest
      .fn()
      .mockResolvedValue(['pd-001', 'pd-002']);

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditLogId: 'audit-log-uuid-001',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should include dataQualityIssues in the output when quality issues are detected during aggregation', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    let result;
    let error: Error | undefined;

    try {
      result = await aggregateHandyTerminalWorkResults(input);
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeUndefined();
    expect(result).toBeDefined();
    expect(result!.dataQualityIssues).toBeDefined();
    expect(Array.isArray(result!.dataQualityIssues)).toBe(true);
    expect(result!.dataQualityIssues.length).toBeGreaterThanOrEqual(2);

    const firstIssue = result!.dataQualityIssues[0];
    expect(firstIssue.issueType).toBeDefined();
    expect(['missing_data', 'inconsistent_data', 'out_of_range', 'duplicate_record', 'invalid_format'].includes(firstIssue.issueType)).toBe(true);
    expect(firstIssue.affectedRecordId).toBeDefined();
    expect(typeof firstIssue.affectedRecordId).toBe('string');
    expect(firstIssue.description).toBeDefined();
    expect(typeof firstIssue.description).toBe('string');
    expect(firstIssue.severity).toBeDefined();
    expect(['warning', 'error'].includes(firstIssue.severity)).toBe(true);

    const secondIssue = result!.dataQualityIssues[1];
    expect(secondIssue.issueType).toBeDefined();
    expect(secondIssue.affectedRecordId).toBeDefined();
    expect(secondIssue.description).toBeDefined();
    expect(secondIssue.severity).toBeDefined();
  });

  it('should verify authorization is performed with correct parameters', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    await aggregateHandyTerminalWorkResults(input);

    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        operatingUserId: 'user-001',
        facilityId: 'facility-A',
        teamId: 'team-B',
      })
    );
  });

  it('should verify listHandyTerminalSyncLogByCondition is called with correct conditions', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    await aggregateHandyTerminalWorkResults(input);

    expect(mockListHandyTerminalSyncLogByCondition).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'facility-A',
        teamId: 'team-B',
        aggregationStartDateTime: '2024-01-01T00:00:00Z',
        aggregationEndDateTime: '2024-01-02T00:00:00Z',
      })
    );
  });

  it('should include aggregatedWorkResults without errors', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.aggregatedWorkResults).toBeDefined();
    expect(Array.isArray(result.aggregatedWorkResults)).toBe(true);
    expect(result.aggregatedWorkResults.length).toBeGreaterThan(0);

    result.aggregatedWorkResults.forEach((workResult) => {
      expect(workResult.workResultId).toBeDefined();
      expect(workResult.workerId).toBeDefined();
      expect(workResult.workInstructionId).toBeDefined();
      expect(workResult.workStartDateTime).toBeDefined();
      expect(workResult.workEndDateTime).toBeDefined();
      expect(workResult.completedQuantity).toBeDefined();
      expect(workResult.defectiveQuantity).toBeDefined();
      expect(workResult.dataSource).toBeDefined();
    });
  });

  it('should include calculatedProductivityMetrics in the output', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.calculatedProductivityMetrics).toBeDefined();
    expect(Array.isArray(result.calculatedProductivityMetrics)).toBe(true);
    expect(result.calculatedProductivityMetrics.length).toBeGreaterThan(0);

    result.calculatedProductivityMetrics.forEach((metric) => {
      expect(metric.workerId).toBeDefined();
      expect(metric.aggregationDate).toBeDefined();
      expect(metric.plannedWorkHours).toBeDefined();
      expect(metric.actualWorkHours).toBeDefined();
      expect(metric.completedItemCount).toBeDefined();
      expect(metric.productivityRate).toBeDefined();
      expect(metric.qualityScore).toBeDefined();
      expect(metric.errorCount).toBeDefined();
      expect(metric.proficiencyLevel).toBeDefined();
    });
  });

  it('should include persistedProductivityDataIds in the output', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.persistedProductivityDataIds).toBeDefined();
    expect(Array.isArray(result.persistedProductivityDataIds)).toBe(true);
    expect(result.persistedProductivityDataIds.length).toBeGreaterThan(0);

    result.persistedProductivityDataIds.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  it('should include aggregationId, aggregationPeriodStart, and aggregationPeriodEnd in the output', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.aggregationId).toBeDefined();
    expect(typeof result.aggregationId).toBe('string');
    expect(result.aggregationPeriodStart).toBeDefined();
    expect(typeof result.aggregationPeriodStart).toBe('string');
    expect(result.aggregationPeriodEnd).toBeDefined();
    expect(typeof result.aggregationPeriodEnd).toBe('string');
  });

  it('should include totalHandyTerminalSyncLogsProcessed with count of 3', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.totalHandyTerminalSyncLogsProcessed).toBeDefined();
    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(3);
  });

  it('should include totalWmsSyncLogsProcessed with value of 0 or greater', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.totalWmsSyncLogsProcessed).toBeDefined();
    expect(typeof result.totalWmsSyncLogsProcessed).toBe('number');
    expect(result.totalWmsSyncLogsProcessed).toBeGreaterThanOrEqual(0);
  });

  it('should include aggregationCompletedTimestamp and auditLogId in the output', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.aggregationCompletedTimestamp).toBeDefined();
    expect(typeof result.aggregationCompletedTimestamp).toBe('string');
    expect(result.auditLogId).toBeDefined();
    expect(typeof result.auditLogId).toBe('string');
  });

  it('should detect invalid timestamp format in handy terminal logs and record as quality issue', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.dataQualityIssues).toBeDefined();
    const invalidFormatIssue = result.dataQualityIssues.find(
      (issue) => issue.issueType === 'invalid_format' && issue.affectedRecordId === 'log-002'
    );
    expect(invalidFormatIssue).toBeDefined();
    expect(invalidFormatIssue!.description).toContain('不正な形式');
  });

  it('should handle data quality issues separately from aggregated results', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(3);
    expect(result.aggregatedWorkResults.length).toBeGreaterThan(0);
    expect(result.dataQualityIssues.length).toBeGreaterThanOrEqual(2);
  });

  it('should call recordOperationAudit and return auditLogId', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: 'team-B',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
    expect(result.auditLogId).toBe('audit-log-uuid-001');
  });
});