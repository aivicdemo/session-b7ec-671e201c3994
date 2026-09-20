import { saveDepartment, SaveDepartmentInput, SaveDepartmentOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  authorizeUserAction: jest.fn(),
  validateInputData: jest.fn(),
  findDepartmentByCode: jest.fn(),
  findUserById: jest.fn(),
}));

describe('SCEN-618: 境界値：部門名が1文字のとき、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully save a department with 1-character name', async () => {
    const input: SaveDepartmentInput = {
      departmentId: 'dept-new-001',
      departmentName: 'A',
      departmentCode: 'ABC-001',
      description: null,
      parentDepartmentId: undefined,
      responsibleUserId: 'user-001',
      status: 'active',
      createdBy: 'user-admin',
      updatedBy: undefined,
      requestingUserId: 'user-admin',
      operation: 'create',
    };

    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });

    (persistenceLayer.findDepartmentByCode as jest.Mock).mockResolvedValue({
      found: false,
    });

    (persistenceLayer.findUserById as jest.Mock).mockResolvedValue({
      found: true,
      userId: 'user-001',
      userName: 'test-user',
      email: 'user@example.com',
      fullName: 'Test User',
      role: 'manager',
      siteId: null,
      teamId: null,
      status: 'active',
      lastLoginDateTime: null,
    });

    const beforeCall = new Date();
    const result: SaveDepartmentOutput = await saveDepartment(input);
    const afterCall = new Date();

    expect(result.success).toBe(true);
    expect(result.departmentId).toBe('dept-new-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    expect(
      result.message === undefined ||
        (typeof result.message === 'string' && result.message.length > 0)
    ).toBe(true);

    expect(persistenceLayer.authorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-admin',
      })
    );

    expect(persistenceLayer.validateInputData).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentName: 'A',
      })
    );

    expect(persistenceLayer.findDepartmentByCode).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentCode: 'ABC-001',
      })
    );

    expect(persistenceLayer.findUserById).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-001',
      })
    );
  });
});