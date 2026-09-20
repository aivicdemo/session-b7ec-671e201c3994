import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

// Mock the dependencies at the module level before any imports
jest.mock('../../src/logic/authorization');
jest.mock('../../src/logic/handy-terminal-data-repository');
jest.mock('../../src/logic/work-result-aggregation');
jest.mock('../../src/logic/productivity-data-repository');

import { authorizeOperation } from '../../src/logic/authorization';
import { listHandyTerminalSyncLogByCondition } from '../../src/logic/handy-terminal-data-repository';
import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-aggregation';
import { saveProductivityData } from '../../src/logic/productivity-data-repository';

describe('SCEN-225: 集約された生産性データの永続化に失敗した場合はエラーとなる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PersistenceError with proper message and stack trace when saveProductivityData fails', async () => {
    const input = {
      facilityId: 'facility-001',
      teamId: 'team-001',
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T23:59:59Z',
      operatingUserId: 'user-001',
      includeWmsData: true,
    };

    // Setup: Authorization check passes
    (authorizeOperation as jest.Mock).mockResolvedValue({ hasAccess: true });

    // Setup: Return handy terminal sync logs
    const handyTerminalLogs = [
      {
        handyTerminalSyncLogId: 'log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: input.facilityId,
        teamId: input.teamId,
        workStartDateTime: input.aggregationStartDateTime,
        workEndDateTime: input.aggregationEndDateTime,
        completedQuantity: 100,
        defectiveQuantity: 5,
        syncTimestamp: new Date().toISOString(),
      },
      {
        handyTerminalSyncLogId: 'log-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: input.facilityId,
        teamId: input.teamId,
        workStartDateTime: input.aggregationStartDateTime,
        workEndDateTime: input.aggregationEndDateTime,
        completedQuantity: 150,
        defectiveQuantity: 3,
        syncTimestamp: new Date().toISOString(),
      },
    ];

    // Setup: Return WMS sync logs when includeWmsData is true
    const wmsSyncLogs = [
      {
        wmsSyncLogId: 'wms-log-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: input.facilityId,
        completedQuantity: 100,
        syncTimestamp: new Date().toISOString(),
      },
      {
        wmsSyncLogId: 'wms-log-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: input.facilityId,
        completedQuantity: 150,
        syncTimestamp: new Date().toISOString(),
      },
    ];

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue([
      ...handyTerminalLogs,
      ...wmsSyncLogs,
    ]);

    // Setup: Return aggregated work results and calculated productivity metrics
    (aggregateWorkResultsAndCalculateProductivity as jest.Mock).mockResolvedValue({
      aggregatedWorkResults: [
        {
          workResultId: 'result-001',
          workerId: 'worker-001',
          workInstructionId: 'wi-001',
          workStartDateTime: input.aggregationStartDateTime,
          workEndDateTime: input.aggregationEndDateTime,
          completedQuantity: 100,
          defectiveQuantity: 5,
          dataSource: 'merged',
        },
        {
          workResultId: 'result-002',
          workerId: 'worker-002',
          workInstructionId: 'wi-002',
          workStartDateTime: input.aggregationStartDateTime,
          workEndDateTime: input.aggregationEndDateTime,
          completedQuantity: 150,
          defectiveQuantity: 3,
          dataSource: 'merged',
        },
      ],
      calculatedProductivityMetrics: [
        {
          workerId: 'worker-001',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 7.5,
          completedItemCount: 100,
          productivityRate: 0.95,
          qualityScore: 0.95,
          errorCount: 1,
          proficiencyLevel: 'intermediate',
        },
        {
          workerId: 'worker-002',
          aggregationDate: '2024-01-01',
          plannedWorkHours: 8,
          actualWorkHours: 8,
          completedItemCount: 150,
          productivityRate: 1.0,
          qualityScore: 0.98,
          errorCount: 0,
          proficiencyLevel: 'advanced',
        },
      ],
    });

    // Setup: Simulate database persistence error
    const persistenceError = new Error('Failed to persist aggregated productivity data to database.');
    persistenceError.name = 'PersistenceError';
    persistenceError.stack = `PersistenceError: Failed to persist aggregated productivity data to database.\n    at saveProductivityData (src/logic/productivity-data-repository.ts:45:12)\n    at aggregateHandyTerminalWorkResults (src/logic/work-instruction-delivery-manager.ts:120:34)`;

    (saveProductivityData as jest.Mock).mockRejectedValue(persistenceError);

    // Execute: Call the actual function and catch the error
    let caughtError: any;
    try {
      await aggregateHandyTerminalWorkResults(input);
    } catch (err) {
      caughtError = err;
    }

    // Verify: Exception is thrown with correct properties
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('PersistenceError');
    expect(caughtError.message).toBe('Failed to persist aggregated productivity data to database.');

    // Verify: Stack trace contains saveProductivityData call path
    expect(caughtError.stack).toContain('saveProductivityData');

    // Verify: Authorization was called
    expect(authorizeOperation).toHaveBeenCalledWith(
      input.operatingUserId,
      input.facilityId,
      input.teamId
    );

    // Verify: Data collection was called with correct parameters
    expect(listHandyTerminalSyncLogByCondition).toHaveBeenCalledWith(
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    // Verify: WMS data was included in aggregation when includeWmsData is true
    expect(aggregateWorkResultsAndCalculateProductivity).toHaveBeenCalled();

    // Verify: saveProductivityData was called with calculated metrics
    expect(saveProductivityData).toHaveBeenCalled();
  });
});