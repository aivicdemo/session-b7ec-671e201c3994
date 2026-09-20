import { saveDepartment, findDepartmentById } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
  };
});

describe('SCEN-620: 境界値：部門コードが3文字のとき、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('部門コードが3文字のときに正常に保存される', async () => {
    const input = {
      departmentId: 'dept-new-' + Date.now(),
      departmentName: '営業部',
      departmentCode: 'ABC',
      description: undefined,
      parentDepartmentId: undefined,
      responsibleUserId: 'user-001',
      status: 'active',
      createdBy: 'admin-001',
      updatedBy: undefined,
      requestingUserId: 'admin-001',
      operation: 'create' as const,
    };

    const result = await saveDepartment(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.departmentId).toBeDefined();
    expect(typeof result.departmentId).toBe('string');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message === undefined || typeof result.message === 'string').toBe(true);

    const savedDepartment = await findDepartmentById({
      departmentId: result.departmentId,
      requestingUserId: 'admin-001',
    });

    expect(savedDepartment.found).toBe(true);
    expect(savedDepartment.departmentCode).toBe('ABC');
    expect(savedDepartment.departmentName).toBe('営業部');
    expect(savedDepartment.responsibleUserId).toBe('user-001');
    expect(savedDepartment.status).toBe('active');
  });
});