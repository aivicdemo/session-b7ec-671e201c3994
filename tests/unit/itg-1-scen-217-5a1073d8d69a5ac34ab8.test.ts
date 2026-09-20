import { recordWorkInstructionReceptionAndStatus } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-217: 境界系：備考がnullの場合、受領履歴が正常に記録される', () => {
  let mockDataPersistence: any;
  let mockAuthAuthorizationAudit: any;

  beforeEach(() => {
    mockDataPersistence = {
      saveWorkInstructionReceptionHistory: jest.fn().mockResolvedValue({
        receptionHistoryId: 'RH-001',
      }),
      saveAllocationExecutionStatus: jest.fn().mockResolvedValue({
        allocationExecutionStatusId: 'AES-001',
      }),
      saveProgressData: jest.fn().mockResolvedValue({
        progressDataId: 'PD-001',
      }),
    };

    mockAuthAuthorizationAudit = {
      checkUserAccessToFacilityAndTeam: jest.fn().mockResolvedValue({
        hasAccess: true,
      }),
      recordOperationAudit: jest.fn().mockResolvedValue({
        auditLogId: 'AL-001',
      }),
    };

    jest.doMock('../../src/data/persistence', () => mockDataPersistence);
    jest.doMock('../../src/auth/authorization-audit', () => mockAuthAuthorizationAudit);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should successfully record reception history with null notes', async () => {
    const input = {
      workInstructionId: 'WI-001',
      workerId: 'WKR-001',
      allocationExecutionStatusId: 'AES-001',
      receptionStatus: 'received' as const,
      receptionConfirmationTimestamp: '2024-01-15T09:30:00Z',
      executionStatus: 'not_started' as const,
      executionStartTimestamp: null,
      executionEndTimestamp: null,
      progressRate: 0,
      completedQuantity: 0,
      plannedQuantity: 100,
      plannedEndTimestamp: '2024-01-15T17:00:00Z',
      actualWorkHours: null,
      deliveryMethod: 'handy_terminal' as const,
      operatingUserId: 'USR-001',
      notes: null,
    };

    const result = await recordWorkInstructionReceptionAndStatus(input);

    expect(mockAuthAuthorizationAudit.checkUserAccessToFacilityAndTeam).toHaveBeenCalled();

    expect(mockDataPersistence.saveWorkInstructionReceptionHistory).toHaveBeenCalled();
    const receptionHistoryCall = mockDataPersistence.saveWorkInstructionReceptionHistory.mock.calls[0][0];
    expect(receptionHistoryCall.notes).toBeNull();

    expect(mockDataPersistence.saveAllocationExecutionStatus).toHaveBeenCalled();
    expect(mockDataPersistence.saveProgressData).toHaveBeenCalled();
    expect(mockAuthAuthorizationAudit.recordOperationAudit).toHaveBeenCalled();

    expect(result.receptionHistoryId).toBe('RH-001');
    expect(result.allocationExecutionStatusId).toBe('AES-001');
    expect(result.progressDataId).toBe('PD-001');
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.receptionStatus).toBe('received');
    expect(result.executionStatus).toBe('not_started');
    expect(result.progressRate).toBe(0);
    expect(result.isDelayed).toBe(false);
    expect(result.delayDays).toBeNull();
    expect(result.recordedTimestamp).toBeTruthy();
    expect(typeof result.recordedTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.recordedTimestamp)).toBe(true);
    expect(result.auditLogId).toBe('AL-001');
  });
});