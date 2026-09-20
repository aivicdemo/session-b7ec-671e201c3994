import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';

describe('SCEN-1184: deliverImprovementInstructionToFacility - InvalidDeliveryChannels Error', () => {
  it('should throw InvalidDeliveryChannels error when deliveryChannels is an empty array', async () => {
    const input = {
      delayRiskJudgmentId: 'judgment-123',
      facilityId: 'facility-456',
      teamId: 'team-789',
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: 'Add personnel to address delay',
          targetWorkInstructionIds: ['work-001'],
          recommendedActionDetails: 'Assign 2 additional workers'
        }
      ],
      deliveryChannels: [],
      priority: 'high' as const,
      requestedByUserId: 'user-111',
      requestedAt: new Date()
    };

    await expect(
      deliverImprovementInstructionToFacility(input)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'InvalidDeliveryChannels',
        message: '配信チャネルが無効です。'
      })
    );
  });

  it('should throw InvalidDeliveryChannels error when deliveryChannels contains invalid values', async () => {
    const input = {
      delayRiskJudgmentId: 'judgment-123',
      facilityId: 'facility-456',
      teamId: 'team-789',
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: 'Add personnel to address delay',
          targetWorkInstructionIds: ['work-001'],
          recommendedActionDetails: 'Assign 2 additional workers'
        }
      ],
      deliveryChannels: ['invalid_channel' as any],
      priority: 'high' as const,
      requestedByUserId: 'user-111',
      requestedAt: new Date()
    };

    await expect(
      deliverImprovementInstructionToFacility(input)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'InvalidDeliveryChannels',
        message: '配信チャネルが無効です。'
      })
    );
  });
});