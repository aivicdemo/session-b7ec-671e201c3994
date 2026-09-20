import { deliverAllocationPlanAndWorkInstructions } from '../../src/logic/work-instruction-delivery-manager';
import * as authModule from '../../src/logic/auth-authorization-audit';
import * as persistenceModule from '../../src/logic/persistence';
import * as auditModule from '../../src/logic/audit';

describe('SCEN-194: 操作ユーザーが配置案の対象拠点・チームへの配信権限を持たない場合', () => {
  let authorizeSpy: jest.SpyInstance;
  let saveWorkInstructionReceptionHistorySpy: jest.SpyInstance;
  let saveAllocationExecutionStatusSpy: jest.SpyInstance;
  let recordOperationAuditSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UnauthorizedDeliveryエラーで拒否し、配信操作と監査ログが記録されない', async () => {
    const allocationPlanId = 'AP-001';
    const facilityId = 'FAC-100';
    const teamId = 'TEAM-A';
    const operatingUserId = 'USR-002';

    authorizeSpy = jest.spyOn(authModule, 'authorizeOperation').mockResolvedValue({
      isAuthorized: false,
      userId: operatingUserId,
      facilityId: facilityId,
    });

    saveWorkInstructionReceptionHistorySpy = jest
      .spyOn(persistenceModule, 'saveWorkInstructionReceptionHistory')
      .mockResolvedValue({ id: 'RH-001' } as any);

    saveAllocationExecutionStatusSpy = jest
      .spyOn(persistenceModule, 'saveAllocationExecutionStatus')
      .mockResolvedValue({ id: 'AES-001' } as any);

    recordOperationAuditSpy = jest
      .spyOn(auditModule, 'recordOperationAudit')
      .mockResolvedValue({ id: 'AUDIT-001' } as any);

    const input = {
      allocationPlanId,
      operatingUserId,
      deliveryNotes: null,
    };

    let thrownError: Error | undefined;
    try {
      await deliverAllocationPlanAndWorkInstructions(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('UnauthorizedDeliveryError');
    expect(thrownError?.message).toBe(
      `配信権限がありません。ユーザーID: ${operatingUserId}, 拠点ID: ${facilityId}`
    );

    expect(saveWorkInstructionReceptionHistorySpy).not.toHaveBeenCalled();
    expect(saveAllocationExecutionStatusSpy).not.toHaveBeenCalled();
    expect(recordOperationAuditSpy).not.toHaveBeenCalled();
  });
});