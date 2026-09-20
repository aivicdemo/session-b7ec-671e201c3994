import { saveDepartment } from '../../src/logic/persistence-layer';

describe('SCEN-611: エラー：親部門に自身の部門を指定するなど、階層に循環参照が生じると、循環参照エラーが発生する', () => {
  it('should throw CircularDepartmentHierarchyError when circular reference is detected', async () => {
    // Step 1: Create Department A
    const resultA = await saveDepartment({
      departmentId: 'dept-a',
      departmentName: '部門A',
      departmentCode: 'DEPT-A',
      parentDepartmentId: null,
      responsibleUserId: 'user-001',
      status: 'active',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create',
    });
    expect(resultA.success).toBe(true);
    expect(resultA.departmentId).toBe('dept-a');

    // Step 2: Create Department B with Department A as parent
    const resultB = await saveDepartment({
      departmentId: 'dept-b',
      departmentName: '部門B',
      departmentCode: 'DEPT-B',
      parentDepartmentId: 'dept-a',
      responsibleUserId: 'user-002',
      status: 'active',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create',
    });
    expect(resultB.success).toBe(true);
    expect(resultB.departmentId).toBe('dept-b');

    // Step 3: Create Department C with Department B as parent
    const resultC = await saveDepartment({
      departmentId: 'dept-c',
      departmentName: '部門C',
      departmentCode: 'DEPT-C',
      parentDepartmentId: 'dept-b',
      responsibleUserId: 'user-003',
      status: 'active',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create',
    });
    expect(resultC.success).toBe(true);
    expect(resultC.departmentId).toBe('dept-c');

    // Step 4: Update Department A to create circular reference (A -> C -> B -> A)
    const circularUpdatePromise = saveDepartment({
      departmentId: 'dept-a',
      departmentName: '部門A',
      departmentCode: 'DEPT-A',
      parentDepartmentId: 'dept-c',
      responsibleUserId: 'user-001',
      status: 'active',
      updatedBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'update',
    });

    // Step 5: Verify that CircularDepartmentHierarchyError is thrown
    await expect(circularUpdatePromise).rejects.toThrow('部門階層に循環参照が発生します。親部門を確認してください。');
  });
});