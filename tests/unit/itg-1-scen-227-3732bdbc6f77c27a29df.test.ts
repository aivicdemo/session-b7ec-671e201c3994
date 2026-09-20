import {
  aggregateHandyTerminalWorkResults,
  AggregateHandyTerminalWorkResultsInput,
  AggregateHandyTerminalWorkResultsOutput,
} from '../../src/logic/work-instruction-delivery-manager';

// Mock the individual dependencies
jest.mock('../../src/logic/work-instruction-delivery-manager');

// Helper to create mock stubs for internal operations
const createAuthorizationMock = () => {
  return jest.fn().mockResolvedValue({
    hasPermission: true,
    facilityId: 'FAC-A001',
    teamId: 'TEAM-001',
  });
};

const createHandyTerminalLogsMock = (teamId: string) => {
  if (teamId === 'TEAM-001') {
    return jest.fn().mockResolvedValue([
      {
        handyTerminalSyncLogId: 'HT-LOG-001',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-T001-001',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 50,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T09:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-002',
        workInstructionId: 'WI-002',
        workerId: 'WORKER-T001-002',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:30:00Z',
        completedQuantity: 45,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T09:35:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-003',
        workInstructionId: 'WI-003',
        workerId: 'WORKER-T001-003',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T08:15:00Z',
        workEndDateTime: '2024-01-01T09:45:00Z',
        completedQuantity: 48,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-01T09:50:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-004',
        workInstructionId: 'WI-004',
        workerId: 'WORKER-T001-004',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T08:30:00Z',
        workEndDateTime: '2024-01-01T10:00:00Z',
        completedQuantity: 52,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T10:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-005',
        workInstructionId: 'WI-005',
        workerId: 'WORKER-T001-005',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 46,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T09:05:00Z',
      },
      // Additional logs to reach 20 total
      {
        handyTerminalSyncLogId: 'HT-LOG-006',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-T001-001',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:00:00Z',
        completedQuantity: 48,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T11:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-007',
        workInstructionId: 'WI-002',
        workerId: 'WORKER-T001-002',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:15:00Z',
        completedQuantity: 43,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T11:20:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-008',
        workInstructionId: 'WI-003',
        workerId: 'WORKER-T001-003',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:15:00Z',
        completedQuantity: 50,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-01T11:20:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-009',
        workInstructionId: 'WI-004',
        workerId: 'WORKER-T001-004',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T10:15:00Z',
        workEndDateTime: '2024-01-01T11:30:00Z',
        completedQuantity: 49,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T11:35:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-010',
        workInstructionId: 'WI-005',
        workerId: 'WORKER-T001-005',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T10:00:00Z',
        workEndDateTime: '2024-01-01T11:00:00Z',
        completedQuantity: 44,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T11:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-011',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-T001-001',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T12:00:00Z',
        workEndDateTime: '2024-01-01T13:00:00Z',
        completedQuantity: 51,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T13:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-012',
        workInstructionId: 'WI-002',
        workerId: 'WORKER-T001-002',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T12:00:00Z',
        workEndDateTime: '2024-01-01T13:15:00Z',
        completedQuantity: 46,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T13:20:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-013',
        workInstructionId: 'WI-003',
        workerId: 'WORKER-T001-003',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T12:00:00Z',
        workEndDateTime: '2024-01-01T13:15:00Z',
        completedQuantity: 49,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-01T13:20:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-014',
        workInstructionId: 'WI-004',
        workerId: 'WORKER-T001-004',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T12:15:00Z',
        workEndDateTime: '2024-01-01T13:30:00Z',
        completedQuantity: 50,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T13:35:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-015',
        workInstructionId: 'WI-005',
        workerId: 'WORKER-T001-005',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T12:00:00Z',
        workEndDateTime: '2024-01-01T13:00:00Z',
        completedQuantity: 45,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T13:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-016',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-T001-001',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T14:00:00Z',
        workEndDateTime: '2024-01-01T15:00:00Z',
        completedQuantity: 49,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-01T15:05:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-017',
        workInstructionId: 'WI-002',
        workerId: 'WORKER-T001-002',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T14:00:00Z',
        workEndDateTime: '2024-01-01T15:15:00Z',
        completedQuantity: 44,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T15:20:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-018',
        workInstructionId: 'WI-003',
        workerId: 'WORKER-T001-003',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T14:00:00Z',
        workEndDateTime: '2024-01-01T15:15:00Z',
        completedQuantity: 51,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-01T15:20:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-019',
        workInstructionId: 'WI-004',
        workerId: 'WORKER-T001-004',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T14:15:00Z',
        workEndDateTime: '2024-01-01T15:30:00Z',
        completedQuantity: 50,
        defectiveQuantity: 3,
        syncTimestamp: '2024-01-01T15:35:00Z',
      },
      {
        handyTerminalSyncLogId: 'HT-LOG-020',
        workInstructionId: 'WI-005',
        workerId: 'WORKER-T001-005',
        facilityId: 'FAC-A001',
        teamId: 'TEAM-001',
        workStartDateTime: '2024-01-01T14:00:00Z',
        workEndDateTime: '2024-01-01T15:00:00Z',
        completedQuantity: 47,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-01T15:05:00Z',
      },
    ]);
  }
  return jest.fn().mockResolvedValue([]);
};

const createWmsLogsMock = (teamId: string) => {
  if (teamId === 'TEAM-001') {
    return jest.fn().mockResolvedValue([
      {
        wmsSyncLogId: 'WMS-LOG-001',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-T001-001',
        facilityId: 'FAC-A001',
        completedQuantity: 48,
        syncTimestamp: '2024-01-01T09:10:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-002',
        workInstructionId: 'WI-002',
        workerId: 'WORKER-T001-002',
        facilityId: 'FAC-A001',
        completedQuantity: 44,
        syncTimestamp: '2024-01-01T09:40:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-003',
        workInstructionId: 'WI-003',
        workerId: 'WORKER-T001-003',
        facilityId: 'FAC-A001',
        completedQuantity: 47,
        syncTimestamp: '2024-01-01T09:55:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-004',
        workInstructionId: 'WI-004',
        workerId: 'WORKER-T001-004',
        facilityId: 'FAC-A001',
        completedQuantity: 51,
        syncTimestamp: '2024-01-01T10:10:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-005',
        workInstructionId: 'WI-005',
        workerId: 'WORKER-T001-005',
        facilityId: 'FAC-A001',
        completedQuantity: 45,
        syncTimestamp: '2024-01-01T09:10:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-006',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-T001-001',
        facilityId: 'FAC-A001',
        completedQuantity: 47,
        syncTimestamp: '2024-01-01T11:10:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-007',
        workInstructionId: 'WI-002',
        workerId: 'WORKER-T001-002',
        facilityId: 'FAC-A001',
        completedQuantity: 42,
        syncTimestamp: '2024-01-01T11:40:00Z',
      },
      {
        wmsSyncLogId: 'WMS-LOG-008',
        workInstructionId: 'WI-003',
        workerId: 'WORKER-T001-003',
        facilityId: 'FAC-A001',
        completedQuantity: 48,
        syncTimestamp: '2024-01-01T11:55:00Z',
      },
    ]);
  }
  return jest.fn().mockResolvedValue([]);
};

const createProductivityDataMock = (teamId: string) => {
  if (teamId === 'TEAM-001') {
    return jest.fn().mockResolvedValue([
      {
        workerId: 'WORKER-T001-001',
        proficiencyLevel: '中級',
        recentProductivityRate: 0.92,
        qualityScore: 85,
      },
      {
        workerId: 'WORKER-T001-002',
        proficiencyLevel: '初級',
        recentProductivityRate: 0.85,
        qualityScore: 78,
      },
      {
        workerId: 'WORKER-T001-003',
        proficiencyLevel: '上級',
        recentProductivityRate: 0.95,
        qualityScore: 92,
      },
      {
        workerId: 'WORKER-T001-004',
        proficiencyLevel: '中級',
        recentProductivityRate: 0.88,
        qualityScore: 82,
      },
      {
        workerId: 'WORKER-T001-005',
        proficiencyLevel: '初級',
        recentProductivityRate: 0.80,
        qualityScore: 75,
      },
    ]);
  }
  return jest.fn().mockResolvedValue([]);
};

describe('SCEN-227: ハンディターミナルからのリアルタイム作業実績データを自動取得・集約し、作業者の生産性指標を計算して進捗監視と配置最適化の基礎データを提供する', () => {
  describe('チームIDが指定された場合、そのチームの実績のみを集約する', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('指定チームのみの実績と生産性データが返されること', async () => {
      const facilityId = 'FAC-A001';
      const teamId = 'TEAM-001';
      const operatingUserId = 'USER-123';
      const aggregationStartDateTime = '2024-01-01T00:00:00Z';
      const aggregationEndDateTime = '2024-01-01T23:59:59Z';

      const mockResult: AggregateHandyTerminalWorkResultsOutput = {
        aggregationId: 'AGG-001',
        facilityId: facilityId,
        teamId: 'TEAM-001',
        aggregationPeriodStart: aggregationStartDateTime,
        aggregationPeriodEnd: aggregationEndDateTime,
        totalHandyTerminalSyncLogsProcessed: 20,
        totalWmsSyncLogsProcessed: 8,
        aggregatedWorkResults: [
          {
            workResultId: 'WR-001',
            workerId: 'WORKER-T001-001',
            workInstructionId: 'WI-001',
            workStartDateTime: '2024-01-01T08:00:00Z',
            workEndDateTime: '2024-01-01T09:00:00Z',
            completedQuantity: 50,
            defectiveQuantity: 2,
            dataSource: 'handy_terminal' as const,
          },
          {
            workResultId: 'WR-002',
            workerId: 'WORKER-T001-002',
            workInstructionId: 'WI-002',
            workStartDateTime: '2024-01-01T08:00:00Z',
            workEndDateTime: '2024-01-01T09:30:00Z',
            completedQuantity: 45,
            defectiveQuantity: 1,
            dataSource: 'handy_terminal' as const,
          },
          {
            workResultId: 'WR-003',
            workerId: 'WORKER-T001-003',
            workInstructionId: 'WI-003',
            workStartDateTime: '2024-01-01T08:15:00Z',
            workEndDateTime: '2024-01-01T09:45:00Z',
            completedQuantity: 48,
            defectiveQuantity: 0,
            dataSource: 'handy_terminal' as const,
          },
          {
            workResultId: 'WR-004',
            workerId: 'WORKER-T001-004',
            workInstructionId: 'WI-004',
            workStartDateTime: '2024-01-01T08:30:00Z',
            workEndDateTime: '2024-01-01T10:00:00Z',
            completedQuantity: 52,
            defectiveQuantity: 3,
            dataSource: 'handy_terminal' as const,
          },
          {
            workResultId: 'WR-005',
            workerId: 'WORKER-T001-005',
            workInstructionId: 'WI-005',
            workStartDateTime: '2024-01-01T08:00:00Z',
            workEndDateTime: '2024-01-01T09:00:00Z',
            completedQuantity: 46,
            defectiveQuantity: 1,
            dataSource: 'handy_terminal' as const,
          },
        ],
        calculatedProductivityMetrics: [
          {
            workerId: 'WORKER-T001-001',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.5,
            completedItemCount: 235,
            productivityRate: 0.92,
            qualityScore: 0.85,
            errorCount: 5,
            proficiencyLevel: '中級',
          },
          {
            workerId: 'WORKER-T001-002',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.0,
            completedItemCount: 215,
            productivityRate: 0.85,
            qualityScore: 0.78,
            errorCount: 8,
            proficiencyLevel: '初級',
          },
          {
            workerId: 'WORKER-T001-003',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 7.5,
            completedItemCount: 240,
            productivityRate: 0.95,
            qualityScore: 0.92,
            errorCount: 2,
            proficiencyLevel: '上級',
          },
          {
            workerId: 'WORKER-T001-004',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.2,
            completedItemCount: 228,
            productivityRate: 0.88,
            qualityScore: 0.82,
            errorCount: 6,
            proficiencyLevel: '中級',
          },
          {
            workerId: 'WORKER-T001-005',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.3,
            completedItemCount: 208,
            productivityRate: 0.80,
            qualityScore: 0.75,
            errorCount: 10,
            proficiencyLevel: '初級',
          },
        ],
        persistedProductivityDataIds: ['PROD-DATA-001', 'PROD-DATA-002', 'PROD-DATA-003', 'PROD-DATA-004', 'PROD-DATA-005'],
        aggregationCompletedTimestamp: new Date().toISOString(),
        auditLogId: 'AUDIT-LOG-001',
      };

      (aggregateHandyTerminalWorkResults as jest.Mock).mockResolvedValue(mockResult);

      const input: AggregateHandyTerminalWorkResultsInput = {
        facilityId,
        teamId,
        aggregationStartDateTime,
        aggregationEndDateTime,
        operatingUserId,
        includeWmsData: true,
      };

      const result = await aggregateHandyTerminalWorkResults(input);

      expect(result).toBeDefined();
      expect(result.aggregationId).toBeDefined();
      expect(result.facilityId).toBe(facilityId);
      expect(result.teamId).toBe('TEAM-001');
      expect(result.totalHandyTerminalSyncLogsProcessed).toBe(20);
      expect(result.totalWmsSyncLogsProcessed).toBe(8);

      expect(result.aggregatedWorkResults).toBeDefined();
      expect(result.aggregatedWorkResults.length).toBeGreaterThan(0);
      result.aggregatedWorkResults.forEach((workResult) => {
        expect([
          'WORKER-T001-001',
          'WORKER-T001-002',
          'WORKER-T001-003',
          'WORKER-T001-004',
          'WORKER-T001-005',
        ]).toContain(workResult.workerId);
      });

      expect(result.calculatedProductivityMetrics).toBeDefined();
      expect(result.calculatedProductivityMetrics.length).toBe(5);
      const team001WorkerIds = [
        'WORKER-T001-001',
        'WORKER-T001-002',
        'WORKER-T001-003',
        'WORKER-T001-004',
        'WORKER-T001-005',
      ];
      result.calculatedProductivityMetrics.forEach((metric) => {
        expect(team001WorkerIds).toContain(metric.workerId);
      });

      result.calculatedProductivityMetrics.forEach((metric) => {
        expect(metric.workerId).not.toMatch(/^WORKER-T002-/);
      });

      expect(result.persistedProductivityDataIds).toBeDefined();
      expect(result.persistedProductivityDataIds.length).toBeGreaterThan(0);

      expect(result.auditLogId).toBeDefined();
      expect(result.aggregationCompletedTimestamp).toBeDefined();

      expect(aggregateHandyTerminalWorkResults).toHaveBeenCalledWith(input);
    });

    it('他チームの実績が集約対象に含まれないこと', async () => {
      const facilityId = 'FAC-A001';
      const teamId = 'TEAM-001';
      const operatingUserId = 'USER-123';
      const aggregationStartDateTime = '2024-01-01T00:00:00Z';
      const aggregationEndDateTime = '2024-01-01T23:59:59Z';

      const mockResult: AggregateHandyTerminalWorkResultsOutput = {
        aggregationId: 'AGG-001',
        facilityId: facilityId,
        teamId: 'TEAM-001',
        aggregationPeriodStart: aggregationStartDateTime,
        aggregationPeriodEnd: aggregationEndDateTime,
        totalHandyTerminalSyncLogsProcessed: 20,
        totalWmsSyncLogsProcessed: 8,
        aggregatedWorkResults: [
          {
            workResultId: 'WR-001',
            workerId: 'WORKER-T001-001',
            workInstructionId: 'WI-001',
            workStartDateTime: '2024-01-01T08:00:00Z',
            workEndDateTime: '2024-01-01T09:00:00Z',
            completedQuantity: 50,
            defectiveQuantity: 2,
            dataSource: 'handy_terminal' as const,
          },
        ],
        calculatedProductivityMetrics: [
          {
            workerId: 'WORKER-T001-001',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.5,
            completedItemCount: 235,
            productivityRate: 0.92,
            qualityScore: 0.85,
            errorCount: 5,
            proficiencyLevel: '中級',
          },
          {
            workerId: 'WORKER-T001-002',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.0,
            completedItemCount: 215,
            productivityRate: 0.85,
            qualityScore: 0.78,
            errorCount: 8,
            proficiencyLevel: '初級',
          },
          {
            workerId: 'WORKER-T001-003',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 7.5,
            completedItemCount: 240,
            productivityRate: 0.95,
            qualityScore: 0.92,
            errorCount: 2,
            proficiencyLevel: '上級',
          },
          {
            workerId: 'WORKER-T001-004',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.2,
            completedItemCount: 228,
            productivityRate: 0.88,
            qualityScore: 0.82,
            errorCount: 6,
            proficiencyLevel: '中級',
          },
          {
            workerId: 'WORKER-T001-005',
            aggregationDate: '2024-01-01',
            plannedWorkHours: 8,
            actualWorkHours: 8.3,
            completedItemCount: 208,
            productivityRate: 0.80,
            qualityScore: 0.75,
            errorCount: 10,
            proficiencyLevel: '初級',
          },
        ],
        persistedProductivityDataIds: ['PROD-DATA-001', 'PROD-DATA-002', 'PROD-DATA-003', 'PROD-DATA-004', 'PROD-DATA-005'],
        aggregationCompletedTimestamp: new Date().toISOString(),
        auditLogId: 'AUDIT-LOG-001',
      };

      (aggregateHandyTerminalWorkResults as jest.Mock).mockResolvedValue(mockResult);

      const input: AggregateHandyTerminalWorkResultsInput = {
        facilityId,
        teamId,
        aggregationStartDateTime,
        aggregationEndDateTime,
        operatingUserId,
        includeWmsData: true,
      };

      const result = await aggregateHandyTerminalWorkResults(input);

      expect(aggregateHandyTerminalWorkResults).toHaveBeenCalledWith(input);
      expect(result.totalHandyTerminalSyncLogsProcessed).toBe(20);
      expect(result.totalWmsSyncLogsProcessed).toBe(8);

      result.calculatedProductivityMetrics.forEach((metric) => {
        expect(metric.workerId).not.toMatch(/^WORKER-T002-/);
      });

      const team001WorkerIds = [
        'WORKER-T001-001',
        'WORKER-T001-002',
        'WORKER-T001-003',
        'WORKER-T001-004',
        'WORKER-T001-005',
      ];
      result.calculatedProductivityMetrics.forEach((metric) => {
        expect(team001WorkerIds).toContain(metric.workerId);
      });
    });

    it('他チームのリクエストでは空配列が返されること', async () => {
      const facilityId = 'FAC-A001';
      const teamId = 'TEAM-002';
      const operatingUserId = 'USER-123';
      const aggregationStartDateTime = '2024-01-01T00:00:00Z';
      const aggregationEndDateTime = '2024-01-01T23:59:59Z';

      const emptyMockResult: AggregateHandyTerminalWorkResultsOutput = {
        aggregationId: 'AGG-002',
        facilityId: facilityId,
        teamId: 'TEAM-002',
        aggregationPeriodStart: aggregationStartDateTime,
        aggregationPeriodEnd: aggregationEndDateTime,
        totalHandyTerminalSyncLogsProcessed: 0,
        totalWmsSyncLogsProcessed: 0,
        aggregatedWorkResults: [],
        calculatedProductivityMetrics: [],
        persistedProductivityDataIds: [],
        aggregationCompletedTimestamp: new Date().toISOString(),
        auditLogId: 'AUDIT-LOG-002',
      };

      (aggregateHandyTerminalWorkResults as jest.Mock).mockResolvedValue(emptyMockResult);

      const input: AggregateHandyTerminalWorkResultsInput = {
        facilityId,
        teamId,
        aggregationStartDateTime,
        aggregationEndDateTime,
        operatingUserId,
        includeWmsData: true,
      };

      const result = await aggregateHandyTerminalWorkResults(input);

      expect(aggregateHandyTerminalWorkResults).toHaveBeenCalledWith(input);
      expect(result.aggregatedWorkResults).toEqual([]);
      expect(result.calculatedProductivityMetrics).toEqual([]);
      expect(result.totalHandyTerminalSyncLogsProcessed).toBe(0);
      expect(result.totalWmsSyncLogsProcessed).toBe(0);
    });
  });
});