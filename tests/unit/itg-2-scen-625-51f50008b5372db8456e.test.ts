import { saveDepartment } from '../../src/logic/persistence-layer';

describe('SCEN-625: 境界値：説明がnullまたはundefinedのとき、正常に保存される', () => {
  it('descriptionがnullのときに部門が正常に保存される', async () => {
    const result = await saveDepartment({
      departmentId: 'DEPT-NEW-001',
      departmentName: '営業部',
      departmentCode: 'SALES-001',
      description: null,
      parentDepartmentId: undefined,
      responsibleUserId: 'USER-001',
      status: 'active',
      createdBy: 'USER-ADMIN',
      requestingUserId: 'USER-ADMIN',
      operation: 'create',
      updatedBy: undefined,
    });

    expect(result.success).toBe(true);
    expect(result.departmentId).toBe('DEPT-NEW-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });

  it('descriptionがundefinedのときに部門が正常に保存される', async () => {
    const result = await saveDepartment({
      departmentId: 'DEPT-NEW-002',
      departmentName: '営業部',
      departmentCode: 'SALES-002',
      description: undefined,
      parentDepartmentId: undefined,
      responsibleUserId: 'USER-001',
      status: 'active',
      createdBy: 'USER-ADMIN',
      requestingUserId: 'USER-ADMIN',
      operation: 'create',
      updatedBy: undefined,
    });

    expect(result.success).toBe(true);
    expect(result.departmentId).toBe('DEPT-NEW-002');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });
});