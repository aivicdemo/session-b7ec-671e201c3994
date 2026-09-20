import { saveInitialAssignment, SaveInitialAssignmentInput } from '../../src/logic/persistence-layer';
import { UnauthorizedAccessError } from '../../src/types/errors';

jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
    authorizeUserAction: jest.fn(),
    findWorkerById: jest.fn(),
    findDepartmentById: jest.fn(),
  };
});

import { authorizeUserAction, findWorkerById, findDepartmentById } from '../../src/logic/persistence-layer';

describe('SCEN-518: リクエスト実行者が初期割当の保存権限を持たない場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('権限がない場合、UnauthorizedAccessError がスローされ、エラー文言が一致すること', async () => {
    const input: SaveInitialAssignmentInput = {
      assignmentId: 'assign-001',
      workerId: 'worker-123',
      placementDepartment: 'dept-A',
      placementProcess: 'process-01',
      assignmentStartDate: new Date('2025-04-01'),
      assignmentEndDate: new Date('2025-06-30'),
      assignmentStatus: 'active',
      remarks: null,
      createdBy: 'user-admin',
      updatedBy: undefined,
      requestingUserId: 'user-no-permission',
      operation: 'create',
    };

    (authorizeUserAction as jest.Mock).mockResolvedValue(false);
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });
    (findDepartmentById as jest.Mock).mockResolvedValue({
      departmentId: 'dept-A',
      departmentName: 'Department A',
      departmentCode: 'DEPT-A',
      responsibleUserId: 'user-admin',
      status: 'active',
      found: true,
    });

    let thrownError: unknown;
    try {
      await saveInitialAssignment(input);
      fail('UnauthorizedAccessError がスローされるべきです');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(UnauthorizedAccessError);
    expect((thrownError as any).message).toBe('初期割当の保存権限がありません。');
  });

  it('エラーがスローされた場合、出力が返されないこと', async () => {
    const input: SaveInitialAssignmentInput = {
      assignmentId: 'assign-001',
      workerId: 'worker-123',
      placementDepartment: 'dept-A',
      placementProcess: 'process-01',
      assignmentStartDate: new Date('2025-04-01'),
      assignmentEndDate: new Date('2025-06-30'),
      assignmentStatus: 'active',
      remarks: null,
      createdBy: 'user-admin',
      updatedBy: undefined,
      requestingUserId: 'user-no-permission',
      operation: 'create',
    };

    (authorizeUserAction as jest.Mock).mockResolvedValue(false);
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });
    (findDepartmentById as jest.Mock).mockResolvedValue({
      departmentId: 'dept-A',
      departmentName: 'Department A',
      departmentCode: 'DEPT-A',
      responsibleUserId: 'user-admin',
      status: 'active',
      found: true,
    });

    try {
      await saveInitialAssignment(input);
      fail('UnauthorizedAccessError がスローされるべきです');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(UnauthorizedAccessError);
      const result = error as any;
      expect(result.success).toBeUndefined();
    }
  });
});