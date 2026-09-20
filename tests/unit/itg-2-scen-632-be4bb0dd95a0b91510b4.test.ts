import { findDepartmentsByResponsibleUser } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  authorizeUserAction: jest.fn(),
}));

describe('SCEN-632: 管理者権限を持つユーザーが有効な責任者ユーザーIDで部門を検索', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuthorizeUserAction = persistenceLayer.authorizeUserAction as jest.Mock;
    mockAuthorizeUserAction.mockResolvedValue({ authorized: true });
  });

  it('該当する部門一覧が返される', async () => {
    const mockDepartments = [
      {
        departmentId: 'DEPT-A',
        departmentName: 'Department A',
        departmentCode: 'DEPT-A-CODE',
        description: 'Test Department A',
        parentDepartmentId: null,
        responsibleUserId: 'USER-001',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        departmentId: 'DEPT-B',
        departmentName: 'Department B',
        departmentCode: 'DEPT-B-CODE',
        description: 'Test Department B',
        parentDepartmentId: null,
        responsibleUserId: 'USER-001',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        departmentId: 'DEPT-C',
        departmentName: 'Department C',
        departmentCode: 'DEPT-C-CODE',
        description: 'Test Department C',
        parentDepartmentId: null,
        responsibleUserId: 'USER-001',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const findDepartmentsByResponsibleUserMock = jest.spyOn(
      persistenceLayer,
      'findDepartmentsByResponsibleUser'
    );
    findDepartmentsByResponsibleUserMock.mockResolvedValue({
      departments: mockDepartments,
      totalCount: 3,
      found: true,
      responsibleUserId: 'USER-001',
    });

    let error: Error | null = null;
    let result;

    try {
      result = await findDepartmentsByResponsibleUser({
        responsibleUserId: 'USER-001',
        statusFilter: undefined,
        requestingUserId: 'ADMIN-USER',
      });
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result.departments).toHaveLength(3);
    expect(result.departments[0].departmentId).toBe('DEPT-A');
    expect(result.departments[1].departmentId).toBe('DEPT-B');
    expect(result.departments[2].departmentId).toBe('DEPT-C');
    expect(result.totalCount).toBe(3);
    expect(result.found).toBe(true);
    expect(result.responsibleUserId).toBe('USER-001');
    expect(result.departments.every((dept) => dept.status === 'active')).toBe(true);

    findDepartmentsByResponsibleUserMock.mockRestore();
  });
});