import { authorizeOperation, resolveUserRoleAndPermissions, judgeOperationAuthorization, buildAuditLogEntry, recordOperationAudit } from '../../src/logic/auth-authorization-audit';

jest.mock('../../src/logic/auth-authorization-audit', () => ({
  resolveUserRoleAndPermissions: jest.fn(),
  judgeOperationAuthorization: jest.fn(),
  buildAuditLogEntry: jest.fn(),
  recordOperationAudit: jest.fn(),
  authorizeOperation: jest.requireActual('../../src/logic/auth-authorization-audit').authorizeOperation,
}));

describe('authorizeOperation', () => {
  describe('SCEN-364: 割り当てられた拠点と一致する拠点スコープ操作を実行すると、権限判定を通過する', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should authorize user with matching facility when generating allocation plan', async () => {
      const mockResolveResult = {
        userId: 'user-001',
        userRole: 'facility_leader',
        assignedFacilityId: 'facility-A',
        assignedTeamId: null,
        validUserPermissions: [
          {
            permissionId: 'perm-001',
            operationType: 'generate_allocation_plan',
            operationAllowed: true,
            validFromDateTime: new Date(Date.now() - 86400000).toISOString(),
            validUntilDateTime: new Date(Date.now() + 86400000).toISOString(),
            accessScopeFacilityIds: ['facility-A'],
            accessScopeTeamIds: null,
          },
        ],
        resolvedDateTime: new Date().toISOString(),
      };

      const mockJudgeResult = {
        authorized: true,
        denialReason: null,
        matchedPermissionId: 'perm-001',
      };

      const mockAuditLogEntry = {
        auditLogId: 'audit-log-001',
        userId: 'user-001',
        operationType: 'generate_allocation_plan',
        operationTargetTable: 'allocation_plan',
        operationTargetId: 'target-001',
        operationStatus: 'SUCCESS',
        ipAddress: '192.168.1.1',
        sessionId: 'session-001',
        operationDateTime: new Date().toISOString(),
        recordedDateTime: new Date().toISOString(),
      };

      const mockRecordResult = {
        auditLogId: 'audit-log-001',
        recordedDateTime: new Date().toISOString(),
        status: 'RECORDED',
      };

      (resolveUserRoleAndPermissions as jest.Mock).mockResolvedValue(mockResolveResult);
      (judgeOperationAuthorization as jest.Mock).mockResolvedValue(mockJudgeResult);
      (buildAuditLogEntry as jest.Mock).mockResolvedValue(mockAuditLogEntry);
      (recordOperationAudit as jest.Mock).mockResolvedValue(mockRecordResult);

      const input = {
        userId: 'user-001',
        userRole: 'facility_leader',
        assignedFacilityId: 'facility-A',
        assignedTeamId: null,
        operationType: 'generate_allocation_plan',
        targetFacilityId: 'facility-A',
        targetTeamId: null,
        userPermissions: [
          {
            permissionId: 'perm-001',
            operationType: 'generate_allocation_plan',
            operationAllowed: true,
            validFromDateTime: new Date(Date.now() - 86400000).toISOString(),
            validUntilDateTime: new Date(Date.now() + 86400000).toISOString(),
            accessScopeFacilityIds: ['facility-A'],
            accessScopeTeamIds: null,
          },
        ],
        ipAddress: '192.168.1.1',
        sessionId: 'session-001',
      };

      // ユーザー権限レコード配列の検証
      const permissionRecord = input.userPermissions[0];
      expect(permissionRecord.operationType).toBe('generate_allocation_plan');
      expect(new Date(permissionRecord.validUntilDateTime).getTime()).toBeGreaterThan(Date.now());
      expect(permissionRecord.accessScopeFacilityIds).toContain('facility-A');

      const result = await authorizeOperation(input);

      // 入力値が完全に一致していることの検証
      expect(result.authorized).toBe(true);
      expect(result.userId).toBe('user-001');
      expect(result.operationType).toBe('generate_allocation_plan');
      expect(result.denialReason).toBeNull();
      expect(result.auditLogId).toBe('audit-log-001');

      // スタブが呼び出されたことの検証
      expect(resolveUserRoleAndPermissions).toHaveBeenCalled();
      expect(judgeOperationAuthorization).toHaveBeenCalled();
      expect(buildAuditLogEntry).toHaveBeenCalled();
      expect(recordOperationAudit).toHaveBeenCalled();

      // 権限判定が正しい入力で呼び出されたことの検証
      const judgeCallArgs = (judgeOperationAuthorization as jest.Mock).mock.calls[0][0];
      expect(judgeCallArgs.userRole).toBe('facility_leader');
      expect(judgeCallArgs.assignedFacilityId).toBe('facility-A');
      expect(judgeCallArgs.operationType).toBe('generate_allocation_plan');
      expect(judgeCallArgs.targetFacilityId).toBe('facility-A');
      expect(judgeCallArgs.assignedTeamId).toBeNull();
      expect(judgeCallArgs.targetTeamId).toBeNull();
    });
  });
});