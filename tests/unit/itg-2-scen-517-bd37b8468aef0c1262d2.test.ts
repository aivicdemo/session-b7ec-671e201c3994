import { saveInitialAssignment } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-517: saveInitialAssignment - Duplicate active initial assignment error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DuplicateActiveAssignmentError when overlapping active assignment exists', async () => {
    const requestingUserId = 'USER001';
    const workerId = 'W001';
    const placementDepartment = 'D001';
    const assignmentId = 'a8f7e6d5-c4b3-a2f1-9e8d-7c6b5a4f3e2d';

    const newAssignmentStartDate = new Date('2024-02-01');
    const newAssignmentEndDate = new Date('2024-04-30');
    const existingAssignmentStartDate = new Date('2024-01-01');
    const existingAssignmentEndDate = new Date('2024-03-31');

    const existingAssignment = {
      assignmentId: 'existing-assignment-id',
      workerId,
      placementDepartment: 'D001',
      placementProcess: 'PROC001',
      assignmentStartDate: existingAssignmentStartDate,
      assignmentEndDate: existingAssignmentEndDate,
      assignmentStatus: 'active',
      remarks: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      found: true,
    };

    const input = {
      assignmentId,
      workerId,
      placementDepartment,
      placementProcess: 'PROC001',
      assignmentStartDate: newAssignmentStartDate,
      assignmentEndDate: newAssignmentEndDate,
      assignmentStatus: 'active' as const,
      remarks: undefined,
      createdBy: 'USER001',
      requestingUserId,
      operation: 'create' as const,
    };

    const authorizeUserActionSpy = jest
      .spyOn(persistenceLayer, 'authorizeUserAction' as any)
      .mockResolvedValue(true);

    const findWorkerByIdSpy = jest
      .spyOn(persistenceLayer, 'findWorkerById' as any)
      .mockResolvedValue({
        workerId,
        workerName: 'Test Worker',
        siteId: 'S001',
        teamId: 'T001',
        jobType: 'PICKING',
        operatingStatus: 'active',
        hourlyRate: 1000,
        maxOperatingHours: 8,
        found: true,
      });

    const findDepartmentByIdSpy = jest
      .spyOn(persistenceLayer, 'findDepartmentById' as any)
      .mockResolvedValue({
        departmentId: placementDepartment,
        departmentName: 'Test Department',
        departmentCode: 'DEPT001',
        description: null,
        parentDepartmentId: null,
        responsibleUserId: 'USER002',
        status: 'active',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        found: true,
      });

    const findInitialAssignmentByWorkerSpy = jest
      .spyOn(persistenceLayer, 'findInitialAssignmentByWorker' as any)
      .mockResolvedValue(existingAssignment);

    const saveToDbSpy = jest
      .spyOn(persistenceLayer, 'saveToDb' as any)
      .mockResolvedValue({});

    let errorThrown = false;
    let thrownError: any = null;

    try {
      await saveInitialAssignment(input);
    } catch (error) {
      errorThrown = true;
      thrownError = error;
    }

    // 権限チェックが実行されたことを検証
    expect(authorizeUserActionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingUserId,
      })
    );

    // 作業者存在確認が実行されたことを検証
    expect(findWorkerByIdSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId,
        requestingUserId,
      })
    );
    expect(findWorkerByIdSpy.mock.results[0].value).toMatchObject({
      found: true,
    });

    // 部門存在確認が実行されたことを検証
    expect(findDepartmentByIdSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentId: placementDepartment,
        requestingUserId,
      })
    );
    expect(findDepartmentByIdSpy.mock.results[0].value).toMatchObject({
      found: true,
    });

    // 期間重複チェックが実行されたことを検証
    expect(findInitialAssignmentByWorkerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId,
        requestingUserId,
      })
    );

    expect(findInitialAssignmentByWorkerSpy.mock.results[0].value).toMatchObject({
      assignmentStatus: 'active',
      found: true,
      assignmentStartDate: existingAssignmentStartDate,
      assignmentEndDate: existingAssignmentEndDate,
    });

    // エラー検証
    expect(errorThrown).toBe(true);
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DuplicateActiveAssignmentError');
    expect(thrownError.message).toBe(
      '作業者 W001 に対して期間 2024-02-01 ～ 2024-04-30 と重複する有効な初期割当が既に存在します。'
    );

    // 期間重複判定の検証
    const existingStart = existingAssignmentStartDate.getTime();
    const existingEnd = existingAssignmentEndDate.getTime();
    const newStart = newAssignmentStartDate.getTime();
    const newEnd = newAssignmentEndDate.getTime();
    const periodsOverlap = newStart <= existingEnd && newEnd >= existingStart;
    expect(periodsOverlap).toBe(true);

    // レコード保存が呼び出されていないことを検証
    expect(saveToDbSpy).not.toHaveBeenCalled();
  });
});