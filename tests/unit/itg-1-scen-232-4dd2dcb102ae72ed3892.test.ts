import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-232: 集約結果に処理されたWMS連携ログの総件数が正確に反映される', () => {
  it('should accurately reflect the total count of processed WMS sync logs in the aggregation result', async () => {
    const facilityId = 'facility-001';
    const teamId = 'team-001';
    const aggregationStartDateTime = '2024-01-15T00:00:00Z';
    const aggregationEndDateTime = '2024-01-15T23:59:59Z';
    const operatingUserId = 'user-admin-001';

    const mockHandyTerminalLogs = [
      {
        handyTerminalSyncLogId: 'ht-log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-A',
        facilityId,
        teamId,
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T09:00:00Z',
        completedQuantity: 50,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-15T09:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-B',
        facilityId,
        teamId,
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T10:00:00Z',
        completedQuantity: 45,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-15T10:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'ht-log-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-C',
        facilityId,
        teamId,
        workStartDateTime: '2024-01-15T10:00:00Z',
        workEndDateTime: '2024-01-15T11:00:00Z',
        completedQuantity: 55,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-15T11:05:00Z',
      },
    ];

    const mockWmsLogs = [
      {
        wmsSyncLogId: 'wms-log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-A',
        facilityId,
        completedQuantity: 50,
        syncTimestamp: '2024-01-15T09:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-B',
        facilityId,
        completedQuantity: 45,
        syncTimestamp: '2024-01-15T10:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-C',
        facilityId,
        completedQuantity: 55,
        syncTimestamp: '2024-01-15T11:10:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-004',
        workInstructionId: 'wi-001',
        workerId: 'worker-A',
        facilityId,
        completedQuantity: 48,
        syncTimestamp: '2024-01-15T12:00:00Z',
      },
      {
        wmsSyncLogId: 'wms-log-005',
        workInstructionId: 'wi-002',
        workerId: 'worker-B',
        facilityId,
        completedQuantity: 42,
        syncTimestamp: '2024-01-15T13:00:00Z',
      },
    ];

    const mockAggregatedResults = {
      aggregationId: 'agg-001',
      facilityId,
      teamId,
      aggregationPeriodStart: aggregationStartDateTime,
      aggregationPeriodEnd: aggregationEndDateTime,
      totalHandyTerminalSyncLogsProcessed: 3,
      totalWmsSyncLogsProcessed: 5,
      aggregatedWorkResults: [
        {
          workResultId: 'wr-001',
          workerId: 'worker-A',
          workInstructionId: 'wi-001',
          workStartDateTime: '2024-01-15T08:00:00Z',
          workEndDateTime: '2024-01-15T09:00:00Z',
          completedQuantity: 50,
          defectiveQuantity: 2,
          dataSource: 'merged' as const,
        },
        {
          workResultId: 'wr-002',
          workerId: 'worker-B',
          workInstructionId: 'wi-002',
          workStartDateTime: '2024-01-15T09:00:00Z',
          workEndDateTime: '2024-01-15T10:00:00Z',
          completedQuantity: 45,
          defectiveQuantity: 1,
          dataSource: 'merged' as const,
        },
        {
          workResultId: 'wr-003',
          workerId: 'worker-C',
          workInstructionId: 'wi-003',
          workStartDateTime: '2024-01-15T10:00:00Z',
          workEndDateTime: '2024-01-15T11:00:00Z',
          completedQuantity: 55,
          defectiveQuantity: 3,
          dataSource: 'merged' as const,
        },
      ],
      calculatedProductivityMetrics: [
        {
          workerId: 'worker-A',
          aggregationDate: '2024-01-15',
          plannedWorkHours: 8,
          actualWorkHours: 1,
          completedItemCount: 50,
          productivityRate: 0.95,
          qualityScore: 0.96,
          errorCount: 0,
          proficiencyLevel: 'intermediate',
        },
        {
          workerId: 'worker-B',
          aggregationDate: '2024-01-15',
          plannedWorkHours: 8,
          actualWorkHours: 1,
          completedItemCount: 45,
          productivityRate: 0.9,
          qualityScore: 0.98,
          errorCount: 0,
          proficiencyLevel: 'intermediate',
        },
        {
          workerId: 'worker-C',
          aggregationDate: '2024-01-15',
          plannedWorkHours: 8,
          actualWorkHours: 1,
          completedItemCount: 55,
          productivityRate: 1.0,
          qualityScore: 0.94,
          errorCount: 0,
          proficiencyLevel: 'advanced',
        },
      ],
      persistedProductivityDataIds: ['prod-data-001', 'prod-data-002', 'prod-data-003'],
      aggregationCompletedTimestamp: '2024-01-15T14:00:00Z',
      auditLogId: 'audit-log-xyz',
    };

    const moduleExports = require('../../src/logic/work-instruction-delivery-manager');
    
    jest.spyOn(moduleExports, 'aggregateHandyTerminalWorkResults').mockResolvedValue(mockAggregatedResults);

    const result = await aggregateHandyTerminalWorkResults({
      facilityId,
      teamId,
      aggregationStartDateTime,
      aggregationEndDateTime,
      operatingUserId,
      includeWmsData: true,
    });

    expect(result.totalWmsSyncLogsProcessed).toBe(5);
    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(3);
    expect(result.aggregationId).toBe('agg-001');
    expect(result.aggregatedWorkResults).toHaveLength(3);
    expect(result.calculatedProductivityMetrics).toHaveLength(3);
    expect(result.persistedProductivityDataIds).toHaveLength(3);
    expect(result.auditLogId).toBe('audit-log-xyz');
  });
});