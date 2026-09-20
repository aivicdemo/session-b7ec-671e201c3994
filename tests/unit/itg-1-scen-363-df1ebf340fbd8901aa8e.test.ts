import { authorizeOperation } from '../../src/logic/auth-authorization-audit';
import type {
  AuthorizeOperationInput,
  AuthorizeOperationOutput,
  UserPermissionRecord,
  ResolveUserRoleAndPermissionsOutput,
  JudgeOperationAuthorizationOutput,
  AuditLogEntry,
  RecordOperationAuditOutput,
} from '../../src/logic/auth-authorization-audit';

jest.mock('../../src/logic/auth-authorization-audit', () => {
  const actual = jest.requireActual('../../src/logic/auth-authorization-audit');
  return {
    ...actual,
    resolveUserRoleAndPermissions: jest.fn(),
    judgeOperationAuthorization: jest.fn(),
    buildAuditLogEntry: jest.fn(),
    recordOperationAudit: jest.fn(),
  };
});

import {
  resolveUserRoleAndPermissions,
  judgeOperationAuthorization,
  buildAuditLogEntry,
  recordOperationAudit,
} from '../../src/logic/auth-authorization-audit';

describe('SCEN-363: 全チームアクセス可能なユーザーが任意のチームスコープ操作を実行する権限判定', () => {
  const mockResolveUserRoleAndPermissions = resolveUserRoleAndPermissions as jest.MockedFunction<typeof resolveUserRoleAndPermissions>;
  const mockJudgeOperationAuthorization = judgeOperationAuthorization as jest.MockedFunction<typeof judgeOperationAuthorization>;
  const mockBuildAuditLogEntry = buildAuditLogEntry as jest.MockedFunction<typeof buildAuditLogEntry>;
  const mockRecordOperationAudit = recordOperationAudit as jest.MockedFunction<typeof recordOperationAudit>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass authorization when user with null assignedTeamId performs team-scoped operation on arbitrary team', async () => {
    // 入力値の設定
    const userId = 'user-001';
    const userRole = '現場リーダー';
    const assignedFacilityId = 'facility-A';
    const assignedTeamId = null;
    const operationType = 'deliver_work_instruction';
    const targetTeamId = 'team-B';
    const ipAddress = '192.168.1.100';
    const sessionId = 'session-xyz789';

    const userPermissions: UserPermissionRecord[] = [
      {
        permissionId: 'perm-001',
        operationType: 'deliver_work_instruction',
        operationAllowed: true,
        validFromDateTime: new Date(Date.now() - 86400000).toISOString(),
        validUntilDateTime: new Date(Date.now() + 86400000).toISOString(),
        accessScopeFacilityIds: null,
        accessScopeTeamIds: null,
      },
    ];

    const input: AuthorizeOperationInput = {
      userId,
      userRole,
      assignedFacilityId,
      assignedTeamId,
      operationType,
      targetTeamId,
      userPermissions,
      ipAddress,
      sessionId,
    };

    // resolveUserRoleAndPermissionsをスタブ化
    const resolvedRoleAndPermissions: ResolveUserRoleAndPermissionsOutput = {
      userId,
      userRole,
      assignedFacilityId,
      assignedTeamId,
      validUserPermissions: userPermissions,
      resolvedDateTime: new Date().toISOString(),
    };
    mockResolveUserRoleAndPermissions.mockResolvedValue(resolvedRoleAndPermissions);

    // judgeOperationAuthorizationをスタブ化
    // (1) userRole が operationType に必要な最小ロールレベルを満たす
    // (2) assignedTeamId が null のため、targetTeamId が何であってもチームアクセス制限が適用されない
    // (3) userPermissions に当該 operationType の有効な権限レコードが存在
    // (4) ユーザーステータスが有効
    const judgeResult: JudgeOperationAuthorizationOutput = {
      authorized: true,
      denialReason: null,
      matchedPermissionId: 'perm-001',
    };
    mockJudgeOperationAuthorization.mockResolvedValue(judgeResult);

    // buildAuditLogEntryをスタブ化
    // userId='user-001'、operationType='deliver_work_instruction' を含み、
    // 成功（operationStatus='SUCCESS'）を示す監査ログエントリを生成
    const auditLogEntry: AuditLogEntry = {
      auditLogId: 'audit-log-20250115-001',
      userId,
      operationType,
      operationTargetTable: 'work_instruction',
      operationTargetId: 'target-001',
      operationStatus: 'SUCCESS',
      changeBeforeValue: null,
      changeAfterValue: null,
      errorMessage: null,
      ipAddress,
      sessionId,
      operationDateTime: new Date().toISOString(),
      recordedDateTime: new Date().toISOString(),
    };
    mockBuildAuditLogEntry.mockResolvedValue(auditLogEntry);

    // recordOperationAuditをスタブ化し、auditLogId='audit-log-20250115-001' を返す
    const recordResult: RecordOperationAuditOutput = {
      auditLogId: 'audit-log-20250115-001',
      recordedDateTime: new Date().toISOString(),
      status: 'RECORDED',
    };
    mockRecordOperationAudit.mockResolvedValue(recordResult);

    // authorizeOperation処理を実行
    let result: AuthorizeOperationOutput | undefined;
    let thrownError: Error | undefined;

    try {
      result = await authorizeOperation(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーが発生しないことを検証
    // UnauthorizedOperationError、TeamAccessDeniedError、InsufficientRoleError、
    // PermissionExpiredError、UserStatusInvalidError など設計済みエラーは発生しない
    expect(thrownError).toBeUndefined();

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result?.authorized).toBe(true);
    expect(result?.userId).toBe(userId);
    expect(result?.operationType).toBe(operationType);
    expect(result?.denialReason).toBeNull();
    expect(result?.auditLogId).toBe('audit-log-20250115-001');

    // スタブ化されたメソッドが適切に呼び出されたことを確認
    expect(mockResolveUserRoleAndPermissions).toHaveBeenCalled();
    expect(mockJudgeOperationAuthorization).toHaveBeenCalled();
    expect(mockBuildAuditLogEntry).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });
});