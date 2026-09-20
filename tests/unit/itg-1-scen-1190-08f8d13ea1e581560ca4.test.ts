import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';
import {
  DeliverImprovementInstructionToFacilityInput,
  DeliverImprovementInstructionToFacilityOutput,
} from '../../src/logic/notification-external-integration';

jest.mock('../../src/logic/notification-external-integration', () => ({
  ...jest.requireActual('../../src/logic/notification-external-integration'),
}));

describe('SCEN-1190: チームIDが指定されて特定チームへの改善指示配信が行われた場合', () => {
  let mockGetDelayRiskJudgmentById: jest.Mock;
  let mockGetFacilityById: jest.Mock;
  let mockGetTeamById: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockRecordWorkInstructionDeliveryHistory: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;
  let mockTwilioSendDelayRiskAlert: jest.Mock;
  let mockRecordDeliveryHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDelayRiskJudgmentById = jest.fn().mockResolvedValue({
      id: 'risk-001',
      workInstructionId: 'work-001',
      facilityId: 'facility-A',
      teamId: 'team-X',
      riskLevel: 'high',
      delayPredictionDays: 2,
      progressRate: 50,
      plannedProgressRate: 70,
    });

    mockGetFacilityById = jest.fn().mockResolvedValue({
      id: 'facility-A',
      name: 'Facility A',
      status: 'active',
    });

    mockGetTeamById = jest.fn().mockResolvedValue({
      id: 'team-X',
      name: 'Team X',
      facilityId: 'facility-A',
      leaderId: 'leader-X',
    });

    mockAuthorizeOperation = jest.fn().mockResolvedValue({
      authorized: true,
      userId: 'user-001',
      operation: '改善指示配信',
    });

    mockRecordWorkInstructionDeliveryHistory = jest.fn().mockResolvedValue({
      success: true,
      receptionHistoryId: 'delivery-history-001',
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue({
      auditLogId: 'audit-001',
    });

    mockTwilioSendDelayRiskAlert = jest.fn().mockResolvedValue({
      deliveryId: 'twilio-001',
      deliveryStatus: [
        {
          userId: 'leader-X',
          channel: 'email',
          deliveredAt: new Date(),
          status: 'success',
        },
        {
          userId: 'leader-X',
          channel: 'app_notification',
          deliveredAt: new Date(),
          status: 'success',
        },
      ],
    });

    mockRecordDeliveryHistory = jest.fn().mockResolvedValue({
      success: true,
      deliveryHistoryId: 'hist-001',
    });

    (global as any).getDelayRiskJudgmentById = mockGetDelayRiskJudgmentById;
    (global as any).getFacilityById = mockGetFacilityById;
    (global as any).getTeamById = mockGetTeamById;
    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).recordWorkInstructionDeliveryHistory = mockRecordWorkInstructionDeliveryHistory;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
    (global as any).twilioAdapter = {
      sendDelayRiskAlert: mockTwilioSendDelayRiskAlert,
    };
    (global as any).recordDeliveryHistory = mockRecordDeliveryHistory;
  });

  it('指定されたチームのみが配信対象となり、他のチームの現場リーダーは含まれない', async () => {
    const now = new Date();
    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'facility-A',
      teamId: 'team-X',
      improvementInstructions: [
        {
          instructionType: 'add_personnel',
          description: '人員追加が必要です',
          targetWorkInstructionIds: ['work-001'],
          recommendedActionDetails: '2名の追加配置を推奨',
        },
      ],
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId: 'user-001',
      requestedAt: now,
    };

    const result: DeliverImprovementInstructionToFacilityOutput = await deliverImprovementInstructionToFacility(input);

    expect(result.success).toBe(true);
    expect(result.delayRiskJudgmentId).toBe('risk-001');
    expect(result.facilityId).toBe('facility-A');
    expect(result.teamId).toBe('team-X');
    expect(result.deliveredChannels).toEqual(['email', 'app_notification']);

    expect(result.fieldLeaderDeliveryStatus).toBeDefined();
    expect(Array.isArray(result.fieldLeaderDeliveryStatus)).toBe(true);

    const deliveredLeaderIds = result.fieldLeaderDeliveryStatus.map((status: any) => status.userId);
    expect(deliveredLeaderIds).toContain('leader-X');
    expect(deliveredLeaderIds.length).toBe(1);

    expect(result.deliveryHistoryIds).toBeDefined();
    expect(Array.isArray(result.deliveryHistoryIds)).toBe(true);
    expect(result.deliveryHistoryIds.length).toBeGreaterThanOrEqual(1);

    expect(mockGetDelayRiskJudgmentById).toHaveBeenCalledWith('risk-001');
    expect(mockGetFacilityById).toHaveBeenCalledWith('facility-A');
    expect(mockGetTeamById).toHaveBeenCalledWith('team-X');
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('user-001', expect.objectContaining({ operation: '改善指示配信' }));
  });

  it('TwilioへのリクエストにteamIdが含まれ、チーム限定配信が実行される', async () => {
    const now = new Date();
    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'facility-A',
      teamId: 'team-X',
      improvementInstructions: [
        {
          instructionType: 'add_personnel',
          description: '人員追加が必要です',
        },
      ],
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId: 'user-001',
      requestedAt: now,
    };

    await deliverImprovementInstructionToFacility(input);

    expect(mockTwilioSendDelayRiskAlert).toHaveBeenCalled();

    const twilioCallArgs = mockTwilioSendDelayRiskAlert.mock.calls[0];
    expect(twilioCallArgs).toBeDefined();

    const twilioRequest = twilioCallArgs[0];
    expect(twilioRequest).toBeDefined();
    expect(twilioRequest.teamId).toBe('team-X');
    expect(twilioRequest.facilityId).toBe('facility-A');
  });

  it('配信履歴が記録される', async () => {
    const now = new Date();
    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'facility-A',
      teamId: 'team-X',
      improvementInstructions: [
        {
          instructionType: 'add_personnel',
          description: '人員追加が必要です',
        },
      ],
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId: 'user-001',
      requestedAt: now,
    };

    const result = await deliverImprovementInstructionToFacility(input);

    expect(result.deliveryHistoryIds.length).toBeGreaterThanOrEqual(1);
    expect(mockRecordDeliveryHistory).toHaveBeenCalled();
  });

  it('all field leader delivery statuses indicate success for the specified team', async () => {
    const now = new Date();
    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'facility-A',
      teamId: 'team-X',
      improvementInstructions: [
        {
          instructionType: 'add_personnel',
          description: '人員追加が必要です',
        },
      ],
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId: 'user-001',
      requestedAt: now,
    };

    const result = await deliverImprovementInstructionToFacility(input);

    result.fieldLeaderDeliveryStatus.forEach((status: any) => {
      expect(['success', 'failed']).toContain(status.status);
      expect(status.channel).toMatch(/^(email|app_notification|handy_terminal)$/);
      expect(status.deliveredAt).toBeInstanceOf(Date);
    });
  });
});