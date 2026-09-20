import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';
import * as workInstructionModule from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-223: ハンディターミナル作業実績データ集約エラー処理', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockListHandyTerminalSyncLog: jest.Mock;
  let mockAggregateWorkResultsAndCalculateProductivity: jest.Mock;
  let mockSaveProductivityData: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthorizeOperation = jest.fn().mockResolvedValue({ authorized: true });
    mockListHandyTerminalSyncLog = jest.fn().mockResolvedValue({
      records: Array.from({ length: 10 }, (_, i) => ((({
        handyTerminalSyncLogId: `log-${i}`,
        workInstructionId: `work-${i}`,
        workerId: `worker-${i}`,
        facilityId: 'facility-A',
        teamId: 'team-A',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 10,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-01T09:05:00Z',
      }) as any))),
    });

    const workResultAggregationFailedError = new Error('Failed to aggregate work results from multiple sources due to data inconsistency.');
    (workResultAggregationFailedError as any).name = 'WorkResultAggregationFailedError';
    (workResultAggregationFailedError as any).code = 'WORK_RESULT_AGGREGATION_FAILED';

    mockAggregateWorkResultsAndCalculateProductivity = jest.fn().mockRejectedValue(
      workResultAggregationFailedError
    );
    mockSaveProductivityData = jest.fn().mockResolvedValue({});
    mockRecordOperationAudit = jest.fn().mockResolvedValue({});

    jest.spyOn(workInstructionModule, 'authorizeOperation' as any).mockImplementation(mockAuthorizeOperation);
    jest.spyOn(workInstructionModule, 'listHandyTerminalSyncLogByCondition' as any).mockImplementation(mockListHandyTerminalSyncLog);
    jest.spyOn(workInstructionModule, 'aggregateWorkResultsAndCalculateProductivity' as any).mockImplementation(mockAggregateWorkResultsAndCalculateProductivity);
    jest.spyOn(workInstructionModule, 'saveProductivityData' as any).mockImplementation(mockSaveProductivityData);
    jest.spyOn(workInstructionModule, 'recordOperationAudit' as any).mockImplementation(mockRecordOperationAudit);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('複数ソースからの作業実績データ集約中にデータ整合性エラーが発生した場合はエラーとなる', async () => {
    const input = {
      facilityId: 'facility-A',
      teamId: null as any,
      aggregationStartDateTime: '2024-01-01T08:00:00Z',
      aggregationEndDateTime: '2024-01-01T17:00:00Z',
      operatingUserId: 'user001',
      includeWmsData: true,
    };

    let caughtError: any;
    try {
      await aggregateHandyTerminalWorkResults(input);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.name).toBe('WorkResultAggregationFailedError');
    expect(caughtError.code).toBe('WORK_RESULT_AGGREGATION_FAILED');
    expect(caughtError.message).toBe('Failed to aggregate work results from multiple sources due to data inconsistency.');
    
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        operatingUserId: 'user001',
        facilityId: 'facility-A',
        operationType: 'work-result-aggregation',
      })
    );
    
    expect(mockListHandyTerminalSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'facility-A',
        startDateTime: '2024-01-01T08:00:00Z',
        endDateTime: '2024-01-01T17:00:00Z',
      })
    );
    
    expect(mockAggregateWorkResultsAndCalculateProductivity).toHaveBeenCalled();
    
    expect(mockSaveProductivityData).not.toHaveBeenCalled();
    expect(mockRecordOperationAudit).not.toHaveBeenCalled();
  });
});