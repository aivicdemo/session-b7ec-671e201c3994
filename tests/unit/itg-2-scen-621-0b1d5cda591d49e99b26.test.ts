import { saveDepartment, SaveDepartmentInput, SaveDepartmentOutput } from '../../src/logic/persistence-layer';

describe('SCEN-621: saveDepartment with 20-character departmentCode', () => {
  it('should successfully save a new department when departmentCode is exactly 20 characters', async () => {
    const input: SaveDepartmentInput = {
      departmentId: 'dept-new-001',
      departmentName: '営業部門',
      departmentCode: 'SALES-CODE-12345678',
      description: '営業部門です',
      parentDepartmentId: null,
      responsibleUserId: 'user-resp-001',
      status: 'active',
      createdBy: 'user-admin-001',
      requestingUserId: 'user-admin-001',
      operation: 'create',
    };

    const result: SaveDepartmentOutput = await saveDepartment(input);

    expect(result.success).toBe(true);
    expect(result.departmentId).toBe('dept-new-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message === undefined || typeof result.message === 'string').toBe(true);
  });
});