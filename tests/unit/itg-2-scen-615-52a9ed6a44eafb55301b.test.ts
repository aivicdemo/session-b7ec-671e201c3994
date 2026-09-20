import { saveDepartment } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  authorizeUserAction: jest.fn(),
  findDepartmentById: jest.fn(),
  findUserById: jest.fn(),
  validateInputData: jest.fn(),
}));

describe('SCEN-615: 正常系：既存部門を更新時に、入力された部門IDと同じIDが出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success with matching departmentId when updating an existing department', async () => {
    const inputDepartmentId = 'DEPT-001';
    const inputDepartmentName = '営業部（更新後）';
    const inputDepartmentCode = 'SALES';
    const inputDescription = '営業業務を担当';
    const inputResponsibleUserId = 'USER-100';
    const inputStatus = 'active';
    const inputUpdatedBy = 'USER-200';
    const inputRequestingUserId = 'USER-200';

    // Setup: 既存部門レコードを準備
    const existingDepartment = {
      departmentId: inputDepartmentId,
      departmentName: '営業部',
      departmentCode: 'SALES',
      description: '',
      parentDepartmentId: null,
      responsibleUserId: inputResponsibleUserId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      found: true,
    };

    // Setup: authorizeUserAction スタブ - 部門マスタ更新権限を返す
    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
      permission: 'department_update',
    });

    // Setup: findDepartmentById スタブ - parentDepartmentId が指定されない場合は循環参照チェックをスキップ
    (persistenceLayer.findDepartmentById as jest.Mock).mockResolvedValue(
      existingDepartment
    );

    // Setup: findUserById スタブ - 責任者ユーザーが存在し、ステータスが有効
    (persistenceLayer.findUserById as jest.Mock).mockResolvedValue({
      userId: inputResponsibleUserId,
      userName: 'user100',
      email: 'user100@example.com',
      fullName: 'User 100',
      role: 'manager',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      status: 'active',
      lastLoginDateTime: new Date(),
      found: true,
    });

    // Setup: validateInputData スタブ - 部門名・部門コード・説明・ステータスが有効形式
    (persistenceLayer.validateInputData as jest.Mock).mockReturnValue({
      valid: true,
      errors: [],
    });

    const result = await saveDepartment({
      departmentId: inputDepartmentId,
      departmentName: inputDepartmentName,
      departmentCode: inputDepartmentCode,
      description: inputDescription,
      parentDepartmentId: undefined,
      responsibleUserId: inputResponsibleUserId,
      status: inputStatus,
      updatedBy: inputUpdatedBy,
      requestingUserId: inputRequestingUserId,
      operation: 'update',
      createdBy: 'USER-100',
    });

    expect(result.success).toBe(true);
    expect(result.departmentId).toBe(inputDepartmentId);
    expect(result.operation).toBe('update');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});