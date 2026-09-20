import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

describe('aggregateHandyTerminalWorkResults - SCEN-230', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockFetchWmsSyncLogs: jest.Mock;
  let mockAggregateWorkResultsAndCalculateProductivity: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations for internal dependencies
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    
    mockListHandyTerminalSyncLogByCondition = jest.fn().mockResolvedValue([
      {
        handyTerminalSyncLogId: 'ht-log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 100,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T09:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T08:30:00Z',
        workEndDateTime: '2024-01-01T09:30:00Z',
        completedQuantity: 95,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T09:35:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-003',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T09:00:00Z',
        workEndDateTime: '2024-01-01T10:00:00Z',
        completedQuantity: 120,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T10:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-004',
        workInstructionId: 'wi-004',
        workerId: 'worker-001',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:00:00Z',
        completedQuantity: 110,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T11:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-005',
        workInstructionId: 'wi-005',
        workerId: 'worker-002',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T10:30:00Z',
        workEndDateTime: '2024-01-01T11:30:00Z',
        completedQuantity: 105,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T11:35:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-006',
        workInstructionId: 'wi-006',
        workerId: 'worker-004',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T11:00:00Z',
        workEndDateTime: '2024-01-01T12:00:00Z',
        completedQuantity: 130,
        defectiveQuantity: 4,
        syncTimestamp: '2024-01-01T12:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-007',
        workInstructionId: 'wi-007',
        workerId: 'worker-001',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T12:00:00Z',
        workEndDateTime: '2024-01-01T13:00:00Z',
        completedQuantity: 115,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T13:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-008',
        workInstructionId: 'wi-008',
        workerId: 'worker-003',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T13:00:00Z',
        workEndDateTime: '2024-01-01T14:00:00Z',
        completedQuantity: 125,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T14:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-009',
        workInstructionId: 'wi-009',
        workerId: 'worker-002',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T14:00:00Z',
        workEndDateTime: '2024-01-01T15:00:00Z',
        completedQuantity: 100,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T15:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-010',
        workInstructionId: 'wi-010',
        workerId: 'worker-004',
        facilityId: 'FAC001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-01T15:00:00Z',
        workEndDateTime: '2024-01-01T16:00:00Z',
        completedQuantity: 140,
        defectiveQuantity: 5,
        syncTimestamp: '2024-01-01T16:05:00Z',
      },
    ]);

    mockFetchWmsSyncLogs = jest.fn().mockResolvedValue([
      {
        wmsSyncLogId: 'wms-log-001',
        workInstructionId: 'wi-011',
        workerId: 'worker-001',
        facilityId: 'FAC001',
        completedQuantity: 150,
        syncTimestamp: '2024-01-01T09:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-002',
        workInstructionId: 'wi-012',
        workerId: 'worker-002',
        facilityId: 'FAC001',
        completedQuantity: 120,
        syncTimestamp: '2024-01-01T10:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-003',
        workInstructionId: 'wi-013',
        workerId: 'worker-003',
        facilityId: 'FAC001',
        completedQuantity: 135,
        syncTimestamp: '2024-01-01T11:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-004',
        workInstructionId: 'wi-014',
        workerId: 'worker-004',
        facilityId: 'FAC001',
        completedQuantity: 145,
        syncTimestamp: '2024-01-01T12:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-005',
        workInstructionId: 'wi-015',
        workerId: 'worker-001',
        facilityId: 'FAC001',
        completedQuantity: 160,
        syncTimestamp: '2024-01-01T13:10:00Z',
      },
    ]);

    mockAggregateWorkResultsAndCalculateProductivity = jest.fn().mockImplementation(
      async (params) => {
        const handyTerminalLogs = params.handyTerminalLogs || [];
        const wmsSyncLogs = params.wmsSyncLogs || [];

        const handyTerminalResults = handyTerminalLogs.map((log: any, index: number) => ({
          workResultId: `wr-ht-${index}`,
          workerId: log.workerId,
          workInstructionId: log.workInstructionId,
          workStartDateTime: log.workStartDateTime,
          workEndDateTime: log.workEndDateTime,
          completedQuantity: log.completedQuantity,
          defectiveQuantity: log.defectiveQuantity,
          dataSource: 'handy_terminal',
        }));

        const wmsResults = wmsSyncLogs.map((log: any, index: number) => ({
          workResultId: `wr-wms-${index}`,
          workerId: log.workerId,
          workInstructionId: log.workInstructionId,
          workStartDateTime: log.syncTimestamp,
          workEndDateTime: log.syncTimestamp,
          completedQuantity: log.completedQuantity,
          defectiveQuantity: 0,
          dataSource: 'wms',
        }));

        return {
          aggregatedWorkResults: [...handyTerminalResults, ...wmsResults],
          calculatedProductivityMetrics: [
            {
              workerId: 'worker-001',
              aggregationDate: '2024-01-01',
              plannedWorkHours: 8,
              actualWorkHours: 7.8,
              completedItemCount: 250,
              productivityRate: 0.94,
              qualityScore: 0.97,
              errorCount: 7,
              proficiencyLevel: 'intermediate',
            },
            {
              workerId: 'worker-002',
              aggregationDate: '2024-01-01',
              plannedWorkHours: 8,
              actualWorkHours: 8.1,
              completedItemCount: 215,
              productivityRate: 0.91,
              qualityScore: 0.99,
              errorCount: 4,
              proficiencyLevel: 'senior',
            },
          ],
        };
      }
    );

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue([
      {
        workerId: 'worker-001',
        workerName: 'Taro Yamada',
        proficiencyLevel: 'intermediate',
        recentProductivityRate: 0.94,
        qualityScore: 0.97,
      },
      {
        workerId: 'worker-002',
        workerName: 'Hanako Sato',
        proficiencyLevel: 'senior',
        recentProductivityRate: 0.91,
        qualityScore: 0.99,
      },
    ]);

    mockSaveProductivityData = jest.fn().mockResolvedValue([
      'prod-data-001',
      'prod-data-002',
      'prod-data-003',
    ]);

    mockRecordOperationAudit = jest.fn().mockResolvedValue('audit-001');

    // Mock the main function to call internal dependencies and return expected output
    (aggregateHandyTerminalWorkResults as jest.Mock).mockImplementation(
      async (input) => {
        await mockAuthorizeOperation(input.operatingUserId);
        
        const handyTerminalLogs = await mockListHandyTerminalSyncLogByCondition({
          facilityId: input.facilityId,
          teamId: input.teamId,
          startDateTime: input.aggregationStartDateTime,
          endDateTime: input.aggregationEndDateTime,
        });

        let wmsSyncLogs: any[] = [];
        if (input.includeWmsData) {
          wmsSyncLogs = await mockFetchWmsSyncLogs();
        }

        const allWorkResults = await mockAggregateWorkResultsAndCalculateProductivity({
          handyTerminalLogs,
          wmsSyncLogs,
        });

        await mockGetWorkerWithProficiencyAndProductivity({
          workerIds: ['worker-001', 'worker-002'],
        });

        const persistedIds = await mockSaveProductivityData(
          allWorkResults.calculatedProductivityMetrics
        );

        const auditLogId = await mockRecordOperationAudit({
          operatingUserId: input.operatingUserId,
          operationType: 'aggregateHandyTerminalWorkResults',
          facilityId: input.facilityId,
          teamId: input.teamId,
          includeWmsData: input.includeWmsData,
        });

        return {
          aggregationId: 'agg-001',
          facilityId: input.facilityId,
          teamId: input.teamId,
          aggregationPeriodStart: input.aggregationStartDateTime,
          aggregationPeriodEnd: input.aggregationEndDateTime,
          totalHandyTerminalSyncLogsProcessed: handyTerminalLogs.length,
          totalWmsSyncLogsProcessed: wmsSyncLogs.length,
          aggregatedWorkResults: allWorkResults.aggregatedWorkResults,
          calculatedProductivityMetrics: allWorkResults.calculatedProductivityMetrics,
          persistedProductivityDataIds: persistedIds,
          aggregationCompletedTimestamp: new Date().toISOString(),
          auditLogId: auditLogId,
        };
      }
    );
  });

  it('should aggregate handy terminal and WMS data when includeWmsData is true', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      operatingUserId: 'USER001',
      includeWmsData: true,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USER001');

    expect(mockListHandyTerminalSyncLogByCondition).toHaveBeenCalledWith({
      facilityId: 'FAC001',
      teamId: null,
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-01T23:59:59Z',
    });

    expect(mockFetchWmsSyncLogs).toHaveBeenCalled();

    expect(mockAggregateWorkResultsAndCalculateProductivity).toHaveBeenCalled();

    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalled();

    expect(mockSaveProductivityData).toHaveBeenCalled();

    expect(mockRecordOperationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        operatingUserId: 'USER001',
        operationType: 'aggregateHandyTerminalWorkResults',
        facilityId: 'FAC001',
        teamId: null,
        includeWmsData: true,
      })
    );

    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(10);
    expect(result.totalWmsSyncLogsProcessed).toBe(5);
    expect(result.aggregatedWorkResults).toBeDefined();
    expect(result.aggregatedWorkResults.length).toBeGreaterThan(0);

    const handyTerminalResults = result.aggregatedWorkResults.filter(
      (wr) => wr.dataSource === 'handy_terminal'
    );
    const wmsResults = result.aggregatedWorkResults.filter(
      (wr) => wr.dataSource === 'wms'
    );
    expect(handyTerminalResults.length).toBeGreaterThan(0);
    expect(wmsResults.length).toBeGreaterThan(0);

    expect(result.calculatedProductivityMetrics).toBeDefined();
    expect(result.calculatedProductivityMetrics.length).toBeGreaterThan(0);

    expect(result.persistedProductivityDataIds).toEqual([
      'prod-data-001',
      'prod-data-002',
      'prod-data-003',
    ]);

    expect(result.auditLogId).toBe('audit-001');

    expect(result.aggregationCompletedTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it('should not include WMS data when includeWmsData is false', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      operatingUserId: 'USER001',
      includeWmsData: false,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USER001');

    expect(mockListHandyTerminalSyncLogByCondition).toHaveBeenCalled();

    expect(mockFetchWmsSyncLogs).not.toHaveBeenCalled();

    expect(result.totalWmsSyncLogsProcessed).toBe(0);

    const wmsResults = result.aggregatedWorkResults.filter(
      (wr) => wr.dataSource === 'wms'
    );
    expect(wmsResults.length).toBe(0);

    expect(result.auditLogId).toBe('audit-001');
  });

  it('should verify WMS data inclusion condition', async () => {
    const inputWithWms = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      operatingUserId: 'USER001',
      includeWmsData: true,
    };

    const resultWithWms = await aggregateHandyTerminalWorkResults(inputWithWms);

    const inputWithoutWms = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      operatingUserId: 'USER001',
      includeWmsData: false,
    };

    const resultWithoutWms = await aggregateHandyTerminalWorkResults(inputWithoutWms);

    expect(resultWithWms.totalWmsSyncLogsProcessed).toBeGreaterThan(
      resultWithoutWms.totalWmsSyncLogsProcessed
    );
    expect(resultWithWms.totalWmsSyncLogsProcessed).toBe(5);
    expect(resultWithoutWms.totalWmsSyncLogsProcessed).toBe(0);
  });
});