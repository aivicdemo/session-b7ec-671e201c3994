import { saveAllocationChangeHistory } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-645: saveAllocationChangeHistory - Department not found error', () => {
  it('should throw DepartmentNotFoundError when previousDepartmentId does not exist', async () => {
    const input = {
      allocationChangeHistoryId: 'AACH-001',
      workerId: 'W001',
      previousPlacementPlanId: 'PP-001',
      newPlacementPlanId: 'PP-002',
      previousDepartmentId: 'DEPT-INVALID-001',
      newDepartmentId: 'DEPT-002',
      previousWorkTypeId: null,
      newWorkTypeId: null,
      changeReason: '生産性向上',
      changeReasonDetail: null,
      changeExecutionDate: new Date(),
      plannedChangeDate: null,
      executorUserId: 'USER-001',
      approverUserId: null,
      approvalDateTime: null,
      status: 'pending' as const,
      createdBy: 'USER-001',
      requestingUserId: 'USER-001',
    };

    // スタブ処理: authorizeUserAction - 配置変更記録権限を持つユーザーを許可
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue({ 
      success: true,
      userId: 'USER-001',
      permission: '配置変更記録',
    });

    // スタブ処理: validateInputData - 全入力値の有効性チェックを通す
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // スタブ処理: findPlacementPlanByWorkerAndDate - 変更前の配置計画PP-001を返す
    jest.spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate' as any).mockImplementation(
      (workerId: string, placementPlanId: string) => {
        if (workerId === 'W001' && placementPlanId === 'PP-001') {
          return Promise.resolve({
            placementPlanId: 'PP-001',
            workerId: 'W001',
            placementDepartment: 'DEPT-001',
            placementJobType: 'JOB-001',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            placementStatus: 'active',
            expectedProductivityTarget: 80,
            optimizationReason: null,
            found: true,
          });
        }
        if (workerId === 'W001' && placementPlanId === 'PP-002') {
          return Promise.resolve({
            placementPlanId: 'PP-002',
            workerId: 'W001',
            placementDepartment: 'DEPT-002',
            placementJobType: 'JOB-002',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            placementStatus: 'active',
            expectedProductivityTarget: 85,
            optimizationReason: '生産性向上',
            found: true,
          });
        }
        return Promise.resolve(null);
      }
    );

    // スタブ処理: findDepartmentById - DEPT-002は有効な部門レコードを返す
    jest.spyOn(persistenceLayer, 'findDepartmentById' as any).mockImplementation(
      (departmentId: string) => {
        if (departmentId === 'DEPT-002') {
          return Promise.resolve({
            departmentId: 'DEPT-002',
            departmentName: 'Department 2',
            departmentCode: 'DEPT-002',
            description: 'Test Department 2',
            parentDepartmentId: null,
            responsibleUserId: 'USER-001',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            found: true,
          });
        }
        return Promise.resolve(null);
      }
    );

    // スタブ処理: findDepartmentById - DEPT-INVALID-001は null または not found を返す
    const findDeptSpy = jest.spyOn(persistenceLayer, 'findDepartmentById' as any);
    findDeptSpy.mockImplementation((departmentId: string) => {
      if (departmentId === 'DEPT-INVALID-001') {
        return Promise.resolve(null);
      }
      if (departmentId === 'DEPT-002') {
        return Promise.resolve({
          departmentId: 'DEPT-002',
          departmentName: 'Department 2',
          departmentCode: 'DEPT-002',
          description: 'Test Department 2',
          parentDepartmentId: null,
          responsibleUserId: 'USER-001',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          found: true,
        });
      }
      return Promise.resolve(null);
    });

    // スタブ処理: findUserById - USER-001は有効なユーザーレコードを返す
    jest.spyOn(persistenceLayer, 'findUserById' as any).mockImplementation(
      (userId: string) => {
        if (userId === 'USER-001') {
          return Promise.resolve({
            userId: 'USER-001',
            userName: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'admin',
            siteId: null,
            teamId: null,
            status: 'active',
            lastLoginDateTime: null,
            found: true,
          });
        }
        return Promise.resolve(null);
      }
    );

    // 期待されるエラーの発生を検証
    let errorThrown = false;
    let thrownError: any = null;

    try {
      await saveAllocationChangeHistory(input);
    } catch (error) {
      errorThrown = true;
      thrownError = error;
    }

    // DepartmentNotFoundError が発生することを検証
    expect(errorThrown).toBe(true);
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('DepartmentNotFoundError');
    expect(thrownError.message).toBe('指定された部門が見つかりません。部門IDを確認してください。');

    // 出力型 SaveAllocationChangeHistoryOutput は返されず、エラー時の結果を検証
    // エラーが throw されているため、成功時の出力型は返されない
    expect(thrownError.success).toBeUndefined();
    expect(thrownError.allocationChangeHistoryId).toBeUndefined();
    expect(thrownError.workerId).toBeUndefined();
    expect(thrownError.previousPlacementPlanId).toBeUndefined();
    expect(thrownError.newPlacementPlanId).toBeUndefined();
    expect(thrownError.changeExecutionDate).toBeUndefined();
    expect(thrownError.status).toBeUndefined();
    expect(thrownError.savedAt).toBeUndefined();
  });
});