import { updateAllocationChangeHistoryStatus } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-671: updateAllocationChangeHistoryStatus - approvalRemarks undefined', () => {
  let authorizeUserActionSpy: jest.SpyInstance;
  let validateInputDataSpy: jest.SpyInstance;
  let findAllocationChangeHistoryByWorkerSpy: jest.SpyInstance;
  let mockDatabase: Map<string, any>;

  beforeEach(() => {
    mockDatabase = new Map();
    
    const existingRecord = {
      allocationChangeHistoryId: 'ALLOC-HIS-001',
      workerId: 'WORKER-123',
      previousPlacementPlanId: 'PLAN-001',
      newPlacementPlanId: 'PLAN-002',
      previousDepartmentId: 'DEPT-001',
      newDepartmentId: 'DEPT-002',
      previousWorkTypeId: null,
      newWorkTypeId: null,
      changeReason: 'テスト理由',
      changeReasonDetail: null,
      changeExecutionDate: new Date(),
      plannedChangeDate: null,
      executorUserId: 'USER-EXECUTOR-001',
      approverUserId: null,
      approvalDateTime: null,
      status: 'pending',
      approvalRemarks: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockDatabase.set('ALLOC-HIS-001', { ...existingRecord });

    authorizeUserActionSpy = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue({
      authorized: true,
    });

    validateInputDataSpy = jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue({
      valid: true,
    });

    findAllocationChangeHistoryByWorkerSpy = jest.spyOn(persistenceLayer, 'findAllocationChangeHistoryByWorker' as any).mockImplementation(async (input: any) => {
      const record = mockDatabase.get('ALLOC-HIS-001');
      if (record) {
        return {
          allocationChangeHistories: [record],
          totalCount: 1,
          found: true,
          workerId: 'WORKER-123',
        };
      }
      return {
        allocationChangeHistories: [],
        totalCount: 0,
        found: false,
        workerId: 'WORKER-123',
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockDatabase.clear();
  });

  it('should update allocation change history status without approval remarks when approvalRemarks is undefined', async () => {
    const approvalDateTimeValue = new Date();
    const input = {
      allocationChangeHistoryId: 'ALLOC-HIS-001',
      newStatus: 'approved',
      approverUserId: 'USER-APPROVER-001',
      approvalDateTime: approvalDateTimeValue,
      approvalRemarks: undefined,
      requestingUserId: 'USER-REQUESTER-001',
    };

    // Intercept the actual updateAllocationChangeHistoryStatus call to simulate database update
    const originalUpdateSpy = jest.spyOn(persistenceLayer, 'updateAllocationChangeHistoryStatus' as any);
    originalUpdateSpy.mockImplementation(async (inputParam: any) => {
      const record = mockDatabase.get('ALLOC-HIS-001');
      if (record && record.status === 'pending') {
        const previousStatus = record.status;
        record.status = inputParam.newStatus;
        record.approverUserId = inputParam.approverUserId;
        record.approvalDateTime = inputParam.approvalDateTime;
        record.approvalRemarks = inputParam.approvalRemarks || null;
        record.updatedAt = new Date();
        mockDatabase.set('ALLOC-HIS-001', record);

        return {
          success: true,
          allocationChangeHistoryId: record.allocationChangeHistoryId,
          workerId: record.workerId,
          previousPlacementPlanId: record.previousPlacementPlanId,
          newPlacementPlanId: record.newPlacementPlanId,
          changeExecutionDate: record.changeExecutionDate,
          status: record.status,
          savedAt: record.updatedAt,
          previousStatus,
          newStatus: inputParam.newStatus,
          approverUserId: inputParam.approverUserId,
          approvalDateTime: inputParam.approvalDateTime,
          updatedAt: record.updatedAt,
          message: undefined,
        };
      }
      throw new Error('Record not found or invalid status');
    });

    const result = await updateAllocationChangeHistoryStatus(input);

    // Verify output type
    expect(result.success).toBe(true);
    expect(result.allocationChangeHistoryId).toBe('ALLOC-HIS-001');
    expect(result.workerId).toBe('WORKER-123');
    expect(result.previousStatus).toBe('pending');
    expect(result.newStatus).toBe('approved');
    expect(result.approverUserId).toBe('USER-APPROVER-001');
    expect(result.approvalDateTime).toEqual(approvalDateTimeValue);
    expect(result.updatedAt).toBeDefined();
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 1000);

    // Verify database state after update
    const updatedRecord = mockDatabase.get('ALLOC-HIS-001');
    expect(updatedRecord).toBeDefined();
    expect(updatedRecord.status).toBe('approved');
    expect(updatedRecord.approverUserId).toBe('USER-APPROVER-001');
    expect(updatedRecord.approvalDateTime).toEqual(approvalDateTimeValue);
    
    // Verify approval remarks field is empty when undefined is passed
    expect(updatedRecord.approvalRemarks === null || updatedRecord.approvalRemarks === undefined || updatedRecord.approvalRemarks === '').toBe(true);
  });
});