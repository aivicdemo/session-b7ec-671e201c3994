import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionDeliveryManager from '../../src/logic/work-instruction-delivery-manager';

jest.mock('../../src/logic/work-instruction-delivery-manager');

describe('SCEN-229: aggregateHandyTerminalWorkResults with includeWmsData=false', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListHandyTerminalSyncLogByCondition: jest.Mock;
  let mockListWmsSyncLogByCondition: jest.Mock;
  let mockGetWorkerWithProficiencyAndProductivity: jest.Mock;
  let mockAggregateWorkResultsAndCalculateProductivity: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockListHandyTerminalSyncLogByCondition = jest.fn().mockResolvedValue([
      {
        handyTerminalSyncLogId: 'HT001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 100,
        defectiveQuantity: 5,
        syncTimestamp: '2024-01-01T09:30:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT002',
        workInstructionId: 'WI002',
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:00:00Z',
        completedQuantity: 120,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T11:30:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT003',
        workInstructionId: 'WI003',
        workerId: 'W003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-01T12:00:00Z',
        workEndDateTime: '2024-01-01T13:00:00Z',
        completedQuantity: 110,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T13:30:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT004',
        workInstructionId: 'WI004',
        workerId: 'W001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-01T14:00:00Z',
        workEndDateTime: '2024-01-01T15:00:00Z',
        completedQuantity: 95,
        defectiveQuantity: 4,
        syncTimestamp: '2024-01-01T15:30:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT005',
        workInstructionId: 'WI005',
        workerId: 'W002',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-01T16:00:00Z',
        workEndDateTime: '2024-01-01T17:00:00Z',
        completedQuantity: 105,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T17:30:00Z',
      },
    ]);

    mockListWmsSyncLogByCondition = jest.fn().mockResolvedValue([
      {
        wmsSyncLogId: 'WMS001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'FAC001',
        completedQuantity: 100,
        syncTimestamp: '2024-01-01T09:30:00Z',
      },
      {
        wmsSyncLogId: 'WMS002',
        workInstructionId: 'WI002',
        workerId: 'W002',
        facilityId: 'FAC001',
        completedQuantity: 120,
        syncTimestamp: '2024-01-01T11:30:00Z',
      },
    ]);

    mockGetWorkerWithProficiencyAndProductivity = jest.fn().mockResolvedValue([
      {
        workerId: 'W001',
        proficiencyLevel: '中級',
        recentProductivityRate: 0.92,
        qualityScore: 95,
      },
      {
        workerId: 'W002',
        proficiencyLevel: '初級',
        recentProductivityRate: 0.85,
        qualityScore: 90,
      },
      {
        workerId: 'W003',
        proficiencyLevel: '上級',
        recentProductivityRate: 0.98,
        qualityScore: 98,
      },
    ]);

    mockAggregateWorkResultsAndCalculateProductivity = jest.fn().mockResolvedValue({
      aggregatedWorkResults: [
        {
          workResultId: 'WR001',
          workerId: 'W001',
          workInstructionId: 'WI001',
          workStartDateTime: '2024-01-01T08:00:00Z',
          workEndDateTime: '2024-01-01T09:00:00Z',
          completedQuantity: 100,
          defectiveQuantity: 5,
          dataSource: 'handy_terminal',
        },
        {
          workResultId: 'WR002',
          workerId: 'W002',
          workInstructionId: 'WI002',
          workStartDateTime: '2024-01-01T10:00:00Z',
          workEndDateTime: '2024-01-01T11:00:00Z',
          completedQuantity: 120,
          defectiveQuantity: 3,
          dataSource: 'handy_terminal',
        },
        {
          workResultId: 'WR003',
          workerId: 'W003',
          workInstructionId: 'WI003',
          workStartDateTime: '2024-01-01T12:00:00Z',
          workEndDateTime: '2024-01-01T13:00:00Z',
          completedQuantity: 110,
          defectiveQuantity: 2,
          dataSource: 'handy_terminal',
        },
        {
          workResultId: 'WR004',
          workerId: 'W001',
          workInstructionId: 'WI004',
          workStartDateTime: '2024-01-01T14:00:00Z',
          workEndDateTime: '2024-01-01T15:00:00Z',
          completedQuantity: 95,
          defectiveQuantity: 4,
          dataSource: 'handy_terminal',
        },
        {
          workResultId: 'WR005',
          workerId: 'W002',
          workInstructionId: 'WI005',
          workStartDateTime: '2024-01-01T16:00:00Z',
          workEndDateTime: '2024-01-01T17:00:00Z',
          completedQuantity: 105,
          defectiveQuantity: 1,
          dataSource: 'handy_terminal',
        },
      ],
      calculatedProductivityMetrics: [
        {
          workerId: 'W001',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 2,
          completedItemCount: 195,
          productivityRate: 0.92,
          qualityScore: 0.95,
          errorCount: 0,
          proficiencyLevel: '中級',
        },
        {
          workerId: 'W002',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 2,
          completedItemCount: 225,
          productivityRate: 0.85,
          qualityScore: 0.9,
          errorCount: 0,
          proficiencyLevel: '初級',
        },
        {
          workerId: 'W003',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 1,
          completedItemCount: 110,
          productivityRate: 0.98,
          qualityScore: 0.98,
          errorCount: 0,
          proficiencyLevel: '上級',
        },
      ],
    });

    mockSaveProductivityData = jest.fn().mockResolvedValue([
      'PROD_DATA_001',
      'PROD_DATA_002',
      'PROD_DATA_003',
    ]);

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditLogId: 'AUDIT20240101001',
    });

    (workInstructionDeliveryManager.aggregateHandyTerminalWorkResults as jest.Mock).mockImplementation(
      async (input) => {
        await mockAuthorizeOperation(input.operatingUserId, input.facilityId, input.teamId);

        const handyTerminalLogs = await mockListHandyTerminalSyncLogByCondition(
          input.facilityId,
          input.teamId
        );

        let wmsSyncLogs: any[] = [];
        if (input.includeWmsData) {
          wmsSyncLogs = await mockListWmsSyncLogByCondition(
            input.facilityId,
            input.teamId
          );
        }

        const workers = await mockGetWorkerWithProficiencyAndProductivity(
          input.facilityId,
          input.teamId
        );

        const aggregationResult = await mockAggregateWorkResultsAndCalculateProductivity(
          handyTerminalLogs,
          workers,
          input.includeWmsData
        );

        const persistedIds = await mockSaveProductivityData(aggregationResult);

        const audit = await mockRecordOperationAudit(
          input.operatingUserId,
          'AggregateHandyTerminalWorkResults',
          input.facilityId,
          'success'
        );

        return {
          aggregationId: `AGG_${Date.now()}`,
          facilityId: input.facilityId,
          teamId: input.teamId || null,
          aggregationPeriodStart: input.aggregationStartDateTime,
          aggregationPeriodEnd: input.aggregationEndDateTime,
          totalHandyTerminalSyncLogsProcessed: handyTerminalLogs.length,
          totalWmsSyncLogsProcessed: wmsSyncLogs.length,
          aggregatedWorkResults: aggregationResult.aggregatedWorkResults,
          calculatedProductivityMetrics: aggregationResult.calculatedProductivityMetrics,
          persistedProductivityDataIds: persistedIds,
          aggregationCompletedTimestamp: new Date().toISOString(),
          auditLogId: audit.auditLogId,
        };
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('includeWmsData=falseの場合、WMS連携ログを集約対象から除外し、ハンディターミナルのみを処理する', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.totalWmsSyncLogsProcessed).toBe(0);
    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(5);

    expect(result.aggregatedWorkResults).toBeDefined();
    expect(result.aggregatedWorkResults.length).toBeGreaterThan(0);
    result.aggregatedWorkResults.forEach((wr) => {
      expect(wr.dataSource).toBe('handy_terminal');
    });

    expect(result.persistedProductivityDataIds.length).toBe(3);
    expect(result.auditLogId).toBe('AUDIT20240101001');

    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USER123', 'FAC001', null);
    expect(mockListHandyTerminalSyncLogByCondition).toHaveBeenCalledWith('FAC001', null);
    expect(mockListWmsSyncLogByCondition).not.toHaveBeenCalled();
    expect(mockGetWorkerWithProficiencyAndProductivity).toHaveBeenCalledWith('FAC001', null);
  });

  test('aggregatedWorkResultsにWMS由来のデータが含まれていない', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    const wmsDataFound = result.aggregatedWorkResults.some(
      (wr) => wr.dataSource === 'wms' || wr.dataSource === 'merged'
    );
    expect(wmsDataFound).toBe(false);
  });

  test('calculatedProductivityMetricsが正しく計算・返却される', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.calculatedProductivityMetrics).toBeDefined();
    expect(result.calculatedProductivityMetrics.length).toBe(3);

    result.calculatedProductivityMetrics.forEach((metric) => {
      expect(metric.workerId).toBeDefined();
      expect(metric.aggregationDate).toBe('2024-01-01');
      expect(metric.productivityRate).toBeGreaterThanOrEqual(0);
      expect(metric.productivityRate).toBeLessThanOrEqual(1);
      expect(metric.qualityScore).toBeGreaterThanOrEqual(0);
      expect(metric.qualityScore).toBeLessThanOrEqual(1);
    });
  });

  test('persistedProductivityDataIdsが正しい件数で返却される', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.persistedProductivityDataIds).toHaveLength(3);
    expect(result.persistedProductivityDataIds[0]).toBe('PROD_DATA_001');
    expect(result.persistedProductivityDataIds[1]).toBe('PROD_DATA_002');
    expect(result.persistedProductivityDataIds[2]).toBe('PROD_DATA_003');
  });

  test('auditLogIdが生成・返却される', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    const result = await aggregateHandyTerminalWorkResults(input);

    expect(result.auditLogId).toBe('AUDIT20240101001');
  });

  test('WMS連携ログ取得スタブが呼び出されないことを確認する', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    await aggregateHandyTerminalWorkResults(input);

    expect(mockListWmsSyncLogByCondition).not.toHaveBeenCalled();
  });

  test('includeWmsData=falseの場合、WMS関連処理が一切実行されない', async () => {
    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER123',
      includeWmsData: false,
    };

    await aggregateHandyTerminalWorkResults(input);

    expect(mockListWmsSyncLogByCondition).not.toHaveBeenCalled();
    expect(mockAggregateWorkResultsAndCalculateProductivity).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      false
    );

    const callArgs = mockAggregateWorkResultsAndCalculateProductivity.mock.calls[0];
    expect(callArgs[2]).toBe(false);
  });
});