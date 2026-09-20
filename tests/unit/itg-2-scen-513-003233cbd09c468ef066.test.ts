import { saveInitialAssignment, findInitialAssignmentByWorker, findWorkerById, findDepartmentById } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-513: 新規作成時に有効な入力値で初期割当レコードが正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a new initial assignment record with valid input values', async () => {
    // Arrange
    const newAssignmentId = 'uuid-new-assignment-001';
    const validWorkerId = 'worker-001';
    const validDepartmentId = 'dept-001';
    const validPlacementProcess = 'process-001';
    const assignmentStartDate = new Date('2024-04-01');
    const assignmentEndDate = new Date('2024-06-30');
    const creatingUserId = 'user-creator-001';
    const requestingUserId = 'user-requester-001';

    const input = {
      assignmentId: newAssignmentId,
      workerId: validWorkerId,
      placementDepartment: validDepartmentId,
      placementProcess: validPlacementProcess,
      assignmentStartDate: assignmentStartDate,
      assignmentEndDate: assignmentEndDate,
      assignmentStatus: 'active' as const,
      remarks: 'テスト初期配置',
      createdBy: creatingUserId,
      requestingUserId: requestingUserId,
      operation: 'create' as const,
    };

    // Setup stubs for dependency validation
    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
      workerId: validWorkerId,
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });

    (persistenceLayer.findDepartmentById as jest.Mock).mockResolvedValue({
      departmentId: validDepartmentId,
      departmentName: 'Test Department',
      departmentCode: 'DEPT001',
      responsibleUserId: 'user-resp-001',
      status: 'active',
      found: true,
    });

    (persistenceLayer.findInitialAssignmentByWorker as jest.Mock).mockResolvedValue({
      found: false,
    });

    const savedAt = new Date();
    const savedRecord = {
      assignmentId: newAssignmentId,
      workerId: validWorkerId,
      placementDepartment: validDepartmentId,
      placementProcess: validPlacementProcess,
      assignmentStartDate: assignmentStartDate,
      assignmentEndDate: assignmentEndDate,
      assignmentStatus: 'active' as const,
      remarks: 'テスト初期配置',
      createdAt: savedAt,
      updatedAt: savedAt,
      found: true,
    };

    (persistenceLayer.saveInitialAssignment as jest.Mock).mockResolvedValue({
      success: true,
      assignmentId: newAssignmentId,
      operation: 'create' as const,
      savedAt: savedAt,
      message: 'Initial assignment saved successfully',
    });

    (persistenceLayer.findInitialAssignmentByWorker as jest.Mock).mockResolvedValueOnce({
      found: false,
    }).mockResolvedValueOnce(savedRecord);

    // Act
    const result = await saveInitialAssignment(input);

    // Assert - Verify saveInitialAssignment result
    expect(result.success).toBe(true);
    expect(result.assignmentId).toBe(newAssignmentId);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.savedAt.getTime()).toBeGreaterThan(new Date().getTime() - 5000);

    // Verify that findWorkerById was called for validation
    expect(persistenceLayer.findWorkerById).toHaveBeenCalledWith(
      expect.objectContaining({ 
        workerId: validWorkerId,
        requestingUserId: requestingUserId 
      })
    );

    // Verify that findDepartmentById was called for validation
    expect(persistenceLayer.findDepartmentById).toHaveBeenCalledWith(
      expect.objectContaining({ 
        departmentId: validDepartmentId,
        requestingUserId: requestingUserId 
      })
    );

    // Verify that period overlap check was performed
    expect(persistenceLayer.findInitialAssignmentByWorker).toHaveBeenCalledWith(
      expect.objectContaining({ 
        workerId: validWorkerId,
        requestingUserId: requestingUserId 
      })
    );

    // Verify persisted data by calling findInitialAssignmentByWorker
    const retrievedRecord = await findInitialAssignmentByWorker({
      workerId: validWorkerId,
      requestingUserId: requestingUserId,
    });

    expect(retrievedRecord.found).toBe(true);
    expect(retrievedRecord.assignmentId).toBe(newAssignmentId);
    expect(retrievedRecord.workerId).toBe(validWorkerId);
    expect(retrievedRecord.placementDepartment).toBe(validDepartmentId);
    expect(retrievedRecord.placementProcess).toBe(validPlacementProcess);
    expect(retrievedRecord.assignmentStartDate.getTime()).toBe(assignmentStartDate.getTime());
    expect(retrievedRecord.assignmentEndDate.getTime()).toBe(assignmentEndDate.getTime());
    expect(retrievedRecord.assignmentStatus).toBe('active');
    expect(retrievedRecord.remarks).toBe('テスト初期配置');
    expect(retrievedRecord.createdAt).toBeInstanceOf(Date);
    expect(retrievedRecord.updatedAt).toBeInstanceOf(Date);
  });
});