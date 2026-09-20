import { saveDepartment, SaveDepartmentInput, SaveDepartmentOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-619: 部門名が100文字のとき、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully save a new department with a 100-character name', async () => {
    const departmentName100Chars = 'a'.repeat(100);
    
    const input: SaveDepartmentInput = {
      departmentId: 'dept-test-001',
      departmentName: departmentName100Chars,
      departmentCode: 'DEPT-001',
      description: null,
      parentDepartmentId: null,
      responsibleUserId: 'user-123',
      status: 'active',
      createdBy: 'admin-001',
      requestingUserId: 'admin-001',
      operation: 'create',
    };

    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue(true);
    jest.spyOn(persistenceLayer, 'findDepartmentById' as any).mockResolvedValue(null);
    jest.spyOn(persistenceLayer, 'findUserById' as any).mockResolvedValue({
      userId: 'user-123',
      status: 'active',
    });

    const result: SaveDepartmentOutput = await saveDepartment(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.departmentId).toBeDefined();
    expect(typeof result.savedAt).toBe('object');
    expect(result.savedAt instanceof Date).toBe(true);
    expect(result.message === undefined || typeof result.message === 'string').toBe(true);
    expect(result.departmentId).not.toEqual('');
  });

  it('should persist department data correctly when name length is exactly 100 characters', async () => {
    const departmentName100Chars = 'x'.repeat(100);
    
    const input: SaveDepartmentInput = {
      departmentId: 'dept-boundary-test',
      departmentName: departmentName100Chars,
      departmentCode: 'DEPT-BOUNDARY-100',
      description: null,
      parentDepartmentId: null,
      responsibleUserId: 'user-456',
      status: 'active',
      createdBy: 'admin-002',
      requestingUserId: 'admin-002',
      operation: 'create',
    };

    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue(true);
    jest.spyOn(persistenceLayer, 'findDepartmentById' as any).mockResolvedValue(null);
    jest.spyOn(persistenceLayer, 'findUserById' as any).mockResolvedValue({
      userId: 'user-456',
      status: 'active',
    });

    const result: SaveDepartmentOutput = await saveDepartment(input);

    expect(result.success).toBe(true);
    expect(result.departmentId).toBeTruthy();
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
  });
});