import { saveDepartment } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => {
  const actual = jest.requireActual('../../src/logic/persistence-layer');
  return {
    ...actual,
    authorizeUserAction: jest.fn(),
    validateInputData: jest.fn(),
    findUserById: jest.fn(),
  };
});

describe('SCEN-617: 正常系：保存完了時、savedAtにUTC時刻が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue(true);
    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue(true);
    (persistenceLayer.findUserById as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      found: true,
    });
  });

  it('saveDepartmentを呼び出して、SaveDepartmentOutputのsavedAtフィールドにUTC時刻が記録されることを確認する', async () => {
    const beforeCallTime = new Date();

    const result = await saveDepartment({
      departmentId: 'dept-001',
      departmentName: '営業部',
      departmentCode: 'SALES-001',
      description: undefined,
      parentDepartmentId: null,
      responsibleUserId: 'user-123',
      status: 'active',
      createdBy: 'admin-001',
      updatedBy: undefined,
      requestingUserId: 'admin-001',
      operation: 'create',
    });

    const afterCallTime = new Date();

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterCallTime.getTime());
    
    const savedAtISOString = result.savedAt.toISOString();
    expect(savedAtISOString).toMatch(/Z$/);
  });
});