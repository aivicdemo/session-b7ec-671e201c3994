import { authorizeUserAction } from '../../src/logic/authorization-and-validation';
import * as authModule from '../../src/logic/authorization-and-validation';

describe('SCEN-719: 対象部門IDが指定されて部門別アクセス制御が適用される場合', () => {
  let checkRolePermissionSpy: jest.SpyInstance;
  let checkResourceAccessPermissionSpy: jest.SpyInstance;

  beforeEach(() => {
    checkRolePermissionSpy = jest.spyOn(authModule, 'checkRolePermission').mockReturnValue({
      permitted: true,
      userRole: 'department_manager',
      matchedRole: 'department_manager',
    });

    checkResourceAccessPermissionSpy = jest.spyOn(authModule, 'checkResourceAccessPermission').mockReturnValue({
      permitted: true,
      denialReason: null,
      applicableAccessLevel: 'read',
      resourceOwnershipMatch: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('部門別アクセス制御が正しく適用される場合、authorized が true で権限が返される', () => {
    const userContext = {
      userId: 'user-001',
      userName: 'Test User',
      role: 'department_manager',
      siteId: null,
      teamId: null,
      permissions: ['view_productivity_data', 'view_department_workers'],
    };

    const result = authorizeUserAction({
      userContext,
      requiredAction: 'view_productivity_data',
      resourceType: 'productivity_data',
      resourceId: 'prod-data-001',
      targetDepartmentId: 'dept-A',
    });

    expect(result.authorized).toBe(true);
    expect(result.denialReason).toBeNull();
    expect(result.applicablePermissions).toEqual(
      expect.arrayContaining(['view_productivity_data', 'view_department_workers'])
    );
    expect(checkRolePermissionSpy).toHaveBeenCalled();
    expect(checkResourceAccessPermissionSpy).toHaveBeenCalled();
  });

  it('checkRolePermission が呼び出される', () => {
    const userContext = {
      userId: 'user-001',
      userName: 'Test User',
      role: 'department_manager',
      siteId: null,
      teamId: null,
      permissions: ['view_productivity_data', 'view_department_workers'],
    };

    authorizeUserAction({
      userContext,
      requiredAction: 'view_productivity_data',
      resourceType: 'productivity_data',
      resourceId: 'prod-data-001',
      targetDepartmentId: 'dept-A',
    });

    expect(checkRolePermissionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userRole: 'department_manager',
      }),
      expect.any(Array)
    );
  });

  it('checkResourceAccessPermission が呼び出される', () => {
    const userContext = {
      userId: 'user-001',
      userName: 'Test User',
      role: 'department_manager',
      siteId: null,
      teamId: null,
      permissions: ['view_productivity_data', 'view_department_workers'],
    };

    authorizeUserAction({
      userContext,
      requiredAction: 'view_productivity_data',
      resourceType: 'productivity_data',
      resourceId: 'prod-data-001',
      targetDepartmentId: 'dept-A',
    });

    expect(checkResourceAccessPermissionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userContext,
        resourceType: 'productivity_data',
        targetDepartmentId: 'dept-A',
      })
    );
  });

  it('applicablePermissions がユーザーの役割と部門スコープに基づいた権限リストを返す', () => {
    const userContext = {
      userId: 'user-001',
      userName: 'Test User',
      role: 'department_manager',
      siteId: null,
      teamId: null,
      permissions: ['view_productivity_data', 'view_department_workers', 'edit_department_settings'],
    };

    const result = authorizeUserAction({
      userContext,
      requiredAction: 'view_productivity_data',
      resourceType: 'productivity_data',
      resourceId: 'prod-data-001',
      targetDepartmentId: 'dept-A',
    });

    expect(result.applicablePermissions).toBeDefined();
    expect(Array.isArray(result.applicablePermissions)).toBe(true);
    expect(result.applicablePermissions.length).toBeGreaterThan(0);
  });
});