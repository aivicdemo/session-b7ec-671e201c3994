import { deliverPlacementInstructionToFieldLeader } from '../../src/logic/notification-and-integration';
import type { DeliverPlacementInstructionToFieldLeaderInput, PlacementInstruction } from '../../src/logic/notification-and-integration';

jest.mock('../../src/services/mail-service');
jest.mock('../../src/services/sms-service');
jest.mock('../../src/services/notification-service');

describe('SCEN-778: 一部のチャネルでのみ配信に失敗した場合成功フラグがtrueで実際に使用されたチャネルと部分配信情報が返される', () => {
  let mockEmailService: jest.Mock;
  let mockSmsService: jest.Mock;
  let mockNotificationService: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const mailService = require('../../src/services/mail-service');
    const smsService = require('../../src/services/sms-service');
    const notificationService = require('../../src/services/notification-service');

    mockEmailService = jest.fn().mockResolvedValue({ success: true, channel: 'EMAIL' });
    mockSmsService = jest.fn().mockRejectedValue(new Error('SMS service unavailable'));
    mockNotificationService = jest.fn().mockResolvedValue({ success: true, channel: 'APP_NOTIFICATION' });

    mailService.send = mockEmailService;
    smsService.send = mockSmsService;
    notificationService.send = mockNotificationService;
  });

  it('should return success=true with partial delivery info when some channels fail', async () => {
    const placementInstructions: PlacementInstruction[] = [
      {
        workerId: 'worker-001',
        workerName: 'Worker One',
        currentDepartmentId: 'dept-001',
        newDepartmentId: 'dept-002',
        newDepartmentName: 'Department Two',
        newJobTitle: 'Senior Role',
        expectedProductivityTarget: 120,
        placementReason: 'Productivity improvement',
        estimatedProductivityImprovement: 15,
      },
    ];

    const input: DeliverPlacementInstructionToFieldLeaderInput = {
      fieldLeaderId: 'leader-001',
      placementInstructions,
      instructionTitle: '配置指示',
      instructionContent: '詳細内容',
      executionStartDate: '2025-01-15T09:00:00Z',
      executionDeadline: '2025-01-15T18:00:00Z',
      priorityLevel: 'HIGH',
      requestedBy: 'admin-001',
      relatedAnalysisId: 'analysis-001',
      deliveryChannels: ['EMAIL', 'SMS', 'APP_NOTIFICATION'],
    };

    const result = await deliverPlacementInstructionToFieldLeader(input);

    expect(result.success).toBe(true);
    expect(result.deliveryChannelsUsed).toEqual(expect.arrayContaining(['EMAIL', 'APP_NOTIFICATION']));
    expect(result.deliveryChannelsUsed).toHaveLength(2);
    expect(result.deliveryChannelsUsed).not.toContain('SMS');
    expect(result.instructionTrackingId).toBeDefined();
    expect(typeof result.instructionTrackingId).toBe('string');
    expect(result.deliveredAt).toBeDefined();
    expect(typeof result.deliveredAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.deliveredAt)).toBe(true);
    expect(result.fieldLeaderContactInfo).toBeDefined();
    expect(typeof result.fieldLeaderContactInfo).toBe('string');
    expect(result.estimatedReceiptTime).toBeDefined();
    expect(typeof result.estimatedReceiptTime).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.estimatedReceiptTime)).toBe(true);
    expect(result.errorMessage).toBeNull();
    expect(result.partialDeliveryInfo).toBeDefined();
    expect(result.partialDeliveryInfo).not.toBeNull();
    expect(result.partialDeliveryInfo?.failedChannels).toHaveLength(1);
    expect(result.partialDeliveryInfo?.failedChannels[0].channel).toBe('SMS');
    expect(result.partialDeliveryInfo?.failedChannels[0].failureReason).toBeDefined();
    expect(typeof result.partialDeliveryInfo?.failedChannels[0].failureReason).toBe('string');
    expect(result.partialDeliveryInfo?.successfulChannels).toEqual(expect.arrayContaining(['EMAIL', 'APP_NOTIFICATION']));
    expect(result.partialDeliveryInfo?.successfulChannels).toHaveLength(2);
  });
});