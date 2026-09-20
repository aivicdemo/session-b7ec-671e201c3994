import { saveDepartment } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
  };
});

describe('SCEN-623: 境界値：説明が500文字のとき、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save department successfully when description is exactly 500 characters', async () => {
    const description500Chars = 'a'.repeat(500);
    
    const input = {
      departmentId: 'dept-new-001',
      departmentName: '営業部',
      departmentCode: 'SALES-001',
      description: description500Chars,
      parentDepartmentId: null,
      responsibleUserId: 'user-resp-001',
      status: 'active',
      createdBy: 'user-admin-001',
      updatedBy: undefined,
      requestingUserId: 'user-admin-001',
      operation: 'create' as const,
    };

    const expectedUser = {
      userId: 'user-resp-001',
      userName: 'resp_user',
      email: 'resp@example.com',
      fullName: '責任者 太郎',
      role: 'manager',
      status: 'active',
      siteId: null,
      teamId: null,
      lastLoginDateTime: null,
      found: true,
    };

    const mockAuthorizeUserAction = jest
      .spyOn(persistenceLayer, 'authorizeUserAction' as any)
      .mockResolvedValue(true);

    const mockValidateInputData = jest
      .spyOn(persistenceLayer, 'validateInputData' as any)
      .mockResolvedValue(true);

    const mockFindDepartmentById = jest
      .spyOn(persistenceLayer, 'findDepartmentById' as any)
      .mockResolvedValue({ found: false });

    const mockFindUserById = jest
      .spyOn(persistenceLayer, 'findUserById' as any)
      .mockResolvedValue(expectedUser);

    const beforeTime = new Date();
    const result = await saveDepartment(input);
    const afterTime = new Date();

    expect(result.success).toBe(true);
    expect(result.departmentId).toBe('dept-new-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    expect(result.message).toBeUndefined();

    expect(mockAuthorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingUserId: 'user-admin-001',
      })
    );

    expect(mockValidateInputData).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentName: '営業部',
        departmentCode: 'SALES-001',
        description: description500Chars,
      })
    );

    if (input.parentDepartmentId !== null) {
      expect(mockFindDepartmentById).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: input.parentDepartmentId,
          requestingUserId: 'user-admin-001',
        })
      );
    } else {
      expect(mockFindDepartmentById).not.toHaveBeenCalled();
    }

    expect(mockFindUserById).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-resp-001',
        requestingUserId: 'user-admin-001',
      })
    );

    mockAuthorizeUserAction.mockRestore();
    mockValidateInputData.mockRestore();
    mockFindDepartmentById.mockRestore();
    mockFindUserById.mockRestore();
  });
});