import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';
import type {
  DeliverImprovementInstructionToFacilityInput,
  DeliverImprovementInstructionToFacilityOutput,
  ImprovementInstruction,
} from '../../src/logic/notification-external-integration';

describe('SCEN-1191: deliverImprovementInstructionToFacility - Multiple improvements in single delivery history', () => {
  let mockGetDelayRiskJudgmentById: any;
  let mockGetFacilityById: any;
  let mockGetTeamById: any;
  let mockAuthorizeOperation: any;
  let mockRecordOperationAudit: any;
  let mockRecordWorkInstructionDeliveryHistory: any;
  let mockSendEmailNotification: any;
  let mockSendAppNotification: any;
  let mockSendHandyTerminalSync: any;

  const delayRiskJudgmentId = 'risk-judgment-001';
  const facilityId = 'facility-001';
  const teamId = 'team-001';
  const requestedByUserId = 'user-001';
  const requestedAt = new Date('2024-01-15T10:00:00Z');
  const deliveryHistoryId = 'delivery-history-id-001';

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetDelayRiskJudgmentById = vi.fn().mockResolvedValue({
      delayRiskJudgmentId,
      facilityId,
      teamId,
      riskLevel: 'high',
      delayDate: new Date('2024-01-16T00:00:00Z'),
    });

    mockGetFacilityById = vi.fn().mockResolvedValue({
      facilityId,
      facilityName: 'Tokyo Facility',
      status: 'active',
    });

    mockGetTeamById = vi.fn().mockResolvedValue({
      teamId,
      teamName: 'Team A',
      facilityId,
      status: 'active',
    });

    mockAuthorizeOperation = vi.fn().mockResolvedValue(true);

    mockRecordOperationAudit = vi.fn().mockResolvedValue({
      auditId: 'audit-001',
    });

    mockRecordWorkInstructionDeliveryHistory = vi.fn().mockResolvedValue({
      receptionHistoryId: deliveryHistoryId,
      success: true,
    });

    mockSendEmailNotification = vi.fn().mockResolvedValue({
      deliveryId: 'email-delivery-001',
      status: 'success',
      deliveredAt: new Date(),
    });

    mockSendAppNotification = vi.fn().mockResolvedValue({
      deliveryId: 'app-delivery-001',
      status: 'success',
      deliveredAt: new Date(),
    });

    mockSendHandyTerminalSync = vi.fn().mockResolvedValue({
      deliveryId: 'handy-delivery-001',
      status: 'success',
      deliveredAt: new Date(),
    });

    (global as any).getDelayRiskJudgmentById = mockGetDelayRiskJudgmentById;
    (global as any).getFacilityById = mockGetFacilityById;
    (global as any).getTeamById = mockGetTeamById;
    (global as any).authorizeOperation = mockAuthorizeOperation;
    (global as any).recordOperationAudit = mockRecordOperationAudit;
    (global as any).recordWorkInstructionDeliveryHistory = mockRecordWorkInstructionDeliveryHistory;
    (global as any).sendEmailNotification = mockSendEmailNotification;
    (global as any).sendAppNotification = mockSendAppNotification;
    (global as any).sendHandyTerminalSync = mockSendHandyTerminalSync;
  });

  it('should deliver multiple improvement instructions and record as single delivery history', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Add 2 additional workers to team',
        targetWorkInstructionIds: ['work-001', 'work-002'],
        recommendedActionDetails: 'Increase headcount from 5 to 7 workers',
      },
      {
        instructionType: 'change_priority',
        description: 'Prioritize work-001 over work-003',
        targetWorkInstructionIds: ['work-001', 'work-003'],
        recommendedActionDetails: 'Reorder task sequence to meet deadline',
      },
    ];

    const deliveryChannels: ('email' | 'app_notification' | 'handy_terminal')[] = [
      'email',
      'app_notification',
      'handy_terminal',
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId,
      improvementInstructions,
      deliveryChannels,
      priority: 'high',
      requestedByUserId,
      requestedAt,
    };

    const output: DeliverImprovementInstructionToFacilityOutput =
      await deliverImprovementInstructionToFacility(input);

    expect(output.success).toBe(true);
    expect(output.delayRiskJudgmentId).toBe(delayRiskJudgmentId);
    expect(output.facilityId).toBe(facilityId);
    expect(output.teamId).toBe(teamId);
    expect(output.deliveredChannels).toEqual(
      expect.arrayContaining(['email', 'app_notification', 'handy_terminal'])
    );
    expect(Array.isArray(output.fieldLeaderDeliveryStatus)).toBe(true);
    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(output.deliveryHistoryIds[0]).toBe(deliveryHistoryId);
    expect(output.failureReason).toBeNull();
    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
  });

  it('should include all delivery channels in deliveredChannels regardless of multiple instructions', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Add workers',
        targetWorkInstructionIds: ['work-001'],
      },
      {
        instructionType: 'change_priority',
        description: 'Change priority',
        targetWorkInstructionIds: ['work-002'],
      },
      {
        instructionType: 'adjust_schedule',
        description: 'Adjust schedule',
        targetWorkInstructionIds: ['work-003'],
      },
    ];

    const deliveryChannels: ('email' | 'app_notification' | 'handy_terminal')[] = [
      'email',
      'app_notification',
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId,
      improvementInstructions,
      deliveryChannels,
      priority: 'medium',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(output.deliveredChannels).toContain('email');
    expect(output.deliveredChannels).toContain('app_notification');
    expect(output.deliveredChannels.length).toBe(2);
    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
  });

  it('should create single delivery history ID even with many improvement instructions', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Instruction 1',
      },
      {
        instructionType: 'change_priority',
        description: 'Instruction 2',
      },
      {
        instructionType: 'adjust_schedule',
        description: 'Instruction 3',
      },
      {
        instructionType: 'quality_improvement',
        description: 'Instruction 4',
      },
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId: null,
      improvementInstructions,
      deliveryChannels: ['email'],
      priority: 'low',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(output.success).toBe(true);
    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
  });

  it('should handle null teamId while maintaining single delivery history', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Add workers for entire facility',
      },
      {
        instructionType: 'change_priority',
        description: 'Reorder priorities facility-wide',
      },
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId: null,
      improvementInstructions,
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(output.teamId).toBeNull();
    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(output.success).toBe(true);
    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
  });

  it('should verify fieldLeaderDeliveryStatus contains delivery results for all channels', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Add 2 workers',
      },
      {
        instructionType: 'change_priority',
        description: 'Adjust priorities',
      },
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId,
      improvementInstructions,
      deliveryChannels: ['email', 'app_notification', 'handy_terminal'],
      priority: 'high',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(output.fieldLeaderDeliveryStatus).toBeDefined();
    expect(Array.isArray(output.fieldLeaderDeliveryStatus)).toBe(true);
    if (output.fieldLeaderDeliveryStatus.length > 0) {
      output.fieldLeaderDeliveryStatus.forEach((status) => {
        expect(status).toHaveProperty('userId');
        expect(status).toHaveProperty('channel');
        expect(status).toHaveProperty('deliveredAt');
        expect(['success', 'failed']).toContain(status.status);
      });
    }

    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
  });

  it('should not split delivery history across multiple records for multiple instructions', async () => {
    const improvementInstructions: ImprovementInstruction[] = Array.from(
      { length: 5 },
      (_, i) => ((({
        instructionType: ['add_personnel', 'change_priority', 'adjust_schedule', 'quality_improvement', 'other'][
          i % 5
        ] as 'add_personnel' | 'change_priority' | 'adjust_schedule' | 'quality_improvement' | 'other',
        description: `Instruction ${i + 1}`,
      }) as ImprovementInstruction))
    );

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId,
      improvementInstructions,
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
    expect(output.success).toBe(true);
    expect(output.failureReason).toBeNull();
  });

  it('should aggregate multiple improvement instructions in single delivery history call', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Add 2 additional workers to team',
        targetWorkInstructionIds: ['work-001', 'work-002'],
      },
      {
        instructionType: 'change_priority',
        description: 'Prioritize work-001 over work-003',
        targetWorkInstructionIds: ['work-001', 'work-003'],
      },
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId,
      improvementInstructions,
      deliveryChannels: ['email'],
      priority: 'high',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(output.success).toBe(true);
  });

  it('should verify single history record aggregates all improvement instruction types', async () => {
    const improvementInstructions: ImprovementInstruction[] = [
      {
        instructionType: 'add_personnel',
        description: 'Add 2 additional workers',
        targetWorkInstructionIds: ['work-001'],
      },
      {
        instructionType: 'change_priority',
        description: 'Change priority for work-002',
        targetWorkInstructionIds: ['work-002'],
      },
      {
        instructionType: 'adjust_schedule',
        description: 'Adjust schedule for work-003',
        targetWorkInstructionIds: ['work-003'],
      },
    ];

    const input: DeliverImprovementInstructionToFacilityInput = {
      delayRiskJudgmentId,
      facilityId,
      teamId,
      improvementInstructions,
      deliveryChannels: ['email', 'app_notification'],
      priority: 'high',
      requestedByUserId,
      requestedAt,
    };

    const output = await deliverImprovementInstructionToFacility(input);

    expect(mockRecordWorkInstructionDeliveryHistory).toHaveBeenCalledTimes(1);
    expect(output.deliveryHistoryIds).toHaveLength(1);
    expect(output.deliveryHistoryIds[0]).toBe(deliveryHistoryId);
    expect(output.success).toBe(true);
  });
});