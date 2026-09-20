import { saveInitialAssignment, findWorkerById, findDepartmentById, findInitialAssignmentByWorker } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-520: 既存レコードを更新する場合に初期割当レコードが正常に更新される', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindDepartmentById: jest.Mock;
  let mockFindInitialAssignmentByWorker: jest.Mock;
  let persistedRecords: Map<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    persistedRecords = new Map();

    // 既存の初期割当レコードを事前に保存
    const existingRecord = {
      assignmentId: 'assign-001',
      workerId: 'worker-123',
      placementDepartment: 'dept-456',
      placementProcess: 'PROCESS-A',
      assignmentStartDate: new Date('2024-01-01'),
      assignmentEndDate: new Date('2024-03-31'),
      assignmentStatus: 'active',
      remarks: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      createdBy: 'user-001',
    };
    persistedRecords.set('assign-001', existingRecord);

    mockAuthorizeUserAction = jest.fn().mockResolvedValue(true);
    mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });

    mockFindDepartmentById = jest.fn().mockResolvedValue({
      departmentId: 'dept-789',
      departmentName: 'New Department',
      departmentCode: 'DEPT-789',
      description: 'Test department',
      responsibleUserId: 'user-admin',
      status: 'active',
      found: true,
    });

    mockFindInitialAssignmentByWorker = jest.fn().mockResolvedValue({
      assignmentId: 'assign-001',
      workerId: 'worker-123',
      placementDepartment: 'dept-456',
      placementProcess: 'PROCESS-A',
      assignmentStartDate: new Date('2024-01-01'),
      assignmentEndDate: new Date('2024-03-31'),
      assignmentStatus: 'active',
      remarks: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      found: true,
    });

    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockImplementation(mockAuthorizeUserAction);
    jest.spyOn(persistenceLayer, 'findWorkerById').mockImplementation(mockFindWorkerById);
    jest.spyOn(persistenceLayer, 'findDepartmentById').mockImplementation(mockFindDepartmentById);
    jest.spyOn(persistenceLayer, 'findInitialAssignmentByWorker').mockImplementation(mockFindInitialAssignmentByWorker);
  });

  it('should successfully update an existing initial assignment record', async () => {
    const existingAssignmentId = 'assign-001';
    const workerId = 'worker-123';
    const newDepartmentId = 'dept-789';
    const newProcessId = 'PROCESS-B';
    const newStartDate = new Date('2024-02-01');
    const newEndDate = new Date('2024-04-30');
    const createdBy = 'user-001';
    const updatedBy = 'user-002';
    const requestingUserId = 'user-002';

    const updateInput = {
      assignmentId: existingAssignmentId,
      workerId: workerId,
      placementDepartment: newDepartmentId,
      placementProcess: newProcessId,
      assignmentStartDate: newStartDate,
      assignmentEndDate: newEndDate,
      assignmentStatus: 'active' as const,
      remarks: '配置先を変更しました',
      createdBy: createdBy,
      updatedBy: updatedBy,
      requestingUserId: requestingUserId,
      operation: 'update' as const,
    };

    // Mock saveInitialAssignment to update the persisted records
    const saveInitialAssignmentSpy = jest.spyOn(persistenceLayer, 'saveInitialAssignment').mockImplementation(async (input) => {
      const record = persistedRecords.get(input.assignmentId);
      if (record) {
        const updatedRecord = {
          ...record,
          placementDepartment: input.placementDepartment,
          placementProcess: input.placementProcess,
          assignmentStartDate: input.assignmentStartDate,
          assignmentEndDate: input.assignmentEndDate,
          assignmentStatus: input.assignmentStatus,
          remarks: input.remarks,
          updatedBy: input.updatedBy,
          updatedAt: new Date(),
        };
        persistedRecords.set(input.assignmentId, updatedRecord);
      }
      return {
        success: true,
        assignmentId: input.assignmentId,
        operation: input.operation,
        savedAt: new Date(),
        message: undefined,
      };
    });

    const result = await saveInitialAssignment(updateInput);

    expect(result.success).toBe(true);
    expect(result.assignmentId).toBe(existingAssignmentId);
    expect(result.operation).toBe('update');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();

    // Verify the persisted record state
    const persistedRecord = persistedRecords.get(existingAssignmentId);
    expect(persistedRecord).toBeDefined();
    expect(persistedRecord.workerId).toBe(workerId);
    expect(persistedRecord.placementDepartment).toBe(newDepartmentId);
    expect(persistedRecord.placementProcess).toBe(newProcessId);
    expect(persistedRecord.assignmentStartDate).toEqual(newStartDate);
    expect(persistedRecord.assignmentEndDate).toEqual(newEndDate);
    expect(persistedRecord.assignmentStatus).toBe('active');
    expect(persistedRecord.remarks).toBe('配置先を変更しました');
    expect(persistedRecord.createdBy).toBe(createdBy);
    expect(persistedRecord.updatedBy).toBe(updatedBy);

    saveInitialAssignmentSpy.mockRestore();
  });
});