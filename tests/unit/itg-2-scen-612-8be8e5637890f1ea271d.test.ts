import { saveDepartment } from '../../src/logic/persistence-layer';

describe('SCEN-612: saveDepartment error handling - invalid status', () => {
  it('should throw InvalidDepartmentStatusError when an undefined status value is specified', async () => {
    const input = {
      departmentId: 'DEPT001',
      departmentName: '営業部',
      departmentCode: 'SALES',
      description: '営業部門',
      parentDepartmentId: null,
      responsibleUserId: 'USER123',
      status: 'invalid_status',
      createdBy: 'USER456',
      requestingUserId: 'USER456',
      operation: 'create' as const,
      updatedBy: undefined,
    };

    let error: Error | null = null;
    try {
      await saveDepartment(input);
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.name).toBe('InvalidDepartmentStatusError');
    expect(error?.message).toBe(
      "ステータス 'invalid_status' は無効です。有効な値: active, inactive, archived。"
    );
  });
});